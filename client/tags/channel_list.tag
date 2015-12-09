<umedia-channel-list>
  <div class="umedia-channel-list">
    <ul class="list-unstyled">
      <li each={ c in items }>
        <a href="{ parent.url.channel(c) }">{ c.name || 'Blog'}</a>
      </li>
    </ul>
  </div>

  <script>
   var self = this
   this.mixin('coect-context', 'umedia-context')
   debug('channels', self.url.channel())
   function init(query) {
     $.getJSON(self.url.channel() + '?' + $.param(query), function(data) {
       self.items = data
       self.update()
     }).fail(this.failHandler)
   }

   init({owner: self.opts.owner})
  </script>
</umedia-channel-list>
