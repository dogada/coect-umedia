<umedia-channel-details>
  <div class="umedia-channel-detail">
    <umedia-channel if={ channel } channel={ channel }></umedia-channel>
    <umedia-entry-editor if={ channel && canPost } ancestor="{ channel }" />
    <umedia-entry-list list={ opts.id } username={ opts.username } 
      cslug={ opts.cslug } />
    </div>

  <script>
   var self = this
   debug('channel_details', this.opts)
   this.mixin('coect-context', 'umedia-context')

   function setChannel(c) {
     debug('setChannel', c)
     if (c.id) self.update({channel: c,
                            canPost: Site.umedia.canPost(c)})
   }

   function init(opts) {
     var url = self.url.channel(
       opts.id ? opts.id : {url: opts.username + '/' + opts.cslug})
     debug('init url', url)
     $.getJSON(url, setChannel).fail(self.failHandler)
   }
   init(this.opts)
  </script>

</umedia-channel-details>
