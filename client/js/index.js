var page = require('page')
var qs = require('querystring')
var noide = require('./noide')
var Tree = require('./tree')
var Recent = require('./recent')
var splitter = require('./splitter')

window.onbeforeunload = function () {
  if (noide.sessions.dirty.length) {
    return 'Unsaved changes will be lost - are you sure you want to leave?'
  }
}

var mainEl = document.getElementById('main')
var recentEl = document.getElementById('recent')
var treeEl = document.getElementById('tree')
var workspacesEl = document.getElementById('workspaces')

splitter(document.getElementById('sidebar-workspaces'))
splitter(document.getElementById('workspaces-info'))
splitter(document.getElementById('main-footer'))

noide.client.connect(function (err) {
  if (err) {
    return noide.handleError(err)
  }

  var tree = new Tree(treeEl, noide.files, noide.state)
  var recent = new Recent(recentEl, noide.state)
  var processes = require('./processes')

  page('/', function (ctx) {
    workspacesEl.className = 'welcome'
  })

  page('/file', function (ctx, next) {
    var path = qs.parse(ctx.querystring).path
    var file = noide.files.find(function (item) {
      return item.relativePath === path
    })

    if (!file) {
      return next()
    }

    noide.openFile(file)
    workspacesEl.className = 'editor'
  })

  page('*', function (ctx) {
    workspacesEl.className = 'not-found'
  })

  noide.files.on('change', function () { tree.render() })
  noide.state.on('change', function () { recent.render() })
  processes.render()
})

document.querySelector('.sidebar-toggle').addEventListener('click', function () {
  mainEl.classList.toggle('no-sidebar')
})
