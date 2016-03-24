function Files () {
  this.items = []
}
Files.prototype.find = function (file) {
  return this.items.find(function (item) {
    return item.relativePath === file.relativePath
  })
}
Files.prototype.remove = function (file) {
  var item = this.find(file)
  if (item) {
    this.items.splice(this.items.indexOf(item), 1)
  }
}
Files.prototype.findByPath = function (relativePath) {
  return this.items.find(function (item) {
    return item.relativePath === relativePath
  })
}
module.exports = Files
