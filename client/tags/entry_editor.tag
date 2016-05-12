<umedia-entry-editor>
  <div class="{umedia-entry-editor: 1, expanded: expanded}">
    <h2 if={ opts.query }>Create new entry</h2>
    <h2 if={ opts.entry }>Edit entry</h2>

    <form onsubmit={ publish } method="POST">

      <div show={ opts.channels && opts.channels.length > 1 } class="form-group">
        <label>Channel</label>
        <select class="form-control" id="channel">
          <option each={ c in opts.channels } value={ c.id } >{ c.name }</option>
        </select>
      </div>

      <div class="form-group">
        <label if={ opts.entry || opts.channels }>Text</label>
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

    <div if={ opts.bmName }>
      <p>Drag and drop bookmarklet link shown bellow to the bookmarks toolbar of your browser.</p>

      <h3><a title="Drag and drop me to the bookmarks toolbar" href={ opts.bmUrl }>{ opts.bmName }</a></h3>

      <p>When you select text on any web-page and click the bookmarklet, your browser
      will be redirected back to this page and selected text will be
      prepopulated in the above textarea.
        <small><a href="https://en.wikipedia.org/wiki/Bookmarklet">More info</a></small>
      </p>

    </div>
  </div>


  <style scoped>
   .umedia-entry-editor {
     margin-top: 10px;
   }
  </style>

  <script type="es6">

   var self = this, opts = self.opts
   self.mixin('umedia-context')
   var {entry, ancestor, items} = opts

   debug(`editor entry=${entry}, items=${items}`)
   debug('editor ancestor', ancestor, 'channels', opts.channels, 'query', opts.query)

   function getQueryText(q) {
     return (q.text || '') + ' ' + (q.url || '') 
   }

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
     switch((entry || ancestor || {}).model) {
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
     var parent = ancestor && ancestor.id || self.channel && self.channel.value
     var list =  ancestor && (ancestor.list && ancestor.list.id ||  ancestor.id) || parent
     console.log('Publish', this.text, self.opts, self.channel)
     self.store.entry.save(
       self.url.entry(),
       {id: entry && entry.id,
        text: self.content.value,
        parent, list},
       Site.callback(published))
   }
   
   var initialText = entry && entry.text || opts.query && getQueryText(opts.query)
   if (initialText) {
     setText(initialText)
     self.expand()
   }

  </script>
</umedia-entry-editor>
