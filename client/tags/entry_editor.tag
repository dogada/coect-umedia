<umedia-entry-editor>
  <div class="{umedia-entry-editor: 1, expanded: expanded}">
    <form onsubmit={ publish } method="POST">

    <div class="form-group">
      <textarea rows="1" name="content" class="form-control"
                placeholder="Type your { entryType() } here"
                onfocus={ expand }
        onkeyup={ edit }></textarea>
    </div>

    <div if={ expanded } class="form-inline form-group clearfix">
      
      <div class="form-group pull-right">
          <button type="submit" class="btn btn-success">Publish</button>
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
   self.mixin('umedia-context')
   var {entry, ancestor, items} = self.opts

   debug(`editor ancestor=${ancestor} entry=${entry}, items=${items}`)

   function setText(text) {
     self.text = self.content.value = text
   }

   self.expand = function(e) {
     self.content.style.height = '300px'
     self.expanded = true
   }

   self.collapse = function() {
     self.expanded = false
     self.content.style.height = 'auto'
   }


   self.entryType = function() {
     switch((entry || ancestor).model) {
       case 'channel': 
         return 'post'
       default:
         return 'text'
     }
   }

   self.edit = function(e) {
     self.text = e.target.value
   }

   self.cancel = function(e) {
     if (Site.page.len) Site.page.back()
     else Site.page.show('/')
   }

   function published(doc) {
     console.log('done', doc, items)
     self.text = self.content.value = ''
     doc.highlighted = true
     if (items) {
       items.splice(0, 0, doc)
       self.collapse()
       self.parent.update()
     } else {
       Site.page(self.url.entry(doc))
     }
   }

   self.publish = function(e) {
     e.preventDefault()
     console.log('Publish', this.text, self.opts)
     self.store.entry.save(
       self.url.entry(),
       {id: entry && entry.id,
        text: self.content.value,
        parent: ancestor && ancestor.id,
        list: ancestor && (ancestor.list && ancestor.list.id ||  ancestor.id)},
       Site.callback(published))
   }

   if (entry) {
     setText(entry.text)
     self.expand()
   }

  </script>
</umedia-entry-editor>
