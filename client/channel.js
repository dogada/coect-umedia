'use strict';

var debug = require('debug')('umedia:channel')
var tflow = require('tflow')
var {ui, Store} = require('coect')

class ChannelStore extends Store {

  permissions(channelId, done) {
    var url = Site.umedia.url.channel(channelId, 'permissions')
    // FIX: move cache logic with timeout to Store
    if (this.cache[url]) return done(null, this.cache[url])
    this.get(url, (err, data) => {
      if (err) return done(err)
      this.cache[url] = data
      done(null, data)
    })
  }
}

const store = new ChannelStore()

function details(ctx) {

  debug('details', ctx)
  var flow = tflow([
    function() {
      ui.getData(ctx, 'channel', next => store.get(ctx.path, next), flow)
    },
    function(channel) {
      Site.mountTag('umedia-channel-details', 
                    {channel: channel, store: store},
                    {title: channel.name})
      if (Site.user) store.permissions(channel.id, (err, permissions) => {
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
