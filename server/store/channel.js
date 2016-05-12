'use strict';

var debug = require('debug')('umedia:store')
var tflow = require('tflow')

var Channel = require('../models').Channel

var coect = require('coect')
var Access = coect.Access
var Store = require('./store')

class ChannelStore extends Store {

  list(req, opts, done) {
    debug('channel.list', opts)
    var flow = tflow([
      () => {
        var q = Channel.table(opts.owner)
          .select(Channel.listFields)
          .where('model', 'channel')
        if (opts.owner) q = q.where({owner: opts.owner})
        if (opts.type) {
          if (opts.type !== Channel.CATEGORY && (!req.user || !req.user.isAdmin())) return flow.fail(400, 'Admin required')
          q = q.where({type: opts.type})
        }
        var access = req.security.getUserAccess(req.user)
        // show trashed items by default (use ?all=1 to show them like in ls -a)
        if (!opts.all) access = Math.max(access, Access.TRASH + 1)
        debug('access', access)
        q = q.where('access', '>=', access)
        q = q.limit(this.pageSize(opts))
        q.asCallback(flow)
      }
    ], done)
  }

  withAccess(req, opts, done) {
    var flow = tflow([
      () => {
        if (opts.id || opts.list) flow.next({id: opts.id || opts.list})
        else if (opts.url) flow.next({url: opts.url})
        else if (opts.username && opts.cslug) flow.next({url: opts.username + '/' + opts.cslug})
        else flow.fail('Invalid channel query ' + opts)
      },
      (query) => Channel.get(query, {select: Channel.detailFields.concat(['data'])}, flow),
      (channel) => {
        if (!req.security.canUserViewChannel(req.user, channel)) return flow.fail(403, 'Access to the channel is forbidden')
        // clear data that is need only for security check
        var access = req.security.getUserAccess(req.user, channel, req.query)
        channel.data = undefined
        flow.next(channel, access)
      }
    ], done)
  }

}

module.exports = ChannelStore
