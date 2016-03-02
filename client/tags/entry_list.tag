<umedia-entry-list>
  <div if={ items.length } class="umedia-entry-list h-feed">
    <div>
      <ul class="list-inline actions">
        <li if={ ancestor || opts.category }>
          <button onclick={ last } type="button" 
                  class="btn btn-xs btn-default{ active(query.order == 'last') }">Last</button>
        </li>
        
        <li if={ ancestor || opts.category }>
          <button onclick={ first } type="button" 
                  class="btn btn-xs btn-default{ active(query.order == 'first')}">First</button>
        </li>

        <li if={ ancestor }>
          <button onclick={ top } type="button" 
                  class="btn btn-xs btn-default{ active(query.order == 'top')}">Top</button>
        </li>


        <li if={ ancestor && ancestor.type == 'post' }>
          <button onclick={ toggleThreaded } type="button" 
                  class="btn btn-xs btn-default{ active(!query.thread) }">Flat</button>
        </li>

        <li if={ ancestor && ancestor.type == 'post' }>
          <button onclick={ toggleThreaded } type="button" 
                  class="btn btn-xs btn-default{ active(query.thread) }">Threaded</button>
        </li>
        
      </ul>
    </div>

    <div>
      <ul class="list-unstyled entries">
        <li each={e in items}>
          <umedia-entry entry={ e } ancestor={ parent.ancestor || parent.channel } />
        </li>
      </ul>

      <a if={ hasMore } href="#" onclick={ more }>Load more</a>
    </div>

  </div>


  <script>
   var self = this
   self.mixin('umedia-context')
   self.debug('entry_list window=', typeof window)

   var opts = self.opts
   self.ancestor = opts.ancestor
   self.items = opts.items || []
   self.hasMore = false
   self.query = initQuery({
     order: 'last', 
     count: parseInt(opts.count || 10)
   })
   debug('initial query', self.query, 'items.length=', self.items.length)

   self.active = function(test) {
     return (test ? ' active' : '')
   }

   function getThreadId(entry) {
     return (entry.thread && entry.thread.id !== entry.topic.id ? entry.thread.id : entry.id)
   }

   function getTopicId(entry) {
     return entry.topic && entry.topic.id || entry.id
   }

   function getCursor() {
     if (self.query.order === 'top') return {offset: self.items.length}
     else return {cursor: self.items[self.items.length - 1].id}
   }

   function getListType(ancestor) {
     if (!ancestor.thread) return 'topic'
     else if (ancestor.thread && ancestor.thread.id === ancestor.topic.id) return 'thread'
     else if (ancestor.thread) return 'replies'
   }

   function initQuery(query) {
     var listType = self.ancestor && getListType(self.ancestor)
     debug('initQuery listType', listType)
     if (opts.type) query.type = opts.type
     else if (opts.owner) query.owner = opts.owner
     else if (listType === 'topic') query.topic = getTopicId(self.ancestor)
     else if (listType === 'thread') query.thread = getThreadId(self.ancestor)
     else if (listType === 'replies') query.parent = self.ancestor.id
     else if (opts.list) query.list = opts.list
     else if (opts.username && opts.cslug) query.list_url = opts.username + '/' + opts.cslug

     if (opts.category) query.tag = opts.category
     return query
   }

   function getQuery(append) {
     return (append ? $.extend(getCursor(), self.query) : self.query)
   }

   function load(append) {
     debug('load', append)
     var url = self.url.entry('') + '?' + $.param(getQuery(append))
     debug('url', url)

     self.store.entry.get(url, Site.callback(function(data) {
       debug('loaded data', data && data.length)
       // update self.items in-place because it may be shared with parent tag like entry_detail
       if (!append) self.items.splice(0, self.items.length)
       self.items.push.apply(self.items, data.items)
       self.hasMore = (data.length >= self.query.count)
       self.update()
     }))
   }

   self.last = function() {
     self.query.order = 'last'
     load()
   }

   self.first = function() {
     self.query.order = 'first'
     load()
   }

   self.top = function() {
     self.query.order = 'top'
     load()
   }

   self.more = function() {
     debug("more entries.length=", self.items.length);
     load(true)
   }

   self.toggleThreaded = function() {
     debug('toggleT', self.query)
     if (!self.query.thread) {
       delete self.query.topic
       self.query.thread = getThreadId(self.ancestor)
     } else {
       delete self.query.thread
       self.query.topic = getTopicId(self.ancestor)
     }
     debug('after', self.query)
     load()
   }

   if (typeof window !== 'undefined') self.on('mount', function() {
     if (!self.items.length) load()
   })

   //if (typeof window !== 'undefined' && !self.items.length) self.load()
  </script>
</umedia-entry-list>
