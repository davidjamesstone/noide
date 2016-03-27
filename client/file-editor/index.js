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
    var input = el.querySelector('input')
    input.select()
  }

  this.show = show
}
FileEditor.prototype.rename = function (file) {
  this.show(file, 'rename')
}

var fileEditorEl = document.getElementById('file-editor')
var fileEditor = new FileEditor(fileEditorEl)

module.exports = fileEditor
