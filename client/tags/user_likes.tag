<coect-user-likes>
  <div class="coect-user-likes">
    <umedia-entry-list tab={ tab }/>
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   debug('category_detail', opts)
   var opts = self.opts, channel = opts.channel
   self.items = opts.items || []
   self.tabs = [
     {id: 'like', name: 'Entries', title: 'Liked and saved entries'},
     {id: 'category', name: 'Tags', icon: 'hashtag'},
     {id: 'user', name: 'People'}
   ]
   self.tab = opts.tab || self.tabs[0].id
   self.query = {my: 'main', filter: self.tab}

   self.on('tab:changed', function(tab) {
     debug('tab:changed', tab)
     self.query.filter = tab
     self.trigger('query:changed')
   })
  </script>

</coect-user-likes>
