<coect-like-button>
  <span class="coect-like-button">
    <a href="#" onclick={ toggle } title="Like it!"><i
      class={"like fa fa-heart": 1, "liked": opts.entity.user_liked }></i></a>
    <a if={ opts.entity.like_count } href="#" onclick={ toggleLikes } >{ opts.entity.like_count }</a>
  </span>

  <script>
   var self = this
   self.mixin('umedia-context')
   
   self.toggle = function() {
     var method = (opts.entity['user_liked'] ? 'del' : 'post')
     self.store.entry[method](self.url.entry(opts.entity.id, 'like'), Site.callback(
       function(data) {
         $.extend(opts.entity, data)
         self.update()
       }
     ))
   }

   self.toggleLikes = function(e) {
     self.parent.update({showLikes: !self.parent.showLikes})
     if (self.parent.likes) return
     self.store.entry.get(self.url.entry(opts.entity.id, 'likes'), Site.callback(
       function(data) {
         self.parent.update({likes: data.items})
       }
     ))
   }

  </script>
</coect-like-button>
