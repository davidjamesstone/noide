var patch = require('../patch')
var view = require('./view.html')

function Tree (el, files, state) {
  function onClick (file) {
    if (file.isDirectory) {
      file.expanded = !file.expanded
      render()
    }
    return true
  }

  function render () {
    patch(el, view, makeTree(files), true, state.current, onClick)
  }

  files.on('change', render)
  state.on('change:current', render)

  this.render = render
}

module.exports = {
  alert: function (config) {

  },
  confirm: function () {

  },
  prompt: function () {

  },
  x: function () {

  }
}
