'use strict';

var debug = require('debug')('umedia:store')
var tflow = require('tflow')
var async = require('async')

var Entity = require('../models').Entity
var Entry = require('../models').Entry
var Channel = require('../models').Channel

var coect = require('coect')
var Access = coect.Access
var Store = require('./store')

class CategoryStore extends Store {

  getChannel(tag, done) {
    Channel.findOne({name: tag, type: Entity.CATEGORY, owner: null}, done)
  }

  addVote(object, tag, done) {
    debug('addVote', object, tag)
    var flow = tflow([
      () => Channel.getOrCreate({name: tag, type: Entity.CATEGORY, owner: null},
                                {model: Channel.MODEL}, {key: tag}, flow),
      (category) => Entry.getOrCreate({list: category.id, ref: object.id},
                                      {model: Entity.REF, type: object.type, name: ''}, category, flow),
      (entry) => Entry.table().update({
        like_count: Entry.raw('like_count + 1')
      }).where('id', entry.id).asCallback(flow)
    ], done)
  }

  addVotes(object, tags, done) {
    debug('addVotes', object, tags)
    async.eachSeries(tags, (tag, cb) => this.addVote(object, tag, cb), done)
  }

}

module.exports = CategoryStore
