'use strict';

var debug = require('debug')('umedia:plugins')
var escape = require('escape-html')
var htmlTag = require('html-tag')
var apply = require('object-apply')
var coect = require('coect')

function tag(name, attrs, value) {
  if (typeof value === 'object') value = value.join('\n')
  return htmlTag(name, apply(attrs, escape), value)
}

// http://indiewebcamp.com/in-reply-to
exports['reply-to'] = function (data) {
  var attrs = coect.object.assign({title: 'In reply to'}, data.attrs || {})
  if (attrs['class']) attrs['class'] += ' coect-reply-to'
  else attrs['class'] = 'coect-reply-to'
  return tag('div', attrs, [
    tag('span', {'class': 'glyphicon glyphicon-share-alt'}, ' '),
    tag('a', {href: data.value, 'class': 'u-in-reply-to'}, escape(data.value))
  ])
}

exports.media = function (data) {
  var attrs = coect.object.assign({
    src: data.value,
    scrolling: 'no',
    frameborder: '0',
    width: '100%',
    allowfullscreen: 1
  }, data.attrs)
  return tag('iframe', attrs,
             tag('a', {href: data.value}, escape(data.value)))
}

exports.oembed = function (data) {
  var url = data.value
  var attrs = coect.object.assign({
    src: '/oembed/?url=' + encodeURIComponent(url)
  }, data.attrs)
  return exports.media({attrs: attrs, value: url})
}

exports.youtube = function(data) {
  var attrs = coect.object.assign({
    src: data.value,
    scrolling: 'no',
    frameborder: '0',
    width: '560',
    height: '315',
    allowfullscreen: 1}, data.attrs)
  return tag('iframe', attrs,
             tag('a', {href: data.value}, escape(data.value)))
}


