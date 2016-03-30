var page = require('page')
var patch = require('../patch')
var state = require('../state')
var view = require('./index.html')
var sessions = require('../sessions')

function closeFile (file) {
  var session = sessions.find(file)

  var close = session && session.isDirty
    ? window.confirm('There are unsaved changes to this file. Are you sure?')
    : true

  if (close) {
    // Remove from recent files
    state.recent.remove(file)

    if (session) {
      // Remove session
      sessions.remove(session)

      // If it's the current file getting closed,
      // navigate back to the previous session/file
      if (state.current === file) {
        if (sessions.items.length) {
          // Open the first session
          page('/file?path=' + sessions.items[0].file.relativePath)
        } else if (state.recent.items.length) {
          // Open the first recent file
          page('/file?path=' + state.recent.items[0].relativePath)
        } else {
          page('/')
        }
      }
    }
  }
}

function Recent (el) {
  function onClickClose (file) {
    closeFile(file)
    render()
  }

  function isDirty (file) {
    var session = sessions.find(file)
    return session && session.isDirty
  }

  function render () {
    patch(el, view, state.recent.items, state.current, onClickClose, isDirty)
  }

  this.render = render
  this.closeFile = closeFile
  render()
}

var recentEl = document.getElementById('recent')

var recentView = new Recent(recentEl)

module.exports = recentView
