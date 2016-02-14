'use strict';

var debug = require('debug')('umedia:profile')
var tflow = require('tflow')

var {ui} = require('coect')
var store = require('./store')

exports.detail = function(ctx) {
  
  var flow = tflow([
    function() {
      ui.getData(ctx, 'data', next => store.user.get(ctx.path, next), flow)
    },
    function(data) {
      Site.mountTag('umedia-profile', data, {title: data.user.name})
      Site.mountTag('umedia-channel-list', data.channels, {target: 'sidebar'})
    }
  ], Site.error)
}
