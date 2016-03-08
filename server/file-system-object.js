var Path = require('path')
var Fso = require('vsd-shared').FileSystemObject

function FileSystemObject () {
  Fso.apply(this, arguments)
  var relativeDir = Path.relative(process.cwd(), this.dir)
  this.relativeDir = relativeDir
  var relativePath = Path.relative(process.cwd(), this.path)
  this.relativePath = relativePath
}
FileSystemObject.prototype = Object.create(Fso.prototype)
FileSystemObject.constructor = FileSystemObject

module.exports = FileSystemObject
