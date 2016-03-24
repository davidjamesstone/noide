var fs = require('./fs')
var client = require('./client')
var util = require('./util')
var sessions = require('./sessions')

function watch (files) {
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
  }, function (err) {
    if (err) {
      return util.handleError(err)
    }
  })

  // Subscribe to watched file changes
  // that happen on the file system
  // Reload the session if the changes
  // do not match the state of the file
  // client.subscribe('/fs/unlink', function (payload) {
  //   sessions.items.forEach(function (session) {
  //     var file = session.file
  //     if (payload.path === file.path) {
  //       if (payload.stat.mtime !== file.stat.mtime) {
  //         fs.readFile(file.path, function (err, payload) {
  //           if (err) {
  //             return util.handleError(err)
  //           }
  //           file.stat = payload.stat
  //           session.editSession.setValue(payload.contents)
  //         })
  //       }
  //     }
  //   })
  // }, function (err) {
  //   if (err) {
  //     return util.handleError(err)
  //   }
  // })
}

module.exports = watch
