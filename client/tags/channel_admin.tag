<umedia-channel-admin>
  <div class="umedia-channel-admin">
    <table class="table table-hover">
      <tr each={ items }>
        <td>{ name }</td>
        <td>
          <a href="{ parent.url.channel() }/{ id }/edit">
            <span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>
          </a>
        </td>
        <td>
          <a href="./" onclick={ parent.remove }>
            <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
          </a>
        </td>
      </tr>
    </table>

    <div>
      <a class="btn btn-primary" role="button" href="{ url.channel('_/new') }">New</a>
    </div>

  </div>

  <script type="es6">
   var self = this
   this.mixin('umedia-context')

   self.reload = function() {
     var url = self.url.channel() + '?owner=' + encodeURIComponent(Site.user.id)
     self.store.channel.get(url, Site.callback(function(data) {
       self.items = data.items
       self.update()
     }))
   }

   self.remove = function(e) {
     self.store.channel.del(self.url.channel(e.item.id), Site.callback(self.reload))
   }

   self.reload()

  </script>
</umedia-channel-admin>
