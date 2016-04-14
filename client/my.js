'use strict';

function requireLogin() {
  if (!Site.user) {
    Site.page.redirect(Site.urls.account())
    return true
  }
}

exports.index = function (ctx) {
  if (requireLogin()) return
  
  Site.mountTag('coect-user-likes',
                {tab: ctx.params.tab,
                 type: ctx.params.type},
                'My likes and saves.')
  Site.checkMount('umedia-raw', {}, {target: 'sidebar'})
}

exports.inbox = function () {
  if (requireLogin()) return
  Site.mountTag('umedia-entry-list',
                {query: {my: 'inbox'}},
                'Notifications')
  Site.checkMount('umedia-raw', {}, {target: 'sidebar'})
}
