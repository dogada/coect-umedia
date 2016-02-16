/* jshint expr: true */

var env = require('../env/')

describe('coect-channel-feed', function() {

  before(function() {
    env.fakeGET('/c?owner=', {items: [
      {id: 'id1'},
      {id: 'id2', name: 'Programming'}
    ]})
  })
  
  it('channel-feed should show channel names', function() {
    var tag = env.mount('coect-channel-feed', {
      items: [{id: 'id1'},
              {id: 'id2', name: 'Programming'}]
    })
    
    $('.coect-channel-feed li:nth-child(1) a', tag.root).should.have.text('Blog') // default name
    $('.coect-channel-feed li:nth-child(2) a', tag.root).should.have.text('Programming')
  })

})
