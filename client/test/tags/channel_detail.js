var env = require('../env')

var FAKE_CHANNEL = {
  id: 'listId', 
  name: 'Fake channel',
  text: 'h4: Subheader\n See more: http://www.coect.net'
}

describe('umedia-channel-detail', function() {
  before(function() {
    env.fakeGET('/c/listId', FAKE_CHANNEL)
    env.fakeGET('/e?order=last&count=10&list_id=listId', [
      {id: 'e1', text: 'First entry'},
      {id: 'e2', text: 'Second entry'},
    ])
  })

  it('should load channel and recent entries by channel id', function(done) {
    var tag = env.mount('umedia-channel-details', {id: 'listId'})

    function checkHtml() {
      expect($('.umedia-entry-list ul li', tag.root)).to.have.length(2)
      $('#ee1 h2', tag.root).should.have.text('Hello world')
      $('#ee2 p', tag.root).should.contain('Just a comment')
    }

    // wait for ajax response and then check tag state
    tag.on('updated', env.tryIt(function() {
      expect(tag).property('channelId', 'listId')
      expect(tag).property('canPost').not.ok
      expect(tag.channel).deep.equal(FAKE_CHANNEL)
      process.nextTick(env.tryIt(checkHtml, done))
    }, done))
  })
})
