'use strict';

var debug = require('debug')('umedia:channel')
var ui = require('coect').ui

function details(ctx) {
  debug('details', ctx)
  Site.mount(ui.make('umedia-channel-details', ctx.params))
}

function edit(ctx) {
  debug('channel.edit')
  Site.mount(ui.make('umedia-channel-editor', ctx.params), 'Channel / Editor')
}

function admin(ctx) {
  Site.mount(ui.make('umedia-channel-admin', ctx.params), 'Channel / Admin')
}


module.exports = {
  details: details,
  edit: edit,
  admin: admin
}