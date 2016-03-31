'use strict';

var debug = require('debug')('umedia:store')
var tflow = require('tflow')

var Entity = require('../models').Entity
var Channel = require('../models').Channel
var Entry = require('../models').Entry

var coect = require('coect')
var Access = coect.Access
var Store = require('./store')


/**
   Show entries allowed for user, created by himself or wrote to her.
*/
function filterByAccess(q, user, access) {
  if (!user) return q.where('access', '>=', access)
  return q.whereRaw('\("access\" >= ? OR (\"access\" > ? AND (\"owner\" = ? OR \"recipient\" = ?)))',
                    [access, Access.ADMIN, user.id, user.id])
}

function listOrder(order) {
  if (order === 'top') return ['like_count', 'desc']
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
      var where = firstItem(opts, ['parent', 'topic', 'thread', 'list', 'owner', 'type', 'recipient'])
      // // show top-level entries (posts) only
      // if ((where.owner || where.list) && !opts.tag && !opts.model &&
      // !opts.my) where.topic = null
      if (opts.my && opts.owner) where.owner = opts.owner
      if (opts.model) where.model = opts.model

      if (opts.filter === 'user') Object.assign(where, {model: Entity.LIKE, type: Entity.MAIN})
      else if (opts.filter === 'category') Object.assign(where, {model: Entity.LIKE, type: Entity.CATEGORY})
      else if (opts.filter === 'like') Object.assign(where, {model: Entity.LIKE})

      // FIX: switch to timeline
      if (!Object.keys(where).length && !opts.tag) return flow.fail(400, 'An entry filter is required.')
      this.next(where, opts.tag)
    }
  ], done)
}

class EntryStore extends Store {

  list(user, access, opts, done) {
    debug('ES.list access=', access, opts)
    var flow = tflow([
      () => listWhere(opts, flow),
      (where, tag) => {
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
        q = q.limit(this.pageSize(opts))
        debug('list SQL', q.toString().slice(-130))
        q.asCallback(flow)
      }
    ], done)
  }

  updateChildCount(entry, done) {
    var t = () => Entry.table(entry.id)
    debug('updateChildCount', entry.access, entry)
    var flow = tflow([
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
    var entryId = entry.id || entry
    debug('updateLikeCount', entryId, entry.like_count)
    var flow = tflow([
      () => {
        var q = t().update({
          like_count: t().count('*').where({ref: entryId, model: Entity.LIKE}).andWhere('access', '>', Access.HIDDEN)
        }).where('id', entryId)
        debug('SQL', q.toString())
        q.asCallback(flow.send(entry))
      },
    ], done)
  }

  /**
     Update like_count, comment_count, reply_count, repost_count, etc.
   */
  updateCounters(entry, done) {
    var flow = tflow([
      () => this.updateLikeCount(entry, flow),
    ], done)
  }

  updateParentCounters(entry, done) {
    debug('updateParentCounters', entry.model, entry.ref)
    if (entry.model === Entity.ENTRY) this.updateChildCount(entry, done)
    else if (entry.ref && entry.model === Entity.LIKE) this.updateLikeCount(entry.ref, done)
    else done(null)
  }
}


module.exports = EntryStore
