<coect-taglist>
  <ul if={ opts.tags } class="coect-taglist list-inline h-feed category-list">
    <li each={ c in opts.tags }>
      <a href="{ url.category(c.name) }">#{ c.name }</a>
    </li>
  </ul>

  <script>
   var tag = this
   tag.mixin('umedia-context')
  </script>

</coect-taglist>
