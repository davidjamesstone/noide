var page = require('page')
var qs = require('querystring')
var fs = require('./fs')
var state = require('./state')
var client = require('./client')
var sessions = require('./sessions')
var files = require('./files')
var Tree = require('./tree')
var Recent = require('./recent')
var Processes = require('./processes')
var util = require('./util')
var splitter = require('./splitter')
var editor = require('./editor')
var fileEditor = require('./file-editor')
var linter = require('./standard')
var watch = require('./watch')

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
    payload.watched.forEach(function (item) {
      files.add(item)
    })

    // Load the state from localStorage
    state.load(files)

    // Save state on page unload
    window.onunload = function () {
      console.log('log')
      state.save(files)
    }

    // Build the tree pane
    var treeView = new Tree(treeEl, files, state)
    treeView.render()

    // Build the recent list pane
    var recentView = new Recent(recentEl, state)
    recentView.render()

    // Build the procsses pane
    var processesView = new Processes(processesEl)
    processesView.render()

    // Subscribe to watched file changes
    // that happen on the file system
    watch(files, treeView, recentView)

    /* Initialize the splitters */
    function resizeEditor () {
      editor.resize()
      processesView.editor.resize()
    }

    splitter(document.getElementById('sidebar-workspaces'), resizeEditor)
    splitter(document.getElementById('workspaces-info'), resizeEditor)
    splitter(document.getElementById('main-footer'), resizeEditor)

    /* Initialize the linter */
    linter()

    function setWorkspaceClassName (className) {
      workspacesEl.className = className || 'welcome'
    }

    page('*', function (ctx, next) {
      // Update current file state
      state.current = null
      next()
    })

    page('/', function (ctx) {
      setWorkspaceClassName()
    })

    page('/file', function (ctx, next) {
      var relativePath = qs.parse(ctx.querystring).path
      var file = files.findByPath(relativePath)

      if (!file) {
        return next()
      }

      var session = sessions.find(file)

      function setSession () {
        setWorkspaceClassName('editor')

        // Update state
        state.current = file

        var recent = state.recent
        if (!recent.find(file)) {
          recent.items.unshift(file)
        }

        // Set the editor session
        editor.setSession(session.editSession)
        editor.resize()

        recentView.render()
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
      setWorkspaceClassName('not-found')
    })

    page({
      hashbang: true
    })

    var Files = require('./js/fsos')
    var f = new Files({
      items: payload.watched
    })

    window.f = f
    f.on('change', function () {
      console.log(arguments)
    })
    f.items.on('change', function () {
      console.log(arguments)
    })

    window.files = files
    window.fileEditor = fileEditor
  })
})
