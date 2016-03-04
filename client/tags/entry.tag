<umedia-entry>
  <div id="e{entry.id}" class={'h-entry': hentry, 'h-cite': opts.cite, 'p-comment': opts.comment, 'highlighted': entry.highlighted, 'media umedia-entry': 1}>
    
    <h1 if={ title && opts.detail } class="p-name">{ title }</h1>
    <h2 if={ title && !opts.detail } class="p-name">{ title }</h2>

    <div class="media-left">
      <a class="p-author h-card" href={ url.user(entry.owner) }>
        <img class="media-object" width="32" height="32" 
             alt={ entry.owner.name } title={ entry.owner.name }
             src={ url.avatar(entry.owner, 32) }>
      </a>
    </div>

    <div class="media-body">

      <aside class="entry-meta coect-meta">
        <a class="umedia-display-name" href="{ url.user(entry.owner) }"
           title="{ entry.owner.username || entry.owner.id }">{ displayName(entry.owner) }</a> 
        
        <a if={ action && actionUrl } rel="nofollow" href={ actionUrl } target="_blank">{ action }</a>
        <span if={ action && !actionUrl }>{ action }</span>
        
        <a if={ replyToUrl } href={ replyToUrl } 
          class="u-in-reply-to">{ meta.reply_to_name || coect.util.truncateUrl(replyToUrl) }</a>
        
        <a class="u-url" href={ url.entry(entry) } title={ createdLocaleStr }>
            <time class="dt-published" datetime={ createdISOStr }>{ createdAgeStr } ago</time>
        </a>
        
        <span if="{ entry.access == Access.MODERATION }" onclick={ moderate } class="restricted"
              title="The entry is awaiting for moderation.">moderation</span>
        
        <span if="{ entry.access == Access.REJECTED }" class="restricted"
              title="The entry was rejected after moderation.">rejected</span>
        
        <span if="{ entry.access == Access.HIDDEN }" class="restricted"
                title="The entry is visible to owner and admins only.">hidden</span>
        
        <span if="{ isRestricted(entry) }" class="restricted"
              title="Access to the entry is restricted (level: { entry.access }).">restricted</span>

      </aside>
    
      <article class={ (hentry || opts.detail) ? 'e-content': 'p-content' }>
        <umedia-wpml doc={ doc }></umedia-wpml>
      </article>

      <aside class="entry-actions coect-meta">
       <a if={ type != 'like' } href={ url.entry(entry) }>{ commentsLabel(entry) }</a>

       <a if={ meta.facebook_url } class="u-syndication" rel="syndication" href={ meta.facebook_url }>fb</a>
       <a if={ meta.twitter_url } class="u-syndication" rel="syndication" href={ meta.twitter_url }>t</a>

       <span if={ canChange }>
         <a href={ url.entry(entry.id, 'edit') }>Edit</a>
       </span>

       <span if={ canBroadcast }>
         <a onclick={ broadcast }>Broadcast</a>
       </span>


       <ul if={ entry.tags } class="coect-tags pull-right list-inline">
         <li each={ t, i in entry.tags }>
           <a href="{ url.category(t) }" class="p-category label label-default">{ t }</a>
         </li>
       </ul>
      </aside>

      <coect-bridgy-config if={ coect.bool(meta.bridgy) } meta={ meta } />

    </div>
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   var opts = self.opts
   var Access = self.Access = require('coect').Access
   self.ancestor = self.opts.ancestor
   var entry = self.entry = self.opts.entry || self.opts.state && self.opts.state.entry
   self.hentry = opts.hentry || (!opts.cite && !opts.comment && !opts.detail)
   debug('h-entry', self.hentry, 'cite=', opts.cite, 'comment', opts.comment, 'detail=', opts.detail, entry)


   if (entry) { //workaround for Riot issues with evaluating tags with if={false}
     self.meta = self.coect.object.assign(
       {}, entry.list && entry.list.meta || {}, entry.meta || {})
     debug('entry meta', entry.name, self.meta)
     self.webmention = entry.link && entry.link.webmention

     debug('bridgy', self.coect.bool(self.meta.bridy))
     
     self.doc = self.wpml.doc(entry.text || '')
     self.title = self.doc.meta.title
     self.type = self.webmention && self.webmention.type || (entry.type === 'comment' ? 'reply' : entry.type)

     self.replyToUrl = self.meta.reply_to || (self.type === 'reply') &&
     self.url.entry(entry.parent)
     
     debug('type', self.type, self.replyToUrl)
   }

   
   self.actionName = function(type) {
     //self.debug('actionName', type, webmType)
     if (type === 'reply') return 'replied'
     else if (type === 'like') return 'liked'
     else if (type === 'repost') return 'reposted'
     else if (type === 'bookmark') return 'bookmarked'
     else if (type === 'rsvp') return 'rsvp'
     else if (type === 'link') return 'mentioned'
     return ''
   }

   self.action = self.actionName(self.type)
   // post with external reply_to
   if (self.replyToUrl && !self.action) self.action = 'in reply to'
   if (self.webmention && self.webmention.url) self.actionUrl = self.webmention.url

   self.isRestricted = function(entry) {
     if ([Access.MODERATION, Access.REJECTED,
     Access.HIDDEN].indexOf(entry.access) !== -1) return false
     if (self.ancestor && self.ancestor.access) return entry.access < self.ancestor.access
     return entry.access !== Access.EVERYONE
   }

   self.displayName = function(user) {
     return user.name || user.username || user.id
   }

   self.expand = function(e) {
     var div = $(e.target).parents('.umedia-entry')[0] || $(e.target)
     if (!$(div).hasClass('umedia-compacted')) return true // use default hadler
     $(div).removeClass('umedia-compacted')
     return false
   }

   self.commentsLabel = function(entry) {
     if (!entry.child_count) return 'Reply'
     else return 'Replies (' + entry.child_count + ')'
   }

   self.moderate = function(e) {
     if (!Site.umedia.canModerateEntry(e)) return
     if (!(e.ctrlKey || e.altKey || e.metaKey || e.shiftKey)) return //ignore normal click
     self.debug('moderate access=', self.entry.access, 'alt=', e.altKey,
                'meta=', e.metaKey, 'ctrl=', e.ctrlKey, 'shift=', e.shiftKey, 'name=', self.entry.name)
     self.store.entry.moderate(self.entry, e.ctrlKey, Site.callback(
       function(data) {
         self.update({entry: $.extend(self.entry, data)})
       }
     ))
   }
   
   self.broadcast = function(e) {
     self.store.entry.post(self.url.entry(self.entry.id, 'broadcast'), Site.callback(function(data) {
       debug('broadcasted', data)
       self.coect.object.assign(self.entry.meta, data.meta)
       Site.flash(JSON.stringify(data.results))
     }))
   }

   if (entry && entry.created) {
     // self.created is ISO string on client-side and Date on server-side
     var d = new Date(self.webmention && self.webmention.published || entry.created)
     self.createdLocaleStr = d.toLocaleString()
     self.createdISOStr = d.toISOString()
     self.createdAgeStr = self.getAge(d) //getAge is from mixin
   }

   if (entry && typeof window !== 'undefined') {
     self.canChange = Site.umedia.canChangeEntry(self.entry)
     self.canBroadcast = Site.umedia.canBroadcast(self.entry)
   }
  </script>

  <style scoped>
   .restricted { color: grey }
   h2 { margin-top: 0 }
  </style>
</umedia-entry>
