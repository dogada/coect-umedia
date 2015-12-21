# Universal media for Coect communication platform

[![Build Status](https://travis-ci.org/dogada/coect-umedia.svg)](https://travis-ci.org/dogada/coect-umedia)
[![Coverage Status](https://coveralls.io/repos/dogada/coect-umedia/badge.svg?branch=master&service=github)](https://coveralls.io/github/dogada/coect-umedia?branch=master)


This Coect application provides Channel and Entry concepts for the web-site. On base of `coect-umedia` you can build a blog (see [dogada.org](https://dogada.org) for an example), community web-site like Reddit or Digg or just add comments to your existing web-site like you do with Disqus or Muut.

Application is designed to work in sharded database environment to achieve great scalability. Most of queries are executed inside parent shard only (query isolation). 

`edid` is used for generation of db cluster friendly ids.
 
Site MUST bind umedia models to real databases using `coect.orm.link` from `coect` npm package.

Site MUST enable `express-validator` middleware that is used for validation of requests.

This application expects jQuery and Bootstrap 3 available globally (and so shared with other Coect applications and web-site's main code).

All UI is based on custom [RiotJs](http://riotjs.com) components and Bootstrap 3. Web-site can use `coect-umedia` components with any layout and url scheme. Web-site should tell `coect-umedia` which url prefix it should use and listen to mount events sent via `Site.trigger` from `coect-site` shared library.

Copyright (C) 2015 Dmytro V. Dogadailo

This program is free software; you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation; either version 2 of the License, or (at your option) any later
version.
