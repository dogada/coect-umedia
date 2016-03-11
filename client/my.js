'use strict';

exports.like = function () {
  Site.mountTag('umedia-entry-list', {my: 'like', view: 'summary'}, 'Content liked or bookmarked by me')
  Site.checkMount('umedia-raw', {}, {target: 'sidebar'})
}
