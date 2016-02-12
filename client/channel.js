'use strict';

var debug = require('debug')('umedia:channel')
var tflow = require('tflow')
var {ui} = require('coect')

var store = require('./store')

function details(ctx) {

  debug('details', ctx)
  var flow = tflow([
    function() {
      ui.getData(ctx, 'channel', next => store.channel.get(ctx.path, next), flow)
    },
    function(channel) {
      Site.mountTag('umedia-channel-details', 
                    {channel, store},
                    {title: channel.name})
      if (Site.user) store.channel.permissions(channel.id, (err, permissions) => {
        debug('permissions', err, permissions, Site.get('main'))
        Site.get('main').update({permissions})
      })
      Site.checkMount('umedia-channel-list', {owner: channel.owner.id}, {target: 'sidebar'})
    }
  ])
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
