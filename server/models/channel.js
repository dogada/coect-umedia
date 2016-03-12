'use strict';

var debug = require('debug')('umedia:channel')
var Entity = require('./entity')
var tflow = require('tflow')
var Access = require('coect').Access

class Channel extends Entity {

  constructor(props) {
    super(props)
  }

  hasAdmin(user) {
    return user.id === this.owner || this.getAdmins().indexOf(user.id) > -1
  }

  getAdmins() {
    return this.data.admins || []
  }

  getModerators() {
    return this.data.moderators || []
  }

  hasModerator(user) {
    return this.getModerators().indexOf(user.id) > -1
  }

  hasMember(user) {
    return false
  }

}

Channel.MODEL = 'channel'
Channel.TYPE = 'channel'
Channel.MENTIONS = 'mentions'
Channel.listFields = ['id', 'type', 'name', 'owner', 'url', 'access', 'version', 'meta']
Channel.detailFields = Channel.listFields.concat(['model', 'text', 'child_count'])


Channel.schema = Object.assign({}, Entity.schema, {
  name: {
    isLength: {
      options: [3, 30],
      errorMessage: 'Name must be between 3 and 30 chars long'
    }
  },

  text: {
    optional: true,
    isLength: {
      options: [0, 1000],
      errorMessage: 'Text must be less than 1000 chars long'
    }
  },

})

/**
   Return or create mentions channel for a user.
*/
Channel.getOrCreateType = function(user, type, done) {
  var flow = tflow([
    () => {
      if (user.getListId(type)) return Channel.get(user.getListId(type), flow)
      else if (type === Entity.MAIN && user.blog) return flow.next(user.blog)
      else Channel.create({
        model: Channel.MODEL,
        type: type,
        name: type.toUpperCase(),
        url: Channel.makeUrl(user.username, type),
        owner: user.id,
        access: Access.HIDDEN
      }, user.id, flow)
    },
    (channelOrId) => {
      if (channelOrId.id) return flow.complete(channelOrId)
      else Channel.get(channelOrId, flow)
    },
    (channel) => {
      user.setListId(type, channel.id)
      user.save(flow)
    }
  ], done)
}

module.exports = Channel
