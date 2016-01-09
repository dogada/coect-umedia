'use strict';

var debug = require('debug')('umedia:entry')
var tflow = require('tflow')
var _ = require('lodash')
var coect = require('coect')

var ENTRIES_LIST = 'entries'
var MAX_PAGE_SIZE = 20
var OWNER = 'dvd@dogada.org'

var Entity = require('./models').Entity
var Channel = require('./models').Channel
var Entry = require('./models').Entry



var wpml = require('wpml')

/**
   Load list and parent and check that they match each other.
*/
function checkListParent(req, done) {
  debug('checkListTP', req.body)
  tflow([
    function() {
      if (!req.body.list) this.next(null)
      Channel.get(req.body.list, this)
    },
    function(list) {
      if (!req.body.parent) this.next(list, null)
      else Entry.get(req.body.topic, this.join(list))
    },
    function(list, topic, parent) {
      if (topic && list && topic.list !== list.id) return this.fail('Topic doesn\'t belongs to list: ' + topic.id)
      if (parent && list && parent.list !== list.id) return this.fail('Parent doesn\'t belongs to list: ' + parent.id)
      this.next(list, topic, parent)
    },
  ], done);
}

function isAuthorized() {
}

function makeVersion() {
  return new Date().toISOString()
}


function checkNewEntry(req, done) {
  tflow([
    function() {
      Entity.get(req.body.parent, {select: '*'}, this)
    },
    function(parent) {
      debug('checkNE list=', parent)
      if (parent.type === 'channel') return this.next(parent, parent)
      else return Channel.get(parent.list, {select: '*'}, this.join(parent))
    },
    function(parent, list) {
      if (parent.type === 'channel' && parent.owner !== req.user.id) return this.fail('Not owner of the list')
      Entry.validate(req.body,
                     {schema: Entry.getTypeSchema(parent.type === 'channel' ? 'post' : 'comment')},
                     this.join(parent, list))
    },
  ], done)
}



function saveNewEntry(req, parent, list, doc, data, done) {
  var type = 'post'
  var topicId, threadId
  if (parent.type !== 'channel') {
    topicId = parent.topic || parent.id
    if (!parent.thread || parent.thread === parent.topic) threadId = parent.id
    else threadId = parent.thread
    type = (parent.thread ? 'reply' : 'comment')
  }
  //Fix made a transaction
  var access = req.security.getNewEntryAccess(req.user, {type: type}, list)
  debug(`saveNewEntry type=${type} access=${access}`, req.user.id, list.name, parent.name, data.name)
  Entry.create({
    model: Entry.MODEL,
    type: type,
    name: data.name,
    text: req.body.text,
    // custom urls are allowed for posts only
    url: (type === 'post' ? Entry.makeUrl(list.url, data.slug) : null),
    owner: req.user.id,
    recipient: (parent.model === 'entry' ? parent.owner: null),
    list: list.id,
    version: makeVersion(),
    access: access,
    parent: parent.id,
    topic: topicId,
    thread: threadId
  }, list.id, done)
}

function updateCounters(entry, done) {
  var query;
  if (entry.thread) {
    // update comment's reply count
    query = Entry.table(entry.thread).update({
      child_count: Entry.raw('child_count + 1'),
      rating: Entry.raw('rating + 1')
    }).where({id: entry.thread})
  }
  else {
    // update channels' post count
    query = Entry.table(entry.parent).update({
      child_count: Entry.raw('child_count + 1'),
      version: entry.version
    }).where({id: entry.parent})
  }
  return query.asCallback(done)
}

function create(req, res) {
  debug('create user=', req.user.id)
  //FIX: load and verify ids and access rights
  // name can defined for entries without topic only 
  var flow = tflow([
    function() {
      checkNewEntry(req, flow)
    },
    function(parent, list, doc, data) {
      saveNewEntry(req, parent, list, doc, data, flow)
    },
    function(id) {
      Entry.get(id, flow)
    },
    function(entry) {
      debug('created entry', entry)
      updateCounters(entry, flow.send(entry))
    }
  ], coect.json.response(res))
}

function entryWhere(req) {
  if (req.params.id) return {id: req.params.id}
  else return {url: [req.params.username, req.params.cslug, req.params.eslug].join('/')}
}


function getEntryAndChannel(where, done) {
  let flow = tflow([
    () => Entry.get(where, flow),
    (entry) => Channel.get(entry.list, {select: '*'}, flow.join(entry))
  ], done)
}

