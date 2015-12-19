// load testing environment
window.env = require('./env')
// configure fake app for testing
require('./config/app')


// load custom  tags
require('../tags/raw.tag')
require('../tags/wpml.tag')

require('../tags/channel.tag')
require('../tags/channel_list.tag')
require('../tags/channel_details.tag')
require('../tags/channel_admin.tag')
require('../tags/channel_editor.tag')

require('../tags/entry.tag')
require('../tags/entry_list.tag')
require('../tags/entry_details.tag')
require('../tags/entry_editor.tag')


require('./index')  //include all tests
