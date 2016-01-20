var env = require('../env/')

var TAG = 'umedia-entry'

describe(TAG, function() {

  it('should render simple entry as <p>.', function() {
    var entry = {
      id: 'e1', 
      text: 'Just a comment'
    }
    var tag = env.mount('umedia-entry', {entry: entry})
    $('#e' + entry.id, tag.root).should.have.class(TAG)
    $('.wpml p', tag.root).should.text(entry.text)
  })

  it('should render simple entry with link', function() {
    var link = 'https://dogada.org'
    var entry = {
      id: 'e2', 
      text: 'Look here ' + link
    }
    var tag = env.mount('umedia-entry', {entry: entry})
    $('#e' + entry.id, tag.root).should.have.class(TAG)
    $('.wpml p', tag.root).should.contain('Look here')
    $('.wpml a', tag.root).should.have.attr('href', link)
    $('.wpml a', tag.root).should.have.text(link)
  })

  it('should render single link tag', function() {
    var link = 'http://www.gnu.org'
    var entry = {
      id: 'e3', 
      text: `a: gnu.org\n.href: ${link}`
    }
    var tag = env.mount('umedia-entry', {entry: entry})
    $('#e' + entry.id, tag.root).should.have.class(TAG)
    $('.wpml a', tag.root).should.have.attr('href', link)
    $('.wpml a', tag.root).should.have.text('gnu.org')
  })
  
  it('should render entry with custom title, header and link.', function() {
    var entry = {
      id: 'e4', 
      text: '!title: Hello title\nh2: Hello world!\nLook at: http://www.coect.net'
    }
    var tag = env.mount('umedia-entry', {entry: entry})
    $('.wpml h2', tag.root).should.have.text('Hello world!')
    $('.wpml p', tag.root).should.contain('Look at:')
    $('.wpml a', tag.root).should.have.attr('href', 'http://www.coect.net')
    $('.wpml a', tag.root).should.have.text('http://www.coect.net')
  })

  it('should render entry with clickable owner (with id only).', function() {
    var entry = {
      id: 'e4', 
      text: '!title: Hello title\nh2: Hello world!',
      owner: {id: 'U1'}
    }
    var tag = env.mount('umedia-entry', {entry: entry})
    $('.wpml h2', tag.root).should.have.text('Hello world!')
    $('.media-left a', tag.root).should.have.attr('href', '/u/U1')
    $('.media-body a.umedia-display-name', tag.root).should.have.attr('href', '/u/U1')
    $('.media-body a.umedia-display-name', tag.root).should.have.text('U1')
  })

})
