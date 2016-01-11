<umedia-channel>
  <div class="umedia-channel">
    <ol class="breadcrumb">
      <li><a href={ Site.umedia.url.user(channel.owner) }>{ channel.owner.name }</a></li>
      <li class="active">{ channel.name }</li>
    </ol>

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
