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
      <a class="btn btn-primary" role="button" href="{ url.channel() }/new/">New</a>
    </div>

  </div>

  <script>
   var self = this
   this.mixin('coect-context', 'umedia-context', 'coect-site-context')

   reload() {
     $.getJSON(self.url.channel() + '?owner=' + encodeURIComponent(Site.user.id), function(data) {
       self.items = data
       self.update()
     })
   }

   remove(e) {
     self.sendJson('DELETE', self.url.channel(e.item.id), {})
      .done(function() {
       self.reload() 
     })
   }

   self.reload()

  </script>
</umedia-channel-admin>
