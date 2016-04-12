<umedia-entry-details>
  <div class="umedia-entry-details h-entry">
    <coect-breadcrumbs if={ breadcrumbs.length } items={ breadcrumbs } />

    <umedia-entry if={ cite } entry={ cite } cite="1" class="p-in-reply-to"></umedia-entry>
    <umedia-entry entry={ entry } detail="1"></umedia-entry>

    <p if={ entry.type == 'reply' }>View 
      <a href={ url.entry(entry.thread) }>all replies</a> in the thread.
    </p>

    <umedia-entry-editor if={ permissions.comment } 
      ancestor="{ entry }" items={ items }></umedia-entry-editor>

    <div class="login-required" hide={ Site.user }>
      Please <a onclick={ Site.account.loginRequired }>sign in</a> to add a comment or a reply.
    </div>

    <umedia-entry-list id="umedia-comments" ancestor={ entry } 
    comment="1" cite="1" view="full" />

  </div>
  
<script>
 var self = this
 self.mixin('umedia-context')
 var entry = self.entry = self.opts.entry

 function getThreadId(entry) {
   return (entry.thread && entry.thread.id !== entry.topic.id ? entry.thread.id : entry.id)
 }

 function getTopicId(entry) {
   return entry.topic && entry.topic.id || entry.id
 }

 function getListType(ancestor) {
   if (ancestor.model === 'channel') return 'channel'
   else if (!ancestor.thread) return 'topic'
   else if (ancestor.thread && ancestor.thread.id === ancestor.topic.id) return 'thread'
   else if (ancestor.thread) return 'replies'
 }

 var query = self.query = {order: 'last'}
 var listType = getListType(entry)
 if (listType === 'topic') query.topic = getTopicId(entry)
 else if (listType === 'thread') query.thread = getThreadId(entry)
 else if (listType === 'replies' || listType === 'channel') query.parent = self.ancestor.id

 debug('initQuery listType', listType, entry, query)
 

 function flat() {
   debug('flatMode', query)
   if (!query.thread) return
   delete query.thread
   query.topic = getTopicId(entry)
   self.mode = 'flat'
   self.trigger('query:changed')
 }

 function threaded() {
   debug('threadedMode', query)
   if (!query.topic) return
   delete query.topic
   query.thread = getThreadId(entry)
   self.mode = 'threaded'
   self.trigger('query:changed')
 }


 if (entry.parent && entry.topic && entry.parent.id !== entry.topic.id) self.cite = entry.parent
 self.permissions = opts.permissions || {}
 self.items = []
 self.tabs = [
   {id: 'last', name: 'Last'},
   {id: 'first', name: 'First'},
   {id: 'top', name: 'Top'}
 ]
 
 if (entry.type == 'post') {
   self.modes = [
     {id: 'flat', name: 'Flat view', icon: 'fa fa-align-justify', handler: flat},
     {id: 'threaded', name: 'Threaded view', icon: 'fa fa-indent', handler: threaded},
   ]
   self.mode = self.modes[0].id
 }

 self.on('tab:changed', function(tab) {
   debug('tab:changed', tab)
   self.query.order = tab
   self.trigger('query:changed')
 })

 self.breadcrumbs = opts.breadcrumbs || [
   {name: entry.list.owner.name, url: self.url.user(entry.list.owner)},
   {name: entry.list.name, url: self.url.channel(entry.list)},
 ]
 if (entry.topic && entry.topic.name && self.breadcrumbs && self.breadcrumbs.length) {
   self.breadcrumbs.push({
     name: self.coect.util.truncate(entry.topic.name, 40),
     url: self.url.entry(entry.topic)})
 }

</script>

  
</umedia-entry-details>
