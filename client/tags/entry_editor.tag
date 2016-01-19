<umedia-entry-editor>
  <div class="{umedia-entry-editor: 1, expanded: expanded}">
    <form onsubmit={ publish }>

    <div class="form-group">
      <textarea rows="1" name="content" class="form-control"
                placeholder="Type your { entryType() } here"
                onfocus={ expand }
        onkeyup={ edit }></textarea>
    </div>

    <div if={ expanded } class="form-inline form-group clearfix">
      
      <div class="form-group pull-right">
          <button disabled={ !text } type="submit" class="btn btn-success">Publish</button>
          <button if={ !opts.thread } type="button" class="btn btn-danger"
                  onclick={ cancel }>Cancel</button>
      </div>
      
    </div>

    </form>
  </div>


  <style scoped>
   .umedia-entry-editor {
     margin-top: 10px;
   }
  </style>

  <script type="es6">

   var self = this
   self.mixin('coect-context', 'umedia-context', 'coect-site-context')
   self.entry = self.opts.entry || {}
   self.items = self.opts.items
   debug(`editor entry=${self.entry}, items=${self.items}`)

   self.entryType = function() {
     switch(self.opts.ancestor.type) {
       case 'channel': return 'post'
       case 'post': return 'comment'
       default: return 'reply'
     }
   }

   self.expand = function(e) {
     self.content.style.height = '300px'
     self.expanded = true
   }

   self.collapse = function() {
     self.expanded = false
     self.content.style.height = 'auto'
   }


   self.edit = function(e) {
     self.text = e.target.value
   }

   self.cancel = function(e) {
     if (Site.page.len) Site.page.back()
     else Site.page.show('/')
   }

   self.publish = function(e) {
     e.preventDefault()
     console.log('Publish', this.text, self.opts)
     self.poutJson(
       self.url.entry(),
       {id: self.opts.id,
        text: self.content.value,
        parent: self.opts.ancestor && self.opts.ancestor.id,
        list: self.opts.list && self.opts.list.id}
     ).done(function(doc) {
       console.log('done', doc, self.items)
       self.text = self.content.value = ''
       if (self.items) {
         self.items.splice(0, 0, doc)
         self.collapse()
         self.parent.update()
       } else {
         Site.page(self.url.entry(doc))
       }
     })
   }

   self.load = function(id) {
     $.getJSON(self.url.entry(id), function(data) {
       self.entry = data
       self.text = data.text
       self.content.value = data.text
       self.update()
     })
   }
   if (self.opts.id || !self.parent) self.expand()
   if (self.opts.id) self.load(this.opts.id)

  </script>
</umedia-entry-editor>
