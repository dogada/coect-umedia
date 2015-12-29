<umedia-entry>
  <div id="e{entry.id}" class="umedia-entry media {opts.compacted ? 'umedia-compacted' : ''}">
    
    <h2 if={ title }>{ title }</h2>

    <div class="media-left">
      <a href="#">
        <img class="media-object" width="32" height="32" 
             title={ entry.owner.name }
             src={ entry.owner.avatar || Site.config.avatar(32) } alt="">
      </a>
    </div>

    <div class="media-body">
      <div>
        <a href="#">{ displayName(entry.owner) }</a> 
        <span class="umedia-meta small">
          <span if={ entry.type == 'post'}>
            <a href={ url.channel(entry.list) }>wrote</a>
          </span>
          <span if={ entry.type == 'comment' || entry.type == 'reply' }>
            <a href={ url.entry(entry.parent) }>{ actionName(entry) }</a>
          </span>

          <a href={ url.entry(entry) } title={ fullDate(entry.created) }>{ getAge(entry.created) }</a>
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
   self.mixin('coect-context', 'umedia-context')
   debug('entry', this.opts, 'url=', self.url)

   self.displayName = function(user) {
     return user.username || user.name || user.id
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
</umedia-entry>
