<coect-save-button>

  <span class="coect-save-button">
    <a href="#" onclick={ toggle } title="Bookmark it!"><i
      class={ "fa fa-bookmark": 1,  "saved": opts.entity.user_saved }></i></a>
  </span>

  <script>
   var self = this
   self.mixin('umedia-context')

   self.toggle = function() {
     var method = (opts.entity['user_saved'] ? 'del' : 'post')
     self.store.entry[method](self.url.entry(opts.entity.id, 'save'), Site.callback(
       function(data) {
         $.extend(opts.entity, data)
         self.update()
       }
     ))
   }
  </script>

</coect-save-button>
