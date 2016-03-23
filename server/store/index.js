'use strict';

var ChannelStore = require('./channel')
var EntryStore = require('./entry')
var CategoryStore = require('./category')

module.exports = {
  channel: new ChannelStore(),
  entry: new EntryStore(),
  category: new CategoryStore()
}
