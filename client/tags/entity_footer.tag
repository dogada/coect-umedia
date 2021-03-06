<entity-footer>
  <div class="entity-footer">
    
    <aside class="coect-meta">
      
      <span class={ active-tab: showLikes }>
        <coect-like-button entity={ entity } />
      </span>

      <span if={ opts.comments }>
        <a href={ url.entry(entity) } title="Comments"><i class="comments fa fa-comments"></i>
          { entity.child_count || "" }</a>
      </span>
      
      <span if={ opts.replyToUrl }>
        <a href={ opts.replyToUrl } class="u-in-reply-to"
           title="In reply to"><i class="fa fa-external-link-square"></i></a>
      </span>

      <span if={ entity.meta }>
        <a if={ entity.meta.facebook_url } class="u-syndication" rel="syndication"
           href={ entity.meta.facebook_url }><i class="fa fa-facebook"></i></a>
        <a if={ entity.meta.twitter_url } class="u-syndication" rel="syndication" 
           href={ entity.meta.twitter_url }><i class="fa fa-twitter"></i></a>
        <a if={ entity.source } class="u-syndication" rel="syndication" title="Source url"
           href={ entity.source }><i class="fa fa-{ sourceIcon(source) }"></i></a>
      </span>

      <span if={ opts.broadcast }>
        <a href="#" onclick={ broadcast }>Broadcast</a>
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
   if (self.entity) self.entityUrl = (self.entity.model == 'channel' ? self.url.channel : self.url.entry)
   debug('entity-footer', self.entity && self.entity.meta)

   self.sourceIcon = function(url) {
     if (/^https?:\/\/twitter.com/.test(url)) return 'twitter'
     if (/^https?:\/\/(\w+\.)?facebook.com/.test(url)) return 'facebook'
     return 'external-link'
   }

   self.broadcast = function(e) {
     self.store.entry.post(self.url.entry(self.entity.id, 'broadcast'), Site.callback(function(data) {
       debug('broadcasted', data)
       self.entity.meta = self.coect.object.assign({}, self.entity.meta || {}, data.meta)
       Site.flash(JSON.stringify(data.meta || 'Broadcasted'))
       self.parent.update()
     }))
   }

  </script>
</entity-footer>
