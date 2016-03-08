
var fsw = require('../services/file-system-watcher')
var FileSystemObject = require('../file-system-object')
var watcher = fsw.watcher

module.exports = function (server) {
  server.subscription('/{id}')

  watcher.on('all', function (event, path, stat) {
    stat = stat || (event === 'unlinkDir')
    var fso = new FileSystemObject(path, stat)

    server.publish('/' + event, fso)
    console.log('Watcher event happened', event, fso)
  })

  watcher.on('error', function (err) {
    server.publish('/' + 'error', err)
    console.error('Watcher error happened', err)
  })
}
