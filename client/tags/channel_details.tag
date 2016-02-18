<umedia-channel-details>
  <div class="umedia-channel-detail">
    <coect-breadcrumbs items={ breadcrumbs } />
    <h1 class="top-header">{ channel.name }</h1>

    <umedia-channel channel={ channel }></umedia-channel>
    <umedia-entry-editor if={ permissions.post } ancestor={ channel } items={ items } />
    <umedia-entry-list list={ channel.id } channel={ channel } items={ items } />
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   debug('channel_details')
   var channel = self.channel = self.opts.channel
   self.permissions = self.opts.permissions || {}
   self.items = self.opts.entries || []
   self.breadcrumbs = [
     {name: channel.owner.name, url: self.url.user(channel.owner)}
   ]
  </script>

</umedia-channel-details>
