'use strict';

var config = require('./config')

function init(opts) {
  Object.assign(config, opts)
}

module.exports = {
  init: init,
  routes: require('./routes'),
  models: require('./models'),
  entry: require('./entry'),
  channel: require('./channel'),
  user: require('./user'),
  security: require('./security'),
  wpml: require('../common/wpml'),
  riot: require('../common/riot'),
  config: config,
  webmention: require('./webmention'),
  store: require('./store')
}
