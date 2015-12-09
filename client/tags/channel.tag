<umedia-channel>
  <div class="umedia-channel" if={ opts.channel }>
    <h3>{ opts.channel.name }</h3>
    <p class="small">{ opts.channel.text }</p>
    <ul class="list-inline" if={ Site.user.admin }>
      <li><a href="{ Site.umedia.url.channel(opts.channel.id, 'edit') }">edit</a></li>
    </ul>
  </div>
</umedia-channel>
