'use strict';

var handlers = require('./handlers')

function baseRoutes(route, url) {
  route(url.entry('new'), handlers.entry.edit)
  route(url.entry(':id', 'edit'), handlers.entry.edit)
  route(url.entry(':parent', 'new'), handlers.entry.edit)
  route(url.entry(':id'), handlers.entry.details)

  route(url.channel(':list', 'entry'), handlers.entry.edit)

  route(url.channel('new'), handlers.channel.edit)
  route(url.channel('admin'), handlers.channel.admin)
  route(url.channel(':id'), handlers.channel.details)
  route(url.channel(':id', 'edit'), handlers.channel.edit)
}

/**
   Urls started with username, for example /dvd/blog/hello-world.
   Can be mounted to any root, for example /club/dvd/blog/hello-world.
*/
function slugRoutes(route, prefix) {
  route(prefix(':username/:cslug'), handlers.channel.details)
  route(prefix(':username/:cslug/:eslug'), handlers.entry.details)
  route(prefix(':username/:cslug/e/:id'), handlers.entry.details)
}

/**
   Supports routes without user prefix, i.e. /news/e/123 instead
   /username/news/e/123.
   For such mode server need to know default user that own all newspaper
   channels, it can be defined in `config.defaults.user`.
*/
function newspaperRoutes(route, prefix) {
  // user pages
  route(prefix('u/:username/:cslug'), handlers.channel.details)
  route(prefix('u/:username/:cslug/:eslug'), handlers.entry.details)
  route(prefix('u/:username/:cslug/e/:id'), handlers.entry.details)
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