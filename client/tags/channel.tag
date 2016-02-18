<umedia-channel>
  <div class="umedia-channel">
    <div class="wpml">
      <umedia-wpml text={ channel.text }></umedia-wpml>
    </div>
    <ul class="list-inline" if={ Site.user && Site.user.admin }>
      <li><a href="{ url.channel(channel.id, 'edit') }">edit</a></li>
    </ul>
  </div>

  <script type="es6">
   var self = this
   self.mixin('umedia-context')
   self.channel = self.opts.channel
  </script>
</umedia-channel>
