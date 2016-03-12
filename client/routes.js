'use strict';

var handlers = require('./handlers')
var slug = require('coect').routes.slug

function baseRoutes(route, url) {
  route(url.entry(':id', 'edit'), handlers.entry.edit)
  route(url.entry(':parent', 'new'), handlers.entry.edit)
  route(url.entry(':id'), handlers.entry.details)

  route(url.channel(':list', 'entry'), handlers.entry.edit)

  route(url.channel('_/new'), handlers.channel.edit)
  route(url.channel('_/admin'), handlers.channel.admin)
  route(url.channel(':id'), handlers.channel.details)
  route(url.channel(':id', 'edit'), handlers.channel.edit)

  route(url.user(':id'), handlers.user.detail)

  route(url.category(':category'), handlers.category.detail)

  route(url.my(':filter'), handlers.my.index)
  route(url.my(), handlers.my.index)
}

/**
   Urls started with username, for example /dvd/blog/hello-world.
   Can be mounted to any root, for example /club/dvd/blog/hello-world.
*/
function slugRoutes(route, prefix) {
  route(prefix(slug('username')), handlers.user.detail)
  route(prefix(slug('username') + slug('cslug')), handlers.channel.details)
  route(prefix(slug('username') + slug('cslug')) + '/t/:category', handlers.category.detail)

  route(prefix(slug('username') + slug('cslug') + slug('eslug')), handlers.entry.details)
  route(prefix(slug('username') + slug('cslug') + '/e/:id'), handlers.entry.details)
}

/**
   Supports routes without user prefix, i.e. /news/e/123 instead
   /username/news/e/123.
   For such mode server need to know default user that own all newspaper
   channels, it can be defined in `config.defaults.user`.
*/
function newspaperRoutes(route, prefix) {
  // user pages
  route(prefix('~/:username/:cslug'), handlers.channel.details)
  route(prefix('~/:username/:cslug/:eslug'), handlers.entry.details)
  route(prefix('~/:username/:cslug/e/:id'), handlers.entry.details)
  // default user pages
  route(prefix(':cslug'), handlers.channel.details)
  route(prefix(':cslug/:eslug'), handlers.entry.details)
  route(prefix(':cslug/e/:id'), handlers.entry.details)
}


module.exports = function(route, opts) {
  baseRoutes(route, opts.url)

  function prefix(path) {
    return opts.url.base({url: path})
  }
  if (opts.slug) slugRoutes(route, prefix)
  else if (opts.newspaper) newspaperRoutes(route, prefix)
}
