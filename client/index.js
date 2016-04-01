var page = require('page')
var qs = require('querystring')
var fs = require('./fs')
var state = require('./state')
var client = require('./client')
var sessions = require('./sessions')
var files = require('./files')
var util = require('./util')
var splitter = require('./splitter')
var editor = require('./editor')
var fileEditor = require('./file-editor')
var linter = require('./standard')
var watch = require('./watch')

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
    payload.watched.forEach(files.add, files)

    // Load the state from localStorage
    state.load(files)

    // Save state on page unload
    window.onunload = function () {
      state.save(files)
    }

    // Build the tree pane
    var treeView = require('./tree')

    // Build the recent list pane
    var recentView = require('./recent')

    // Build the procsses pane
    var processesView = require('./processes')

    // Subscribe to watched file changes
    // that happen on the file system
    watch(treeView, recentView)

    // Subscribe to editor changes and
    // update the recent files views
    editor.on('input', function () {
      recentView.render()
    })

    /* Initialize the splitters */
    function resizeEditor () {
      editor.resize()
      processesView.editor.resize()
    }

    splitter(document.getElementById('sidebar-workspaces'), false, resizeEditor)
    splitter(document.getElementById('workspaces-info'), true, resizeEditor)
    splitter(document.getElementById('main-footer'), true, resizeEditor)

    /* Initialize the linter */
    linter()

    function setWorkspace (className) {
      workspacesEl.className = className || 'welcome'
    }

    page('*', function (ctx, next) {
      // Update current file state
      state.current = null
      next()
    })

    page('/', function (ctx) {
      setWorkspace()
    })

    page('/file', function (ctx, next) {
      var relativePath = qs.parse(ctx.querystring).path
      var file = files.findByPath(relativePath)

      if (!file) {
        return next()
      }

      var session = sessions.find(file)

      function setSession () {
        setWorkspace('editor')

        // Update state
        state.current = file

        var recent = state.recent
        if (!recent.find(file)) {
          recent.add(file)
        }

        treeView.render()
        recentView.render()

        // Set the editor session
        editor.setSession(session.editSession)
        editor.resize()
      }

      if (session) {
        setSession()
      } else {
        fs.readFile(relativePath, function (err, payload) {
          if (err) {
            return util.handleError(err)
          }

          session = sessions.add(file, payload.contents)
          setSession()
        })
      }
    })

    page('*', function (ctx) {
      setWorkspace('not-found')
    })

    page({
      hashbang: true
    })

    window.files = files
    window.fileEditor = fileEditor
  })
})
