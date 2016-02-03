var env = require('../env')
var wpml = require('../../../common/wpml')

var TAG = 'umedia-wpml'

var TEXT = 
  'h2: Header h2\n' +
  'Simple paragraph\n' + 
  'h3: Header h3\n' + 
  'p: Text line'


function checkText(tag) {
  $(tag.root).should.have.class('wpml')
  $('h2', tag.root).should.have.text('Header h2')
  $('h2 + p', tag.root).should.have.text('Simple paragraph')
  $('h3', tag.root).should.contain('Header h3')
  $('p:last', tag.root).should.have.text('Text line')
}

describe(TAG, function() {
  
  it('should parse text in WPML-format and then render it as HTML', function() {
    checkText(env.mount('umedia-wpml', {text: TEXT}))
  })

  it('should render already parsed wpml-doc', function() {
    checkText(env.mount('umedia-wpml', {doc: wpml.doc(TEXT)}))
  })

  it('should render `reply-to` plugin', function() {
    var link = 'http://host.com/slug'
    var tag = env.mount('umedia-wpml', {
      text: `reply-to: ${link}\nHello, looks interesting.`
    })

    console.log('root--------------------', tag.root)
    console.log('a', $('div.coect-reply-to a.u-in-reply-to', tag.root))

    $('.coect-reply-to a.u-in-reply-to', tag.root).should.have.attr('href', link)

    $('.coect-reply-to a.u-in-reply-to', tag.root).should.have.text(link)
    $('p', tag.root).should.have.text('Hello, looks interesting.')
  })


})
