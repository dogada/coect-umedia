'use strict';

var escape = require('escape-html')
var htmlTag = require('html-tag')
var assign = require('object-assign')
var apply = require('object-apply')

function tag(name, attrs, value) {
  return htmlTag(name, apply(attrs, escape), value)
}

exports.media = function (data) {
  var attrs = assign({src: data.value,
                      scrolling: 'no',
                      frameborder: '0',
                      width: '100%',
                      allowfullscreen: 1}, data.attrs)
  return tag('iframe', attrs,
             tag('a', {href: data.value}, escape(data.value)))
}

exports.oembed = function (data) {
  var url = data.value
  var attrs = assign({src: '/oembed/?url=' + encodeURIComponent(url)}, data.attrs)
  return exports.media({attrs: attrs, value: url})
}

exports.youtube = function(data) {
  var attrs = assign({src: data.value,
                      scrolling: 'no',
                      frameborder: '0',
                      width: '560',
                      height: '315',
                      allowfullscreen: 1}, data.attrs)
  return tag('iframe', attrs,
             tag('a', {href: data.value}, escape(data.value)))
}


