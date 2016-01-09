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
      // entries available for everyone including search bots
      defaultAccess: Channel.VISITOR,
      // guest entries available for all logged in users but not available for
      // visitors and search spider (so spam will not leak into search indexes)
      // if you need classic premoderation set this value to Channel.MODERATOR 
      guestAccess: Channel.USER
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
    var desired = channel.data[entry.type + '_access'] || channel.access || this.opts.defaultAccess
    // access mode for entries can't be greater than channel access itself
    if (desired > channel.access) desired = channel.access
    return desired
  }
  /**
     Default access for guests (new users without known reputation yet).
     Users with bad reputation will have 'premderate' status anyway.
     Users with good reputation will have 'postmoderate' status.
     Guests are in between 'premoderate' and 'postmoderate'.
   */
  getGuestAccess(entry, channel, desired) {
    var access = channel.data.guest_access || this.opts.guestAccess || Channel.MODERATOR
    // guest access can't be greater than desired access after moderation
    if (access > desired) access = desired
    return access
  }

  /**
     Note: premoderate status CAN be set even for an moderator, so someone else
     will need to approve it messages, but moderator will still be able to
     moderate posts of other users (for example remove spam from comments).
     Moderator can't approve own messages.
     FIX: allow to set user's premoderate and postmoderate status for each
     channel individually.
   */
  getNewEntryAccess(user, entry, channel) {
    let desired = this.getDesiredAccess(entry, channel)
    // never lift admin only access
    if (desired <= Channel.ADMIN) return desired
    // auto approve admins
    if (this.getUserAccess(user, channel) <= Channel.ADMIN) return desired
    // moderate even member & moderator actions if member.data.premoderate
    if (user.data.premoderate) return Channel.MODERATOR

    // auto approve good users (FIX: check also user status in channel)
    if (user.data.postmoderate) return desired
    // auto approve members and moderators without 'premoderate' status
    if (this.getUserAccess(user, channel) <= Channel.MEMBER) return desired
    // auto approve all in postmoderate channels
    if (channel.data.postmoderate || this.opts.postmoderate) return desired
    // by default use guest access
    return this.getGuestAccess(entry, channel, desired)
  }

  canUserView(user, entry, channel) {
    debug(`canUserView id=${entry.id} access=${entry.access}, owner=${entry.owner}, user=${user && user.id}`)
    if (user && user.isAdmin()) return true // admins should have access always
    debug('0')
    if (!entry.access || entry.access < Channel.ADMIN) return false // only admins can access such entries
    debug('1')
    if (!user) return (entry.access >= Entity.VISITOR)
    debug('2')
    if (entry.owner === user.id) return true
    if (entry.access >= Entity.USER) return true

    // User should see replies for own entries
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
