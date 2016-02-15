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
      wpml.parse(data.text || '', {maxNameLength: opts.maxNameLength || 50}, this)
    },
    function(doc) {
      var combined = Object.assign({name: doc.name}, doc.meta, data)
      //debug('validate', opts.schema)
      Model.validate(combined, opts.schema || Klass.schema, this.join(doc))
    }
  ], done)
}

Entity.makeUrl = function(parentUrl, slug) {
  debug('makeUrl', parentUrl, slug)
  return (parentUrl && slug ? parentUrl + '/' + slug : null)
}

function webmentionOwner(author) {
  return {
    type: 'webmention',
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
        e.owner = (e.type === 'webmention' ? webmentionOwner(e.link.webmention.author) : users[e.owner]) || {id : e.owner}
      }
      this.next(entries)
    }
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

module.exports = Entity
