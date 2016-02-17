'use strict';

var debug = require('debug')('umedia:store')
var tflow = require('tflow')

var Entity = require('./models').Entity
var Channel = require('./models').Channel
var Entry = require('./models').Entry

var coect = require('coect')
var Access = coect.Access

const MAX_PAGE_SIZE = 20
const PAGE_SIZE = 10

function pageSize(opts) {
  return Math.min(MAX_PAGE_SIZE, PAGE_SIZE || parseInt(opts.count, 10))
}

class Store {
}


/**
   Show entries allowed for user, created by himself or wrote to her.
*/
function filterByAccess(q, user, access) {
  if (!user) return q.where('access', '>=', access)
  return q.whereRaw('\("access\" >= ? OR (\"access\" > ? AND (\"owner\" = ? OR \"recipient\" = ?)))',
                    [access, Access.ADMIN, user.id, user.id])
}

function listOrder(order) {
  if (order === 'top') return ['rating', 'desc']
  else if (order === 'first') return ['id', 'asc']
  else return ['id', 'desc']
}

function firstItem(obj, keys) {
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i]
    if (obj[key]) {
      var res = {}
      res[key] = obj[key]
      return res
    }
  }
  return {}
}

function listWhere(opts, done) {
  var flow = tflow([
    function() {
      //list_url
      var where = firstItem(opts, ['topic', 'thread', 'list', 'owner'])
      // FIX: switch to timeline
      if (!Object.keys(where).length && !opts.tag) return flow.fail(400, 'An entry filter is required.')
      
      // show top-level entries (posts) only
      if ((where.owner || where.list) && !opts.tag) where.topic = null

      this.next(where, opts.tag)
    }
  ], done)
}

class EntryStore extends Store {

  list(user, access, opts, done) {
    debug('ES.list', access, opts)
    var flow = tflow([
      () => listWhere(opts, flow),
      function(where, tag) {
        debug(`list where=${where} access=${access}`)

        var q = Entry.table(where.list)
        q = q.select(Entry.listFields)
        q = q.where(where)
        if (tag) q = q.andWhere('tags', '@>', JSON.stringify([tag]))
        // if user isn't a root in a channel filter by access
        if (access > Access.ROOT) q = filterByAccess(q, user, access)
        if (opts.cursor) {
          if (opts.order === 'first') q = q.andWhere('id', '>', opts.cursor)
          else if (opts.order === 'last') q = q.andWhere('id', '<', opts.cursor)
        }
        q = q.orderBy.apply(q, listOrder(opts.order))
        if (opts.offset) q = q.offset(parseInt(opts.offset, 10))
        q = q.limit(Math.min(MAX_PAGE_SIZE, parseInt(opts.count, 10)))
        debug('list SQL', q.toString().slice(-130))
        q.asCallback(flow)
      }
    ], done)
  }
}

class ChannelStore extends Store {
  list(req, opts, done) {
    debug('channel.list', opts)
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
        q = q.limit(pageSize(req.query))
        q.asCallback(this)
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

module.exports = {
  channel: new ChannelStore(),
  entry: new EntryStore()
}
