<umedia-entry-details>
  <div class="umedia-entry-details">

    <ol class="breadcrumb">
      <li><a href={ Site.umedia.url.user(entry.list.owner) }>{ entry.list.owner.name }</a></li>
      <li><a href={ Site.umedia.url.channel(entry.list) }>{ entry.list.name }</a></li>
      <li if={ entry.topic }><a 
        href={ Site.umedia.url.entry(entry.parent) }>{ entry.parent.name }</a></li>
    </ol>

    <umedia-entry entry={ entry } detail="1" />

    <p if={ opts.entry.type == 'reply' }>View 
      <a href={ url.entry(opts.entry.thread) }>all replies</a> in the thread.
    </p>

    <umedia-entry-editor if={ canComment } ancestor="{ opts.entry }"></umedia-entry-editor>
    <h5 hide={ Site.user }>
      Please <a onclick={ Site.account.loginRequired }>sign in</a> to add a comment or a reply.
    </h5>

    <umedia-entry-list if={ opts.entry.type != 'reply'} id="umedia-comments"
                       store={ store }
                       ancestor={ opts.entry }></umedia-entry-list>

  </div>

  <style scoped>
   .breadcrumb {
     margin-bottom: 5px;
   }
  </style>
  <script>
   this.store = this.opts.store
   this.mixin('coect-context', 'umedia-context')
   this.canComment = Site.umedia.canComment(this.opts.entry)
  </script>
</umedia-entry-details>
