'use strict';

var debug = require('debug')('umedia:index')
var riot = require('riot')
var handlers = require('./handlers')
var routes = require('./routes')

/**
   Init app and integrate it into the site.
   @param {object} opts
   @param {Site} site
*/
function init(opts) {
  debug('init', opts)
  riot.mixin('umedia-context', $.extend(require('./helpers'), {
    url: opts.url,
  }))
  routes(opts.route, opts);
}


module.exports = {
  init: init,
  handlers: handlers
}

