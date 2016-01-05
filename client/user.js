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

function mountTag(tag, data, target) {
  var d = {}
  d[target || 'main'] = {tag: tag, data: data}
  Site.mount(d, data.name)
}

exports.detail = function(ctx) {
  
  var flow = tflow([
    function() {
      ui.getData(ctx, 'user', next => store.get(ctx.path, next), flow)
    },
    function(user) {
      mountTag('umedia-profile', {user: user})
      ui.getData(ctx, 'channels', next => store.ownChannels(user, next), flow)
    },
    function(data) {
      mountTag('umedia-channel-list', data, 'sidebar')
    },
  ])
}
