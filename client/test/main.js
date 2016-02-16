// make riot available for tags from build/tags/*.js
window.riot = require('riot')
// load testing environment
window.env = require('./env')
// configure fake app for testing
require('./config/app')


// load custom  tags
require('../../build/tags/raw.js')
require('../../build/tags/wpml.js')
require('../../build/tags/channel.js')
require('../../build/tags/channel_feed.js')
require('../../build/tags/channel_details.js')

// have issues with riotify when browserify run from Karma
require('../../build/tags/channel_admin.js')
require('../../build/tags/channel_editor.js')

require('../../build/tags/entry.js')
require('../../build/tags/entry_list.js')
require('../../build/tags/entry_details.js')
require('../../build/tags/entry_editor.js')
require('../../build/tags/profile.js')
require('../../build/tags/breadcrumbs.js')

require('./index')  //include all tests
