<coect-category-detail>
  <div class="coect-category-detail">
    <coect-breadcrumbs items={ breadcrumbs } />
    <umedia-entry-list category={ opts.category } 
    list={ opts.channel && opts.channel.id } items={ items } />
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   var opts = self.opts, channel = opts.channel
   debug('category_detail', opts)

   self.items = self.opts.items || []

   self.breadcrumbs = [{name: '#' + opts.category}]
   if (channel) self.breadcrumbs.splice(
     0, 0,
     {name: channel.owner.name, url: self.url.user(channel.owner)},
     {name: channel.name, url: self.url.channel(channel)})

  </script>

</coect-category-detail>
