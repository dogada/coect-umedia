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
Entry.WEBMENTION = 'webmention'

Entry.listFields = [
  'id', 'model', 'type', 'owner', 
  'name', 'head', 'text', 
  'url', 'access',
  'count', 'child_count', 'like_count',
  'created', 'link', 'tags', 'meta',
  'list', 'parent', 'recipient', 'topic', 'thread',
  'source', 'target', 'ref', 'rel'
]

Entry.detailFields = Entry.listFields.concat(['version'])

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

function parentData(parent) {
  debug('parentData', parent)
  var data = {
    parent: parent.id,
    list: parent.list || parent.id
  }
  if (parent.model !== 'channel') {
    data.topic = parent.topic || parent.id
    if (!parent.thread || parent.thread === parent.topic) data.thread = parent.id
    else data.thread = parent.thread
  }
  return data
}

Entry.makeVersion = function() {
  return new Date().toISOString()
}

Entry.create = function(form, parent, done) {
  Entity.create(Object.assign({
    model: Entry.MODEL,
    version: Entry.makeVersion(),
    data: form.data || {},
  }, parentData(parent), form), parent.list || parent.id, done)
}

Entry.recipientMeta = function(parent, recipient) {
  var meta = {}
  var wm = parent.link && parent.link.webmention
  if (wm) {
    meta.reply_to = wm.url || wm.source
    meta.reply_to_name = wm.author && wm.author.name
  } else if (parent.model === Entry.MODEL && recipient) {
    meta.reply_to_name = recipient.name
  }
  debug('parentMeta', parent.model, parent.type, meta)
  return meta
}


module.exports = Entry
