'use strict';

var debug = require('debug')('umedia:profile')
var tflow = require('tflow')

var {ui, Store} = require('coect')

class UserStore extends Store {

  ownChannels(user, done) {
    this.get(Site.umedia.url.channel(), {owner: user.id}, done)
  }
}

const store = new UserStore()

exports.detail = function(ctx) {
  
  var flow = tflow([
    function() {
      ui.getData(ctx, 'user', next => store.get(ctx.path, next), flow)
    },
    function(user) {
      Site.mountTag('umedia-profile', {user: user}, {title: user.name})
      ui.getData(ctx, 'channels', next => store.ownChannels(user, next), flow)
    },
    function(data) {
      Site.mountTag('umedia-channel-list', data, {target: 'sidebar'})
    },
  ], Site.error)
}
