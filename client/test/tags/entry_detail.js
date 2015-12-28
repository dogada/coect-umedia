var env = require('../env')

var TAG = 'umedia-entry-details'

var COMMENTS = [
  {id: 'CID1', text: 'First comment'},
  {id: 'CID2', text: 'Second comment'},
]

var POST = {
  id: 'ID1', 
  type: 'post',
  name: 'Test name',
  text: '!title: Hello world!\nSee more: http://www.coect.net',
  child_count: COMMENTS.length
}

describe(TAG, function() {
  before(function() {
    env.fakeGET('/e?order=last&count=10&thread=ID1', COMMENTS)
  })

  it('should show post with comments', function(done) {
    var tag = env.mount(TAG, {entry: POST, thread: [POST]})

    expect(tag).property('canComment').not.ok
    $('#eID1 h2', tag.root).should.have.text('Hello world!')
    $('#eID1 p', tag.root).should.contain('See more')
    $('#eID1 p a', tag.root).should.have.attr('href', 'http://www.coect.net')
    $('#eID1 .umedia-actions a.active', tag.root).should.have.text('Comments (2)')
    done()
  })

})
