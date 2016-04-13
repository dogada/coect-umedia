<coect-user-likes>
  <div class="coect-user-likes">
    <umedia-entry-list tab={ tab }/>
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   var opts = self.opts, channel = opts.channel
   debug('user_likes', opts)

   self.items = opts.items || []
   self.tabs = [
     {id: 'entry', name: 'Entries', title: 'Liked and saved entries'},
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
