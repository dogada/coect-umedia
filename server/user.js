'use strict';

var debug = require('debug')('umedia:user')
var tflow = require('tflow')
var coect = require('coect')

exports.retrieve = function(req, res, next) {
  debug('retrieve xhr=', req.xhr, req.params)
  tflow([
    function() {
      var p = req.params
      if (p.id) req.env.User.get(p.id, this)
      else req.env.User.get({username: p.username}, this)
    }
  ], req.app.janus(req, res, next))
}
