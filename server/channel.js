'use strict';

var debug = require('debug')('umedia:channel')
var tflow = require('tflow')
var coect = require('coect')
var _ = require('lodash')
var wpml = require('wpml')
var Channel = require('./models').Channel

const MAX_PAGE_SIZE = 10


function retrieve(req, res, next) {
  debug('retrieve xhr=', req.xhr, req.params)
  tflow([
    function() {
      var p = req.params
      if (p.id) Channel.get(p.id, this)
      else Channel.findOne({url: p.username + '/' + p.cslug}, this)
    }
  ], req.app.janus(req, res, next))
}

function parseMeta(text, done) {
  tflow([
    function() {
      this.next(wpml.meta(text))
    },
    function(meta) {
      meta = _.pick(meta, 'slug', 'name')
      Channel.validate(meta, Channel.inputs, this.send(meta))
    },
  ], done);
}

function create(req, res) {
  debug('create', req.body)
  if (coect.json.invalid(req, res, Channel.inputs)) return
  var data = req.body, owner = req.user
  tflow([
    function() {
      parseMeta(data.text || '', this)
    },
    function(meta) {
      Channel.create({
        model: Channel.MODEL,
        type: Channel.TYPE,
        name: data.name || meta.name || Channel.parseName(data.text),
        text: data.text,
        url: Channel.makeUrl(req.user, meta.slug),
        owner: owner.id,
        access: Channel.VISITOR
      }, owner.id, this)
    },
    function(id) {
      Channel.get(id, this)
    },
  ], coect.json.response(res))
}

function update(req, res) {
  debug('update', req.body)
  if (coect.json.invalid(req, res, Channel.inputs)) return
  var data = _.pick(req.body, 'name', 'text')
  tflow([
    function() {
      if (!_.size(data)) return this.fail('No data')
      Channel.get(req.params.id, this)
    },
    function(channel) {
      if (channel.owner !== req.user.id) this.fail(403, 'Owner required')
      else parseMeta(data.text || '', this.join(channel))
    },
    function(channel, meta) {
      //FIX: use actual channel user
      if (!channel.url) data.url = Channel.makeUrl(req.user, meta.slug)
      Channel.update(channel.id, data, this)
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

function list(req, res) {
  var where = {visible: true}

  debug('list', where)
  tflow([
    function() {
      var q = Channel.table(req.query.owner).select(Channel.listFields)
      if (req.query.owner) q.where('owner', req.query.owner)
      var access = req.security.getUserAccess(req.user)
      q = q.where('access', '>', access)
      q = q.limit(Math.min(MAX_PAGE_SIZE, parseInt(req.query.count, 10)))
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
