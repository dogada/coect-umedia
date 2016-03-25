<entity-footer>
  <div class="entity-footer">
    
    <aside class="coect-meta">
    
      <span class={ active-tab: showLikes }>
        <coect-like-button entity={ entity } />
      </span>
    
      <span if={ opts.change }>
        <a href={ entityUrl(entity.id, 'edit') }>Edit</a>
      </span>
    
      
      <span class="pull-right">
        <coect-save-button entity={ entity } />
      </span>
    
    </aside>

    <div if={ showLikes } class="like-list">
      <ul class="list-inline">
        <li each={ like in likes }>
        <a href={ url.user(like.owner) }>
          <img class="media-object" width="32" height="32" 
               alt={ like.owner.name } title={ like.owner.name }
          src={ url.avatar(like.owner, 32) }>
        </a>
        </li>
      </ul>
    </div>
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   self.entity = opts.entity
   self.entityUrl = (self.entity.model == 'channel' ? self.url.channel : self.url.entry)

   self.on('update', (ctx) => debug('footer update', arguments, self.showLikes))
  </script>
</entity-footer>
