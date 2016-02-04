'use strict';

var debug = require('debug')('umedia:entry')
var tflow = require('tflow')
var _ = require('lodash')
var coect = require('coect')

var ENTRIES_LIST = 'entries'
var MAX_PAGE_SIZE = 20

var Entity = require('./models').Entity
var Channel = require('./models').Channel
var Entry = require('./models').Entry
var Access = coect.Access


var riot = require('riot')


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

function validate(req, parent, channel, type, done) {
  debug(`validate type=${type}`, Entry.getTypeSchema(type))
  var flow = tflow([
    function() {
      Entry.validate(req.body, {schema: Entry.getTypeSchema(type)}, flow)
    },
    function(doc, data) {
      var userAccess = req.security.getUserAccess(req.user, channel)
      var defaultAccess = req.security.getNewEntryAccess(req.user, {type: type}, parent, channel)
      Entry.applyAccess(data, userAccess, parent.access, defaultAccess, flow.join(doc))
    }
  ], done);
}

function checkNewEntry(req, done) {
  debug('checkNE', req.body)
  tflow([
    function() {
      (req.body.parent === req.body.list ? Channel : Entry).get(req.body.parent, {select: '*'}, this)
    },
    function(parent) {
      debug('checkNE parent=', (typeof parent), parent.type)
      if (parent.type === 'channel') return this.next(parent, parent)
      else return Channel.get(parent.list, {select: '*'}, this.join(parent))
    },
    function(parent, channel) {
      if (!req.security.canCreateEntry(req.user, parent, channel)) return this.fail(403, 'Not enough permissions to create')
      validate(req, parent, channel, parent.type === 'channel' ? 'post' : 'comment', this.join(parent, channel))
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
  // Fix made a transaction
  debug(`saveNewEntry type=${type} access=${data.access}, name=${data.name}`)
  debug(`user=${req.user.id}, list=${list.name}, parent=${parent.name}`)
  var entryData = {}
  if (_.size(data.accessData)) entryData.access = data.accessData
  Entry.create({
    model: Entry.MODEL,
    type: type,
    access: data.access,
    data: entryData,
    name: data.name,
    text: req.body.text,
    // custom urls are allowed for posts only
    url: (type === 'post' ? Entry.makeUrl(list.url, data.slug) : null),
    owner: req.user.id,
    recipient: (parent.model === 'entry' ? parent.owner: null),
    list: list.id,
    version: makeVersion(),
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
    },
    function(entry) {
      Entity.fillUsers([entry], req.app.userCache, flow.send(entry))
    }
  ], coect.json.response(res))
}

function entryWhere(req) {
  if (req.params.id) return {id: req.params.id}
  else return {url: [req.params.username, req.params.cslug, req.params.eslug].join('/')}
}


function getEntryAndChannel(where, done) {
  let flow = tflow([
    () => Entry.get(where, {select: '*'}, flow),
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
      if (entry.type === 'post') this.next(entry, channel, channel)
      else Entry.get(entry.parent, this.join(entry, channel))
    },
    function(entry, channel, parent) {
      if (!req.security.canUserChange(req.user, entry, channel)) return flow.fail(403, 'Forbidden')
      validate(req, parent, channel, entry.type, flow.join(entry, channel))
    },
    function(entry, list, doc, data) {
      debug('update data', data)
      var entryData = entry.data
      if (entryData.access || _.size(data.accessData)) entryData.access = data.accessData
      Entry.update(entry.id, _.omit({
        name: data.name,
        head: doc.head,
        text: doc.text,
        access: data.access,
        data: entryData,
        url: entry.url || entry.type === 'post' && Entry.makeUrl(list.url, data.slug) || undefined,
        version: makeVersion()
      }, _.isUndefined), this)
    },
    function(id) {
      debug('updated', id)
      Entry.get(id, this)
    },
    function(entry) {
      Entity.fillUsers([entry], req.app.userCache, flow.send(entry))
    },
  ], coect.json.response(res))
}


function moderate(req, res) {
  debug('moderate', req.params)
  var flow = tflow([
    function() {
      getEntryAndChannel(entryWhere(req), flow)
    },
    function(entry, channel) {
      if (entry.access !== Access.MODERATION) return flow.fail(400, 'Entry is already moderated.')
      if (!req.security.canUserModerate(req.user, entry, channel)) return flow.fail(403, 'Forbidden.')
      var data = {
        access: (req.params.action === 'accept' ? req.security.getDesiredAccess(entry, channel) : Access.REJECTED)
      }
      Entry.update(entry.id, data, this.send(data))
    },
  ], coect.json.response(res))
}

function retrieve(req, res, next) {
  debug('retrieve xhr=', req.xhr, req.path, req.params, req.query)
  var flow = tflow([
    function() {
      getEntryAndChannel(entryWhere(req), flow)
    },
    
    function(entry, channel) {
      if (!req.security.canUserViewChannel(req.user, channel)) return flow.fail(403, 'Access to the channel is forbidden')
      if (!req.security.canUserView(req.user, entry, channel)) return flow.fail(403, 'Access to the entry is forbidden')
      //FIX remove sensitive fields without reloading
      Entry.get(entry.id, flow.join(channel))
    },
    function(channel, entry) {
      var ids = Array.from(new Set([entry.parent, entry.thread, entry.topic, entry.list])).filter(v => v)
      var fields = Entry.listFields.filter(v => (v !== 'text'))
      debug('ids', ids)
      Entry.table().select(fields).whereIn('id', ids).asCallback(flow.join(entry, channel))
    },
    function(entry, channel, related) {
      Entity.fillUsers(related.concat(entry), req.app.userCache, flow.join(entry, channel))
    },
    function(entry, channel, related) {
      debug(`related.length=${related.length}`)
      // replace ids with related objects
      let relatedMap = {}
      for (let e of related) relatedMap[e.id] = e
      debug('channel', channel)
      for (let field of ['list', 'parent', 'thread', 'topic']) {
        let fieldValue = entry[field]
        let relatedObj  = relatedMap[fieldValue]
        // if (relatedObj && relatedObj.id !== channel.id &&
        //     !req.security.canUserView(req.user, relatedObj, channel)) return flow.fail(403, 'Forbidden')
        if (fieldValue) entry[field] =  relatedObj || {id: fieldValue}
      }
      flow.next(entry)
    }
  ], coect.janus(req, res, next, function(entry) {
    debug('entry', (typeof entry.created), entry.created)
    res.render('index', {
      title: entry.name,
      canonicalUrl: entry.url,
      content: riot.render('umedia-entry-details', {entry: entry})
    })
    
  }))
}

/**
   Move entry to 'Trash bin' with ability to restore later.
*/
function trash(req, res) {
  debug('remove params', req.params)
  var flow = tflow([
    () => getEntryAndChannel(entryWhere(req), flow),
    (entry, channel) => req.security.canTrashEntry(req.user, entry, channel) ? flow.next(entry) : flow.fail(403, 'Forbidden'),
    (entry) => Entry.update(entry.id, {access: Access.TRASH}, flow)
  ], coect.json.response(res))
}

/**
   Phisically remove entry from the database.
*/
function purge(req, res) {
  debug('purge params', req.params)
  var flow = tflow([
    () => getEntryAndChannel(entryWhere(req), flow),
    (entry, channel) => req.security.canPurgeEntry(req.user, entry, channel) ? flow.next(entry) : flow.fail(403, 'Forbidden'),
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
   Show entries allowed for user, created by himself or wrote to her.
*/
function filterByAccess(q, user, access) {
  if (!user) return q.where('access', '>=', access)
  return q.whereRaw('\("access\" >= ? OR (\"access\" > ? AND (\"owner\" = ? OR \"recipient\" = ?)))',
                    [access, Access.ADMIN, user.id, user.id])
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
      this.next(where, channel ? req.security.getUserAccess(req.user, channel) : req.security.getUserAccess(req.user))
    },
    function(where, access) {
      debug(`list where=${where} access=${access}`)
      if (access === undefined) return this.fail(403, 'Access mode is undefined')
      var q = Entry.table(where.list)
      q = q.select(Entry.listFields)
      q = q.where(where)
      // if user isn't a root in a channel filter by access
      if (access > Access.ROOT) q = filterByAccess(q, req.user, access)
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
      Entity.fillUsers(entries, req.app.userCache, this)
    },
    function(entries) {
      this.next({items: entries})
    },
  ], coect.json.response(res))
}

module.exports = {
  create,
  retrieve,
  update,
  trash,
  purge,
  list,
  moderate
}
