var p = require('path');

var FileSystemObject = function(path, stat) {
  this.name = p.basename(path) || path;
  this.path = path;
  this.dir = p.dirname(path);
  this.isDirectory = typeof stat === 'boolean' ? stat : stat.isDirectory();
  this.ext = p.extname(path);
};
FileSystemObject.prototype = {
  get isFile() {
    return !this.isDirectory;
  }
};
module.exports = FileSystemObject;