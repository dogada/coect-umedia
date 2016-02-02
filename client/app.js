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
