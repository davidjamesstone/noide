var Nes = require('nes/client')
var supermodels = require('supermodels.js')
var Sessions = require('./sessions')
var Editor = require('./editor')
var Fsos = require('./fsos')
var prop = supermodels.prop()
var editor = new Editor()
var state = window.localStorage.getItem('noide') || {}
var sessions = new Sessions(state.sessions)
var host = window.location.host
var client = new Nes.Client('ws://' + host)

client.onDisconnect = function (willReconnect, log) {
  noide.connected = willReconnect ? null : false
  console.log(log)
}

client.onConnect = function () {
  noide.connected = true
  client.request('/watched', function (err, payload) {
    if (err) {
      return noide.handleError(err)
    }

    var files = noide.files
    files.length = 0
    files.splice.apply(files, [0, files.length].concat(new Fsos(payload)))

  // noide.client.subscribe('/change', function (payload) {
  //   if (err) {
  //     throw err
  //   }
  //
  //   var data = payload
  //   if (data.path === state.path) {
  //     if (data.stat.mtime !== state.stat.mtime) {
  //       if (window.confirm('File has been changed - reload?')) {
  //         window.location.reload()
  //       }
  //     }
  //   }
  // }, function (err) {
  //   if (err) {
  //     return handleError(err)
  //   }
  // })
  //
  // client.subscribe('/unlink', function (payload) {
  //   if (err) {
  //     throw err
  //   }
  //
  //   var data = payload
  //   if (data.path === state.path) {
  //     if (window.confirm('File has been removed - close this tab?')) {
  //       window.close()
  //     }
  //   }
  // }, function (err) {
  //   if (err) {
  //     return handleError(err)
  //   }
  // })
  //
  // var lastConsolePid
  // client.subscribe('/io', function (payload) {
  //   if (err) {
  //     return handleError(err)
  //   }
  //   if (lastConsolePid !== payload.pid) {
  //     lastConsolePid = payload.pid
  //   }
  // }, function (err) {
  //   if (err) {
  //     return handleError(err)
  //   }
  // })
  //
  // client.subscribe('/io/pids', function (payload) {
  //   if (err) {
  //     return handleError(err)
  //   }
  // }, function (err) {
  //   return handleError(err)
  // })
  })
}

function handleError (err) {
  console.error(err)
}

function writeFile (path, contents) {
  client.request({
    path: '/writefile',
    payload: {
      path: path,
      contents: contents
    },
    method: 'PUT'
  }, function (err, payload) {
    if (err) {
      return handleError(err)
    }

    sessions.current.getUndoManager().markClean()
  })
}

var schema = {
  connected: prop(Boolean).value(false),
  files: prop(Fsos).value(new Fsos()),
  get client () { return client },
  get editor () { return editor },
  get sessions () { return sessions },
  writeFile: writeFile
}

var Noide = supermodels(schema)
var noide = new Noide()

module.exports = noide
