'use strict';

var debug = require('debug')('umedia:channel')
var tflow = require('tflow')
var coect = require('coect')
var _ = require('lodash')

var store = require('./store')
var Entity = require('./models').Entity
var Channel = require('./models').Channel

var Access = coect.Access

var riot = require('riot')

function detail(req, res, done) {
  debug('detail xhr=', req.xhr, req.params)
  var flow = tflow([
    () => store.channel.withAccess(req, req.params, flow),
    (channel, access) => store.entry.list(req.user, access, {list: channel.id}, flow.join(channel)),
    (channel, entries) => store.channel.list(req, {owner: channel.owner}, flow.join(channel, entries)),
    (channel, entries, channels) => Entity.fillUsers([channel].concat(entries).concat(channels),
                                                     req.app.userCache, flow.send(channel, entries, channels)),
    (channel, entries, channels) => flow.next({
      content: {tag: 'umedia-channel-details', opts: {channel, entries}},
      sidebar: {tag: 'coect-channel-feed', opts: {items: channels}},
      title:  channel.name,
      canonicalUrl: channel.url
    })
  ], coect.janus(req, res, done))
}

function validate(req, channel, done) {
  var flow = tflow([
    function() {
      Channel.validate(req.body, {}, flow)
    },
    function(doc, data) {
      var userAccess = (channel ? 
                        req.security.getUserAccess(req.user, channel) :
                        req.security.getUserAccess(req.user))
      var defaultAccess = req.security.getDefaultChannelAccess()
      Channel.applyAccess(data, userAccess, Access.EVERYONE, defaultAccess, flow.join(doc))
    }
  ], done);
}

function create(req, res) {
  debug('create', req.body)
  var userAccess = req.security.getUserAccess(req.user)
  var owner = req.user
  var flow = tflow([
    function() {
      if (userAccess > Access.ADMIN) return this.fail(403, 'Admin or root are required.')
      validate(req, null, this)
    },
    function(doc, data) {
      debug('create data=', data)
      Channel.create({
        model: Channel.MODEL,
        type: Channel.TYPE,
        name: data.name,
        text: data.text,
        url: Channel.makeUrl(req.user.username, data.slug),
        owner: owner.id,
        access: data.access,
        data: Object.assign({}, {access: data.accessData})
      }, owner.id, this)
    },
    function(id) {
      Channel.get(id, this)
    },
  ], coect.json.response(res))
}

function update(req, res) {
  debug('update', req.body)
  var flow = tflow([
    function() {
      Channel.get(req.params.id, {select: '*'}, this)
    },
    function(channel) {
      debug('Updating', channel)
      if (channel.owner !== req.user.id) this.fail(403, 'Owner required')
      validate(req, channel, this.join(channel))
    },
    function(channel, doc, data) {
      //FIX: use actual channel user
      debug()
      var update = _.pick(data, 'name', 'text', 'access')
      if (!channel.url) update.url = Channel.makeUrl(req.user.username, data.slug)
      update.data = Object.assign(channel.data, {access: data.accessData})
      debug('update', update)
      Channel.update(channel.id, _.omit(update, _.isUndefined), this)
    },
    function(id) {
      Channel.get(id, this)
    },
  ], coect.json.response(res))
}

function trash(req, res) {
  debug('remove params', req.params)
  tflow([
    function() {
      Channel.get(req.params.id, this)
    },
    function(channel) {
      if (channel.owner !== req.user.id) return this.fail(403, 'Owner required')
      else return this.next(channel)
    },
    function(channel) {
      Channel.update(channel.id, {access: Access.TRASH}, this)
    },
  ], coect.json.response(res))
}



function list(req, res) {
  debug('list', req.query)
  var flow = tflow([
    () => store.channel.list(req, req.query, flow),
    (channels) => flow.next({items: channels})
  ], coect.json.response(res))
}

function permissions(req, res) {
  tflow([
    function() {
      Channel.get(req.params.id, {select: '*'}, this)
    },
    function(channel) {
      debug('permissions', channel)
      if (!req.security.canUserViewChannel(req.user, channel)) return this.fail(403, 'Can\'t view')
      this.next({
        post: req.security.canCreateEntry(req.user, {type: channel.type}, channel),
        comment: req.security.canCreateEntry(req.user, {type: 'post'}, channel),
        access: Access.valueName(req.security.getUserAccess(req.user, channel))
      })
    }
  ], coect.json.response(res))
}

module.exports = {
  create,
  detail,
  update,
  trash,
  list,
  permissions
}
