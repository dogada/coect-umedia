'use strict';

var debug = require('debug')('umedia:user')
var tflow = require('tflow')
var coect = require('coect')

var store = require('./store')
var riot = require('riot')

exports.detail = function(req, res, next) {
  debug('user profile', req.params)
  var flow = tflow([
    () => {
      var p = req.params
      if (p.id) req.coect.User.get(p.id, flow)
      else req.coect.User.get({username: p.username}, flow)
    },
    (user) => store.channel.list(req, {owner: user.id}, flow.join(user)),
    (user, channels) => flow.next({user, channels})
  ], coect.janus(req, res, next, function(data) {
    res.render('index', {
      title:  data.user.name || data.user.username || '',
      canonicalUrl: data.user.url,
      content: riot.render('umedia-profile', data),
      sidebar: riot.render('umedia-channel-list', data.channels)
    })
  }))
}
