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
Channel.listFields = ['id', 'type', 'name', 'owner', 'url', 'access', 'version']
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
Channel.getOrCreateMentions = function(user, done) {
  var flow = tflow([
    () => Channel.findOne({owner: user.id, type: Channel.MENTIONS}, flow),
    (channel) => {
      if (channel) return flow.complete(channel)
      Channel.create({
        model: Channel.MODEL,
        type: Channel.MENTIONS,
        name: 'Mentions',
        url: Channel.makeUrl(user.username, Channel.MENTIONS),
        owner: user.id,
        access: Access.HIDDEN
      }, user.id, flow)
    },
    (id) => Channel.get(id, flow)
  ], done)
}


module.exports = Channel
