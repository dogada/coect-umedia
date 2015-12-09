'use strict';

var objectAssign = require('object-assign')
var debug = require('debug')('umedia:channel')
var Model = require('coect').orm.Model

function Channel(props) {
  if (!(this instanceof Channel)) return new Channel(props)
  objectAssign(this, props)
}

Model.extend(Channel)

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


Channel.makeUrl = function(user, slug) {
  return user.username && slug ? user.username + '/' + slug : null
}

Channel.prototype.toString = function() {
  return this.name
}

Channel.prototype.publicData = function() {
  return {id: this.id,
          name: this.name}
}



module.exports = Channel
