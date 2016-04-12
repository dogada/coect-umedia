<umedia-channel-details>
  <div class="umedia-channel-detail">
    <coect-breadcrumbs items={ breadcrumbs } />
    <umedia-channel channel={ channel }></umedia-channel>
    <umedia-entry-editor if={ permissions.post } ancestor={ channel } items={ items } />
    <umedia-entry-list ancestor={ channel } />
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   debug('channel_details')
   var channel = self.channel = self.opts.channel
   self.permissions = self.opts.permissions || {}
   self.items = self.opts.entries || []
   self.query = {parent: channel.id}
   self.breadcrumbs = [
     {name: channel.owner.name, url: self.url.user(channel.owner)}
   ]
  </script>

</umedia-channel-details>
