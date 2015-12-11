<umedia-entry-list>
  <div if={ items.length } class="umedia-entries">
    
    <div if={ ancestor } class="umedia-entries-header clearfix">
      <ul class="nav nav-pills pull-right">
        <li role="presentation" class="{ query.order == 'last' ? 'active': ''}"><a onclick={ last }>Last</a></li>
        <li role="presentation" class="{ query.order == 'first' ? 'active': ''}"><a onclick={ first }>First</a></li>
        <li role="presentation" class="{ query.order == 'top' ? 'active': ''}"><a onclick={ top }>Top</a></li>
      </ul>

      <div>
        <h4 class="umedia-comments-title">
          { commentsTitle() }
          <a if={ ancestor.best_comment_count } href="#"><span class="badge">{ ancestor.best_comment_count } best</span></a>
        </h4>
        <a if={ ancestor.type == 'post' } onclick={ toggleComments }>{ commentsHint() }</a>
      </div>

    </div>
  </div>

  <div>
    <ul class="list-unstyled">
      <li each={e in items}>
        <umedia-entry entry={ e }></umedia-entry>
      </li>
    </ul>

    <a if={ hasMore } href="#" onclick={ more }>Load more</a>
  </div>

  <script>
   var debug = require('debug')('umedia:entry_list')
   var self = this, opts = self.opts
   debug('entry_list', self.opts)
   self.ancestor = opts.ancestor
   self.mixin('coect-context', 'umedia-context', 'coect-site-context')
   self.items = opts.items || []
   self.hasMore = false
   self.query = initQuery({
     order: 'last', 
     count: parseInt(opts.count || 10)
   })



   function getThreadId(entry) {
     return (entry.type == 'reply' ? entry.thread_id : entry.id)
   }

   function getCursor() {
     if (self.query.order === 'top') return {offset: self.items.length}
     else return {cursor: self.items[self.items.length - 1].id}
   }

   function initQuery(query) {
     if (opts.type) query.type = opts.type
     else if (opts.owner) query.user_id = opts.owner
     else if (self.ancestor) query.thread_id = getThreadId(self.ancestor)
     else if (opts.list) query.list_id = opts.list
     else if (opts.username && opts.cslug) query.list_url = opts.username + '/' + opts.cslug
     return query
   }

   function getQuery(append) {
     return (append ? $.extend(getCursor(), self.query) : self.query)
   }

   function load(append) {
     debug('load append=', append)
     var url = Site.umedia.url.entry('') + '?' + $.param(getQuery(append))
     $.getJSON(url, function(data) {
       self.update({
         hasMore: (data.length >= self.query.count),
         items: (append ? self.items.concat(data) : data)
       })
     }).fail(self.failHandler)
   }

   last() {
     self.query.order = 'last'
     load()
   }

   first() {
     self.query.order = 'first'
     load()
   }

   top() {
     self.query.order = 'top'
     load()
   }

   more() {
     debug("more entries.length=", self.items.length);
     load(true)
   }

   commentsTitle() {
     if (self.ancestor.type != 'post') return 'Replies'
     else if (self.query.topic_id) return 'With replies'
     else return 'Comments'
   }

   commentsHint() {
     return (self.query.thread_id ? 'With replies' : 'Comments only')
   }

   toggleComments() {
     debug('toggle', self.query)
     if (!self.query.thread_id) {
       delete self.query.topic_id
       self.query.thread_id = getThreadId(self.ancestor)
     } else {
       delete self.query.thread_id
       self.query.topic_id = self.ancestor.topic_id || self.ancestor.id
     }
     debug('after', self.query)
     load()
   }


   self.on('mount', load)
  </script>
</umedia-entry-list>
