<umedia-entry-list>

  <div class="umedia-entry-list">
    <div if={ showTabs } class="clearfix">
      <ul class="nav nav-tabs pull-left">
        <li if={ sorting.last } class="{ active(query.order == 'last') }">
          <a onclick={ last }>Last</a>
        </li>
        
        <li if={ sorting.first } class="{ active(query.order == 'first') }">
          <a onclick={ first }>First</a>
        </li>

        <li if={ sorting.top } class="{ active(query.order == 'top') }">
          <a onclick={ top } >Top</a>
        </li>

        <li if={ opts.filters } class="{ active(!query.model) }">
          <a href={ baseUrl() }>All</a>
        </li>

        <li if={ opts.filters } class="{ active(query.model == 'like') }">
          <a href={ baseUrl('like') }>Like</a>
        </li>

        <li if={ opts.filters } class="{ active(query.model == 'entry') }">
          <a href={ baseUrl('entry') }>Entry</a>
        </li>

      </ul>

      <div if={ listMode } class="btn-group pull-right" role="group" aria-label="View mode">
        <button type="button" class="btn btn-default { active(!query.thread) }" 
                onclick={ flatMode } title="Flat view"><i class="fa fa-align-justify"></i></button>
        <button type="button" class="btn btn-default { active(query.thread) }"
                onclick={ threadedMode } title="Threaded view"><i class="fa fa-indent"></i></button>
      </div>

    </div>

    <div if={ items.length} >
      <ul class="{'list-unstyled entries h-feed': 1, 'p-comments': opts.comment }">
        <li each={ e in items }>
          <umedia-entry entry={ e }
          ancestor={ parent.ancestor || parent.channel }
          comment={ parent.opts.comment } cite={ parent.opts.cite } 
          view={ parent.view } />
        </li>
      </ul>

      <div if={ hasMore }>
        <a href="#" onclick={ more }>Load more</a>
      </div>
    </div>

  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   self.debug('entry_list window=', typeof window, self.opts)

   var opts = self.opts
   self.ancestor = opts.ancestor
   self.items = opts.items || []
   self.hasMore = !opts.frozen
   self.view = opts.view || 'summary'

   self.debug('entry_list view', self.view, opts.view)
   self.sorting = opts.sorting || {
     first: self.ancestor,
     last: self.ancestor || opts.category,
     top: self.ancestor || opts.category
   }
   self.listMode = (self.ancestor && self.ancestor.type == 'post')
   self.showTabs = self.ancestor && self.ancestor.type == 'post' ||
   self.sorting.last || opts.filters
   self.baseUrl = opts.baseUrl
   self.query = initQuery({
     order: 'last', 
     count: parseInt(opts.count || 10)
   })
   debug('initial query', self.query, 'items.length=', self.items.length)
   debug('sorting', self.sorting, 'filters', opts.filters, 'showTabs', self.showTabs)

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
     if (ancestor.model === 'channel') return 'channel'
     else if (!ancestor.thread) return 'topic'
     else if (ancestor.thread && ancestor.thread.id === ancestor.topic.id) return 'thread'
     else if (ancestor.thread) return 'replies'
   }

   function initQuery(query) {
     var listType = self.ancestor && getListType(self.ancestor)
     debug('initQuery listType', listType, self.ancestor)
     if (opts.type) query.type = opts.type
     else if (opts.owner) query.owner = opts.owner
     else if (opts.my) query.my = opts.my
     else if (listType === 'topic') query.topic = getTopicId(self.ancestor)
     else if (listType === 'thread') query.thread = getThreadId(self.ancestor)
     else if (listType === 'replies' || listType === 'channel') query.parent = self.ancestor.id
     else if (opts.list) query.list = opts.list
     else if (opts.username && opts.cslug) query.list_url = opts.username + '/' + opts.cslug

     if (opts.model) query.model = opts.model
     if (opts.category) query.tag = opts.category
     if (opts.view) query.view = opts.view
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
       debug('loaded data', data.items && data.items.length + ', requested ', self.query.count)
       // update self.items in-place because it may be shared with parent tag like entry_detail
       if (!append) self.items.splice(0, self.items.length)
       self.items.push.apply(self.items, data.items)
       self.hasMore = (data.items.length >= self.query.count)
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

   self.flatMode = function() {
     debug('flatMode', self.query)
     if (!self.query.thread) return
     delete self.query.thread
     self.query.topic = getTopicId(self.ancestor)
     load()
   }

   self.threadedMode = function() {
     debug('threadedMode', self.query)
     if (!self.query.topic) return
     delete self.query.topic
     self.query.thread = getThreadId(self.ancestor)
     load()
   }

   if (typeof window !== 'undefined') self.on('mount', function() {
     if (!self.items.length) load()
   })

   //if (typeof window !== 'undefined' && !self.items.length) self.load()
  </script>
</umedia-entry-list>
