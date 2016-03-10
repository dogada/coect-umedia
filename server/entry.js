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
var config = require('./config')
var store = require('./store')
var riot = require('riot')
var misc = require('./misc')

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

function validate(req, parent, channel, type, meta, done) {
  debug(`validate type=${type}`, Entry.getTypeSchema(type))
  debug(`parent ${parent.model} ${parent.type} ${parent.id}`)
  var flow = tflow([
    function() {
      Entry.validate(req.body, {schema: Entry.getTypeSchema(type), meta: meta}, flow)
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
  var flow = tflow([
    function() {
      (req.body.parent === req.body.list ? Channel : Entry).get(req.body.parent, {select: '*'}, this)
    },
    function(parent) {
      debug('checkNE parent=', (typeof parent), parent.type)
      if (parent.model === Channel.MODEL) return this.next(parent, parent)
      else return Channel.get(parent.list, {select: '*'}, this.join(parent))
    },
    (parent, channel) => config.User.get(parent.owner, flow.join(parent, channel)),
    function(parent, channel, recipient) {
      if (!req.security.canCreateEntry(req.user, parent, channel)) return this.fail(403, 'Not enough permissions to create')
      validate(req, parent, channel, parent.type === 'channel' ? 'post' : 'comment',
               Entry.recipientMeta(parent, recipient), this.join(parent, channel))
    },
  ], done)
}

function getTags(form, type) {
  if (type === 'post' && form.tags && form.tags.length) return form.tags
}

function saveNewEntry(req, parent, list, form, done) {
  var type = 'post'
  if (parent.type !== 'channel') {
    type = (parent.thread ? 'reply' : 'comment')
  }
  // Fix made a transaction
  debug(`saveNewEntry type=${type} access=${form.access}, name=${form.name}`)
  debug(`user=${req.user.id}, list=${list.name}, parent=${parent.name}`)
  var data = {}
  if (_.size(form.accessData)) data.access = form.accessData
  Entry.create({
    type: type,
    access: form.access,
    name: form.name,
    tags: getTags(form, type),
    text: form.text,
    data: data,
    meta: form.meta,
    // custom urls are allowed for posts only
    url: (type === 'post' ? Entry.makeUrl(list.url, form.slug) : null),
    owner: req.user.id,
  }, parent, done)
}

function create(req, res) {
  debug('create user=', req.user.id)
  //FIX: load and verify ids and access rights
  // name can defined for entries without topic only 
  var flow = tflow([
    function() {
      checkNewEntry(req, flow)
    },
    function(parent, list, doc, form) {
      saveNewEntry(req, parent, list, form, flow)
    },
    function(id) {
      Entry.get(id, flow)
    },
    function(entry) {
      debug('created entry', entry)
      store.entry.updateCounters(entry, flow)
    },
    function(entry) {
      Entity.fillUsers([entry], req.app.userCache, flow.send(entry))
    }
  ], coect.json.response(res))
}

function update(req, res) {
  debug('update', req.body)
  var flow = tflow([
    function() {
      misc.getEntryAndChannel(req, flow)
    },
    function(entry, channel) {
      if (entry.type === 'post') this.next(entry, channel, channel)
      else Entry.get(entry.parent, this.join(entry, channel))
    },
    (entry, channel, parent) => config.User.get(parent.owner, flow.join(entry, channel, parent)),
    function(entry, channel, parent, recipient) {
      if (!req.security.canUserChange(req.user, entry, channel)) return flow.fail(403, 'Forbidden')
      validate(req, parent, channel, entry.type, Entry.recipientMeta(parent, recipient), flow.join(entry, channel))
    },
    function(entry, list, doc, form) {
      debug('update form', form)
      var entryData = entry.data
      if (entryData.access || _.size(form.accessData)) entryData.access = form.accessData
      Entry.update(entry.id, _.omit({
        name: form.name,
        head: doc.head,
        text: doc.text,
        access: form.access,
        tags: getTags(form, entry.type),
        data: entryData,
        meta: Object.assign(entry.meta || {}, form.meta),
        url: entry.url || entry.type === 'post' && Entry.makeUrl(list.url, form.slug) || undefined,
        version: Entry.makeVersion()
      }, _.isUndefined), this)
    },
    function(id) {
      debug('updated', id)
      Entry.get(id, this)
    },
    (entry) => store.entry.updateCounters(entry, flow),
    (entry) => Entity.fillUsers([entry], req.app.userCache, flow.send(entry)),
  ], coect.json.response(res))
}


function moderate(req, res) {
  debug('moderate', req.params)
  var flow = tflow([
    function() {
      misc.getEntryAndChannel(req, flow)
    },
    function(entry, channel) {
      if (entry.parent === channel.id) flow.next(entry, channel, channel)
      else Entity.get(entry.parent, flow.join(entry, channel))
    },
    function(entry, channel, parent) {
      if (entry.access !== Access.MODERATION) return flow.fail(400, 'Entry is already moderated.')
      if (!req.security.canUserModerate(req.user, entry, channel)) return flow.fail(403, 'Forbidden.')
      var data = {
        access: (req.params.action === 'accept' ? req.security.getDesiredAccess(entry, parent, channel) : Access.REJECTED)
      }
      Entry.update(entry.id, data, this.send(data, entry))
    },
    (data, entry) => store.entry.updateCounters(entry, flow.send(data)),
  ], coect.json.response(res))
}

function data(req, res, done) {
  debug('data xhr=', req.xhr, req.params)
  var flow = tflow([
    () => misc.getEntryAndChannel(req, flow),
    (entry, channel) => flow.next(Entry.pick(entry))
  ], coect.json.response(res, done))
}

function detail(req, res, next) {
  debug('detail xhr=', req.xhr, req.path, req.params, req.query)
  var flow = tflow([
    function() {
      misc.getEntryAndChannel(req, flow)
    },
    function(entry, channel) {
      entry = Entry.pick(entry)
      channel = Channel.pick(channel)
      var related = Array.from(new Set([entry.thread, entry.topic])).filter(v => v)
      if (entry.parent && entry.parent !== channel.id) related.push(entry.parent)
      //var fields = Entry.listFields.filter(v => (v !== 'text'))
      // FIX: text is required for reply only 
      var fields = Entry.listFields
      debug('related ids', related)
      Entry.table().select(fields).whereIn('id', related).asCallback(flow.join(entry, channel))
    },
    function(entry, channel, related) {
      Entity.postprocess(req, related.concat(entry, channel), flow.join(entry, channel))
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
      entry.list = channel
      if (entry.parent && entry.parent.id === channel.id) entry.parent = channel
      flow.next(entry)
    }
  ], coect.janus(req, res, next, function(entry) {
    debug('entry', (typeof entry.created), entry.created)
    res.render('index', {
      title: entry.name,
      canonicalUrl: entry.url,
      content: riot.render('umedia-entry-details', {
        entry: entry,
        breadcrumbs: (req.query.breadcrumbs === 'off' ? [] : undefined)})
    })
    
  }))
}

/**
   Move entry to 'Trash bin' with ability to restore later.
*/
function trash(req, res) {
  debug('remove params', req.params)
  var flow = tflow([
    () => misc.getEntryAndChannel(req, flow),
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
    () => misc.getEntryAndChannel(req, flow),
    (entry, channel) => req.security.canPurgeEntry(req.user, entry, channel) ? flow.next(entry) : flow.fail(403, 'Forbidden'),
    (entry) => Entry.remove(entry.id, flow)
  ], coect.json.response(res))
}

function list(req, res) {
  var flow = tflow([
    () => {
      var parentId = req.query.parent || req.query.thread || req.query.topic
      if (parentId) Entry.get(parentId, flow)
      else flow.next()
    },
    (parent) => {
      if (req.query.thread) flow.next({list: parent.list, thread: req.query.thread})
      else if (req.query.topic) flow.next({list: parent.list, topic: req.query.topic})
      else if (req.query.parent) flow.next({list: parent.list, parent: parent.id})
      else if (req.params.id) flow.next({list: req.params.id, tag: req.params.tag}) // c/:id/t/:tag && c/:id
      else if (req.query.list) flow.next({list: req.query.list, tag: req.query.tag})
      else if (req.query.list_url) flow.next({url: req.query.list_url, tag: req.query.tag})
      else if (req.query.owner) flow.next({owner: req.query.owner, model: 'entry'})
      else if (req.query.tag) flow.next({tag: req.query.tag})
      else if (req.query.type && req.user && req.user.isAdmin()) flow.next({type: req.query.type})
      else flow.fail(400, 'Unknown query')
    },
    (opts) => {
      for (let param of ['cursor', 'offset', 'count', 'order']) opts[param] = req.query[param]
      if (opts.list || opts.url) store.channel.withAccess(req, opts, flow.join(opts))
      else flow.next(opts, null, req.security.getUserAccess(req.user)) // t/:tag or ?owner=:id
    },
    (opts, channel, access) => flow.next(Object.assign(opts, {url: null, list: channel && channel.id}), channel, access),
    (opts, channel, access) => store.entry.list(req.user, access, opts, flow),
    (entries) => Entity.postprocess(req, entries, flow.send({items: entries})),
  ], coect.json.response(res))
}

module.exports = {
  create,
  data,
  detail,
  update,
  trash,
  purge,
  list,
  moderate
}
