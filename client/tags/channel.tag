<umedia-channel>
  <div class="umedia-channel">
    <h3>{ channel.name }</h3>
    <div class="wpml">
      <umedia-wpml text={ channel.text }></umedia-wpml>
    </div>
    <ul class="list-inline" if={ Site.user && Site.user.admin }>
      <li><a href="{ Site.umedia.url.channel(channel.id, 'edit') }">edit</a></li>
    </ul>
  </div>

  <script type="es6">
   this.on('mount', e => this.update({channel: this.opts.channel}))
  </script>
</umedia-channel>
