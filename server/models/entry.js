'use strict';

var objectAssign = require('object-assign')
var debug = require('debug')('auth:user')
var Model = require('coect').orm.Model

function Entry(props) {
  objectAssign(this, props)
}

Model.extend(Entry)

Entry.inputs = {
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

Entry.post = {
  name: {
    optional: true,
    isLength: {
      options: [1, 80],
      errorMessage: 'Must be less than 80 chars long'
    }
  },
  text: {
    isLength: {
      options: [1, 100000],
      errorMessage: 'Must be less than 100K chars long'
    }
  }
}

Entry.comment = {
  name: {
    optional: true,
    isLength: {
      options: [1, 80],
      errorMessage: 'Must be less than 80 chars long'
    }
  },

  text: {
    isLength: {
      options: [1, 1000],
      errorMessage: 'Must be less than 1000 chars long'
    }
  }
}

Entry.repost = {
  name: {
    optional: true,
    isLength: {
      options: [3, 80],
      errorMessage: 'Must be between 5 and 80 chars long'
    }
  },

  text: {
    optional: true,
    isLength: {
      options: [0, 1000],
      errorMessage: 'Must be less than 1000 chars long'
    }
  }
}

Entry.makeUrl = function(user, list, slug) {
  if (user.username && list.slug && slug) return user.username + '/' + list.slug + '/' + slug
  else return null
}

Entry.prototype.toString = function() {
  return this.name || this.id
}

Entry.prototype.publicData = function() {
  return {id: this.id,
          name: this.name}
}

module.exports = Entry
