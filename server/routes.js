'use strict';

var debug = require('debug')('umedia:router')
var coect = require('coect')

var entry = require('./entry')
var channel = require('./channel')
var user = require('./user')

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

// return named slug with regular expression
function slug(param) {
  return '/:' + param + '([a-z]+[a-z0-9-]{2,})'
}
/**
   Short urls for channels and entries with slugs.
*/
function slugRoutes(r) {
  r.get(slug('username'), user.retrieve)
  r.get(slug('username') + slug('cslug'), channel.retrieve)
  r.get(slug('username') + slug('cslug') + slug('eslug'), entry.retrieve)
  r.get(slug('username') + slug('cslug') + '/e/:id', entry.retrieve)
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

  r.route('/u/:id')
    .get(user.retrieve)

  slugRoutes(r)
  return r
}


