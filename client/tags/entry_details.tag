<umedia-entry-details>
  <div class="umedia-entry-details">
    <ul class="list-unstyled">
      <li each={ e, i in opts.thread }>
        <umedia-entry entry={ e } compacted={ i < parent.opts.thread.length - 1}></umedia-entry>
      </li>
    </ul>
    <p if={ opts.entry.type == 'reply' }>View 
      <a href={ url.entry(opts.entry.thread_id) }>all replies</a> in the thread.
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
