'use strict';

function requireLogin() {
  if (!Site.user) {
    Site.page.redirect(Site.urls.account())
    return true
  }
}

exports.index = function (ctx) {
  if (requireLogin()) return
  Site.mountTag('umedia-entry-list',
                {my: 'main', filters: false, baseUrl: Site.urls.my,
                 model: ctx.params.model, type: ctx.params.type},
                'Own entries, likes and bookmarks')
  Site.checkMount('umedia-raw', {}, {target: 'sidebar'})
}

exports.notifications = function () {
  if (requireLogin()) return
  Site.mountTag('umedia-entry-list',
                {my: 'notifications'},
                'Notifications')
  Site.checkMount('umedia-raw', {}, {target: 'sidebar'})
}
