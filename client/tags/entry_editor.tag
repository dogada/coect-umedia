<umedia-entry-editor>
  <div class="{umedia-entry-editor: 1, expanded: expanded}">
    <form onsubmit={ publish }>

    <div class="form-group">
      <textarea rows="1" name="content" class="form-control"
                placeholder="Type your { entryType() } here"
                enabled={ !loading }
                onfocus={ expand }
                onkeyup={ edit }>{ entry.text || '' }</textarea>
    </div>

    <div  if={ expanded } class="form-inline form-group clearfix">
      
      <div class="form-group pull-right">
          <button disabled={ !content.value } type="submit" class="btn btn-success">Publish</button>
          <button if={ !opts.thread } type="button" class="btn btn-danger"
                  onclick={ cancel }>Cancel</button>
      </div>
      
    </div>

    </form>
  </div>


  <script>
   var self = this
   self.mixin('coect-context', 'umedia-context', 'coect-site-context')
   self.entry = self.opts.entry || {}

   entryType() {
     if (self.opts.list) return 'post'
     else if (self.opts.ancestor) return (self.opts.ancestor.type == 'post' ?
     'comment' : 'reply')
     else return 'message'
   }

   expand(e) {
     self.content.style.height = '300px'
     self.expanded = true
   }

   edit(e) {
     self.text = e.target.value
   }

   cancel(e) {
     if (Site.page.len) Site.page.back()
     else Site.page.show('/')
   }

   entryName(text) {
     var title
     try {
       title = self.wpml.doc(text).meta.title
     } catch (e) {
       console.error('entryName', e, text)
     }
     return title || text && text.slice(0, 30) || ''
   }

   publish(e) {
     e.preventDefault()
     console.log('Publish', this.text, self.opts)
     self.poutJson(
       self.url.entry(),
       {id: self.opts.id,
        text: self.content.value,
        name: self.entryName(self.content.value),
        parent: self.opts.ancestor && self.opts.ancestor.id,
        list: self.opts.list}
     ).done(function(doc) {
       console.log('done', doc)
       self.text = self.content.value = ''
       Site.page(self.url.entry(doc))
     })
   }

   load(id) {
     $.getJSON(self.url.entry(id), function(data) {
       self.entry = data
       self.text = data.text
       self.update()
     })
   }
   if (self.opts.id || !self.parent) self.expand()
   if (self.opts.id) self.load(this.opts.id)

  </script>
</umedia-entry-editor>
