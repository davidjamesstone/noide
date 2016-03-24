var patch = require('../patch')
var fs = require('../fs')
var view = require('./view.html')

function FileEditor (el) {
  var model = {
    mode: '',
    rename: fs.rename
  }

  function show (file, mode) {
    model.file = file
    model.mode = mode
    patch(el, view, model)
  }

  this.show = show
}
FileEditor.prototype.rename = function (file) {
  this.show(file, 'rename')
}

var fileEditor = new FileEditor(document.getElementById('file-editor'))

module.exports = fileEditor
