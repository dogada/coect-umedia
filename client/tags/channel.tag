<umedia-channel>
  <div class="umedia-channel">
    <h3>{ channel.name }</h3>
    <p>
      <umedia-wpml text={ channel.text }></umedia-wpml>
    </p>
    <ul class="list-inline" if={ Site.user && Site.user.admin }>
      <li><a href="{ Site.umedia.url.channel(channel.id, 'edit') }">edit</a></li>
    </ul>
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   debug('channel init', self.opts)

   function rebuild() {
     debug('channel.rebuild', self.opts.channel)
     self.channel = self.opts.channel
     self.update()
   }

   self.on('mount', rebuild)
  </script>
</umedia-channel>
