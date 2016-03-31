<coect-user-channel>
  <div class="coect-user-channel thumbnail with-caption">
    <a href={ url.user(user) } title={ user.name }>
      <img class="photo" width="128" height="128" alt={ user.id } src={ url.avatar(user, 128) }>
    </a>
    <p>
      <a href={ url.user(user) }>{ user.name }</a>
    </p>
  </div>

  <script type="es6">
   var self = this
   self.mixin('umedia-context')
   self.user = self.opts.user
  </script>

</coect-user-channel>
