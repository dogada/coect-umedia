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
    env.fakeGET('/e?order=last&count=10&topic=ID1&view=full', {items: COMMENTS})
  })

  it('should show post with comments', function(done) {
    var tag = env.mount(TAG, {entry: POST, thread: [POST]})

    expect(tag.permissions).eql({})
    $('.h-entry .coect-breadcrumbs li:first-child a span', tag.root).should.have.text('User4')
    $('.coect-breadcrumbs li:first-child a', tag.root).should.have.attr('href', '/u/U4')
    $('.coect-breadcrumbs li:nth-child(2) a span', tag.root).should.have.text('List1')
    $('.coect-breadcrumbs li:nth-child(2) a', tag.root).should.have.attr('href', '/c/L1')

    $('.h-entry #eID1 h1.p-name', tag.root).should.have.text('Hello world!')
    $('#eID1 .e-content p', tag.root).should.contain('See more')
    $('#eID1 .e-content p a', tag.root).should.have.attr('href', 'http://www.coect.net')

    $('.h-entry .h-feed.p-comments .h-cite.p-comment', tag.root).should.have.length(2)
    $('ul.h-feed li:first-child .h-cite .p-content', tag.root).should.contain('First comment')
    done()
  })

})
