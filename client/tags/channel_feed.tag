<coect-channel-feed>
  <div if={ items.length } class="coect-channel-feed">
    <h4>{ opts.name || 'Channels' } ({ items.length })</h4>

    <ul class="list-unstyled">
      <li each={ c in items }>
        <a href="{ url.channel(c) }">{ c.name || 'Blog'}</a>
      </li>
    </ul>
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   self.items = opts.items || []
  </script>
</coect-channel-feed>
