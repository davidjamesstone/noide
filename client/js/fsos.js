var supermodels = require('supermodels.js')
var Fso = require('./fso')

var schema = {
  items: [Fso],
  add: function (obj) {
    var file = new Fso(obj)
    this.items.push(file)
  },
  find: function (file) {
    return this.items.find(function (item) {
      return item.relativePath === file.relativePath
    })
  },
  remove: function (file) {
    var item = this.find(file)
    if (item) {
      this.items.splice(this.items.indexOf(item), 1)
    }
  },
  findByPath: function (relativePath) {
    return this.items.find(function (item) {
      return item.relativePath === relativePath
    })
  }
}

module.exports = supermodels(schema)
