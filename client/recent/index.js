var noide = require('../noide')
var patch = require('../patch')
var view = require('./index.html')

function Recent (el) {
  function onClickClose (file) {
    noide.closeFile(file)
  }

  function isDirty (file) {
    var session = noide.getSession(file)
    return session && session.isDirty
  }

  function render () {
    console.log('Render recent')
    patch(el, view, noide.recent, noide.current, onClickClose, isDirty)
  }

  noide.onAddRecent(render)
  noide.onRemoveRecent(render)
  noide.onChangeCurrent(render)
  noide.onChangeSessionDirty(render)

  render()
}

var recentEl = document.getElementById('recent')

var recentView = new Recent(recentEl)

module.exports = recentView
