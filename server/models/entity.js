'use strict';

var debug = require('debug')('auth:user')
var Model = require('coect').orm.Model

class Entity extends Model {

  constructor(props) {
    super(props)
    //Model.call(this, props)
  }

  toString() {
    return this.name || this.id
  }

}

/**
   FIX: use first head line without formating.
*/
Entity.parseName = function(text) {
  return text.slice(0, 40)
}


module.exports = Entity
