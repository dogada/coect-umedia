'use strict';

var debug = require('debug')('umedia:entity')
var tflow = require('tflow')
var coect = require('coect')
var Model = coect.orm.Model
var Access = coect.Access

var wpml = require('../wpml')

class Entity extends Model {

  constructor(props) {
    super(props)
    //Model.call(this, props)
  }

  toString() {
    return this.name || this.id
  }

  /**
     Get numeric access value for scope.
   */
  getAccess() {
    debug('getAccess', arguments, this.data.access)
    if (!this.data.access) return
    for (let scope of arguments) {
      var name = this.data.access[scope + '_access']
      var value = name && Access.nameValue(name)
      if (name) {
        if (typeof value === 'number') return value
        throw new Error(`Unknown access for ${scope}: ${name}`)
      }
    }
  }

}

Entity.LIST = 'list'
Entity.ENTRY = 'entry'
Entity.LIKE = 'like'


Entity.getChildType = function(data) {
  switch (data.type) {
  case 'channel': return 'post'
  case 'post': return 'comment'
  case 'comment': return 'reply'
  }
}


Entity.schema = {

  name: {
    isLength: {
      options: [3, 100],
      errorMessage: 'Name must be between 3 and 100 chars long'
    }
  },

  text: {
    optional: true,
    isLength: {
      options: [3, 1000],
      errorMessage: 'Text must be between 3 and 1000 chars long'
    }
  },

  slug: {
    optional: true,
    isLength: {
      options: [3, 50],
      errorMessage: 'Slug must be between 3 and 50 chars long'
    },
    matches: {
      options: [/^[a-z]+[a-z\d\-]*$/],
      errorMessage: 'Slug can contain latin letters in lower case (a-z), digits and hypen and should begin with a letter.'
    }
  }

}

/**
   Parse WPML-doc in data.text and merge doc.meta with data properties. Then
   validate against a schema.
*/
Entity.validate = function(data, opts, done) {
  if (!done) {
    done = opts
    opts = {}
  }
  var Klass = this

  tflow([
    function() {
      wpml.parse(data.text || '', {maxNameLength: opts.maxNameLength}, this)
    },
    function(doc) {
      var form = Object.assign({name: doc.name, head: doc.head}, 
                               doc.meta,
                               {meta: Object.assign({}, opts.meta, doc.meta)},
                               {tags: doc.tags}, data)
      debug('validate', form)
      Model.validate(form, opts.schema || Klass.schema, this.join(doc))
    }
  ], done)
}

Entity.makeUrl = function(parentUrl, slug) {
  debug('makeUrl', parentUrl, slug)
  return (parentUrl && slug ? parentUrl + '/' + slug : null)
}

function webmentionOwner(id, author) {
  return {
    type: 'webmention',
    id: id,
    name: author.name,
    avatar: author.photo,
    url: author.url
  }
}

Entity.fillUsers = function(entries, cache, done) {
  debug('fillUsers', entries.length)
  tflow([
    function() {
      cache.getUsers(Array.from(new Set(entries.map(e => e.owner))), this)
    },
    function(users) {
      debug('found users', Object.keys(users))
      for (let e of entries) {
        if (e.type === 'webmention') e.owner = webmentionOwner(e.owner, e.link && e.link.webmention.author || {})
        else e.owner = users[e.owner] || {id : e.owner}
      }
      this.next(entries)
    }
  ], done)
}

function list2map(items, key) {
  var map = {}
  for (var item of items) map[item[key || 'id']] = item
  return map
}

Entity.appendUserFlags = function(items, user, done) {
  debug('appendUserFlags', items.length, user && user.id)
  var flow = tflow([
    () => {
      if (!user) return flow.complete(items)
      var listId = user.getListId(Entity.LIKE)
      if (!listId) return flow.complete(items)
      var ids = items.filter(item => !item.ref).map(item => item.id)
      if (!ids.length) return flow.complete(items)
      Entity.table(listId).whereIn('ref', ids).andWhere('list', listId).select('ref', 'access').asCallback(flow)
    },
    (likes) => {
      debug('found likes', likes.length)
      var likeMap = list2map(likes, 'ref')
      for (var entity of items) {
        var like = likeMap[entity.id]
        if (like) entity[(like.access >= Access.EVERYONE ? 'liked' : 'saved')] = true
      }
      flow.next(items)
    }
  ], done)
}

Entity.resolveRefs = function(items, done) {
  debug('resolveRefs', items.length)

  var ids = items.map(item => item.ref).filter(id => id)
  var flow = tflow([
    () => {
      if (!ids.length) return flow.complete(items)
      Entity.table().whereIn('id', ids).asCallback(flow)
    },
    (refs) => {
      debug(`found ${refs.length} refs from ${ids.length}`)
      var objects = list2map(refs, 'id')
      var resolved = items.map(item => {
        if (!item.ref) return item
        var obj = objects[item.ref]
        if (obj && obj.access >= item.access) return obj
        return item
      })
      flow.next(resolved)
    }
  ], done)
}

/**
   Update items in-place. Append user info and 'liked', 'saved' flags.
*/
Entity.postprocess = function(req, items, done) {
  debug('postprocess', items.length)
  var flow = tflow([
    () => Entity.resolveRefs(items, flow),
    (resolved) => Entity.fillUsers(resolved, req.app.userCache, flow),
    (filled) => Entity.appendUserFlags(filled, req.user, flow)
  ], done)
}

/*
  Parse access related fields from wpml and save them in entity.data.access.
  Always set data.access to an user-value or default value.
*/
Entity.applyAccess = function(data, userAccess, maxAccess, defaultAccess, done) {
  if (defaultAccess !== Access.MODERATION && 
      (defaultAccess < userAccess || defaultAccess > maxAccess)) return done(
    new coect.HttpError(400, `Invalid default access ${defaultAccess} (${Access.valueName(defaultAccess)})`))

  var parsed = {}
  for (let name of ['access', 'write_access', 'post_access', 'comment_access', 'guest_access',
                    'write_post_access', 'write_comment_access']) {
    var accessName = data[name]
    if (accessName === undefined) continue
    var access = Access.nameValue(accessName)
    var maxAccessName = Access.valueName(maxAccess)
    debug(`apply access ${name}: ${accessName}->${access}, user=${userAccess}, max=${maxAccess}`)
    if (typeof access !== 'number') return done(new coect.HttpError(400, `Invalid ${name}: ${accessName}`))
    if (access < userAccess) return done(new coect.HttpError(403, `Insufficient permissions for ${name}: ${accessName}`))
    if (access > maxAccess) return done(new coect.HttpError(403, `Invalid ${name}: ${accessName} > ${maxAccessName}`))
    debug(`Accepted ${name}: ${accessName}`)
    parsed[name] = accessName
  }
  // set access always because user may remove !access from wpml and we need to
  // reset it to the default then
  data.access = (parsed.access ? Access.nameValue(parsed.access) : defaultAccess)
  data.accessData = parsed
  done(null, data)
}

Entity.stat = function(done) {
  this.table()
    .select('model', 'type', this.raw('COUNT(*) AS count'), this.raw('MAX(created) AS last_created'))
    .groupBy('model', 'type').orderByRaw('model, last_created DESC')
    .asCallback(done)
}

module.exports = Entity
