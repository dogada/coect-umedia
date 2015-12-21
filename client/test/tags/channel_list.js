/* jshint expr: true */

var env = require('../env/')

describe('umedia-channel-list', function() {

  before(function() {
    env.fakeGET('/c?owner=', [
      {id: 'id1'},
      {id: 'id2', name: 'Programming'}
    ])
  })
  
  it('channel-list should load and show channel names', function(done) {
    var tag = env.mount('umedia-channel-list', {})
    // wait for ajax response
    function checkHtml() {
      $('.umedia-channel-list li', tag.root).should.exist
      $('.umedia-channel-list a', tag.root).should.contain('Blog') // default name
      $('.umedia-channel-list a', tag.root).should.contain('Programming')
    }
    tag.on('updated', () => process.nextTick(env.tryIt(checkHtml, done)))
  })

})
