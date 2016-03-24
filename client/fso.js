var extend = require('extend')

function File (data) {
  extend(this, data)
  if (this.isDirectory) {
    this.expanded = false
  }
}
Object.defineProperties(File.prototype, {
  id: {
    get: function () {
      return this.relativePath
    }
  },
  isFile: {
    get: function () {
      return !this.isDirectory
    }
  }
})

module.exports = File
