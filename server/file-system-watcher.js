var fsw = require('./services/file-system-watcher')
var FileSystemObject = require('./file-system-object')
var watcher = fsw.watcher

module.exports = function (server) {
  server.subscription('/fs/{id}')

  watcher.on('all', function (event, path, stat) {
    stat = stat || (event === 'unlinkDir')
    var fso = new FileSystemObject(path, stat)

    server.publish('/fs/' + event, fso)
    server.publish('/fs/update', {
      file: fso,
      event: event
    })
    server.log('info', `Watcher event happened ${event} ${fso.path}`)
  })

  watcher.on('error', function (err) {
    server.publish('/' + 'error', err)
    server.log('error', err)
  })
}
