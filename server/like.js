var debug = require('debug')('umedia:like')
var tflow = require('tflow')
var Channel = require('./models').Channel
var Entry = require('./models').Entry
var Entity = require('./models').Entity

var coect = require('coect')
var Access = coect.Access
var store = require('./store')
var misc = require('./misc')

var PAGE_SIZE = 100

function likeStatus(access, likeCount) {
  return {
    user_liked: (access > Access.HIDDEN),
    user_saved: (access === Access.HIDDEN),
    like_count: likeCount
  }
}

var upsert = function(visible, user, entity, done) {
  var access = (visible ? entity.access : Access.HIDDEN)
  debug('create', visible, access, user, entity)
  var flow = tflow([
    () => {
      if (entity.ref) flow.fail(400, 'Can\'t like a reference.')
      else if (entity.owner === user.id && access > Access.HIDDEN) flow.fail(400, 'Can\'t like own content.') 
      else if (entity.access <= Access.HIDDEN) flow.fail(400, 'Can\'t like hidden, deleted and admin only entities.')
      else flow.next()
    },
    () => Channel.getOrCreateType(user, Entity.MAIN, flow),
    (list) => Entity.findOne({
      list: list.id,
      ref: entity.id,
      owner: user.id,
      model: Entity.LIKE,
    }, flow.join(list)),
    (list, like) => {
      debug('existing like access', like && like.access)
      if (like && like.access === access) return flow.complete(likeStatus(access))
      else if (like) Entity.update(like.id, {access: access}, flow)
      else Entity.create({
        list: list.id,
        owner: user.id,
        ref: entity.id,
        model: Entity.LIKE,
        type: entity.type,
        name: entity.name,
        recipient: (visible && entity.owner !== user.id ? entity.owner : null),
        access: access,
        // for own likes don't duplicate tags
        tags: (entity.owner !== user.id ? entity.tags : null)
      }, user.id, flow)
      
    },
    () => store.entry.updateLikeCount(entity, flow),
    () => Entity.table(entity.id).select('like_count').where('id', entity.id).first().asCallback(flow),
    (res) => {
      flow.next(likeStatus(access, res.like_count))
    }
  ], done)
}

var remove = function(user, entity, done) {
  var listId = user.getListId(Entity.MAIN)
  debug('remove', user, entity)
  var flow = tflow([
    () => {
      if (!listId) return flow.complete({})
      Entity.remove({
        list: listId,
        ref: entity.id,
        model: Entity.LIKE,
        owner: user.id
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

exports.list = function(req, res) {
  debug('list', req.params)
  var flow = tflow([
    () => misc.getEntryAndChannel(req, flow),
    (entry, channel) => Entry.table().select('owner', 'link', 'source')
      .where({model: Entity.LIKE, ref: entry.id})
      .andWhere('access', '>', Access.HIDDEN)
      .orderBy('id', 'desc').limit(PAGE_SIZE)
      .asCallback(flow),
    (likes) => Entity.fillUsers(likes, req.app.userCache, flow),
    (likes) => flow.next({items: likes})
  ], coect.json.response(res))
}
