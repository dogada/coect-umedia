<umedia-channel>
  <div class="umedia-channel">
    <h1 class="top-header">{ name }</h1> 

    <div class="wpml">
      <umedia-wpml text={ channel.text }></umedia-wpml>
    </div>

    <aside class="entity-footer coect-meta">
      
      <span class={ active-tab: showLikes }>
        <coect-like-button entity={ channel } />
      </span>
      
      <span if={ canChange }>
        <a href={ url.channel(channel.id, 'edit') }>Edit</a>
      </span>

      <span class="pull-right">
        <coect-save-button entity={ channel } />
      </span>

    </aside>

  </div>

  <script type="es6">
   var self = this
   self.mixin('umedia-context')
   self.channel = self.opts.channel
   self.name = self.channel.name
   if (self.channel.type == 'category') self.name = '#' + self.name
   self.canChange = Site.umedia.canChangeEntry(self.channel)
  </script>
</umedia-channel>
