'use strict';

var debug = require('debug')('umedia:entity')
var tflow = require('tflow')
var coect = require('coect')
var Model = coect.orm.Model

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

// user roles inside channel (used to control access to channel entries)
Object.assign(Entity, {
  // 0 means default undefined access
  ADMIN: 10,  // site-wide or this channel admin 
  MODERATOR: 20, // site-wide or channel moderator
  TAG: 30, // users tagged with an accessTag by channel owner (Friends, Family, etc)
  MEMBER: 40,  // site-wide member or a channel member
  FOLLOWER: 50, // channel follower (subscriber)
  USER: 60,   // logged in user (in most cases a human)
  VISITOR: 70 //any visitor of site including spider
})

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
      debug('combied', combined, 'doc', doc, data)
      Model.validate(combined, opts.schema || Klass.schema, this.join(doc))
    }
  ], done)
}

Entity.makeUrl = function(parentUrl, slug) {
  debug('makeUrl', parentUrl, slug)
  return (parentUrl && slug ? parentUrl + '/' + slug : null)
}

module.exports = Entity
