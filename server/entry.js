'use strict';

var debug = require('debug')('umedia:entry')
var tflow = require('tflow')
var _ = require('lodash')
var coect = require('coect')

var ENTRIES_LIST = 'entries'
var MAX_PAGE_SIZE = 20
var OWNER = 'dvd@dogada.org'

var Entry = require('./models').Entry
var Channel = require('./models').Channel
var wpml = require('wpml')

function getSchema(req) {
  if (req.body.repost) return Entry.repost
  else if (req.body.topic) return Entry.comment
  else return Entry.post
}

/**
   Load list and parent and check that they match each other.
*/
function checkListParent(req, done) {
  debug('checkListTP', req.body)
  tflow([
    function() {
      if (!req.body.list) this.next(null)
      Channel.findById(req.body.list, this)
    },
    function(list) {
      if (!req.body.parent) this.next(list, null)
      else Entry.findById(req.body.topic, this.join(list))
    },
    function(list, topic, parent) {
      if (topic && list && topic.list_id !== list.id) return this.fail('Topic doesn\'t belongs to list: ' + topic.id)
      if (parent && list && parent.list_id !== list.id) return this.fail('Parent doesn\'t belongs to list: ' + parent.id)
      this.next(list, topic, parent)
    },
  ], done);
}

function isAuthorized() {
}

function parseMeta(text, done) {
  tflow([
    function() {
      this.next(wpml.meta(text))
    },
    function(meta) {
      meta = _.pick(meta, 'slug')
      Entry.validate(meta, Entry.inputs, this.send(meta))
    },
  ], done);
}

function checkNewEntry(req, done) {
  tflow([
    function() {
      if (req.body.parent && req.body.list) return this.fail(400, 'Both list and parent are sent.')
      else if (req.body.list) Channel.findById(req.body.list, this)
      else if (req.body.parent) Entry.findById(req.body.parent, this.join(null))
      else this.fail(400, 'Parent or list must be provided')
    },
    function(list, parent) {
      debug('checkEA list=', list, parent)
      if (!list && !parent) return this.fail('List or parent are required.')
      if (!parent && list.owner_id !== req.user.id) return this.fail('Not owner of list')
      parseMeta(req.body.text || '', this.join(list, parent))
    },
  ], done);
}

function saveNewEntry(req, list, parent, meta, done) {
  tflow([
    function() {
      // top-level entries of lists (posts) store on list's shard, comments
      // store on topic's shard
      var listId = list && list.id || parent.list_id
      var type = 'post'
      var topicId, threadId
      if (parent) {
        topicId = parent.topic_id || parent.id
        if (!parent.thread_id || parent.thread_id === parent.topic_id) threadId = parent.id
        else threadId = parent.thread_id
        
        type = (parent.thread_id ? 'reply' : 'comment')
      }
      //Fix made a transaction
      Entry.create({
        name: req.body.name || '',
        text: req.body.text,
        slug: meta.slug,
        // custom urls are allowed for posts only (they have not null list and
        // comments doesn't 
        url: list && Entry.makeUrl(req.user, list, meta.slug),
        user_id: req.user.id,
        list_id: listId,
        visible: true,
        type: type,
        parent_id: parent && parent.id,
        topic_id: topicId,
        thread_id: threadId,
        repost_id: null
      }, listId, this.join(threadId))
    }
  ], done);
}

function create(req, res) {
  debug('create user=', req.user.id, req.body, getSchema(req))
  if (coect.json.invalid(req, res, getSchema(req))) return
  //FIX: load and verify ids and access rights
  // name can defined for entries without topic only 
  tflow([
    function() {
      checkNewEntry(req, this)
    },
    function(list, parent, meta) {
      saveNewEntry(req, list, parent, meta, this)
    },
    function(threadId, id) {
      debug('created entry', id, 'threadId=', threadId)
      if (threadId) {
        Entry.table(threadId)
          .update({
            comment_count: Entry.raw('comment_count + 1'),
            rating: Entry.raw('rating + 1')
          })
          .where({id: threadId}).asCallback(this.send({id: id}))
      }
      else this.next({id: id})
    },
    function(id) {
      Entry.get(id, this)
    }
  ], coect.json.response(res))
}

function isDocAuthor(doc, user) {
  return !!(user && user.id === doc.user_id)
}

function getForChange(req, done) {
  tflow([
    function() {
      Entry.get(req.params.id, this)
    },
    function(doc) {
      if (!isDocAuthor(doc, req.user)) return this.fail('Author required')
      else return this.next(doc)
    }
  ], done)
  
}

function entryWhere(req) {
  if (req.params.id) return {id: req.params.id}
  else return {url: [req.params.username, req.params.cslug, req.params.eslug].join('/')}
}

