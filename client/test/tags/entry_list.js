/* jshint expr: true */

var env = require('../env')
var TAG = 'umedia-entry-list' 

describe(TAG, function() {

  before(function() {
    env.fakeGET('/e?order=last&count=10', [
      {id: 'e1', text: 'h2: Hello world\nBye.'},
      {id: 'e2', text: 'Just a comment'}
    ])
  })
  
  it('should load and show last entries of a channel', function(done) {
    var tag = env.mount(TAG, {})

    function checkHtml() {
      expect(tag.items).to.have.length(2)
      expect(tag.items[0]).property('id', 'e1')
      expect(tag.items[1]).property('id', 'e2')
      expect(tag.hasMore).to.be.false

      expect($('.umedia-entry-list ul li', tag.root)).to.have.length(2)
      $('#ee1 h2', tag.root).should.have.text('Hello world')
      $('#ee2 p', tag.root).should.contain('Just a comment')
    }
    
    // wait for ajax response and DOM update
    tag.on('updated', () => process.nextTick (env.tryIt(checkHtml, done)))
  })
})
