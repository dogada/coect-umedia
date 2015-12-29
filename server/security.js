'use strict';

/**
   Default access policy for umedia.
   Can be exended in each project.
*/
var debug = require('debug')('umedia:security')
var Entity = require('./models').Entity
var Channel = require('./models').Channel


class UmediaAccessPolicy {
  
  constructor(opts) {
    this.opts = Object.assign({
      postmoderate: false,
      defaultAccess: Channel.VISITOR,
      premoderateAccess: Channel.MODERATOR,
      postmoderateAccess: Channel.VISITOR
    }, opts || {})
  }

  accessInsideChannel(user, channel) {
    if (!user) return Channel.VISITOR
    if (channel.owner === user.id) return Channel.ADMIN
    if (channel.hasModerator(user)) return Channel.MODERATOR
    if (channel.hasMember(user)) return Channel.MEMBER
    return Channel.USER
  }

  // site-wide access
  getUserAccess(user) {
    if (!user) return Channel.VISITOR
    if (user.isAdmin()) return Channel.ADMIN
    if (user.isModerator()) return Channel.MODERATOR
    if (user.isMember()) return Channel.MEMBER
    return Channel.USER
  }

  // access level in a channel
  getUserAccessInsideChannel(user, channel) {
    return Math.min(this.getUserAccess(user), this.accessInsideChannel(user, channel))
  }

  getUserAccessTags(owner) {
    // tags assigned to a user by a channel owner
    return null
  }

  getDesiredAccess(entry, channel) {
    return channel.data[entry.type + '_access'] || channel.data.access || this.opts.defaultAccess
  }

  /**
     Note: premoderate status CAN be set even for an moderator, so someone else
     will need to approve it messages, but moderator will still be able to
     moderate posts of other users (for example remove spam from comments).
     Moderator can't approve own messages.
   */
  getNewEntryAccess(user, entry, channel) {
    let desired = this.getDesiredAccess(entry, channel)
    if (this.getUserAccess(user, channel) <= Channel.ADMIN) return desired
    if (user.data.postmoderate) return desired
    if (!user.data.premoderate) {
      if (channel.data.postmoderate ||
          this.opts.postmoderate) return Math.min(desired, this.opts.postmoderateAccess)
      // moderate even member actions if member.data.premoderate
      if (this.getUserAccess(user, channel) <= Channel.MEMBER) return desired
    }
    return this.opts.premoderateAccess
  }

  canUserView(user, entry, channel) {
    debug('CanUserView', entry.access, user && user.id, (entry.access >= Entity.VISITOR))
    if (user && user.isAdmin()) return true // admins should have access always
    if (!entry.access || entry.access < Channel.ADMIN) return false // only admins can access such entries
    if (!user) return (entry.access >= Entity.VISITOR)
    if (entry.creator === user.id) return true
    if (entry.access >= Entity.USER) return true

    // User should see replies adressed to him even if they are in moderation
    // queue yer  
    if (entry.to === user.id && entry.access >= Entity.MODERATOR) return true
    if (entry.access >= this.getUserAccess(user, channel)) return true
    return false
  }

  canUserChange(user, entry, channel) {
    // FIX check entity.acl too
    return entry.owner === user.id
  }

  canUserRemove(user, entry, channel) {
    // FIX check entity.acl too
    if (entry.owner === user.id) return true
    if (this.getUserAccess(user, channel) <= Entity.ADMIN) return true
    return false
  }

  canUserViewChannel(user, channel) {
    if (user && user.isAdmin()) return true
    let userAccess = this.getUserAccess(user, channel)
    return (userAccess <= channel.access)
  }
}

module.exports = UmediaAccessPolicy
