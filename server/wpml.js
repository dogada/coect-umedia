'use strict';

var debug = require('debug')('umedia:wpml')

var wpml = require('wpml')


function nodeText(node) {
  while (node && node.block) node = node.value[0]
  return (node && node.value)
}

function nameFromContent(content) {
  for (var i = 0, node; (node = content[i++]); ) {
    if (!node.name || /^(name|p|h\d)$/.test(node.name)) return nodeText(node)
  }
}

function parseTags(meta) {
  if (!meta.tags) return
  var tags = meta.tags.split(',').slice(0, 3).map(t => t.trim())
  return Array.from(new Set(tags))
}

function truncate(str, maxLen, minLen) {
  var res = str.trim().slice(0, maxLen), lastSpace = res.lastIndexOf(' ')
  for (let sep of ['.', '?', '!', ';', ',', ' ']) {
    let i = res.lastIndexOf(sep)
    if (i > (minLen || maxLen/3)) {
      res = res.slice(0, i)
      break
    }
  }
  return res.trim()
}


exports.parse = function(text, opts, done) {
  var parsed = wpml.parse(text)
  var meta = parsed.attrs
  var content = parsed.value
  var name = meta.name || truncate(meta.title || nameFromContent(content) || '', opts.maxNameLength || 70)

  debug('content', content.length, name)
  done(null, {
    meta: meta,
    name: name,
    head: null,
    tags: parseTags(meta),
    content: content,
    text: text
  })
}
