'use strict';

var debug = require('debug')('umedia:channel')
var tflow = require('tflow')
var coect = require('coect')
var _ = require('lodash')

var Entity = require('./models').Entity
var Channel = require('./models').Channel

const MAX_PAGE_SIZE = 20
const PAGE_SIZE = 10


function retrieve(req, res, next) {
  debug('retrieve xhr=', req.xhr, req.params)
  tflow([
    function() {
      var p = req.params
      if (p.id) Channel.get(p.id, this)
      else Channel.findOne({url: p.username + '/' + p.cslug}, this)
    },
    function(channel) {
      Entity.fillUsers([channel], req.app.userCache, this.send(channel))
    },
    function(channel) {
      if(!req.security.canUserViewChannel(req.user, channel)) return this.fail(403, 'Access to the channel is forbidden')
      this.next(channel)
    },
  ], req.app.janus(req, res, next))
}

function create(req, res) {
  debug('create', req.body)
  var owner = req.user
  tflow([
    function() {
      Channel.validate(req.body, {}, this)
    },
    function(doc, data) {
      Channel.create({
        model: Channel.MODEL,
        type: Channel.TYPE,
        name: data.name,
        text: data.text,
        url: Channel.makeUrl(req.user.username, data.slug),
        owner: owner.id,
        access: Channel.VISITOR,
        data: {slug: data.slug}
      }, owner.id, this)
    },
    function(id) {
      Channel.get(id, this)
    },
  ], coect.json.response(res))
}

function update(req, res) {
  debug('update', req.body)
  tflow([
    function() {
      Channel.get(req.params.id, this)
    },
    function(channel) {
      debug('Updating', channel)
      if (channel.owner !== req.user.id) this.fail(403, 'Owner required')
      else Channel.validate(req.body, {}, this.join(channel))
    },
    function(channel, doc, data) {
      //FIX: use actual channel user
      var update = _.pick(data, 'name', 'text')
      if (!channel.url) update.url = Channel.makeUrl(req.user.username, data.slug)
      Channel.update(channel.id, update, this)
    },
    function(id) {
      Channel.get(id, this)
    },
  ], coect.json.response(res))
}

function remove(req, res) {
  debug('remove params', req.params, req.oid)
  tflow([
    function() {
      Channel.get(req.params.id, this)
    },
    function(channel) {
      if (channel.owner !== req.user.id) return this.fail(403, 'Owner required')
      else return this.next(channel)
    },
    function(channel) {
      Channel.remove(channel.id, this)
    },
  ], coect.json.response(res))
}


function pageSize(req) {
  return Math.min(MAX_PAGE_SIZE, PAGE_SIZE || parseInt(req.query.count, 10))
}

function list(req, res) {
  debug('list', req.query)
  tflow([
    function() {
      var q = Channel.table(req.query.owner)
        .select(Channel.listFields)
        .where('type', 'channel')
      if (req.query.owner) q = q.where({owner: req.query.owner})
      var access = req.security.getUserAccess(req.user)
      debug('access', access)
      q = q.where('access', '>=', access)
      q = q.limit(pageSize(req))
      q.asCallback(this)
    },
    function(channels) {
      this.next({items: channels})
    }
  ], coect.json.response(res))
}


module.exports = {
  create: create,
  retrieve: retrieve,
  update: update,
  remove: remove,
  list: list
}
