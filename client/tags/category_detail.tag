<coect-category-detail>
  <div class="coect-category-detail">
    <coect-breadcrumbs if={ breadcrumbs } items={ breadcrumbs } />
    <umedia-channel channel={ category }></umedia-channel>
    <umedia-entry-list category={ category.name } 
    list={ opts.channel && opts.channel.id } items={ items }
    sorting={ sorting } tabs={ tabs } tab={ tab } owner={ owner } 
    base-url={ baseUrl } />
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   var opts = self.opts, channel = opts.channel
   self.category = opts.category
   self.sorting = {last: true, top: true}
   debug('category_detail', opts)

   self.items = self.opts.items || []
   if (channel) self.breadcrumbs = [
     {name: channel.owner.name, url: self.url.user(channel.owner)},
     {name: channel.name, url: self.url.channel(channel)}
   ]
   self.baseUrl = self.url.category.bind(this, self.category.name)
   if (typeof Site !== 'undefined' && Site.user) {
     self.tabs = [
       {id: 'my', name: 'My'}
     ]
     self.tab = opts.params.tab
     if (self.tab == 'my') self.owner = Site.user.id
   } else {
     self.tabs = []
   }

  </script>

</coect-category-detail>
