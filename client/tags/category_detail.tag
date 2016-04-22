<coect-category-detail>
  <div class="coect-category-detail">
    <coect-breadcrumbs if={ breadcrumbs } items={ breadcrumbs } />
    <umedia-channel channel={ opts.category }></umedia-channel>
    <umedia-entry-list filters="1" if={ query.list }/>
    <p if={ !query.list }>No entries are found for the tag.</p>
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   debug('category_detail', opts)
   var opts = self.opts, channel = opts.channel, category = opts.category
   self.query = {}
   self.items = opts.items || []
   self.tabs = [
     {id: 'top', name: 'Top', url: ''},
     {id: 'last', name: 'Last'}
   ]

   if (typeof Site !== 'undefined' && Site.user) {
     self.tabs.push({id: 'my', name: 'My'})
   }

   function setTab(tab) {
     self.tab = tab
     if (tab == 'my') { // entries tagged by current user
       self.coect.object.assign(self.query, {
         order: 'last',
         owner: opts.owner || Site.user && Site.user.id,
         tag: category.name,
         list: channel && channel.id
       })
     } else if (channel) { // entries inside channel filtered by a tag 
       self.coect.object.assign(self.query, {
         order: tab,
         owner: undefined,
         list: channel.id,
         tag: category.name
       })
     } else {//root category
       self.coect.object.assign(self.query, {
         order: tab,
         list: category.id,
         owner: undefined,
         tag: undefined
       })
     }
   }

   setTab(opts.tab || self.tabs[0].id)

   self.on('tab:changed', function(tab) {
     debug('tab:changed', tab)
     setTab(tab)
     self.trigger('query:changed')
   })
   
   if (channel) self.breadcrumbs = [
     {name: channel.owner.name, url: self.url.user(channel.owner)},
     {name: channel.name, url: self.url.channel(channel)}
   ]

  </script>

</coect-category-detail>
