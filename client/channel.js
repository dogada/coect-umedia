'use strict';

var debug = require('debug')('umedia:channel')
var ui = require('coect').ui

function details(ctx) {
  debug('details', ctx)
  Site.mount(ui.make('umedia-channel-details', ctx.params))
  Site.checkMount('umedia-raw', {}, {target: 'sidebar'})
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
  details: details,
  edit: edit,
  admin: admin
}
