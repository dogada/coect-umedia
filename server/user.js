'use strict';

var debug = require('debug')('umedia:user')
var tflow = require('tflow')
var coect = require('coect')

var riot = require('riot')
var profileTag = require('../client/tags/profile.tag')
require('../client/tags/wpml.tag')

exports.retrieve = function(req, res, next) {
  debug('user profile', req.params)
  var flow = tflow([
    function() {
      var p = req.params
      if (p.id) req.env.User.get(p.id, flow)
      else req.env.User.get({username: p.username}, flow)
    }
  ], coect.janus(req, res, next, function(user) {
    var content = riot.render(profileTag, {user: user})
    res.render('index', {
      title:  user.name || user.username || '',
      canonicalUrl: user.url,
      content: content
    })
    
  }))
}
