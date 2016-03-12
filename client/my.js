'use strict';

exports.index = function () {
  Site.mountTag('umedia-entry-list',
                {my: 'main', view: 'summary'},
                'Own entries, likes and bookmarks.')
  Site.checkMount('umedia-raw', {}, {target: 'sidebar'})
}
