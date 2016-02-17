'use strict';

var {ui} = require('coect')

var store = require('./store')

exports.detail = ui.tagsView(store.category)
