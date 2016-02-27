<umedia-profile class="umedia-profile">
  <div>
    <div class="media vcard">
      <div class="media-left">
        <a href={ url.user(user) } class="url">
          <img class="media-object photo" width="128" height="128" alt={ user.id } src={ url.avatar(user, 128) }>
        </a>
      </div>

      <div class="media-body">
        <h1><span class="fn">{ user.name || user.id }</span>
          <small if={ user.username }>@<span class="nickname">{ user.username }</span></small></h1>
        <umedia-wpml class="p-note" text={ user.about }></umedia-wpml>
        <p if={ user.location } class="umedia-location locality">{ user.location }</p>
        
      </div>

    </div>
    
    <div if={ opts.entries.length } >
      <h4>Recent entries</h4>
      <coect-entry-feed items={ opts.entries }></coect-entry-feed>
    </div>
    
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')

   self.user = opts.user
   self.debug('profile', self.url.user, self.url.user(self.user))

  </script>

  <style scoped>
   h1 {
     margin-top: 0;
   }
  </style>
</umedia-profile>
