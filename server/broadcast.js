var debug = require('debug')('umedia:broadcast')
var tflow = require('tflow')
var request = require('request')

var _ = require('lodash')
var coect = require('coect')
var Entry = require('./models').Entry
var Access = coect.Access
var misc = require('./misc')
var config = require('./config')

const BROADCAST_SERVICES = ['facebook', 'twitter', 'instagram', 'flickr']
const BRIDGY_ENDPOINT = 'https://brid.gy/publish/webmention'
const BRIDGY_PUBLISH_URL = 'https://brid.gy/publish/'

const TELEGRAPH_ENDPOINT = 'https://telegraph.p3k.io/webmention'

function serviceUrlName(service) {
  return service + '_url'
}

function broadcastTargets(meta) {
  var targets = []
  for (var service of BROADCAST_SERVICES) {
    if (coect.bool(meta[service]) && !meta[serviceUrlName(service) + '_link']) targets.push({
      name: service, 
      value: meta[service]
    })
  }
  return targets
}

function mergeMeta(entry, channel) {
  return Object.assign(channel.meta || {}, entry.meta || {})
}

function sendWebmention(endpoint, source, target, done) {
  debug('sendWebmention', endpoint, source, target)
  var flow = tflow([
    () => request.post(endpoint, {
      json: true,
      form: {
      source: source,
      target: target},
    }, flow),
    (response, body) => {
      debug('response', response.statusCode, 'body', body, body.error, typeof body)
      if (response.statusCode !== 201) return done(
        body && body.error || response.statusCode + ' error with ' + target)
      flow.next(body)
    }
  ], done)
}

function bridgyBroadcast(source, targets, done) {
  debug('bridgyBroadcast', source, targets)
  var flow = tflow([
    () => {
      var results = []
      for (var target of targets) {
        sendWebmention(BRIDGY_ENDPOINT, source, BRIDGY_PUBLISH_URL + target.name, (error, data) => {
          results.push({service: target.name, error, url: data && data.url})
          if (results.length === targets.length) flow.next(results)
        })
      }
    },
    (results) => {
      debug('results', results)
      var meta = {}
      for (var r of results) {
        if (r.url) meta[serviceUrlName(r.service)] = r.url
      }
      flow.next(meta)
    }
  ], done)
}

function sourceUrl(req, entry) {
  return 'https://dogada.org' + req.coect.urls.entry(entry)
  //return req.protocol + '://' + req.hostname + req.coect.urls.entry(entry)
}

function telegraph(source, target, done) {
  debug('telegraph', source, target)
  var flow = tflow([
    () => request.post(TELEGRAPH_ENDPOINT, {
      json: true,
      form: {
        token: config.telegraph.token,
        source: source,
        target: target},
    }, flow),
    (response, body) => {
      debug('response', response.statusCode, 'body', body)
      if (response.statusCode === 201) flow.next({telegraph_url: body.location})
      else flow.fail(400, 'telegraph error: ' + (body.error_description || body.error))
    }
  ], done)
}


exports.broadcast = function(req, res, next) {
  debug('broadcast', req.params)
  var flow = tflow([
    function() {
      misc.getEntryAndChannel(req, flow)
    },
    function(entry, channel) {
      if (entry.access !== Access.EVERYONE) return flow.fail(400, 'Need everyone access.')
      if (!req.security.canUserBroadcast(req.user, entry, channel)) return flow.fail(403, 'Forbidden.')
      var meta = mergeMeta(entry, channel)
      var targets = broadcastTargets(meta)
      if (!targets.length)  return flow.fail(400, 'No broadcast targets')
      var source = sourceUrl(req, entry)
      debug('meta.bridgy', meta.bridgy, source, targets)
      if (coect.bool(meta.bridgy)) bridgyBroadcast(source, targets, flow.join(entry, meta))
      else flow.next(entry, meta, {})
    },
    (entry, mergedMeta, bridgyMeta) => {
      var target = entry.target || entry.link && entry.link.webmention && entry.link.webmention.target || entry.meta.reply_to
      if (coect.bool(mergedMeta.telegraph) && target) telegraph(sourceUrl(req, entry), target, flow.join(entry, bridgyMeta))
      else flow.next(entry, bridgyMeta, {})
    },
    (entry, bridgyMeta, wmMeta) => {
      var meta = Object.assign({}, entry.meta, bridgyMeta, wmMeta)
      debug('meta', entry.meta, bridgyMeta, wmMeta)
      Entry.update(entry.id, {meta}, flow.send({meta}))
    }
  ], coect.json.response(res, next))
}
