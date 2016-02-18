<umedia-raw class="umedia-raw">
  <script>
   var self = this
   self.mixin('umedia-context')
   
   function refresh(data) {
     self.root.innerHTML = self.opts.html || ''
   }

   self.on('update', refresh)
   refresh()
  </script>

</umedia-raw>
