var supermodels = require('supermodels.js')
var File = require('./file')

var schema = {
  items: [File],
  find: function (relativePath) {
    return this.items.find(function (item) {
      return item.relativePath === relativePath
    })
  },
  findByPath: function (path) {
    return this.items.find(function (item) {
      return item.path === path
    })
  }
}

module.exports = supermodels(schema)
