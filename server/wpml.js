var debug = require('debug')('umedia:wpml')

var wpml = require('wpml')


function nameFromContent(content, limit) {
  var first = content[0]
  while (first && first.block) first = first.value[0]
  return (first && first.value || '').slice(0, limit)
}

exports.parse = function(text, opts, done) {
  var parsed = wpml.parse(text)
  var meta = parsed.attrs
  var content = parsed.value
  debug('content', content.length, content[0], nameFromContent(content))
  done(null, {
    meta: meta,
    name: meta.name || nameFromContent(content, opts.maxNameLength || 50),
    head: null,
    tags: [],
    content: content,
    text: text
  })
}
