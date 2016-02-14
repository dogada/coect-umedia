'use strict';

var debug = require('debug')('umedia:profile')
var tflow = require('tflow')

var {ui} = require('coect')
var store = require('./store')

exports.detail = function(ctx) {
  
  var flow = tflow([
    function() {
      ui.getData(ctx, 'user', next => store.user.get(ctx.path, next), flow)
    },
    function(user) {
      Site.mountTag('umedia-profile', {user: user}, {title: user.name})
      ui.getData(ctx, 'channels', next => store.user.ownChannels(user, next), flow)
    },
    function(data) {
      Site.mountTag('umedia-channel-list', data, {target: 'sidebar'})
    },
  ], Site.error)
}
