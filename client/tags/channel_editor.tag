<umedia-channel-editor>
  <div class="umedia-channel-editor">
    <form onsubmit={ save } method="POST">
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

  <style scoped>
   .umedia-channel-editor {
     margin-top: 10px;
   }
  </style>


  <script>
   var self = this
   this.mixin('coect-context', 'umedia-context')
   debug('channel editor', self.opts)

   self.cancel = function(e) {
     if (Site.page.len) Site.page.back()
     else Site.page.show('/')
   }

   self.save = function(e) {
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

   self.load = function(id) {
     $.getJSON(self.url.channel(id), function(data) {
       self.name.value = data.name
       self.text.value = data.text
       self.update()
     }).fail(self.failHandler).complete(function() {
     })
   }

   if (self.opts.id) self.load(self.opts.id)
  
  </script>
</umedia-channel-editor>
