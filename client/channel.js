'use strict';

var debug = require('debug')('umedia:channel')
var tflow = require('tflow')
var {ui} = require('coect')

var store = require('./store')

function details(ctx) {
  debug('details', ctx)
  var flow = tflow([
    () => ui.getData(ctx, 'data', next => store.channel.get(ctx.path, next), flow),
    (data) => ui.renderTags(data, flow.send(data.content.opts.channel)),
    (channel) => Site.user && store.channel.permissions(channel.id, flow),
    (permissions) => Site.get('main').update({permissions})
  ], Site.error)
}

function edit(ctx) {
  debug('channel.edit')
  Site.mount(ui.make('umedia-channel-editor', ctx.params), 'Channel / Editor')
  Site.checkMount('umedia-raw', {}, {target: 'sidebar'})
}

function admin(ctx) {
  Site.mount(ui.make('umedia-channel-admin', ctx.params), 'Channel / Admin')
  Site.checkMount('umedia-raw', {}, {target: 'sidebar'})
}


module.exports = {
  details, edit, admin, store
}
