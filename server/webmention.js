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

var getMentionParent = function(target, done) {
  var flow = tflow([
    function() {
      if (target instanceof Entity) flow.next(target)
      else if (target.username) Channel.getOrCreateType(target, Channel.MENTIONS, flow)
      else {
        console.error('Invalid webmention target', (typeof target), target, target.constructor)
        flow.fail(500, 'No parent for target ' + ' ' +
                  (target.constructor && target.constructor.name) + ' ' + target.id)
      }
    }
  ], done);
}

var mentionHash = function(parent, sourceUrl) {
  debug('mentionHash', parent.owner, sourceUrl)
  var hash = crypto.createHash('sha256')
  hash.update(sourceUrl)
  return `!${parent.owner}/${hash.digest('hex')}`
}


var saveMention = function(parent, form, done) {
  debug('save', form, parent)
  var url = mentionHash(parent, form.link.webmention.source)
  debug('url', url)
  var flow = tflow([
    () => Entry.findOne({url: url, list: parent.list || parent.id}, flow),
    (entry) => {
      if (entry) flow.complete({id: entry.id, created: entry.created})
      else flow.next()
    },
    () => getMentionsOwner(flow),
    (owner) => {
      Entry.create({
        type: Entry.WEBMENTION,
        access: Access.MODERATION,
        url: url,
        name: form.name,
        text: form.text,
        meta: form.meta,
        link: form.link,
        owner: owner.id
      }, (parent), flow)
    },
    (id) => Entry.get(id, flow),
    (entry) => store.entry.updateChildCount(entry, flow)
  ], done)
}

function webmentionName(parsed) {
  if (parsed.type === 'reply') return coect.util.truncate(parsed.text || parsed.name, Entity.MAX_NAME_LENGTH)
  var target = coect.util.truncateUrl(parsed.target)
  if (parsed.author && parsed.author.name) return `${target} ${parsed.type} by ${parsed.author.name}`
  else return `${target} ${parsed.type}`
}

function html2wpml(html) {
  return striptags(html) 
}


function webmentionText(parsed) {
  if (parsed.type !== 'reply') return ''
  return coect.util.truncate(parsed.text || parsed.name, Entity.MAX_TEXT_LENGTH)
}

var validate = function(parsed, meta, done) {
  Entry.validate({
    name: webmentionName(parsed),
    text: webmentionText(parsed),
    link: {
      webmention: parsed
    }
  }, {schema: Entry.getTypeSchema(Entry.WEBMENTION), meta: meta}, done)
}

function webmentionType(wmType) {
  switch (wmType) {
  case 'in-reply-to': return 'reply'
  case 'like-of': return 'like'
  case 'repost-of': return 'repost'
  case 'bookmark-of': return 'bookmark'
  case 'rsvp': return 'rsvp'
  }
  return 'mention'
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
      var type = wm.activity && wm.activity.type || webmentionType(data['wm-property'])
      var target = wm.target || data.target || data['wm-property'] && data[data['wm-property']]
      var source = data.url || wm.source
  
      if (!type) return flow.fail(400, 'Unknown webmention type')
      if (!source) return flow.fail(400, 'No webmention source')
      if (!target) return flow.fail(400, 'No webmention target')
      var html = (typeof data.content === 'object' ? data.content.value : data.content) || ''
      var parsed = {
        type, source, target,
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
    (parsed, target) => getMentionParent(target, flow.join(parsed)),
    (parsed, parent) => {
      if (!parent) return flow.fail(400, 'Target without parent')
      config.User.get(parent.owner, flow.join(parsed, parent))
    },
    (parsed, parent, recipient) => validate(parsed, Entry.recipientMeta(parent, recipient), flow.join(parent)),
    (parent, doc, form) => saveMention(parent, form, flow)
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
