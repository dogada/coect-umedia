<coect-entry-feed>
  <div if={ items.length } class="coect-entry-feed">
    <ul class="list-unstyled h-feed">
      <li each={ e in items } class="h-entry">
        <a href="{ url.entry(e) }" class="u-url p-name">{ e.name }</a>
      </li>
    </ul>
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   self.items = opts.items || []
  </script>

</coect-entry-feed>
