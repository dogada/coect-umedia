'use strict';

var debug = require('debug')('auth:user')
var tflow = require('tflow')
var Entity = require('./entity')

class Entry extends Entity {

  constructor(props) {
    super(props)
  }

  toString() {
    return this.name || this.id
  }

}

Entry.MODEL = 'entry'
Entry.POST = 'post'
Entry.COMMENT = 'comment'
Entry.REPLY = 'reply'
Entry.listFields = ['id', 'type', 'owner', 'name', 'text', 'url', 'access', 'count', 'child_count', 'created', 'list', 'parent', 'recipient']
Entry.detailFields = Entry.listFields.concat(['version', 'topic', 'thread'])

Entry.postSchema = Object.assign({}, Entity.schema, {
  text: {
    isLength: {
      options: [3, 50000],
      errorMessage: 'Text must be between 3 and 50,000 chars long'
    }
  }
})

Entry.getTypeSchema = function(type) {
  return (type === Entry.POST ? Entry.postSchema : Entry.schema)
}

module.exports = Entry
