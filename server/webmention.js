var crypto = require('crypto')
var striptags = require('striptags')
var debug = require('debug')('umedia:webmention')
var tflow = require('tflow')
var Url = require('url')
var coect = require('coect')
var config = require('./config')
var Access = coect.Access
var Entry = require('./models/entry')
var Channel = require('./models/channel')
var Entity = require('./models/entity')
var store = require('./store')

var parsers = null

function slug() {
  return '/([a-z]+[a-z0-9-]{2,})'
}

function re(url) {
  return new RegExp('^' + url)
}

function makeParsers() {
  var entry = config.urls.entry
  var user = config.urls.user
  return {
    username: re(user({url: slug('username')})),
    entryId: re(entry('([a-zA-Z1-9]{10,})')),
    entryUrl: re(entry({
      url: slug('username') + slug('cslug') + slug('eslug')
    }))
  }
}

var getMentionsOwner = function (done) {
  var flow = tflow([
    () => {
      config.User.find({orderBy: ['id'], limit: 1, modelize: true}, flow)
    },
    (users) => {
      if (users[0]) flow.next(users[0]) 
      else flow.fail(404, 'No mention owner')
    }
  ], done)
}

/**
   Find entry or channel that will act as parent for webmention.
*/
exports.getTarget = function(targetUrl, done) {
  if (!parsers) parsers = makeParsers()
  var flow = tflow([
    () => {
      var parsed = Url.parse(targetUrl)
      if (parsed.host !== config.host) return flow.fail(400, 'Invalid target host: ' + targetUrl)
      var pathname = parsed.pathname
      debug('getTarget', targetUrl, pathname, parsers.username, parsers.username.exec(pathname))
      var match;
      if ((match = parsers.entryId.exec(pathname))) {
        Entry.findOne(match[1], flow)
      } else if ((match = parsers.entryUrl.exec(pathname))) {
        Entry.findOne({url: match[1] + '/' + match[2] + '/' + match[3]}, flow)
      } else if ((match = parsers.username.exec(pathname))) {
        config.User.findOne({username: match[1]}, flow)
      } else {
        getMentionsOwner(flow)
      }
    },
    (parent) => {
      // store mention in global mentions channel if user was not found
      if (!parent) getMentionsOwner(done)
      else done(null, parent)
    }
  ], done)
}

var getMentionObject = function(target, done) {
  var flow = tflow([
    function() {
      if (target instanceof Entity) flow.next(target)
      else if (target.username) Channel.getOrCreateType(target, Channel.MAIN, flow)
      else {
        console.error('Invalid webmention target', (typeof target), target, target.constructor)
        flow.fail(500, 'No parent for target ' + ' ' +
                  (target.constructor && target.constructor.name) + ' ' + target.id)
      }
    }
  ], done);
}

var saveMention = function(form, done) {
  debug('save', form, form.list, form.parent)
  var flow = tflow([
    () => Entry.findOne({source: form.source, recipient: form.recipient, list: form.list}, flow),
    (entry) => {
      if (entry) flow.complete({id: entry.id, created: entry.created})
      else flow.next()
    },
    () => Entry.create(form, form.parent, flow),
    (id) => Entry.get(id, flow),
    (entry) => store.entry.updateParentCounters(entry, flow)
  ], done)
}

function html2wpml(html) {
  return striptags(html) 
}

function webmentionName(parsed, model, object) {
  if (model === Entity.ENTRY) return coect.util.truncate(parsed.text || parsed.name, Entity.MAX_NAME_LENGTH)
  return coect.util.truncateUrl(parsed.target)
}

function webmentionText(parsed, model) {
  if (model !== Entity.ENTRY) return ''
  return coect.util.truncate(parsed.text || parsed.name, Entity.MAX_TEXT_LENGTH)
}

