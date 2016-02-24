var coect = require('coect')

exports.canPost = function(channelId) {
  // FIX get by AJAX and cache all channels users can post to
  // || Site.user && Site.user.blog === channelId
  return Site.user && Site.user.admin
}

exports.canComment = function(entry) {
  // allow all logged users to comment
  return Site.user
}


exports.canChangeEntry = function(entry) {
  return Site.user && entry.user && Site.user.id === entry.user.id
}

function userId(userOrId) {
  return userOrId && (userOrId.id || userOrId)
}

exports.canModerateEntry = function(entry) {
  if (!Site.user || Site.user.id === entry.owner) return false
  return (Site.user.admin || Site.user.id === userId(entry.recipient))
}

exports.canBroadcast = function(entry) {
  if (entry.access < coect.Access.EVERYONE) return false
  var listOwnerId = userId(entry.list && entry.list.owner)
  return listOwnerId && Site.user && Site.user.id === listOwnerId
}
