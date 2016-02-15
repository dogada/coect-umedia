'use strict';

var debug = require('debug')('umedia:profile')
var tflow = require('tflow')

var {ui} = require('coect')
var store = require('./store')

exports.detail = function(ctx) {
  
  var flow = tflow([
    () => ui.getData(ctx, 'data', next => store.user.get(ctx.path, next), flow),
    (data) => ui.renderTags(data, flow)
  ], Site.error)
}
