<coect-bridgy-config>

  <div style="display: none">
    <a href="https://brid.gy/publish" class={ classes }></a>
    <a if={ coect.bool(meta.facebook) } href="https://brid.gy/publish/facebook" rel="nofollow"></a>
    <a if={ coect.bool(meta.twitter) } href="https://brid.gy/publish/twitter" rel="nofollow"></a>
    <a if={ coect.bool(meta.instagram) } href="https://brid.gy/publish/instagram" rel="nofollow"></a>
    <a if={ coect.bool(meta.flickr) } href="https://brid.gy/publish/flickr"
    rel="nofollow"></a>
    <p if={ meta.twitter_content } class="p-bridgy-twitter-content">{ meta.twitter_content }</p>
    <p if={ meta.facebook_content } class="p-bridgy-facebook-content">{ meta.facebook_content }</p>
  </div>

  <script>
   var self = this
   self.mixin('umedia-context')
   self.meta = opts.meta

   function bridgy(prop) {
     return self.coect.bool(self.meta.bridgy) && self.meta.bridgy.indexOf(prop) > -1 
   }
   
   self.classes = (bridgy('omit-link') ? 'u-bridgy-omit-link' : '')
   if (bridgy('ignore-formatting')) self.classes += ' u-bridgy-ignore-formatting'
  </script>

</coect-bridgy-config>
      
