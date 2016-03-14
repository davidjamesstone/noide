var patch = require('../patch')
var state = require('../state')
var view = require('./index.html')
// var noide = require('../noide')

function Recent (el) {
  function onClickClose (file) {
    // noide.closeFile(file)
  }

  function render () {
    patch(el, view, state.recent.items, state.current, onClickClose)
  }

  state.on('change', render)

  this.render = render
}

module.exports = Recent
