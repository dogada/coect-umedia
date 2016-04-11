'use strict';

var debug = require('debug')('umedia:router')
var coect = require('coect')
var slug = coect.routes.slug
var entry = require('./entry')
var channel = require('./channel')
var user = require('./user')
var category = require('./category')
var webmention = require('./webmention')
var broadcast = require('./broadcast')
var like = require('./like')

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
  r.get(slug('username'), user.detail)
  r.get(slug('username') + slug('cslug'), channel.detail)
  r.get(slug('username') + slug('cslug') + slug('eslug'), entry.detail)
  r.get(slug('username') + slug('cslug') + '/e/:id', entry.detail)
  r.get(slug('username') + slug('cslug') + '/t/:tag', category.detail)
}

module.exports = function(r) {
  r.post('/_/umedia/webmentionio_hook', webmention.webmentionIoHook)

  r.route('/e/')
    .get(entry.list)
    .post(loginRequired, entry.create)

  r.route('/e/:id')
    .get(entry.detail)
    .put(loginRequired, entry.update)
    .delete(loginRequired, entry.purge)

  r.route('/e/:id/trash')
    .post(loginRequired, entry.trash)

  r.route('/e/:id/:action(accept|reject)')
    .post(loginRequired, entry.moderate)

  r.route('/:model(e|c)/:id/:action(like|save)')
    .post(loginRequired, like.like)
    .delete(loginRequired, like.unlike)

  r.get('/e/:id/likes', like.list)

  r.route('/e/:id/broadcast')
    .post(loginRequired, broadcast.broadcast)

  r.route('/e/:id/data')
    .get(entry.data)

  r.route('/c/')
    .get(channel.list)
    .post(adminRequired, channel.create)

  r.route('/c/:id')
    .get(channel.detail)
    .put(loginRequired, channel.update)
    .delete(loginRequired, channel.trash)

  r.route('/c/:id/permissions')
    .get(loginRequired, channel.permissions)

  r.route('/c/:id/data')
    .get(channel.data)

  r.route('/c/:id/t/:tag')
    .get(category.detail)

  r.route('/t/:tag')
    .get(category.detail)

  r.route('/t/:tag/:tab')
    .get(category.detail)


  r.route('/u/:id')
    .get(user.detail)

  slugRoutes(r)

  return r
}

