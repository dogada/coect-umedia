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
    {id: 'category', name: 'Tags', icon: 'hashtag'},
    {id: 'user', name: 'Contacts'},
    {id: 'like', name: 'Liked', title: 'Liked and saved items'}
  ]
  
  Site.mountTag('umedia-entry-list',
                {my: 'main',
                 tabs: tabs,
                 baseUrl: Site.urls.my,
                 tab: ctx.params.tab || tabs[2].id,
                 type: ctx.params.type},
                'Own and liked content.')
  Site.checkMount('umedia-raw', {}, {target: 'sidebar'})
}

exports.notifications = function () {
  if (requireLogin()) return
  Site.mountTag('umedia-entry-list',
                {my: 'notifications'},
                'Notifications')
  Site.checkMount('umedia-raw', {}, {target: 'sidebar'})
}
