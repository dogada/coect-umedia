<coect-category-detail>
  <div class="coect-category-detail">
    Category { category }
    <umedia-entry-list category={ category } channel={ channel } items={ items } />
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   debug('tag_detail')
   self.category = self.opts.category
   self.channel = self.opts.channel
   self.permissions = self.opts.permissions || {}
   self.items = self.opts.items || []
  </script>

</coect-category-detail>
