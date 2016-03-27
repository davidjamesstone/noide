var Fso = require('./fso')

function Fsos () {
  this.items = []
}
Fsos.prototype.add = function (obj) {
  var file = obj instanceof Fso ? obj : new Fso(obj)
  this.items.push(file)
}
Fsos.prototype.find = function (file) {
  return this.items.find(function (item) {
    return item === file
  })
}
Fsos.prototype.remove = function (file) {
  var item = this.find(file)
  if (item) {
    this.items.splice(this.items.indexOf(item), 1)
  }
}
Fsos.prototype.findByPath = function (relativePath) {
  return this.items.find(function (item) {
    return item.relativePath === relativePath
  })
}
module.exports = Fsos
