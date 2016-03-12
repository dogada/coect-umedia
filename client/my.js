'use strict';

exports.index = function () {
  Site.mountTag('umedia-entry-list',
                {my: 'main'},
                'Own entries, likes and bookmarks')
  Site.checkMount('umedia-raw', {}, {target: 'sidebar'})
}

exports.notifications = function () {
  Site.mountTag('umedia-entry-list',
                {my: 'notifications'},
                'Notifications')
  Site.checkMount('umedia-raw', {}, {target: 'sidebar'})
}
