var debug = require('debug')('umedia:entry')
var tflow = require('tflow')
var coect = require('coect')

var Entity = require('./models').Entity
var Channel = require('./models').Channel
var Entry = require('./models').Entry
var Access = coect.Access

var store = require('./store')
var misc = require('./misc')

exports.detail = function (req, res, next) {
  var flow = tflow([
    () => {
      if (req.params.id) flow.next({list: req.params.id}) // c/:id/t/:tag
      else if (req.params.username) flow.next({ // :username/:cslug/t/:tag
        url: req.params.username + '/' + req.params.cslug
      })
      else flow.next({})
    },
    (opts) => {
      opts.tab = req.params.tab || 'top'
      opts.tag = req.params.tag && req.params.tag.toLowerCase() 
      if (req.user && opts.tab === 'my') opts.owner = req.user.id
      opts.order = misc.getTabOrder(opts.tab)
      if (opts.list || opts.url) store.channel.withAccess(req, opts, flow.join(opts))
      else flow.next(opts, null, req.security.getUserAccess(req.user)) // t/:tag or ?owner=:id
    },
    (opts, channel, access) => flow.next(Object.assign(opts, {url: null, list: channel && channel.id}), channel, access),
    (opts, channel, access) => store.entry.list(req.user, access, opts, flow.join(opts, channel)),
    (opts, channel, entries) => store.category.getChannel(opts.tag, flow.join(opts, channel, entries)),
    (opts, channel, entries, category) => Entity.postprocess(
      req, entries.concat(channel, category).filter(e => e), flow.join(opts, channel, category)),
    (opts, channel, category, entries) => flow.next({
      content: {
        tag: 'coect-category-detail', 
        opts: {
          items: entries.filter(e => e.model !== Channel.MODEL),
          category: category || {name: opts.tag},
          channel: channel,
          params: req.params,
          tab: opts.tab,
          order: opts.order
        }
      },
      title:  (channel ? channel.name + ' / ' + opts.tag : opts.tag),
      //canonicalUrl: req.coect.urls.user(user)
    })
  ], coect.janus(req, res, next))
}
