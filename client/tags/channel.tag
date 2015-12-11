<umedia-channel>
  <div class="umedia-channel">
    <h3>{ opts.channel.name }</h3>
    <p>
      <umedia-wpml doc={ doc }></umedia-wpml>
    </p>
    <ul class="list-inline" if={ Site.user && Site.user.admin }>
      <li><a href="{ Site.umedia.url.channel(opts.channel.id, 'edit') }">edit</a></li>
    </ul>
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   debug('channel init', self.opts)

   function rebuild() {
     self.doc = self.wpml.doc(self.opts.channel.text || '')
     debug('channel.rebuild', self.opts.channel, self.doc)
     self.update()
   }

   self.on('mount', rebuild)
  </script>
</umedia-channel>
