<umedia-channel-details>
  <div class="umedia-channel-details">
    <umedia-channel if={ channel } channel={ channel }></umedia-channel>
    <umedia-entry-editor if={ channelId && canPost } list="{ channelId }"></umedia-entry-editor>
    <umedia-entry-list list={ opts.id } username={ opts.username } 
      cslug={ opts.cslug }></umedia-entries>
  </div>

  <script>
   var self = this
   debug('channel_details', this.opts)
   this.mixin('coect-context', 'umedia-context')
   this.channelId = opts.id

   function setChannel(c) {
     debug('setChannel', c)
     if (c.id) self.update({channel: c,
                            canPost: Site.umedia.canPost(c),
                            channelId: c.id})
   }

   function init(opts) {
     var url = self.url.channel(
       opts.id ? opts.id : {url: opts.username + '/' + opts.cslug})
     debug('init url', url)
     $.getJSON(url, setChannel).fail(this.failHandler)
   }
   init(this.opts)
  </script>

</umedia-channel-details>
