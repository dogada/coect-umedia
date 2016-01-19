<umedia-entry class="umedia-entry">
  <div id="e{entry.id}" class="media {opts.compacted ? 'umedia-compacted' : ''}">
    
    <h2 if={ title }>{ title }</h2>

    <div class="media-left">
      <a href={ url.user(entry.owner) }>
        <img class="media-object" width="32" height="32" 
             title={ entry.owner.name || entry.owner.id }
             src={ entry.owner.avatar || Site.config.avatar(32) } alt="">
      </a>
    </div>

    <div class="media-body">
      <div>
        <a class="umedia-display-name" href="{ url.user(entry.owner) }"
           title="{ entry.owner.username || entry.owner.id }">{ displayName(entry.owner) }</a> 
        <span class="umedia-meta small">
          <span if={ entry.type == 'post'}>
            <a href={ url.channel(entry.list) }>wrote</a>
          </span>
          <span if={ entry.type == 'comment' || entry.type == 'reply' }>
            <a href={ url.entry(entry.parent) }>{ actionName(entry) }</a>
          </span>

          <a href={ url.entry(entry) } 
            title={ fullDate(entry.created) }>{ getAge(entry.created) }</a>
          
          <span if="{ entry.access == Site.access.MODERATOR }" onclick={ moderate } class="restricted"
          title="The entry is awaiting for moderation.">moderation</span>

          <span if="{ entry.access > Site.access.MODERATOR && entry.access < Site.access.EVERYONE }" class="restricted"
          title="Access to the entry is restricted ({ entry.access } level).">restricted</span>

          <span if="{ entry.access == Site.access.OWNER }" class="restricted"
                title="The entry is visible to owner and admins only. ({ entry.access } level).">hidden</span>

          <span if="{ entry.access < Site.access.OWNER }" class="restricted"
                title="The entry is visible to admins only ({ entry.access } level).">rejected</span>

        </span>
      </div>
      <umedia-wpml doc={ doc }></umedia-wpml>
      <div class="umedia-actions">
       <a class={ active: opts.detail } href={ url.entry(entry) }>{ commentsLabel(entry) }</a>
        <span if={ canChange }>· <a href={ url.entry(entry.id, 'edit') }>Edit</a></span>
      </div>
    </div>
  </div>

  <script>
   var self = this
   self.store = self.opts.store
   self.mixin('coect-context', 'umedia-context')
   debug('entry', this.opts, 'url=', self.url)

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
   
   self.rebuild = function() {
     var entry = self.opts.entry || self.opts.state && self.opts.state.entry
     var doc = self.wpml.doc(entry.text || '')
     self.update({
       entry: entry,
       doc: doc,
       title: doc.meta.title || doc.meta.name,
       canChange: Site.umedia.canChangeEntry(entry)
     })
   }

   
   self.on('mount', self.rebuild)
  </script>

  <style scoped>
   .restricted { color: grey }
   h2 { margin-top: 0 }
  </style>
</umedia-entry>
