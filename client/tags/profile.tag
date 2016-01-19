<umedia-profile class="umedia-profile">
  <div class="media">
    <div class="media-left">
      <img class="media-object" width="128" height="128" alt={ user.id } 
           src={ Site.account.avatar(user, 128) }>
    </div>

    <div class="media-body">
      <h1>{ user.name || user.id } <small if={ user.username }>@{ user.username }</small></h1>
      <umedia-wpml text={ user.about }></umedia-wpml>
      <p class="umedia-location">{ user.location }</p>
      
    </div>

  </div>
  
  <script>
   var self = this
   self.mixin('umedia-context')
   self.user = opts.user
  </script>

  <style scoped>
   .media-body h1 {
     margin-top: 0;
   }
  </style>
</umedia-profile>
