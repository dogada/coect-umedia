<umedia-channel-list>
  <div if={ items.length } class="umedia-channel-list">
    <h4>{ opts.name || 'Channels' } ({ items.length })</h4>

    <ul class="list-unstyled">
      <li each={ c in items }>
        <a href="{ parent.url.channel(c) }">{ c.name || 'Blog'}</a>
      </li>
    </ul>
  </div>

  <script>
   var self = this
   self.items = opts.items || []
   this.mixin('coect-context', 'umedia-context')
   debug('channel_list', opts)
   function init(query) {
     $.getJSON(self.url.channel() + '?' + $.param(query), function(data) {
       self.update({items: data.items})
     }).fail(self.failHandler)
   }
   if (!opts.items) init({owner: self.opts.owner})
  </script>
</umedia-channel-list>
