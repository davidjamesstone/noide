var fsw = require('./services/file-system-watcher')
var FileSystemObject = require('./file-system-object')
var watcher = fsw.watcher

module.exports = function (server) {
  server.subscription('/fs/{id}')

  watcher.on('all', function (event, path, stat) {
    function publish () {
      stat = stat || (event === 'unlinkDir')
      var fso = new FileSystemObject(path, stat)

      console.log(watcher.getWatched())

      server.publish('/fs/' + event, fso)
      server.publish('/fs/update', {
        file: fso,
        event: event
      })
      server.log('info', `Watcher event happened ${event} ${fso.path}`)
    }

    if (event === 'change') {
      // This small delay ensures changes instigated
      // from our application are callbacked first
      setTimeout(publish, 500)
    } else {
      publish()
    }
  })

  watcher.on('error', function (err) {
    server.publish('/' + 'error', err)
    server.log('error', err)
  })
}
