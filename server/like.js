var debug = require('debug')('umedia:like')
var tflow = require('tflow')
var Channel = require('./models').Channel
var Entry = require('./models').Entry
var Entity = require('./models').Entity

var coect = require('coect')
var Access = coect.Access
var store = require('./store')
var misc = require('./misc')

function likeStatus(access, likeCount) {
  return {
    liked: (access === Access.EVERYONE),
    saved: (access === Access.HIDDEN),
    like_count: likeCount
  }
}

var upsert = function(visible, user, entity, done) {
  var access = (visible ? Access.EVERYONE : Access.HIDDEN)
  debug('create', visible, access, user, entity)
  var flow = tflow([
    () => {
      if (entity.ref) flow.fail(400, 'Can\'t like a reference.')
      else flow.next()
    },
    () => Channel.getOrCreateType(user, Entity.LIKE, flow),
    (list) => Entity.findOne({
      list: list.id,
      ref: entity.id,
      rel: Entity.LIKE,
    }, flow.join(list)),
    (list, like) => {
      if (like && like.access === access) return flow.complete(likeStatus(access))
      else if (!like) Entity.create({
        list: list.id,
        owner: user.id,
        ref: entity.id,
        rel: Entity.LIKE,
        name: '',
        recipient: entity.owner,
        model: entity.model,
        type: entity.type,
        access: access,
        tags: entity.tags
      }, user.id, flow)
      else Entity.update(like.id, {access: access}, flow)
    },
    () => store.entry.updateLikeCount(entity, flow),
    () => Entity.table(entity.id).select('like_count').where('id', entity.id).first().asCallback(flow),
    (res) => {
      flow.next(likeStatus(access, res.like_count))
    }
  ], done)
}

var remove = function(user, entity, done) {
  var listId = user.getListId(Entity.LIKE)
  debug('remove', user, entity)
  var flow = tflow([
    () => {
      if (!listId) return flow.complete({})
      Entity.remove({
        list: listId,
        ref: entity.id,
        rel: Entity.LIKE
      }, flow)
    },
    (res) => {
      debug('res', res)
      if (res.count) store.entry.updateLikeCount(entity, flow)
      else flow.next()
    },
    () => Entity.table(entity.id).select('like_count').where('id', entity.id).first().asCallback(flow),
    (res) => {
      flow.next(likeStatus(null, res.like_count))
    }
  ], done)
}


exports.likeEntry = function(req, res) {
  debug('likeEntry', req.params)
  var flow = tflow([
    () => misc.getEntryAndChannel(req, flow),
    (entry, channel) => upsert(req.params.action === 'like', req.user, entry, flow)
  ], coect.json.response(res))
}

exports.unlikeEntry = function(req, res) {
  debug('unlikeEntry', req.params)
  var flow = tflow([
    () => misc.getEntryAndChannel(req, flow),
    (entry, channel) => remove(req.user, entry, flow)
  ], coect.json.response(res))
}
