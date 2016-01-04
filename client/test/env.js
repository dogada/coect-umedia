/**
   Testing environment.
*/
var debug = require('debug')('umedia:env')
var ui = require('coect').ui

// catch all AJAX requests and replace with stubs
exports.server = (function() {
  var server = sinon.fakeServer.create({
    respondImmediately: true
  })

  server.xhr.useFilters = true
  server.xhr.addFilter(function(method, url) {
    debug('new xhr url=', url)
    return false // true will send real network request
  })
  return server
})()


exports.logRequests = function(count) {
  var requests = exports.server.requests.slice(count ? -count : 0)
  console.log('--------' + requests.length + '/' +  exports.server.requests.length + ' requests:')
  for (var i = 0, r; (r = requests[i++]);) {
    console.log(r.status, r.responseHeaders['Content-Type'], r.url)
  }
}

exports.mount = function(tagName, opts) {
  //debug('mount', tagName, opts)
  return ui.make(tagName, opts, $('<div>').appendTo(document.body))
}

exports.fakeGET = function(url, response) {
  return exports.server.respondWith('GET', url, [
    200, 
    {'Content-Type': 'application/json'},
    JSON.stringify(response)
  ])
}

/**
   Return function wrapped in try-catch block to ensure that callback `done` is
   called even if an assert inside thrown exception.
*/
exports.tryIt = function(fn, done) {
  return function() {
    console.log('tryIt')
    try {
      fn()
      console.log('tryIt done=', done)
      done()
    } catch (e) {
      console.log('tryIt error', e)
      done(e)
    }
  }
}
