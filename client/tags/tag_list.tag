<umedia-tag-list>
  <div class="umedia-tag-list">
    <ul class="list-unstyled">
      <li each={ t in tags }>
        <a href="{ url('t', t) }">{ t }</a>
      </li>
    </ul>
  </div>

  <script>
   var self = this
   this.mixin('coect-context', 'umedia-context', 'coect-site-context')

   function init(query) {
     var url = self.url.base('t')
     $.getJSON(url + '?' + $.param(query), function(data) {
       self.items = data
       self.update()
     }).fail(self.failHandler)
   }

   init({list: self.opts.list})
  </script>
</umedia-tag-list>
