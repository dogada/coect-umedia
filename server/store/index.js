'use strict';

var ChannelStore = require('./channel')
var EntryStore = require('./entry')

console.log('ChannelStre', ChannelStore)

module.exports = {
  channel: new ChannelStore(),
  entry: new EntryStore()
}
