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

}

//Entity.extend(Channel)

Channel.MODEL = 'channel'
Channel.TYPE = 'channel'
Channel.listFields = ['id', 'type', 'name', 'url']
Channel.detailFields = Channel.listFields.concat(['text'])

Channel.makeUrl = function(user, slug) {
  return user.username && slug ? user.username + '/' + slug : null
}


// user roles inside channel (used to control access to channel entries)
Object.assign(Channel, {
  // 0 means default undefined access
  ADMIN: 10,  // site-wide or this channel admin 
  MODERATOR: 20, // site-wide or channel moderator
  TAG: 30, // users tagged with an accessTag by channel owner (Friends, Family, etc)
  MEMBER: 40,  // site-wide member or a channel member
  FOLLOWER: 50, // channel follower (subscriber)
  USER: 60,   // logged in user (in most cases a human)
  VISITOR: 70 //any visitor of site including spider
})

Channel.inputs = {
  name: {
    isLength: {
      options: [3, 30],
      errorMessage: 'Must be between 3 and 30 chars long'
    }
  },
  text: {
    optional: true,
    isLength: {
      options: [0, 1000],
      errorMessage: 'Max length is 1000 chars'
    }
  },
  slug: {
    optional: true,
    isLength: {
      options: [3, 30],
      errorMessage: 'Slug must be between 3 and 30 chars long'
    },
    matches: {
      options: [/^[a-z]+[a-z\d\-]*$/],
      errorMessage: 'Slug can contain latin letters in lower case (a-z), digits and hypen and should begin with a letter.'
    }
  }
}


module.exports = Channel
