<umedia-channel-editor>
  <div class="umedia-channel-editor">
    <form onsubmit={ save }>
      <div class="form-group">
        <label>Name <small>(max length 50 chars)</small></label>
        <input type="text" class="form-control" name="name"
               placeholder="Channel name">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea name="text" class="form-control"></textarea>
      </div>

      <div class="form-group">
        <button type="submit" class="btn btn-primary">Save</button>
        <button type="button" class="btn btn-danger" onclick={ cancel }>Cancel</button>
      </div>

    </form>
  </div>


  <script>
   var self = this
   this.mixin('coect-context', 'umedia-context', 'coect-site-context')
   debug('channel editor', self.opts)

   cancel(e) {
     if (Site.page.len) Site.page.back()
     else Site.page.show('/')
   }

   save(e) {
     debug('save name', self.cname, self)
     e.preventDefault()
     self.poutJson(
       self.url.channel(), {
         id: self.opts.id,
         name: self.name.value,
         text: self.text.value
       }
     ).done(function(obj) {
       console.log('done', obj)
       Site.page(self.url.channel(obj))
     })
   }

   load(id) {
     $.getJSON(self.url.channel(id), function(data) {
       self.name.value = data.name
       self.text.value = data.text
       self.update()
     }).fail(this.failHandler).complete(function() {
     })
   }

   if (self.opts.id) self.load(self.opts.id)
  
  </script>
</umedia-channel-editor>