function update(req, res) {
  debug('update', req.body)
  var flow = tflow([
    function() {
      getEntryAndChannel(entryWhere(req), flow)
    },
    function(entry, channel) {
      if (!req.security.canUserChange(req.user, entry, channel)) return flow.fail(403, 'Forbidden')
      Entry.validate(req.body, {schema: Entry.getTypeSchema(entry.type)}, this.join(entry, channel))
    },
    function(entry, list, doc, data) {
      Entry.update(entry.id, {
        name: data.name,
        head: doc.head,
        text: doc.text,
        url: entry.url || entry.type === 'post' && Entry.makeUrl(list.url, data.slug) || null,
        version: makeVersion()
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
      cache.getUsers(Array.from(new Set(entries.map(e => e.owner))), this)
    },
    function(users) {
      debug('found users', _.size(users), users)
      for (let e of entries) e.owner = users[e.owner] || {id: e.owner}
      this.next(entries)
    }
  ], done)
}

function retrieve(req, res, next) {
  debug('retrieve xhr=', req.xhr, req.path, req.params, req.query)
  var thread = !!req.query.thread
  var flow = tflow([
    function() {
      getEntryAndChannel(entryWhere(req), flow)
    },
    function(entry, channel) {
      
      // load parent of reply to show a thread to refresh memory
      debug('loading parent for', entry)
      if (thread && entry.type === 'reply') Entry.get(entry.parent, this.join(channel, [entry]))
      else this.next(channel, [entry])
    },
    function(channel, chain, parent) {
      if (parent) chain = [parent].concat(chain)
      for (let entry of chain) {
        if (!req.security.canUserView(req.user, entry, channel)) return flow.fail(403, 'Forbidden')
      }
      fillUsers(chain, req.app.userCache, this)
    },
    function(entries) {
      this.next(thread ? entries: entries[0])
    },
  ], req.app.janus(req, res, next))
}



function remove(req, res) {
  debug('remove params', req.params, req.oid)
  var flow = tflow([
    () => getEntryAndChannel(entryWhere(req), flow),
    (entry, channel) => req.security.canUserRemove(req.user, entry, channel) ? flow.next(entry) : flow.fail(403, 'Forbidden'),
    (entry) => Entry.remove(entry.id, flow)
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
      var where = firstItem(req.query, ['owner', 'list', 'list_url', 'topic', 'thread'])
      // FIX: switch to timeline
      if (!Object.keys(where).length) where = {type: 'post'}
      if (!Object.keys(where).length) return this.fail(400, 'An entry filter is required.')
      
      // show top-level entries (posts) only
      if (where.owner || where.list || where.list_url) where.type = 'post'
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
   Returns new where without list_url but with list.
*/
function checkList(req, where, done) {
  var flow = tflow([
    function() {
      Channel.get(where.list ? where.list : {url: where.list_url}, {select: '*'}, flow)
    },
    function(channel) {
      debug('checkList', channel)
      if(!req.security.canUserViewChannel(req.user, channel)) return this.fail(403, 'Forbidden')
      this.next(_.extend(_.omit(where, 'list_url'), {list: channel.id}),
                req.security.getUserAccessInsideChannel(req.user, channel))
    }
  ], done);
}

/**
   Show entries allowed for user, created by himself or wrote to her.
*/
function filterByAccess(q, user, access) {
  if (!user) return q.where('access', '>=', access)
  return q.whereRaw('\("access\" >= ? OR (\"access\" > ? AND (\"owner\" = ? OR \"recipient\" = ?)))',
                    [access, Entity.ADMIN, user.id, user.id])
}

function list(req, res) {
  tflow([
    function() {
      listWhere(req, this)
    },
    function(where) {
      if (where.thread || where.topic) Entry.get(where.thread || where.topic, this.join(where))
      else this.next(where)
    },
    function(where, parent) {
      var q = (parent ? parent.list : where.list || where.list_url && {url: where.list_url})
      if (q) Channel.get(q, {select: '*'}, this.join(where))
      else this.next(where)
    },
    function(where, channel) {
      if (where.list_url) where = _.extend(_.omit(where, 'list_url'), {list: channel.id})
      if(channel && !req.security.canUserViewChannel(req.user, channel)) return this.fail(403, 'No access to the channel')
      this.next(where, channel ? req.security.getUserAccessInsideChannel(req.user, channel) : req.security.getUserAccess(req.user))
    },
    function(where, access) {
      debug(`list where=${where} access=${access}`)
      if (access === undefined) return this.fail(403, 'Access mode is undefined')
      var q = Entry.table(where.list)
      q = q.select(Entry.listFields)
      q = q.where(where)
      // if user isn't an admin in a channel filter by access
      if (access > Channel.ADMIN) q = filterByAccess(q, req.user, access)
      if (req.query.cursor) {
        if (req.query.order === 'first') q = q.andWhere('id', '>', req.query.cursor)
        else if (req.query.order === 'last') q = q.andWhere('id', '<', req.query.cursor)
      }
      q = q.orderBy.apply(q, listOrder(req))
      if (req.query.offset) q = q.offset(parseInt(req.query.offset, 10))
      q = q.limit(Math.min(MAX_PAGE_SIZE, parseInt(req.query.count, 10)))
      debug('list SQL', q.toString().slice(-130))
      q.asCallback(this)
    },
    function(entries) {
      fillUsers(entries, req.app.userCache, this)
    },
    function(entries) {
      this.next({items: entries})
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
