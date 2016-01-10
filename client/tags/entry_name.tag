<umedia-entry-name>
  <div id="e{entry.id}" class="umedia-entry-name media">
    
    <div class="media-left">
      <a href={ url.user(entry.owner) }>
        <img class="media-object" width="32" height="32" 
             title={ entry.owner.name || entry.owner.username || entry.owner.id }
        src={ entry.owner.avatar || Site.config.avatar(32) } alt="">
      </a>
    </div>

    <div class="media-body">
      <a href={ Site.umedia.url.entry(entry) }>{ entry.name }</a>
    </div>
  </div>

  <script>
   var self = this
   self.entry = opts.entry
   self.fullDate = function(d) {
     //debug('fullDate', typeof d, d, d.toLocaleString(), new Date().toLocaleString())
     return d && new Date(d).toLocaleString() || d
   }
  </script>
</umedia-entry-name>
