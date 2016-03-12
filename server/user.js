'use strict';

var debug = require('debug')('umedia:user')
var tflow = require('tflow')
var coect = require('coect')

var Entity = require('./models/entity')
var store = require('./store')

exports.detail = function(req, res, next) {
  debug('user profile', req.params)
  var flow = tflow([
    () => {
      var p = req.params
      if (p.id) req.coect.User.get(p.id, flow)
      else req.coect.User.get({username: p.username}, flow)
    },
    (user) => store.channel.list(req, {owner: user.id}, flow.join(user)),
    (user, channels) => store.entry.list(req, req.security.getUserAccess(req.user, null, {min: coect.Access.REJECTED}),
                                         {owner: user.id, model: 'entry'}, flow.join(user, channels)),
    (user, channels, entries) => Entity.postprocess(req, entries, flow.join(user, channels)),
    (user, channels, entries) => flow.next({
      content: {tag: 'umedia-profile', opts: {user, entries}}, 
      sidebar: {tag: 'coect-channel-feed', opts: {items: channels}},
      title:  user.name || user.username || '',
      canonicalUrl: req.coect.urls.user(user)
    })
  ], coect.janus(req, res, next))
}
