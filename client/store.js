var {ui, Store} = require('coect')

class EntryStore extends Store {

  moderate(entry, accept, done) {
    this.post(Site.umedia.url.entry(entry.id, (accept ? 'accept' : 'reject')), done)
  }
}

class ChannelStore extends Store {

  permissions(channelId, done) {
    var url = Site.umedia.url.channel(channelId, 'permissions')
    // FIX: move cache logic with timeout to Store
    if (this.cache[url]) return done(null, this.cache[url])
    this.get(url, (err, data) => {
      if (err) return done(err)
      this.cache[url] = data
      done(null, data)
    })
  }

  list(opts, done) {
    this.get(Site.umedia.url.channel(), opts, done)
  }
}

class UserStore extends Store {
}


module.exports = {
  entry: new EntryStore(),
  channel: new ChannelStore(),
  user: new UserStore()
}
