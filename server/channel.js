'use strict';

var debug = require('debug')('umedia:channel')
var tflow = require('tflow')
var coect = require('coect')
var _ = require('lodash')
var wpml = require('wpml')

var CHANNEL_LIST = 'channels'
var OWNER = 'dvd@dogada.org'

var Channel = require('./models').Channel

function retrieve(req, res, next) {
  debug('retrieve xhr=', req.xhr, req.params)
  tflow([
    function() {
      var p = req.params
      if (p.id) Channel.findById(p.id, this)
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
      meta = _.pick(meta, 'slug')
      Channel.validate(meta, Channel.inputs, this.send(meta))
    },
  ], done);
}

function create(req, res) {
  debug('create', req.body)
  if (coect.json.invalid(req, res, Channel.inputs)) return
  var data = req.body, ownerId = req.user.id
  tflow([
    function() {
      parseMeta(data.text || '', this)
    },
    function(meta) {
      Channel.create({
        name: data.name,
        text: data.text,
        slug: meta.slug,
        url: Channel.makeUrl(req.user, meta.slug),
        owner_id: ownerId,
        visible: true
      }, ownerId, this)
    },
    function(id) {
      this.next({id: id})
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
      Channel.findById(req.params.id, this)
    },
    function(channel) {
      if (channel.owner_id !== req.user.id) this.fail(403, 'Owner required')
      else parseMeta(data.text || '', this.join(channel))
    },
    function(channel, meta) {
      if (meta.slug) data.slug = meta.slug
      //FIX: use actual channel user
      if (!channel.url) data.url = Channel.makeUrl(req.user, meta.slug)
      Channel.update(channel.id, data, this)
    },
    function(id) {
      this.next({id: id})
    },
  ], coect.json.response(res))
}

function remove(req, res) {
  debug('remove params', req.params, req.oid)
  tflow([
    function() {
      Channel.findById(req.params.id, this)
    },
    function(channel) {
      if (channel.owner_id !== req.user.id) return this.fail(403, 'Owner required')
      else return this.next(channel)
    },
    function(channel) {
      Channel.remove(channel.id, this)
    },
  ], coect.json.response(res))
}

function list(req, res) {
  var where = {visible: true}
  if (req.query.owner) where.owner_id = req.query.owner
  debug('list', where)
  tflow([
    function() {
      Channel.find({
        where: where,
        modelize: false
      }, this)
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
