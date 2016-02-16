<umedia-channel>
  <div class="umedia-channel">
    <coect-breadcrumbs items={ breadcrumbs } />

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
   var channel = self.channel = self.opts.channel
   self.breadcrumbs = [
     {name: channel.owner.name, url: self.url.user(channel.owner)},
     {name: channel.name}
   ]
  </script>
</umedia-channel>
