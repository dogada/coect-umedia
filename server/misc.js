var Channel = require('./models').Channel
var Entry = require('./models').Entry
var tflow = require('tflow')

function entryWhere(req) {
  if (req.params.id) return {id: req.params.id}
  else return {url: [req.params.username, req.params.cslug, req.params.eslug].join('/')}
}

exports.getEntryAndChannel = function(req, done) {
  var flow = tflow([
    () => Entry.get(entryWhere(req), {select: '*'}, flow),
    (entry) => Channel.get(entry.list, {select: '*'}, flow.join(entry)),
    (entry, channel) => {
      if (!req.security.canUserViewChannel(req.user, channel)) return flow.fail(403, 'Access to the channel is forbidden')
      if (!req.security.canUserView(req.user, entry, channel)) return flow.fail(403, 'Access to the entry is forbidden')
      flow.next(entry, channel)
    }
  ], done)
}
