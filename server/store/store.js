'use strict';

const MAX_PAGE_SIZE = 20
const PAGE_SIZE = 10


class Store {

  pageSize(opts) {
    return Math.min(MAX_PAGE_SIZE, parseInt(opts.count, 10) || PAGE_SIZE)
  }

}

module.exports = Store
