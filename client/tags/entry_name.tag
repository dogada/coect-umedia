<umedia-entry-name>
  <div id="e{entry.id}" class="umedia-entry-name media">
    
    <div class="media-left">
      <a href={ url.user(entry.owner) }>
        <img class="media-object" width="24" height="24" 
             title={ entry.owner.name || entry.owner.username || entry.owner.id }
        src={ url.avatar(entry.owner, 24) } alt="">
      </a>
    </div>

    <div class="media-body">
      <a href={ url.entry(entry) }>{ entry.name }</a>
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
