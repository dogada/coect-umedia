<umedia-channel-details>
  <div class="umedia-channel-detail">
    <umedia-channel channel={ channel }></umedia-channel>
    <umedia-entry-editor if={ permissions.post } ancestor={ channel } items={ items } />
    <umedia-entry-list list={ channel.id } channel={ channel } items={ items } />
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   debug('channel_details')
   self.channel = self.opts.channel
   self.permissions = self.opts.permissions || {}
   self.items = self.opts.entries || []
  </script>

</umedia-channel-details>
