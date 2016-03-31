'use strict';

function requireLogin() {
  if (!Site.user) {
    Site.page.redirect(Site.urls.account())
    return true
  }
}

exports.index = function (ctx) {
  if (requireLogin()) return
  var tabs = [
    {id: 'like', name: 'Entries', title: 'Liked and saved entries', url: ''},
    {id: 'category', name: 'Tags', icon: 'hashtag'},
    {id: 'user', name: 'People'}
  ]
  
  Site.mountTag('umedia-entry-list',
                {my: 'main',
                 tabs: tabs,
                 baseUrl: Site.urls.my,
                 tab: ctx.params.tab || tabs[0].id,
                 type: ctx.params.type},
                'My likes and saves.')
  Site.checkMount('umedia-raw', {}, {target: 'sidebar'})
}

exports.notifications = function () {
  if (requireLogin()) return
  Site.mountTag('umedia-entry-list',
                {my: 'notifications'},
                'Notifications')
  Site.checkMount('umedia-raw', {}, {target: 'sidebar'})
}
