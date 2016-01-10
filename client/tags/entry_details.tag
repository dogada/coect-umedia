<umedia-entry-details>
  <div class="umedia-entry-details">
    <h4>
      <a href={ Site.umedia.url.channel(entry.list) }>{ entry.list.name }</a>
    </h4>

    <umedia-entry-name entry={ entry.topic } if={ entry.topic }/>
    <umedia-entry-name entry={ entry.thread } if={ entry.type == 'reply' }/>
    <umedia-entry-name entry={ entry.parent } 
    if={ entry.type == 'reply' && entry.parent.id != entry.thread.id }/>
    <umedia-entry entry={ entry } detail="1" />

    <p if={ opts.entry.type == 'reply' }>View 
      <a href={ url.entry(opts.entry.thread) }>all replies</a> in the thread.
    </p>

    <umedia-entry-editor if={ canComment } ancestor="{ opts.entry }"></umedia-entry-editor>
    <h5 hide={ Site.user }>
      Please <a onclick={ Site.account.loginRequired }>sign in</a> to add a comment or a reply.
    </h5>

    <umedia-entry-list if={ opts.entry.type != 'reply'} id="umedia-comments"
                    ancestor={ opts.entry }></umedia-entry-list>

  </div>

  <script>
   this.mixin('coect-context', 'umedia-context', 'coect-site-context')
   this.canComment = Site.umedia.canComment(this.opts.entry)
  </script>
</umedia-entry-details>
