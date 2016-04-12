<umedia-entry-list>

  <div class="umedia-entry-list">

    <div if={ tabs.length } class="clearfix">

      <ul class="nav nav-tabs pull-left">
        <li each={ t in tabs } class="{ active(tab == t.id) }">
          <a onclick={ changeTab } href="#" title={ t.title || '' }>{ t.name || t.id}</a>
        </li>
      </ul>

      <div if={ parent && parent.modes } class="btn-group pull-right" role="group" aria-label="View mode">
        <button each={ m in parent.modes } type="button" 
                class="btn btn-default { active(m.id == parent.parent.mode) }" 
                onclick={ m.handler } title={ m.name }><i class={ m.icon }></i></button>
      </div>

    </div>

    <div if={ items.length} >
      <ul class="{'entries h-feed': 1, 'p-comments': opts.comment,
          'list-unstyled': entryItem, 'list-inline category-list': !entryItem }">

        <li each={ e in (entryItem ? items : []) }>
          <umedia-entry entry={ e }
          ancestor={ parent.ancestor || parent.channel }
          comment={ parent.opts.comment } cite={ parent.opts.cite } 
          view={ parent.view } />
        </li>

        <li each={ e in (categoryItem ? items : []) }>
          <a href={ url.category(e.name) }>#{ e.name }</a>
        </li>

        <li each={ e in (userItem ? items : []) }>
          <coect-user-channel user={ e.owner } />
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
   self.items = opts.items || self.parent && self.parent.items || []
   self.hasMore = !opts.frozen
   self.view = opts.view || 'summary'
   self.tabs = self.parent && self.parent.tabs || []
   self.tab = opts.tab || self.tabs.length && self.tabs[0].id
   self.query = opts.query || self.parent && self.parent.query || {}

   if (!self.query.count) self.query.count = parseInt(opts.count || 10, 10)

   function setItem(tab) {
     self.categoryItem = self.userItem = self.entryItem = false
     if (self.tab == 'category') self.categoryItem = true
     else if (self.tab == 'user') self.userItem = true
     else  self.entryItem = true
   }

   setItem(self.tab)
   debug('initial query', self.query, 'items.length=', self.items.length)
   debug('tabs', self.tabs)
   debug('parent', self.parent)
   debug('modes', self.parent && self.parent.modes)

   self.changeTab = function(e) {
     self.tab = e.item.t.id
     setItem(self.tab)
     self.parent.trigger('tab:changed', self.tab, e)
   }

   self.active = function(test) {
     return (test ? ' active' : '')
   }


   function getCursor() {
     if (self.query.order === 'top') return {offset: self.items.length}
     else return {cursor: self.items[self.items.length - 1].id}
   }


   function getQuery(append) {
     return (append ? $.extend(getCursor(), self.query) : self.query)
   }

   self.rebuild = function(data) {
     self.hasMore = (data.length >= self.query.count)
     debug('rebuild', data.length, self.hasMore)
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
       self.rebuild(data.items)
       self.update()
     }))
   }

   self.more = function() {
     debug("more entries.length=", self.items.length);
     load(true)
   }

   if (self.parent) self.parent.on('query:changed', function() {
     load()
   })

   if (typeof window !== 'undefined') self.on('mount', function() {
     if (!self.items.length) load()
     else self.rebuild(self.items)
     self.update()
   })

   //if (typeof window !== 'undefined' && !self.items.length) self.load()
  </script>
</umedia-entry-list>
