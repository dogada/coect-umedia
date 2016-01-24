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

}

Entity.schema = {

  name: {
    isLength: {
      options: [3, 80],
      errorMessage: 'Name must be between 3 and 80 chars long'
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
      options: [3, 30],
      errorMessage: 'Slug must be between 3 and 30 chars long'
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
      debug('combied', combined, 'doc', doc, 'data', data)
      Model.validate(combined, opts.schema || Klass.schema, this.join(doc))
    }
  ], done)
}

Entity.makeUrl = function(parentUrl, slug) {
  debug('makeUrl', parentUrl, slug)
  return (parentUrl && slug ? parentUrl + '/' + slug : null)
}

Entity.fillUsers = function(entries, cache, done) {
  tflow([
    function() {
      cache.getUsers(Array.from(new Set(entries.map(e => e.owner))), this)
    },
    function(users) {
      debug('found users', Object.keys(users))
      for (let e of entries) e.owner = users[e.owner] || {id: e.owner}
      this.next(entries)
    }
  ], done)
}

Entity.applyAccess = function(data, userAccess, maxAccess, done) {
  if (!data.access) return done(null, data)
  var access = Access.nameValue(data.access)
  var maxAccessName = Access.valueName(maxAccess)
  debug('apply access', data.access, access, userAccess, maxAccess)

  if (typeof access !== 'number') return done(new coect.HttpError(400, `Invalid access: ${data.access}`))
  if (access < userAccess) return done(new coect.HttpError(403, `Insufficient permissions to change access to ${data.access}`))
  if (access > maxAccess) return done(new coect.HttpError(403, `Invalid access: ${data.access} > ${maxAccessName}`))
  debug(`Changing access from ${data.access} to ${access}`)
  data.access = access
  done(null, data)
}

module.exports = Entity
