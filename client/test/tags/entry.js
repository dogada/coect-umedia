var env = require('../env/')

describe('umedia-entry', function() {

  it('should render simple entry as <p>.', function() {
    var entry = {
      id: 'e1', 
      text: 'Just a comment'
    }
    var tag = env.mount('umedia-entry', {entry: entry})
    $('.umedia-entry .wpml p', tag.root).should.text(entry.text)
  })

  it('should render simple entry with link', function() {
    var link = 'https://dogada.org'
    var entry = {
      id: 'e2', 
      text: 'Look here ' + link
    }
    var tag = env.mount('umedia-entry', {entry: entry})
    $('.umedia-entry .wpml p', tag.root).should.contain('Look here')
    $('.umedia-entry .wpml a', tag.root).should.have.attr('href', link)
    $('.umedia-entry .wpml a', tag.root).should.have.text(link)
  })

  it('should render single link tag', function() {
    var link = 'http://www.gnu.org'
    var entry = {
      id: 'e3', 
      text: `a: gnu.org\n.href: ${link}`
    }
    var tag = env.mount('umedia-entry', {entry: entry})
    $('.umedia-entry .wpml a', tag.root).should.have.attr('href', link)
    $('.umedia-entry .wpml a', tag.root).should.have.text('gnu.org')
  })
  
  it('should render entry with custom title, header and link.', function() {
    var entry = {
      id: 'e4', 
      text: '!title: Hello title\nh2: Hello world!\nLook at: http://www.coect.net'
    }
    var tag = env.mount('umedia-entry', {entry: entry})
    $('.umedia-entry .wpml h2', tag.root).should.have.text('Hello world!')
    $('.umedia-entry .wpml p', tag.root).should.contain('Look at:')
    $('.umedia-entry .wpml a', tag.root).should.have.attr('href', 'http://www.coect.net')
    $('.umedia-entry .wpml a', tag.root).should.have.text('http://www.coect.net')
  })

})
