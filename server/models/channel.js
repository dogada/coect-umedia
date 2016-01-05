'use strict';

var debug = require('debug')('umedia:channel')
var Entity = require('./entity')

class Channel extends Entity {

  constructor(props) {
    super(props)
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
Channel.listFields = ['id', 'type', 'name', 'owner', 'url', 'access', 'version']
Channel.detailFields = Channel.listFields.concat(['text', 'child_count'])


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

module.exports = Channel
