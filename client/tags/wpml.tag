<umedia-wpml class="umedia-wpml">

  <script>
   var self = this
   this.mixin('coect-context', 'umedia-context', 'coect-site-context')
   
   function rebuild(data) {
     debug('wpml.rebuild', self.opts.doc)
     if (self.opts.doc) self.root.innerHTML = self.opts.doc.html
   }

   this.on('mount', rebuild)
  </script>

</umedia-wpml>
