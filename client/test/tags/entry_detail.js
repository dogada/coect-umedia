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
  child_count: COMMENTS.length,
  owner: {name: 'User3', id: 'U3'},
  list: {id: 'L1', name: 'List1', owner: {name: 'User4', id: 'U4'}}
}

describe(TAG, function() {
  before(function() {
    env.fakeGET('/e?order=last&count=10&thread=ID1', COMMENTS)
  })

  it('should show post with comments', function(done) {
    var tag = env.mount(TAG, {entry: POST, thread: [POST]})

    expect(tag.permissions).eql({})
    $('.coect-breadcrumbs li:first-child a span', tag.root).should.have.text('User4')
    $('.coect-breadcrumbs li:first-child a', tag.root).should.have.attr('href', '/u/U4')
    $('.coect-breadcrumbs li:nth-child(2) a span', tag.root).should.have.text('List1')
    $('.coect-breadcrumbs li:nth-child(2) a', tag.root).should.have.attr('href', '/c/L1')

    $('#eID1 h1', tag.root).should.have.text('Hello world!')
    $('#eID1 p', tag.root).should.contain('See more')
    $('#eID1 p a', tag.root).should.have.attr('href', 'http://www.coect.net')
    $('#eID1 .umedia-actions a.active', tag.root).should.have.text('Comments')
    done()
  })

})
