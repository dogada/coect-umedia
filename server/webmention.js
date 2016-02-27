var crypto = require('crypto')
var debug = require('debug')('umedia:webmention')
var tflow = require('tflow')
var Url = require('url')
var coect = require('coect')
var config = require('./config')
var Access = coect.Access
var Entry = require('./models/entry')
var Channel = require('./models/channel')
var Entity = require('./models/entity')


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
      else if (target.username) Channel.getOrCreateMentions(target, flow)
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
  var url = mentionHash(parent, form.link.webmention.url)
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
        link: form.link,
        owner: owner.id
      }, (parent), flow)
    },
    (id) => Entry.get(id, flow)
  ], done)
}

function webmentionType(post) {
  if (post['like-of']) return 'like'
  else if (post['in-reply-to']) return 'reply'
  else if (post['repost-of']) return 'repost'
  else if (post['bookmark-of']) return 'bookmark'
  else if (post.rsvp) return 'rsvp'
  else return 'link'
}

function webmentionName(type, data) {
  if (data.author && data.author.name) return `webmention ${type} by ${data.author.name}`
  else return `webmention ${type}`
}

function webmentionText(type, data) {
  return (type === 'reply' && data.name || '')
}

var validate = function(wm, done) {
  // webhook received data in wm.post, but webmention API uses wm.activity 
  // see examples of actual JSON at
  // https://webmention.io/dashboard and
  // http://webmention.io/api/mentions?target=http://indiewebcamp.com
  // only id, source and target are mandatory, rest of fields are optional
  var type = wm.activity && wm.activity.type || webmentionType(wm.post)
  var data = wm.data || wm.post
  debug('validate type', type, data)
  Entry.validate({
    name: webmentionName(type, data),
    text: webmentionText(type, data),
    link: {
      webmention: {
        id: wm.id, // undefined for web hook's data
        type: type,
        url: data.url,
        source: wm.source,
        target: wm.target,
        verified: wm.verified_date, // undefined for web hook's data
        published: data.published,
        author: data.author
      }
    }
  }, {schema: Entry.getTypeSchema(Entry.WEBMENTION)}, done)
}

exports.onReceive = function(wm, done) {
  debug('onReceive', wm)
  var flow = tflow([
    () => exports.getTarget(wm.target, flow),
    (target) => getMentionParent(target, flow),
    (parent) => {
      if (!parent) return flow.fail(400, 'Target without parent ' + wm.target)
      validate(wm, flow.join(parent))
    },
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