function getForRead(req, id, done) {
  if (!done) {
    done = id
    id = null
  }
  debug('getForRead', id, req.params)
  tflow([
    function() {
      Entry.get(id ? {id: id} : entryWhere(req), this)
    },
    function(doc) {
      if (doc.visible === null && !isDocAuthor(doc, req.user)) return this.fail(403, 'Forbidden')
      else return this.next(doc)
    }
  ], done)
  
}

function update(req, res) {
  debug('update', req.body)
  tflow([
    function() {
      getForChange(req, this)
    },
    function(entry, meta) {
      var schema = entry.topic_id ? Entry.comment : Entry.post
      if (coect.json.invalid(req, res, schema)) return
      else Channel.get(entry.list_id, this.join(entry))
    },
    function(entry, list) {
      parseMeta(req.body.text || '', this.join(entry, list))
    },
    function(entry, list, meta) {
      Entry.update(entry.id, {
        name: req.body.name,
        text: req.body.text,
        slug: meta.slug,
        url: entry.url || list && Entry.makeUrl(req.user, list, meta.slug),
        edited: new Date()
      }, this)
    },
    function(id) {
      debug('updated', id)
      Entry.get(id, this)
    },
  ], coect.json.response(res))
}

function fillUsers(entries, cache, done) {
  tflow([
    function() {
      cache.getUsers(_.unique(_.map(entries, 'user_id')), this)
    },
    function(users) {
      debug('found users', _.size(users), users)
      this.next(_.map(entries, function(e) {
        e.user = users[e.user_id] || {id: e.user_id}
        delete e.user_id
        return e
      }))
    },
  ], done);
}

function retrieve(req, res, next) {
  debug('retrieve xhr=', req.xhr, req.path, req.params, req.query)
  var thread = !!req.query.thread
  tflow([
    function() {
      getForRead(req, this)
    },
    function(entry) {
      // load parent of reply to show a thread to refresh memory
      debug('loading parent for', entry)
      if (thread && entry.type === 'reply') getForRead(req, entry.parent_id, this.join([entry]))
      else this.next([entry])
    },
    function(chain, parent) {
      this.next(parent ? [parent].concat(chain) : chain)
    },
    function(entries) {
      fillUsers(entries, req.app.userCache, this)
    },
    function(entries) {
      this.next(thread ? entries: entries[0])
    },
  ], req.app.janus(req, res, next))
}



function remove(req, res) {
  debug('remove params', req.params, req.oid)
  tflow([
    function() {
      getForChange(req.params.id, this)
    },
    function(doc) {
      debug('remove', doc)
      if (!doc) return this.fail('Invalid id')
      else Entry.remove(doc.id, this)
    },
  ], coect.json.response(res))
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

function listWhere(req, done) {
  tflow([
    function() {
      //list_url
      var where = firstItem(req.query, ['user_id', 'list_id', 'list_url', 'topic_id', 'thread_id'])
      if (!Object.keys(where).length) where = {type: 'post'}
      //if (!Object.keys(where).length) return this.fail(400, 'An entry filter is required.')
      
      // show top-level entries (posts) only
      if (where.user_id || where.list_id || where.list_url) where.type = 'post'
      where.visible = true
      this.next(where)
    }
  ], done)
}

function listOrder(req) {
  if (req.query.order === 'top') return ['rating', 'desc']
  else if (req.query.order === 'first') return ['id', 'asc']
  else return ['id', 'desc']
}


/**
   Ensures that current user can access the list.
   Returns new where without list_url bu with list_id.
*/
function checkList(req, where, done) {
  tflow([
    function() {
      if (where.list_id) Channel.findOne({id: where.list_id}, this)
      else Channel.findOne({url: where.list_url}, this)
    },
    function(channel) {
      debug('checkList', channel)
      if (!channel) return this.fail(404, 'Channel isn\'t found.')
      else if (!channel.visible && !(req.user && req.user.isAdmin())) return this.fail(403, 'Access denied')
      this.next(_.extend(_.omit(where, 'list_url'), {list_id: channel.id}))
    },
  ], done);
}

function list(req, res) {
  tflow([
    function() {
      listWhere(req, this)
    },
    function(where) {
      if (where.list_id || where.list_url) checkList(req, where, this)
      else this.next(where)
    },
    function(where) {
      var q = Entry.table(where.topic_id || where.parent_id || where.list_id)
      q = q.where(where)
      if (req.query.cursor) {
        if (req.query.order === 'first') q = q.andWhere('id', '>', req.query.cursor)
        else if (req.query.order === 'last') q = q.andWhere('id', '<', req.query.cursor)
      }
      q = q.orderBy.apply(q, listOrder(req))
      if (req.query.offset) q = q.offset(parseInt(req.query.offset, 10))
      q = q.limit(Math.min(MAX_PAGE_SIZE, parseInt(req.query.count, 10)))
      q.asCallback(this)
    },
    function(entries) {
      fillUsers(entries, req.app.userCache, this)
    },
  ], coect.json.response(res))
}

module.exports = {
  create: create,
  retrieve: retrieve,
  update: update,
  remove: remove,
  list: list
}
