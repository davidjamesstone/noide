var page = require('page')
var qs = require('querystring')
var fs = require('./fs')
var state = require('./state')
var sessions = require('./sessions')
var Files = require('./files')
var Tree = require('./tree')
var Recent = require('./recent')
var util = require('./util')
var splitter = require('./splitter')
var editor = require('./editor')
var client = require('./client')

var mainEl = document.getElementById('main')
var recentEl = document.getElementById('recent')
var treeEl = document.getElementById('tree')
var workspacesEl = document.getElementById('workspaces')

window.onbeforeunload = function () {
  if (sessions.dirty.length) {
    return 'Unsaved changes will be lost - are you sure you want to leave?'
  }
}

splitter(document.getElementById('sidebar-workspaces'))
splitter(document.getElementById('workspaces-info'))
splitter(document.getElementById('main-footer'))

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

    // Build the tree
    var treeView = new Tree(treeEl, files, state)
    treeView.render()

    // Build the recent list
    var recentView = new Recent(recentEl, state)
    recentView.render()

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
