'use strict';

var debug = require('debug')('umedia:entry')
var tflow = require('tflow')

var {ui, Store} = require('coect')

class EntryStore extends Store {

  moderate(entry, accept, done) {
    this.post(Site.umedia.url.entry(entry.id, (accept ? 'accept' : 'reject')), done)
  }
}

const store = new EntryStore()
const channelStore = require('./channel').store

exports.details = function(ctx) {
  var flow = tflow([
    function() {
      ui.getData(ctx, 'thread', next => store.get(ctx.path, next), flow)
    },
    function(entry) {
      Site.mountTag('umedia-entry-details', 
                    {entry: entry, store: store},
                    {title: entry.name})
      if (Site.user) channelStore.permissions(entry.list.id, (err, permissions) => {
        debug('permissions', err, permissions, Site.get('main'))
        Site.get('main').update({permissions})
      })
      Site.checkMount('umedia-channel-list', {owner: entry.owner.id}, {target: 'sidebar'})
    }
  ])
}

exports.edit = function(ctx) {
  store.get(Site.umedia.url.entry(ctx.params.id), (err, entry) => {
    if (err) return
    Site.mountTag('umedia-entry-editor', {entry: entry}, {title: 'Entry editor'})
  })
}
