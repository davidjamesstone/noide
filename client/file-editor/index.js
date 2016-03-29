var patch = require('../patch')
var fs = require('../fs')
var view = require('./view.html')

function FileEditor (el) {
  var model = {
    mode: '',
    rename: fs.rename,
    mkfile: fs.mkfile,
    mkdir: fs.mkdir
  }

  function show (file, mode) {
    model.file = file
    model.mode = mode
    patch(el, view, model)
    var input = el.querySelector('input')
    // input.select()
    input.focus()
  }

  this.show = show
}
FileEditor.prototype.rename = function (file) {
  this.show(file, 'rename')
}
FileEditor.prototype.mkfile = function (dir) {
  this.show(dir, 'mkfile')
}
FileEditor.prototype.mkdir = function (dir) {
  this.show(dir, 'mkdir')
}

var fileEditorEl = document.getElementById('file-editor')
var fileEditor = new FileEditor(fileEditorEl)

module.exports = fileEditor
