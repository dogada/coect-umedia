var debug = require('debug')('umedia:entry')
var tflow = require('tflow')
var coect = require('coect')

var Entity = require('./models').Entity
var Channel = require('./models').Channel
var Entry = require('./models').Entry
var Access = coect.Access

var store = require('./store')
var misc = require('./misc')

function channelWithAccess(req, done) {
  // channel is optional for /t/:tag and will be present for /c/:id/t/:tag
  if (req.params.id) store.channel.withAccess(req, {id: req.params.id}, done)
  else if (req.params.username) store.channel.withAccess(req, {url: req.params.username + '/' + req.params.cslug}, done)
  else done(null, null, req.security.getUserAccess(req.user))
}

exports.detail = function (req, res, next) {
  var tag = req.params.tag && req.params.tag.toLowerCase()
  var tab = req.params.tab || 'top'
  var order = misc.getTabOrder(tab)
  var flow = tflow([
    () => store.category.getChannel(tag, flow),
    (category) => channelWithAccess(req, flow.join(category || {name: tag})),
    (category, channel, access) => {
      var query = {order}
      if (channel) Object.assign(query, {list: channel.id, tag: tag})
      else if (category.id) query.list = category.id 

      // for both /t/:tag and /c/:id/t/:tag
      if (req.user && tab === 'my') query.owner = req.user.id

      if (query.list) store.entry.list(req.user, access, query, flow.join(category, channel))
      else flow.next(category, channel, [])
    },
    (category, channel, entries) => Entity.postprocess(
      req, entries.concat(channel, category).filter(e => e), flow.join(category, channel)),
    (category, channel, entries) => flow.next({
      content: {
        tag: 'coect-category-detail', 
        opts: {
          items: entries.filter(e => e.id && e.model !== Channel.MODEL),
          category: category,
          channel: channel,
          params: req.params,
          tab: tab,
          order: order
        }
      },
      title:  (channel ? channel.name + ' / ' + tag : tag),
    })
  ], coect.janus(req, res, next))
}