function webmentionType(wmType, object) {
  switch (wmType) {
  case 'in-reply-to': return (object.thread ? 'reply' : 'comment')
  case 'rsvp': return 'rsvp'
  case 'like-of': return object.type
  case 'bookmark-of': return object.type
  case 'repost-of': return object.type
  }
  return Entity.WEBMENTION
}

function webmentionModel(wmType) {
  switch (wmType) {
  case 'in-reply-to': return Entity.ENTRY
  case 'like-of': return Entity.LIKE
  case 'bookmark-of': return Entity.LIKE
  case 'repost-of': return Entity.REPOST
  }
  return Entity.WEBMENTION
}

function webmentionParent(model, object) {
  // put in parent-child chain only entries with text content
  // incomming webmention reposts notifications aren't shown with comments by default
  if (model === Entity.ENTRY) return object.id
}

function webmentionRef(model, object) {
  // save link to original entry that was liked, reposted
  if (model === Entity.LIKE || model === Entity.REPOST) return object.id
}

function webmentionAccess(model, object) {
  if (model === Entity.LIKE || model === Entity.REPOST) return object.access
  return Access.MODERATION
}

function validate(parsed, object, recipient, done) {
  var model = webmentionModel(parsed.type)
  var type = webmentionType(parsed.type, object)
  var meta = Entry.recipientMeta(object, recipient)
  var list = object.list || object.id // Use recipient.inbox after migration
  Entry.validate({
    owner: null, // find owner by author.url if possible?
    list, model, type,
    parent: webmentionParent(model, object),
    ref: webmentionRef(model, object),
    name: webmentionName(parsed, model, object),
    text: webmentionText(parsed, model),
    recipient: recipient.id,
    source: parsed.source,
    target: parsed.target,
    access: webmentionAccess(model, object),
    link: parsed,
  }, {schema: Entry.getTypeSchema(type), meta: meta}, done)
}

/*
  Return webmention in a standard format with source, target, type
  and optional published, name, author, html, text.
  webhook received data in wm.post, but /api/webmentions uses wm.activity and
  /api/webmentions.jf2 don't have source and target.
  See examples of actual JSON at
  https://webmention.io/dashboard
  http://webmention.io/api/mentions?target=http://indiewebcamp.com
  https://webmention.io/api/mentions.jf2?domain=dogada.org
*/
function parse(wm, done) {
  var flow = tflow([
    () => {
      var data = wm.data || wm.post || wm
      var wmType = data['wm-property']
      var target = wm.target || data.target || wmType && data[wmType]
      var source = data.url || wm.source
      
      if (!wmType) return flow.fail(400, 'No webmention type')
      if (!source) return flow.fail(400, 'No webmention source')
      if (!target) return flow.fail(400, 'No webmention target')
      var html = (typeof data.content === 'object' ? data.content.value : data.content) || ''
      var parsed = {
        type: wmType,
        source, target,
        author: data.author,
        published: data.published,
        name: data.name,
        html: html,
        text: html2wpml(html)
      }
      debug('parse parsed', parsed)
      flow.next(parsed)
    }
  ], done)
  
}

exports.onReceive = function(wm, done) {
  debug('onReceive', wm)
  var flow = tflow([
    () => parse(wm, flow),
    (parsed) => exports.getTarget(parsed.target, flow.join(parsed)),
    (parsed, target) => getMentionObject(target, flow.join(parsed)),
    (parsed, object) => {
      if (!object) return flow.fail(400, 'Target without parent')
      config.User.get(object.owner, flow.join(parsed, object))
    },
    (parsed, object, recipient) => validate(parsed, object, recipient, flow),
    (doc, form) => saveMention(form, flow)
  ], done)
}

// FIX: use task queue and return HTTP/1.1 202 Accepted
exports.webmentionIoHook = function (req, res) {
  var flow = tflow([
    () => {
      if (req.body.secret !== config.webmentionIo.secret) return flow.fail(403, 'Bad secret')
      exports.onReceive(req.body, flow)
    },
    () => flow.next({result: 'OK'})
  ], coect.json.response(res))
}
