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
  return Math.min(MAX_PAGE_SIZE, parseInt(opts.count, 10) || PAGE_SIZE)
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
      var where = firstItem(opts, ['parent', 'topic', 'thread', 'list', 'owner', 'type'])
      // FIX: switch to timeline
      if (!Object.keys(where).length && !opts.tag) return flow.fail(400, 'An entry filter is required.')
      
      // show top-level entries (posts) only
      if ((where.owner || where.list) && !opts.tag && !opts.model && !opts.my) where.topic = null
      if (opts.model) where.model = opts.model
      this.next(where, opts.tag)
    }
  ], done)
}

class EntryStore extends Store {

  list(user, access, opts, done) {
    debug('ES.list access=', access, opts)
    var flow = tflow([
      () => listWhere(opts, flow),
      function(where, tag) {
        debug(`list where=${where} access=${access}`)

        var q = Entry.table(where.list)
        q = q.select(Entry.listFields)
        q = q.where(where)
        if (tag) q = q.andWhere('tags', '@>', JSON.stringify([tag]))
        if (where.model) q = q.andWhere('type', '<>', 'webmention')
        // if user isn't a root in a channel filter by access
        if (access > Access.ROOT) q = filterByAccess(q, user, access)
        if (opts.cursor) {
          if (opts.order === 'first') q = q.andWhere('id', '>', opts.cursor)
          else if (opts.order === 'last') q = q.andWhere('id', '<', opts.cursor)
        }
        q = q.orderBy.apply(q, listOrder(opts.order))
        if (opts.offset) q = q.offset(parseInt(opts.offset, 10))
        q = q.limit(pageSize(opts))
        debug('list SQL', q.toString().slice(-130))
        q.asCallback(flow)
      }
    ], done)
  }

  updateCounters(entry, done) {
    var t = () => Entry.table(entry.id)
    debug('updateCounters', entry.access, entry)
    var flow = tflow([
      () => {
        t().update({
          rating: t().count('*').where('parent', entry.parent)
        }).where('id', entry.parent).asCallback(flow)
      },
      () => {
        if (entry.parent === entry.topic || entry.parent === entry.thread) return flow.next() 
        t().update({
          child_count: t().count('*').where('parent', entry.parent).andWhere('access', '>', Access.MODERATION),
        }).where('id', entry.parent).asCallback(flow)
      },
      () => {
        if (!entry.topic) return flow.next() 
        var q = t().update({
          child_count: t().count('*').where('topic', entry.topic).andWhere('access', '>', Access.MODERATION),
        }).where('id', entry.topic).asCallback(flow)
      },
      () => {
        if (!entry.thread || entry.thread === entry.topic) return flow.next() 
        var q = t().update({
          child_count: t().count('*').where('thread', entry.thread).andWhere('access', '>', Access.MODERATION)
        }).where('id', entry.thread).asCallback(flow)
      },
      () => flow.next(entry)
    ], done)
  }

  updateLikeCount(entry, done) {
    var t = () => Entry.table(entry.id)
    debug('updateLikeCount', entry.id, entry.like_count)
    var flow = tflow([
      () => {
        t().update({
          like_count: t().count('*').where({ref: entry.id, rel: Entity.LIKE}).andWhere('access', Access.EVERYONE)
        }).where('id', entry.id).asCallback(flow)
      },
    ], done)
  }

}

class ChannelStore extends Store {

  list(req, opts, done) {
    debug('channel.list', opts)
    var flow = tflow([
      function() {
        var q = Channel.table(opts.owner)
          .select(Channel.listFields)
          .where('model', 'channel')
        if (opts.owner) q = q.where({owner: opts.owner})
        if (opts.type) {
          if (!req.user || !req.user.isAdmin()) return flow.fail(400, 'Admin required')
          q = q.where({type: opts.type})
        }
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
