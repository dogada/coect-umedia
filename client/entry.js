'use strict';

var debug = require('debug')('umedia:entry')
var tflow = require('tflow')

var coect = require('coect')
var store = require('./store')

exports.details = function(ctx) {
  var flow = tflow([
    function() {
      coect.ui.getData(ctx, 'thread', next => store.entry.get(ctx.path, next), flow)
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
      Site.checkMount('coect-channel-feed', {owner: entry.owner.id}, {target: 'sidebar'})
    }
  ])
}

exports.edit = function(ctx) {
  var flow = tflow([
    () => store.entry.get(Site.umedia.url.entry(ctx.params.id, 'data'), flow),
    (entry) => {
      if (!Site.umedia.canChangeEntry(entry)) return flow.fail('No permissions for editing the entry.')
      Site.mountTag('umedia-entry-editor', {entry: entry}, {title: 'Entry editor'})
    }
  ], (err) => Site.error(err))
}



function bookmarklet(handler) {
  return `javascript: void function (){
var w=window, d=document, enc=encodeURIComponent, l=d.location,
sel=(w||d).getSelection || function(){return d.selection.createRange().text },
u='${handler}/e/new?url='+enc(l.href)+'&text='+enc(sel() || d.title);
w.open(u) || (l.href=u)
}()`
}

exports.editor = function(ctx) {
  if (!Site.user) return Site.account.loginRequired()

  var bmName = location.host, bmUrl = bookmarklet(
    location.protocol + '//' + location.host)

  var query = coect.routes.parseQuery(ctx.querystring) 
  var flow = tflow([
    () => store.channel.get(Site.umedia.url.channel(), {owner: Site.user.id}, flow),
    (data) => {
      debug('editor', ctx)
      Site.mountTag('umedia-entry-editor', 
                    {query, bmName,  bmUrl, channels: data.items}, 
                    {title: 'Entry editor'})
    }
  ], (err) => Site.error(err))
}
