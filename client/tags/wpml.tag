<umedia-wpml class="wpml">

  <script>
   var self = this
   this.mixin('umedia-context')

   function rebuild() {
     self.debug('wpml.rebuild')
     if (self.opts.doc) self.doc = self.opts.doc
     else if (self.opts.text) self.doc = self.wpml.doc(self.opts.text)

     if (self.doc) self.root.innerHTML = self.doc.html
   }

   this.on('mount', rebuild)
  </script>

</umedia-wpml>
