var p = require('path')

var FileSystemObject = function (path, stat) {
  this.name = p.basename(path) || path
  this.path = path
  this.dir = p.dirname(path)
  this.isDirectory = typeof stat === 'boolean' ? stat : stat.isDirectory()
  this.ext = p.extname(path)
  this.stat = stat
  var relativeDir = p.relative(process.cwd(), this.dir)
  this.relativeDir = relativeDir
  var relativePath = p.relative(process.cwd(), this.path)
  this.relativePath = relativePath
}
FileSystemObject.prototype = {
  get isFile () {
    return !this.isDirectory
  }
}
module.exports = FileSystemObject
