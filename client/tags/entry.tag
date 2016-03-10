<umedia-entry>
  <div id="e{entry.id}" class={'h-entry': hentry, 'h-cite': opts.cite, 'p-comment': opts.comment, 'highlighted': entry.highlighted, 'media umedia-entry': 1}>
    
    <h1 if={ title && opts.detail } class="p-name">{ title }</h1>
    <h2 if={ title && !opts.detail } class="p-name">{ title }</h2>

    <div class="media-left">
      <a class="p-author h-card" href={ url.user(entry.owner) }>
        <img class="media-object" width="32" height="32" 
             alt={ entry.owner.name } title={ entry.owner.name }
             src={ url.avatar(entry.owner, 32) }>
      </a>
    </div>

    <div class="media-body">

      <aside class="entry-header coect-meta">
        <a class="umedia-display-name" href="{ url.user(entry.owner) }"
           title="{ entry.owner.username || entry.owner.id }">{ displayName(entry.owner) }</a> 
        
        <span if={ action }>{ action }</span>
        
        <a if={ parentUrl } href={ parentUrl }>{ parentName || 'Noname' }</a>

        <a class="u-url permalink" href={ url.entry(entry) } title={ createdLocaleStr }>
            <time class="dt-published" datetime={ createdISOStr }>{ createdAgeStr } ago</time>
        </a>
        
        <span if="{ entry.access == Access.MODERATION }" onclick={ moderate } class="restricted"
              title="The entry is awaiting for moderation.">moderation</span>
        
        <span if="{ entry.access == Access.REJECTED }" class="restricted"
              title="The entry was rejected after moderation.">rejected</span>
        
        <span if="{ entry.access == Access.HIDDEN }" class="restricted"
                title="The entry is visible to owner and admins only.">hidden</span>
        
        <span if="{ isRestricted(entry) }" class="restricted"
              title="Access to the entry is restricted (level: { entry.access }).">restricted</span>

      </aside>
    
      <div class="entry-tags coect-meta">
        <ul if={ entry.tags } class="list-inline">
          <li each={ t, i in entry.tags }>
            <a href="{ url.category(t) }" class="p-category">{ t }</a>
          </li>
        </ul>
      </div>

      <article class={ (hentry || opts.detail) ? 'e-content': 'p-content' }>
        <umedia-wpml doc={ doc }></umedia-wpml>
      </article>

      <aside class="entry-footer coect-meta">

        <span if={ hasCounters }>
          <a onclick={ like } title="Like it!"><i
            class={"like fa fa-heart": 1, "liked": entry.liked }></i></a>
          <a if={ entry.like_count } href="{ url.entry(entry) }/?likes">{ entry.like_count }</a>
        </span>

        <span if={ hasCounters } >
          <a href={ url.entry(entry) } title="Comments"><i class="comments fa
          fa-comments"></i> { entry.child_count || "" }</a>
        </span>

        <span if={ replyToUrl }>
          <a href={ replyToUrl } class="u-in-reply-to"
             title="In reply to"><i class="fa fa-external-link-square"></i></a>
        </span>

        <span>
          <a if={ meta.facebook_url } class="u-syndication" rel="syndication"
             href={ meta.facebook_url }><i class="fa fa-facebook"></i></a>
          <a if={ meta.twitter_url } class="u-syndication" rel="syndication" 
             href={ meta.twitter_url }><i class="fa fa-twitter"></i></a>
          <a if={ source } class="u-syndication" rel="syndication" title="Source url"
             href={ source }><i class="fa fa-{ sourceIcon(source) }"></i></a>
        </span>

       <span if={ canChange }>
         <a href={ url.entry(entry.id, 'edit') }>Edit</a>
       </span>

       <span if={ canBroadcast }>
         <a onclick={ broadcast }>Broadcast</a>
       </span>

       <span if={ hasCounters } class="pull-right">
         <a onclick={ save } title="Bookmark it!"><i class={"fa fa-bookmark": 1,  "saved": entry.saved}></i></a>
       </span>

      </aside>

      <coect-bridgy-config if={ coect.bool(meta.bridgy) } meta={ meta } />

    </div>
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   var opts = self.opts
   var Access = self.Access = require('coect').Access
   self.ancestor = self.opts.ancestor
   var entry = self.entry = self.opts.entry || self.opts.state && self.opts.state.entry
   self.hentry = opts.hentry || (!opts.cite && !opts.comment && !opts.detail)
   debug('h-entry', self.hentry, 'cite=', opts.cite, 'comment', opts.comment, 'detail=', opts.detail, entry)

   self.actionName = function(type, replyTo) {
     //self.debug('actionName', type, webmType)
     if (type === 'reply' || replyTo) return 'to'
     else if (type === 'like') return 'liked'
     else if (type === 'repost') return 'reposted'
     else if (type === 'bookmark') return 'bookmarked'
     else if (type === 'rsvp') return 'rsvp'
     else if (type === 'mention' || type === 'link') return 'mentioned'
     return ''
   }

   if (entry) { //workaround for Riot 2.3 issues with evaluating tags with if={false}
     self.meta = self.coect.object.assign(
       {}, entry.list && entry.list.meta || {}, entry.meta || {})
     debug('entry meta', entry.name, self.meta)
     self.webmention = entry.link && entry.link.webmention
     self.source = entry.source || self.webmention && self.webmention.url
     debug('bridgy', self.coect.bool(self.meta.bridy))
     
     self.doc = self.wpml.doc(entry.text || '')
     self.title = self.doc.meta.title
     self.type = self.webmention && self.webmention.type || (entry.type === 'comment' ? 'reply' : entry.type)

     self.replyToUrl = self.meta.reply_to || entry.parent && entry.parent.source
     if (self.type == 'post' && self.replyToUrl) {
       self.parentUrl = self.replyToUrl
       self.parentName = self.meta.reply_to_name || self.coect.util.truncateUrl(self.replyToUrl)
     } else if (self.type == 'reply' || self.type == 'webmention') {
       self.parentUrl = self.url.entry(entry.parent)
       self.parentName = self.meta.reply_to_name
     } else if (opts.list_name) {
       self.parentUrl = self.url.entry(entry.channel)
       self.parentName = entry.list.name
     }
     self.action = self.actionName(self.type, self.replyToUrl)
     self.hasCounters = (self.type == 'post' || self.type == 'reply')
     debug('type', self.type, 'action', self.action, 'parent', self.parentUrl, 'replyTo', self.replyToUrl)
   }

   self.sourceIcon = function(url) {
     if (/^https?:\/\/twitter.com/.test(url)) return 'twitter'
     if (/^https?:\/\/(\w+\.)?facebook.com/.test(url)) return 'facebook'
     return 'external-link'
   }


   self.isRestricted = function(entry) {
     if ([Access.MODERATION, Access.REJECTED,
     Access.HIDDEN].indexOf(entry.access) !== -1) return false
     if (self.ancestor && self.ancestor.access) return entry.access < self.ancestor.access
     return entry.access !== Access.EVERYONE
   }

   self.displayName = function(user) {
     return user.name || 'Noname'
   }

   self.expand = function(e) {
     var div = $(e.target).parents('.umedia-entry')[0] || $(e.target)
     if (!$(div).hasClass('umedia-compacted')) return true // use default hadler
     $(div).removeClass('umedia-compacted')
     return false
   }

   self.commentsLabel = function(entry) {
     if (!entry.child_count) return 'Reply'
     else return 'Replies (' + entry.child_count + ')'
   }

   self.moderate = function(e) {
     if (!Site.umedia.canModerateEntry(e)) return
     if (!(e.ctrlKey || e.altKey || e.metaKey || e.shiftKey)) return //ignore normal click
     self.debug('moderate access=', self.entry.access, 'alt=', e.altKey,
                'meta=', e.metaKey, 'ctrl=', e.ctrlKey, 'shift=', e.shiftKey, 'name=', self.entry.name)
     self.store.entry.moderate(self.entry, e.ctrlKey, Site.callback(
       function(data) {
         self.update({entry: $.extend(self.entry, data)})
       }
     ))
   }
   
   self.best = function(action, flag) {
     var method = (self.entry[flag || action + 'd'] ? 'del' : 'post')
     self.store.entry[method](self.url.entry(self.entry.id, action), Site.callback(
       function(data) {
         self.update({entry: $.extend(self.entry, data)})
       }
     ))
   }
   
   self.like = function(e) {
     self.best('like')
   }

   self.save = function(e) {
     self.best('save')
   }

   self.broadcast = function(e) {
     self.store.entry.post(self.url.entry(self.entry.id, 'broadcast'), Site.callback(function(data) {
       debug('broadcasted', data)
       self.coect.object.assign(self.entry.meta, data.meta)
       Site.flash(JSON.stringify(data.results))
     }))
   }

   if (entry && entry.created) {
     // self.created is ISO string on client-side and Date on server-side
     var d = new Date(self.webmention && self.webmention.published || entry.created)
     self.createdLocaleStr = d.toLocaleString()
     self.createdISOStr = d.toISOString()
     self.createdAgeStr = self.getAge(d) //getAge is from mixin
   }

   if (entry && typeof window !== 'undefined') {
     self.canChange = Site.umedia.canChangeEntry(self.entry)
     self.canBroadcast = Site.umedia.canBroadcast(self.entry)
   }
  </script>

  <style>
  </style>
</umedia-entry>
