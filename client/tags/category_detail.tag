<coect-category-detail>
  <div class="coect-category-detail">
    <coect-breadcrumbs if={ breadcrumbs } items={ breadcrumbs } />
    <h1 class="top-header"><i class="grey">#</i>{ category.name }</h1>
    <umedia-entry-list category={ category.name } 
    list={ opts.channel && opts.channel.id } items={ items } />
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   var opts = self.opts, channel = opts.channel
   self.category = opts.category
   debug('category_detail', opts)

   self.items = self.opts.items || []

   if (channel) self.breadcrumbs = [
     {name: channel.owner.name, url: self.url.user(channel.owner)},
     {name: channel.name, url: self.url.channel(channel)}
   ]

  </script>

</coect-category-detail>
