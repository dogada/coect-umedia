'use strict';

var debug = require('debug')('umedia:store')
var tflow = require('tflow')

var Entity = require('./models').Entity
var Channel = require('./models').Channel

var coect = require('coect')
var Access = coect.Access

const MAX_PAGE_SIZE = 20
const PAGE_SIZE = 10

function pageSize(req) {
  return Math.min(MAX_PAGE_SIZE, PAGE_SIZE || parseInt(req.query.count, 10))
}

class ChannelStore {
  list(req, opts, done) {
    tflow([
      function() {
        var q = Channel.table(opts.owner)
          .select(Channel.listFields)
          .where('model', 'channel')
        if (opts.owner) q = q.where({owner: opts.owner})
        var access = req.security.getUserAccess(req.user)
        // show trashed items by default (use ?all=1 to show them like in ls -a)
        if (!opts.all) access = Math.max(access, Access.TRASH + 1)
        debug('access', access)
        q = q.where('access', '>=', access)
        q = q.limit(pageSize(req))
        q.asCallback(this)
      },
      function(channels) {
        this.next({items: channels})
      }
    ], done)
  }
}

module.exports = {
  channel: new ChannelStore()
}
