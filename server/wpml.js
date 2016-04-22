'use strict';

var debug = require('debug')('umedia:wpml')

var wpml = require('wpml')
var coect = require('coect')

var MAX_ENTRY_TAG_COUNT = 5

function nodeText(node) {
  while (node && node.block) node = node.value[0]
  return (node && node.value)
}

function nameFromContent(content) {
  for (var i = 0, node; (node = content[i++]); ) {
    if (!node.name || /^(name|p|h\d)$/.test(node.name)) return nodeText(node)
  }
}

function summaryFromContent(content) {
  for (var i = 0, node; (node = content[i++]); ) {
    if (/^(summary)$/.test(node.name)) return nodeText(node)
  }
}

function parseTags(meta, text) {
  var tags = (meta.tags && meta.tags.split(',') || []).concat(wpml.hashtags(text))
  tags = Array.from(new Set(tags.map(t => t.trim().toLowerCase())))
  debug('parseTags', tags)
  return tags.slice(0, MAX_ENTRY_TAG_COUNT)
}


exports.parse = function(text, opts, done) {
  var parsed = wpml.parse(text)
  var content = parsed.value
  var meta = coect.object.assign({}, {p_count: content.length}, parsed.attrs)
  var name = meta.name || coect.util.truncate(meta.title || nameFromContent(content) || '',
                                              opts.maxNameLength)
  var summary = summaryFromContent(content) || nameFromContent(content)
  debug('content.length', content.length, 'name.length', name.length, name)
  done(null, {
    meta: meta,
    name: name,
    head: summary,
    tags: parseTags(meta, text),
    content: content,
    text: text
  })
}
