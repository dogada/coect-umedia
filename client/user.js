'use strict';

var debug = require('debug')('umedia:profile')

var {ui, Store} = require('coect')

class UserStore extends Store {

  load(ctx, done) {
    this.get(ctx.path, done)
  }
}

const store = new UserStore()

exports.detail = ui.showTag('umedia-profile', function(ctx, done) {
  store.load(ctx, (err, data) => done(err, {user: data}))
})
