'use strict';

var debug = require('debug')('umedia:profile')

var {ui, Store} = require('coect')

class UserStore extends Store {

  load(ctx, done) {
    this.get(ctx.path, done)
  }
}

const store = new UserStore()

exports.detail = function(ctx) {
  ui.mount(ctx, 'umedia-profile', {
    load: function(ctx, done) {
      store.load(ctx, (err, data) => done(err, {user: data}))
    }
  })

  ui.mount(ctx, 'umedia-channel-list', {
    target: 'sidebar',
    data: {owner: Site.user.id}
  })

}
