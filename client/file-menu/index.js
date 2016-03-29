var patch = require('../patch')
var fs = require('../fs')
var util = require('../util')
var fileEditor = require('../file-editor')
var view = require('./view.html')
var copied
var $ = window.jQuery
var path = require('path')

function FileMenu (el) {
  var $el = $(el)
  $el.on('mouseleave', function () {
    hide()
  })

  function resetPasteBuffer () {
    copied = null
  }

  function setPasteBuffer (file, action) {
    hide()
    copied = {
      file: file,
      action: action
    }
  }

  function showPaste (file) {
    if (copied) {
      var sourcePath = copied.file.path.toLowerCase()
      var sourceDir = copied.file.dir.toLowerCase()
      var destinationDir = (file.isDirectory ? file.path : file.dir).toLowerCase()
      var isDirectory = copied.file.isDirectory

      if (!isDirectory) {
        // Always allow pasteing of a file unless it's a move operation (cut) and the destination dir is the same
        return copied.action !== 'cut' || destinationDir !== sourceDir
      } else {
        // Allow pasteing directories if not into self a decendent
        if (destinationDir.indexOf(sourcePath) !== 0) {
          // and  or if the operation is move (cut) the parent dir too
          return copied.action !== 'cut' || destinationDir !== sourceDir
        }
      }
    }
    return false
  }

  function rename (file) {
    resetPasteBuffer()
    hide()
    fileEditor.rename(file)
  }

  function paste (file) {
    hide()
    function callback (err, payload) {
      if (err) {
        return util.handleError(err)
      }
    }
    if (copied && copied.file) {
      var action = copied.action
      var source = copied.file
      resetPasteBuffer()

      var pastePath = file.isDirectory ? file.path : file.dir

      if (action === 'copy') {
        fs.copy(source.path, path.resolve(pastePath, source.name), callback)
      } else if (action === 'cut') {
        fs.rename(source.path, path.resolve(pastePath, source.name), callback)
      }
    }
  }

  function mkfile (file) {
    fileEditor.mkfile(file)
    hide()
    resetPasteBuffer()
  }

  function mkdir (file) {
    fileEditor.rename(file)
    hide()
    resetPasteBuffer()
  }

  function remove (file) {
    fileEditor.rename(file)
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
