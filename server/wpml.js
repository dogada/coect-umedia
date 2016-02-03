var debug = require('debug')('umedia:wpml')

var wpml = require('wpml')


function nodeText(node) {
  while (node && node.block) node = node.value[0]
  return (node && node.value)
}

function nameFromContent(content, limit) {
  var first = content[0]
  for (var i = 0, node; (node = content[i++]); ) {
    if (!node.name || node.name === 'p' || /^h\d$/.test(node.name)) return nodeText(node)
  }
}

exports.parse = function(text, opts, done) {
  var parsed = wpml.parse(text)
  var meta = parsed.attrs
  var content = parsed.value
  var name = meta.name || (meta.title || nameFromContent(content) || '').slice(0, opts.maxNameLength || 50)
  debug('content', content.length, content[0], nameFromContent(content))
  done(null, {
    meta: meta,
    name: name,
    head: null,
    tags: [],
    content: content,
    text: text
  })
}
