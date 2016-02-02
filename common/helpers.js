'use strict';

var debug = require('debug')('umedia:helpers')
var moment = require('moment')


exports.getAge = function(date) {
  return (date ? moment(date || 0).fromNow() : '')
}
