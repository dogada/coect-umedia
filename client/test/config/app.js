// Fake client application to test coect-umedia

var riot = require('riot')
var page = require('page')
var path = require('path')
var coect = require('coect')
var umedia = require('../../')

// init tags mixins
coect.mixins.register()

//TODO remove
riot.mixin('coect-site-context', {
}) // overwrite riot tag properties 


/**
   Build full url from path fragments.
   @param {(string|string[]} path or path fragments
   @params {object} [query] Query string part
   @return {string} Full url.
*/
function urlBuilder(base, translator) {
  return function(obj) {
    if (typeof obj === 'undefined') return base
    var parts = [base].concat($.map(arguments, translator))
    var res = path.join.apply(path, parts)
    return res
  }
}

/**
   Append prefix to base path if first argument isn't objet with custom url.
*/
function prefixOrUrl(base, prefix) {
  return function(obj) {
      var args = Array.prototype.slice.apply(arguments)
      if (!obj || !obj.url) args.unshift(prefix)
      return base.apply(base, args)
  }
}

function urlIdTranslator(obj) {
  var value = obj.url || obj.id || obj
  // coerce numbers to string automatically
  if (typeof value === 'number') value = value.toString(10)
  if (typeof value !== 'string') console.error(
    'Resolved url fragment isn\'t a string: ', value, ', source: ', obj)
  return value
}

function identityTranslator(obj) {
  return obj
}

function umediaUrls(base) {
  return {
    base: base,
    entry: prefixOrUrl(base, 'e'),
    channel: prefixOrUrl(base, 'c'),
    user: prefixOrUrl(base, 'u'),
  }
}

Site.umedia = require('../../app')
Site.umedia.url = umediaUrls(urlBuilder('/', urlIdTranslator))

umedia.init({route: page, url: Site.umedia.url, slug: true, newspaper: false})


var debugModule = require('debug')
debugModule.log = console.info.bind(console)
debugModule.useColors = function() {
  return false
}
debugModule.enable('*,umedia:,-wpml:*')
// make debug available for riot tags
window.debug = debugModule('root')