'use strict';

var debug = require('debug')('umedia:entry')
var tflow = require('tflow')

var {ui} = require('coect')
var store = require('./store')

exports.details = function(ctx) {
  var flow = tflow([
    function() {
      ui.getData(ctx, 'thread', next => store.entry.get(ctx.path, next), flow)
    },
    function(entry) {
      Site.mountTag('umedia-entry-details', 
                    {entry, store},
                    {title: entry.name})
      if (Site.user) store.channel.permissions(entry.list.id, (err, permissions) => {
        debug('permissions', err, permissions, Site.get('main'))
        var main = Site.get('main')
        if (main && main.root) main.update({permissions})
        else console.error('No main in entry_detail.')
      })
      Site.checkMount('umedia-channel-list', {owner: entry.owner.id}, {target: 'sidebar'})
    }
  ])
}

exports.edit = function(ctx) {
  var flow = tflow([
    () => store.entry.get(Site.umedia.url.entry(ctx.params.id), flow),
    (entry) => {
      if (!Site.umedia.canChangeEntry(entry)) return flow.fail('No permissions for editing the entry.')
      Site.mountTag('umedia-entry-editor', {entry: entry}, {title: 'Entry editor'})
    }
  ], (err) => Site.error(err))
}
