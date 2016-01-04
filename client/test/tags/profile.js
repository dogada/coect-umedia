var env = require('../env/')

var TAG = 'umedia-profile'

describe(TAG, function() {

  it('should show profile with id field only', function() {
    var user = {
      id: 'U1'
    }
    var tag = env.mount(TAG, {user: user})
    $(tag.root).should.have.class(TAG)
    $('.media-left img', tag.root).should.have.attr('alt', user.id)
    $('.media-left img', tag.root).should.have.attr('src', '/_static/img/avatar_128.png')
    $('.media-body h1', tag.root).should.have.text('U1 ')
  })

  it('should show complete profile and convert WPML text in about', function() {
    var user = {
      id: 'U2',
      username: 'user2',
      name: 'User Two',
      avatar: 'http://localhost/pic.jpg',
      location: 'Universe',
      about: 'h3: See more: http://dogada.org'
    }

    var tag = env.mount(TAG, {user: user})
    $(tag.root).should.have.class(TAG)
    $('img', tag.root).should.have.attr('alt', user.id)
    $('img', tag.root).should.have.attr('src', 'http://localhost/pic.jpg')
    $('.media-body h1', tag.root).should.have.html('User Two <small>@user2</small>')
    $('.media-body .wpml', tag.root).should.have.html('<h3>See more: <a href=\"http://dogada.org\">http://dogada.org</a></h3>')
    $('.media-body p.umedia-location', tag.root).should.have.html('Universe')
  })

})