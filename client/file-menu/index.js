var patch = require('../patch')
var fs = require('../fs')
var view = require('./view.html')

function FileMenu (el) {
  function showPaste (file) {
    return true
  }

  var model = {
    x: 0,
    y: 0,
    file: null,
    showPaste: showPaste
  }

  function show (file, x, y) {
    model.x = x
    model.y = y
    model.file = file
    patch(el, view, model)
  }

  this.show = show
}

module.exports = FileMenu
