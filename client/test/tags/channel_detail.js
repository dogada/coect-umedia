var env = require('../env')

var FAKE_CHANNEL = {
  id: 'listId', 
  name: 'Fake channel',
  text: 'h4: Subheader\n See more: http://www.coect.net',
  owner: {name: 'User2', id: 'U2'}
}

describe('umedia-channel-detail', function() {
  before(function() {
    env.fakeGET('/c/listId', FAKE_CHANNEL)
    env.fakeGET('/e?order=last&count=10&list=listId', {items: [
      {id: 'e1', text: 'First entry', list: FAKE_CHANNEL, owner: FAKE_CHANNEL.owner},
      {id: 'e2', text: 'Second entry', list: FAKE_CHANNEL, owner: FAKE_CHANNEL.owner},
    ]})
  })

  it('should show channel and load recent entries by channel id', function(done) {
    var tag = env.mount('umedia-channel-details', {
      channel: FAKE_CHANNEL,
      permissions: {post: false}
    })

    function checkHtml() {
      $('.coect-breadcrumbs li a span', tag.root).should.have.text('User2')
      $('h1', tag.root).should.have.text('Fake channel')

      expect($('.umedia-entry-list ul li', tag.root)).to.have.length(2)
      $('#ee1 .wpml p', tag.root).should.have.text('First entry')
      $('#ee2 .wpml p', tag.root).should.contain('Second entry')
    }

    // wait for ajax response and then check tag state
    expect(tag.channel).deep.equal(FAKE_CHANNEL)
    expect(tag.permissions).eql({post: false})
    checkHtml()
    done()
  })
})
