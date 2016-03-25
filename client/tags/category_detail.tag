<coect-category-detail>
  <div class="coect-category-detail">
    <coect-breadcrumbs if={ breadcrumbs } items={ breadcrumbs } />
    <umedia-channel channel={ category }></umedia-channel>
    <umedia-entry-list category={ category.name } 
    list={ opts.channel && opts.channel.id } items={ items }
    sorting={ sorting } />
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

  </script>

</coect-category-detail>
