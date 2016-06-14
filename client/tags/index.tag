<coect-index>
  <div class="coect-index">
    <h1><yield from="head" /></h1>

    <ul if={ opts.tags } class="list-inline h-feed category-list">
      <li each={ c in opts.tags }>
        <a href="{ url.category(c.name) }">#{ c.name }</a>
      </li>
    </ul>
    
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
  </script>

</coect-index>
