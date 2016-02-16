<umedia-entry-details>
  <div class="umedia-entry-details">
    <coect-breadcrumbs items={ breadcrumbs } />

    <umedia-entry entry={ entry } detail="1"></umedia-entry>

    <p if={ entry.type == 'reply' }>View 
      <a href={ url.entry(entry.thread) }>all replies</a> in the thread.
    </p>

    <umedia-entry-editor if={ permissions.comment } 
      ancestor="{ entry }" items={ items }></umedia-entry-editor>

    <div class="login-required" hide={ Site.user }>
      Please <a onclick={ Site.account.loginRequired }>sign in</a> to add a comment or a reply.
    </div>

    <umedia-entry-list if={ entry.type != 'reply'} id="umedia-comments"
                       items={ items } ancestor={ entry }></umedia-entry-list>

  </div>
  
<script>
  var self = this
  self.mixin('umedia-context')
  var entry = self.entry = self.opts.entry
  self.permissions = opts.permissions || {}
  self.items = []
  self.breadcrumbs = [
    {name: entry.list.owner.name, url: self.url.user(entry.list.owner)},
    {name: entry.list.name, url: self.url.channel(entry.list)},
  ]
  if (entry.topic) self.breadcrumbs.push({name: entry.parent.name, url: self.url.entry(entry.parent)})
  </script>

  
</umedia-entry-details>
