<umedia-entry>
  <div id="e{entry.id}" class="h-entry media umedia-entry {entry.highlighted ? 'highlighted' : ''}">
    
    <h1 if={ title } class="p-name">{ title }</h1>

    <div class="media-left">
      <a href={ url.user(entry.owner) }>
        <img class="media-object" width="32" height="32" 
             title={ entry.owner.name || entry.owner.id }
             src={ url.avatar(entry.owner, 32) } alt="">
      </a>
    </div>

    <div class="media-body">
      <div>
        <a class="p-author h-card umedia-display-name" href="{ url.user(entry.owner) }"
           title="{ entry.owner.username || entry.owner.id }">{ displayName(entry.owner) }</a> 
        <span class="umedia-meta small">
          <span if={ entry.type == 'post'}>
            <a href={ url.channel(entry.list) }>wrote</a>
          </span>
          <span if={ action }>
            <a href={ url.entry(entry.parent) }>{ action }</a>
          </span>

          <a class="u-url" href={ url.entry(entry) } title={ createdLocaleStr }>
            <time class="dt-published" datetime={ createdISOStr }>{ createdAgeStr }</time>
          </a>

          <span if="{ entry.access == Access.MODERATION }" onclick={ moderate } class="restricted"
                title="The entry is awaiting for moderation.">moderation</span>

          <span if="{ entry.access == Access.REJECTED }" class="restricted"
                title="The entry was rejected after moderation.">rejected</span>

          <span if="{ entry.access == Access.HIDDEN }" class="restricted"
                title="The entry is visible to owner and admins only.">hidden</span>

          <span if="{ isRestricted(entry) }" class="restricted"
                title="Access to the entry is restricted (level: { entry.access }).">restricted</span>

        </span>
      </div>
      <div class={'e-content': 1, 'p-name': !title}>
        <umedia-wpml doc={ doc }></umedia-wpml>
      </div>
      <div class="umedia-actions">
       <a class={ active: opts.detail } href={ url.entry(entry) }>{ commentsLabel(entry) }</a>
       <span if={ webmention }>·
         <a class="u-syndication" rel="syndication" href={ webmention.url }>Source</a>
       </span>
       <span if={ canChange }>·
         <a href={ url.entry(entry.id, 'edit') }>Edit</a>
       </span>

       <ul if={ entry.tags } class="coect-tags pull-right list-inline">
         <li each={ t, i in entry.tags }>
           <a href="{ url.category(t) }" class="p-category label label-default">{ t }</a>
         </li>
       </ul>
      </div>
    </div>
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   debug('entry store', self.store)

   var Access = self.Access = require('coect').Access
   self.ancestor = self.opts.ancestor


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
     if (entry.type == 'reply') return 'Reply'
     else return (entry.type == 'post' ? 'Comments' : 'Replies')
     //+ ' (' + (entry.child_count || 0) + ')'
   }

   self.actionName = function(type, webmType) {
     self.debug('actionName', type, webmType)
     if (type === 'comment') return 'commented'
     else if (type === 'reply' || webmType === 'reply') return 'replied'
     else if (type === 'like' || webmType === 'like') return 'liked'
     else if (type === 'repost' || webmType === 'repost') return 'reposted'
     else if (webmType === 'bookmark') return 'bookmarked'

     return ''
   }

   self.moderate = function(e) {
     if (!Site.umedia.canModerateEntry(e)) return
     if (!(e.ctrlKey || e.altKey || e.metaKey || e.shiftKey)) return //ignore normal click
     self.debug('moderate access=', self.entry.access, 'alt=', e.altKey,
                'meta=', e.metaKey, 'ctrl=', e.ctrlKey, 'shift=', e.shiftKey, 'name=', self.entry.name)
     self.store.entry.moderate(self.entry, e.ctrlKey, function (err, data) {
       if (err) return Site.error(err)
       self.update({entry: $.extend(self.entry, data)})
     })
   }
   
   self.entry = self.opts.entry || self.opts.state && self.opts.state.entry
   self.webmention = self.entry.link && self.entry.link.webmention
   self.doc = self.wpml.doc(self.entry.text || '')
   self.title = self.doc.meta.title
   self.action = self.actionName(self.entry.type, self.webmention && self.webmention.type)

   if (self.entry.created) {
     // self.created is ISO string on client-side and Date on server-side
     var d = new Date(self.webmention && self.webmention.published || self.entry.created)
     self.createdLocaleStr = d.toLocaleString()
     self.createdISOStr = d.toISOString()
     self.createdAgeStr = self.getAge(d) //getAge is from mixin
   }
   self.canChange = (typeof Site !== 'undefined' && Site.umedia.canChangeEntry(self.entry))
   
  </script>

  <style scoped>
   .restricted { color: grey }
   h2 { margin-top: 0 }
  </style>
</umedia-entry>
