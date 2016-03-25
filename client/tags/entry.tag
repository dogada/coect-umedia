<umedia-entry>
  <div id="e{entry.id}" class={'h-entry': hentry, 'h-cite': opts.cite, 'p-comment': opts.comment, 'highlighted': entry.highlighted, 'media umedia-entry': 1}>
    
    <h1 if={ title && opts.detail } class="p-name">{ title }</h1>
    <h2 if={ title && !opts.detail }><a class="p-name" href={ url.entry(entry) }>{ title }</a></h2>

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
        
        <a if={ objectUrl } href={ objectUrl }>{ objectName || 'Noname' }</a>

        <a 
          class="u-url permalink" href={ url.entry(entry) } 
          title={ createdLocaleStr }><time 
          class="dt-published"
          datetime={ createdISOStr }>{ createdAgeStr } ago</time></a>
        
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

      <article class="entry-content { (hentry || opts.detail) ? 'e-content': 'p-content' }">
        <umedia-wpml doc={ doc }></umedia-wpml>
      </article>

      <div if={ showReadMore } class="coect-meta read-more">
        <a href={ url.entry(entry) }>Read more…</a>
      </div>

      <p if={ entry.model == 'repost' && !entry.name } class="coect-meta">Referenced entry 
        <a href={ url.entry(entry.ref) }>{ entry.ref }</a> was not found or deleted.
      </p>

      <aside class="entity-footer coect-meta">

        <span if={ hasCounters } class={ active-tab: showLikes }>
          <coect-like-button entity={ entry } />
        </span>

        <span if={ hasCounters } >
          <a href={ url.entry(entry) } title="Comments"><i class="comments fa fa-comments"></i>
            { entry.child_count || "" }</a>
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
         <coect-save-button entity={ entry } />
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

      <coect-bridgy-config if={ coect.bool(meta.bridgy) } meta={ meta } />

    </div>
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   var opts = self.opts
   var Access = self.Access = require('coect').Access
   self.ancestor = self.opts.ancestor
   var entry = self.entry = self.opts.entry || self.opts.state &&
   self.opts.state.entry

   self.hentry = opts.hentry || (!opts.cite && !opts.comment && !opts.detail)
   debug('h-entry', self.hentry, 'cite=', opts.cite, 'comment', opts.comment, 'detail=', opts.detail, entry)

   function yourType() {
     return (Site.user && Site.user.id === entry.recipient ? ' your ' + entry.type : '')
   }

   self.actionName = function() {
     //self.debug('actionName', type, webmType)
     if (entry.model === 'like') return (entry.access == Access.HIDDEN ? 'saved': 'liked') + yourType()
     else if (entry.model === 'repost') return 'reposted' + yourType()
     else if (entry.type === 'comment' || entry.type === 'reply' || self.replyToUrl) return 'to'
     else if (entry.type === 'bookmark') return 'bookmarked' + yourType()
     else if (entry.type === 'rsvp') return 'rsvp'
     else if (entry.type === 'mention') return 'mentioned'
     else if (entry.type === 'link' || entry.type === 'webmention') return 'mentioned'
     return ''
   }

   function initHeader() {
     self.action = self.actionName()
     if (entry.ref) {
       self.objectUrl = self.url.entry(entry.ref)
       self.objectName = entry.name
     } else if (entry.type == 'post' && self.replyToUrl) {
       self.objectUrl = self.replyToUrl
       self.objectName = self.meta.reply_to_name || self.coect.util.truncateUrl(self.replyToUrl)
     } else if (entry.type == 'reply' || entry.type == 'comment') {
       self.objectUrl = self.url.entry(entry.parent)
       self.objectName = self.meta.reply_to_name
     } else if (opts.list_name) {
       self.objectUrl = self.url.entry(entry.channel)
       self.objectName = entry.list.name
     } else if (entry.source && entry.link.target) {
       self.objectUrl = entry.source
       debug('entry.source', entry.source)
       self.objectName = self.coect.util.truncateUrl(entry.link.target)
     }

     if (entry.created) {
       // self.created is ISO string on client-side and Date on server-side
       var d = new Date(self.webmention && self.webmention.published || entry.created)
       self.createdLocaleStr = d.toLocaleString()
       self.createdISOStr = d.toISOString()
       self.createdAgeStr = self.getAge(d) //getAge is from mixin
     }
   }

   function initContent() {
     var hasContent = entryMeta.p_count === undefined || entryMeta.p_count > 0
     var content = (self.summaryView ? entry.head : entry.text) || entry.head || entry.name || ''
     if (entry.ref) content = ''
     self.doc = self.wpml.doc(content)
     self.title = self.doc.meta.title || entryMeta && entryMeta.title
     self.showReadMore = self.summaryView && entry.text && (entryMeta.p_count === undefined || entryMeta.p_count > 1)
   }

   if (entry) { //workaround for Riot 2.3 issues with evaluating tags with if={false}
     var entryMeta = entry.meta || {}
     self.meta = self.coect.object.assign(
       {}, entry.list && entry.list.meta || {}, entryMeta)
     debug('entry meta', entry.name, self.meta)
     self.source = entry.source
     self.webmention = entry.source && entry.link
     self.replyToUrl = self.meta.reply_to || entry.parent && entry.parent.source
     self.summaryView = (opts.view === 'summary')
     debug('summaryView', self.summaryView)
     initContent()
     initHeader()
     self.hasCounters = (entry.model == 'entry')
     debug('counters', self.hasCounters, 'action', self.action,
           'objectUrl', self.objectUrl, 'replyTo', self.replyToUrl)
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


   self.broadcast = function(e) {
     self.store.entry.post(self.url.entry(self.entry.id, 'broadcast'), Site.callback(function(data) {
       debug('broadcasted', data)
       self.entry.meta = self.coect.object.assign({}, self.entry.meta || {}, data.meta)
       Site.flash(JSON.stringify(data.results))
     }))
   }


   if (entry && typeof window !== 'undefined') {
     self.canChange = Site.umedia.canChangeEntry(self.entry)
     self.canBroadcast = Site.umedia.canBroadcast(self.entry)
   }
  </script>

</umedia-entry>
