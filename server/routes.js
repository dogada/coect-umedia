'use strict';

var debug = require('debug')('umedia:router')
var coect = require('coect')

var entry = require('./entry')
var channel = require('./channel')

function loginRequired(req, res, next) {
  debug('loginRequired', req.isAuthenticated())
  if (req.isAuthenticated()) return next()
  else if (res.headersSent) return next(401)
  else res.status(401).send('Login required')
}

function adminRequired(req, res, next) {
  debug('adminRequired', req.isAuthenticated())
  if (req.isAuthenticated() && req.user.isAdmin()) next()
  else next(401, coect.HttpError('Admin required'))
}

/**
   Short urls for channels and entries with slugs.
*/
function slugRoutes(r) {
  r.get('/:username/:cslug', channel.retrieve)
  r.get('/:username/:cslug/:eslug', entry.retrieve)
  r.get('/:username/:cslug/e/:id', entry.retrieve)
}

module.exports = function(r) {
  r.route('/e/')
    .get(entry.list)
    .post(loginRequired, entry.create)

  r.route('/e/:id')
    .get(entry.retrieve)
    .put(loginRequired, entry.update)
    .delete(loginRequired, entry.remove)

  r.route('/c/')
    .get(channel.list)
    .post(adminRequired, channel.create)

  r.route('/c/:id')
    .get(channel.retrieve)
    .put(loginRequired, channel.update)
    .delete(loginRequired, channel.remove)

  slugRoutes(r)
  return r
}


