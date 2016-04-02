var chokidar = require('chokidar')
var p = require('path')
var FileSystemObject = require('../file-system-object')
var root = process.cwd()

var watcher = chokidar.watch(root, {
  // atomic: true,
  alwaysStat: true,
  usePolling: true,
  ignoreInitial: true,
  ignored: function (path, stat) {
    // This function gets called twice per path.
    // Once with a single argument (the path),
    // second time with two arguments (the path and the fs.Stats object of that path).
    if (stat) {
      var isDir = stat.isDirectory()
      var fso = new FileSystemObject(path, stat)

      if (isDir) {
        // Otherwise ignore node_modules and bower_components and also ignore
        // any dir starting with a '.' e.g. '.git'
        return (fso.name === 'node_modules' && root === fso.dir) ||
        fso.name === 'bower_components' || /[\/\\]\./.test(path)
      } else {
        return fso.name === '.DS_Store'
      }
    }

    return false
  }
})

module.exports = {
  watcher: watcher,
  get watched () {
    var items = []
    var watched = watcher.getWatched()

    for (var dirpath in watched) {
      // add directory
      items.push(new FileSystemObject(dirpath, true))

      for (var i = 0; i < watched[dirpath].length; i++) {
        var name = watched[dirpath][i]
        var path = p.join(dirpath, name)
        if (!watched[path]) {
          // add file
          items.push(new FileSystemObject(path, false))
        }
      }
    }

    return items
  }
}
