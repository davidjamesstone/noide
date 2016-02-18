var supermodels = require('supermodels.js')

var schema = {
  name: String,
  path: String,
  dir: String,
  isDirectory: Boolean,
  ext: String,
  stat: Object,
  get isFile () {
    return !this.isDirectory
  }
}

module.exports = supermodels(schema)
