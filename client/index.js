var page = require('page')
var qs = require('querystring')
var fs = require('./fs')
var state = require('./state')
var sessions = require('./sessions')
var Files = require('./files')
var Tree = require('./tree')
var Recent = require('./recent')
var Processes = require('./processes')
var util = require('./util')
var splitter = require('./splitter')
var editor = require('./editor')
var client = require('./client')

var processesEl = document.getElementById('processes')
var recentEl = document.getElementById('recent')
var treeEl = document.getElementById('tree')
var workspacesEl = document.getElementById('workspaces')

window.onbeforeunload = function () {
  if (sessions.dirty.length) {
    return 'Unsaved changes will be lost - are you sure you want to leave?'
  }
}

client.connect(function (err) {
  if (err) {
    return util.handleError(err)
  }

  client.request('/watched', function (err, payload) {
    if (err) {
      return util.handleError(err)
    }

    // Initialize the files
    var files = new Files({
      items: payload.watched
    })

    // Load the state from localStorage
    state.load(files)

    // Subscribe to watched file changes
    // that happen on the file system
    // Reload the session if the changes
    // do not match the state of the file
    client.subscribe('/change', function (payload) {
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

    // Save state on page unload
    window.onunload = function () {
      console.log('log')
      state.save(files)
    }

    // Create a new noide instance
    // var noide = new Noide({
    //   state: state,
    //   files: files
    // })

    // Build the tree pane
    var treeView = new Tree(treeEl, files, state)
    treeView.render()

    // Build the recent list pane
    var recentView = new Recent(recentEl, state)
    recentView.render()

    // Build the procsses pane
    var processesView = new Processes(processesEl)
    processesView.render()

    function resizeEditor () {
      editor.resize()
      processesView.editor.resize()
    }

    splitter(document.getElementById('sidebar-workspaces'), resizeEditor)
    splitter(document.getElementById('workspaces-info'), resizeEditor)
    splitter(document.getElementById('main-footer'), resizeEditor)

    page('/', function (ctx) {
      workspacesEl.className = 'welcome'
    })

    page('/file', function (ctx, next) {
      var path = qs.parse(ctx.querystring).path
      var file = files.find(path)

      if (!file) {
        return next()
      }

      var session = sessions.find(file)

      function setSession () {
        workspacesEl.className = 'editor'

        // Update state
        state.current = file

        var items = state.recent.items
        if (items.indexOf(file) < 0) {
          items.unshift(file)
        }

        // Set the editor session
        editor.setSession(session.editSession)
        editor.resize()
      }

      if (session) {
        setSession()
      } else {
        fs.readFile(path, function (err, payload) {
          if (err) {
            return util.handleError(err)
          }

          session = sessions.add(file, payload.contents)
          setSession()
        })
      }
    })

    page('*', function (ctx) {
      workspacesEl.className = 'not-found'
    })

    page({
      hashbang: true
    })
  })
})
