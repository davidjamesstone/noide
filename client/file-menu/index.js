var patch = require('../patch')
var fs = require('../fs')
var fileEditor = require('../file-editor')
var view = require('./view.html')
var copied
var $ = window.jQuery

function FileMenu (el) {
  var $el = $(el)
  $el.on('mouseleave', function () {
    hide()
  })

  function resetPasteBuffer () {
    copied = null
  }

  function setPasteBuffer (file, action) {
    copied = {
      file: file,
      action: action
    }
  }

  function showPaste (file) {
    return !!copied
  }

  function rename (file) {
    fileEditor.rename(file)
    hide()
    resetPasteBuffer()
  }

  function paste (file) {
    hide()
    resetPasteBuffer()
  }

  function mkfile (file) {
    hide()
    resetPasteBuffer()
  }

  function mkdir (file) {
    hide()
    resetPasteBuffer()
  }

  function remove (file) {
    hide()
    resetPasteBuffer()
  }

  var model = {
    x: 0,
    y: 0,
    file: null,
    rename: rename,
    paste: paste,
    mkfile: mkfile,
    mkdir: mkdir,
    remove: remove,
    showPaste: showPaste,
    setPasteBuffer: setPasteBuffer
  }

  function hide () {
    model.file = null
    patch(el, view, model)
  }

  function show (x, y, file) {
    model.x = x
    model.y = y
    model.file = file
    patch(el, view, model)
  }

  this.show = show
}

var fileMenuEl = document.getElementById('file-menu')
var fileMenu = new FileMenu(fileMenuEl)

module.exports = fileMenu
