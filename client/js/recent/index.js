var patch = require('incremental-dom').patch
var view = require('./index.html')
var noide = require('../noide')

function Recent (el, state) {
  state.on('change', render)

  function onClick (file) {
    noide.openFile(file)
  }

  function onClickClose (file) {
    noide.closeFile(file)
  }

  function update (state) {
    view(state.recent, state.current, onClick, onClickClose)
  }

  function render () {
    patch(el, update, state)
  }

  this.render = render
}

module.exports = Recent
