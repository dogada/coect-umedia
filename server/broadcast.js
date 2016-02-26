var debug = require('debug')('umedia:broadcast')
var tflow = require('tflow')
var request = require('request')

var _ = require('lodash')
var coect = require('coect')
var Entry = require('./models').Entry
var Access = coect.Access
var getEntryAndChannel = require('./entry').getEntryAndChannel

const BROADCAST_SERVICES = ['facebook', 'twitter', 'instagram', 'flickr']
const BRIDGY_ENDPOINT = 'https://brid.gy/publish/webmention'
const BRIDGY_PUBLISH_URL = 'https://brid.gy/publish/'


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
  return Object.assign(channel.meta, entry.meta)
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
    function() {
      var results = []
      for (var target of targets) {
        sendWebmention(BRIDGY_ENDPOINT, source, BRIDGY_PUBLISH_URL + target.name, (error, data) => {
          results.push({service: target.name, error, url: data && data.url})
          if (results.length === targets.length) flow.next(results)
        })
      }
    }
  ], done)
}


exports.broadcast = function(req, res, next) {
  debug('broadcast', req.params)
  var flow = tflow([
    function() {
      getEntryAndChannel(req, flow)
    },
    function(entry, channel) {
      if (entry.access !== Access.EVERYONE) return flow.fail(400, 'Need everyone access.')
      if (!req.security.canUserBroadcast(req.user, entry, channel)) return flow.fail(403, 'Forbidden.')
      var meta = mergeMeta(entry, channel)
      var targets = broadcastTargets(meta)
      if (!targets.length)  return flow.fail(400, 'No broadcast targets')
      var source = req.protocol + '://' + req.hostname + req.coect.urls.entry(entry)
      debug('meta.bridgy', meta.bridgy, source, targets)
      if (coect.bool(meta.bridgy)) bridgyBroadcast(source, targets, flow.join(entry))
      else flow.complete({})
    },
    (entry, results) => {
      var meta = Object.assign({}, entry.meta)
      debug('results', results)
      debug('current meta', meta)
      for (var r of results) {
        if (r.url) meta[serviceUrlName(r.service)] = r.url
      }
      Entry.update(entry.id, {meta}, flow.send({meta, results}))
    }
  ], coect.json.response(res, next))
}
