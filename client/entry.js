'use strict';

var debug = require('debug')('umedia:entry')
var ui = require('coect').ui

function title(post) {
  if (post && post.name) return post.name
  else if (post && post.text) return post.text.slice(0, 30)
  else return 'Post'
}

//add cslug, eslug, username
function details(ctx) {
  debug('details', ctx)
  function mount(thread) {
    debug('mount', typeof thread, thread.length, thread)
    var entry = thread[thread.length - 1]
    Site.mount(ui.make('umedia-entry-details',
                       {thread: thread,
                        entry: entry}), title(entry))
  }
  
  if (ctx.state.thread) {
    debug('use cached thread', ctx.state.thread)
    mount(ctx.state.thread)
  } else {
    debug('load thread for ', ctx.params.id)
    $.getJSON(ctx.path + '?thread=1', function(thread) {
      ctx.state.thread = thread
      ctx.save()
      mount(thread)
    })
  }
}

function edit(ctx) {
  Site.mount(ui.make('umedia-entry-editor', ctx.params), 'Entry editor')
}

module.exports = {
  details: details,
  edit: edit
}
