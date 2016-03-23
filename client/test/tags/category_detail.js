var env = require('../env')

var TAG = 'coect-category-detail'

var FAKE_CHANNEL = {
  id: 'listId', 
  name: 'Tag channel',
  text: 'h4: Subheader\n See more: http://www.coect.net',
  owner: {name: 'UserT3', id: 'UT3'}
}


describe(TAG, function() {
  before(function() {
    // will be loaded by entry-list
    env.fakeGET('/e?order=last&count=10&tag=A+category', {items: [
      {id: 'e1',
       text: '!tags: Test, demo\nFirst entry',
       head: 'First entry',
       list: FAKE_CHANNEL, owner: FAKE_CHANNEL.owner},
      {id: 'e2',
       text: '!tags: Test\nSecond entry',
       head: 'Second entry',
       list: FAKE_CHANNEL,
       owner: FAKE_CHANNEL.owner}
    ]})

    env.fakeGET('/e?order=last&count=10&list=listId&tag=Channel+category', {items: [
      {id: 'e1',
       text: '!tags: Test, demo\nFirst entry',
       head: 'First entry',
       list: FAKE_CHANNEL, owner: FAKE_CHANNEL.owner},
      {id: 'e2',
       text: '!tags: Test\nSecond entry',
       head: 'Second entry',
       list: FAKE_CHANNEL,
       owner: FAKE_CHANNEL.owner}
    ]})

  })

  it('should show root category and load recent entries by category name', function(done) {
    var tag = env.mount(TAG, {
      category: {name: 'A category'}
    })

    function checkHtml() {
      $('.coect-breadcrumbs', tag.root).should.have.length(0)
      $('h1', tag.root).should.have.text('#A category')
      $('h1 i', tag.root).should.have.text('#')

      expect($('ul.entries li', tag.root)).to.have.length(2)
      $('#ee1 .wpml p', tag.root).should.have.text('First entry')
      $('#ee2 .wpml p', tag.root).should.contain('Second entry')
    }

    // wait for ajax response and then check tag state
    checkHtml()
    done()
  })

  it('should show channel category and load recent entries by category name and channel', function(done) {
    var tag = env.mount(TAG, {
      category: {name: 'Channel category'},
      channel: FAKE_CHANNEL
    })

    function checkHtml() {
      $('.coect-breadcrumbs li:nth-child(1) a span', tag.root).should.have.text('UserT3')
      $('.coect-breadcrumbs li:nth-child(2) a span', tag.root).should.have.text('Tag channel')
      $('h1', tag.root).should.have.text('#Channel category')

      expect($('ul.entries li', tag.root)).to.have.length(2)
      $('#ee1 .wpml p', tag.root).should.have.text('First entry')
      $('#ee2 .wpml p', tag.root).should.contain('Second entry')
    }

    // wait for ajax response and then check tag state
    checkHtml()
    done()
  })

})
