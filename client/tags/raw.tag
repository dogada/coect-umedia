<umedia-raw class="umedia-raw">
  <script>
   var self = this
   this.mixin('coect-context', 'umedia-context', 'coect-site-context')
   
   function refresh(data) {
     self.root.innerHTML = self.opts.html
   }

   this.on('update', refresh)
   refresh()
  </script>

</umedia-raw>
