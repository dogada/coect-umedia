var env = require('../env')

var FAKE_CHANNEL = {
  id: 'listId', 
  name: 'Fake channel',
  text: 'h4: Subheader\n See more: http://www.coect.net'
}

describe('umedia-channel', function() {
  
  it('should render channel WPML and linkify text', function() {
    var tag = env.mount('umedia-channel', {channel: FAKE_CHANNEL})

    $('.umedia-channel h3', tag.root).should.have.text('Fake channel')
    $('.umedia-channel .wpml h4', tag.root).should.have.text('Subheader')
    $('.umedia-channel .wpml p', tag.root).should.contain('See more:')
    $('.umedia-channel .wpml a', tag.root).should.have.attr('href', 'http://www.coect.net')
    $('.umedia-channel .wpml a', tag.root).should.have.text('http://www.coect.net')
  })

})
