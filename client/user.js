'use strict';

var debug = require('debug')('umedia:profile')
var tflow = require('tflow')

var {ui} = require('coect')
var store = require('./store')

exports.detail = ui.tagsView(store.user)
