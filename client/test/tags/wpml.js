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

})
