<umedia-entry-list>
  <div if={ items.length } class="umedia-entry-list h-feed">
    
    <div if={ ancestor } class="umedia-entries-header clearfix">
      <ul class="nav nav-pills pull-right">
        <li role="presentation" class="{ query.order == 'last' ? 'active': ''}"><a onclick={ last }>Last</a></li>
        <li role="presentation" class="{ query.order == 'first' ? 'active': ''}"><a onclick={ first }>First</a></li>
        <li role="presentation" class="{ query.order == 'top' ? 'active': ''}"><a onclick={ top }>Top</a></li>
      </ul>

      <div>
        <h4 class="umedia-comments-title">
          { commentsTitle() }
        </h4>
        <a if={ ancestor && ancestor.type == 'post' } onclick={ toggleComments }>{ commentsHint() }</a>
      </div>

    </div>


    <div>
      <ul class="list-unstyled">
        <li each={e in items}>
          <umedia-entry entry={ e } ancestor={ parent.ancestor || parent.channel } />
        </li>
      </ul>

      <a if={ hasMore } href="#" onclick={ more }>Load more</a>
    </div>

  </div>


  <script>
   var self = this
   self.mixin('coect-context', 'umedia-context')
   self.debug('entry_list window=', typeof window)

   var opts = self.opts
   self.ancestor = opts.ancestor
   self.channel = opts.channel
   self.category = opts.category
   self.items = opts.items || []
   self.hasMore = false
   self.query = initQuery({
     order: 'last', 
     count: parseInt(opts.count || 10)
   })

   function getThreadId(entry) {
     return (entry.type == 'reply' ? entry.thread.id : entry.id)
   }

   function getCursor() {
     if (self.query.order === 'top') return {offset: self.items.length}
     else return {cursor: self.items[self.items.length - 1].id}
   }

   function initQuery(query) {
     if (opts.type) query.type = opts.type
     else if (opts.owner) query.owner = opts.owner
     else if (self.ancestor) query.thread = getThreadId(self.ancestor)
     /* else if (self.channel) query.list = self.channel.id */
     else if (opts.list) query.list = opts.list
     else if (opts.username && opts.cslug) query.list_url = opts.username + '/' + opts.cslug

     if (opts.category) query.tag = opts.category
     return query
   }

   function getQuery(append) {
     return (append ? $.extend(getCursor(), self.query) : self.query)
   }

   function load(append) {
     debug('load append=', append)
     var url = self.url.entry('') + '?' + $.param(getQuery(append))
     $.getJSON(url, function(data) {
       debug('loaded data', data && data.length)
       // update self.items in-place because it may be shared with parent tag like entry_detail
       if (!append) self.items.splice(0, self.items.length)
       self.items.push.apply(self.items, data.items)
       self.hasMore = (data.length >= self.query.count)
       self.update()
     }).fail(self.failHandler)
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

   self.commentsTitle = function() {
     if (self.ancestor && self.ancestor.type != 'post') return 'Replies'
     else if (self.query.topic) return 'With replies'
     else return 'Comments'
   }

   self.commentsHint = function() {
     return (self.query.thread ? 'With replies' : 'Comments only')
   }

   self.toggleComments = function() {
     debug('toggle', self.query)
     if (!self.query.thread) {
       delete self.query.topic
       self.query.thread = getThreadId(self.ancestor)
     } else {
       delete self.query.thread
       self.query.topic = self.ancestor.topic && self.ancestor.topic.id || self.ancestor.id
     }
     debug('after', self.query)
     load()
   }


   if (typeof window !== 'undefined') self.on('mount', function() {
     if (!self.items.length) load()
   })
  </script>
</umedia-entry-list>
