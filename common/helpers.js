'use strict';

var debug = require('debug')('umedia:helpers')
var coect = require('coect')

exports.getAge = function(date) {
  return (date ? coect.dateDiff(date) : '')
}
