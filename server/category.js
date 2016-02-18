var debug = require('debug')('umedia:entry')
var tflow = require('tflow')
var coect = require('coect')

var Entity = require('./models').Entity
var Channel = require('./models').Channel
var Entry = require('./models').Entry
var Access = coect.Access

var store = require('./store')

exports.detail = function (req, res, next) {
  var flow = tflow([
    () => {
      if (req.params.id) flow.next({list: req.params.id, tag: req.params.tag}) // c/:id/t/:tag
      else if (req.params.username) flow.next({ // :username/:cslug/t/:tag
        url: req.params.username + '/' + req.params.cslug,
        tag: req.params.tag
      })
      else if (req.params.tag) flow.next({tag: req.params.tag})
      else flow.fail(400, 'Unknown query')
    },
    (opts) => {
      if (opts.list || opts.url) store.channel.withAccess(req, opts, flow.join(opts))
      else flow.next(opts, null, req.security.getUserAccess(req.user)) // t/:tag or ?owner=:id
    },
    (opts, channel, access) => flow.next(Object.assign(opts, {url: null, list: channel && channel.id}), channel, access),
    (opts, channel, access) => store.entry.list(req.user, access, opts, flow.join(opts, channel)),
    (opts, channel, entries) => Entity.fillUsers(channel ? entries.concat(channel) : entries,
                                                 req.app.userCache, flow.send(opts, channel, entries)),
    (opts, channel, entries) => flow.next({
      content: {tag: 'coect-category-detail', opts: {items: entries, category: opts.tag, channel}},
      title:  (channel ? channel.name + ' / ' + opts.tag : opts.tag),
      //canonicalUrl: req.coect.urls.user(user)
    })
  ], coect.janus(req, res, next))
}
