var _wpml = require('wpml')

var WPML_OPTS = {
  javascript: false,
  plugins: require('./plugins'),
  //linkPlugin: 'oembed',
  whitelist: 'iframe p div h2 h3 h4 a code pre br hr img ul ol li dl dt dd small em b i strong span sub sup cite abbr section aside blockquote q',
  idTest: /^wp[\w]+/,
  classTest: /^(wp-[\w-]+|[hpeu]-[\w-]+|lead|small|list-unstyled)/
}

module.exports = {
  doc: function(text) {
    //debug('wpml.doc', text.slice(0, 20))
    return _wpml.doc(text, WPML_OPTS)
  }
}

