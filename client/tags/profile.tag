<umedia-profile class="umedia-profile">
  <div class="media vcard">
    <div class="media-left">
      <a href={ Site.umedia.url.user(user) } class="url">
        <img class="media-object photo" width="128" height="128" alt={ user.id } src={ Site.account.avatar(user, 128) }>
      </a>
    </div>

    <div class="media-body">
      <h1><span class="fn">{ user.name || user.id }</span>
        <small if={ user.username }>@<span class="nickname">{ user.username }</span></small></h1>
      <umedia-wpml text={ user.about }></umedia-wpml>
      <p if={ user.location } class="umedia-location locality">{ user.location }</p>
      
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
