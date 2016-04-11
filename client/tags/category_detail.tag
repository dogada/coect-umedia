<coect-category-detail>
  <div class="coect-category-detail">
    <coect-breadcrumbs if={ breadcrumbs } items={ breadcrumbs } />
    <umedia-channel channel={ opts.category }></umedia-channel>
    <umedia-entry-list props={ props } />
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   debug('category_detail', opts)
   var opts = self.opts, channel = opts.channel
   var props = self.props = {
     query: {tag: opts.category.name, order: opts.order},
     items: self.opts.items || [],
     tabs: [
       {id: 'top', name: 'Top', url: ''},
       {id: 'last', name: 'Last'}
     ],
     tab: opts.tab,
     baseUrl: self.url.category.bind(this, opts.category.name)
   }
   if (channel && channel.id) props.query.list = channel.id
   if (typeof Site !== 'undefined' && Site.user) {
     props.tabs.push({id: 'my', name: 'My'})
     if (props.tab == 'my') props.query.owner = Site.user.id
   }

   if (channel) self.breadcrumbs = [
     {name: channel.owner.name, url: self.url.user(channel.owner)},
     {name: channel.name, url: self.url.channel(channel)}
   ]

  </script>

</coect-category-detail>
