<umedia-wpml class="umedia-wpml">
  <script>
   var self = this
   this.mixin('coect-context', 'umedia-context', 'coect-site-context')
   
   function refresh(data) {
     self.root.innerHTML = self.opts.doc.html
   }

   this.on('update', refresh)
   refresh()
  </script>

</umedia-wpml>
