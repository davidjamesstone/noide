var fs = require('./fs')
var client = require('./client')
var util = require('./util')
var sessions = require('./sessions')

function watch (files, treeView, recentView) {
  function handleError (err) {
    if (err) {
      return util.handleError(err)
    }
  }

  // Subscribe to watched file changes
  // that happen on the file system
  // Reload the session if the changes
  // do not match the state of the file
  client.subscribe('/fs/change', function (payload) {
    sessions.items.forEach(function (session) {
      var file = session.file
      if (payload.path === file.path) {
        if (payload.stat.mtime !== file.stat.mtime) {
          fs.readFile(file.path, function (err, payload) {
            if (err) {
              return util.handleError(err)
            }
            file.stat = payload.stat
            session.editSession.setValue(payload.contents)
          })
        }
      }
    })
  }, handleError)

  client.subscribe('/fs/add', function (payload) {
    console.log(payload)
    files.add(payload)
    treeView.render()
  }, handleError)

  client.subscribe('/fs/addDir', function (payload) {
    console.log(payload)
    files.add(payload)
    treeView.render()
  }, handleError)

  client.subscribe('/fs/unlink', function (payload) {
    console.log(payload)
    var file = files.findByPath(payload.relativePath)
    if (file) {
      files.remove(file)
      treeView.render()
    }
  }, handleError)

  client.subscribe('/fs/unlinkDir', function (payload) {
    console.log(payload)
    var file = files.findByPath(payload.relativePath)
    if (file) {
      files.remove(file)
      treeView.render()
    }
  }, handleError)
}

module.exports = watch
