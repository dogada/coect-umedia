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
    var entries = {items: [
      {id: 'e1',
       text: '!tags: Test, demo\nFirst entry',
       head: 'First entry',
       list: FAKE_CHANNEL, owner: FAKE_CHANNEL.owner},
      {id: 'e2',
       text: '!tags: Test\nSecond entry',
       head: 'Second entry',
       list: FAKE_CHANNEL,
       owner: FAKE_CHANNEL.owner}
    ]}

    env.fakeGET('/e?order=top&list=category1&count=10', entries)
    env.fakeGET('/e?order=last&owner=user1&tag=category_my&count=10', entries)
    env.fakeGET('/e?list=listId&order=top&tag=category3&count=10', entries)

  })

  it('should show root category and load top entries from category channel', function(done) {
    var tag = env.mount(TAG, {
      category: {name: 'category1', type: 'category', id: 'category1'}
    })

    function checkHtml() {
      $('.coect-breadcrumbs', tag.root).should.have.length(0)
      $('h1', tag.root).should.have.text('#category1')

      expect($('ul.entries li', tag.root)).to.have.length(2)
      $('#ee1 .wpml p', tag.root).should.have.text('First entry')
      $('#ee2 .wpml p', tag.root).should.contain('Second entry')
    }

    // wait for ajax response and then check tag state
    checkHtml()
    done()
  })

  it('should show users\' entries tagged by a tag', function(done) {
    var tag = env.mount(TAG, {
      category: {name: 'category_my', type: 'category', id: 'category_my'},
      tab: 'my',
      owner: 'user1'
    })

    function checkHtml() {
      $('.coect-breadcrumbs', tag.root).should.have.length(0)
      $('h1', tag.root).should.have.text('#category_my')

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
      category: {name: 'category3', type: 'category', id: 'category3'},
      channel: FAKE_CHANNEL
    })

    function checkHtml() {
      $('.coect-breadcrumbs li:nth-child(1) a span', tag.root).should.have.text('UserT3')
      $('.coect-breadcrumbs li:nth-child(2) a span', tag.root).should.have.text('Tag channel')
      $('h1', tag.root).should.have.text('#category3')

      expect($('ul.entries li', tag.root)).to.have.length(2)
      $('#ee1 .wpml p', tag.root).should.have.text('First entry')
      $('#ee2 .wpml p', tag.root).should.contain('Second entry')
    }

    // wait for ajax response and then check tag state
    checkHtml()
    done()
  })
})
