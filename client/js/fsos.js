var supermodels = require('supermodels.js')
var Fso = require('./fso')

var schema = {
  __type: [Fso],
  findByPath: function (path) {
    return this.find(function (item) {
      return item.path === path
    })
  }
}

module.exports = supermodels(schema)
