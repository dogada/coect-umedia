'use strict';

var debug = require('debug')('umedia:riot')
var riot = require('riot')
var coect = require('coect')

/**
   Init app and integrate it into the site.
   @param {object} opts
*/
exports.init = function(opts) {
  debug('umedia init', opts)
  riot.mixin('umedia-context', coect.object.assign(require('./helpers'), opts, {
    wpml: opts.wpml || require('./wpml'),
    coect
  }))
}
