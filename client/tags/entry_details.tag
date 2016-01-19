<umedia-entry-details>
  <div class="umedia-entry-details">

    <ol class="breadcrumb">
      <li><a href={ Site.umedia.url.user(entry.list.owner) }>{ entry.list.owner.name }</a></li>
      <li><a href={ Site.umedia.url.channel(entry.list) }>{ entry.list.name }</a></li>
      <li if={ entry.topic }><a 
        href={ Site.umedia.url.entry(entry.parent) }>{ entry.parent.name }</a></li>
    </ol>

    <umedia-entry entry={ entry } detail="1" />

    <p if={ entry.type == 'reply' }>View 
      <a href={ url.entry(entry.thread) }>all replies</a> in the thread.
    </p>

    <umedia-entry-editor if={ canComment } 
      ancestor="{ entry }" items={ items }></umedia-entry-editor>

    <h5 hide={ Site.user }>
      Please <a onclick={ Site.account.loginRequired }>sign in</a> to add a comment or a reply.
    </h5>

    <umedia-entry-list if={ entry.type != 'reply'} id="umedia-comments"
                       store={ store } items={ items }
                       ancestor={ entry }></umedia-entry-list>

  </div>

  <style scoped>
   .breadcrumb {
     margin-bottom: 5px;
   }
  </style>
  <script>
   var self = this
   self.mixin('umedia-context')
   self.entry = this.opts.entry
   self.store = this.opts.store
   self.items = []
   self.canComment = Site.umedia.canComment(self.entry)
  </script>
</umedia-entry-details>
