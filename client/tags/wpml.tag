<umedia-wpml class="umedia-wpml">

  <script>
   var self = this
   this.mixin('coect-context', 'umedia-context', 'coect-site-context')
   

   function rebuild() {
     debug('wpml.rebuild', self.opts)
     if (self.opts.doc) self.doc = self.opts.doc
     else if (self.opts.text) self.doc = self.wpml.doc(self.opts.text)

     if (self.doc) self.root.innerHTML = self.doc.html
   }

   this.on('mount', rebuild)
  </script>

</umedia-wpml>
