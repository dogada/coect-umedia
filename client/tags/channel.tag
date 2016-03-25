<umedia-channel>
  <div class="umedia-channel">
    <h1 class="top-header">{ name }</h1> 

    <div class="wpml">
      <umedia-wpml text={ channel.text }></umedia-wpml>
    </div>

    <entity-footer entity={ channel } change={ canChange } />
  </div>

  <script type="es6">
   var self = this
   self.mixin('umedia-context')
   self.channel = self.opts.channel
   self.name = self.channel.name
   if (self.channel.type == 'category') self.name = '#' + self.name
   if (typeof Site !== 'undefined') self.canChange = Site.umedia.canChangeEntry(self.channel)
  </script>
</umedia-channel>
