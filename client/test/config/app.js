// Fake client application to test coect-umedia

var riot = require('riot')
var page = require('page')
var path = require('path')
var coect = require('coect')
var umedia = require('../../')


// http://riotjs.com/forum/#!/using:debugging-troubleshooting/have-you-tried-riotut
// riot.util.tmpl.errorHandler = function(err) { 
//   console.error('Error in a riot template during test:', err) 
// }

// init tags mixins
coect.mixins.register()

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
   Append prefix to base path if first argument isn't object with custom url (or
   username).
*/
function prefixOrUrl(base, prefix) {
  return function(obj) {
    var args = Array.prototype.slice.apply(arguments)
    if (!obj || (!obj.url && !obj.username)) args.unshift(prefix)
    return base.apply(base, args)
  }
}

function urlIdTranslator(obj) {
  var value = obj.url || obj.username || obj.id || obj
  // coerce numbers to string automatically
  if (typeof value === 'number') value = value.toString(10)
  if (typeof value !== 'string') console.error(
    'Resolved url fragment isn\'t a string: ', value, ', source: ', obj)
  return value
}

function identityTranslator(obj) {
  return obj
}

function profilePhoto(photos, size) {
  return size >= 64 && photos.large ||
    size > 24 && size < 64 && photos.normal ||
    size > 16 && size <= 24 && (photos.mini || photos.normal) ||
    size <= 16 && (photos.micro || photos.mini || photos.normal) ||
    photos.original
}

Site.account = {
  avatar: function(user, size) {
    if (user.profile && user.profile.photos) return profilePhoto(user.profile.photos, size)
    else return user.avatar || ('/_static/img/avatar_' + (size || 32) + '.png')
  }
}

Site.umedia = require('../../app')


/**
   Return NodeJs style callback that calls Site.error on error or `fn` otherwise.
*/
Site.callback = function(fn) {
  return function(err, ...rest) {
    if (err) return Site.error(err)
    fn(...rest)
  }
}

var base = urlBuilder('/', urlIdTranslator)

var urls = {
  base: base,
  entry: prefixOrUrl(base, 'e'),
  channel: prefixOrUrl(base, 'c'),
  user: prefixOrUrl(base, 'u'),
  category: prefixOrUrl(base, 't'),
  my: prefixOrUrl(base, 'my'),
  avatar: Site.account.avatar
}

umedia.riot.init({
  url: urls, 
  debug: require('debug')('umedia:tag'),
  store: require('../../store')
})

umedia.routes(page, {
  slug: true, 
  newspaper: false,
  url: urls
})

var debugModule = require('debug')
debugModule.log = console.info.bind(console)
debugModule.useColors = function() {
  return false
}
debugModule.enable('*,umedia:,-wpml:*')
// make debug available for riot tags
window.debug = debugModule('root')
