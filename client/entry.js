'use strict';

var debug = require('debug')('umedia:entry')
var tflow = require('tflow')

var {ui, Store} = require('coect')

class EntryStore extends Store {

}

const store = new EntryStore()

exports.details = function(ctx) {
  var flow = tflow([
    function() {
      ui.getData(ctx, 'thread', next => store.get(ctx.path, next), flow)
    },
    function(entry) {
      Site.mountTag('umedia-entry-details', 
                    {thread: [], entry: entry},
                    {title: entry.name})
      Site.checkMount('umedia-channel-list', {owner: entry.owner.id}, {target: 'sidebar'})
    }
  ])
}

exports.edit = function(ctx) {
  Site.mount(ui.make('umedia-entry-editor', ctx.params), 'Entry editor')
}
