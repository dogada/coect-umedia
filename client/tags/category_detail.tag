<coect-category-detail>
  <div class="coect-category-detail">
    <coect-breadcrumbs if={ breadcrumbs } items={ breadcrumbs } />
    <umedia-channel channel={ opts.category }></umedia-channel>
    <umedia-entry-list />
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   debug('category_detail', opts)
   var opts = self.opts, channel = opts.channel
   self.query = {tag: opts.category.name}
   if (opts.order) self.query.order = opts.order
   self.items = opts.items || []
   self.tabs = [
     {id: 'top', name: 'Top', url: ''},
     {id: 'last', name: 'Last'}
   ]
   self.tab = opts.tab
   self.baseUrl = self.url.category.bind(this, opts.category.name)

   self.on('tab:changed', function(tab) {
     debug('tab:changed', tab)
     if (tab == 'my') {
       self.query.owner = Site.user.id
       self.query.order = 'last'
     } else {
       self.query.order = tab
       delete self.query.owner
     }
     self.trigger('query:changed')
   })

   if (channel && channel.id) self.query.list = channel.id
   if (typeof Site !== 'undefined' && Site.user) {
     self.tabs.push({id: 'my', name: 'My'})
     if (self.tab == 'my') self.query.owner = Site.user.id
   }
   
   if (channel) self.breadcrumbs = [
     {name: channel.owner.name, url: self.url.user(channel.owner)},
     {name: channel.name, url: self.url.channel(channel)}
   ]

  </script>

</coect-category-detail>
