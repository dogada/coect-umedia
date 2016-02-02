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
          <span if={ entry.type == 'comment' || entry.type == 'reply' }>
            <a href={ url.entry(entry.parent) }>{ actionName(entry) }</a>
          </span>

          <a class="u-url" href={ url.entry(entry) } title={ fullDate(entry.created) }>
            <time class="dt-published" datetime={ entry.created }>{ getAge(entry.created) }</time>
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
      <umedia-wpml doc={ doc } class="e-content"></umedia-wpml>
      <div class="umedia-actions">
       <a class={ active: opts.detail } href={ url.entry(entry) }>{ commentsLabel(entry) }</a>
        <span if={ canChange }>· <a href={ url.entry(entry.id, 'edit') }>Edit</a></span>
      </div>
    </div>
  </div>

  <script>
   var self = this
   var Access = self.Access = require('coect').Access
   self.ancestor = self.opts.ancestor

   self.store = self.opts.store
   
   self.mixin('umedia-context')
   debug('opts', this.opts, 'url=', self.url)

   self.isRestricted = function(entry) {
     debug('isRest', entry.access, self.ancestor)
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

   self.fullDate = function(d) {
     //debug('fullDate', typeof d, d, d.toLocaleString(), new Date().toLocaleString())
     return d && new Date(d).toLocaleString() || d
   }

   self.commentsLabel = function(entry) {
     if (entry.type == 'reply') return 'Reply'
     else return (entry.type == 'post' ? 'Comments' : 'Replies') + 
                                ' (' + (entry.child_count || 0) + ')'
   }

   self.actionName = function(entry) {
     if (entry.type === 'post') return ''
     else if (entry.type === 'comment') return 'commented'
     else if (entry.type === 'reply') return 'replied'
   }

   self.moderate = function(e) {
     if (!Site.umedia.canModerateEntry(e)) return
     if (!(e.ctrlKey || e.altKey || e.metaKey)) return //ignore normal click
     debug('moderate access=', self.entry.access, 'alt=', e.altKey,
           'meta=', e.metaKey, 'ctrl=', e.ctrlKey, 'name=', self.entry.name)
     self.parent.store.moderate(self.entry, e.ctrlKey, function (err, data) {
       if (err) return Site.error(err)
       self.update({entry: $.extend(self.entry, data)})
     })
   }
   
   self.entry = self.opts.entry || self.opts.state && self.opts.state.entry
   self.doc = self.wpml.doc(self.entry.text || '')
   self.title = self.doc.meta.title || self.doc.meta.name
   self.canChange = (typeof Site !== 'undefined' && Site.umedia.canChangeEntry(self.entry))
  </script>

  <style scoped>
   .restricted { color: grey }
   h2 { margin-top: 0 }
  </style>
</umedia-entry>
