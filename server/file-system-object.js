var path = require('path')
var Fso = require('vsd-shared').FileSystemObject

function FileSystemObject () {
  Fso.apply(this, arguments)
  var relativeDir = path.relative(process.cwd(), this.dir)
  this.relativeDir = relativeDir
  // console.log(relativeDir)
  var relativePath = path.relative(process.cwd(), this.path)
  this.relativePath = relativePath
}
FileSystemObject.prototype = Object.create(Fso.prototype)
FileSystemObject.constructor = FileSystemObject

module.exports = FileSystemObject
