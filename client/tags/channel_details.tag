<umedia-channel-details>
  <div class="umedia-channel-detail">
    <umedia-channel channel={ channel }></umedia-channel>
    <umedia-entry-editor if={ permissions.post } ancestor={ channel } items={ items } />
    <umedia-entry-list list={ channel.id } channel={ channel } items={ items } />
  </div>

  <script>
   this.mixin('coect-context', 'umedia-context')
   var self = this
   debug('channel_details', this.opts)
   self.channel = opts.channel
   self.permissions = opts.permissions || {}
   self.items = []
  </script>

</umedia-channel-details>
