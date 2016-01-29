'use strict';

var moment = require('moment')
var coect = require('coect')
var _wpml = require('wpml')

var debug = require('debug')('umedia:helpers')

exports.getAge = function(date) {
  return (date ? moment(date || 0).fromNow() : '')
}

var WPML_OPTS = {
  javascript: false,
  plugins: require('./plugins'),
  //linkPlugin: 'oembed',
  whitelist: 'iframe p div h2 h3 h4 a code pre br hr img ul ol li dl dt dd small em b i strong span sub sup cite abbr section aside blockquote q',
  idTest: /^wp[\w]+/,
  classTest: /^(wp-[\w-]+|lead|small)/
}

exports.wpml = {
  doc: function(text) {
    //debug('wpml.doc', text.slice(0, 20))
    return _wpml.doc(text, WPML_OPTS)
  }
}





