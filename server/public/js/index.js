(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Nes = require('nes/client')
var host = window.location.host
var client = new Nes.Client('ws://' + host)

module.exports = client

},{"nes/client":34}],2:[function(require,module,exports){
var noide = require('../noide')
var client = require('../client')
var fs = require('../fs')
var util = require('../util')
var config = require('../../config/client')
var editor = window.ace.edit('editor')
var $shortcuts = window.jQuery('#keyboard-shortcuts').modal({ show: false })

// Set editor options
editor.setOptions({
  enableSnippets: true,
  enableBasicAutocompletion: true,
  enableLiveAutocompletion: false,
  fontSize: config.ace.fontSize
})

function save (file, session) {
  fs.writeFile(file.path, session.getValue(), function (err, payload) {
    if (err) {
      return util.handleError(err)
    }
    file.stat = payload.stat
    noide.markSessionClean(session)
  })
}

editor.commands.addCommands([{
  name: 'help',
  bindKey: {
    win: 'Ctrl-H',
    mac: 'Command-H'
  },
  exec: function () {
    $shortcuts.modal('show')
  },
  readOnly: true
}])

editor.setTheme('ace/theme/' + config.ace.theme)

editor.commands.addCommands([{
  name: 'save',
  bindKey: {
    win: 'Ctrl-S',
    mac: 'Command-S'
  },
  exec: function (editor) {
    var file = noide.current
    var session = noide.getSession(file)
    save(file, session)
  },
  readOnly: false
}, {
  name: 'saveall',
  bindKey: {
    win: 'Ctrl-Shift-S',
    mac: 'Command-Option-S'
  },
  exec: function (editor) {
    noide.dirty.forEach(function (session) {
      var file = session.file
      save(file, session)
    })
  },
  readOnly: false
}, {
  name: 'beautify',
  bindKey: {
    win: 'Ctrl-B',
    mac: 'Command-B'
  },
  exec: function (editor) {
    var file = noide.current
    var path

    if (file) {
      switch (file.ext) {
        case '.js':
          path = '/standard-format'
          break
        default:
      }

      if (path) {
        client.request({
          path: path,
          payload: {
            value: editor.getValue()
          },
          method: 'POST'
        }, function (err, payload) {
          if (err) {
            return util.handleError(err)
          }
          editor.setValue(payload)
        })
      }
    }
  },
  readOnly: false
}])

module.exports = editor

},{"../../config/client":29,"../client":1,"../fs":7,"../noide":11,"../util":26}],3:[function(require,module,exports){
var page = require('page')
var patch = require('../patch')
var fs = require('../fs')
var view = require('./view.html')

function FileEditor (el) {
  var model = {
    mode: null,
    file: null,
    rename: fs.rename,
    mkfile: function (path) {
      fs.mkfile(path, function (err, payload) {
        if (!err) {
          // Open the new file. Leave a short delay
          // to allow it to register from the socket
          setTimeout(function () {
            page('/file?path=' + payload.relativePath)
          }, 500)
        }
      })
    },
    mkdir: fs.mkdir
  }

  function hide () {
    model.file = null
    model.mode = null
    patch(el, view, model, hide)
  }

  function show (file, mode) {
    model.file = file
    model.mode = mode
    patch(el, view, model, hide)
    var input = el.querySelector('input')
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

},{"../fs":7,"../patch":13,"./view.html":4,"page":36}],4:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementVoid = IncrementalDOM.elementVoid
var elementClose = IncrementalDOM.elementClose
var skip = IncrementalDOM.skip
var currentElement = IncrementalDOM.currentElement
var text = IncrementalDOM.text

module.exports = (function () {
var hoisted1 = ["class", "file-editor"]
var hoisted2 = ["class", "form-group"]
var hoisted3 = ["for", "name"]
var hoisted4 = ["class", "input-group"]
var hoisted5 = ["type", "text", "class", "form-control input-sm", "id", "filename"]
var hoisted6 = ["class", "input-group-btn"]
var hoisted7 = ["class", "btn btn-primary btn-sm", "type", "submit"]
var hoisted8 = ["class", "btn btn-secondary btn-sm", "type", "button"]
var hoisted9 = ["class", "form-group"]
var hoisted10 = ["for", "name"]
var hoisted11 = ["class", "input-group"]
var hoisted12 = ["type", "text", "class", "form-control input-sm", "id", "dirname"]
var hoisted13 = ["class", "input-group-btn"]
var hoisted14 = ["class", "btn btn-primary btn-sm", "type", "submit"]
var hoisted15 = ["class", "btn btn-secondary btn-sm", "type", "button"]
var hoisted16 = ["class", "form-group"]
var hoisted17 = ["for", "name"]
var hoisted18 = ["class", "input-group"]
var hoisted19 = ["type", "text", "class", "form-control input-sm", "id", "rename"]
var hoisted20 = ["class", "input-group-btn"]
var hoisted21 = ["class", "btn btn-primary btn-sm", "type", "submit"]
var hoisted22 = ["class", "btn btn-secondary btn-sm", "type", "button"]

return function fileEditor (model, hide) {
  var file = model.file
  if (file) {
    elementOpen("div", null, hoisted1)
      if (model.mode === 'mkfile') {
        elementOpen("form", "mkfile", null, "onsubmit", function ($event) {
          $event.preventDefault();
          var $element = this;
        model.mkfile(this.filename.value); hide()})
          elementOpen("div", null, hoisted2)
            elementOpen("label", null, hoisted3)
              text("Add new file")
            elementClose("label")
            elementOpen("div", null, hoisted4)
              elementOpen("input", null, hoisted5, "value", file.relativePath ? file.relativePath + '/' : '')
              elementClose("input")
              elementOpen("span", null, hoisted6)
                elementOpen("button", null, hoisted7)
                  text("OK")
                elementClose("button")
                elementOpen("button", null, hoisted8, "onclick", function ($event) {
                  $event.preventDefault();
                  var $element = this;
                hide()})
                  text("Cancel")
                elementClose("button")
              elementClose("span")
            elementClose("div")
          elementClose("div")
        elementClose("form")
      }
      if (model.mode === 'mkdir') {
        elementOpen("form", "mkdir", null, "onsubmit", function ($event) {
          $event.preventDefault();
          var $element = this;
        model.mkdir(this.dirname.value); hide()})
          elementOpen("div", null, hoisted9)
            elementOpen("label", null, hoisted10)
              text("Add new folder")
            elementClose("label")
            elementOpen("div", null, hoisted11)
              elementOpen("input", null, hoisted12, "value", file.relativePath ? file.relativePath + '/' : '')
              elementClose("input")
              elementOpen("span", null, hoisted13)
                elementOpen("button", null, hoisted14)
                  text("OK")
                elementClose("button")
                elementOpen("button", null, hoisted15, "onclick", function ($event) {
                  $event.preventDefault();
                  var $element = this;
                hide()})
                  text("Cancel")
                elementClose("button")
              elementClose("span")
            elementClose("div")
          elementClose("div")
        elementClose("form")
      }
      if (model.mode === 'rename') {
        elementOpen("form", "rename", null, "onsubmit", function ($event) {
          $event.preventDefault();
          var $element = this;
        model.rename(file.relativePath, this.rename.value); hide()})
          elementOpen("div", null, hoisted16)
            elementOpen("label", null, hoisted17)
              text("Rename")
            elementClose("label")
            elementOpen("div", null, hoisted18)
              elementOpen("input", null, hoisted19, "value", file.relativePath)
              elementClose("input")
              elementOpen("span", null, hoisted20)
                elementOpen("button", null, hoisted21)
                  text("OK")
                elementClose("button")
                elementOpen("button", null, hoisted22, "onclick", function ($event) {
                  $event.preventDefault();
                  var $element = this;
                hide()})
                  text("Cancel")
                elementClose("button")
              elementClose("span")
            elementClose("div")
          elementClose("div")
        elementClose("form")
      }
    elementClose("div")
  }
}
})();

},{"incremental-dom":31}],5:[function(require,module,exports){
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

  function callback (err, payload) {
    if (err) {
      return util.handleError(err)
    }
  }

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
      var sourcePath = copied.file.relativePath.toLowerCase()
      var sourceDir = copied.file.relativeDir.toLowerCase()
      var destinationDir = (file.isDirectory ? file.relativePath : file.relativeDir).toLowerCase()
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
    hide()
    resetPasteBuffer()
    fileEditor.rename(file)
  }

  function paste (file) {
    hide()
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
    hide()
    resetPasteBuffer()
    fileEditor.mkfile(file.isDirectory ? file : file.parent)
  }

  function mkdir (file) {
    hide()
    resetPasteBuffer()
    fileEditor.mkdir(file.isDirectory ? file : file.parent)
  }

  function remove (file) {
    var path = file.relativePath
    hide()
    resetPasteBuffer()
    if (window.confirm('Delete [' + path + ']')) {
      fs.remove(path, callback)
    }
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

},{"../file-editor":3,"../fs":7,"../patch":13,"../util":26,"./view.html":6,"path":37}],6:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementVoid = IncrementalDOM.elementVoid
var elementClose = IncrementalDOM.elementClose
var skip = IncrementalDOM.skip
var currentElement = IncrementalDOM.currentElement
var text = IncrementalDOM.text

module.exports = (function () {
var hoisted1 = ["class", "dropdown-menu"]
var hoisted2 = ["class", "dropdown-header"]
var hoisted3 = ["class", "fa fa-pencil"]
var hoisted4 = ["class", "divider"]
var hoisted5 = ["class", "fa fa-scissors"]
var hoisted6 = ["class", "fa fa-copy"]
var hoisted7 = ["class", "fa fa-paste"]
var hoisted8 = ["class", "divider"]
var hoisted9 = ["class", "fa fa-file"]
var hoisted10 = ["class", "fa fa-folder"]
var hoisted11 = ["class", "divider"]
var hoisted12 = ["class", "fa fa-trash"]

return function fileMenu (model) {
  var file = model.file
  if (file) {
    elementOpen("ul", null, hoisted1, "style", { top: model.y, left: model.x })
      elementOpen("li", "header", hoisted2)
        text("" + (file.name) + "")
      elementClose("li")
      elementOpen("li", "rename")
        elementOpen("a", null, null, "onclick", function ($event) {
          $event.preventDefault();
          var $element = this;
        model.rename(file)})
          elementOpen("i", null, hoisted3)
          elementClose("i")
          text(" Rename")
        elementClose("a")
      elementClose("li")
      elementOpen("li", "divider-1", hoisted4)
      elementClose("li")
      elementOpen("li", "cut")
        elementOpen("a", null, null, "onclick", function ($event) {
          $event.preventDefault();
          var $element = this;
        model.setPasteBuffer(file, 'cut')})
          elementOpen("i", null, hoisted5)
          elementClose("i")
          text(" Cut")
        elementClose("a")
      elementClose("li")
      elementOpen("li", "copy")
        elementOpen("a", null, null, "onclick", function ($event) {
          $event.preventDefault();
          var $element = this;
        model.setPasteBuffer(file, 'copy')})
          elementOpen("i", null, hoisted6)
          elementClose("i")
          text(" Copy")
        elementClose("a")
      elementClose("li")
      if (model.showPaste(file)) {
        elementOpen("li", "paste")
          elementOpen("a", null, null, "onclick", function ($event) {
            $event.preventDefault();
            var $element = this;
          model.paste(file)})
            elementOpen("i", null, hoisted7)
            elementClose("i")
            text(" Paste")
          elementClose("a")
        elementClose("li")
      }
      elementOpen("li", "divider-2", hoisted8)
      elementClose("li")
      elementOpen("li", "mkfile")
        elementOpen("a", null, null, "onclick", function ($event) {
          $event.preventDefault();
          var $element = this;
        model.mkfile(file)})
          elementOpen("i", null, hoisted9)
          elementClose("i")
          text(" Add new file")
        elementClose("a")
      elementClose("li")
      elementOpen("li", "mkdir")
        elementOpen("a", null, null, "onclick", function ($event) {
          $event.preventDefault();
          var $element = this;
        model.mkdir(file)})
          elementOpen("i", null, hoisted10)
          elementClose("i")
          text(" Add new folder")
        elementClose("a")
      elementClose("li")
      elementOpen("li", "divider-3", hoisted11)
      elementClose("li")
      elementOpen("li", "delete")
        elementOpen("a", null, null, "onclick", function ($event) {
          $event.preventDefault();
          var $element = this;
        model.remove(file)})
          elementOpen("i", null, hoisted12)
          elementClose("i")
          text(" Delete")
        elementClose("a")
      elementClose("li")
    elementClose("ul")
  }
}
})();

},{"incremental-dom":31}],7:[function(require,module,exports){
var client = require('./client')

function readFile (path, callback) {
  client.request({
    path: '/readfile?path=' + path,
    method: 'GET'
  }, callback)
}

function writeFile (path, contents, callback) {
  client.request({
    path: '/writefile',
    payload: {
      path: path,
      contents: contents
    },
    method: 'PUT'
  }, callback)
}

function mkdir (path, callback) {
  client.request({
    path: '/mkdir',
    payload: {
      path: path
    },
    method: 'POST'
  }, callback)
}

function mkfile (path, callback) {
  client.request({ path: '/mkfile',
    payload: {
      path: path
    },
    method: 'POST'
  }, callback)
}

function copy (source, destination, callback) {
  client.request({
    path: '/copy',
    payload: {
      source: source,
      destination: destination
    },
    method: 'POST'
  }, callback)
}

function rename (oldPath, newPath, callback) {
  client.request({
    path: '/rename',
    payload: {
      oldPath: oldPath,
      newPath: newPath
    },
    method: 'PUT'
  }, callback)
}

function remove (path, callback) {
  client.request({
    path: '/remove',
    payload: {
      path: path
    },
    method: 'DELETE'
  }, callback)
}

module.exports = {
  mkdir: mkdir,
  mkfile: mkfile,
  copy: copy,
  readFile: readFile,
  writeFile: writeFile,
  rename: rename,
  remove: remove
}

},{"./client":1}],8:[function(require,module,exports){
var extend = require('extend')

function File (data) {
  extend(this, data)
  if (this.isDirectory) {
    this.expanded = false
  }
}
Object.defineProperties(File.prototype, {
  isFile: {
    get: function () {
      return !this.isDirectory
    }
  }
})

module.exports = File

},{"extend":30}],9:[function(require,module,exports){
var page = require('page')
var qs = require('querystring')
var fs = require('./fs')
var client = require('./client')
var util = require('./util')
var splitter = require('./splitter')
var editor = require('./editor')
var linter = require('./standard')
var noide = require('./noide')
var watch = require('./watch')

var workspacesEl = document.getElementById('workspaces')

window.onbeforeunload = function () {
  if (noide.dirty.length) {
    return 'Unsaved changes will be lost - are you sure you want to leave?'
  }
}

client.connect(function (err) {
  if (err) {
    return util.handleError(err)
  }

  client.request('/watched', function (err, payload) {
    if (err) {
      return util.handleError(err)
    }

    noide.load(payload)

    // Save state on page unload
    window.onunload = function () {
      noide.saveState()
    }

    // Build the tree pane
    require('./tree')

    // Build the recent list pane
    require('./recent')

    // Build the procsses pane
    var processesView = require('./processes')

    // Subscribe to watched file changes
    // that happen on the file system
    watch()

    // Subscribe to editor changes and
    // update the recent files views
    editor.on('input', function () {
      noide.onInput()
    })

    /* Initialize the splitters */
    function resizeEditor () {
      editor.resize()
      processesView.editor.resize()
    }

    splitter(document.getElementById('sidebar-workspaces'), false, resizeEditor)
    splitter(document.getElementById('workspaces-info'), true, resizeEditor)
    splitter(document.getElementById('main-footer'), true, resizeEditor)

    /* Initialize the standardjs linter */
    linter()

    function setWorkspace (className) {
      workspacesEl.className = className || 'welcome'
    }

    page('*', function (ctx, next) {
      // Update current file state
      noide.current = null
      next()
    })

    page('/', function (ctx) {
      setWorkspace()
    })

    page('/file', function (ctx, next) {
      var relativePath = qs.parse(ctx.querystring).path
      var file = noide.getFile(relativePath)

      if (!file) {
        return next()
      }

      var session = noide.getSession(file)

      function setSession () {
        setWorkspace('editor')

        // Update state
        noide.current = file

        if (!noide.hasRecent(file)) {
          noide.addRecent(file)
        }

        // Set the editor session
        editor.setSession(session.editSession)
        editor.resize()
        editor.focus()
      }

      if (session) {
        setSession()
      } else {
        fs.readFile(relativePath, function (err, payload) {
          if (err) {
            return util.handleError(err)
          }

          session = noide.addSession(file, payload.contents)
          setSession()
        })
      }
    })

    page('*', function (ctx) {
      setWorkspace('not-found')
    })

    page({
      hashbang: true
    })
  })
})

},{"./client":1,"./editor":2,"./fs":7,"./noide":11,"./processes":15,"./recent":20,"./splitter":22,"./standard":23,"./tree":24,"./util":26,"./watch":27,"page":36,"querystring":42}],10:[function(require,module,exports){
var util = require('./util')
var client = require('./client')

function run (command, name, callback) {
  if (typeof name === 'function') {
    callback = name
    name = command
  }

  if (!name) {
    name = command
  }

  client.request({
    path: '/io',
    payload: {
      name: name,
      command: command
    },
    method: 'POST'
  }, function (err, payload) {
    if (err) {
      util.handleError(err)
    }
    callback && callback(err, payload)
  })
}

module.exports = {
  run: run
}

},{"./client":1,"./util":26}],11:[function(require,module,exports){
var page = require('page')
var Fso = require('./fso')
var Session = require('./session')
var observable = require('./observable')
var storageKey = 'noide'

// The current active file
var current

// The map of files
var files = null

// The map of recent files
var recent = new Map()

// The map of sessions
var sessions = new Map()

var noide = {
  get current () {
    return current
  },
  set current (value) {
    current = value

    this.emitChangeCurrent({
      detail: current
    })
  },
  load: function (payload) {
    this.cwd = payload.cwd

    files = new Map(payload.watched.map(function (item) {
      return [item.relativePath, new Fso(item)]
    }))

    var storage = window.localStorage.getItem(storageKey)
    storage = storage ? JSON.parse(storage) : {}

    var file, i

    if (storage.recent) {
      for (i = 0; i < storage.recent.length; i++) {
        file = files.get(storage.recent[i])
        if (file) {
          recent.set(file, false)
        }
      }
    }

    if (storage.expanded) {
      for (i = 0; i < storage.expanded.length; i++) {
        file = files.get(storage.expanded[i])
        if (file && file.isDirectory) {
          file.expanded = true
        }
      }
    }
  },
  saveState: function (files) {
    var storage = {
      recent: this.recent.map(function (item) {
        return item.relativePath
      }),
      expanded: this.files.filter(function (item) {
        return item.expanded
      }).map(function (item) {
        return item.relativePath
      })
    }
    window.localStorage.setItem(storageKey, JSON.stringify(storage))
  },
  get files () {
    return Array.from(files.values())
  },
  get sessions () {
    return Array.from(sessions.values())
  },
  get recent () {
    return Array.from(recent.keys())
  },
  get dirty () {
    return this.sessions.filter(function (item) {
      return item.isDirty
    })
  },
  addFile: function (data) {
    var file = new Fso(data)
    files.set(file.relativePath, file)
    this.emitAddFile(file)
    return file
  },
  getFile: function (path) {
    return files.get(path)
  },
  hasFile: function (path) {
    return files.has(path)
  },
  hasRecent: function (file) {
    return recent.has(file)
  },
  addRecent: function (file) {
    recent.set(file, true)
    this.emitAddRecent(file)
  },
  getSession: function (file) {
    return sessions.get(file)
  },
  getRecent: function (file) {
    return recent.get(file)
  },
  hasSession: function (file) {
    return sessions.has(file)
  },
  addSession: function (file, contents) {
    var session = new Session(file, contents)
    sessions.set(file, session)
    return session
  },
  markSessionClean: function (session) {
    session.markClean()
    this.emitChangeSessionDirty(session)
  },
  onInput: function () {
    var file = noide.current
    var session = this.getSession(file)
    if (session) {
      var isClean = session.isClean
      if (isClean && session.isDirty) {
        session.isDirty = false
        this.emitChangeSessionDirty(session)
      } else if (!isClean && !session.isDirty) {
        session.isDirty = true
        this.emitChangeSessionDirty(session)
      }
    }
  },
  removeFile: function (file) {
    // Remove from files
    if (this.hasFile(file.relativePath)) {
      files.delete(file.relativePath)
      this.emitRemoveFile(file)
    }

    // Remove session
    if (this.hasSession(file)) {
      sessions.delete(file)
    }

    // Remove from recent files
    if (this.hasRecent(file)) {
      recent.delete(file)
      this.emitRemoveRecent(file)
    }

    // If it's the current file getting removed,
    // navigate back to the previous session/file
    if (current === file) {
      if (sessions.size) {
        // Open the first session
        page('/file?path=' + this.sessions[0].file.relativePath)
      } else if (recent.size) {
        // Open the first recent file
        page('/file?path=' + this.recent[0].relativePath)
      } else {
        page('/')
      }
    }
  },
  closeFile: function (file) {
    var session = this.getSession(file)

    var close = session && session.isDirty
      ? window.confirm('There are unsaved changes to this file. Are you sure?')
      : true

    if (close) {
      // Remove from recent files
      recent.delete(file)
      this.emitRemoveRecent(file)

      if (session) {
        // Remove session
        sessions.delete(file)

        // If it's the current file getting closed,
        // navigate back to the previous session/file
        if (current === file) {
          if (sessions.size) {
            // Open the first session
            page('/file?path=' + this.sessions[0].file.relativePath)
          } else if (recent.size) {
            // Open the first recent file
            page('/file?path=' + this.recent[0].relativePath)
          } else {
            page('/')
          }
        }
      }
    }
  }
}

window.noide = noide

module.exports = observable(noide, {
  'Change': 'change',
  'AddFile': 'addfile',
  'RemoveFile': 'removefile',
  'AddRecent': 'addRecent',
  'RemoveRecent': 'removerecent',
  'ChangeCurrent': 'changecurrent',
  'ChangeSessionDirty': 'changesessiondirty'
})

},{"./fso":8,"./observable":12,"./session":21,"page":36}],12:[function(require,module,exports){
var $ = window.jQuery

function Observable (eventsObj) {
  var _listeners = {}

  function listeners (event) {
    return event ? _listeners[event] || (_listeners[event] = $.Callbacks()) : _listeners
  }
  var on = function (event, fn) {
    listeners(event).add(fn)
  }
  var off = function (event, fn) {
    listeners(event).remove(fn)
  }
  var emit = function (event, data) {
    listeners(event).fireWith(this, [data])
  }

  // Add event attach/detatch handler functions
  var events = Object.keys(eventsObj)
  events.forEach(function (event) {
    this['on' + event] = function (fn) {
      on.call(this, eventsObj[event], fn)
    }
    this['off' + event] = function (fn) {
      off.call(this, eventsObj[event], fn)
    }
    this['emit' + event] = function (data) {
      data.type = eventsObj[event]
      emit.call(this, eventsObj[event], data)
    }
  }, this)

  // this.on = on
  // this.off = off
  // this.emit = emit
  this.events = eventsObj
}

/*
 * Make a Constructor become an observable and
 * exposes event names as constants
 */
// module.exports = function (Constructor, events) {
//   /*
//    * Mixin Observable into Constructor prototype
//    */
//   var p = typeof Constructor === 'function' ? Constructor.prototype : Constructor
//   $.extend(p, new Observable(events))
//
//   return Constructor
// }
module.exports = function (ctorOrObj, events) {
  if (!ctorOrObj) {
    return new Observable(events)
  }
  /*
   * Mixin Observable into Constructor prototype
   */
  var p = typeof ctorOrObj === 'function' ? ctorOrObj.prototype : ctorOrObj
  $.extend(p, new Observable(events))

  return ctorOrObj
}

},{}],13:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch

// Fix up the element `value` attribute
IncrementalDOM.attributes.value = function (el, name, value) {
  el.value = value
}

module.exports = function (el, view, data) {
  var args = Array.prototype.slice.call(arguments)
  if (args.length <= 3) {
    patch(el, view, data)
  } else {
    patch(el, function () {
      view.apply(this, args.slice(2))
    })
  }
}

},{"incremental-dom":31}],14:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementVoid = IncrementalDOM.elementVoid
var elementClose = IncrementalDOM.elementClose
var skip = IncrementalDOM.skip
var currentElement = IncrementalDOM.currentElement
var text = IncrementalDOM.text

module.exports = (function () {
var hoisted1 = ["class", "control"]
var hoisted2 = ["class", "input-group"]
var hoisted3 = ["class", "input-group-btn dropup"]
var hoisted4 = ["type", "button", "class", "btn btn-default btn-sm dropdown-toggle", "data-toggle", "dropdown"]
var hoisted5 = ["class", "caret"]
var hoisted6 = ["class", "dropdown-menu"]
var hoisted7 = ["class", "dropdown-header"]
var hoisted8 = ["href", "#"]
var hoisted9 = ["type", "text", "class", "form-control input-sm", "name", "command", "required", "", "autocomplete", "off", "placeholder", ">"]
var hoisted10 = ["class", "input-group-btn"]
var hoisted11 = ["class", "btn btn-default btn-sm", "type", "submit", "title", "Run command"]
var hoisted12 = ["class", "btn btn-success btn-sm", "type", "button", "title", "Remove dead processes"]
var hoisted13 = ["class", "nav nav-tabs"]
var hoisted14 = ["class", "dropdown-toggle", "data-toggle", "dropdown"]
var hoisted15 = ["class", "caret"]
var hoisted16 = ["class", "dropdown-menu"]
var hoisted17 = ["class", "dropdown-header"]
var hoisted18 = ["class", "dropdown-header"]
var hoisted19 = ["role", "separator", "class", "divider"]
var hoisted20 = ["class", "fa fa-stop"]
var hoisted21 = ["class", "fa fa-refresh"]
var hoisted22 = ["class", "fa fa-close"]
var hoisted23 = ["class", "processes"]
var hoisted24 = ["class", "output"]

return function description (model, actions, editorIsInitialized) {
  elementOpen("div", null, hoisted1)
    elementOpen("form", null, null, "onsubmit", function ($event) {
      $event.preventDefault();
      var $element = this;
    actions.run(this.command.value)})
      elementOpen("div", null, hoisted2)
        elementOpen("div", null, hoisted3)
          elementOpen("button", null, hoisted4)
            text("Task ")
            elementOpen("span", null, hoisted5)
            elementClose("span")
          elementClose("button")
          elementOpen("ul", null, hoisted6)
            if (!model.tasks.length) {
              elementOpen("li", null, hoisted7)
                text("No npm run-scripts found")
              elementClose("li")
            }
            if (model.tasks.length) {
              ;(Array.isArray(model.tasks) ? model.tasks : Object.keys(model.tasks)).forEach(function(task, $index) {
                elementOpen("li", task.name)
                  elementOpen("a", null, hoisted8, "onclick", function ($event) {
                    $event.preventDefault();
                    var $element = this;
                  actions.setCommand('npm run ' + task.name)})
                    text("" + (task.name) + "")
                  elementClose("a")
                elementClose("li")
              }, model.tasks)
            }
          elementClose("ul")
        elementClose("div")
        elementOpen("input", null, hoisted9, "value", model.command)
        elementClose("input")
        elementOpen("span", null, hoisted10)
          elementOpen("button", null, hoisted11)
            text("Run")
          elementClose("button")
          if (model.dead.length) {
            elementOpen("button", null, hoisted12, "onclick", function ($event) {
              $event.preventDefault();
              var $element = this;
            actions.removeAllDead()})
              text("Clear completed")
            elementClose("button")
          }
        elementClose("span")
      elementClose("div")
    elementClose("form")
    elementOpen("ul", null, hoisted13)
      ;(Array.isArray(model.processes) ? model.processes : Object.keys(model.processes)).forEach(function(process, $index) {
        elementOpen("li", process.pid, null, "class", process === model.current ? 'dropup active' : 'dropup')
          elementOpen("a", null, hoisted14, "onclick", function ($event) {
            $event.preventDefault();
            var $element = this;
          actions.setCurrent(process)})
            elementOpen("span", null, null, "class", 'circle ' + (!process.isAlive ? 'dead' : (process.isActive ? 'alive active' : 'alive')))
            elementClose("span")
            text(" \
                      " + (process.name || process.command) + " \
                      ")
            elementOpen("span", null, hoisted15)
            elementClose("span")
          elementClose("a")
          elementOpen("ul", null, hoisted16)
            if (process.isAlive) {
              elementOpen("li", null, hoisted17)
                text("Process [" + (process.pid) + "]")
              elementClose("li")
            }
            if (!process.isAlive) {
              elementOpen("li", null, hoisted18)
                text("Process [")
                elementOpen("s")
                  text("" + (process.pid) + "")
                elementClose("s")
                text("]")
              elementClose("li")
            }
            elementOpen("li", null, hoisted19)
            elementClose("li")
            elementOpen("li")
              if (process.isAlive) {
                elementOpen("a", "kill-tab", null, "onclick", function ($event) {
                  $event.preventDefault();
                  var $element = this;
                actions.kill(process)})
                  elementOpen("i", null, hoisted20)
                  elementClose("i")
                  text(" Stop")
                elementClose("a")
              }
            elementClose("li")
            if (!process.isAlive) {
              elementOpen("li")
                elementOpen("a", "resurrect-tab", null, "onclick", function ($event) {
                  $event.preventDefault();
                  var $element = this;
                actions.resurrect(process)})
                  elementOpen("i", null, hoisted21)
                  elementClose("i")
                  text(" Resurrect")
                elementClose("a")
              elementClose("li")
              elementOpen("li")
                elementOpen("a", "remove-tab", null, "onclick", function ($event) {
                  $event.preventDefault();
                  var $element = this;
                actions.remove(process)})
                  elementOpen("i", null, hoisted22)
                  elementClose("i")
                  text(" Close")
                elementClose("a")
              elementClose("li")
            }
          elementClose("ul")
        elementClose("li")
      }, model.processes)
    elementClose("ul")
  elementClose("div")
  elementOpen("div", null, hoisted23, "style", {display: model.current ? '' : 'none'})
    elementOpen("div", null, hoisted24)
      if (editorIsInitialized) {
        skip()
      } else {
      }
    elementClose("div")
  elementClose("div")
}
})();

},{"incremental-dom":31}],15:[function(require,module,exports){
var patch = require('../patch')
var view = require('./index.html')
var model = require('./model')
var Task = require('./task')
var Process = require('./process')
var client = require('../client')
var io = require('../io')
var fs = require('../fs')
var util = require('../util')
var config = require('../../config/client')

function Processes (el) {
  var editor, commandEl

  /**
   * Sets the isActive state on the process.
   * Processes are activated when they receive some data.
   * After a short delay, this is reset to inactive.
   */
  function setProcessActiveState (process, value) {
    if (process.isActive !== value) {
      var timeout = process._timeout
      if (timeout) {
        clearTimeout(timeout)
      }

      process.isActive = value
      if (process.isActive) {
        process._timeout = setTimeout(function () {
          setProcessActiveState(process, false)
        }, 1500)
      }
      render()
    }
  }

  client.subscribe('/io', function (payload) {
    var process = model.findProcessByPid(payload.pid)

    if (process) {
      var session = process.session

      // Insert data chunk
      session.insert({
        row: session.getLength(),
        column: 0
      }, payload.data)

      // Move to the end of the output
      session.getSelection().moveCursorFileEnd()

      // Set the process active state to true
      setProcessActiveState(process, true)

      render()
    }
  }, function (err) {
    if (err) {
      return util.handleError(err)
    }
  })

  var actions = {
    run: function (command, name) {
      io.run(command, name, function (err, payload) {
        if (err) {
          return util.handleError(err)
        }
      })
    },
    remove: function (process) {
      if (model.remove(process)) {
        render()
      }
    },
    removeAllDead: function () {
      var died = model.removeAllDead()
      if (died.length) {
        render()
      }
    },
    resurrect: function (process) {
      model.remove(process)
      this.run(process.command, process.name)
      render()
    },
    kill: function (process) {
      client.request({
        method: 'POST',
        path: '/io/kill',
        payload: {
          pid: process.pid
        }
      }, function (err, payload) {
        if (err) {
          util.handleError(err)
        }
      })
    },
    setCommand: function (command) {
      model.command = command
      render()
      commandEl.focus()
    },
    setCurrent: function (process) {
      model.current = process
      if (model.current) {
        editor.setSession(model.current.session)
      }
      render()
    }
  }

  function loadPids (procs) {
    var proc
    var born = []

    // Find any new processes
    for (var i = 0; i < procs.length; i++) {
      proc = procs[i]

      var process = model.processes.find(function (item) {
        return item.pid === proc.pid
      })

      if (!process) {
        // New child process found. Add it
        // and set it's cached buffer into session
        process = new Process(proc)
        process.session.setValue(proc.buffer)
        born.push(process)
      }
    }

    // Shut down processes that have died
    model.processes.forEach(function (item) {
      var match = procs.find(function (check) {
        return item.pid === check.pid
      })
      if (!match) {
        // item.pid = 0
        item.isAlive = false
        setProcessActiveState(item, false)
      }
    })

    // Insert any new child processes
    if (born.length) {
      Array.prototype.push.apply(model.processes, born)
      actions.setCurrent(born[0])
    }
    render()
  }

  client.subscribe('/io/pids', loadPids, function (err) {
    if (err) {
      return util.handleError(err)
    }
  })

  client.request({
    path: '/io/pids'
  }, function (err, payload) {
    if (err) {
      util.handleError(err)
    }
    loadPids(payload)
  })

  fs.readFile('package.json', function (err, payload) {
    if (err) {
      return
    }

    var pkg = {}
    try {
      pkg = JSON.parse(payload.contents)
    } catch (e) {}

    console.log(pkg)
    if (pkg.scripts) {
      var tasks = []
      for (var script in pkg.scripts) {
        if (script.substr(0, 3) === 'pre' || script.substr(0, 4) === 'post') {
          continue
        }

        tasks.push(new Task({
          name: script,
          command: pkg.scripts[script]
        }))
      }
      model.tasks = tasks
      render()
    }
  })

  function render () {
    patch(el, view, model, actions, !!editor)

    if (!editor) {
      var outputEl = el.querySelector('.output')
      commandEl = el.querySelector('input[name="command"]')
      editor = window.ace.edit(outputEl)

      // Set editor options
      editor.setTheme('ace/theme/terminal')
      editor.setReadOnly(true)
      editor.setFontSize(config.ace.fontSize)
      editor.renderer.setShowGutter(false)
      editor.setHighlightActiveLine(false)
      editor.setShowPrintMargin(false)
    }
  }

  this.model = model
  this.render = render

  Object.defineProperties(this, {
    editor: {
      get: function () {
        return editor
      }
    }
  })
}

var processesEl = document.getElementById('processes')

var processesView = new Processes(processesEl)

processesView.render()

module.exports = processesView

},{"../../config/client":29,"../client":1,"../fs":7,"../io":10,"../patch":13,"../util":26,"./index.html":14,"./model":16,"./process":17,"./task":18}],16:[function(require,module,exports){
var model = {
  tasks: [],
  command: '',
  processes: [],
  current: null,
  get dead () {
    return this.processes.filter(function (item) {
      return !item.isAlive
    })
  },
  remove: function (process) {
    var processes = this.processes
    var idx = processes.indexOf(process)
    if (idx > -1) {
      processes.splice(processes.indexOf(process), 1)
      if (this.current === process) {
        this.current = processes[0]
      }
      return true
    }
    return false
  },
  removeAllDead: function () {
    var dead = this.dead
    for (var i = 0; i < dead.length; i++) {
      this.remove(dead[i])
    }
    return dead
  },
  findProcessByPid: function (pid) {
    return this.processes.find(function (item) {
      return item.pid === pid
    })
  }
}

module.exports = model

},{}],17:[function(require,module,exports){
var extend = require('extend')
var EditSession = window.ace.require('ace/edit_session').EditSession

function Process (data) {
  extend(this, data)
  var editSession = new EditSession('', 'ace/mode/sh')
  editSession.setUseWorker(false)
  this.session = editSession
  this.isAlive = true
  this.isActive = false
}

module.exports = Process

},{"extend":30}],18:[function(require,module,exports){
function Task (data) {
  this.name = data.name
  this.command = data.command
}

module.exports = Task

},{}],19:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementVoid = IncrementalDOM.elementVoid
var elementClose = IncrementalDOM.elementClose
var skip = IncrementalDOM.skip
var currentElement = IncrementalDOM.currentElement
var text = IncrementalDOM.text

module.exports = (function () {
var hoisted1 = ["class", "list-group"]
var hoisted2 = ["class", "close"]
var hoisted3 = ["class", "name icon icon-file-text"]
var hoisted4 = ["class", "file-name"]
var hoisted5 = ["class", "list-group-item-text"]

return function recent (files, current, onClickClose, isDirty) {
  elementOpen("div", null, hoisted1, "style", {display: files.length ? '' : 'none'})
    ;(Array.isArray(files.reverse()) ? files.reverse() : Object.keys(files.reverse())).forEach(function(file, $index) {
      elementOpen("a", file.relativePath, null, "title", file.relativePath, "href", "/file?path=" + (file.relativePath) + "", "class", 'list-group-item' + (file === current ? ' active' : ''))
        elementOpen("span", null, hoisted2, "onclick", function ($event) {
          $event.preventDefault();
          var $element = this;
        onClickClose(file)})
          text("×")
        elementClose("span")
        elementOpen("span", null, hoisted3, "data-name", file.name, "data-path", file.relativePath)
        elementClose("span")
        elementOpen("small", null, hoisted4)
          text("" + (file.name) + "")
        elementClose("small")
        if (isDirty(file)) {
          elementOpen("span")
            text("*")
          elementClose("span")
        }
        if (false) {
          elementOpen("p", null, hoisted5)
            text("" + ('./' + (file.relativePath !== file.name ? file.relativeDir : '')) + "")
          elementClose("p")
        }
      elementClose("a")
    }, files.reverse())
  elementClose("div")
}
})();

},{"incremental-dom":31}],20:[function(require,module,exports){
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

},{"../noide":11,"../patch":13,"./index.html":19}],21:[function(require,module,exports){
var config = require('../config/client')
var EditSession = window.ace.require('ace/edit_session').EditSession
var UndoManager = window.ace.require('ace/undomanager').UndoManager
var ModeList = window.ace.require('ace/ext/modelist')

function Session (file, contents) {
  var editSession = new EditSession(contents, ModeList.getModeForPath(file))
  editSession.setUseWorker(false)
  editSession.setTabSize(config.ace.tabSize)
  editSession.setUseSoftTabs(config.ace.useSoftTabs)
  editSession.setUndoManager(new UndoManager())

  this.file = file
  this.editSession = editSession
}
Session.prototype.markClean = function () {
  this.isDirty = false
  this.editSession.getUndoManager().markClean()
}
Session.prototype.getValue = function () {
  return this.editSession.getValue()
}
Session.prototype.setValue = function (content, markClean) {
  this.editSession.setValue(content)

  if (markClean) {
    this.markClean()
  }
}
Object.defineProperties(Session.prototype, {
  isClean: {
    get: function () {
      return this.editSession.getUndoManager().isClean()
    }
  }
})

module.exports = Session

},{"../config/client":29}],22:[function(require,module,exports){
var w = window
var d = document

function splitter (handle, collapseNextElement, onEndCallback) {
  var last
  var horizontal = handle.classList.contains('horizontal')
  var el1 = handle.previousElementSibling
  var el2 = handle.nextElementSibling
  var collapse = collapseNextElement ? el2 : el1
  var toggle = document.createElement('a')
  toggle.classList.add('toggle')
  handle.appendChild(toggle)

  function onDrag (e) {
    if (horizontal) {
      var hT, hB
      var hDiff = e.clientY - last

      hT = d.defaultView.getComputedStyle(el1, '').getPropertyValue('height')
      hB = d.defaultView.getComputedStyle(el2, '').getPropertyValue('height')
      hT = parseInt(hT, 10) + hDiff
      hB = parseInt(hB, 10) - hDiff
      el1.style.height = hT + 'px'
      el2.style.height = hB + 'px'
      last = e.clientY
    } else {
      var wL, wR
      var wDiff = e.clientX - last

      wL = d.defaultView.getComputedStyle(el1, '').getPropertyValue('width')
      wR = d.defaultView.getComputedStyle(el2, '').getPropertyValue('width')
      wL = parseInt(wL, 10) + wDiff
      wR = parseInt(wR, 10) - wDiff
      el1.style.width = wL + 'px'
      el2.style.width = wR + 'px'
      last = e.clientX
    }
  }

  function onEndDrag (e) {
    e.preventDefault()
    w.removeEventListener('mousemove', onDrag)
    w.removeEventListener('mouseup', onEndDrag)
    if (onEndCallback) {
      onEndCallback()
    }
    // noide.editor.resize()
    // var processes = require('./processes')
    // processes.editor.resize()
  }

  handle.addEventListener('mousedown', function (e) {
    e.preventDefault()

    if (e.target === toggle) {
      collapse.style.display = collapse.style.display === 'none' ? 'block' : 'none'
    } else if (collapse.style.display !== 'none') {
      last = horizontal ? e.clientY : e.clientX

      w.addEventListener('mousemove', onDrag)
      w.addEventListener('mouseup', onEndDrag)
    }
  })
  // handle.addEventListener('click', function (e) {
  //   e.preventDefault()
  //   e.stop
  //
  //   last = horizontal ? e.clientY : e.clientX
  //
  //   w.addEventListener('mousemove', onDrag)
  //   w.addEventListener('mouseup', onEndDrag)
  // })
}

module.exports = splitter

},{}],23:[function(require,module,exports){
var util = require('./util')
var noide = require('./noide')
var client = require('./client')

function linter () {
  function lint () {
    var file = noide.current
    if (file && file.ext === '.js') {
      var session = noide.getSession(file)
      if (session) {
        var editSession = session.editSession
        client.request({
          path: '/standard',
          payload: {
            value: editSession.getValue()
          },
          method: 'POST'
        }, function (err, payload) {
          if (err) {
            return util.handleError(err)
          }
          editSession.setAnnotations(payload)
          setTimeout(lint, 1500)
        })
      }
    } else {
      setTimeout(lint, 1500)
    }
  }
  lint()
}

module.exports = linter

},{"./client":1,"./noide":11,"./util":26}],24:[function(require,module,exports){
var patch = require('../patch')
var view = require('./view.html')
var fileMenu = require('../file-menu')
var noide = require('../noide')

function makeTree (files) {
  function treeify (list, idAttr, parentAttr, childrenAttr) {
    var treeList = []
    var lookup = {}
    var i, obj

    for (i = 0; i < list.length; i++) {
      obj = list[i]
      lookup[obj[idAttr]] = obj
      obj[childrenAttr] = []
    }

    for (i = 0; i < list.length; i++) {
      obj = list[i]
      var parent = lookup[obj[parentAttr]]
      if (parent) {
        obj.parent = parent
        lookup[obj[parentAttr]][childrenAttr].push(obj)
      } else {
        treeList.push(obj)
      }
    }

    return treeList
  }
  return treeify(files, 'path', 'dir', 'children')
}

function Tree (el) {
  function onClick (file) {
    if (file.isDirectory) {
      file.expanded = !file.expanded
      render()
    }
    return false
  }

  function showMenu (e, file) {
    e.stopPropagation()
    fileMenu.show((e.pageX - 2) + 'px', (e.pageY - 2) + 'px', file)
  }

  function render () {
    console.log('Render tree')
    patch(el, view, makeTree(noide.files)[0].children, true, noide.current, showMenu, onClick)
  }

  noide.onAddFile(render)
  noide.onRemoveFile(render)
  noide.onChangeCurrent(render)
  render()
}

var treeEl = document.getElementById('tree')

var treeView = new Tree(treeEl)

module.exports = treeView

},{"../file-menu":5,"../noide":11,"../patch":13,"./view.html":25}],25:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementVoid = IncrementalDOM.elementVoid
var elementClose = IncrementalDOM.elementClose
var skip = IncrementalDOM.skip
var currentElement = IncrementalDOM.currentElement
var text = IncrementalDOM.text

module.exports = (function () {
var hoisted1 = ["class", "name icon icon-file-text"]
var hoisted2 = ["class", "file-name"]
var hoisted3 = ["class", "expanded"]
var hoisted4 = ["class", "collapsed"]
var hoisted5 = ["class", "name icon icon-file-directory"]
var hoisted6 = ["class", "dir-name"]
var hoisted7 = ["class", "triangle-left"]

return function tree (data, isRoot, current, showMenu, onClick) {
  elementOpen("ul", null, null, "class", isRoot ? 'tree noselect' : 'noselect')
    ;(Array.isArray(data) ? data : Object.keys(data)).forEach(function(fso, $index) {
      elementOpen("li", fso.path, null, "oncontextmenu", function ($event) {
        $event.preventDefault();
        var $element = this;
      showMenu($event, fso)}, "title", fso.relativePath, "class", fso.isDirectory ? 'dir' : 'file' + (fso === current ? ' selected' : ''))
        if (fso.isFile) {
          elementOpen("a", null, null, "href", "/file?path=" + (fso.relativePath) + "")
            elementOpen("span", null, hoisted1, "data-name", fso.name, "data-path", fso.relativePath)
            elementClose("span")
            elementOpen("span", null, hoisted2)
              text("" + (fso.name) + "")
            elementClose("span")
          elementClose("a")
        }
        if (fso.isDirectory) {
          elementOpen("a", null, null, "onclick", function ($event) {
            $event.preventDefault();
            var $element = this;
          onClick(fso)})
            if (fso.expanded) {
              elementOpen("small", null, hoisted3)
                text("▼")
              elementClose("small")
            }
            if (!fso.expanded) {
              elementOpen("small", null, hoisted4)
                text("▶")
              elementClose("small")
            }
            elementOpen("span", null, hoisted5, "data-name", fso.name, "data-path", fso.relativePath)
            elementClose("span")
            elementOpen("span", null, hoisted6)
              text("" + (fso.name) + "")
            elementClose("span")
          elementClose("a")
        }
        if (fso.isFile && fso === current) {
          elementOpen("span", null, hoisted7)
          elementClose("span")
        }
        if (fso.isDirectory && fso.expanded) {
          // sort
                    fso.children.sort(function(a, b) {
                      if (a.isDirectory) {
                        if (b.isDirectory) {
                          return a.name.toLowerCase()
          < b.name.toLowerCase() ? -1 : 1
                        } else {
                          return -1
                        }
                      } else {
                        if (b.isDirectory) {
                          return 1
                        } else {
                          return a.name.toLowerCase()
          < b.name.toLowerCase() ? -1 : 1
                        }
                      }
                    })
                    // recurse
                    tree(fso.children, false, current, showMenu, onClick)
        }
      elementClose("li")
    }, data)
  elementClose("ul")
}
})();

},{"incremental-dom":31}],26:[function(require,module,exports){
function handleError (err) {
  console.error(err)
}

module.exports = {
  handleError: handleError
}

},{}],27:[function(require,module,exports){
var fs = require('./fs')
var client = require('./client')
var util = require('./util')
var noide = require('./noide')

function watch () {
  function handleError (err) {
    if (err) {
      return util.handleError(err)
    }
  }

  // Subscribe to watched file changes
  // that happen on the file system
  // Reload the session if the changes
  // do not match the state of the file
  client.subscribe('/fs/change', function (payload) {
    noide.sessions.forEach(function (session) {
      var file = session.file
      if (payload.path === file.path) {
        if (payload.stat.mtime !== file.stat.mtime) {
          fs.readFile(file.path, function (err, payload) {
            if (err) {
              return util.handleError(err)
            }
            file.stat = payload.stat
            session.setValue(payload.contents, true)
          })
        }
      }
    })
  }, handleError)

  client.subscribe('/fs/add', function (payload) {
    noide.addFile(payload)
  }, handleError)

  client.subscribe('/fs/addDir', function (payload) {
    noide.addFile(payload)
  }, handleError)

  client.subscribe('/fs/unlink', function (payload) {
    var file = noide.getFile(payload.relativePath)
    if (file) {
      noide.removeFile(file)
    }
  }, handleError)

  client.subscribe('/fs/unlinkDir', function (payload) {
    var file = noide.getFile(payload.relativePath)
    if (file) {
      noide.removeFile(file)
    }
  }, handleError)
}

module.exports = watch

},{"./client":1,"./fs":7,"./noide":11,"./util":26}],28:[function(require,module,exports){
(function (process){
module.exports = require('minimist')(process.argv.slice(2))

}).call(this,require('_process'))

},{"_process":39,"minimist":33}],29:[function(require,module,exports){
(function (process){
var path = require('path')
var argv = require('./argv')

var config = {
  ace: {
    tabSize: 2,
    fontSize: 12,
    theme: 'monokai',
    useSoftTabs: true
  }
}

if (argv.client) {
  config = require(path.resolve(process.cwd(), argv.client))
}

module.exports = config

}).call(this,require('_process'))

},{"./argv":28,"_process":39,"path":37}],30:[function(require,module,exports){
'use strict';

var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;

var isArray = function isArray(arr) {
	if (typeof Array.isArray === 'function') {
		return Array.isArray(arr);
	}

	return toStr.call(arr) === '[object Array]';
};

var isPlainObject = function isPlainObject(obj) {
	if (!obj || toStr.call(obj) !== '[object Object]') {
		return false;
	}

	var hasOwnConstructor = hasOwn.call(obj, 'constructor');
	var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) {/**/}

	return typeof key === 'undefined' || hasOwn.call(obj, key);
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0],
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	} else if ((typeof target !== 'object' && typeof target !== 'function') || target == null) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target !== copy) {
					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && isArray(src) ? src : [];
						} else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						target[name] = extend(deep, clone, copy);

					// Don't bring in undefined values
					} else if (typeof copy !== 'undefined') {
						target[name] = copy;
					}
				}
			}
		}
	}

	// Return the modified object
	return target;
};


},{}],31:[function(require,module,exports){

/**
 * @license
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * A cached reference to the hasOwnProperty function.
 */
var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * A cached reference to the create function.
 */
var create = Object.create;

/**
 * Used to prevent property collisions between our "map" and its prototype.
 * @param {!Object<string, *>} map The map to check.
 * @param {string} property The property to check.
 * @return {boolean} Whether map has property.
 */
var has = function (map, property) {
  return hasOwnProperty.call(map, property);
};

/**
 * Creates an map object without a prototype.
 * @return {!Object}
 */
var createMap = function () {
  return create(null);
};

/**
 * Keeps track of information needed to perform diffs for a given DOM node.
 * @param {!string} nodeName
 * @param {?string=} key
 * @constructor
 */
function NodeData(nodeName, key) {
  /**
   * The attributes and their values.
   * @const {!Object<string, *>}
   */
  this.attrs = createMap();

  /**
   * An array of attribute name/value pairs, used for quickly diffing the
   * incomming attributes to see if the DOM node's attributes need to be
   * updated.
   * @const {Array<*>}
   */
  this.attrsArr = [];

  /**
   * The incoming attributes for this Node, before they are updated.
   * @const {!Object<string, *>}
   */
  this.newAttrs = createMap();

  /**
   * The key used to identify this node, used to preserve DOM nodes when they
   * move within their parent.
   * @const
   */
  this.key = key;

  /**
   * Keeps track of children within this node by their key.
   * {?Object<string, !Element>}
   */
  this.keyMap = null;

  /**
   * Whether or not the keyMap is currently valid.
   * {boolean}
   */
  this.keyMapValid = true;

  /**
   * The node name for this node.
   * @const {string}
   */
  this.nodeName = nodeName;

  /**
   * @type {?string}
   */
  this.text = null;
}

/**
 * Initializes a NodeData object for a Node.
 *
 * @param {Node} node The node to initialize data for.
 * @param {string} nodeName The node name of node.
 * @param {?string=} key The key that identifies the node.
 * @return {!NodeData} The newly initialized data object
 */
var initData = function (node, nodeName, key) {
  var data = new NodeData(nodeName, key);
  node['__incrementalDOMData'] = data;
  return data;
};

/**
 * Retrieves the NodeData object for a Node, creating it if necessary.
 *
 * @param {Node} node The node to retrieve the data for.
 * @return {!NodeData} The NodeData for this Node.
 */
var getData = function (node) {
  var data = node['__incrementalDOMData'];

  if (!data) {
    var nodeName = node.nodeName.toLowerCase();
    var key = null;

    if (node instanceof Element) {
      key = node.getAttribute('key');
    }

    data = initData(node, nodeName, key);
  }

  return data;
};

/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** @const */
var symbols = {
  default: '__default',

  placeholder: '__placeholder'
};

/**
 * @param {string} name
 * @return {string|undefined} The namespace to use for the attribute.
 */
var getNamespace = function (name) {
  if (name.lastIndexOf('xml:', 0) === 0) {
    return 'http://www.w3.org/XML/1998/namespace';
  }

  if (name.lastIndexOf('xlink:', 0) === 0) {
    return 'http://www.w3.org/1999/xlink';
  }
};

/**
 * Applies an attribute or property to a given Element. If the value is null
 * or undefined, it is removed from the Element. Otherwise, the value is set
 * as an attribute.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {?(boolean|number|string)=} value The attribute's value.
 */
var applyAttr = function (el, name, value) {
  if (value == null) {
    el.removeAttribute(name);
  } else {
    var attrNS = getNamespace(name);
    if (attrNS) {
      el.setAttributeNS(attrNS, name, value);
    } else {
      el.setAttribute(name, value);
    }
  }
};

/**
 * Applies a property to a given Element.
 * @param {!Element} el
 * @param {string} name The property's name.
 * @param {*} value The property's value.
 */
var applyProp = function (el, name, value) {
  el[name] = value;
};

/**
 * Applies a style to an Element. No vendor prefix expansion is done for
 * property names/values.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {*} style The style to set. Either a string of css or an object
 *     containing property-value pairs.
 */
var applyStyle = function (el, name, style) {
  if (typeof style === 'string') {
    el.style.cssText = style;
  } else {
    el.style.cssText = '';
    var elStyle = el.style;
    var obj = /** @type {!Object<string,string>} */style;

    for (var prop in obj) {
      if (has(obj, prop)) {
        elStyle[prop] = obj[prop];
      }
    }
  }
};

/**
 * Updates a single attribute on an Element.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {*} value The attribute's value. If the value is an object or
 *     function it is set on the Element, otherwise, it is set as an HTML
 *     attribute.
 */
var applyAttributeTyped = function (el, name, value) {
  var type = typeof value;

  if (type === 'object' || type === 'function') {
    applyProp(el, name, value);
  } else {
    applyAttr(el, name, /** @type {?(boolean|number|string)} */value);
  }
};

/**
 * Calls the appropriate attribute mutator for this attribute.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {*} value The attribute's value.
 */
var updateAttribute = function (el, name, value) {
  var data = getData(el);
  var attrs = data.attrs;

  if (attrs[name] === value) {
    return;
  }

  var mutator = attributes[name] || attributes[symbols.default];
  mutator(el, name, value);

  attrs[name] = value;
};

/**
 * A publicly mutable object to provide custom mutators for attributes.
 * @const {!Object<string, function(!Element, string, *)>}
 */
var attributes = createMap();

// Special generic mutator that's called for any attribute that does not
// have a specific mutator.
attributes[symbols.default] = applyAttributeTyped;

attributes[symbols.placeholder] = function () {};

attributes['style'] = applyStyle;

/**
 * Gets the namespace to create an element (of a given tag) in.
 * @param {string} tag The tag to get the namespace for.
 * @param {?Node} parent
 * @return {?string} The namespace to create the tag in.
 */
var getNamespaceForTag = function (tag, parent) {
  if (tag === 'svg') {
    return 'http://www.w3.org/2000/svg';
  }

  if (getData(parent).nodeName === 'foreignObject') {
    return null;
  }

  return parent.namespaceURI;
};

/**
 * Creates an Element.
 * @param {Document} doc The document with which to create the Element.
 * @param {?Node} parent
 * @param {string} tag The tag for the Element.
 * @param {?string=} key A key to identify the Element.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element.
 * @return {!Element}
 */
var createElement = function (doc, parent, tag, key, statics) {
  var namespace = getNamespaceForTag(tag, parent);
  var el = undefined;

  if (namespace) {
    el = doc.createElementNS(namespace, tag);
  } else {
    el = doc.createElement(tag);
  }

  initData(el, tag, key);

  if (statics) {
    for (var i = 0; i < statics.length; i += 2) {
      updateAttribute(el, /** @type {!string}*/statics[i], statics[i + 1]);
    }
  }

  return el;
};

/**
 * Creates a Text Node.
 * @param {Document} doc The document with which to create the Element.
 * @return {!Text}
 */
var createText = function (doc) {
  var node = doc.createTextNode('');
  initData(node, '#text', null);
  return node;
};

/**
 * Creates a mapping that can be used to look up children using a key.
 * @param {?Node} el
 * @return {!Object<string, !Element>} A mapping of keys to the children of the
 *     Element.
 */
var createKeyMap = function (el) {
  var map = createMap();
  var child = el.firstElementChild;

  while (child) {
    var key = getData(child).key;

    if (key) {
      map[key] = child;
    }

    child = child.nextElementSibling;
  }

  return map;
};

/**
 * Retrieves the mapping of key to child node for a given Element, creating it
 * if necessary.
 * @param {?Node} el
 * @return {!Object<string, !Node>} A mapping of keys to child Elements
 */
var getKeyMap = function (el) {
  var data = getData(el);

  if (!data.keyMap) {
    data.keyMap = createKeyMap(el);
  }

  return data.keyMap;
};

/**
 * Retrieves a child from the parent with the given key.
 * @param {?Node} parent
 * @param {?string=} key
 * @return {?Node} The child corresponding to the key.
 */
var getChild = function (parent, key) {
  return key ? getKeyMap(parent)[key] : null;
};

/**
 * Registers an element as being a child. The parent will keep track of the
 * child using the key. The child can be retrieved using the same key using
 * getKeyMap. The provided key should be unique within the parent Element.
 * @param {?Node} parent The parent of child.
 * @param {string} key A key to identify the child with.
 * @param {!Node} child The child to register.
 */
var registerChild = function (parent, key, child) {
  getKeyMap(parent)[key] = child;
};

/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** @const */
var notifications = {
  /**
   * Called after patch has compleated with any Nodes that have been created
   * and added to the DOM.
   * @type {?function(Array<!Node>)}
   */
  nodesCreated: null,

  /**
   * Called after patch has compleated with any Nodes that have been removed
   * from the DOM.
   * Note it's an applications responsibility to handle any childNodes.
   * @type {?function(Array<!Node>)}
   */
  nodesDeleted: null
};

/**
 * Keeps track of the state of a patch.
 * @constructor
 */
function Context() {
  /**
   * @type {(Array<!Node>|undefined)}
   */
  this.created = notifications.nodesCreated && [];

  /**
   * @type {(Array<!Node>|undefined)}
   */
  this.deleted = notifications.nodesDeleted && [];
}

/**
 * @param {!Node} node
 */
Context.prototype.markCreated = function (node) {
  if (this.created) {
    this.created.push(node);
  }
};

/**
 * @param {!Node} node
 */
Context.prototype.markDeleted = function (node) {
  if (this.deleted) {
    this.deleted.push(node);
  }
};

/**
 * Notifies about nodes that were created during the patch opearation.
 */
Context.prototype.notifyChanges = function () {
  if (this.created && this.created.length > 0) {
    notifications.nodesCreated(this.created);
  }

  if (this.deleted && this.deleted.length > 0) {
    notifications.nodesDeleted(this.deleted);
  }
};

/**
* Makes sure that keyed Element matches the tag name provided.
* @param {!string} nodeName The nodeName of the node that is being matched.
* @param {string=} tag The tag name of the Element.
* @param {?string=} key The key of the Element.
*/
var assertKeyedTagMatches = function (nodeName, tag, key) {
  if (nodeName !== tag) {
    throw new Error('Was expecting node with key "' + key + '" to be a ' + tag + ', not a ' + nodeName + '.');
  }
};

/** @type {?Context} */
var context = null;

/** @type {?Node} */
var currentNode = null;

/** @type {?Node} */
var currentParent = null;

/** @type {?Element|?DocumentFragment} */
var root = null;

/** @type {?Document} */
var doc = null;

/**
 * Returns a patcher function that sets up and restores a patch context,
 * running the run function with the provided data.
 * @param {function((!Element|!DocumentFragment),!function(T),T=)} run
 * @return {function((!Element|!DocumentFragment),!function(T),T=)}
 * @template T
 */
var patchFactory = function (run) {
  /**
   * TODO(moz): These annotations won't be necessary once we switch to Closure
   * Compiler's new type inference. Remove these once the switch is done.
   *
   * @param {(!Element|!DocumentFragment)} node
   * @param {!function(T)} fn
   * @param {T=} data
   * @template T
   */
  var f = function (node, fn, data) {
    var prevContext = context;
    var prevRoot = root;
    var prevDoc = doc;
    var prevCurrentNode = currentNode;
    var prevCurrentParent = currentParent;
    var previousInAttributes = false;
    var previousInSkip = false;

    context = new Context();
    root = node;
    doc = node.ownerDocument;
    currentParent = node.parentNode;

    if ('production' !== 'production') {}

    run(node, fn, data);

    if ('production' !== 'production') {}

    context.notifyChanges();

    context = prevContext;
    root = prevRoot;
    doc = prevDoc;
    currentNode = prevCurrentNode;
    currentParent = prevCurrentParent;
  };
  return f;
};

/**
 * Patches the document starting at node with the provided function. This
 * function may be called during an existing patch operation.
 * @param {!Element|!DocumentFragment} node The Element or Document
 *     to patch.
 * @param {!function(T)} fn A function containing elementOpen/elementClose/etc.
 *     calls that describe the DOM.
 * @param {T=} data An argument passed to fn to represent DOM state.
 * @template T
 */
var patchInner = patchFactory(function (node, fn, data) {
  currentNode = node;

  enterNode();
  fn(data);
  exitNode();

  if ('production' !== 'production') {}
});

/**
 * Patches an Element with the the provided function. Exactly one top level
 * element call should be made corresponding to `node`.
 * @param {!Element} node The Element where the patch should start.
 * @param {!function(T)} fn A function containing elementOpen/elementClose/etc.
 *     calls that describe the DOM. This should have at most one top level
 *     element call.
 * @param {T=} data An argument passed to fn to represent DOM state.
 * @template T
 */
var patchOuter = patchFactory(function (node, fn, data) {
  currentNode = /** @type {!Element} */{ nextSibling: node };

  fn(data);

  if ('production' !== 'production') {}
});

/**
 * Checks whether or not the current node matches the specified nodeName and
 * key.
 *
 * @param {?string} nodeName The nodeName for this node.
 * @param {?string=} key An optional key that identifies a node.
 * @return {boolean} True if the node matches, false otherwise.
 */
var matches = function (nodeName, key) {
  var data = getData(currentNode);

  // Key check is done using double equals as we want to treat a null key the
  // same as undefined. This should be okay as the only values allowed are
  // strings, null and undefined so the == semantics are not too weird.
  return nodeName === data.nodeName && key == data.key;
};

/**
 * Aligns the virtual Element definition with the actual DOM, moving the
 * corresponding DOM node to the correct location or creating it if necessary.
 * @param {string} nodeName For an Element, this should be a valid tag string.
 *     For a Text, this should be #text.
 * @param {?string=} key The key used to identify this element.
 * @param {?Array<*>=} statics For an Element, this should be an array of
 *     name-value pairs.
 */
var alignWithDOM = function (nodeName, key, statics) {
  if (currentNode && matches(nodeName, key)) {
    return;
  }

  var node = undefined;

  // Check to see if the node has moved within the parent.
  if (key) {
    node = getChild(currentParent, key);
    if (node && 'production' !== 'production') {
      assertKeyedTagMatches(getData(node).nodeName, nodeName, key);
    }
  }

  // Create the node if it doesn't exist.
  if (!node) {
    if (nodeName === '#text') {
      node = createText(doc);
    } else {
      node = createElement(doc, currentParent, nodeName, key, statics);
    }

    if (key) {
      registerChild(currentParent, key, node);
    }

    context.markCreated(node);
  }

  // If the node has a key, remove it from the DOM to prevent a large number
  // of re-orders in the case that it moved far or was completely removed.
  // Since we hold on to a reference through the keyMap, we can always add it
  // back.
  if (currentNode && getData(currentNode).key) {
    currentParent.replaceChild(node, currentNode);
    getData(currentParent).keyMapValid = false;
  } else {
    currentParent.insertBefore(node, currentNode);
  }

  currentNode = node;
};

/**
 * Clears out any unvisited Nodes, as the corresponding virtual element
 * functions were never called for them.
 */
var clearUnvisitedDOM = function () {
  var node = currentParent;
  var data = getData(node);
  var keyMap = data.keyMap;
  var keyMapValid = data.keyMapValid;
  var child = node.lastChild;
  var key = undefined;

  if (child === currentNode && keyMapValid) {
    return;
  }

  if (data.attrs[symbols.placeholder] && node !== root) {
    if ('production' !== 'production') {}
    return;
  }

  while (child !== currentNode) {
    node.removeChild(child);
    context.markDeleted( /** @type {!Node}*/child);

    key = getData(child).key;
    if (key) {
      delete keyMap[key];
    }
    child = node.lastChild;
  }

  // Clean the keyMap, removing any unusued keys.
  if (!keyMapValid) {
    for (key in keyMap) {
      child = keyMap[key];
      if (child.parentNode !== node) {
        context.markDeleted(child);
        delete keyMap[key];
      }
    }

    data.keyMapValid = true;
  }
};

/**
 * Changes to the first child of the current node.
 */
var enterNode = function () {
  currentParent = currentNode;
  currentNode = null;
};

/**
 * Changes to the next sibling of the current node.
 */
var nextNode = function () {
  if (currentNode) {
    currentNode = currentNode.nextSibling;
  } else {
    currentNode = currentParent.firstChild;
  }
};

/**
 * Changes to the parent of the current node, removing any unvisited children.
 */
var exitNode = function () {
  clearUnvisitedDOM();

  currentNode = currentParent;
  currentParent = currentParent.parentNode;
};

/**
 * Makes sure that the current node is an Element with a matching tagName and
 * key.
 *
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 * @return {!Element} The corresponding Element.
 */
var coreElementOpen = function (tag, key, statics) {
  nextNode();
  alignWithDOM(tag, key, statics);
  enterNode();
  return (/** @type {!Element} */currentParent
  );
};

/**
 * Closes the currently open Element, removing any unvisited children if
 * necessary.
 *
 * @return {!Element} The corresponding Element.
 */
var coreElementClose = function () {
  if ('production' !== 'production') {}

  exitNode();
  return (/** @type {!Element} */currentNode
  );
};

/**
 * Makes sure the current node is a Text node and creates a Text node if it is
 * not.
 *
 * @return {!Text} The corresponding Text Node.
 */
var coreText = function () {
  nextNode();
  alignWithDOM('#text', null, null);
  return (/** @type {!Text} */currentNode
  );
};

/**
 * Gets the current Element being patched.
 * @return {!Element}
 */
var currentElement = function () {
  if ('production' !== 'production') {}
  return (/** @type {!Element} */currentParent
  );
};

/**
 * Skips the children in a subtree, allowing an Element to be closed without
 * clearing out the children.
 */
var skip = function () {
  if ('production' !== 'production') {}
  currentNode = currentParent.lastChild;
};

/**
 * The offset in the virtual element declaration where the attributes are
 * specified.
 * @const
 */
var ATTRIBUTES_OFFSET = 3;

/**
 * Builds an array of arguments for use with elementOpenStart, attr and
 * elementOpenEnd.
 * @const {Array<*>}
 */
var argsBuilder = [];

/**
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 * @param {...*} const_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {!Element} The corresponding Element.
 */
var elementOpen = function (tag, key, statics, const_args) {
  if ('production' !== 'production') {}

  var node = coreElementOpen(tag, key, statics);
  var data = getData(node);

  /*
   * Checks to see if one or more attributes have changed for a given Element.
   * When no attributes have changed, this is much faster than checking each
   * individual argument. When attributes have changed, the overhead of this is
   * minimal.
   */
  var attrsArr = data.attrsArr;
  var newAttrs = data.newAttrs;
  var attrsChanged = false;
  var i = ATTRIBUTES_OFFSET;
  var j = 0;

  for (; i < arguments.length; i += 1, j += 1) {
    if (attrsArr[j] !== arguments[i]) {
      attrsChanged = true;
      break;
    }
  }

  for (; i < arguments.length; i += 1, j += 1) {
    attrsArr[j] = arguments[i];
  }

  if (j < attrsArr.length) {
    attrsChanged = true;
    attrsArr.length = j;
  }

  /*
   * Actually perform the attribute update.
   */
  if (attrsChanged) {
    for (i = ATTRIBUTES_OFFSET; i < arguments.length; i += 2) {
      newAttrs[arguments[i]] = arguments[i + 1];
    }

    for (var _attr in newAttrs) {
      updateAttribute(node, _attr, newAttrs[_attr]);
      newAttrs[_attr] = undefined;
    }
  }

  return node;
};

/**
 * Declares a virtual Element at the current location in the document. This
 * corresponds to an opening tag and a elementClose tag is required. This is
 * like elementOpen, but the attributes are defined using the attr function
 * rather than being passed as arguments. Must be folllowed by 0 or more calls
 * to attr, then a call to elementOpenEnd.
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 */
var elementOpenStart = function (tag, key, statics) {
  if ('production' !== 'production') {}

  argsBuilder[0] = tag;
  argsBuilder[1] = key;
  argsBuilder[2] = statics;
};

/***
 * Defines a virtual attribute at this point of the DOM. This is only valid
 * when called between elementOpenStart and elementOpenEnd.
 *
 * @param {string} name
 * @param {*} value
 */
var attr = function (name, value) {
  if ('production' !== 'production') {}

  argsBuilder.push(name, value);
};

/**
 * Closes an open tag started with elementOpenStart.
 * @return {!Element} The corresponding Element.
 */
var elementOpenEnd = function () {
  if ('production' !== 'production') {}

  var node = elementOpen.apply(null, argsBuilder);
  argsBuilder.length = 0;
  return node;
};

/**
 * Closes an open virtual Element.
 *
 * @param {string} tag The element's tag.
 * @return {!Element} The corresponding Element.
 */
var elementClose = function (tag) {
  if ('production' !== 'production') {}

  var node = coreElementClose();

  if ('production' !== 'production') {}

  return node;
};

/**
 * Declares a virtual Element at the current location in the document that has
 * no children.
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 * @param {...*} const_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {!Element} The corresponding Element.
 */
var elementVoid = function (tag, key, statics, const_args) {
  elementOpen.apply(null, arguments);
  return elementClose(tag);
};

/**
 * Declares a virtual Element at the current location in the document that is a
 * placeholder element. Children of this Element can be manually managed and
 * will not be cleared by the library.
 *
 * A key must be specified to make sure that this node is correctly preserved
 * across all conditionals.
 *
 * @param {string} tag The element's tag.
 * @param {string} key The key used to identify this element.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 * @param {...*} const_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {!Element} The corresponding Element.
 */
var elementPlaceholder = function (tag, key, statics, const_args) {
  if ('production' !== 'production') {}

  elementOpen.apply(null, arguments);
  skip();
  return elementClose(tag);
};

/**
 * Declares a virtual Text at this point in the document.
 *
 * @param {string|number|boolean} value The value of the Text.
 * @param {...(function((string|number|boolean)):string)} const_args
 *     Functions to format the value which are called only when the value has
 *     changed.
 * @return {!Text} The corresponding text node.
 */
var text = function (value, const_args) {
  if ('production' !== 'production') {}

  var node = coreText();
  var data = getData(node);

  if (data.text !== value) {
    data.text = /** @type {string} */value;

    var formatted = value;
    for (var i = 1; i < arguments.length; i += 1) {
      /*
       * Call the formatter function directly to prevent leaking arguments.
       * https://github.com/google/incremental-dom/pull/204#issuecomment-178223574
       */
      var fn = arguments[i];
      formatted = fn(formatted);
    }

    node.data = formatted;
  }

  return node;
};

exports.patch = patchInner;
exports.patchInner = patchInner;
exports.patchOuter = patchOuter;
exports.currentElement = currentElement;
exports.skip = skip;
exports.elementVoid = elementVoid;
exports.elementOpenStart = elementOpenStart;
exports.elementOpenEnd = elementOpenEnd;
exports.elementOpen = elementOpen;
exports.elementClose = elementClose;
exports.elementPlaceholder = elementPlaceholder;
exports.text = text;
exports.attr = attr;
exports.symbols = symbols;
exports.attributes = attributes;
exports.applyAttr = applyAttr;
exports.applyProp = applyProp;
exports.notifications = notifications;


},{}],32:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],33:[function(require,module,exports){
module.exports = function (args, opts) {
    if (!opts) opts = {};
    
    var flags = { bools : {}, strings : {}, unknownFn: null };

    if (typeof opts['unknown'] === 'function') {
        flags.unknownFn = opts['unknown'];
    }

    if (typeof opts['boolean'] === 'boolean' && opts['boolean']) {
      flags.allBools = true;
    } else {
      [].concat(opts['boolean']).filter(Boolean).forEach(function (key) {
          flags.bools[key] = true;
      });
    }
    
    var aliases = {};
    Object.keys(opts.alias || {}).forEach(function (key) {
        aliases[key] = [].concat(opts.alias[key]);
        aliases[key].forEach(function (x) {
            aliases[x] = [key].concat(aliases[key].filter(function (y) {
                return x !== y;
            }));
        });
    });

    [].concat(opts.string).filter(Boolean).forEach(function (key) {
        flags.strings[key] = true;
        if (aliases[key]) {
            flags.strings[aliases[key]] = true;
        }
     });

    var defaults = opts['default'] || {};
    
    var argv = { _ : [] };
    Object.keys(flags.bools).forEach(function (key) {
        setArg(key, defaults[key] === undefined ? false : defaults[key]);
    });
    
    var notFlags = [];

    if (args.indexOf('--') !== -1) {
        notFlags = args.slice(args.indexOf('--')+1);
        args = args.slice(0, args.indexOf('--'));
    }

    function argDefined(key, arg) {
        return (flags.allBools && /^--[^=]+$/.test(arg)) ||
            flags.strings[key] || flags.bools[key] || aliases[key];
    }

    function setArg (key, val, arg) {
        if (arg && flags.unknownFn && !argDefined(key, arg)) {
            if (flags.unknownFn(arg) === false) return;
        }

        var value = !flags.strings[key] && isNumber(val)
            ? Number(val) : val
        ;
        setKey(argv, key.split('.'), value);
        
        (aliases[key] || []).forEach(function (x) {
            setKey(argv, x.split('.'), value);
        });
    }

    function setKey (obj, keys, value) {
        var o = obj;
        keys.slice(0,-1).forEach(function (key) {
            if (o[key] === undefined) o[key] = {};
            o = o[key];
        });

        var key = keys[keys.length - 1];
        if (o[key] === undefined || flags.bools[key] || typeof o[key] === 'boolean') {
            o[key] = value;
        }
        else if (Array.isArray(o[key])) {
            o[key].push(value);
        }
        else {
            o[key] = [ o[key], value ];
        }
    }
    
    function aliasIsBoolean(key) {
      return aliases[key].some(function (x) {
          return flags.bools[x];
      });
    }

    for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        
        if (/^--.+=/.test(arg)) {
            // Using [\s\S] instead of . because js doesn't support the
            // 'dotall' regex modifier. See:
            // http://stackoverflow.com/a/1068308/13216
            var m = arg.match(/^--([^=]+)=([\s\S]*)$/);
            var key = m[1];
            var value = m[2];
            if (flags.bools[key]) {
                value = value !== 'false';
            }
            setArg(key, value, arg);
        }
        else if (/^--no-.+/.test(arg)) {
            var key = arg.match(/^--no-(.+)/)[1];
            setArg(key, false, arg);
        }
        else if (/^--.+/.test(arg)) {
            var key = arg.match(/^--(.+)/)[1];
            var next = args[i + 1];
            if (next !== undefined && !/^-/.test(next)
            && !flags.bools[key]
            && !flags.allBools
            && (aliases[key] ? !aliasIsBoolean(key) : true)) {
                setArg(key, next, arg);
                i++;
            }
            else if (/^(true|false)$/.test(next)) {
                setArg(key, next === 'true', arg);
                i++;
            }
            else {
                setArg(key, flags.strings[key] ? '' : true, arg);
            }
        }
        else if (/^-[^-]+/.test(arg)) {
            var letters = arg.slice(1,-1).split('');
            
            var broken = false;
            for (var j = 0; j < letters.length; j++) {
                var next = arg.slice(j+2);
                
                if (next === '-') {
                    setArg(letters[j], next, arg)
                    continue;
                }
                
                if (/[A-Za-z]/.test(letters[j]) && /=/.test(next)) {
                    setArg(letters[j], next.split('=')[1], arg);
                    broken = true;
                    break;
                }
                
                if (/[A-Za-z]/.test(letters[j])
                && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) {
                    setArg(letters[j], next, arg);
                    broken = true;
                    break;
                }
                
                if (letters[j+1] && letters[j+1].match(/\W/)) {
                    setArg(letters[j], arg.slice(j+2), arg);
                    broken = true;
                    break;
                }
                else {
                    setArg(letters[j], flags.strings[letters[j]] ? '' : true, arg);
                }
            }
            
            var key = arg.slice(-1)[0];
            if (!broken && key !== '-') {
                if (args[i+1] && !/^(-|--)[^-]/.test(args[i+1])
                && !flags.bools[key]
                && (aliases[key] ? !aliasIsBoolean(key) : true)) {
                    setArg(key, args[i+1], arg);
                    i++;
                }
                else if (args[i+1] && /true|false/.test(args[i+1])) {
                    setArg(key, args[i+1] === 'true', arg);
                    i++;
                }
                else {
                    setArg(key, flags.strings[key] ? '' : true, arg);
                }
            }
        }
        else {
            if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
                argv._.push(
                    flags.strings['_'] || !isNumber(arg) ? arg : Number(arg)
                );
            }
            if (opts.stopEarly) {
                argv._.push.apply(argv._, args.slice(i + 1));
                break;
            }
        }
    }
    
    Object.keys(defaults).forEach(function (key) {
        if (!hasKey(argv, key.split('.'))) {
            setKey(argv, key.split('.'), defaults[key]);
            
            (aliases[key] || []).forEach(function (x) {
                setKey(argv, x.split('.'), defaults[key]);
            });
        }
    });
    
    if (opts['--']) {
        argv['--'] = new Array();
        notFlags.forEach(function(key) {
            argv['--'].push(key);
        });
    }
    else {
        notFlags.forEach(function(key) {
            argv._.push(key);
        });
    }

    return argv;
};

function hasKey (obj, keys) {
    var o = obj;
    keys.slice(0,-1).forEach(function (key) {
        o = (o[key] || {});
    });

    var key = keys[keys.length - 1];
    return key in o;
}

function isNumber (x) {
    if (typeof x === 'number') return true;
    if (/^0x[0-9a-f]+$/i.test(x)) return true;
    return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
}


},{}],34:[function(require,module,exports){
'use strict';

module.exports = require('./dist/client');

},{"./dist/client":35}],35:[function(require,module,exports){
'use strict';

/*
    (hapi)nes WebSocket Client (https://github.com/hapijs/nes)
    Copyright (c) 2015, Eran Hammer <eran@hammer.io> and other contributors
    BSD Licensed
*/

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function (root, factory) {

    // $lab:coverage:off$

    if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && (typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object') {
        module.exports = factory(); // Export if used as a module
    } else if (typeof define === 'function' && define.amd) {
            define(factory);
        } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
            exports.nes = factory();
        } else {
            root.nes = factory();
        }

    // $lab:coverage:on$
})(undefined, function () {

    // Utilities

    var version = '2';
    var ignore = function ignore() {};

    var parse = function parse(message, next) {

        var obj = null;
        var error = null;

        try {
            obj = JSON.parse(message);
        } catch (err) {
            error = new NesError(err, 'protocol');
        }

        return next(error, obj);
    };

    var stringify = function stringify(message, next) {

        var string = null;
        var error = null;

        try {
            string = JSON.stringify(message);
        } catch (err) {
            error = new NesError(err, 'user');
        }

        return next(error, string);
    };

    var NesError = function NesError(err, type) {

        if (typeof err === 'string') {
            err = new Error(err);
        }

        err.type = type;
        return err;
    };

    // Error codes

    var errorCodes = {
        1000: 'Normal closure',
        1001: 'Going away',
        1002: 'Protocol error',
        1003: 'Unsupported data',
        1004: 'Reserved',
        1005: 'No status received',
        1006: 'Abnormal closure',
        1007: 'Invalid frame payload data',
        1008: 'Policy violation',
        1009: 'Message too big',
        1010: 'Mandatory extension',
        1011: 'Internal server error',
        1015: 'TLS handshake'
    };

    // Client

    var Client = function Client(url, options) {

        options = options || {};

        // Configuration

        this._url = url;
        this._settings = options;
        this._heartbeatTimeout = false; // Server heartbeat configuration

        // State

        this._ws = null;
        this._reconnection = null;
        this._ids = 0; // Id counter
        this._requests = {}; // id -> { callback, timeout }
        this._subscriptions = {}; // path -> [callbacks]
        this._heartbeat = null;

        // Events

        this.onError = function (err) {
            return console.error(err);
        }; // General error callback (only when an error cannot be associated with a request)
        this.onConnect = ignore; // Called whenever a connection is established
        this.onDisconnect = ignore; // Called whenever a connection is lost: function(willReconnect)
        this.onUpdate = ignore;

        // Public properties

        this.id = null; // Assigned when hello response is received
    };

    Client.WebSocket = /* $lab:coverage:off$ */typeof WebSocket === 'undefined' ? null : WebSocket; /* $lab:coverage:on$ */

    Client.prototype.connect = function (options, callback) {

        if (typeof options === 'function') {
            callback = arguments[0];
            options = {};
        }

        if (options.reconnect !== false) {
            // Defaults to true
            this._reconnection = { // Options: reconnect, delay, maxDelay
                wait: 0,
                delay: options.delay || 1000, // 1 second
                maxDelay: options.maxDelay || 5000, // 5 seconds
                retries: options.retries || Infinity, // Unlimited
                settings: {
                    auth: options.auth,
                    timeout: options.timeout
                }
            };
        } else {
            this._reconnection = null;
        }

        this._connect(options, true, callback);
    };

    Client.prototype._connect = function (options, initial, callback) {
        var _this = this;

        var sentCallback = false;
        var timeoutHandler = function timeoutHandler() {

            sentCallback = true;
            _this._ws.close();
            callback(new NesError('Connection timed out', 'timeout'));
            _this._cleanup();
            if (initial) {
                return _this._reconnect();
            }
        };

        var timeout = options.timeout ? setTimeout(timeoutHandler, options.timeout) : null;

        var ws = new Client.WebSocket(this._url, this._settings.ws); // Settings used by node.js only
        this._ws = ws;

        ws.onopen = function () {

            clearTimeout(timeout);

            if (!sentCallback) {
                sentCallback = true;
                return _this._hello(options.auth, function (err) {

                    if (err) {
                        if (err.path) {
                            delete _this._subscriptions[err.path];
                        }

                        _this.disconnect(); // Stop reconnection when the hello message returns error
                        return callback(err);
                    }

                    _this.onConnect();
                    return callback();
                });
            }
        };

        ws.onerror = function (event) {

            var err = new NesError('Socket error', 'ws');

            clearTimeout(timeout);

            if (!sentCallback) {
                sentCallback = true;
                return callback(err);
            }

            return _this.onError(err);
        };

        ws.onclose = function (event) {

            var log = {
                code: event.code,
                explanation: errorCodes[event.code] || 'Unknown',
                reason: event.reason,
                wasClean: event.wasClean
            };

            _this._cleanup();
            _this.onDisconnect(!!(_this._reconnection && _this._reconnection.retries >= 1), log);
            _this._reconnect();
        };

        ws.onmessage = function (message) {

            return _this._onMessage(message);
        };
    };

    Client.prototype.disconnect = function () {

        this._reconnection = null;

        if (!this._ws) {
            return;
        }

        if (this._ws.readyState === Client.WebSocket.OPEN || this._ws.readyState === Client.WebSocket.CONNECTING) {

            this._ws.close();
        }
    };

    Client.prototype._cleanup = function () {

        var ws = this._ws;
        if (!ws) {
            return;
        }

        this._ws = null;
        this.id = null;
        ws.onopen = null;
        ws.onclose = null;
        ws.onerror = ignore;
        ws.onmessage = null;

        clearTimeout(this._heartbeat);

        // Flush pending requests

        var error = new NesError('Request failed - server disconnected', 'disconnect');

        var ids = Object.keys(this._requests);
        for (var i = 0; i < ids.length; ++i) {
            var id = ids[i];
            var request = this._requests[id];
            var callback = request.callback;
            clearTimeout(request.timeout);
            delete this._requests[id];
            callback(error);
        }
    };

    Client.prototype._reconnect = function () {
        var _this2 = this;

        // Reconnect

        if (this._reconnection) {
            if (this._reconnection.retries < 1) {
                this.disconnect(); // Clear _reconnection state
                return;
            }

            --this._reconnection.retries;
            this._reconnection.wait = this._reconnection.wait + this._reconnection.delay;

            var timeout = Math.min(this._reconnection.wait, this._reconnection.maxDelay);
            setTimeout(function () {

                if (!_this2._reconnection) {
                    return;
                }

                _this2._connect(_this2._reconnection.settings, false, function (err) {

                    if (err) {
                        _this2.onError(err);
                        _this2._cleanup();
                        return _this2._reconnect();
                    }
                });
            }, timeout);
        }
    };

    Client.prototype.request = function (options, callback) {

        if (typeof options === 'string') {
            options = {
                method: 'GET',
                path: options
            };
        }

        var request = {
            type: 'request',
            method: options.method || 'GET',
            path: options.path,
            headers: options.headers,
            payload: options.payload
        };

        return this._send(request, true, callback);
    };

    Client.prototype.message = function (message, callback) {

        var request = {
            type: 'message',
            message: message
        };

        return this._send(request, true, callback);
    };

    Client.prototype._send = function (request, track, callback) {
        var _this3 = this;

        callback = callback || ignore;

        if (!this._ws || this._ws.readyState !== Client.WebSocket.OPEN) {

            return callback(new NesError('Failed to send message - server disconnected', 'disconnect'));
        }

        request.id = ++this._ids;

        stringify(request, function (err, encoded) {

            if (err) {
                return callback(err);
            }

            // Ignore errors

            if (!track) {
                try {
                    return _this3._ws.send(encoded);
                } catch (err) {
                    return callback(new NesError(err, 'ws'));
                }
            }

            // Track errors

            var record = {
                callback: callback,
                timeout: null
            };

            if (_this3._settings.timeout) {
                record.timeout = setTimeout(function () {

                    record.callback = null;
                    record.timeout = null;

                    return callback(new NesError('Request timed out', 'timeout'));
                }, _this3._settings.timeout);
            }

            _this3._requests[request.id] = record;

            try {
                _this3._ws.send(encoded);
            } catch (err) {
                clearTimeout(_this3._requests[request.id].timeout);
                delete _this3._requests[request.id];
                return callback(new NesError(err, 'ws'));
            }
        });
    };

    Client.prototype._hello = function (auth, callback) {

        var request = {
            type: 'hello',
            version: version
        };

        if (auth) {
            request.auth = auth;
        }

        var subs = this.subscriptions();
        if (subs.length) {
            request.subs = subs;
        }

        return this._send(request, true, callback);
    };

    Client.prototype.subscriptions = function () {

        return Object.keys(this._subscriptions);
    };

    Client.prototype.subscribe = function (path, handler, callback) {
        var _this4 = this;

        if (!path || path[0] !== '/') {

            return callback(new NesError('Invalid path', 'user'));
        }

        var subs = this._subscriptions[path];
        if (subs) {

            // Already subscribed

            if (subs.indexOf(handler) === -1) {
                subs.push(handler);
            }

            return callback();
        }

        this._subscriptions[path] = [handler];

        if (!this._ws || this._ws.readyState !== Client.WebSocket.OPEN) {

            // Queued subscription

            return callback();
        }

        var request = {
            type: 'sub',
            path: path
        };

        return this._send(request, true, function (err) {

            if (err) {
                delete _this4._subscriptions[path];
            }

            return callback(err);
        });
    };

    Client.prototype.unsubscribe = function (path, handler) {

        if (!path || path[0] !== '/') {

            return handler(new NesError('Invalid path', 'user'));
        }

        var subs = this._subscriptions[path];
        if (!subs) {
            return;
        }

        var sync = false;
        if (!handler) {
            delete this._subscriptions[path];
            sync = true;
        } else {
            var pos = subs.indexOf(handler);
            if (pos === -1) {
                return;
            }

            subs.splice(pos, 1);
            if (!subs.length) {
                delete this._subscriptions[path];
                sync = true;
            }
        }

        if (!sync || !this._ws || this._ws.readyState !== Client.WebSocket.OPEN) {

            return;
        }

        var request = {
            type: 'unsub',
            path: path
        };

        return this._send(request, false); // Ignoring errors as the subscription handlers are already removed
    };

    Client.prototype._onMessage = function (message) {
        var _this5 = this;

        this._beat();

        parse(message.data, function (err, update) {

            if (err) {
                return _this5.onError(err);
            }

            // Recreate error

            var error = null;
            if (update.statusCode && update.statusCode >= 400 && update.statusCode <= 599) {

                error = new NesError(update.payload.message || update.payload.error, 'server');
                error.statusCode = update.statusCode;
                error.data = update.payload;
                error.headers = update.headers;
                error.path = update.path;
            }

            // Ping

            if (update.type === 'ping') {
                return _this5._send({ type: 'ping' }, false); // Ignore errors
            }

            // Broadcast and update

            if (update.type === 'update') {
                return _this5.onUpdate(update.message);
            }

            // Publish

            if (update.type === 'pub') {
                var handlers = _this5._subscriptions[update.path];
                if (handlers) {
                    for (var i = 0; i < handlers.length; ++i) {
                        handlers[i](update.message);
                    }
                }

                return;
            }

            // Lookup callback (message must include an id from this point)

            var request = _this5._requests[update.id];
            if (!request) {
                return _this5.onError(new NesError('Received response for unknown request', 'protocol'));
            }

            var callback = request.callback;
            clearTimeout(request.timeout);
            delete _this5._requests[update.id];

            if (!callback) {
                return; // Response received after timeout
            }

            // Response

            if (update.type === 'request') {
                return callback(error, update.payload, update.statusCode, update.headers);
            }

            // Custom message

            if (update.type === 'message') {
                return callback(error, update.message);
            }

            // Authentication

            if (update.type === 'hello') {
                _this5.id = update.socket;
                if (update.heartbeat) {
                    _this5._heartbeatTimeout = update.heartbeat.interval + update.heartbeat.timeout;
                    _this5._beat(); // Call again once timeout is set
                }

                return callback(error);
            }

            // Subscriptions

            if (update.type === 'sub') {
                return callback(error);
            }

            return _this5.onError(new NesError('Received unknown response type: ' + update.type, 'protocol'));
        });
    };

    Client.prototype._beat = function () {
        var _this6 = this;

        if (!this._heartbeatTimeout) {
            return;
        }

        clearTimeout(this._heartbeat);

        this._heartbeat = setTimeout(function () {

            _this6.onError(new NesError('Disconnecting due to heartbeat timeout', 'timeout'));
            _this6._ws.close();
        }, this._heartbeatTimeout);
    };

    // Expose interface

    return { Client: Client };
});

},{}],36:[function(require,module,exports){
(function (process){
  /* globals require, module */

  'use strict';

  /**
   * Module dependencies.
   */

  var pathtoRegexp = require('path-to-regexp');

  /**
   * Module exports.
   */

  module.exports = page;

  /**
   * Detect click event
   */
  var clickEvent = ('undefined' !== typeof document) && document.ontouchstart ? 'touchstart' : 'click';

  /**
   * To work properly with the URL
   * history.location generated polyfill in https://github.com/devote/HTML5-History-API
   */

  var location = ('undefined' !== typeof window) && (window.history.location || window.location);

  /**
   * Perform initial dispatch.
   */

  var dispatch = true;


  /**
   * Decode URL components (query string, pathname, hash).
   * Accommodates both regular percent encoding and x-www-form-urlencoded format.
   */
  var decodeURLComponents = true;

  /**
   * Base path.
   */

  var base = '';

  /**
   * Running flag.
   */

  var running;

  /**
   * HashBang option
   */

  var hashbang = false;

  /**
   * Previous context, for capturing
   * page exit events.
   */

  var prevContext;

  /**
   * Register `path` with callback `fn()`,
   * or route `path`, or redirection,
   * or `page.start()`.
   *
   *   page(fn);
   *   page('*', fn);
   *   page('/user/:id', load, user);
   *   page('/user/' + user.id, { some: 'thing' });
   *   page('/user/' + user.id);
   *   page('/from', '/to')
   *   page();
   *
   * @param {String|Function} path
   * @param {Function} fn...
   * @api public
   */

  function page(path, fn) {
    // <callback>
    if ('function' === typeof path) {
      return page('*', path);
    }

    // route <path> to <callback ...>
    if ('function' === typeof fn) {
      var route = new Route(path);
      for (var i = 1; i < arguments.length; ++i) {
        page.callbacks.push(route.middleware(arguments[i]));
      }
      // show <path> with [state]
    } else if ('string' === typeof path) {
      page['string' === typeof fn ? 'redirect' : 'show'](path, fn);
      // start [options]
    } else {
      page.start(path);
    }
  }

  /**
   * Callback functions.
   */

  page.callbacks = [];
  page.exits = [];

  /**
   * Current path being processed
   * @type {String}
   */
  page.current = '';

  /**
   * Number of pages navigated to.
   * @type {number}
   *
   *     page.len == 0;
   *     page('/login');
   *     page.len == 1;
   */

  page.len = 0;

  /**
   * Get or set basepath to `path`.
   *
   * @param {String} path
   * @api public
   */

  page.base = function(path) {
    if (0 === arguments.length) return base;
    base = path;
  };

  /**
   * Bind with the given `options`.
   *
   * Options:
   *
   *    - `click` bind to click events [true]
   *    - `popstate` bind to popstate [true]
   *    - `dispatch` perform initial dispatch [true]
   *
   * @param {Object} options
   * @api public
   */

  page.start = function(options) {
    options = options || {};
    if (running) return;
    running = true;
    if (false === options.dispatch) dispatch = false;
    if (false === options.decodeURLComponents) decodeURLComponents = false;
    if (false !== options.popstate) window.addEventListener('popstate', onpopstate, false);
    if (false !== options.click) {
      document.addEventListener(clickEvent, onclick, false);
    }
    if (true === options.hashbang) hashbang = true;
    if (!dispatch) return;
    var url = (hashbang && ~location.hash.indexOf('#!')) ? location.hash.substr(2) + location.search : location.pathname + location.search + location.hash;
    page.replace(url, null, true, dispatch);
  };

  /**
   * Unbind click and popstate event handlers.
   *
   * @api public
   */

  page.stop = function() {
    if (!running) return;
    page.current = '';
    page.len = 0;
    running = false;
    document.removeEventListener(clickEvent, onclick, false);
    window.removeEventListener('popstate', onpopstate, false);
  };

  /**
   * Show `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @param {Boolean} dispatch
   * @return {Context}
   * @api public
   */

  page.show = function(path, state, dispatch, push) {
    var ctx = new Context(path, state);
    page.current = ctx.path;
    if (false !== dispatch) page.dispatch(ctx);
    if (false !== ctx.handled && false !== push) ctx.pushState();
    return ctx;
  };

  /**
   * Goes back in the history
   * Back should always let the current route push state and then go back.
   *
   * @param {String} path - fallback path to go back if no more history exists, if undefined defaults to page.base
   * @param {Object} [state]
   * @api public
   */

  page.back = function(path, state) {
    if (page.len > 0) {
      // this may need more testing to see if all browsers
      // wait for the next tick to go back in history
      history.back();
      page.len--;
    } else if (path) {
      setTimeout(function() {
        page.show(path, state);
      });
    }else{
      setTimeout(function() {
        page.show(base, state);
      });
    }
  };


  /**
   * Register route to redirect from one path to other
   * or just redirect to another route
   *
   * @param {String} from - if param 'to' is undefined redirects to 'from'
   * @param {String} [to]
   * @api public
   */
  page.redirect = function(from, to) {
    // Define route from a path to another
    if ('string' === typeof from && 'string' === typeof to) {
      page(from, function(e) {
        setTimeout(function() {
          page.replace(to);
        }, 0);
      });
    }

    // Wait for the push state and replace it with another
    if ('string' === typeof from && 'undefined' === typeof to) {
      setTimeout(function() {
        page.replace(from);
      }, 0);
    }
  };

  /**
   * Replace `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @return {Context}
   * @api public
   */


  page.replace = function(path, state, init, dispatch) {
    var ctx = new Context(path, state);
    page.current = ctx.path;
    ctx.init = init;
    ctx.save(); // save before dispatching, which may redirect
    if (false !== dispatch) page.dispatch(ctx);
    return ctx;
  };

  /**
   * Dispatch the given `ctx`.
   *
   * @param {Object} ctx
   * @api private
   */

  page.dispatch = function(ctx) {
    var prev = prevContext,
      i = 0,
      j = 0;

    prevContext = ctx;

    function nextExit() {
      var fn = page.exits[j++];
      if (!fn) return nextEnter();
      fn(prev, nextExit);
    }

    function nextEnter() {
      var fn = page.callbacks[i++];

      if (ctx.path !== page.current) {
        ctx.handled = false;
        return;
      }
      if (!fn) return unhandled(ctx);
      fn(ctx, nextEnter);
    }

    if (prev) {
      nextExit();
    } else {
      nextEnter();
    }
  };

  /**
   * Unhandled `ctx`. When it's not the initial
   * popstate then redirect. If you wish to handle
   * 404s on your own use `page('*', callback)`.
   *
   * @param {Context} ctx
   * @api private
   */

  function unhandled(ctx) {
    if (ctx.handled) return;
    var current;

    if (hashbang) {
      current = base + location.hash.replace('#!', '');
    } else {
      current = location.pathname + location.search;
    }

    if (current === ctx.canonicalPath) return;
    page.stop();
    ctx.handled = false;
    location.href = ctx.canonicalPath;
  }

  /**
   * Register an exit route on `path` with
   * callback `fn()`, which will be called
   * on the previous context when a new
   * page is visited.
   */
  page.exit = function(path, fn) {
    if (typeof path === 'function') {
      return page.exit('*', path);
    }

    var route = new Route(path);
    for (var i = 1; i < arguments.length; ++i) {
      page.exits.push(route.middleware(arguments[i]));
    }
  };

  /**
   * Remove URL encoding from the given `str`.
   * Accommodates whitespace in both x-www-form-urlencoded
   * and regular percent-encoded form.
   *
   * @param {str} URL component to decode
   */
  function decodeURLEncodedURIComponent(val) {
    if (typeof val !== 'string') { return val; }
    return decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, ' ')) : val;
  }

  /**
   * Initialize a new "request" `Context`
   * with the given `path` and optional initial `state`.
   *
   * @param {String} path
   * @param {Object} state
   * @api public
   */

  function Context(path, state) {
    if ('/' === path[0] && 0 !== path.indexOf(base)) path = base + (hashbang ? '#!' : '') + path;
    var i = path.indexOf('?');

    this.canonicalPath = path;
    this.path = path.replace(base, '') || '/';
    if (hashbang) this.path = this.path.replace('#!', '') || '/';

    this.title = document.title;
    this.state = state || {};
    this.state.path = path;
    this.querystring = ~i ? decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
    this.pathname = decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
    this.params = {};

    // fragment
    this.hash = '';
    if (!hashbang) {
      if (!~this.path.indexOf('#')) return;
      var parts = this.path.split('#');
      this.path = parts[0];
      this.hash = decodeURLEncodedURIComponent(parts[1]) || '';
      this.querystring = this.querystring.split('#')[0];
    }
  }

  /**
   * Expose `Context`.
   */

  page.Context = Context;

  /**
   * Push state.
   *
   * @api private
   */

  Context.prototype.pushState = function() {
    page.len++;
    history.pushState(this.state, this.title, hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
  };

  /**
   * Save the context state.
   *
   * @api public
   */

  Context.prototype.save = function() {
    history.replaceState(this.state, this.title, hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
  };

  /**
   * Initialize `Route` with the given HTTP `path`,
   * and an array of `callbacks` and `options`.
   *
   * Options:
   *
   *   - `sensitive`    enable case-sensitive routes
   *   - `strict`       enable strict matching for trailing slashes
   *
   * @param {String} path
   * @param {Object} options.
   * @api private
   */

  function Route(path, options) {
    options = options || {};
    this.path = (path === '*') ? '(.*)' : path;
    this.method = 'GET';
    this.regexp = pathtoRegexp(this.path,
      this.keys = [],
      options.sensitive,
      options.strict);
  }

  /**
   * Expose `Route`.
   */

  page.Route = Route;

  /**
   * Return route middleware with
   * the given callback `fn()`.
   *
   * @param {Function} fn
   * @return {Function}
   * @api public
   */

  Route.prototype.middleware = function(fn) {
    var self = this;
    return function(ctx, next) {
      if (self.match(ctx.path, ctx.params)) return fn(ctx, next);
      next();
    };
  };

  /**
   * Check if this route matches `path`, if so
   * populate `params`.
   *
   * @param {String} path
   * @param {Object} params
   * @return {Boolean}
   * @api private
   */

  Route.prototype.match = function(path, params) {
    var keys = this.keys,
      qsIndex = path.indexOf('?'),
      pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
      m = this.regexp.exec(decodeURIComponent(pathname));

    if (!m) return false;

    for (var i = 1, len = m.length; i < len; ++i) {
      var key = keys[i - 1];
      var val = decodeURLEncodedURIComponent(m[i]);
      if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
        params[key.name] = val;
      }
    }

    return true;
  };


  /**
   * Handle "populate" events.
   */

  var onpopstate = (function () {
    var loaded = false;
    if ('undefined' === typeof window) {
      return;
    }
    if (document.readyState === 'complete') {
      loaded = true;
    } else {
      window.addEventListener('load', function() {
        setTimeout(function() {
          loaded = true;
        }, 0);
      });
    }
    return function onpopstate(e) {
      if (!loaded) return;
      if (e.state) {
        var path = e.state.path;
        page.replace(path, e.state);
      } else {
        page.show(location.pathname + location.hash, undefined, undefined, false);
      }
    };
  })();
  /**
   * Handle "click" events.
   */

  function onclick(e) {

    if (1 !== which(e)) return;

    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (e.defaultPrevented) return;



    // ensure link
    var el = e.target;
    while (el && 'A' !== el.nodeName) el = el.parentNode;
    if (!el || 'A' !== el.nodeName) return;



    // Ignore if tag has
    // 1. "download" attribute
    // 2. rel="external" attribute
    if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

    // ensure non-hash for the same path
    var link = el.getAttribute('href');
    if (!hashbang && el.pathname === location.pathname && (el.hash || '#' === link)) return;



    // Check for mailto: in the href
    if (link && link.indexOf('mailto:') > -1) return;

    // check target
    if (el.target) return;

    // x-origin
    if (!sameOrigin(el.href)) return;



    // rebuild path
    var path = el.pathname + el.search + (el.hash || '');

    // strip leading "/[drive letter]:" on NW.js on Windows
    if (typeof process !== 'undefined' && path.match(/^\/[a-zA-Z]:\//)) {
      path = path.replace(/^\/[a-zA-Z]:\//, '/');
    }

    // same page
    var orig = path;

    if (path.indexOf(base) === 0) {
      path = path.substr(base.length);
    }

    if (hashbang) path = path.replace('#!', '');

    if (base && orig === path) return;

    e.preventDefault();
    page.show(orig);
  }

  /**
   * Event button.
   */

  function which(e) {
    e = e || window.event;
    return null === e.which ? e.button : e.which;
  }

  /**
   * Check if `href` is the same origin.
   */

  function sameOrigin(href) {
    var origin = location.protocol + '//' + location.hostname;
    if (location.port) origin += ':' + location.port;
    return (href && (0 === href.indexOf(origin)));
  }

  page.sameOrigin = sameOrigin;

}).call(this,require('_process'))

},{"_process":39,"path-to-regexp":38}],37:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))

},{"_process":39}],38:[function(require,module,exports){
var isarray = require('isarray')

/**
 * Expose `pathToRegexp`.
 */
module.exports = pathToRegexp
module.exports.parse = parse
module.exports.compile = compile
module.exports.tokensToFunction = tokensToFunction
module.exports.tokensToRegExp = tokensToRegExp

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match escaped characters that would otherwise appear in future matches.
  // This allows the user to escape special characters that won't transform.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
  // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
  // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
  '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^()])+)\\))?|\\(((?:\\\\.|[^()])+)\\))([+*?])?|(\\*))'
].join('|'), 'g')

/**
 * Parse a string for the raw tokens.
 *
 * @param  {String} str
 * @return {Array}
 */
function parse (str) {
  var tokens = []
  var key = 0
  var index = 0
  var path = ''
  var res

  while ((res = PATH_REGEXP.exec(str)) != null) {
    var m = res[0]
    var escaped = res[1]
    var offset = res.index
    path += str.slice(index, offset)
    index = offset + m.length

    // Ignore already escaped sequences.
    if (escaped) {
      path += escaped[1]
      continue
    }

    // Push the current path onto the tokens.
    if (path) {
      tokens.push(path)
      path = ''
    }

    var prefix = res[2]
    var name = res[3]
    var capture = res[4]
    var group = res[5]
    var suffix = res[6]
    var asterisk = res[7]

    var repeat = suffix === '+' || suffix === '*'
    var optional = suffix === '?' || suffix === '*'
    var delimiter = prefix || '/'
    var pattern = capture || group || (asterisk ? '.*' : '[^' + delimiter + ']+?')

    tokens.push({
      name: name || key++,
      prefix: prefix || '',
      delimiter: delimiter,
      optional: optional,
      repeat: repeat,
      pattern: escapeGroup(pattern)
    })
  }

  // Match any characters still remaining.
  if (index < str.length) {
    path += str.substr(index)
  }

  // If the path exists, push it onto the end.
  if (path) {
    tokens.push(path)
  }

  return tokens
}

/**
 * Compile a string to a template function for the path.
 *
 * @param  {String}   str
 * @return {Function}
 */
function compile (str) {
  return tokensToFunction(parse(str))
}

/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction (tokens) {
  // Compile all the tokens into regexps.
  var matches = new Array(tokens.length)

  // Compile all the patterns before compilation.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] === 'object') {
      matches[i] = new RegExp('^' + tokens[i].pattern + '$')
    }
  }

  return function (obj) {
    var path = ''
    var data = obj || {}

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i]

      if (typeof token === 'string') {
        path += token

        continue
      }

      var value = data[token.name]
      var segment

      if (value == null) {
        if (token.optional) {
          continue
        } else {
          throw new TypeError('Expected "' + token.name + '" to be defined')
        }
      }

      if (isarray(value)) {
        if (!token.repeat) {
          throw new TypeError('Expected "' + token.name + '" to not repeat, but received "' + value + '"')
        }

        if (value.length === 0) {
          if (token.optional) {
            continue
          } else {
            throw new TypeError('Expected "' + token.name + '" to not be empty')
          }
        }

        for (var j = 0; j < value.length; j++) {
          segment = encodeURIComponent(value[j])

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
          }

          path += (j === 0 ? token.prefix : token.delimiter) + segment
        }

        continue
      }

      segment = encodeURIComponent(value)

      if (!matches[i].test(segment)) {
        throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
      }

      path += token.prefix + segment
    }

    return path
  }
}

/**
 * Escape a regular expression string.
 *
 * @param  {String} str
 * @return {String}
 */
function escapeString (str) {
  return str.replace(/([.+*?=^!:${}()[\]|\/])/g, '\\$1')
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {String} group
 * @return {String}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$\/()])/g, '\\$1')
}

/**
 * Attach the keys as a property of the regexp.
 *
 * @param  {RegExp} re
 * @param  {Array}  keys
 * @return {RegExp}
 */
function attachKeys (re, keys) {
  re.keys = keys
  return re
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {String}
 */
function flags (options) {
  return options.sensitive ? '' : 'i'
}

/**
 * Pull out keys from a regexp.
 *
 * @param  {RegExp} path
 * @param  {Array}  keys
 * @return {RegExp}
 */
function regexpToRegexp (path, keys) {
  // Use a negative lookahead to match only capturing groups.
  var groups = path.source.match(/\((?!\?)/g)

  if (groups) {
    for (var i = 0; i < groups.length; i++) {
      keys.push({
        name: i,
        prefix: null,
        delimiter: null,
        optional: false,
        repeat: false,
        pattern: null
      })
    }
  }

  return attachKeys(path, keys)
}

/**
 * Transform an array into a regexp.
 *
 * @param  {Array}  path
 * @param  {Array}  keys
 * @param  {Object} options
 * @return {RegExp}
 */
function arrayToRegexp (path, keys, options) {
  var parts = []

  for (var i = 0; i < path.length; i++) {
    parts.push(pathToRegexp(path[i], keys, options).source)
  }

  var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options))

  return attachKeys(regexp, keys)
}

/**
 * Create a path regexp from string input.
 *
 * @param  {String} path
 * @param  {Array}  keys
 * @param  {Object} options
 * @return {RegExp}
 */
function stringToRegexp (path, keys, options) {
  var tokens = parse(path)
  var re = tokensToRegExp(tokens, options)

  // Attach keys back to the regexp.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] !== 'string') {
      keys.push(tokens[i])
    }
  }

  return attachKeys(re, keys)
}

/**
 * Expose a function for taking tokens and returning a RegExp.
 *
 * @param  {Array}  tokens
 * @param  {Array}  keys
 * @param  {Object} options
 * @return {RegExp}
 */
function tokensToRegExp (tokens, options) {
  options = options || {}

  var strict = options.strict
  var end = options.end !== false
  var route = ''
  var lastToken = tokens[tokens.length - 1]
  var endsWithSlash = typeof lastToken === 'string' && /\/$/.test(lastToken)

  // Iterate over the tokens and create our regexp string.
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i]

    if (typeof token === 'string') {
      route += escapeString(token)
    } else {
      var prefix = escapeString(token.prefix)
      var capture = token.pattern

      if (token.repeat) {
        capture += '(?:' + prefix + capture + ')*'
      }

      if (token.optional) {
        if (prefix) {
          capture = '(?:' + prefix + '(' + capture + '))?'
        } else {
          capture = '(' + capture + ')?'
        }
      } else {
        capture = prefix + '(' + capture + ')'
      }

      route += capture
    }
  }

  // In non-strict mode we allow a slash at the end of match. If the path to
  // match already ends with a slash, we remove it for consistency. The slash
  // is valid at the end of a path match, not in the middle. This is important
  // in non-ending mode, where "/test/" shouldn't match "/test//route".
  if (!strict) {
    route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?'
  }

  if (end) {
    route += '$'
  } else {
    // In non-ending mode, we need the capturing groups to match as much as
    // possible by using a positive lookahead to the end or next path segment.
    route += strict && endsWithSlash ? '' : '(?=\\/|$)'
  }

  return new RegExp('^' + route, flags(options))
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(String|RegExp|Array)} path
 * @param  {Array}                 [keys]
 * @param  {Object}                [options]
 * @return {RegExp}
 */
function pathToRegexp (path, keys, options) {
  keys = keys || []

  if (!isarray(keys)) {
    options = keys
    keys = []
  } else if (!options) {
    options = {}
  }

  if (path instanceof RegExp) {
    return regexpToRegexp(path, keys, options)
  }

  if (isarray(path)) {
    return arrayToRegexp(path, keys, options)
  }

  return stringToRegexp(path, keys, options)
}

},{"isarray":32}],39:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],40:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],41:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],42:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":40,"./encode":41}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvY2xpZW50LmpzIiwiY2xpZW50L2VkaXRvci9pbmRleC5qcyIsImNsaWVudC9maWxlLWVkaXRvci9pbmRleC5qcyIsImNsaWVudC9maWxlLWVkaXRvci92aWV3Lmh0bWwiLCJjbGllbnQvZmlsZS1tZW51L2luZGV4LmpzIiwiY2xpZW50L2ZpbGUtbWVudS92aWV3Lmh0bWwiLCJjbGllbnQvZnMuanMiLCJjbGllbnQvZnNvLmpzIiwiY2xpZW50L2luZGV4LmpzIiwiY2xpZW50L2lvLmpzIiwiY2xpZW50L25vaWRlLmpzIiwiY2xpZW50L29ic2VydmFibGUuanMiLCJjbGllbnQvcGF0Y2guanMiLCJjbGllbnQvcHJvY2Vzc2VzL2luZGV4Lmh0bWwiLCJjbGllbnQvcHJvY2Vzc2VzL2luZGV4LmpzIiwiY2xpZW50L3Byb2Nlc3Nlcy9tb2RlbC5qcyIsImNsaWVudC9wcm9jZXNzZXMvcHJvY2Vzcy5qcyIsImNsaWVudC9wcm9jZXNzZXMvdGFzay5qcyIsImNsaWVudC9yZWNlbnQvaW5kZXguaHRtbCIsImNsaWVudC9yZWNlbnQvaW5kZXguanMiLCJjbGllbnQvc2Vzc2lvbi5qcyIsImNsaWVudC9zcGxpdHRlci5qcyIsImNsaWVudC9zdGFuZGFyZC5qcyIsImNsaWVudC90cmVlL2luZGV4LmpzIiwiY2xpZW50L3RyZWUvdmlldy5odG1sIiwiY2xpZW50L3V0aWwuanMiLCJjbGllbnQvd2F0Y2guanMiLCJjb25maWcvYXJndi5qcyIsImNvbmZpZy9jbGllbnQuanMiLCJub2RlX21vZHVsZXMvZXh0ZW5kL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2luY3JlbWVudGFsLWRvbS9kaXN0L2luY3JlbWVudGFsLWRvbS1janMuanMiLCJub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9taW5pbWlzdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9uZXMvY2xpZW50LmpzIiwibm9kZV9tb2R1bGVzL25lcy9kaXN0L2NsaWVudC5qcyIsIm5vZGVfbW9kdWxlcy9wYWdlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3BhdGgtYnJvd3NlcmlmeS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wYXRoLXRvLXJlZ2V4cC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvcXVlcnlzdHJpbmctZXMzL2RlY29kZS5qcyIsIm5vZGVfbW9kdWxlcy9xdWVyeXN0cmluZy1lczMvZW5jb2RlLmpzIiwibm9kZV9tb2R1bGVzL3F1ZXJ5c3RyaW5nLWVzMy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ROQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN6REE7QUFDQTs7Ozs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM2lDQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNU9BO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDNW1CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzNtQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgTmVzID0gcmVxdWlyZSgnbmVzL2NsaWVudCcpXG52YXIgaG9zdCA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0XG52YXIgY2xpZW50ID0gbmV3IE5lcy5DbGllbnQoJ3dzOi8vJyArIGhvc3QpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xpZW50XG4iLCJ2YXIgbm9pZGUgPSByZXF1aXJlKCcuLi9ub2lkZScpXG52YXIgY2xpZW50ID0gcmVxdWlyZSgnLi4vY2xpZW50JylcbnZhciBmcyA9IHJlcXVpcmUoJy4uL2ZzJylcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpXG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vLi4vY29uZmlnL2NsaWVudCcpXG52YXIgZWRpdG9yID0gd2luZG93LmFjZS5lZGl0KCdlZGl0b3InKVxudmFyICRzaG9ydGN1dHMgPSB3aW5kb3cualF1ZXJ5KCcja2V5Ym9hcmQtc2hvcnRjdXRzJykubW9kYWwoeyBzaG93OiBmYWxzZSB9KVxuXG4vLyBTZXQgZWRpdG9yIG9wdGlvbnNcbmVkaXRvci5zZXRPcHRpb25zKHtcbiAgZW5hYmxlU25pcHBldHM6IHRydWUsXG4gIGVuYWJsZUJhc2ljQXV0b2NvbXBsZXRpb246IHRydWUsXG4gIGVuYWJsZUxpdmVBdXRvY29tcGxldGlvbjogZmFsc2UsXG4gIGZvbnRTaXplOiBjb25maWcuYWNlLmZvbnRTaXplXG59KVxuXG5mdW5jdGlvbiBzYXZlIChmaWxlLCBzZXNzaW9uKSB7XG4gIGZzLndyaXRlRmlsZShmaWxlLnBhdGgsIHNlc3Npb24uZ2V0VmFsdWUoKSwgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiB1dGlsLmhhbmRsZUVycm9yKGVycilcbiAgICB9XG4gICAgZmlsZS5zdGF0ID0gcGF5bG9hZC5zdGF0XG4gICAgbm9pZGUubWFya1Nlc3Npb25DbGVhbihzZXNzaW9uKVxuICB9KVxufVxuXG5lZGl0b3IuY29tbWFuZHMuYWRkQ29tbWFuZHMoW3tcbiAgbmFtZTogJ2hlbHAnLFxuICBiaW5kS2V5OiB7XG4gICAgd2luOiAnQ3RybC1IJyxcbiAgICBtYWM6ICdDb21tYW5kLUgnXG4gIH0sXG4gIGV4ZWM6IGZ1bmN0aW9uICgpIHtcbiAgICAkc2hvcnRjdXRzLm1vZGFsKCdzaG93JylcbiAgfSxcbiAgcmVhZE9ubHk6IHRydWVcbn1dKVxuXG5lZGl0b3Iuc2V0VGhlbWUoJ2FjZS90aGVtZS8nICsgY29uZmlnLmFjZS50aGVtZSlcblxuZWRpdG9yLmNvbW1hbmRzLmFkZENvbW1hbmRzKFt7XG4gIG5hbWU6ICdzYXZlJyxcbiAgYmluZEtleToge1xuICAgIHdpbjogJ0N0cmwtUycsXG4gICAgbWFjOiAnQ29tbWFuZC1TJ1xuICB9LFxuICBleGVjOiBmdW5jdGlvbiAoZWRpdG9yKSB7XG4gICAgdmFyIGZpbGUgPSBub2lkZS5jdXJyZW50XG4gICAgdmFyIHNlc3Npb24gPSBub2lkZS5nZXRTZXNzaW9uKGZpbGUpXG4gICAgc2F2ZShmaWxlLCBzZXNzaW9uKVxuICB9LFxuICByZWFkT25seTogZmFsc2Vcbn0sIHtcbiAgbmFtZTogJ3NhdmVhbGwnLFxuICBiaW5kS2V5OiB7XG4gICAgd2luOiAnQ3RybC1TaGlmdC1TJyxcbiAgICBtYWM6ICdDb21tYW5kLU9wdGlvbi1TJ1xuICB9LFxuICBleGVjOiBmdW5jdGlvbiAoZWRpdG9yKSB7XG4gICAgbm9pZGUuZGlydHkuZm9yRWFjaChmdW5jdGlvbiAoc2Vzc2lvbikge1xuICAgICAgdmFyIGZpbGUgPSBzZXNzaW9uLmZpbGVcbiAgICAgIHNhdmUoZmlsZSwgc2Vzc2lvbilcbiAgICB9KVxuICB9LFxuICByZWFkT25seTogZmFsc2Vcbn0sIHtcbiAgbmFtZTogJ2JlYXV0aWZ5JyxcbiAgYmluZEtleToge1xuICAgIHdpbjogJ0N0cmwtQicsXG4gICAgbWFjOiAnQ29tbWFuZC1CJ1xuICB9LFxuICBleGVjOiBmdW5jdGlvbiAoZWRpdG9yKSB7XG4gICAgdmFyIGZpbGUgPSBub2lkZS5jdXJyZW50XG4gICAgdmFyIHBhdGhcblxuICAgIGlmIChmaWxlKSB7XG4gICAgICBzd2l0Y2ggKGZpbGUuZXh0KSB7XG4gICAgICAgIGNhc2UgJy5qcyc6XG4gICAgICAgICAgcGF0aCA9ICcvc3RhbmRhcmQtZm9ybWF0J1xuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICB9XG5cbiAgICAgIGlmIChwYXRoKSB7XG4gICAgICAgIGNsaWVudC5yZXF1ZXN0KHtcbiAgICAgICAgICBwYXRoOiBwYXRoLFxuICAgICAgICAgIHBheWxvYWQ6IHtcbiAgICAgICAgICAgIHZhbHVlOiBlZGl0b3IuZ2V0VmFsdWUoKVxuICAgICAgICAgIH0sXG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCdcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiB1dGlsLmhhbmRsZUVycm9yKGVycilcbiAgICAgICAgICB9XG4gICAgICAgICAgZWRpdG9yLnNldFZhbHVlKHBheWxvYWQpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9LFxuICByZWFkT25seTogZmFsc2Vcbn1dKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGVkaXRvclxuIiwidmFyIHBhZ2UgPSByZXF1aXJlKCdwYWdlJylcbnZhciBwYXRjaCA9IHJlcXVpcmUoJy4uL3BhdGNoJylcbnZhciBmcyA9IHJlcXVpcmUoJy4uL2ZzJylcbnZhciB2aWV3ID0gcmVxdWlyZSgnLi92aWV3Lmh0bWwnKVxuXG5mdW5jdGlvbiBGaWxlRWRpdG9yIChlbCkge1xuICB2YXIgbW9kZWwgPSB7XG4gICAgbW9kZTogbnVsbCxcbiAgICBmaWxlOiBudWxsLFxuICAgIHJlbmFtZTogZnMucmVuYW1lLFxuICAgIG1rZmlsZTogZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgIGZzLm1rZmlsZShwYXRoLCBmdW5jdGlvbiAoZXJyLCBwYXlsb2FkKSB7XG4gICAgICAgIGlmICghZXJyKSB7XG4gICAgICAgICAgLy8gT3BlbiB0aGUgbmV3IGZpbGUuIExlYXZlIGEgc2hvcnQgZGVsYXlcbiAgICAgICAgICAvLyB0byBhbGxvdyBpdCB0byByZWdpc3RlciBmcm9tIHRoZSBzb2NrZXRcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHBhZ2UoJy9maWxlP3BhdGg9JyArIHBheWxvYWQucmVsYXRpdmVQYXRoKVxuICAgICAgICAgIH0sIDUwMClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9LFxuICAgIG1rZGlyOiBmcy5ta2RpclxuICB9XG5cbiAgZnVuY3Rpb24gaGlkZSAoKSB7XG4gICAgbW9kZWwuZmlsZSA9IG51bGxcbiAgICBtb2RlbC5tb2RlID0gbnVsbFxuICAgIHBhdGNoKGVsLCB2aWV3LCBtb2RlbCwgaGlkZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3cgKGZpbGUsIG1vZGUpIHtcbiAgICBtb2RlbC5maWxlID0gZmlsZVxuICAgIG1vZGVsLm1vZGUgPSBtb2RlXG4gICAgcGF0Y2goZWwsIHZpZXcsIG1vZGVsLCBoaWRlKVxuICAgIHZhciBpbnB1dCA9IGVsLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0JylcbiAgICBpbnB1dC5mb2N1cygpXG4gIH1cblxuICB0aGlzLnNob3cgPSBzaG93XG59XG5GaWxlRWRpdG9yLnByb3RvdHlwZS5yZW5hbWUgPSBmdW5jdGlvbiAoZmlsZSkge1xuICB0aGlzLnNob3coZmlsZSwgJ3JlbmFtZScpXG59XG5GaWxlRWRpdG9yLnByb3RvdHlwZS5ta2ZpbGUgPSBmdW5jdGlvbiAoZGlyKSB7XG4gIHRoaXMuc2hvdyhkaXIsICdta2ZpbGUnKVxufVxuRmlsZUVkaXRvci5wcm90b3R5cGUubWtkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gIHRoaXMuc2hvdyhkaXIsICdta2RpcicpXG59XG5cbnZhciBmaWxlRWRpdG9yRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmlsZS1lZGl0b3InKVxudmFyIGZpbGVFZGl0b3IgPSBuZXcgRmlsZUVkaXRvcihmaWxlRWRpdG9yRWwpXG5cbm1vZHVsZS5leHBvcnRzID0gZmlsZUVkaXRvclxuIiwidmFyIEluY3JlbWVudGFsRE9NID0gcmVxdWlyZSgnaW5jcmVtZW50YWwtZG9tJylcbnZhciBwYXRjaCA9IEluY3JlbWVudGFsRE9NLnBhdGNoXG52YXIgZWxlbWVudE9wZW4gPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50T3BlblxudmFyIGVsZW1lbnRWb2lkID0gSW5jcmVtZW50YWxET00uZWxlbWVudFZvaWRcbnZhciBlbGVtZW50Q2xvc2UgPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50Q2xvc2VcbnZhciBza2lwID0gSW5jcmVtZW50YWxET00uc2tpcFxudmFyIGN1cnJlbnRFbGVtZW50ID0gSW5jcmVtZW50YWxET00uY3VycmVudEVsZW1lbnRcbnZhciB0ZXh0ID0gSW5jcmVtZW50YWxET00udGV4dFxuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XG52YXIgaG9pc3RlZDEgPSBbXCJjbGFzc1wiLCBcImZpbGUtZWRpdG9yXCJdXG52YXIgaG9pc3RlZDIgPSBbXCJjbGFzc1wiLCBcImZvcm0tZ3JvdXBcIl1cbnZhciBob2lzdGVkMyA9IFtcImZvclwiLCBcIm5hbWVcIl1cbnZhciBob2lzdGVkNCA9IFtcImNsYXNzXCIsIFwiaW5wdXQtZ3JvdXBcIl1cbnZhciBob2lzdGVkNSA9IFtcInR5cGVcIiwgXCJ0ZXh0XCIsIFwiY2xhc3NcIiwgXCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIiwgXCJpZFwiLCBcImZpbGVuYW1lXCJdXG52YXIgaG9pc3RlZDYgPSBbXCJjbGFzc1wiLCBcImlucHV0LWdyb3VwLWJ0blwiXVxudmFyIGhvaXN0ZWQ3ID0gW1wiY2xhc3NcIiwgXCJidG4gYnRuLXByaW1hcnkgYnRuLXNtXCIsIFwidHlwZVwiLCBcInN1Ym1pdFwiXVxudmFyIGhvaXN0ZWQ4ID0gW1wiY2xhc3NcIiwgXCJidG4gYnRuLXNlY29uZGFyeSBidG4tc21cIiwgXCJ0eXBlXCIsIFwiYnV0dG9uXCJdXG52YXIgaG9pc3RlZDkgPSBbXCJjbGFzc1wiLCBcImZvcm0tZ3JvdXBcIl1cbnZhciBob2lzdGVkMTAgPSBbXCJmb3JcIiwgXCJuYW1lXCJdXG52YXIgaG9pc3RlZDExID0gW1wiY2xhc3NcIiwgXCJpbnB1dC1ncm91cFwiXVxudmFyIGhvaXN0ZWQxMiA9IFtcInR5cGVcIiwgXCJ0ZXh0XCIsIFwiY2xhc3NcIiwgXCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIiwgXCJpZFwiLCBcImRpcm5hbWVcIl1cbnZhciBob2lzdGVkMTMgPSBbXCJjbGFzc1wiLCBcImlucHV0LWdyb3VwLWJ0blwiXVxudmFyIGhvaXN0ZWQxNCA9IFtcImNsYXNzXCIsIFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1zbVwiLCBcInR5cGVcIiwgXCJzdWJtaXRcIl1cbnZhciBob2lzdGVkMTUgPSBbXCJjbGFzc1wiLCBcImJ0biBidG4tc2Vjb25kYXJ5IGJ0bi1zbVwiLCBcInR5cGVcIiwgXCJidXR0b25cIl1cbnZhciBob2lzdGVkMTYgPSBbXCJjbGFzc1wiLCBcImZvcm0tZ3JvdXBcIl1cbnZhciBob2lzdGVkMTcgPSBbXCJmb3JcIiwgXCJuYW1lXCJdXG52YXIgaG9pc3RlZDE4ID0gW1wiY2xhc3NcIiwgXCJpbnB1dC1ncm91cFwiXVxudmFyIGhvaXN0ZWQxOSA9IFtcInR5cGVcIiwgXCJ0ZXh0XCIsIFwiY2xhc3NcIiwgXCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIiwgXCJpZFwiLCBcInJlbmFtZVwiXVxudmFyIGhvaXN0ZWQyMCA9IFtcImNsYXNzXCIsIFwiaW5wdXQtZ3JvdXAtYnRuXCJdXG52YXIgaG9pc3RlZDIxID0gW1wiY2xhc3NcIiwgXCJidG4gYnRuLXByaW1hcnkgYnRuLXNtXCIsIFwidHlwZVwiLCBcInN1Ym1pdFwiXVxudmFyIGhvaXN0ZWQyMiA9IFtcImNsYXNzXCIsIFwiYnRuIGJ0bi1zZWNvbmRhcnkgYnRuLXNtXCIsIFwidHlwZVwiLCBcImJ1dHRvblwiXVxuXG5yZXR1cm4gZnVuY3Rpb24gZmlsZUVkaXRvciAobW9kZWwsIGhpZGUpIHtcbiAgdmFyIGZpbGUgPSBtb2RlbC5maWxlXG4gIGlmIChmaWxlKSB7XG4gICAgZWxlbWVudE9wZW4oXCJkaXZcIiwgbnVsbCwgaG9pc3RlZDEpXG4gICAgICBpZiAobW9kZWwubW9kZSA9PT0gJ21rZmlsZScpIHtcbiAgICAgICAgZWxlbWVudE9wZW4oXCJmb3JtXCIsIFwibWtmaWxlXCIsIG51bGwsIFwib25zdWJtaXRcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgICAgICRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgICAgIG1vZGVsLm1rZmlsZSh0aGlzLmZpbGVuYW1lLnZhbHVlKTsgaGlkZSgpfSlcbiAgICAgICAgICBlbGVtZW50T3BlbihcImRpdlwiLCBudWxsLCBob2lzdGVkMilcbiAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwibGFiZWxcIiwgbnVsbCwgaG9pc3RlZDMpXG4gICAgICAgICAgICAgIHRleHQoXCJBZGQgbmV3IGZpbGVcIilcbiAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImxhYmVsXCIpXG4gICAgICAgICAgICBlbGVtZW50T3BlbihcImRpdlwiLCBudWxsLCBob2lzdGVkNClcbiAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJpbnB1dFwiLCBudWxsLCBob2lzdGVkNSwgXCJ2YWx1ZVwiLCBmaWxlLnJlbGF0aXZlUGF0aCA/IGZpbGUucmVsYXRpdmVQYXRoICsgJy8nIDogJycpXG4gICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImlucHV0XCIpXG4gICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwic3BhblwiLCBudWxsLCBob2lzdGVkNilcbiAgICAgICAgICAgICAgICBlbGVtZW50T3BlbihcImJ1dHRvblwiLCBudWxsLCBob2lzdGVkNylcbiAgICAgICAgICAgICAgICAgIHRleHQoXCJPS1wiKVxuICAgICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImJ1dHRvblwiKVxuICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYnV0dG9uXCIsIG51bGwsIGhvaXN0ZWQ4LCBcIm9uY2xpY2tcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgICAgICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGhpZGUoKX0pXG4gICAgICAgICAgICAgICAgICB0ZXh0KFwiQ2FuY2VsXCIpXG4gICAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwiYnV0dG9uXCIpXG4gICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImRpdlwiKVxuICAgICAgICAgIGVsZW1lbnRDbG9zZShcImRpdlwiKVxuICAgICAgICBlbGVtZW50Q2xvc2UoXCJmb3JtXCIpXG4gICAgICB9XG4gICAgICBpZiAobW9kZWwubW9kZSA9PT0gJ21rZGlyJykge1xuICAgICAgICBlbGVtZW50T3BlbihcImZvcm1cIiwgXCJta2RpclwiLCBudWxsLCBcIm9uc3VibWl0XCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICBtb2RlbC5ta2Rpcih0aGlzLmRpcm5hbWUudmFsdWUpOyBoaWRlKCl9KVxuICAgICAgICAgIGVsZW1lbnRPcGVuKFwiZGl2XCIsIG51bGwsIGhvaXN0ZWQ5KVxuICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJsYWJlbFwiLCBudWxsLCBob2lzdGVkMTApXG4gICAgICAgICAgICAgIHRleHQoXCJBZGQgbmV3IGZvbGRlclwiKVxuICAgICAgICAgICAgZWxlbWVudENsb3NlKFwibGFiZWxcIilcbiAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiZGl2XCIsIG51bGwsIGhvaXN0ZWQxMSlcbiAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJpbnB1dFwiLCBudWxsLCBob2lzdGVkMTIsIFwidmFsdWVcIiwgZmlsZS5yZWxhdGl2ZVBhdGggPyBmaWxlLnJlbGF0aXZlUGF0aCArICcvJyA6ICcnKVxuICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJpbnB1dFwiKVxuICAgICAgICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgaG9pc3RlZDEzKVxuICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYnV0dG9uXCIsIG51bGwsIGhvaXN0ZWQxNClcbiAgICAgICAgICAgICAgICAgIHRleHQoXCJPS1wiKVxuICAgICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImJ1dHRvblwiKVxuICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYnV0dG9uXCIsIG51bGwsIGhvaXN0ZWQxNSwgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgICAgICAgICAgICBoaWRlKCl9KVxuICAgICAgICAgICAgICAgICAgdGV4dChcIkNhbmNlbFwiKVxuICAgICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImJ1dHRvblwiKVxuICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJzcGFuXCIpXG4gICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJkaXZcIilcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJkaXZcIilcbiAgICAgICAgZWxlbWVudENsb3NlKFwiZm9ybVwiKVxuICAgICAgfVxuICAgICAgaWYgKG1vZGVsLm1vZGUgPT09ICdyZW5hbWUnKSB7XG4gICAgICAgIGVsZW1lbnRPcGVuKFwiZm9ybVwiLCBcInJlbmFtZVwiLCBudWxsLCBcIm9uc3VibWl0XCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICBtb2RlbC5yZW5hbWUoZmlsZS5yZWxhdGl2ZVBhdGgsIHRoaXMucmVuYW1lLnZhbHVlKTsgaGlkZSgpfSlcbiAgICAgICAgICBlbGVtZW50T3BlbihcImRpdlwiLCBudWxsLCBob2lzdGVkMTYpXG4gICAgICAgICAgICBlbGVtZW50T3BlbihcImxhYmVsXCIsIG51bGwsIGhvaXN0ZWQxNylcbiAgICAgICAgICAgICAgdGV4dChcIlJlbmFtZVwiKVxuICAgICAgICAgICAgZWxlbWVudENsb3NlKFwibGFiZWxcIilcbiAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiZGl2XCIsIG51bGwsIGhvaXN0ZWQxOClcbiAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJpbnB1dFwiLCBudWxsLCBob2lzdGVkMTksIFwidmFsdWVcIiwgZmlsZS5yZWxhdGl2ZVBhdGgpXG4gICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImlucHV0XCIpXG4gICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwic3BhblwiLCBudWxsLCBob2lzdGVkMjApXG4gICAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJidXR0b25cIiwgbnVsbCwgaG9pc3RlZDIxKVxuICAgICAgICAgICAgICAgICAgdGV4dChcIk9LXCIpXG4gICAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwiYnV0dG9uXCIpXG4gICAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJidXR0b25cIiwgbnVsbCwgaG9pc3RlZDIyLCBcIm9uY2xpY2tcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgICAgICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGhpZGUoKX0pXG4gICAgICAgICAgICAgICAgICB0ZXh0KFwiQ2FuY2VsXCIpXG4gICAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwiYnV0dG9uXCIpXG4gICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImRpdlwiKVxuICAgICAgICAgIGVsZW1lbnRDbG9zZShcImRpdlwiKVxuICAgICAgICBlbGVtZW50Q2xvc2UoXCJmb3JtXCIpXG4gICAgICB9XG4gICAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gIH1cbn1cbn0pKCk7XG4iLCJ2YXIgcGF0Y2ggPSByZXF1aXJlKCcuLi9wYXRjaCcpXG52YXIgZnMgPSByZXF1aXJlKCcuLi9mcycpXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKVxudmFyIGZpbGVFZGl0b3IgPSByZXF1aXJlKCcuLi9maWxlLWVkaXRvcicpXG52YXIgdmlldyA9IHJlcXVpcmUoJy4vdmlldy5odG1sJylcbnZhciBjb3BpZWRcbnZhciAkID0gd2luZG93LmpRdWVyeVxudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJylcblxuZnVuY3Rpb24gRmlsZU1lbnUgKGVsKSB7XG4gIHZhciAkZWwgPSAkKGVsKVxuICAkZWwub24oJ21vdXNlbGVhdmUnLCBmdW5jdGlvbiAoKSB7XG4gICAgaGlkZSgpXG4gIH0pXG5cbiAgZnVuY3Rpb24gY2FsbGJhY2sgKGVyciwgcGF5bG9hZCkge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiB1dGlsLmhhbmRsZUVycm9yKGVycilcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZXNldFBhc3RlQnVmZmVyICgpIHtcbiAgICBjb3BpZWQgPSBudWxsXG4gIH1cblxuICBmdW5jdGlvbiBzZXRQYXN0ZUJ1ZmZlciAoZmlsZSwgYWN0aW9uKSB7XG4gICAgaGlkZSgpXG4gICAgY29waWVkID0ge1xuICAgICAgZmlsZTogZmlsZSxcbiAgICAgIGFjdGlvbjogYWN0aW9uXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2hvd1Bhc3RlIChmaWxlKSB7XG4gICAgaWYgKGNvcGllZCkge1xuICAgICAgdmFyIHNvdXJjZVBhdGggPSBjb3BpZWQuZmlsZS5yZWxhdGl2ZVBhdGgudG9Mb3dlckNhc2UoKVxuICAgICAgdmFyIHNvdXJjZURpciA9IGNvcGllZC5maWxlLnJlbGF0aXZlRGlyLnRvTG93ZXJDYXNlKClcbiAgICAgIHZhciBkZXN0aW5hdGlvbkRpciA9IChmaWxlLmlzRGlyZWN0b3J5ID8gZmlsZS5yZWxhdGl2ZVBhdGggOiBmaWxlLnJlbGF0aXZlRGlyKS50b0xvd2VyQ2FzZSgpXG4gICAgICB2YXIgaXNEaXJlY3RvcnkgPSBjb3BpZWQuZmlsZS5pc0RpcmVjdG9yeVxuXG4gICAgICBpZiAoIWlzRGlyZWN0b3J5KSB7XG4gICAgICAgIC8vIEFsd2F5cyBhbGxvdyBwYXN0ZWluZyBvZiBhIGZpbGUgdW5sZXNzIGl0J3MgYSBtb3ZlIG9wZXJhdGlvbiAoY3V0KSBhbmQgdGhlIGRlc3RpbmF0aW9uIGRpciBpcyB0aGUgc2FtZVxuICAgICAgICByZXR1cm4gY29waWVkLmFjdGlvbiAhPT0gJ2N1dCcgfHwgZGVzdGluYXRpb25EaXIgIT09IHNvdXJjZURpclxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQWxsb3cgcGFzdGVpbmcgZGlyZWN0b3JpZXMgaWYgbm90IGludG8gc2VsZiBhIGRlY2VuZGVudFxuICAgICAgICBpZiAoZGVzdGluYXRpb25EaXIuaW5kZXhPZihzb3VyY2VQYXRoKSAhPT0gMCkge1xuICAgICAgICAgIC8vIGFuZCAgb3IgaWYgdGhlIG9wZXJhdGlvbiBpcyBtb3ZlIChjdXQpIHRoZSBwYXJlbnQgZGlyIHRvb1xuICAgICAgICAgIHJldHVybiBjb3BpZWQuYWN0aW9uICE9PSAnY3V0JyB8fCBkZXN0aW5hdGlvbkRpciAhPT0gc291cmNlRGlyXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBmdW5jdGlvbiByZW5hbWUgKGZpbGUpIHtcbiAgICBoaWRlKClcbiAgICByZXNldFBhc3RlQnVmZmVyKClcbiAgICBmaWxlRWRpdG9yLnJlbmFtZShmaWxlKVxuICB9XG5cbiAgZnVuY3Rpb24gcGFzdGUgKGZpbGUpIHtcbiAgICBoaWRlKClcbiAgICBpZiAoY29waWVkICYmIGNvcGllZC5maWxlKSB7XG4gICAgICB2YXIgYWN0aW9uID0gY29waWVkLmFjdGlvblxuICAgICAgdmFyIHNvdXJjZSA9IGNvcGllZC5maWxlXG4gICAgICByZXNldFBhc3RlQnVmZmVyKClcblxuICAgICAgdmFyIHBhc3RlUGF0aCA9IGZpbGUuaXNEaXJlY3RvcnkgPyBmaWxlLnBhdGggOiBmaWxlLmRpclxuXG4gICAgICBpZiAoYWN0aW9uID09PSAnY29weScpIHtcbiAgICAgICAgZnMuY29weShzb3VyY2UucGF0aCwgcGF0aC5yZXNvbHZlKHBhc3RlUGF0aCwgc291cmNlLm5hbWUpLCBjYWxsYmFjaylcbiAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAnY3V0Jykge1xuICAgICAgICBmcy5yZW5hbWUoc291cmNlLnBhdGgsIHBhdGgucmVzb2x2ZShwYXN0ZVBhdGgsIHNvdXJjZS5uYW1lKSwgY2FsbGJhY2spXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbWtmaWxlIChmaWxlKSB7XG4gICAgaGlkZSgpXG4gICAgcmVzZXRQYXN0ZUJ1ZmZlcigpXG4gICAgZmlsZUVkaXRvci5ta2ZpbGUoZmlsZS5pc0RpcmVjdG9yeSA/IGZpbGUgOiBmaWxlLnBhcmVudClcbiAgfVxuXG4gIGZ1bmN0aW9uIG1rZGlyIChmaWxlKSB7XG4gICAgaGlkZSgpXG4gICAgcmVzZXRQYXN0ZUJ1ZmZlcigpXG4gICAgZmlsZUVkaXRvci5ta2RpcihmaWxlLmlzRGlyZWN0b3J5ID8gZmlsZSA6IGZpbGUucGFyZW50KVxuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlIChmaWxlKSB7XG4gICAgdmFyIHBhdGggPSBmaWxlLnJlbGF0aXZlUGF0aFxuICAgIGhpZGUoKVxuICAgIHJlc2V0UGFzdGVCdWZmZXIoKVxuICAgIGlmICh3aW5kb3cuY29uZmlybSgnRGVsZXRlIFsnICsgcGF0aCArICddJykpIHtcbiAgICAgIGZzLnJlbW92ZShwYXRoLCBjYWxsYmFjaylcbiAgICB9XG4gIH1cblxuICB2YXIgbW9kZWwgPSB7XG4gICAgeDogMCxcbiAgICB5OiAwLFxuICAgIGZpbGU6IG51bGwsXG4gICAgcmVuYW1lOiByZW5hbWUsXG4gICAgcGFzdGU6IHBhc3RlLFxuICAgIG1rZmlsZTogbWtmaWxlLFxuICAgIG1rZGlyOiBta2RpcixcbiAgICByZW1vdmU6IHJlbW92ZSxcbiAgICBzaG93UGFzdGU6IHNob3dQYXN0ZSxcbiAgICBzZXRQYXN0ZUJ1ZmZlcjogc2V0UGFzdGVCdWZmZXJcbiAgfVxuXG4gIGZ1bmN0aW9uIGhpZGUgKCkge1xuICAgIG1vZGVsLmZpbGUgPSBudWxsXG4gICAgcGF0Y2goZWwsIHZpZXcsIG1vZGVsKVxuICB9XG5cbiAgZnVuY3Rpb24gc2hvdyAoeCwgeSwgZmlsZSkge1xuICAgIG1vZGVsLnggPSB4XG4gICAgbW9kZWwueSA9IHlcbiAgICBtb2RlbC5maWxlID0gZmlsZVxuICAgIHBhdGNoKGVsLCB2aWV3LCBtb2RlbClcbiAgfVxuXG4gIHRoaXMuc2hvdyA9IHNob3dcbn1cblxudmFyIGZpbGVNZW51RWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmlsZS1tZW51JylcbnZhciBmaWxlTWVudSA9IG5ldyBGaWxlTWVudShmaWxlTWVudUVsKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZpbGVNZW51XG4iLCJ2YXIgSW5jcmVtZW50YWxET00gPSByZXF1aXJlKCdpbmNyZW1lbnRhbC1kb20nKVxudmFyIHBhdGNoID0gSW5jcmVtZW50YWxET00ucGF0Y2hcbnZhciBlbGVtZW50T3BlbiA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRPcGVuXG52YXIgZWxlbWVudFZvaWQgPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50Vm9pZFxudmFyIGVsZW1lbnRDbG9zZSA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRDbG9zZVxudmFyIHNraXAgPSBJbmNyZW1lbnRhbERPTS5za2lwXG52YXIgY3VycmVudEVsZW1lbnQgPSBJbmNyZW1lbnRhbERPTS5jdXJyZW50RWxlbWVudFxudmFyIHRleHQgPSBJbmNyZW1lbnRhbERPTS50ZXh0XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcbnZhciBob2lzdGVkMSA9IFtcImNsYXNzXCIsIFwiZHJvcGRvd24tbWVudVwiXVxudmFyIGhvaXN0ZWQyID0gW1wiY2xhc3NcIiwgXCJkcm9wZG93bi1oZWFkZXJcIl1cbnZhciBob2lzdGVkMyA9IFtcImNsYXNzXCIsIFwiZmEgZmEtcGVuY2lsXCJdXG52YXIgaG9pc3RlZDQgPSBbXCJjbGFzc1wiLCBcImRpdmlkZXJcIl1cbnZhciBob2lzdGVkNSA9IFtcImNsYXNzXCIsIFwiZmEgZmEtc2Npc3NvcnNcIl1cbnZhciBob2lzdGVkNiA9IFtcImNsYXNzXCIsIFwiZmEgZmEtY29weVwiXVxudmFyIGhvaXN0ZWQ3ID0gW1wiY2xhc3NcIiwgXCJmYSBmYS1wYXN0ZVwiXVxudmFyIGhvaXN0ZWQ4ID0gW1wiY2xhc3NcIiwgXCJkaXZpZGVyXCJdXG52YXIgaG9pc3RlZDkgPSBbXCJjbGFzc1wiLCBcImZhIGZhLWZpbGVcIl1cbnZhciBob2lzdGVkMTAgPSBbXCJjbGFzc1wiLCBcImZhIGZhLWZvbGRlclwiXVxudmFyIGhvaXN0ZWQxMSA9IFtcImNsYXNzXCIsIFwiZGl2aWRlclwiXVxudmFyIGhvaXN0ZWQxMiA9IFtcImNsYXNzXCIsIFwiZmEgZmEtdHJhc2hcIl1cblxucmV0dXJuIGZ1bmN0aW9uIGZpbGVNZW51IChtb2RlbCkge1xuICB2YXIgZmlsZSA9IG1vZGVsLmZpbGVcbiAgaWYgKGZpbGUpIHtcbiAgICBlbGVtZW50T3BlbihcInVsXCIsIG51bGwsIGhvaXN0ZWQxLCBcInN0eWxlXCIsIHsgdG9wOiBtb2RlbC55LCBsZWZ0OiBtb2RlbC54IH0pXG4gICAgICBlbGVtZW50T3BlbihcImxpXCIsIFwiaGVhZGVyXCIsIGhvaXN0ZWQyKVxuICAgICAgICB0ZXh0KFwiXCIgKyAoZmlsZS5uYW1lKSArIFwiXCIpXG4gICAgICBlbGVtZW50Q2xvc2UoXCJsaVwiKVxuICAgICAgZWxlbWVudE9wZW4oXCJsaVwiLCBcInJlbmFtZVwiKVxuICAgICAgICBlbGVtZW50T3BlbihcImFcIiwgbnVsbCwgbnVsbCwgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICBtb2RlbC5yZW5hbWUoZmlsZSl9KVxuICAgICAgICAgIGVsZW1lbnRPcGVuKFwiaVwiLCBudWxsLCBob2lzdGVkMylcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJpXCIpXG4gICAgICAgICAgdGV4dChcIiBSZW5hbWVcIilcbiAgICAgICAgZWxlbWVudENsb3NlKFwiYVwiKVxuICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICAgIGVsZW1lbnRPcGVuKFwibGlcIiwgXCJkaXZpZGVyLTFcIiwgaG9pc3RlZDQpXG4gICAgICBlbGVtZW50Q2xvc2UoXCJsaVwiKVxuICAgICAgZWxlbWVudE9wZW4oXCJsaVwiLCBcImN1dFwiKVxuICAgICAgICBlbGVtZW50T3BlbihcImFcIiwgbnVsbCwgbnVsbCwgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICBtb2RlbC5zZXRQYXN0ZUJ1ZmZlcihmaWxlLCAnY3V0Jyl9KVxuICAgICAgICAgIGVsZW1lbnRPcGVuKFwiaVwiLCBudWxsLCBob2lzdGVkNSlcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJpXCIpXG4gICAgICAgICAgdGV4dChcIiBDdXRcIilcbiAgICAgICAgZWxlbWVudENsb3NlKFwiYVwiKVxuICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICAgIGVsZW1lbnRPcGVuKFwibGlcIiwgXCJjb3B5XCIpXG4gICAgICAgIGVsZW1lbnRPcGVuKFwiYVwiLCBudWxsLCBudWxsLCBcIm9uY2xpY2tcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgICAgICRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgICAgIG1vZGVsLnNldFBhc3RlQnVmZmVyKGZpbGUsICdjb3B5Jyl9KVxuICAgICAgICAgIGVsZW1lbnRPcGVuKFwiaVwiLCBudWxsLCBob2lzdGVkNilcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJpXCIpXG4gICAgICAgICAgdGV4dChcIiBDb3B5XCIpXG4gICAgICAgIGVsZW1lbnRDbG9zZShcImFcIilcbiAgICAgIGVsZW1lbnRDbG9zZShcImxpXCIpXG4gICAgICBpZiAobW9kZWwuc2hvd1Bhc3RlKGZpbGUpKSB7XG4gICAgICAgIGVsZW1lbnRPcGVuKFwibGlcIiwgXCJwYXN0ZVwiKVxuICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYVwiLCBudWxsLCBudWxsLCBcIm9uY2xpY2tcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICAgIG1vZGVsLnBhc3RlKGZpbGUpfSlcbiAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiaVwiLCBudWxsLCBob2lzdGVkNylcbiAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImlcIilcbiAgICAgICAgICAgIHRleHQoXCIgUGFzdGVcIilcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJhXCIpXG4gICAgICAgIGVsZW1lbnRDbG9zZShcImxpXCIpXG4gICAgICB9XG4gICAgICBlbGVtZW50T3BlbihcImxpXCIsIFwiZGl2aWRlci0yXCIsIGhvaXN0ZWQ4KVxuICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICAgIGVsZW1lbnRPcGVuKFwibGlcIiwgXCJta2ZpbGVcIilcbiAgICAgICAgZWxlbWVudE9wZW4oXCJhXCIsIG51bGwsIG51bGwsIFwib25jbGlja1wiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgICAgbW9kZWwubWtmaWxlKGZpbGUpfSlcbiAgICAgICAgICBlbGVtZW50T3BlbihcImlcIiwgbnVsbCwgaG9pc3RlZDkpXG4gICAgICAgICAgZWxlbWVudENsb3NlKFwiaVwiKVxuICAgICAgICAgIHRleHQoXCIgQWRkIG5ldyBmaWxlXCIpXG4gICAgICAgIGVsZW1lbnRDbG9zZShcImFcIilcbiAgICAgIGVsZW1lbnRDbG9zZShcImxpXCIpXG4gICAgICBlbGVtZW50T3BlbihcImxpXCIsIFwibWtkaXJcIilcbiAgICAgICAgZWxlbWVudE9wZW4oXCJhXCIsIG51bGwsIG51bGwsIFwib25jbGlja1wiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgICAgbW9kZWwubWtkaXIoZmlsZSl9KVxuICAgICAgICAgIGVsZW1lbnRPcGVuKFwiaVwiLCBudWxsLCBob2lzdGVkMTApXG4gICAgICAgICAgZWxlbWVudENsb3NlKFwiaVwiKVxuICAgICAgICAgIHRleHQoXCIgQWRkIG5ldyBmb2xkZXJcIilcbiAgICAgICAgZWxlbWVudENsb3NlKFwiYVwiKVxuICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICAgIGVsZW1lbnRPcGVuKFwibGlcIiwgXCJkaXZpZGVyLTNcIiwgaG9pc3RlZDExKVxuICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICAgIGVsZW1lbnRPcGVuKFwibGlcIiwgXCJkZWxldGVcIilcbiAgICAgICAgZWxlbWVudE9wZW4oXCJhXCIsIG51bGwsIG51bGwsIFwib25jbGlja1wiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgICAgbW9kZWwucmVtb3ZlKGZpbGUpfSlcbiAgICAgICAgICBlbGVtZW50T3BlbihcImlcIiwgbnVsbCwgaG9pc3RlZDEyKVxuICAgICAgICAgIGVsZW1lbnRDbG9zZShcImlcIilcbiAgICAgICAgICB0ZXh0KFwiIERlbGV0ZVwiKVxuICAgICAgICBlbGVtZW50Q2xvc2UoXCJhXCIpXG4gICAgICBlbGVtZW50Q2xvc2UoXCJsaVwiKVxuICAgIGVsZW1lbnRDbG9zZShcInVsXCIpXG4gIH1cbn1cbn0pKCk7XG4iLCJ2YXIgY2xpZW50ID0gcmVxdWlyZSgnLi9jbGllbnQnKVxuXG5mdW5jdGlvbiByZWFkRmlsZSAocGF0aCwgY2FsbGJhY2spIHtcbiAgY2xpZW50LnJlcXVlc3Qoe1xuICAgIHBhdGg6ICcvcmVhZGZpbGU/cGF0aD0nICsgcGF0aCxcbiAgICBtZXRob2Q6ICdHRVQnXG4gIH0sIGNhbGxiYWNrKVxufVxuXG5mdW5jdGlvbiB3cml0ZUZpbGUgKHBhdGgsIGNvbnRlbnRzLCBjYWxsYmFjaykge1xuICBjbGllbnQucmVxdWVzdCh7XG4gICAgcGF0aDogJy93cml0ZWZpbGUnLFxuICAgIHBheWxvYWQ6IHtcbiAgICAgIHBhdGg6IHBhdGgsXG4gICAgICBjb250ZW50czogY29udGVudHNcbiAgICB9LFxuICAgIG1ldGhvZDogJ1BVVCdcbiAgfSwgY2FsbGJhY2spXG59XG5cbmZ1bmN0aW9uIG1rZGlyIChwYXRoLCBjYWxsYmFjaykge1xuICBjbGllbnQucmVxdWVzdCh7XG4gICAgcGF0aDogJy9ta2RpcicsXG4gICAgcGF5bG9hZDoge1xuICAgICAgcGF0aDogcGF0aFxuICAgIH0sXG4gICAgbWV0aG9kOiAnUE9TVCdcbiAgfSwgY2FsbGJhY2spXG59XG5cbmZ1bmN0aW9uIG1rZmlsZSAocGF0aCwgY2FsbGJhY2spIHtcbiAgY2xpZW50LnJlcXVlc3QoeyBwYXRoOiAnL21rZmlsZScsXG4gICAgcGF5bG9hZDoge1xuICAgICAgcGF0aDogcGF0aFxuICAgIH0sXG4gICAgbWV0aG9kOiAnUE9TVCdcbiAgfSwgY2FsbGJhY2spXG59XG5cbmZ1bmN0aW9uIGNvcHkgKHNvdXJjZSwgZGVzdGluYXRpb24sIGNhbGxiYWNrKSB7XG4gIGNsaWVudC5yZXF1ZXN0KHtcbiAgICBwYXRoOiAnL2NvcHknLFxuICAgIHBheWxvYWQ6IHtcbiAgICAgIHNvdXJjZTogc291cmNlLFxuICAgICAgZGVzdGluYXRpb246IGRlc3RpbmF0aW9uXG4gICAgfSxcbiAgICBtZXRob2Q6ICdQT1NUJ1xuICB9LCBjYWxsYmFjaylcbn1cblxuZnVuY3Rpb24gcmVuYW1lIChvbGRQYXRoLCBuZXdQYXRoLCBjYWxsYmFjaykge1xuICBjbGllbnQucmVxdWVzdCh7XG4gICAgcGF0aDogJy9yZW5hbWUnLFxuICAgIHBheWxvYWQ6IHtcbiAgICAgIG9sZFBhdGg6IG9sZFBhdGgsXG4gICAgICBuZXdQYXRoOiBuZXdQYXRoXG4gICAgfSxcbiAgICBtZXRob2Q6ICdQVVQnXG4gIH0sIGNhbGxiYWNrKVxufVxuXG5mdW5jdGlvbiByZW1vdmUgKHBhdGgsIGNhbGxiYWNrKSB7XG4gIGNsaWVudC5yZXF1ZXN0KHtcbiAgICBwYXRoOiAnL3JlbW92ZScsXG4gICAgcGF5bG9hZDoge1xuICAgICAgcGF0aDogcGF0aFxuICAgIH0sXG4gICAgbWV0aG9kOiAnREVMRVRFJ1xuICB9LCBjYWxsYmFjaylcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1rZGlyOiBta2RpcixcbiAgbWtmaWxlOiBta2ZpbGUsXG4gIGNvcHk6IGNvcHksXG4gIHJlYWRGaWxlOiByZWFkRmlsZSxcbiAgd3JpdGVGaWxlOiB3cml0ZUZpbGUsXG4gIHJlbmFtZTogcmVuYW1lLFxuICByZW1vdmU6IHJlbW92ZVxufVxuIiwidmFyIGV4dGVuZCA9IHJlcXVpcmUoJ2V4dGVuZCcpXG5cbmZ1bmN0aW9uIEZpbGUgKGRhdGEpIHtcbiAgZXh0ZW5kKHRoaXMsIGRhdGEpXG4gIGlmICh0aGlzLmlzRGlyZWN0b3J5KSB7XG4gICAgdGhpcy5leHBhbmRlZCA9IGZhbHNlXG4gIH1cbn1cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKEZpbGUucHJvdG90eXBlLCB7XG4gIGlzRmlsZToge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuICF0aGlzLmlzRGlyZWN0b3J5XG4gICAgfVxuICB9XG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVcbiIsInZhciBwYWdlID0gcmVxdWlyZSgncGFnZScpXG52YXIgcXMgPSByZXF1aXJlKCdxdWVyeXN0cmluZycpXG52YXIgZnMgPSByZXF1aXJlKCcuL2ZzJylcbnZhciBjbGllbnQgPSByZXF1aXJlKCcuL2NsaWVudCcpXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpXG52YXIgc3BsaXR0ZXIgPSByZXF1aXJlKCcuL3NwbGl0dGVyJylcbnZhciBlZGl0b3IgPSByZXF1aXJlKCcuL2VkaXRvcicpXG52YXIgbGludGVyID0gcmVxdWlyZSgnLi9zdGFuZGFyZCcpXG52YXIgbm9pZGUgPSByZXF1aXJlKCcuL25vaWRlJylcbnZhciB3YXRjaCA9IHJlcXVpcmUoJy4vd2F0Y2gnKVxuXG52YXIgd29ya3NwYWNlc0VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dvcmtzcGFjZXMnKVxuXG53aW5kb3cub25iZWZvcmV1bmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChub2lkZS5kaXJ0eS5sZW5ndGgpIHtcbiAgICByZXR1cm4gJ1Vuc2F2ZWQgY2hhbmdlcyB3aWxsIGJlIGxvc3QgLSBhcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gbGVhdmU/J1xuICB9XG59XG5cbmNsaWVudC5jb25uZWN0KGZ1bmN0aW9uIChlcnIpIHtcbiAgaWYgKGVycikge1xuICAgIHJldHVybiB1dGlsLmhhbmRsZUVycm9yKGVycilcbiAgfVxuXG4gIGNsaWVudC5yZXF1ZXN0KCcvd2F0Y2hlZCcsIGZ1bmN0aW9uIChlcnIsIHBheWxvYWQpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICByZXR1cm4gdXRpbC5oYW5kbGVFcnJvcihlcnIpXG4gICAgfVxuXG4gICAgbm9pZGUubG9hZChwYXlsb2FkKVxuXG4gICAgLy8gU2F2ZSBzdGF0ZSBvbiBwYWdlIHVubG9hZFxuICAgIHdpbmRvdy5vbnVubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIG5vaWRlLnNhdmVTdGF0ZSgpXG4gICAgfVxuXG4gICAgLy8gQnVpbGQgdGhlIHRyZWUgcGFuZVxuICAgIHJlcXVpcmUoJy4vdHJlZScpXG5cbiAgICAvLyBCdWlsZCB0aGUgcmVjZW50IGxpc3QgcGFuZVxuICAgIHJlcXVpcmUoJy4vcmVjZW50JylcblxuICAgIC8vIEJ1aWxkIHRoZSBwcm9jc3NlcyBwYW5lXG4gICAgdmFyIHByb2Nlc3Nlc1ZpZXcgPSByZXF1aXJlKCcuL3Byb2Nlc3NlcycpXG5cbiAgICAvLyBTdWJzY3JpYmUgdG8gd2F0Y2hlZCBmaWxlIGNoYW5nZXNcbiAgICAvLyB0aGF0IGhhcHBlbiBvbiB0aGUgZmlsZSBzeXN0ZW1cbiAgICB3YXRjaCgpXG5cbiAgICAvLyBTdWJzY3JpYmUgdG8gZWRpdG9yIGNoYW5nZXMgYW5kXG4gICAgLy8gdXBkYXRlIHRoZSByZWNlbnQgZmlsZXMgdmlld3NcbiAgICBlZGl0b3Iub24oJ2lucHV0JywgZnVuY3Rpb24gKCkge1xuICAgICAgbm9pZGUub25JbnB1dCgpXG4gICAgfSlcblxuICAgIC8qIEluaXRpYWxpemUgdGhlIHNwbGl0dGVycyAqL1xuICAgIGZ1bmN0aW9uIHJlc2l6ZUVkaXRvciAoKSB7XG4gICAgICBlZGl0b3IucmVzaXplKClcbiAgICAgIHByb2Nlc3Nlc1ZpZXcuZWRpdG9yLnJlc2l6ZSgpXG4gICAgfVxuXG4gICAgc3BsaXR0ZXIoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NpZGViYXItd29ya3NwYWNlcycpLCBmYWxzZSwgcmVzaXplRWRpdG9yKVxuICAgIHNwbGl0dGVyKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3b3Jrc3BhY2VzLWluZm8nKSwgdHJ1ZSwgcmVzaXplRWRpdG9yKVxuICAgIHNwbGl0dGVyKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYWluLWZvb3RlcicpLCB0cnVlLCByZXNpemVFZGl0b3IpXG5cbiAgICAvKiBJbml0aWFsaXplIHRoZSBzdGFuZGFyZGpzIGxpbnRlciAqL1xuICAgIGxpbnRlcigpXG5cbiAgICBmdW5jdGlvbiBzZXRXb3Jrc3BhY2UgKGNsYXNzTmFtZSkge1xuICAgICAgd29ya3NwYWNlc0VsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZSB8fCAnd2VsY29tZSdcbiAgICB9XG5cbiAgICBwYWdlKCcqJywgZnVuY3Rpb24gKGN0eCwgbmV4dCkge1xuICAgICAgLy8gVXBkYXRlIGN1cnJlbnQgZmlsZSBzdGF0ZVxuICAgICAgbm9pZGUuY3VycmVudCA9IG51bGxcbiAgICAgIG5leHQoKVxuICAgIH0pXG5cbiAgICBwYWdlKCcvJywgZnVuY3Rpb24gKGN0eCkge1xuICAgICAgc2V0V29ya3NwYWNlKClcbiAgICB9KVxuXG4gICAgcGFnZSgnL2ZpbGUnLCBmdW5jdGlvbiAoY3R4LCBuZXh0KSB7XG4gICAgICB2YXIgcmVsYXRpdmVQYXRoID0gcXMucGFyc2UoY3R4LnF1ZXJ5c3RyaW5nKS5wYXRoXG4gICAgICB2YXIgZmlsZSA9IG5vaWRlLmdldEZpbGUocmVsYXRpdmVQYXRoKVxuXG4gICAgICBpZiAoIWZpbGUpIHtcbiAgICAgICAgcmV0dXJuIG5leHQoKVxuICAgICAgfVxuXG4gICAgICB2YXIgc2Vzc2lvbiA9IG5vaWRlLmdldFNlc3Npb24oZmlsZSlcblxuICAgICAgZnVuY3Rpb24gc2V0U2Vzc2lvbiAoKSB7XG4gICAgICAgIHNldFdvcmtzcGFjZSgnZWRpdG9yJylcblxuICAgICAgICAvLyBVcGRhdGUgc3RhdGVcbiAgICAgICAgbm9pZGUuY3VycmVudCA9IGZpbGVcblxuICAgICAgICBpZiAoIW5vaWRlLmhhc1JlY2VudChmaWxlKSkge1xuICAgICAgICAgIG5vaWRlLmFkZFJlY2VudChmaWxlKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2V0IHRoZSBlZGl0b3Igc2Vzc2lvblxuICAgICAgICBlZGl0b3Iuc2V0U2Vzc2lvbihzZXNzaW9uLmVkaXRTZXNzaW9uKVxuICAgICAgICBlZGl0b3IucmVzaXplKClcbiAgICAgICAgZWRpdG9yLmZvY3VzKClcbiAgICAgIH1cblxuICAgICAgaWYgKHNlc3Npb24pIHtcbiAgICAgICAgc2V0U2Vzc2lvbigpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmcy5yZWFkRmlsZShyZWxhdGl2ZVBhdGgsIGZ1bmN0aW9uIChlcnIsIHBheWxvYWQpIHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICByZXR1cm4gdXRpbC5oYW5kbGVFcnJvcihlcnIpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc2Vzc2lvbiA9IG5vaWRlLmFkZFNlc3Npb24oZmlsZSwgcGF5bG9hZC5jb250ZW50cylcbiAgICAgICAgICBzZXRTZXNzaW9uKClcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgcGFnZSgnKicsIGZ1bmN0aW9uIChjdHgpIHtcbiAgICAgIHNldFdvcmtzcGFjZSgnbm90LWZvdW5kJylcbiAgICB9KVxuXG4gICAgcGFnZSh7XG4gICAgICBoYXNoYmFuZzogdHJ1ZVxuICAgIH0pXG4gIH0pXG59KVxuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKVxudmFyIGNsaWVudCA9IHJlcXVpcmUoJy4vY2xpZW50JylcblxuZnVuY3Rpb24gcnVuIChjb21tYW5kLCBuYW1lLCBjYWxsYmFjaykge1xuICBpZiAodHlwZW9mIG5hbWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjYWxsYmFjayA9IG5hbWVcbiAgICBuYW1lID0gY29tbWFuZFxuICB9XG5cbiAgaWYgKCFuYW1lKSB7XG4gICAgbmFtZSA9IGNvbW1hbmRcbiAgfVxuXG4gIGNsaWVudC5yZXF1ZXN0KHtcbiAgICBwYXRoOiAnL2lvJyxcbiAgICBwYXlsb2FkOiB7XG4gICAgICBuYW1lOiBuYW1lLFxuICAgICAgY29tbWFuZDogY29tbWFuZFxuICAgIH0sXG4gICAgbWV0aG9kOiAnUE9TVCdcbiAgfSwgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHV0aWwuaGFuZGxlRXJyb3IoZXJyKVxuICAgIH1cbiAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhlcnIsIHBheWxvYWQpXG4gIH0pXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBydW46IHJ1blxufVxuIiwidmFyIHBhZ2UgPSByZXF1aXJlKCdwYWdlJylcbnZhciBGc28gPSByZXF1aXJlKCcuL2ZzbycpXG52YXIgU2Vzc2lvbiA9IHJlcXVpcmUoJy4vc2Vzc2lvbicpXG52YXIgb2JzZXJ2YWJsZSA9IHJlcXVpcmUoJy4vb2JzZXJ2YWJsZScpXG52YXIgc3RvcmFnZUtleSA9ICdub2lkZSdcblxuLy8gVGhlIGN1cnJlbnQgYWN0aXZlIGZpbGVcbnZhciBjdXJyZW50XG5cbi8vIFRoZSBtYXAgb2YgZmlsZXNcbnZhciBmaWxlcyA9IG51bGxcblxuLy8gVGhlIG1hcCBvZiByZWNlbnQgZmlsZXNcbnZhciByZWNlbnQgPSBuZXcgTWFwKClcblxuLy8gVGhlIG1hcCBvZiBzZXNzaW9uc1xudmFyIHNlc3Npb25zID0gbmV3IE1hcCgpXG5cbnZhciBub2lkZSA9IHtcbiAgZ2V0IGN1cnJlbnQgKCkge1xuICAgIHJldHVybiBjdXJyZW50XG4gIH0sXG4gIHNldCBjdXJyZW50ICh2YWx1ZSkge1xuICAgIGN1cnJlbnQgPSB2YWx1ZVxuXG4gICAgdGhpcy5lbWl0Q2hhbmdlQ3VycmVudCh7XG4gICAgICBkZXRhaWw6IGN1cnJlbnRcbiAgICB9KVxuICB9LFxuICBsb2FkOiBmdW5jdGlvbiAocGF5bG9hZCkge1xuICAgIHRoaXMuY3dkID0gcGF5bG9hZC5jd2RcblxuICAgIGZpbGVzID0gbmV3IE1hcChwYXlsb2FkLndhdGNoZWQubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gW2l0ZW0ucmVsYXRpdmVQYXRoLCBuZXcgRnNvKGl0ZW0pXVxuICAgIH0pKVxuXG4gICAgdmFyIHN0b3JhZ2UgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oc3RvcmFnZUtleSlcbiAgICBzdG9yYWdlID0gc3RvcmFnZSA/IEpTT04ucGFyc2Uoc3RvcmFnZSkgOiB7fVxuXG4gICAgdmFyIGZpbGUsIGlcblxuICAgIGlmIChzdG9yYWdlLnJlY2VudCkge1xuICAgICAgZm9yIChpID0gMDsgaSA8IHN0b3JhZ2UucmVjZW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGZpbGUgPSBmaWxlcy5nZXQoc3RvcmFnZS5yZWNlbnRbaV0pXG4gICAgICAgIGlmIChmaWxlKSB7XG4gICAgICAgICAgcmVjZW50LnNldChmaWxlLCBmYWxzZSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdG9yYWdlLmV4cGFuZGVkKSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgc3RvcmFnZS5leHBhbmRlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICBmaWxlID0gZmlsZXMuZ2V0KHN0b3JhZ2UuZXhwYW5kZWRbaV0pXG4gICAgICAgIGlmIChmaWxlICYmIGZpbGUuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICBmaWxlLmV4cGFuZGVkID0gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBzYXZlU3RhdGU6IGZ1bmN0aW9uIChmaWxlcykge1xuICAgIHZhciBzdG9yYWdlID0ge1xuICAgICAgcmVjZW50OiB0aGlzLnJlY2VudC5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIGl0ZW0ucmVsYXRpdmVQYXRoXG4gICAgICB9KSxcbiAgICAgIGV4cGFuZGVkOiB0aGlzLmZpbGVzLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICByZXR1cm4gaXRlbS5leHBhbmRlZFxuICAgICAgfSkubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIHJldHVybiBpdGVtLnJlbGF0aXZlUGF0aFxuICAgICAgfSlcbiAgICB9XG4gICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKHN0b3JhZ2VLZXksIEpTT04uc3RyaW5naWZ5KHN0b3JhZ2UpKVxuICB9LFxuICBnZXQgZmlsZXMgKCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKGZpbGVzLnZhbHVlcygpKVxuICB9LFxuICBnZXQgc2Vzc2lvbnMgKCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHNlc3Npb25zLnZhbHVlcygpKVxuICB9LFxuICBnZXQgcmVjZW50ICgpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShyZWNlbnQua2V5cygpKVxuICB9LFxuICBnZXQgZGlydHkgKCkge1xuICAgIHJldHVybiB0aGlzLnNlc3Npb25zLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0uaXNEaXJ0eVxuICAgIH0pXG4gIH0sXG4gIGFkZEZpbGU6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgdmFyIGZpbGUgPSBuZXcgRnNvKGRhdGEpXG4gICAgZmlsZXMuc2V0KGZpbGUucmVsYXRpdmVQYXRoLCBmaWxlKVxuICAgIHRoaXMuZW1pdEFkZEZpbGUoZmlsZSlcbiAgICByZXR1cm4gZmlsZVxuICB9LFxuICBnZXRGaWxlOiBmdW5jdGlvbiAocGF0aCkge1xuICAgIHJldHVybiBmaWxlcy5nZXQocGF0aClcbiAgfSxcbiAgaGFzRmlsZTogZnVuY3Rpb24gKHBhdGgpIHtcbiAgICByZXR1cm4gZmlsZXMuaGFzKHBhdGgpXG4gIH0sXG4gIGhhc1JlY2VudDogZnVuY3Rpb24gKGZpbGUpIHtcbiAgICByZXR1cm4gcmVjZW50LmhhcyhmaWxlKVxuICB9LFxuICBhZGRSZWNlbnQ6IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgcmVjZW50LnNldChmaWxlLCB0cnVlKVxuICAgIHRoaXMuZW1pdEFkZFJlY2VudChmaWxlKVxuICB9LFxuICBnZXRTZXNzaW9uOiBmdW5jdGlvbiAoZmlsZSkge1xuICAgIHJldHVybiBzZXNzaW9ucy5nZXQoZmlsZSlcbiAgfSxcbiAgZ2V0UmVjZW50OiBmdW5jdGlvbiAoZmlsZSkge1xuICAgIHJldHVybiByZWNlbnQuZ2V0KGZpbGUpXG4gIH0sXG4gIGhhc1Nlc3Npb246IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgcmV0dXJuIHNlc3Npb25zLmhhcyhmaWxlKVxuICB9LFxuICBhZGRTZXNzaW9uOiBmdW5jdGlvbiAoZmlsZSwgY29udGVudHMpIHtcbiAgICB2YXIgc2Vzc2lvbiA9IG5ldyBTZXNzaW9uKGZpbGUsIGNvbnRlbnRzKVxuICAgIHNlc3Npb25zLnNldChmaWxlLCBzZXNzaW9uKVxuICAgIHJldHVybiBzZXNzaW9uXG4gIH0sXG4gIG1hcmtTZXNzaW9uQ2xlYW46IGZ1bmN0aW9uIChzZXNzaW9uKSB7XG4gICAgc2Vzc2lvbi5tYXJrQ2xlYW4oKVxuICAgIHRoaXMuZW1pdENoYW5nZVNlc3Npb25EaXJ0eShzZXNzaW9uKVxuICB9LFxuICBvbklucHV0OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGZpbGUgPSBub2lkZS5jdXJyZW50XG4gICAgdmFyIHNlc3Npb24gPSB0aGlzLmdldFNlc3Npb24oZmlsZSlcbiAgICBpZiAoc2Vzc2lvbikge1xuICAgICAgdmFyIGlzQ2xlYW4gPSBzZXNzaW9uLmlzQ2xlYW5cbiAgICAgIGlmIChpc0NsZWFuICYmIHNlc3Npb24uaXNEaXJ0eSkge1xuICAgICAgICBzZXNzaW9uLmlzRGlydHkgPSBmYWxzZVxuICAgICAgICB0aGlzLmVtaXRDaGFuZ2VTZXNzaW9uRGlydHkoc2Vzc2lvbilcbiAgICAgIH0gZWxzZSBpZiAoIWlzQ2xlYW4gJiYgIXNlc3Npb24uaXNEaXJ0eSkge1xuICAgICAgICBzZXNzaW9uLmlzRGlydHkgPSB0cnVlXG4gICAgICAgIHRoaXMuZW1pdENoYW5nZVNlc3Npb25EaXJ0eShzZXNzaW9uKVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgcmVtb3ZlRmlsZTogZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAvLyBSZW1vdmUgZnJvbSBmaWxlc1xuICAgIGlmICh0aGlzLmhhc0ZpbGUoZmlsZS5yZWxhdGl2ZVBhdGgpKSB7XG4gICAgICBmaWxlcy5kZWxldGUoZmlsZS5yZWxhdGl2ZVBhdGgpXG4gICAgICB0aGlzLmVtaXRSZW1vdmVGaWxlKGZpbGUpXG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIHNlc3Npb25cbiAgICBpZiAodGhpcy5oYXNTZXNzaW9uKGZpbGUpKSB7XG4gICAgICBzZXNzaW9ucy5kZWxldGUoZmlsZSlcbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgZnJvbSByZWNlbnQgZmlsZXNcbiAgICBpZiAodGhpcy5oYXNSZWNlbnQoZmlsZSkpIHtcbiAgICAgIHJlY2VudC5kZWxldGUoZmlsZSlcbiAgICAgIHRoaXMuZW1pdFJlbW92ZVJlY2VudChmaWxlKVxuICAgIH1cblxuICAgIC8vIElmIGl0J3MgdGhlIGN1cnJlbnQgZmlsZSBnZXR0aW5nIHJlbW92ZWQsXG4gICAgLy8gbmF2aWdhdGUgYmFjayB0byB0aGUgcHJldmlvdXMgc2Vzc2lvbi9maWxlXG4gICAgaWYgKGN1cnJlbnQgPT09IGZpbGUpIHtcbiAgICAgIGlmIChzZXNzaW9ucy5zaXplKSB7XG4gICAgICAgIC8vIE9wZW4gdGhlIGZpcnN0IHNlc3Npb25cbiAgICAgICAgcGFnZSgnL2ZpbGU/cGF0aD0nICsgdGhpcy5zZXNzaW9uc1swXS5maWxlLnJlbGF0aXZlUGF0aClcbiAgICAgIH0gZWxzZSBpZiAocmVjZW50LnNpemUpIHtcbiAgICAgICAgLy8gT3BlbiB0aGUgZmlyc3QgcmVjZW50IGZpbGVcbiAgICAgICAgcGFnZSgnL2ZpbGU/cGF0aD0nICsgdGhpcy5yZWNlbnRbMF0ucmVsYXRpdmVQYXRoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFnZSgnLycpXG4gICAgICB9XG4gICAgfVxuICB9LFxuICBjbG9zZUZpbGU6IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgdmFyIHNlc3Npb24gPSB0aGlzLmdldFNlc3Npb24oZmlsZSlcblxuICAgIHZhciBjbG9zZSA9IHNlc3Npb24gJiYgc2Vzc2lvbi5pc0RpcnR5XG4gICAgICA/IHdpbmRvdy5jb25maXJtKCdUaGVyZSBhcmUgdW5zYXZlZCBjaGFuZ2VzIHRvIHRoaXMgZmlsZS4gQXJlIHlvdSBzdXJlPycpXG4gICAgICA6IHRydWVcblxuICAgIGlmIChjbG9zZSkge1xuICAgICAgLy8gUmVtb3ZlIGZyb20gcmVjZW50IGZpbGVzXG4gICAgICByZWNlbnQuZGVsZXRlKGZpbGUpXG4gICAgICB0aGlzLmVtaXRSZW1vdmVSZWNlbnQoZmlsZSlcblxuICAgICAgaWYgKHNlc3Npb24pIHtcbiAgICAgICAgLy8gUmVtb3ZlIHNlc3Npb25cbiAgICAgICAgc2Vzc2lvbnMuZGVsZXRlKGZpbGUpXG5cbiAgICAgICAgLy8gSWYgaXQncyB0aGUgY3VycmVudCBmaWxlIGdldHRpbmcgY2xvc2VkLFxuICAgICAgICAvLyBuYXZpZ2F0ZSBiYWNrIHRvIHRoZSBwcmV2aW91cyBzZXNzaW9uL2ZpbGVcbiAgICAgICAgaWYgKGN1cnJlbnQgPT09IGZpbGUpIHtcbiAgICAgICAgICBpZiAoc2Vzc2lvbnMuc2l6ZSkge1xuICAgICAgICAgICAgLy8gT3BlbiB0aGUgZmlyc3Qgc2Vzc2lvblxuICAgICAgICAgICAgcGFnZSgnL2ZpbGU/cGF0aD0nICsgdGhpcy5zZXNzaW9uc1swXS5maWxlLnJlbGF0aXZlUGF0aClcbiAgICAgICAgICB9IGVsc2UgaWYgKHJlY2VudC5zaXplKSB7XG4gICAgICAgICAgICAvLyBPcGVuIHRoZSBmaXJzdCByZWNlbnQgZmlsZVxuICAgICAgICAgICAgcGFnZSgnL2ZpbGU/cGF0aD0nICsgdGhpcy5yZWNlbnRbMF0ucmVsYXRpdmVQYXRoKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYWdlKCcvJylcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxud2luZG93Lm5vaWRlID0gbm9pZGVcblxubW9kdWxlLmV4cG9ydHMgPSBvYnNlcnZhYmxlKG5vaWRlLCB7XG4gICdDaGFuZ2UnOiAnY2hhbmdlJyxcbiAgJ0FkZEZpbGUnOiAnYWRkZmlsZScsXG4gICdSZW1vdmVGaWxlJzogJ3JlbW92ZWZpbGUnLFxuICAnQWRkUmVjZW50JzogJ2FkZFJlY2VudCcsXG4gICdSZW1vdmVSZWNlbnQnOiAncmVtb3ZlcmVjZW50JyxcbiAgJ0NoYW5nZUN1cnJlbnQnOiAnY2hhbmdlY3VycmVudCcsXG4gICdDaGFuZ2VTZXNzaW9uRGlydHknOiAnY2hhbmdlc2Vzc2lvbmRpcnR5J1xufSlcbiIsInZhciAkID0gd2luZG93LmpRdWVyeVxuXG5mdW5jdGlvbiBPYnNlcnZhYmxlIChldmVudHNPYmopIHtcbiAgdmFyIF9saXN0ZW5lcnMgPSB7fVxuXG4gIGZ1bmN0aW9uIGxpc3RlbmVycyAoZXZlbnQpIHtcbiAgICByZXR1cm4gZXZlbnQgPyBfbGlzdGVuZXJzW2V2ZW50XSB8fCAoX2xpc3RlbmVyc1tldmVudF0gPSAkLkNhbGxiYWNrcygpKSA6IF9saXN0ZW5lcnNcbiAgfVxuICB2YXIgb24gPSBmdW5jdGlvbiAoZXZlbnQsIGZuKSB7XG4gICAgbGlzdGVuZXJzKGV2ZW50KS5hZGQoZm4pXG4gIH1cbiAgdmFyIG9mZiA9IGZ1bmN0aW9uIChldmVudCwgZm4pIHtcbiAgICBsaXN0ZW5lcnMoZXZlbnQpLnJlbW92ZShmbilcbiAgfVxuICB2YXIgZW1pdCA9IGZ1bmN0aW9uIChldmVudCwgZGF0YSkge1xuICAgIGxpc3RlbmVycyhldmVudCkuZmlyZVdpdGgodGhpcywgW2RhdGFdKVxuICB9XG5cbiAgLy8gQWRkIGV2ZW50IGF0dGFjaC9kZXRhdGNoIGhhbmRsZXIgZnVuY3Rpb25zXG4gIHZhciBldmVudHMgPSBPYmplY3Qua2V5cyhldmVudHNPYmopXG4gIGV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChldmVudCkge1xuICAgIHRoaXNbJ29uJyArIGV2ZW50XSA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgb24uY2FsbCh0aGlzLCBldmVudHNPYmpbZXZlbnRdLCBmbilcbiAgICB9XG4gICAgdGhpc1snb2ZmJyArIGV2ZW50XSA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgb2ZmLmNhbGwodGhpcywgZXZlbnRzT2JqW2V2ZW50XSwgZm4pXG4gICAgfVxuICAgIHRoaXNbJ2VtaXQnICsgZXZlbnRdID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIGRhdGEudHlwZSA9IGV2ZW50c09ialtldmVudF1cbiAgICAgIGVtaXQuY2FsbCh0aGlzLCBldmVudHNPYmpbZXZlbnRdLCBkYXRhKVxuICAgIH1cbiAgfSwgdGhpcylcblxuICAvLyB0aGlzLm9uID0gb25cbiAgLy8gdGhpcy5vZmYgPSBvZmZcbiAgLy8gdGhpcy5lbWl0ID0gZW1pdFxuICB0aGlzLmV2ZW50cyA9IGV2ZW50c09ialxufVxuXG4vKlxuICogTWFrZSBhIENvbnN0cnVjdG9yIGJlY29tZSBhbiBvYnNlcnZhYmxlIGFuZFxuICogZXhwb3NlcyBldmVudCBuYW1lcyBhcyBjb25zdGFudHNcbiAqL1xuLy8gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIGV2ZW50cykge1xuLy8gICAvKlxuLy8gICAgKiBNaXhpbiBPYnNlcnZhYmxlIGludG8gQ29uc3RydWN0b3IgcHJvdG90eXBlXG4vLyAgICAqL1xuLy8gICB2YXIgcCA9IHR5cGVvZiBDb25zdHJ1Y3RvciA9PT0gJ2Z1bmN0aW9uJyA/IENvbnN0cnVjdG9yLnByb3RvdHlwZSA6IENvbnN0cnVjdG9yXG4vLyAgICQuZXh0ZW5kKHAsIG5ldyBPYnNlcnZhYmxlKGV2ZW50cykpXG4vL1xuLy8gICByZXR1cm4gQ29uc3RydWN0b3Jcbi8vIH1cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGN0b3JPck9iaiwgZXZlbnRzKSB7XG4gIGlmICghY3Rvck9yT2JqKSB7XG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlKGV2ZW50cylcbiAgfVxuICAvKlxuICAgKiBNaXhpbiBPYnNlcnZhYmxlIGludG8gQ29uc3RydWN0b3IgcHJvdG90eXBlXG4gICAqL1xuICB2YXIgcCA9IHR5cGVvZiBjdG9yT3JPYmogPT09ICdmdW5jdGlvbicgPyBjdG9yT3JPYmoucHJvdG90eXBlIDogY3Rvck9yT2JqXG4gICQuZXh0ZW5kKHAsIG5ldyBPYnNlcnZhYmxlKGV2ZW50cykpXG5cbiAgcmV0dXJuIGN0b3JPck9ialxufVxuIiwidmFyIEluY3JlbWVudGFsRE9NID0gcmVxdWlyZSgnaW5jcmVtZW50YWwtZG9tJylcbnZhciBwYXRjaCA9IEluY3JlbWVudGFsRE9NLnBhdGNoXG5cbi8vIEZpeCB1cCB0aGUgZWxlbWVudCBgdmFsdWVgIGF0dHJpYnV0ZVxuSW5jcmVtZW50YWxET00uYXR0cmlidXRlcy52YWx1ZSA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgZWwudmFsdWUgPSB2YWx1ZVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlbCwgdmlldywgZGF0YSkge1xuICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgaWYgKGFyZ3MubGVuZ3RoIDw9IDMpIHtcbiAgICBwYXRjaChlbCwgdmlldywgZGF0YSlcbiAgfSBlbHNlIHtcbiAgICBwYXRjaChlbCwgZnVuY3Rpb24gKCkge1xuICAgICAgdmlldy5hcHBseSh0aGlzLCBhcmdzLnNsaWNlKDIpKVxuICAgIH0pXG4gIH1cbn1cbiIsInZhciBJbmNyZW1lbnRhbERPTSA9IHJlcXVpcmUoJ2luY3JlbWVudGFsLWRvbScpXG52YXIgcGF0Y2ggPSBJbmNyZW1lbnRhbERPTS5wYXRjaFxudmFyIGVsZW1lbnRPcGVuID0gSW5jcmVtZW50YWxET00uZWxlbWVudE9wZW5cbnZhciBlbGVtZW50Vm9pZCA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRWb2lkXG52YXIgZWxlbWVudENsb3NlID0gSW5jcmVtZW50YWxET00uZWxlbWVudENsb3NlXG52YXIgc2tpcCA9IEluY3JlbWVudGFsRE9NLnNraXBcbnZhciBjdXJyZW50RWxlbWVudCA9IEluY3JlbWVudGFsRE9NLmN1cnJlbnRFbGVtZW50XG52YXIgdGV4dCA9IEluY3JlbWVudGFsRE9NLnRleHRcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xudmFyIGhvaXN0ZWQxID0gW1wiY2xhc3NcIiwgXCJjb250cm9sXCJdXG52YXIgaG9pc3RlZDIgPSBbXCJjbGFzc1wiLCBcImlucHV0LWdyb3VwXCJdXG52YXIgaG9pc3RlZDMgPSBbXCJjbGFzc1wiLCBcImlucHV0LWdyb3VwLWJ0biBkcm9wdXBcIl1cbnZhciBob2lzdGVkNCA9IFtcInR5cGVcIiwgXCJidXR0b25cIiwgXCJjbGFzc1wiLCBcImJ0biBidG4tZGVmYXVsdCBidG4tc20gZHJvcGRvd24tdG9nZ2xlXCIsIFwiZGF0YS10b2dnbGVcIiwgXCJkcm9wZG93blwiXVxudmFyIGhvaXN0ZWQ1ID0gW1wiY2xhc3NcIiwgXCJjYXJldFwiXVxudmFyIGhvaXN0ZWQ2ID0gW1wiY2xhc3NcIiwgXCJkcm9wZG93bi1tZW51XCJdXG52YXIgaG9pc3RlZDcgPSBbXCJjbGFzc1wiLCBcImRyb3Bkb3duLWhlYWRlclwiXVxudmFyIGhvaXN0ZWQ4ID0gW1wiaHJlZlwiLCBcIiNcIl1cbnZhciBob2lzdGVkOSA9IFtcInR5cGVcIiwgXCJ0ZXh0XCIsIFwiY2xhc3NcIiwgXCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIiwgXCJuYW1lXCIsIFwiY29tbWFuZFwiLCBcInJlcXVpcmVkXCIsIFwiXCIsIFwiYXV0b2NvbXBsZXRlXCIsIFwib2ZmXCIsIFwicGxhY2Vob2xkZXJcIiwgXCI+XCJdXG52YXIgaG9pc3RlZDEwID0gW1wiY2xhc3NcIiwgXCJpbnB1dC1ncm91cC1idG5cIl1cbnZhciBob2lzdGVkMTEgPSBbXCJjbGFzc1wiLCBcImJ0biBidG4tZGVmYXVsdCBidG4tc21cIiwgXCJ0eXBlXCIsIFwic3VibWl0XCIsIFwidGl0bGVcIiwgXCJSdW4gY29tbWFuZFwiXVxudmFyIGhvaXN0ZWQxMiA9IFtcImNsYXNzXCIsIFwiYnRuIGJ0bi1zdWNjZXNzIGJ0bi1zbVwiLCBcInR5cGVcIiwgXCJidXR0b25cIiwgXCJ0aXRsZVwiLCBcIlJlbW92ZSBkZWFkIHByb2Nlc3Nlc1wiXVxudmFyIGhvaXN0ZWQxMyA9IFtcImNsYXNzXCIsIFwibmF2IG5hdi10YWJzXCJdXG52YXIgaG9pc3RlZDE0ID0gW1wiY2xhc3NcIiwgXCJkcm9wZG93bi10b2dnbGVcIiwgXCJkYXRhLXRvZ2dsZVwiLCBcImRyb3Bkb3duXCJdXG52YXIgaG9pc3RlZDE1ID0gW1wiY2xhc3NcIiwgXCJjYXJldFwiXVxudmFyIGhvaXN0ZWQxNiA9IFtcImNsYXNzXCIsIFwiZHJvcGRvd24tbWVudVwiXVxudmFyIGhvaXN0ZWQxNyA9IFtcImNsYXNzXCIsIFwiZHJvcGRvd24taGVhZGVyXCJdXG52YXIgaG9pc3RlZDE4ID0gW1wiY2xhc3NcIiwgXCJkcm9wZG93bi1oZWFkZXJcIl1cbnZhciBob2lzdGVkMTkgPSBbXCJyb2xlXCIsIFwic2VwYXJhdG9yXCIsIFwiY2xhc3NcIiwgXCJkaXZpZGVyXCJdXG52YXIgaG9pc3RlZDIwID0gW1wiY2xhc3NcIiwgXCJmYSBmYS1zdG9wXCJdXG52YXIgaG9pc3RlZDIxID0gW1wiY2xhc3NcIiwgXCJmYSBmYS1yZWZyZXNoXCJdXG52YXIgaG9pc3RlZDIyID0gW1wiY2xhc3NcIiwgXCJmYSBmYS1jbG9zZVwiXVxudmFyIGhvaXN0ZWQyMyA9IFtcImNsYXNzXCIsIFwicHJvY2Vzc2VzXCJdXG52YXIgaG9pc3RlZDI0ID0gW1wiY2xhc3NcIiwgXCJvdXRwdXRcIl1cblxucmV0dXJuIGZ1bmN0aW9uIGRlc2NyaXB0aW9uIChtb2RlbCwgYWN0aW9ucywgZWRpdG9ySXNJbml0aWFsaXplZCkge1xuICBlbGVtZW50T3BlbihcImRpdlwiLCBudWxsLCBob2lzdGVkMSlcbiAgICBlbGVtZW50T3BlbihcImZvcm1cIiwgbnVsbCwgbnVsbCwgXCJvbnN1Ym1pdFwiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgYWN0aW9ucy5ydW4odGhpcy5jb21tYW5kLnZhbHVlKX0pXG4gICAgICBlbGVtZW50T3BlbihcImRpdlwiLCBudWxsLCBob2lzdGVkMilcbiAgICAgICAgZWxlbWVudE9wZW4oXCJkaXZcIiwgbnVsbCwgaG9pc3RlZDMpXG4gICAgICAgICAgZWxlbWVudE9wZW4oXCJidXR0b25cIiwgbnVsbCwgaG9pc3RlZDQpXG4gICAgICAgICAgICB0ZXh0KFwiVGFzayBcIilcbiAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwic3BhblwiLCBudWxsLCBob2lzdGVkNSlcbiAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJidXR0b25cIilcbiAgICAgICAgICBlbGVtZW50T3BlbihcInVsXCIsIG51bGwsIGhvaXN0ZWQ2KVxuICAgICAgICAgICAgaWYgKCFtb2RlbC50YXNrcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJsaVwiLCBudWxsLCBob2lzdGVkNylcbiAgICAgICAgICAgICAgICB0ZXh0KFwiTm8gbnBtIHJ1bi1zY3JpcHRzIGZvdW5kXCIpXG4gICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImxpXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobW9kZWwudGFza3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIDsoQXJyYXkuaXNBcnJheShtb2RlbC50YXNrcykgPyBtb2RlbC50YXNrcyA6IE9iamVjdC5rZXlzKG1vZGVsLnRhc2tzKSkuZm9yRWFjaChmdW5jdGlvbih0YXNrLCAkaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50T3BlbihcImxpXCIsIHRhc2submFtZSlcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYVwiLCBudWxsLCBob2lzdGVkOCwgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICBhY3Rpb25zLnNldENvbW1hbmQoJ25wbSBydW4gJyArIHRhc2submFtZSl9KVxuICAgICAgICAgICAgICAgICAgICB0ZXh0KFwiXCIgKyAodGFzay5uYW1lKSArIFwiXCIpXG4gICAgICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJhXCIpXG4gICAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICAgICAgICAgICAgfSwgbW9kZWwudGFza3MpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgZWxlbWVudENsb3NlKFwidWxcIilcbiAgICAgICAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gICAgICAgIGVsZW1lbnRPcGVuKFwiaW5wdXRcIiwgbnVsbCwgaG9pc3RlZDksIFwidmFsdWVcIiwgbW9kZWwuY29tbWFuZClcbiAgICAgICAgZWxlbWVudENsb3NlKFwiaW5wdXRcIilcbiAgICAgICAgZWxlbWVudE9wZW4oXCJzcGFuXCIsIG51bGwsIGhvaXN0ZWQxMClcbiAgICAgICAgICBlbGVtZW50T3BlbihcImJ1dHRvblwiLCBudWxsLCBob2lzdGVkMTEpXG4gICAgICAgICAgICB0ZXh0KFwiUnVuXCIpXG4gICAgICAgICAgZWxlbWVudENsb3NlKFwiYnV0dG9uXCIpXG4gICAgICAgICAgaWYgKG1vZGVsLmRlYWQubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbGVtZW50T3BlbihcImJ1dHRvblwiLCBudWxsLCBob2lzdGVkMTIsIFwib25jbGlja1wiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICAgICAgICAgICRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICAgICAgYWN0aW9ucy5yZW1vdmVBbGxEZWFkKCl9KVxuICAgICAgICAgICAgICB0ZXh0KFwiQ2xlYXIgY29tcGxldGVkXCIpXG4gICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJidXR0b25cIilcbiAgICAgICAgICB9XG4gICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgIGVsZW1lbnRDbG9zZShcImRpdlwiKVxuICAgIGVsZW1lbnRDbG9zZShcImZvcm1cIilcbiAgICBlbGVtZW50T3BlbihcInVsXCIsIG51bGwsIGhvaXN0ZWQxMylcbiAgICAgIDsoQXJyYXkuaXNBcnJheShtb2RlbC5wcm9jZXNzZXMpID8gbW9kZWwucHJvY2Vzc2VzIDogT2JqZWN0LmtleXMobW9kZWwucHJvY2Vzc2VzKSkuZm9yRWFjaChmdW5jdGlvbihwcm9jZXNzLCAkaW5kZXgpIHtcbiAgICAgICAgZWxlbWVudE9wZW4oXCJsaVwiLCBwcm9jZXNzLnBpZCwgbnVsbCwgXCJjbGFzc1wiLCBwcm9jZXNzID09PSBtb2RlbC5jdXJyZW50ID8gJ2Ryb3B1cCBhY3RpdmUnIDogJ2Ryb3B1cCcpXG4gICAgICAgICAgZWxlbWVudE9wZW4oXCJhXCIsIG51bGwsIGhvaXN0ZWQxNCwgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAgICRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgICAgICBhY3Rpb25zLnNldEN1cnJlbnQocHJvY2Vzcyl9KVxuICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJzcGFuXCIsIG51bGwsIG51bGwsIFwiY2xhc3NcIiwgJ2NpcmNsZSAnICsgKCFwcm9jZXNzLmlzQWxpdmUgPyAnZGVhZCcgOiAocHJvY2Vzcy5pc0FjdGl2ZSA/ICdhbGl2ZSBhY3RpdmUnIDogJ2FsaXZlJykpKVxuICAgICAgICAgICAgZWxlbWVudENsb3NlKFwic3BhblwiKVxuICAgICAgICAgICAgdGV4dChcIiBcXFxuICAgICAgICAgICAgICAgICAgICAgIFwiICsgKHByb2Nlc3MubmFtZSB8fCBwcm9jZXNzLmNvbW1hbmQpICsgXCIgXFxcbiAgICAgICAgICAgICAgICAgICAgICBcIilcbiAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwic3BhblwiLCBudWxsLCBob2lzdGVkMTUpXG4gICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJzcGFuXCIpXG4gICAgICAgICAgZWxlbWVudENsb3NlKFwiYVwiKVxuICAgICAgICAgIGVsZW1lbnRPcGVuKFwidWxcIiwgbnVsbCwgaG9pc3RlZDE2KVxuICAgICAgICAgICAgaWYgKHByb2Nlc3MuaXNBbGl2ZSkge1xuICAgICAgICAgICAgICBlbGVtZW50T3BlbihcImxpXCIsIG51bGwsIGhvaXN0ZWQxNylcbiAgICAgICAgICAgICAgICB0ZXh0KFwiUHJvY2VzcyBbXCIgKyAocHJvY2Vzcy5waWQpICsgXCJdXCIpXG4gICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImxpXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXByb2Nlc3MuaXNBbGl2ZSkge1xuICAgICAgICAgICAgICBlbGVtZW50T3BlbihcImxpXCIsIG51bGwsIGhvaXN0ZWQxOClcbiAgICAgICAgICAgICAgICB0ZXh0KFwiUHJvY2VzcyBbXCIpXG4gICAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJzXCIpXG4gICAgICAgICAgICAgICAgICB0ZXh0KFwiXCIgKyAocHJvY2Vzcy5waWQpICsgXCJcIilcbiAgICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJzXCIpXG4gICAgICAgICAgICAgICAgdGV4dChcIl1cIilcbiAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwibGlcIiwgbnVsbCwgaG9pc3RlZDE5KVxuICAgICAgICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwibGlcIilcbiAgICAgICAgICAgICAgaWYgKHByb2Nlc3MuaXNBbGl2ZSkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYVwiLCBcImtpbGwtdGFiXCIsIG51bGwsIFwib25jbGlja1wiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgYWN0aW9ucy5raWxsKHByb2Nlc3MpfSlcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiaVwiLCBudWxsLCBob2lzdGVkMjApXG4gICAgICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJpXCIpXG4gICAgICAgICAgICAgICAgICB0ZXh0KFwiIFN0b3BcIilcbiAgICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJhXCIpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImxpXCIpXG4gICAgICAgICAgICBpZiAoIXByb2Nlc3MuaXNBbGl2ZSkge1xuICAgICAgICAgICAgICBlbGVtZW50T3BlbihcImxpXCIpXG4gICAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJhXCIsIFwicmVzdXJyZWN0LXRhYlwiLCBudWxsLCBcIm9uY2xpY2tcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgICAgICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGFjdGlvbnMucmVzdXJyZWN0KHByb2Nlc3MpfSlcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiaVwiLCBudWxsLCBob2lzdGVkMjEpXG4gICAgICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJpXCIpXG4gICAgICAgICAgICAgICAgICB0ZXh0KFwiIFJlc3VycmVjdFwiKVxuICAgICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImFcIilcbiAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJsaVwiKVxuICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYVwiLCBcInJlbW92ZS10YWJcIiwgbnVsbCwgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgICAgICAgICAgICBhY3Rpb25zLnJlbW92ZShwcm9jZXNzKX0pXG4gICAgICAgICAgICAgICAgICBlbGVtZW50T3BlbihcImlcIiwgbnVsbCwgaG9pc3RlZDIyKVxuICAgICAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwiaVwiKVxuICAgICAgICAgICAgICAgICAgdGV4dChcIiBDbG9zZVwiKVxuICAgICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImFcIilcbiAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJ1bFwiKVxuICAgICAgICBlbGVtZW50Q2xvc2UoXCJsaVwiKVxuICAgICAgfSwgbW9kZWwucHJvY2Vzc2VzKVxuICAgIGVsZW1lbnRDbG9zZShcInVsXCIpXG4gIGVsZW1lbnRDbG9zZShcImRpdlwiKVxuICBlbGVtZW50T3BlbihcImRpdlwiLCBudWxsLCBob2lzdGVkMjMsIFwic3R5bGVcIiwge2Rpc3BsYXk6IG1vZGVsLmN1cnJlbnQgPyAnJyA6ICdub25lJ30pXG4gICAgZWxlbWVudE9wZW4oXCJkaXZcIiwgbnVsbCwgaG9pc3RlZDI0KVxuICAgICAgaWYgKGVkaXRvcklzSW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgc2tpcCgpXG4gICAgICB9IGVsc2Uge1xuICAgICAgfVxuICAgIGVsZW1lbnRDbG9zZShcImRpdlwiKVxuICBlbGVtZW50Q2xvc2UoXCJkaXZcIilcbn1cbn0pKCk7XG4iLCJ2YXIgcGF0Y2ggPSByZXF1aXJlKCcuLi9wYXRjaCcpXG52YXIgdmlldyA9IHJlcXVpcmUoJy4vaW5kZXguaHRtbCcpXG52YXIgbW9kZWwgPSByZXF1aXJlKCcuL21vZGVsJylcbnZhciBUYXNrID0gcmVxdWlyZSgnLi90YXNrJylcbnZhciBQcm9jZXNzID0gcmVxdWlyZSgnLi9wcm9jZXNzJylcbnZhciBjbGllbnQgPSByZXF1aXJlKCcuLi9jbGllbnQnKVxudmFyIGlvID0gcmVxdWlyZSgnLi4vaW8nKVxudmFyIGZzID0gcmVxdWlyZSgnLi4vZnMnKVxudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJylcbnZhciBjb25maWcgPSByZXF1aXJlKCcuLi8uLi9jb25maWcvY2xpZW50JylcblxuZnVuY3Rpb24gUHJvY2Vzc2VzIChlbCkge1xuICB2YXIgZWRpdG9yLCBjb21tYW5kRWxcblxuICAvKipcbiAgICogU2V0cyB0aGUgaXNBY3RpdmUgc3RhdGUgb24gdGhlIHByb2Nlc3MuXG4gICAqIFByb2Nlc3NlcyBhcmUgYWN0aXZhdGVkIHdoZW4gdGhleSByZWNlaXZlIHNvbWUgZGF0YS5cbiAgICogQWZ0ZXIgYSBzaG9ydCBkZWxheSwgdGhpcyBpcyByZXNldCB0byBpbmFjdGl2ZS5cbiAgICovXG4gIGZ1bmN0aW9uIHNldFByb2Nlc3NBY3RpdmVTdGF0ZSAocHJvY2VzcywgdmFsdWUpIHtcbiAgICBpZiAocHJvY2Vzcy5pc0FjdGl2ZSAhPT0gdmFsdWUpIHtcbiAgICAgIHZhciB0aW1lb3V0ID0gcHJvY2Vzcy5fdGltZW91dFxuICAgICAgaWYgKHRpbWVvdXQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpXG4gICAgICB9XG5cbiAgICAgIHByb2Nlc3MuaXNBY3RpdmUgPSB2YWx1ZVxuICAgICAgaWYgKHByb2Nlc3MuaXNBY3RpdmUpIHtcbiAgICAgICAgcHJvY2Vzcy5fdGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHNldFByb2Nlc3NBY3RpdmVTdGF0ZShwcm9jZXNzLCBmYWxzZSlcbiAgICAgICAgfSwgMTUwMClcbiAgICAgIH1cbiAgICAgIHJlbmRlcigpXG4gICAgfVxuICB9XG5cbiAgY2xpZW50LnN1YnNjcmliZSgnL2lvJywgZnVuY3Rpb24gKHBheWxvYWQpIHtcbiAgICB2YXIgcHJvY2VzcyA9IG1vZGVsLmZpbmRQcm9jZXNzQnlQaWQocGF5bG9hZC5waWQpXG5cbiAgICBpZiAocHJvY2Vzcykge1xuICAgICAgdmFyIHNlc3Npb24gPSBwcm9jZXNzLnNlc3Npb25cblxuICAgICAgLy8gSW5zZXJ0IGRhdGEgY2h1bmtcbiAgICAgIHNlc3Npb24uaW5zZXJ0KHtcbiAgICAgICAgcm93OiBzZXNzaW9uLmdldExlbmd0aCgpLFxuICAgICAgICBjb2x1bW46IDBcbiAgICAgIH0sIHBheWxvYWQuZGF0YSlcblxuICAgICAgLy8gTW92ZSB0byB0aGUgZW5kIG9mIHRoZSBvdXRwdXRcbiAgICAgIHNlc3Npb24uZ2V0U2VsZWN0aW9uKCkubW92ZUN1cnNvckZpbGVFbmQoKVxuXG4gICAgICAvLyBTZXQgdGhlIHByb2Nlc3MgYWN0aXZlIHN0YXRlIHRvIHRydWVcbiAgICAgIHNldFByb2Nlc3NBY3RpdmVTdGF0ZShwcm9jZXNzLCB0cnVlKVxuXG4gICAgICByZW5kZXIoKVxuICAgIH1cbiAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiB1dGlsLmhhbmRsZUVycm9yKGVycilcbiAgICB9XG4gIH0pXG5cbiAgdmFyIGFjdGlvbnMgPSB7XG4gICAgcnVuOiBmdW5jdGlvbiAoY29tbWFuZCwgbmFtZSkge1xuICAgICAgaW8ucnVuKGNvbW1hbmQsIG5hbWUsIGZ1bmN0aW9uIChlcnIsIHBheWxvYWQpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJldHVybiB1dGlsLmhhbmRsZUVycm9yKGVycilcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9LFxuICAgIHJlbW92ZTogZnVuY3Rpb24gKHByb2Nlc3MpIHtcbiAgICAgIGlmIChtb2RlbC5yZW1vdmUocHJvY2VzcykpIHtcbiAgICAgICAgcmVuZGVyKClcbiAgICAgIH1cbiAgICB9LFxuICAgIHJlbW92ZUFsbERlYWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBkaWVkID0gbW9kZWwucmVtb3ZlQWxsRGVhZCgpXG4gICAgICBpZiAoZGllZC5sZW5ndGgpIHtcbiAgICAgICAgcmVuZGVyKClcbiAgICAgIH1cbiAgICB9LFxuICAgIHJlc3VycmVjdDogZnVuY3Rpb24gKHByb2Nlc3MpIHtcbiAgICAgIG1vZGVsLnJlbW92ZShwcm9jZXNzKVxuICAgICAgdGhpcy5ydW4ocHJvY2Vzcy5jb21tYW5kLCBwcm9jZXNzLm5hbWUpXG4gICAgICByZW5kZXIoKVxuICAgIH0sXG4gICAga2lsbDogZnVuY3Rpb24gKHByb2Nlc3MpIHtcbiAgICAgIGNsaWVudC5yZXF1ZXN0KHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIHBhdGg6ICcvaW8va2lsbCcsXG4gICAgICAgIHBheWxvYWQ6IHtcbiAgICAgICAgICBwaWQ6IHByb2Nlc3MucGlkXG4gICAgICAgIH1cbiAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIHBheWxvYWQpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHV0aWwuaGFuZGxlRXJyb3IoZXJyKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0sXG4gICAgc2V0Q29tbWFuZDogZnVuY3Rpb24gKGNvbW1hbmQpIHtcbiAgICAgIG1vZGVsLmNvbW1hbmQgPSBjb21tYW5kXG4gICAgICByZW5kZXIoKVxuICAgICAgY29tbWFuZEVsLmZvY3VzKClcbiAgICB9LFxuICAgIHNldEN1cnJlbnQ6IGZ1bmN0aW9uIChwcm9jZXNzKSB7XG4gICAgICBtb2RlbC5jdXJyZW50ID0gcHJvY2Vzc1xuICAgICAgaWYgKG1vZGVsLmN1cnJlbnQpIHtcbiAgICAgICAgZWRpdG9yLnNldFNlc3Npb24obW9kZWwuY3VycmVudC5zZXNzaW9uKVxuICAgICAgfVxuICAgICAgcmVuZGVyKClcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBsb2FkUGlkcyAocHJvY3MpIHtcbiAgICB2YXIgcHJvY1xuICAgIHZhciBib3JuID0gW11cblxuICAgIC8vIEZpbmQgYW55IG5ldyBwcm9jZXNzZXNcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb2NzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBwcm9jID0gcHJvY3NbaV1cblxuICAgICAgdmFyIHByb2Nlc3MgPSBtb2RlbC5wcm9jZXNzZXMuZmluZChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICByZXR1cm4gaXRlbS5waWQgPT09IHByb2MucGlkXG4gICAgICB9KVxuXG4gICAgICBpZiAoIXByb2Nlc3MpIHtcbiAgICAgICAgLy8gTmV3IGNoaWxkIHByb2Nlc3MgZm91bmQuIEFkZCBpdFxuICAgICAgICAvLyBhbmQgc2V0IGl0J3MgY2FjaGVkIGJ1ZmZlciBpbnRvIHNlc3Npb25cbiAgICAgICAgcHJvY2VzcyA9IG5ldyBQcm9jZXNzKHByb2MpXG4gICAgICAgIHByb2Nlc3Muc2Vzc2lvbi5zZXRWYWx1ZShwcm9jLmJ1ZmZlcilcbiAgICAgICAgYm9ybi5wdXNoKHByb2Nlc3MpXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2h1dCBkb3duIHByb2Nlc3NlcyB0aGF0IGhhdmUgZGllZFxuICAgIG1vZGVsLnByb2Nlc3Nlcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICB2YXIgbWF0Y2ggPSBwcm9jcy5maW5kKGZ1bmN0aW9uIChjaGVjaykge1xuICAgICAgICByZXR1cm4gaXRlbS5waWQgPT09IGNoZWNrLnBpZFxuICAgICAgfSlcbiAgICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgLy8gaXRlbS5waWQgPSAwXG4gICAgICAgIGl0ZW0uaXNBbGl2ZSA9IGZhbHNlXG4gICAgICAgIHNldFByb2Nlc3NBY3RpdmVTdGF0ZShpdGVtLCBmYWxzZSlcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgLy8gSW5zZXJ0IGFueSBuZXcgY2hpbGQgcHJvY2Vzc2VzXG4gICAgaWYgKGJvcm4ubGVuZ3RoKSB7XG4gICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShtb2RlbC5wcm9jZXNzZXMsIGJvcm4pXG4gICAgICBhY3Rpb25zLnNldEN1cnJlbnQoYm9yblswXSlcbiAgICB9XG4gICAgcmVuZGVyKClcbiAgfVxuXG4gIGNsaWVudC5zdWJzY3JpYmUoJy9pby9waWRzJywgbG9hZFBpZHMsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICByZXR1cm4gdXRpbC5oYW5kbGVFcnJvcihlcnIpXG4gICAgfVxuICB9KVxuXG4gIGNsaWVudC5yZXF1ZXN0KHtcbiAgICBwYXRoOiAnL2lvL3BpZHMnXG4gIH0sIGZ1bmN0aW9uIChlcnIsIHBheWxvYWQpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICB1dGlsLmhhbmRsZUVycm9yKGVycilcbiAgICB9XG4gICAgbG9hZFBpZHMocGF5bG9hZClcbiAgfSlcblxuICBmcy5yZWFkRmlsZSgncGFja2FnZS5qc29uJywgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHZhciBwa2cgPSB7fVxuICAgIHRyeSB7XG4gICAgICBwa2cgPSBKU09OLnBhcnNlKHBheWxvYWQuY29udGVudHMpXG4gICAgfSBjYXRjaCAoZSkge31cblxuICAgIGNvbnNvbGUubG9nKHBrZylcbiAgICBpZiAocGtnLnNjcmlwdHMpIHtcbiAgICAgIHZhciB0YXNrcyA9IFtdXG4gICAgICBmb3IgKHZhciBzY3JpcHQgaW4gcGtnLnNjcmlwdHMpIHtcbiAgICAgICAgaWYgKHNjcmlwdC5zdWJzdHIoMCwgMykgPT09ICdwcmUnIHx8IHNjcmlwdC5zdWJzdHIoMCwgNCkgPT09ICdwb3N0Jykge1xuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICB0YXNrcy5wdXNoKG5ldyBUYXNrKHtcbiAgICAgICAgICBuYW1lOiBzY3JpcHQsXG4gICAgICAgICAgY29tbWFuZDogcGtnLnNjcmlwdHNbc2NyaXB0XVxuICAgICAgICB9KSlcbiAgICAgIH1cbiAgICAgIG1vZGVsLnRhc2tzID0gdGFza3NcbiAgICAgIHJlbmRlcigpXG4gICAgfVxuICB9KVxuXG4gIGZ1bmN0aW9uIHJlbmRlciAoKSB7XG4gICAgcGF0Y2goZWwsIHZpZXcsIG1vZGVsLCBhY3Rpb25zLCAhIWVkaXRvcilcblxuICAgIGlmICghZWRpdG9yKSB7XG4gICAgICB2YXIgb3V0cHV0RWwgPSBlbC5xdWVyeVNlbGVjdG9yKCcub3V0cHV0JylcbiAgICAgIGNvbW1hbmRFbCA9IGVsLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJjb21tYW5kXCJdJylcbiAgICAgIGVkaXRvciA9IHdpbmRvdy5hY2UuZWRpdChvdXRwdXRFbClcblxuICAgICAgLy8gU2V0IGVkaXRvciBvcHRpb25zXG4gICAgICBlZGl0b3Iuc2V0VGhlbWUoJ2FjZS90aGVtZS90ZXJtaW5hbCcpXG4gICAgICBlZGl0b3Iuc2V0UmVhZE9ubHkodHJ1ZSlcbiAgICAgIGVkaXRvci5zZXRGb250U2l6ZShjb25maWcuYWNlLmZvbnRTaXplKVxuICAgICAgZWRpdG9yLnJlbmRlcmVyLnNldFNob3dHdXR0ZXIoZmFsc2UpXG4gICAgICBlZGl0b3Iuc2V0SGlnaGxpZ2h0QWN0aXZlTGluZShmYWxzZSlcbiAgICAgIGVkaXRvci5zZXRTaG93UHJpbnRNYXJnaW4oZmFsc2UpXG4gICAgfVxuICB9XG5cbiAgdGhpcy5tb2RlbCA9IG1vZGVsXG4gIHRoaXMucmVuZGVyID0gcmVuZGVyXG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgIGVkaXRvcjoge1xuICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBlZGl0b3JcbiAgICAgIH1cbiAgICB9XG4gIH0pXG59XG5cbnZhciBwcm9jZXNzZXNFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcm9jZXNzZXMnKVxuXG52YXIgcHJvY2Vzc2VzVmlldyA9IG5ldyBQcm9jZXNzZXMocHJvY2Vzc2VzRWwpXG5cbnByb2Nlc3Nlc1ZpZXcucmVuZGVyKClcblxubW9kdWxlLmV4cG9ydHMgPSBwcm9jZXNzZXNWaWV3XG4iLCJ2YXIgbW9kZWwgPSB7XG4gIHRhc2tzOiBbXSxcbiAgY29tbWFuZDogJycsXG4gIHByb2Nlc3NlczogW10sXG4gIGN1cnJlbnQ6IG51bGwsXG4gIGdldCBkZWFkICgpIHtcbiAgICByZXR1cm4gdGhpcy5wcm9jZXNzZXMuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gIWl0ZW0uaXNBbGl2ZVxuICAgIH0pXG4gIH0sXG4gIHJlbW92ZTogZnVuY3Rpb24gKHByb2Nlc3MpIHtcbiAgICB2YXIgcHJvY2Vzc2VzID0gdGhpcy5wcm9jZXNzZXNcbiAgICB2YXIgaWR4ID0gcHJvY2Vzc2VzLmluZGV4T2YocHJvY2VzcylcbiAgICBpZiAoaWR4ID4gLTEpIHtcbiAgICAgIHByb2Nlc3Nlcy5zcGxpY2UocHJvY2Vzc2VzLmluZGV4T2YocHJvY2VzcyksIDEpXG4gICAgICBpZiAodGhpcy5jdXJyZW50ID09PSBwcm9jZXNzKSB7XG4gICAgICAgIHRoaXMuY3VycmVudCA9IHByb2Nlc3Nlc1swXVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlXG4gIH0sXG4gIHJlbW92ZUFsbERlYWQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZGVhZCA9IHRoaXMuZGVhZFxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVhZC5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5yZW1vdmUoZGVhZFtpXSlcbiAgICB9XG4gICAgcmV0dXJuIGRlYWRcbiAgfSxcbiAgZmluZFByb2Nlc3NCeVBpZDogZnVuY3Rpb24gKHBpZCkge1xuICAgIHJldHVybiB0aGlzLnByb2Nlc3Nlcy5maW5kKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5waWQgPT09IHBpZFxuICAgIH0pXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBtb2RlbFxuIiwidmFyIGV4dGVuZCA9IHJlcXVpcmUoJ2V4dGVuZCcpXG52YXIgRWRpdFNlc3Npb24gPSB3aW5kb3cuYWNlLnJlcXVpcmUoJ2FjZS9lZGl0X3Nlc3Npb24nKS5FZGl0U2Vzc2lvblxuXG5mdW5jdGlvbiBQcm9jZXNzIChkYXRhKSB7XG4gIGV4dGVuZCh0aGlzLCBkYXRhKVxuICB2YXIgZWRpdFNlc3Npb24gPSBuZXcgRWRpdFNlc3Npb24oJycsICdhY2UvbW9kZS9zaCcpXG4gIGVkaXRTZXNzaW9uLnNldFVzZVdvcmtlcihmYWxzZSlcbiAgdGhpcy5zZXNzaW9uID0gZWRpdFNlc3Npb25cbiAgdGhpcy5pc0FsaXZlID0gdHJ1ZVxuICB0aGlzLmlzQWN0aXZlID0gZmFsc2Vcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQcm9jZXNzXG4iLCJmdW5jdGlvbiBUYXNrIChkYXRhKSB7XG4gIHRoaXMubmFtZSA9IGRhdGEubmFtZVxuICB0aGlzLmNvbW1hbmQgPSBkYXRhLmNvbW1hbmRcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBUYXNrXG4iLCJ2YXIgSW5jcmVtZW50YWxET00gPSByZXF1aXJlKCdpbmNyZW1lbnRhbC1kb20nKVxudmFyIHBhdGNoID0gSW5jcmVtZW50YWxET00ucGF0Y2hcbnZhciBlbGVtZW50T3BlbiA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRPcGVuXG52YXIgZWxlbWVudFZvaWQgPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50Vm9pZFxudmFyIGVsZW1lbnRDbG9zZSA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRDbG9zZVxudmFyIHNraXAgPSBJbmNyZW1lbnRhbERPTS5za2lwXG52YXIgY3VycmVudEVsZW1lbnQgPSBJbmNyZW1lbnRhbERPTS5jdXJyZW50RWxlbWVudFxudmFyIHRleHQgPSBJbmNyZW1lbnRhbERPTS50ZXh0XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcbnZhciBob2lzdGVkMSA9IFtcImNsYXNzXCIsIFwibGlzdC1ncm91cFwiXVxudmFyIGhvaXN0ZWQyID0gW1wiY2xhc3NcIiwgXCJjbG9zZVwiXVxudmFyIGhvaXN0ZWQzID0gW1wiY2xhc3NcIiwgXCJuYW1lIGljb24gaWNvbi1maWxlLXRleHRcIl1cbnZhciBob2lzdGVkNCA9IFtcImNsYXNzXCIsIFwiZmlsZS1uYW1lXCJdXG52YXIgaG9pc3RlZDUgPSBbXCJjbGFzc1wiLCBcImxpc3QtZ3JvdXAtaXRlbS10ZXh0XCJdXG5cbnJldHVybiBmdW5jdGlvbiByZWNlbnQgKGZpbGVzLCBjdXJyZW50LCBvbkNsaWNrQ2xvc2UsIGlzRGlydHkpIHtcbiAgZWxlbWVudE9wZW4oXCJkaXZcIiwgbnVsbCwgaG9pc3RlZDEsIFwic3R5bGVcIiwge2Rpc3BsYXk6IGZpbGVzLmxlbmd0aCA/ICcnIDogJ25vbmUnfSlcbiAgICA7KEFycmF5LmlzQXJyYXkoZmlsZXMucmV2ZXJzZSgpKSA/IGZpbGVzLnJldmVyc2UoKSA6IE9iamVjdC5rZXlzKGZpbGVzLnJldmVyc2UoKSkpLmZvckVhY2goZnVuY3Rpb24oZmlsZSwgJGluZGV4KSB7XG4gICAgICBlbGVtZW50T3BlbihcImFcIiwgZmlsZS5yZWxhdGl2ZVBhdGgsIG51bGwsIFwidGl0bGVcIiwgZmlsZS5yZWxhdGl2ZVBhdGgsIFwiaHJlZlwiLCBcIi9maWxlP3BhdGg9XCIgKyAoZmlsZS5yZWxhdGl2ZVBhdGgpICsgXCJcIiwgXCJjbGFzc1wiLCAnbGlzdC1ncm91cC1pdGVtJyArIChmaWxlID09PSBjdXJyZW50ID8gJyBhY3RpdmUnIDogJycpKVxuICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgaG9pc3RlZDIsIFwib25jbGlja1wiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgICAgb25DbGlja0Nsb3NlKGZpbGUpfSlcbiAgICAgICAgICB0ZXh0KFwiw5dcIilcbiAgICAgICAgZWxlbWVudENsb3NlKFwic3BhblwiKVxuICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgaG9pc3RlZDMsIFwiZGF0YS1uYW1lXCIsIGZpbGUubmFtZSwgXCJkYXRhLXBhdGhcIiwgZmlsZS5yZWxhdGl2ZVBhdGgpXG4gICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgZWxlbWVudE9wZW4oXCJzbWFsbFwiLCBudWxsLCBob2lzdGVkNClcbiAgICAgICAgICB0ZXh0KFwiXCIgKyAoZmlsZS5uYW1lKSArIFwiXCIpXG4gICAgICAgIGVsZW1lbnRDbG9zZShcInNtYWxsXCIpXG4gICAgICAgIGlmIChpc0RpcnR5KGZpbGUpKSB7XG4gICAgICAgICAgZWxlbWVudE9wZW4oXCJzcGFuXCIpXG4gICAgICAgICAgICB0ZXh0KFwiKlwiKVxuICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmFsc2UpIHtcbiAgICAgICAgICBlbGVtZW50T3BlbihcInBcIiwgbnVsbCwgaG9pc3RlZDUpXG4gICAgICAgICAgICB0ZXh0KFwiXCIgKyAoJy4vJyArIChmaWxlLnJlbGF0aXZlUGF0aCAhPT0gZmlsZS5uYW1lID8gZmlsZS5yZWxhdGl2ZURpciA6ICcnKSkgKyBcIlwiKVxuICAgICAgICAgIGVsZW1lbnRDbG9zZShcInBcIilcbiAgICAgICAgfVxuICAgICAgZWxlbWVudENsb3NlKFwiYVwiKVxuICAgIH0sIGZpbGVzLnJldmVyc2UoKSlcbiAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG59XG59KSgpO1xuIiwidmFyIG5vaWRlID0gcmVxdWlyZSgnLi4vbm9pZGUnKVxudmFyIHBhdGNoID0gcmVxdWlyZSgnLi4vcGF0Y2gnKVxudmFyIHZpZXcgPSByZXF1aXJlKCcuL2luZGV4Lmh0bWwnKVxuXG5mdW5jdGlvbiBSZWNlbnQgKGVsKSB7XG4gIGZ1bmN0aW9uIG9uQ2xpY2tDbG9zZSAoZmlsZSkge1xuICAgIG5vaWRlLmNsb3NlRmlsZShmaWxlKVxuICB9XG5cbiAgZnVuY3Rpb24gaXNEaXJ0eSAoZmlsZSkge1xuICAgIHZhciBzZXNzaW9uID0gbm9pZGUuZ2V0U2Vzc2lvbihmaWxlKVxuICAgIHJldHVybiBzZXNzaW9uICYmIHNlc3Npb24uaXNEaXJ0eVxuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyICgpIHtcbiAgICBjb25zb2xlLmxvZygnUmVuZGVyIHJlY2VudCcpXG4gICAgcGF0Y2goZWwsIHZpZXcsIG5vaWRlLnJlY2VudCwgbm9pZGUuY3VycmVudCwgb25DbGlja0Nsb3NlLCBpc0RpcnR5KVxuICB9XG5cbiAgbm9pZGUub25BZGRSZWNlbnQocmVuZGVyKVxuICBub2lkZS5vblJlbW92ZVJlY2VudChyZW5kZXIpXG4gIG5vaWRlLm9uQ2hhbmdlQ3VycmVudChyZW5kZXIpXG4gIG5vaWRlLm9uQ2hhbmdlU2Vzc2lvbkRpcnR5KHJlbmRlcilcblxuICByZW5kZXIoKVxufVxuXG52YXIgcmVjZW50RWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVjZW50JylcblxudmFyIHJlY2VudFZpZXcgPSBuZXcgUmVjZW50KHJlY2VudEVsKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlY2VudFZpZXdcbiIsInZhciBjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWcvY2xpZW50JylcbnZhciBFZGl0U2Vzc2lvbiA9IHdpbmRvdy5hY2UucmVxdWlyZSgnYWNlL2VkaXRfc2Vzc2lvbicpLkVkaXRTZXNzaW9uXG52YXIgVW5kb01hbmFnZXIgPSB3aW5kb3cuYWNlLnJlcXVpcmUoJ2FjZS91bmRvbWFuYWdlcicpLlVuZG9NYW5hZ2VyXG52YXIgTW9kZUxpc3QgPSB3aW5kb3cuYWNlLnJlcXVpcmUoJ2FjZS9leHQvbW9kZWxpc3QnKVxuXG5mdW5jdGlvbiBTZXNzaW9uIChmaWxlLCBjb250ZW50cykge1xuICB2YXIgZWRpdFNlc3Npb24gPSBuZXcgRWRpdFNlc3Npb24oY29udGVudHMsIE1vZGVMaXN0LmdldE1vZGVGb3JQYXRoKGZpbGUpKVxuICBlZGl0U2Vzc2lvbi5zZXRVc2VXb3JrZXIoZmFsc2UpXG4gIGVkaXRTZXNzaW9uLnNldFRhYlNpemUoY29uZmlnLmFjZS50YWJTaXplKVxuICBlZGl0U2Vzc2lvbi5zZXRVc2VTb2Z0VGFicyhjb25maWcuYWNlLnVzZVNvZnRUYWJzKVxuICBlZGl0U2Vzc2lvbi5zZXRVbmRvTWFuYWdlcihuZXcgVW5kb01hbmFnZXIoKSlcblxuICB0aGlzLmZpbGUgPSBmaWxlXG4gIHRoaXMuZWRpdFNlc3Npb24gPSBlZGl0U2Vzc2lvblxufVxuU2Vzc2lvbi5wcm90b3R5cGUubWFya0NsZWFuID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmlzRGlydHkgPSBmYWxzZVxuICB0aGlzLmVkaXRTZXNzaW9uLmdldFVuZG9NYW5hZ2VyKCkubWFya0NsZWFuKClcbn1cblNlc3Npb24ucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5lZGl0U2Vzc2lvbi5nZXRWYWx1ZSgpXG59XG5TZXNzaW9uLnByb3RvdHlwZS5zZXRWYWx1ZSA9IGZ1bmN0aW9uIChjb250ZW50LCBtYXJrQ2xlYW4pIHtcbiAgdGhpcy5lZGl0U2Vzc2lvbi5zZXRWYWx1ZShjb250ZW50KVxuXG4gIGlmIChtYXJrQ2xlYW4pIHtcbiAgICB0aGlzLm1hcmtDbGVhbigpXG4gIH1cbn1cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKFNlc3Npb24ucHJvdG90eXBlLCB7XG4gIGlzQ2xlYW46IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLmVkaXRTZXNzaW9uLmdldFVuZG9NYW5hZ2VyKCkuaXNDbGVhbigpXG4gICAgfVxuICB9XG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNlc3Npb25cbiIsInZhciB3ID0gd2luZG93XG52YXIgZCA9IGRvY3VtZW50XG5cbmZ1bmN0aW9uIHNwbGl0dGVyIChoYW5kbGUsIGNvbGxhcHNlTmV4dEVsZW1lbnQsIG9uRW5kQ2FsbGJhY2spIHtcbiAgdmFyIGxhc3RcbiAgdmFyIGhvcml6b250YWwgPSBoYW5kbGUuY2xhc3NMaXN0LmNvbnRhaW5zKCdob3Jpem9udGFsJylcbiAgdmFyIGVsMSA9IGhhbmRsZS5wcmV2aW91c0VsZW1lbnRTaWJsaW5nXG4gIHZhciBlbDIgPSBoYW5kbGUubmV4dEVsZW1lbnRTaWJsaW5nXG4gIHZhciBjb2xsYXBzZSA9IGNvbGxhcHNlTmV4dEVsZW1lbnQgPyBlbDIgOiBlbDFcbiAgdmFyIHRvZ2dsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKVxuICB0b2dnbGUuY2xhc3NMaXN0LmFkZCgndG9nZ2xlJylcbiAgaGFuZGxlLmFwcGVuZENoaWxkKHRvZ2dsZSlcblxuICBmdW5jdGlvbiBvbkRyYWcgKGUpIHtcbiAgICBpZiAoaG9yaXpvbnRhbCkge1xuICAgICAgdmFyIGhULCBoQlxuICAgICAgdmFyIGhEaWZmID0gZS5jbGllbnRZIC0gbGFzdFxuXG4gICAgICBoVCA9IGQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbDEsICcnKS5nZXRQcm9wZXJ0eVZhbHVlKCdoZWlnaHQnKVxuICAgICAgaEIgPSBkLmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwyLCAnJykuZ2V0UHJvcGVydHlWYWx1ZSgnaGVpZ2h0JylcbiAgICAgIGhUID0gcGFyc2VJbnQoaFQsIDEwKSArIGhEaWZmXG4gICAgICBoQiA9IHBhcnNlSW50KGhCLCAxMCkgLSBoRGlmZlxuICAgICAgZWwxLnN0eWxlLmhlaWdodCA9IGhUICsgJ3B4J1xuICAgICAgZWwyLnN0eWxlLmhlaWdodCA9IGhCICsgJ3B4J1xuICAgICAgbGFzdCA9IGUuY2xpZW50WVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgd0wsIHdSXG4gICAgICB2YXIgd0RpZmYgPSBlLmNsaWVudFggLSBsYXN0XG5cbiAgICAgIHdMID0gZC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGVsMSwgJycpLmdldFByb3BlcnR5VmFsdWUoJ3dpZHRoJylcbiAgICAgIHdSID0gZC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGVsMiwgJycpLmdldFByb3BlcnR5VmFsdWUoJ3dpZHRoJylcbiAgICAgIHdMID0gcGFyc2VJbnQod0wsIDEwKSArIHdEaWZmXG4gICAgICB3UiA9IHBhcnNlSW50KHdSLCAxMCkgLSB3RGlmZlxuICAgICAgZWwxLnN0eWxlLndpZHRoID0gd0wgKyAncHgnXG4gICAgICBlbDIuc3R5bGUud2lkdGggPSB3UiArICdweCdcbiAgICAgIGxhc3QgPSBlLmNsaWVudFhcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBvbkVuZERyYWcgKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICB3LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG9uRHJhZylcbiAgICB3LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBvbkVuZERyYWcpXG4gICAgaWYgKG9uRW5kQ2FsbGJhY2spIHtcbiAgICAgIG9uRW5kQ2FsbGJhY2soKVxuICAgIH1cbiAgICAvLyBub2lkZS5lZGl0b3IucmVzaXplKClcbiAgICAvLyB2YXIgcHJvY2Vzc2VzID0gcmVxdWlyZSgnLi9wcm9jZXNzZXMnKVxuICAgIC8vIHByb2Nlc3Nlcy5lZGl0b3IucmVzaXplKClcbiAgfVxuXG4gIGhhbmRsZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKGUudGFyZ2V0ID09PSB0b2dnbGUpIHtcbiAgICAgIGNvbGxhcHNlLnN0eWxlLmRpc3BsYXkgPSBjb2xsYXBzZS5zdHlsZS5kaXNwbGF5ID09PSAnbm9uZScgPyAnYmxvY2snIDogJ25vbmUnXG4gICAgfSBlbHNlIGlmIChjb2xsYXBzZS5zdHlsZS5kaXNwbGF5ICE9PSAnbm9uZScpIHtcbiAgICAgIGxhc3QgPSBob3Jpem9udGFsID8gZS5jbGllbnRZIDogZS5jbGllbnRYXG5cbiAgICAgIHcuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgb25EcmFnKVxuICAgICAgdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgb25FbmREcmFnKVxuICAgIH1cbiAgfSlcbiAgLy8gaGFuZGxlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgLy8gICBlLnByZXZlbnREZWZhdWx0KClcbiAgLy8gICBlLnN0b3BcbiAgLy9cbiAgLy8gICBsYXN0ID0gaG9yaXpvbnRhbCA/IGUuY2xpZW50WSA6IGUuY2xpZW50WFxuICAvL1xuICAvLyAgIHcuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgb25EcmFnKVxuICAvLyAgIHcuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIG9uRW5kRHJhZylcbiAgLy8gfSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzcGxpdHRlclxuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKVxudmFyIG5vaWRlID0gcmVxdWlyZSgnLi9ub2lkZScpXG52YXIgY2xpZW50ID0gcmVxdWlyZSgnLi9jbGllbnQnKVxuXG5mdW5jdGlvbiBsaW50ZXIgKCkge1xuICBmdW5jdGlvbiBsaW50ICgpIHtcbiAgICB2YXIgZmlsZSA9IG5vaWRlLmN1cnJlbnRcbiAgICBpZiAoZmlsZSAmJiBmaWxlLmV4dCA9PT0gJy5qcycpIHtcbiAgICAgIHZhciBzZXNzaW9uID0gbm9pZGUuZ2V0U2Vzc2lvbihmaWxlKVxuICAgICAgaWYgKHNlc3Npb24pIHtcbiAgICAgICAgdmFyIGVkaXRTZXNzaW9uID0gc2Vzc2lvbi5lZGl0U2Vzc2lvblxuICAgICAgICBjbGllbnQucmVxdWVzdCh7XG4gICAgICAgICAgcGF0aDogJy9zdGFuZGFyZCcsXG4gICAgICAgICAgcGF5bG9hZDoge1xuICAgICAgICAgICAgdmFsdWU6IGVkaXRTZXNzaW9uLmdldFZhbHVlKClcbiAgICAgICAgICB9LFxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnXG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIHBheWxvYWQpIHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICByZXR1cm4gdXRpbC5oYW5kbGVFcnJvcihlcnIpXG4gICAgICAgICAgfVxuICAgICAgICAgIGVkaXRTZXNzaW9uLnNldEFubm90YXRpb25zKHBheWxvYWQpXG4gICAgICAgICAgc2V0VGltZW91dChsaW50LCAxNTAwKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzZXRUaW1lb3V0KGxpbnQsIDE1MDApXG4gICAgfVxuICB9XG4gIGxpbnQoKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxpbnRlclxuIiwidmFyIHBhdGNoID0gcmVxdWlyZSgnLi4vcGF0Y2gnKVxudmFyIHZpZXcgPSByZXF1aXJlKCcuL3ZpZXcuaHRtbCcpXG52YXIgZmlsZU1lbnUgPSByZXF1aXJlKCcuLi9maWxlLW1lbnUnKVxudmFyIG5vaWRlID0gcmVxdWlyZSgnLi4vbm9pZGUnKVxuXG5mdW5jdGlvbiBtYWtlVHJlZSAoZmlsZXMpIHtcbiAgZnVuY3Rpb24gdHJlZWlmeSAobGlzdCwgaWRBdHRyLCBwYXJlbnRBdHRyLCBjaGlsZHJlbkF0dHIpIHtcbiAgICB2YXIgdHJlZUxpc3QgPSBbXVxuICAgIHZhciBsb29rdXAgPSB7fVxuICAgIHZhciBpLCBvYmpcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmogPSBsaXN0W2ldXG4gICAgICBsb29rdXBbb2JqW2lkQXR0cl1dID0gb2JqXG4gICAgICBvYmpbY2hpbGRyZW5BdHRyXSA9IFtdXG4gICAgfVxuXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iaiA9IGxpc3RbaV1cbiAgICAgIHZhciBwYXJlbnQgPSBsb29rdXBbb2JqW3BhcmVudEF0dHJdXVxuICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICBvYmoucGFyZW50ID0gcGFyZW50XG4gICAgICAgIGxvb2t1cFtvYmpbcGFyZW50QXR0cl1dW2NoaWxkcmVuQXR0cl0ucHVzaChvYmopXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cmVlTGlzdC5wdXNoKG9iailcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJlZUxpc3RcbiAgfVxuICByZXR1cm4gdHJlZWlmeShmaWxlcywgJ3BhdGgnLCAnZGlyJywgJ2NoaWxkcmVuJylcbn1cblxuZnVuY3Rpb24gVHJlZSAoZWwpIHtcbiAgZnVuY3Rpb24gb25DbGljayAoZmlsZSkge1xuICAgIGlmIChmaWxlLmlzRGlyZWN0b3J5KSB7XG4gICAgICBmaWxlLmV4cGFuZGVkID0gIWZpbGUuZXhwYW5kZWRcbiAgICAgIHJlbmRlcigpXG4gICAgfVxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgZnVuY3Rpb24gc2hvd01lbnUgKGUsIGZpbGUpIHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgZmlsZU1lbnUuc2hvdygoZS5wYWdlWCAtIDIpICsgJ3B4JywgKGUucGFnZVkgLSAyKSArICdweCcsIGZpbGUpXG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXIgKCkge1xuICAgIGNvbnNvbGUubG9nKCdSZW5kZXIgdHJlZScpXG4gICAgcGF0Y2goZWwsIHZpZXcsIG1ha2VUcmVlKG5vaWRlLmZpbGVzKVswXS5jaGlsZHJlbiwgdHJ1ZSwgbm9pZGUuY3VycmVudCwgc2hvd01lbnUsIG9uQ2xpY2spXG4gIH1cblxuICBub2lkZS5vbkFkZEZpbGUocmVuZGVyKVxuICBub2lkZS5vblJlbW92ZUZpbGUocmVuZGVyKVxuICBub2lkZS5vbkNoYW5nZUN1cnJlbnQocmVuZGVyKVxuICByZW5kZXIoKVxufVxuXG52YXIgdHJlZUVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RyZWUnKVxuXG52YXIgdHJlZVZpZXcgPSBuZXcgVHJlZSh0cmVlRWwpXG5cbm1vZHVsZS5leHBvcnRzID0gdHJlZVZpZXdcbiIsInZhciBJbmNyZW1lbnRhbERPTSA9IHJlcXVpcmUoJ2luY3JlbWVudGFsLWRvbScpXG52YXIgcGF0Y2ggPSBJbmNyZW1lbnRhbERPTS5wYXRjaFxudmFyIGVsZW1lbnRPcGVuID0gSW5jcmVtZW50YWxET00uZWxlbWVudE9wZW5cbnZhciBlbGVtZW50Vm9pZCA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRWb2lkXG52YXIgZWxlbWVudENsb3NlID0gSW5jcmVtZW50YWxET00uZWxlbWVudENsb3NlXG52YXIgc2tpcCA9IEluY3JlbWVudGFsRE9NLnNraXBcbnZhciBjdXJyZW50RWxlbWVudCA9IEluY3JlbWVudGFsRE9NLmN1cnJlbnRFbGVtZW50XG52YXIgdGV4dCA9IEluY3JlbWVudGFsRE9NLnRleHRcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xudmFyIGhvaXN0ZWQxID0gW1wiY2xhc3NcIiwgXCJuYW1lIGljb24gaWNvbi1maWxlLXRleHRcIl1cbnZhciBob2lzdGVkMiA9IFtcImNsYXNzXCIsIFwiZmlsZS1uYW1lXCJdXG52YXIgaG9pc3RlZDMgPSBbXCJjbGFzc1wiLCBcImV4cGFuZGVkXCJdXG52YXIgaG9pc3RlZDQgPSBbXCJjbGFzc1wiLCBcImNvbGxhcHNlZFwiXVxudmFyIGhvaXN0ZWQ1ID0gW1wiY2xhc3NcIiwgXCJuYW1lIGljb24gaWNvbi1maWxlLWRpcmVjdG9yeVwiXVxudmFyIGhvaXN0ZWQ2ID0gW1wiY2xhc3NcIiwgXCJkaXItbmFtZVwiXVxudmFyIGhvaXN0ZWQ3ID0gW1wiY2xhc3NcIiwgXCJ0cmlhbmdsZS1sZWZ0XCJdXG5cbnJldHVybiBmdW5jdGlvbiB0cmVlIChkYXRhLCBpc1Jvb3QsIGN1cnJlbnQsIHNob3dNZW51LCBvbkNsaWNrKSB7XG4gIGVsZW1lbnRPcGVuKFwidWxcIiwgbnVsbCwgbnVsbCwgXCJjbGFzc1wiLCBpc1Jvb3QgPyAndHJlZSBub3NlbGVjdCcgOiAnbm9zZWxlY3QnKVxuICAgIDsoQXJyYXkuaXNBcnJheShkYXRhKSA/IGRhdGEgOiBPYmplY3Qua2V5cyhkYXRhKSkuZm9yRWFjaChmdW5jdGlvbihmc28sICRpbmRleCkge1xuICAgICAgZWxlbWVudE9wZW4oXCJsaVwiLCBmc28ucGF0aCwgbnVsbCwgXCJvbmNvbnRleHRtZW51XCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgICBzaG93TWVudSgkZXZlbnQsIGZzbyl9LCBcInRpdGxlXCIsIGZzby5yZWxhdGl2ZVBhdGgsIFwiY2xhc3NcIiwgZnNvLmlzRGlyZWN0b3J5ID8gJ2RpcicgOiAnZmlsZScgKyAoZnNvID09PSBjdXJyZW50ID8gJyBzZWxlY3RlZCcgOiAnJykpXG4gICAgICAgIGlmIChmc28uaXNGaWxlKSB7XG4gICAgICAgICAgZWxlbWVudE9wZW4oXCJhXCIsIG51bGwsIG51bGwsIFwiaHJlZlwiLCBcIi9maWxlP3BhdGg9XCIgKyAoZnNvLnJlbGF0aXZlUGF0aCkgKyBcIlwiKVxuICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJzcGFuXCIsIG51bGwsIGhvaXN0ZWQxLCBcImRhdGEtbmFtZVwiLCBmc28ubmFtZSwgXCJkYXRhLXBhdGhcIiwgZnNvLnJlbGF0aXZlUGF0aClcbiAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwic3BhblwiLCBudWxsLCBob2lzdGVkMilcbiAgICAgICAgICAgICAgdGV4dChcIlwiICsgKGZzby5uYW1lKSArIFwiXCIpXG4gICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJzcGFuXCIpXG4gICAgICAgICAgZWxlbWVudENsb3NlKFwiYVwiKVxuICAgICAgICB9XG4gICAgICAgIGlmIChmc28uaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICBlbGVtZW50T3BlbihcImFcIiwgbnVsbCwgbnVsbCwgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAgICRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgICAgICBvbkNsaWNrKGZzbyl9KVxuICAgICAgICAgICAgaWYgKGZzby5leHBhbmRlZCkge1xuICAgICAgICAgICAgICBlbGVtZW50T3BlbihcInNtYWxsXCIsIG51bGwsIGhvaXN0ZWQzKVxuICAgICAgICAgICAgICAgIHRleHQoXCLilrxcIilcbiAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwic21hbGxcIilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghZnNvLmV4cGFuZGVkKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwic21hbGxcIiwgbnVsbCwgaG9pc3RlZDQpXG4gICAgICAgICAgICAgICAgdGV4dChcIuKWtlwiKVxuICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJzbWFsbFwiKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJzcGFuXCIsIG51bGwsIGhvaXN0ZWQ1LCBcImRhdGEtbmFtZVwiLCBmc28ubmFtZSwgXCJkYXRhLXBhdGhcIiwgZnNvLnJlbGF0aXZlUGF0aClcbiAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwic3BhblwiLCBudWxsLCBob2lzdGVkNilcbiAgICAgICAgICAgICAgdGV4dChcIlwiICsgKGZzby5uYW1lKSArIFwiXCIpXG4gICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJzcGFuXCIpXG4gICAgICAgICAgZWxlbWVudENsb3NlKFwiYVwiKVxuICAgICAgICB9XG4gICAgICAgIGlmIChmc28uaXNGaWxlICYmIGZzbyA9PT0gY3VycmVudCkge1xuICAgICAgICAgIGVsZW1lbnRPcGVuKFwic3BhblwiLCBudWxsLCBob2lzdGVkNylcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJzcGFuXCIpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZzby5pc0RpcmVjdG9yeSAmJiBmc28uZXhwYW5kZWQpIHtcbiAgICAgICAgICAvLyBzb3J0XG4gICAgICAgICAgICAgICAgICAgIGZzby5jaGlsZHJlbi5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoYS5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGIuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEubmFtZS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgPCBiLm5hbWUudG9Mb3dlckNhc2UoKSA/IC0xIDogMVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChiLmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAxXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS5uYW1lLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICA8IGIubmFtZS50b0xvd2VyQ2FzZSgpID8gLTEgOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAvLyByZWN1cnNlXG4gICAgICAgICAgICAgICAgICAgIHRyZWUoZnNvLmNoaWxkcmVuLCBmYWxzZSwgY3VycmVudCwgc2hvd01lbnUsIG9uQ2xpY2spXG4gICAgICAgIH1cbiAgICAgIGVsZW1lbnRDbG9zZShcImxpXCIpXG4gICAgfSwgZGF0YSlcbiAgZWxlbWVudENsb3NlKFwidWxcIilcbn1cbn0pKCk7XG4iLCJmdW5jdGlvbiBoYW5kbGVFcnJvciAoZXJyKSB7XG4gIGNvbnNvbGUuZXJyb3IoZXJyKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgaGFuZGxlRXJyb3I6IGhhbmRsZUVycm9yXG59XG4iLCJ2YXIgZnMgPSByZXF1aXJlKCcuL2ZzJylcbnZhciBjbGllbnQgPSByZXF1aXJlKCcuL2NsaWVudCcpXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpXG52YXIgbm9pZGUgPSByZXF1aXJlKCcuL25vaWRlJylcblxuZnVuY3Rpb24gd2F0Y2ggKCkge1xuICBmdW5jdGlvbiBoYW5kbGVFcnJvciAoZXJyKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgcmV0dXJuIHV0aWwuaGFuZGxlRXJyb3IoZXJyKVxuICAgIH1cbiAgfVxuXG4gIC8vIFN1YnNjcmliZSB0byB3YXRjaGVkIGZpbGUgY2hhbmdlc1xuICAvLyB0aGF0IGhhcHBlbiBvbiB0aGUgZmlsZSBzeXN0ZW1cbiAgLy8gUmVsb2FkIHRoZSBzZXNzaW9uIGlmIHRoZSBjaGFuZ2VzXG4gIC8vIGRvIG5vdCBtYXRjaCB0aGUgc3RhdGUgb2YgdGhlIGZpbGVcbiAgY2xpZW50LnN1YnNjcmliZSgnL2ZzL2NoYW5nZScsIGZ1bmN0aW9uIChwYXlsb2FkKSB7XG4gICAgbm9pZGUuc2Vzc2lvbnMuZm9yRWFjaChmdW5jdGlvbiAoc2Vzc2lvbikge1xuICAgICAgdmFyIGZpbGUgPSBzZXNzaW9uLmZpbGVcbiAgICAgIGlmIChwYXlsb2FkLnBhdGggPT09IGZpbGUucGF0aCkge1xuICAgICAgICBpZiAocGF5bG9hZC5zdGF0Lm10aW1lICE9PSBmaWxlLnN0YXQubXRpbWUpIHtcbiAgICAgICAgICBmcy5yZWFkRmlsZShmaWxlLnBhdGgsIGZ1bmN0aW9uIChlcnIsIHBheWxvYWQpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHV0aWwuaGFuZGxlRXJyb3IoZXJyKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmlsZS5zdGF0ID0gcGF5bG9hZC5zdGF0XG4gICAgICAgICAgICBzZXNzaW9uLnNldFZhbHVlKHBheWxvYWQuY29udGVudHMsIHRydWUpXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gIH0sIGhhbmRsZUVycm9yKVxuXG4gIGNsaWVudC5zdWJzY3JpYmUoJy9mcy9hZGQnLCBmdW5jdGlvbiAocGF5bG9hZCkge1xuICAgIG5vaWRlLmFkZEZpbGUocGF5bG9hZClcbiAgfSwgaGFuZGxlRXJyb3IpXG5cbiAgY2xpZW50LnN1YnNjcmliZSgnL2ZzL2FkZERpcicsIGZ1bmN0aW9uIChwYXlsb2FkKSB7XG4gICAgbm9pZGUuYWRkRmlsZShwYXlsb2FkKVxuICB9LCBoYW5kbGVFcnJvcilcblxuICBjbGllbnQuc3Vic2NyaWJlKCcvZnMvdW5saW5rJywgZnVuY3Rpb24gKHBheWxvYWQpIHtcbiAgICB2YXIgZmlsZSA9IG5vaWRlLmdldEZpbGUocGF5bG9hZC5yZWxhdGl2ZVBhdGgpXG4gICAgaWYgKGZpbGUpIHtcbiAgICAgIG5vaWRlLnJlbW92ZUZpbGUoZmlsZSlcbiAgICB9XG4gIH0sIGhhbmRsZUVycm9yKVxuXG4gIGNsaWVudC5zdWJzY3JpYmUoJy9mcy91bmxpbmtEaXInLCBmdW5jdGlvbiAocGF5bG9hZCkge1xuICAgIHZhciBmaWxlID0gbm9pZGUuZ2V0RmlsZShwYXlsb2FkLnJlbGF0aXZlUGF0aClcbiAgICBpZiAoZmlsZSkge1xuICAgICAgbm9pZGUucmVtb3ZlRmlsZShmaWxlKVxuICAgIH1cbiAgfSwgaGFuZGxlRXJyb3IpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gd2F0Y2hcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnbWluaW1pc3QnKShwcm9jZXNzLmFyZ3Yuc2xpY2UoMikpXG4iLCJ2YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxudmFyIGFyZ3YgPSByZXF1aXJlKCcuL2FyZ3YnKVxuXG52YXIgY29uZmlnID0ge1xuICBhY2U6IHtcbiAgICB0YWJTaXplOiAyLFxuICAgIGZvbnRTaXplOiAxMixcbiAgICB0aGVtZTogJ21vbm9rYWknLFxuICAgIHVzZVNvZnRUYWJzOiB0cnVlXG4gIH1cbn1cblxuaWYgKGFyZ3YuY2xpZW50KSB7XG4gIGNvbmZpZyA9IHJlcXVpcmUocGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksIGFyZ3YuY2xpZW50KSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjb25maWdcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgdG9TdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG52YXIgaXNBcnJheSA9IGZ1bmN0aW9uIGlzQXJyYXkoYXJyKSB7XG5cdGlmICh0eXBlb2YgQXJyYXkuaXNBcnJheSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHJldHVybiBBcnJheS5pc0FycmF5KGFycik7XG5cdH1cblxuXHRyZXR1cm4gdG9TdHIuY2FsbChhcnIpID09PSAnW29iamVjdCBBcnJheV0nO1xufTtcblxudmFyIGlzUGxhaW5PYmplY3QgPSBmdW5jdGlvbiBpc1BsYWluT2JqZWN0KG9iaikge1xuXHRpZiAoIW9iaiB8fCB0b1N0ci5jYWxsKG9iaikgIT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0dmFyIGhhc093bkNvbnN0cnVjdG9yID0gaGFzT3duLmNhbGwob2JqLCAnY29uc3RydWN0b3InKTtcblx0dmFyIGhhc0lzUHJvdG90eXBlT2YgPSBvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLnByb3RvdHlwZSAmJiBoYXNPd24uY2FsbChvYmouY29uc3RydWN0b3IucHJvdG90eXBlLCAnaXNQcm90b3R5cGVPZicpO1xuXHQvLyBOb3Qgb3duIGNvbnN0cnVjdG9yIHByb3BlcnR5IG11c3QgYmUgT2JqZWN0XG5cdGlmIChvYmouY29uc3RydWN0b3IgJiYgIWhhc093bkNvbnN0cnVjdG9yICYmICFoYXNJc1Byb3RvdHlwZU9mKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0Ly8gT3duIHByb3BlcnRpZXMgYXJlIGVudW1lcmF0ZWQgZmlyc3RseSwgc28gdG8gc3BlZWQgdXAsXG5cdC8vIGlmIGxhc3Qgb25lIGlzIG93biwgdGhlbiBhbGwgcHJvcGVydGllcyBhcmUgb3duLlxuXHR2YXIga2V5O1xuXHRmb3IgKGtleSBpbiBvYmopIHsvKiovfVxuXG5cdHJldHVybiB0eXBlb2Yga2V5ID09PSAndW5kZWZpbmVkJyB8fCBoYXNPd24uY2FsbChvYmosIGtleSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGV4dGVuZCgpIHtcblx0dmFyIG9wdGlvbnMsIG5hbWUsIHNyYywgY29weSwgY29weUlzQXJyYXksIGNsb25lLFxuXHRcdHRhcmdldCA9IGFyZ3VtZW50c1swXSxcblx0XHRpID0gMSxcblx0XHRsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoLFxuXHRcdGRlZXAgPSBmYWxzZTtcblxuXHQvLyBIYW5kbGUgYSBkZWVwIGNvcHkgc2l0dWF0aW9uXG5cdGlmICh0eXBlb2YgdGFyZ2V0ID09PSAnYm9vbGVhbicpIHtcblx0XHRkZWVwID0gdGFyZ2V0O1xuXHRcdHRhcmdldCA9IGFyZ3VtZW50c1sxXSB8fCB7fTtcblx0XHQvLyBza2lwIHRoZSBib29sZWFuIGFuZCB0aGUgdGFyZ2V0XG5cdFx0aSA9IDI7XG5cdH0gZWxzZSBpZiAoKHR5cGVvZiB0YXJnZXQgIT09ICdvYmplY3QnICYmIHR5cGVvZiB0YXJnZXQgIT09ICdmdW5jdGlvbicpIHx8IHRhcmdldCA9PSBudWxsKSB7XG5cdFx0dGFyZ2V0ID0ge307XG5cdH1cblxuXHRmb3IgKDsgaSA8IGxlbmd0aDsgKytpKSB7XG5cdFx0b3B0aW9ucyA9IGFyZ3VtZW50c1tpXTtcblx0XHQvLyBPbmx5IGRlYWwgd2l0aCBub24tbnVsbC91bmRlZmluZWQgdmFsdWVzXG5cdFx0aWYgKG9wdGlvbnMgIT0gbnVsbCkge1xuXHRcdFx0Ly8gRXh0ZW5kIHRoZSBiYXNlIG9iamVjdFxuXHRcdFx0Zm9yIChuYW1lIGluIG9wdGlvbnMpIHtcblx0XHRcdFx0c3JjID0gdGFyZ2V0W25hbWVdO1xuXHRcdFx0XHRjb3B5ID0gb3B0aW9uc1tuYW1lXTtcblxuXHRcdFx0XHQvLyBQcmV2ZW50IG5ldmVyLWVuZGluZyBsb29wXG5cdFx0XHRcdGlmICh0YXJnZXQgIT09IGNvcHkpIHtcblx0XHRcdFx0XHQvLyBSZWN1cnNlIGlmIHdlJ3JlIG1lcmdpbmcgcGxhaW4gb2JqZWN0cyBvciBhcnJheXNcblx0XHRcdFx0XHRpZiAoZGVlcCAmJiBjb3B5ICYmIChpc1BsYWluT2JqZWN0KGNvcHkpIHx8IChjb3B5SXNBcnJheSA9IGlzQXJyYXkoY29weSkpKSkge1xuXHRcdFx0XHRcdFx0aWYgKGNvcHlJc0FycmF5KSB7XG5cdFx0XHRcdFx0XHRcdGNvcHlJc0FycmF5ID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdGNsb25lID0gc3JjICYmIGlzQXJyYXkoc3JjKSA/IHNyYyA6IFtdO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0Y2xvbmUgPSBzcmMgJiYgaXNQbGFpbk9iamVjdChzcmMpID8gc3JjIDoge307XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8vIE5ldmVyIG1vdmUgb3JpZ2luYWwgb2JqZWN0cywgY2xvbmUgdGhlbVxuXHRcdFx0XHRcdFx0dGFyZ2V0W25hbWVdID0gZXh0ZW5kKGRlZXAsIGNsb25lLCBjb3B5KTtcblxuXHRcdFx0XHRcdC8vIERvbid0IGJyaW5nIGluIHVuZGVmaW5lZCB2YWx1ZXNcblx0XHRcdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBjb3B5ICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0XHRcdFx0dGFyZ2V0W25hbWVdID0gY29weTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvLyBSZXR1cm4gdGhlIG1vZGlmaWVkIG9iamVjdFxuXHRyZXR1cm4gdGFyZ2V0O1xufTtcblxuIiwiXG4vKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4gKiBBIGNhY2hlZCByZWZlcmVuY2UgdG8gdGhlIGhhc093blByb3BlcnR5IGZ1bmN0aW9uLlxuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIEEgY2FjaGVkIHJlZmVyZW5jZSB0byB0aGUgY3JlYXRlIGZ1bmN0aW9uLlxuICovXG52YXIgY3JlYXRlID0gT2JqZWN0LmNyZWF0ZTtcblxuLyoqXG4gKiBVc2VkIHRvIHByZXZlbnQgcHJvcGVydHkgY29sbGlzaW9ucyBiZXR3ZWVuIG91ciBcIm1hcFwiIGFuZCBpdHMgcHJvdG90eXBlLlxuICogQHBhcmFtIHshT2JqZWN0PHN0cmluZywgKj59IG1hcCBUaGUgbWFwIHRvIGNoZWNrLlxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5IFRoZSBwcm9wZXJ0eSB0byBjaGVjay5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgbWFwIGhhcyBwcm9wZXJ0eS5cbiAqL1xudmFyIGhhcyA9IGZ1bmN0aW9uIChtYXAsIHByb3BlcnR5KSB7XG4gIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG1hcCwgcHJvcGVydHkpO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIG1hcCBvYmplY3Qgd2l0aG91dCBhIHByb3RvdHlwZS5cbiAqIEByZXR1cm4geyFPYmplY3R9XG4gKi9cbnZhciBjcmVhdGVNYXAgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBjcmVhdGUobnVsbCk7XG59O1xuXG4vKipcbiAqIEtlZXBzIHRyYWNrIG9mIGluZm9ybWF0aW9uIG5lZWRlZCB0byBwZXJmb3JtIGRpZmZzIGZvciBhIGdpdmVuIERPTSBub2RlLlxuICogQHBhcmFtIHshc3RyaW5nfSBub2RlTmFtZVxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5XG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTm9kZURhdGEobm9kZU5hbWUsIGtleSkge1xuICAvKipcbiAgICogVGhlIGF0dHJpYnV0ZXMgYW5kIHRoZWlyIHZhbHVlcy5cbiAgICogQGNvbnN0IHshT2JqZWN0PHN0cmluZywgKj59XG4gICAqL1xuICB0aGlzLmF0dHJzID0gY3JlYXRlTWFwKCk7XG5cbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzLCB1c2VkIGZvciBxdWlja2x5IGRpZmZpbmcgdGhlXG4gICAqIGluY29tbWluZyBhdHRyaWJ1dGVzIHRvIHNlZSBpZiB0aGUgRE9NIG5vZGUncyBhdHRyaWJ1dGVzIG5lZWQgdG8gYmVcbiAgICogdXBkYXRlZC5cbiAgICogQGNvbnN0IHtBcnJheTwqPn1cbiAgICovXG4gIHRoaXMuYXR0cnNBcnIgPSBbXTtcblxuICAvKipcbiAgICogVGhlIGluY29taW5nIGF0dHJpYnV0ZXMgZm9yIHRoaXMgTm9kZSwgYmVmb3JlIHRoZXkgYXJlIHVwZGF0ZWQuXG4gICAqIEBjb25zdCB7IU9iamVjdDxzdHJpbmcsICo+fVxuICAgKi9cbiAgdGhpcy5uZXdBdHRycyA9IGNyZWF0ZU1hcCgpO1xuXG4gIC8qKlxuICAgKiBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBub2RlLCB1c2VkIHRvIHByZXNlcnZlIERPTSBub2RlcyB3aGVuIHRoZXlcbiAgICogbW92ZSB3aXRoaW4gdGhlaXIgcGFyZW50LlxuICAgKiBAY29uc3RcbiAgICovXG4gIHRoaXMua2V5ID0ga2V5O1xuXG4gIC8qKlxuICAgKiBLZWVwcyB0cmFjayBvZiBjaGlsZHJlbiB3aXRoaW4gdGhpcyBub2RlIGJ5IHRoZWlyIGtleS5cbiAgICogez9PYmplY3Q8c3RyaW5nLCAhRWxlbWVudD59XG4gICAqL1xuICB0aGlzLmtleU1hcCA9IG51bGw7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSBrZXlNYXAgaXMgY3VycmVudGx5IHZhbGlkLlxuICAgKiB7Ym9vbGVhbn1cbiAgICovXG4gIHRoaXMua2V5TWFwVmFsaWQgPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBUaGUgbm9kZSBuYW1lIGZvciB0aGlzIG5vZGUuXG4gICAqIEBjb25zdCB7c3RyaW5nfVxuICAgKi9cbiAgdGhpcy5ub2RlTmFtZSA9IG5vZGVOYW1lO1xuXG4gIC8qKlxuICAgKiBAdHlwZSB7P3N0cmluZ31cbiAgICovXG4gIHRoaXMudGV4dCA9IG51bGw7XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgYSBOb2RlRGF0YSBvYmplY3QgZm9yIGEgTm9kZS5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgVGhlIG5vZGUgdG8gaW5pdGlhbGl6ZSBkYXRhIGZvci5cbiAqIEBwYXJhbSB7c3RyaW5nfSBub2RlTmFtZSBUaGUgbm9kZSBuYW1lIG9mIG5vZGUuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB0aGF0IGlkZW50aWZpZXMgdGhlIG5vZGUuXG4gKiBAcmV0dXJuIHshTm9kZURhdGF9IFRoZSBuZXdseSBpbml0aWFsaXplZCBkYXRhIG9iamVjdFxuICovXG52YXIgaW5pdERhdGEgPSBmdW5jdGlvbiAobm9kZSwgbm9kZU5hbWUsIGtleSkge1xuICB2YXIgZGF0YSA9IG5ldyBOb2RlRGF0YShub2RlTmFtZSwga2V5KTtcbiAgbm9kZVsnX19pbmNyZW1lbnRhbERPTURhdGEnXSA9IGRhdGE7XG4gIHJldHVybiBkYXRhO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIE5vZGVEYXRhIG9iamVjdCBmb3IgYSBOb2RlLCBjcmVhdGluZyBpdCBpZiBuZWNlc3NhcnkuXG4gKlxuICogQHBhcmFtIHtOb2RlfSBub2RlIFRoZSBub2RlIHRvIHJldHJpZXZlIHRoZSBkYXRhIGZvci5cbiAqIEByZXR1cm4geyFOb2RlRGF0YX0gVGhlIE5vZGVEYXRhIGZvciB0aGlzIE5vZGUuXG4gKi9cbnZhciBnZXREYXRhID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgdmFyIGRhdGEgPSBub2RlWydfX2luY3JlbWVudGFsRE9NRGF0YSddO1xuXG4gIGlmICghZGF0YSkge1xuICAgIHZhciBub2RlTmFtZSA9IG5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICB2YXIga2V5ID0gbnVsbDtcblxuICAgIGlmIChub2RlIGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAga2V5ID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ2tleScpO1xuICAgIH1cblxuICAgIGRhdGEgPSBpbml0RGF0YShub2RlLCBub2RlTmFtZSwga2V5KTtcbiAgfVxuXG4gIHJldHVybiBkYXRhO1xufTtcblxuLyoqXG4gKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKiogQGNvbnN0ICovXG52YXIgc3ltYm9scyA9IHtcbiAgZGVmYXVsdDogJ19fZGVmYXVsdCcsXG5cbiAgcGxhY2Vob2xkZXI6ICdfX3BsYWNlaG9sZGVyJ1xufTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHJldHVybiB7c3RyaW5nfHVuZGVmaW5lZH0gVGhlIG5hbWVzcGFjZSB0byB1c2UgZm9yIHRoZSBhdHRyaWJ1dGUuXG4gKi9cbnZhciBnZXROYW1lc3BhY2UgPSBmdW5jdGlvbiAobmFtZSkge1xuICBpZiAobmFtZS5sYXN0SW5kZXhPZigneG1sOicsIDApID09PSAwKSB7XG4gICAgcmV0dXJuICdodHRwOi8vd3d3LnczLm9yZy9YTUwvMTk5OC9uYW1lc3BhY2UnO1xuICB9XG5cbiAgaWYgKG5hbWUubGFzdEluZGV4T2YoJ3hsaW5rOicsIDApID09PSAwKSB7XG4gICAgcmV0dXJuICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJztcbiAgfVxufTtcblxuLyoqXG4gKiBBcHBsaWVzIGFuIGF0dHJpYnV0ZSBvciBwcm9wZXJ0eSB0byBhIGdpdmVuIEVsZW1lbnQuIElmIHRoZSB2YWx1ZSBpcyBudWxsXG4gKiBvciB1bmRlZmluZWQsIGl0IGlzIHJlbW92ZWQgZnJvbSB0aGUgRWxlbWVudC4gT3RoZXJ3aXNlLCB0aGUgdmFsdWUgaXMgc2V0XG4gKiBhcyBhbiBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gKiBAcGFyYW0gez8oYm9vbGVhbnxudW1iZXJ8c3RyaW5nKT19IHZhbHVlIFRoZSBhdHRyaWJ1dGUncyB2YWx1ZS5cbiAqL1xudmFyIGFwcGx5QXR0ciA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICBlbC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGF0dHJOUyA9IGdldE5hbWVzcGFjZShuYW1lKTtcbiAgICBpZiAoYXR0ck5TKSB7XG4gICAgICBlbC5zZXRBdHRyaWJ1dGVOUyhhdHRyTlMsIG5hbWUsIHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWwuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQXBwbGllcyBhIHByb3BlcnR5IHRvIGEgZ2l2ZW4gRWxlbWVudC5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgcHJvcGVydHkncyBuYW1lLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgcHJvcGVydHkncyB2YWx1ZS5cbiAqL1xudmFyIGFwcGx5UHJvcCA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgZWxbbmFtZV0gPSB2YWx1ZTtcbn07XG5cbi8qKlxuICogQXBwbGllcyBhIHN0eWxlIHRvIGFuIEVsZW1lbnQuIE5vIHZlbmRvciBwcmVmaXggZXhwYW5zaW9uIGlzIGRvbmUgZm9yXG4gKiBwcm9wZXJ0eSBuYW1lcy92YWx1ZXMuXG4gKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gKiBAcGFyYW0geyp9IHN0eWxlIFRoZSBzdHlsZSB0byBzZXQuIEVpdGhlciBhIHN0cmluZyBvZiBjc3Mgb3IgYW4gb2JqZWN0XG4gKiAgICAgY29udGFpbmluZyBwcm9wZXJ0eS12YWx1ZSBwYWlycy5cbiAqL1xudmFyIGFwcGx5U3R5bGUgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHN0eWxlKSB7XG4gIGlmICh0eXBlb2Ygc3R5bGUgPT09ICdzdHJpbmcnKSB7XG4gICAgZWwuc3R5bGUuY3NzVGV4dCA9IHN0eWxlO1xuICB9IGVsc2Uge1xuICAgIGVsLnN0eWxlLmNzc1RleHQgPSAnJztcbiAgICB2YXIgZWxTdHlsZSA9IGVsLnN0eWxlO1xuICAgIHZhciBvYmogPSAvKiogQHR5cGUgeyFPYmplY3Q8c3RyaW5nLHN0cmluZz59ICovc3R5bGU7XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xuICAgICAgaWYgKGhhcyhvYmosIHByb3ApKSB7XG4gICAgICAgIGVsU3R5bGVbcHJvcF0gPSBvYmpbcHJvcF07XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgYSBzaW5nbGUgYXR0cmlidXRlIG9uIGFuIEVsZW1lbnQuXG4gKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBhdHRyaWJ1dGUncyB2YWx1ZS4gSWYgdGhlIHZhbHVlIGlzIGFuIG9iamVjdCBvclxuICogICAgIGZ1bmN0aW9uIGl0IGlzIHNldCBvbiB0aGUgRWxlbWVudCwgb3RoZXJ3aXNlLCBpdCBpcyBzZXQgYXMgYW4gSFRNTFxuICogICAgIGF0dHJpYnV0ZS5cbiAqL1xudmFyIGFwcGx5QXR0cmlidXRlVHlwZWQgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuXG4gIGlmICh0eXBlID09PSAnb2JqZWN0JyB8fCB0eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgYXBwbHlQcm9wKGVsLCBuYW1lLCB2YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgYXBwbHlBdHRyKGVsLCBuYW1lLCAvKiogQHR5cGUgez8oYm9vbGVhbnxudW1iZXJ8c3RyaW5nKX0gKi92YWx1ZSk7XG4gIH1cbn07XG5cbi8qKlxuICogQ2FsbHMgdGhlIGFwcHJvcHJpYXRlIGF0dHJpYnV0ZSBtdXRhdG9yIGZvciB0aGlzIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIGF0dHJpYnV0ZSdzIHZhbHVlLlxuICovXG52YXIgdXBkYXRlQXR0cmlidXRlID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICB2YXIgZGF0YSA9IGdldERhdGEoZWwpO1xuICB2YXIgYXR0cnMgPSBkYXRhLmF0dHJzO1xuXG4gIGlmIChhdHRyc1tuYW1lXSA9PT0gdmFsdWUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgbXV0YXRvciA9IGF0dHJpYnV0ZXNbbmFtZV0gfHwgYXR0cmlidXRlc1tzeW1ib2xzLmRlZmF1bHRdO1xuICBtdXRhdG9yKGVsLCBuYW1lLCB2YWx1ZSk7XG5cbiAgYXR0cnNbbmFtZV0gPSB2YWx1ZTtcbn07XG5cbi8qKlxuICogQSBwdWJsaWNseSBtdXRhYmxlIG9iamVjdCB0byBwcm92aWRlIGN1c3RvbSBtdXRhdG9ycyBmb3IgYXR0cmlidXRlcy5cbiAqIEBjb25zdCB7IU9iamVjdDxzdHJpbmcsIGZ1bmN0aW9uKCFFbGVtZW50LCBzdHJpbmcsICopPn1cbiAqL1xudmFyIGF0dHJpYnV0ZXMgPSBjcmVhdGVNYXAoKTtcblxuLy8gU3BlY2lhbCBnZW5lcmljIG11dGF0b3IgdGhhdCdzIGNhbGxlZCBmb3IgYW55IGF0dHJpYnV0ZSB0aGF0IGRvZXMgbm90XG4vLyBoYXZlIGEgc3BlY2lmaWMgbXV0YXRvci5cbmF0dHJpYnV0ZXNbc3ltYm9scy5kZWZhdWx0XSA9IGFwcGx5QXR0cmlidXRlVHlwZWQ7XG5cbmF0dHJpYnV0ZXNbc3ltYm9scy5wbGFjZWhvbGRlcl0gPSBmdW5jdGlvbiAoKSB7fTtcblxuYXR0cmlidXRlc1snc3R5bGUnXSA9IGFwcGx5U3R5bGU7XG5cbi8qKlxuICogR2V0cyB0aGUgbmFtZXNwYWNlIHRvIGNyZWF0ZSBhbiBlbGVtZW50IChvZiBhIGdpdmVuIHRhZykgaW4uXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSB0YWcgdG8gZ2V0IHRoZSBuYW1lc3BhY2UgZm9yLlxuICogQHBhcmFtIHs/Tm9kZX0gcGFyZW50XG4gKiBAcmV0dXJuIHs/c3RyaW5nfSBUaGUgbmFtZXNwYWNlIHRvIGNyZWF0ZSB0aGUgdGFnIGluLlxuICovXG52YXIgZ2V0TmFtZXNwYWNlRm9yVGFnID0gZnVuY3Rpb24gKHRhZywgcGFyZW50KSB7XG4gIGlmICh0YWcgPT09ICdzdmcnKSB7XG4gICAgcmV0dXJuICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG4gIH1cblxuICBpZiAoZ2V0RGF0YShwYXJlbnQpLm5vZGVOYW1lID09PSAnZm9yZWlnbk9iamVjdCcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiBwYXJlbnQubmFtZXNwYWNlVVJJO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIEVsZW1lbnQuXG4gKiBAcGFyYW0ge0RvY3VtZW50fSBkb2MgVGhlIGRvY3VtZW50IHdpdGggd2hpY2ggdG8gY3JlYXRlIHRoZSBFbGVtZW50LlxuICogQHBhcmFtIHs/Tm9kZX0gcGFyZW50XG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSB0YWcgZm9yIHRoZSBFbGVtZW50LlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IEEga2V5IHRvIGlkZW50aWZ5IHRoZSBFbGVtZW50LlxuICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC5cbiAqIEByZXR1cm4geyFFbGVtZW50fVxuICovXG52YXIgY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uIChkb2MsIHBhcmVudCwgdGFnLCBrZXksIHN0YXRpY3MpIHtcbiAgdmFyIG5hbWVzcGFjZSA9IGdldE5hbWVzcGFjZUZvclRhZyh0YWcsIHBhcmVudCk7XG4gIHZhciBlbCA9IHVuZGVmaW5lZDtcblxuICBpZiAobmFtZXNwYWNlKSB7XG4gICAgZWwgPSBkb2MuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgdGFnKTtcbiAgfSBlbHNlIHtcbiAgICBlbCA9IGRvYy5jcmVhdGVFbGVtZW50KHRhZyk7XG4gIH1cblxuICBpbml0RGF0YShlbCwgdGFnLCBrZXkpO1xuXG4gIGlmIChzdGF0aWNzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGF0aWNzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICB1cGRhdGVBdHRyaWJ1dGUoZWwsIC8qKiBAdHlwZSB7IXN0cmluZ30qL3N0YXRpY3NbaV0sIHN0YXRpY3NbaSArIDFdKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZWw7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBUZXh0IE5vZGUuXG4gKiBAcGFyYW0ge0RvY3VtZW50fSBkb2MgVGhlIGRvY3VtZW50IHdpdGggd2hpY2ggdG8gY3JlYXRlIHRoZSBFbGVtZW50LlxuICogQHJldHVybiB7IVRleHR9XG4gKi9cbnZhciBjcmVhdGVUZXh0ID0gZnVuY3Rpb24gKGRvYykge1xuICB2YXIgbm9kZSA9IGRvYy5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gIGluaXREYXRhKG5vZGUsICcjdGV4dCcsIG51bGwpO1xuICByZXR1cm4gbm9kZTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hcHBpbmcgdGhhdCBjYW4gYmUgdXNlZCB0byBsb29rIHVwIGNoaWxkcmVuIHVzaW5nIGEga2V5LlxuICogQHBhcmFtIHs/Tm9kZX0gZWxcbiAqIEByZXR1cm4geyFPYmplY3Q8c3RyaW5nLCAhRWxlbWVudD59IEEgbWFwcGluZyBvZiBrZXlzIHRvIHRoZSBjaGlsZHJlbiBvZiB0aGVcbiAqICAgICBFbGVtZW50LlxuICovXG52YXIgY3JlYXRlS2V5TWFwID0gZnVuY3Rpb24gKGVsKSB7XG4gIHZhciBtYXAgPSBjcmVhdGVNYXAoKTtcbiAgdmFyIGNoaWxkID0gZWwuZmlyc3RFbGVtZW50Q2hpbGQ7XG5cbiAgd2hpbGUgKGNoaWxkKSB7XG4gICAgdmFyIGtleSA9IGdldERhdGEoY2hpbGQpLmtleTtcblxuICAgIGlmIChrZXkpIHtcbiAgICAgIG1hcFtrZXldID0gY2hpbGQ7XG4gICAgfVxuXG4gICAgY2hpbGQgPSBjaGlsZC5uZXh0RWxlbWVudFNpYmxpbmc7XG4gIH1cblxuICByZXR1cm4gbWFwO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIG1hcHBpbmcgb2Yga2V5IHRvIGNoaWxkIG5vZGUgZm9yIGEgZ2l2ZW4gRWxlbWVudCwgY3JlYXRpbmcgaXRcbiAqIGlmIG5lY2Vzc2FyeS5cbiAqIEBwYXJhbSB7P05vZGV9IGVsXG4gKiBAcmV0dXJuIHshT2JqZWN0PHN0cmluZywgIU5vZGU+fSBBIG1hcHBpbmcgb2Yga2V5cyB0byBjaGlsZCBFbGVtZW50c1xuICovXG52YXIgZ2V0S2V5TWFwID0gZnVuY3Rpb24gKGVsKSB7XG4gIHZhciBkYXRhID0gZ2V0RGF0YShlbCk7XG5cbiAgaWYgKCFkYXRhLmtleU1hcCkge1xuICAgIGRhdGEua2V5TWFwID0gY3JlYXRlS2V5TWFwKGVsKTtcbiAgfVxuXG4gIHJldHVybiBkYXRhLmtleU1hcDtcbn07XG5cbi8qKlxuICogUmV0cmlldmVzIGEgY2hpbGQgZnJvbSB0aGUgcGFyZW50IHdpdGggdGhlIGdpdmVuIGtleS5cbiAqIEBwYXJhbSB7P05vZGV9IHBhcmVudFxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5XG4gKiBAcmV0dXJuIHs/Tm9kZX0gVGhlIGNoaWxkIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGtleS5cbiAqL1xudmFyIGdldENoaWxkID0gZnVuY3Rpb24gKHBhcmVudCwga2V5KSB7XG4gIHJldHVybiBrZXkgPyBnZXRLZXlNYXAocGFyZW50KVtrZXldIDogbnVsbDtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXJzIGFuIGVsZW1lbnQgYXMgYmVpbmcgYSBjaGlsZC4gVGhlIHBhcmVudCB3aWxsIGtlZXAgdHJhY2sgb2YgdGhlXG4gKiBjaGlsZCB1c2luZyB0aGUga2V5LiBUaGUgY2hpbGQgY2FuIGJlIHJldHJpZXZlZCB1c2luZyB0aGUgc2FtZSBrZXkgdXNpbmdcbiAqIGdldEtleU1hcC4gVGhlIHByb3ZpZGVkIGtleSBzaG91bGQgYmUgdW5pcXVlIHdpdGhpbiB0aGUgcGFyZW50IEVsZW1lbnQuXG4gKiBAcGFyYW0gez9Ob2RlfSBwYXJlbnQgVGhlIHBhcmVudCBvZiBjaGlsZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgQSBrZXkgdG8gaWRlbnRpZnkgdGhlIGNoaWxkIHdpdGguXG4gKiBAcGFyYW0geyFOb2RlfSBjaGlsZCBUaGUgY2hpbGQgdG8gcmVnaXN0ZXIuXG4gKi9cbnZhciByZWdpc3RlckNoaWxkID0gZnVuY3Rpb24gKHBhcmVudCwga2V5LCBjaGlsZCkge1xuICBnZXRLZXlNYXAocGFyZW50KVtrZXldID0gY2hpbGQ7XG59O1xuXG4vKipcbiAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKiBAY29uc3QgKi9cbnZhciBub3RpZmljYXRpb25zID0ge1xuICAvKipcbiAgICogQ2FsbGVkIGFmdGVyIHBhdGNoIGhhcyBjb21wbGVhdGVkIHdpdGggYW55IE5vZGVzIHRoYXQgaGF2ZSBiZWVuIGNyZWF0ZWRcbiAgICogYW5kIGFkZGVkIHRvIHRoZSBET00uXG4gICAqIEB0eXBlIHs/ZnVuY3Rpb24oQXJyYXk8IU5vZGU+KX1cbiAgICovXG4gIG5vZGVzQ3JlYXRlZDogbnVsbCxcblxuICAvKipcbiAgICogQ2FsbGVkIGFmdGVyIHBhdGNoIGhhcyBjb21wbGVhdGVkIHdpdGggYW55IE5vZGVzIHRoYXQgaGF2ZSBiZWVuIHJlbW92ZWRcbiAgICogZnJvbSB0aGUgRE9NLlxuICAgKiBOb3RlIGl0J3MgYW4gYXBwbGljYXRpb25zIHJlc3BvbnNpYmlsaXR5IHRvIGhhbmRsZSBhbnkgY2hpbGROb2Rlcy5cbiAgICogQHR5cGUgez9mdW5jdGlvbihBcnJheTwhTm9kZT4pfVxuICAgKi9cbiAgbm9kZXNEZWxldGVkOiBudWxsXG59O1xuXG4vKipcbiAqIEtlZXBzIHRyYWNrIG9mIHRoZSBzdGF0ZSBvZiBhIHBhdGNoLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIENvbnRleHQoKSB7XG4gIC8qKlxuICAgKiBAdHlwZSB7KEFycmF5PCFOb2RlPnx1bmRlZmluZWQpfVxuICAgKi9cbiAgdGhpcy5jcmVhdGVkID0gbm90aWZpY2F0aW9ucy5ub2Rlc0NyZWF0ZWQgJiYgW107XG5cbiAgLyoqXG4gICAqIEB0eXBlIHsoQXJyYXk8IU5vZGU+fHVuZGVmaW5lZCl9XG4gICAqL1xuICB0aGlzLmRlbGV0ZWQgPSBub3RpZmljYXRpb25zLm5vZGVzRGVsZXRlZCAmJiBbXTtcbn1cblxuLyoqXG4gKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gKi9cbkNvbnRleHQucHJvdG90eXBlLm1hcmtDcmVhdGVkID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgaWYgKHRoaXMuY3JlYXRlZCkge1xuICAgIHRoaXMuY3JlYXRlZC5wdXNoKG5vZGUpO1xuICB9XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAqL1xuQ29udGV4dC5wcm90b3R5cGUubWFya0RlbGV0ZWQgPSBmdW5jdGlvbiAobm9kZSkge1xuICBpZiAodGhpcy5kZWxldGVkKSB7XG4gICAgdGhpcy5kZWxldGVkLnB1c2gobm9kZSk7XG4gIH1cbn07XG5cbi8qKlxuICogTm90aWZpZXMgYWJvdXQgbm9kZXMgdGhhdCB3ZXJlIGNyZWF0ZWQgZHVyaW5nIHRoZSBwYXRjaCBvcGVhcmF0aW9uLlxuICovXG5Db250ZXh0LnByb3RvdHlwZS5ub3RpZnlDaGFuZ2VzID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5jcmVhdGVkICYmIHRoaXMuY3JlYXRlZC5sZW5ndGggPiAwKSB7XG4gICAgbm90aWZpY2F0aW9ucy5ub2Rlc0NyZWF0ZWQodGhpcy5jcmVhdGVkKTtcbiAgfVxuXG4gIGlmICh0aGlzLmRlbGV0ZWQgJiYgdGhpcy5kZWxldGVkLmxlbmd0aCA+IDApIHtcbiAgICBub3RpZmljYXRpb25zLm5vZGVzRGVsZXRlZCh0aGlzLmRlbGV0ZWQpO1xuICB9XG59O1xuXG4vKipcbiogTWFrZXMgc3VyZSB0aGF0IGtleWVkIEVsZW1lbnQgbWF0Y2hlcyB0aGUgdGFnIG5hbWUgcHJvdmlkZWQuXG4qIEBwYXJhbSB7IXN0cmluZ30gbm9kZU5hbWUgVGhlIG5vZGVOYW1lIG9mIHRoZSBub2RlIHRoYXQgaXMgYmVpbmcgbWF0Y2hlZC5cbiogQHBhcmFtIHtzdHJpbmc9fSB0YWcgVGhlIHRhZyBuYW1lIG9mIHRoZSBFbGVtZW50LlxuKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSBvZiB0aGUgRWxlbWVudC5cbiovXG52YXIgYXNzZXJ0S2V5ZWRUYWdNYXRjaGVzID0gZnVuY3Rpb24gKG5vZGVOYW1lLCB0YWcsIGtleSkge1xuICBpZiAobm9kZU5hbWUgIT09IHRhZykge1xuICAgIHRocm93IG5ldyBFcnJvcignV2FzIGV4cGVjdGluZyBub2RlIHdpdGgga2V5IFwiJyArIGtleSArICdcIiB0byBiZSBhICcgKyB0YWcgKyAnLCBub3QgYSAnICsgbm9kZU5hbWUgKyAnLicpO1xuICB9XG59O1xuXG4vKiogQHR5cGUgez9Db250ZXh0fSAqL1xudmFyIGNvbnRleHQgPSBudWxsO1xuXG4vKiogQHR5cGUgez9Ob2RlfSAqL1xudmFyIGN1cnJlbnROb2RlID0gbnVsbDtcblxuLyoqIEB0eXBlIHs/Tm9kZX0gKi9cbnZhciBjdXJyZW50UGFyZW50ID0gbnVsbDtcblxuLyoqIEB0eXBlIHs/RWxlbWVudHw/RG9jdW1lbnRGcmFnbWVudH0gKi9cbnZhciByb290ID0gbnVsbDtcblxuLyoqIEB0eXBlIHs/RG9jdW1lbnR9ICovXG52YXIgZG9jID0gbnVsbDtcblxuLyoqXG4gKiBSZXR1cm5zIGEgcGF0Y2hlciBmdW5jdGlvbiB0aGF0IHNldHMgdXAgYW5kIHJlc3RvcmVzIGEgcGF0Y2ggY29udGV4dCxcbiAqIHJ1bm5pbmcgdGhlIHJ1biBmdW5jdGlvbiB3aXRoIHRoZSBwcm92aWRlZCBkYXRhLlxuICogQHBhcmFtIHtmdW5jdGlvbigoIUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnQpLCFmdW5jdGlvbihUKSxUPSl9IHJ1blxuICogQHJldHVybiB7ZnVuY3Rpb24oKCFFbGVtZW50fCFEb2N1bWVudEZyYWdtZW50KSwhZnVuY3Rpb24oVCksVD0pfVxuICogQHRlbXBsYXRlIFRcbiAqL1xudmFyIHBhdGNoRmFjdG9yeSA9IGZ1bmN0aW9uIChydW4pIHtcbiAgLyoqXG4gICAqIFRPRE8obW96KTogVGhlc2UgYW5ub3RhdGlvbnMgd29uJ3QgYmUgbmVjZXNzYXJ5IG9uY2Ugd2Ugc3dpdGNoIHRvIENsb3N1cmVcbiAgICogQ29tcGlsZXIncyBuZXcgdHlwZSBpbmZlcmVuY2UuIFJlbW92ZSB0aGVzZSBvbmNlIHRoZSBzd2l0Y2ggaXMgZG9uZS5cbiAgICpcbiAgICogQHBhcmFtIHsoIUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnQpfSBub2RlXG4gICAqIEBwYXJhbSB7IWZ1bmN0aW9uKFQpfSBmblxuICAgKiBAcGFyYW0ge1Q9fSBkYXRhXG4gICAqIEB0ZW1wbGF0ZSBUXG4gICAqL1xuICB2YXIgZiA9IGZ1bmN0aW9uIChub2RlLCBmbiwgZGF0YSkge1xuICAgIHZhciBwcmV2Q29udGV4dCA9IGNvbnRleHQ7XG4gICAgdmFyIHByZXZSb290ID0gcm9vdDtcbiAgICB2YXIgcHJldkRvYyA9IGRvYztcbiAgICB2YXIgcHJldkN1cnJlbnROb2RlID0gY3VycmVudE5vZGU7XG4gICAgdmFyIHByZXZDdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudDtcbiAgICB2YXIgcHJldmlvdXNJbkF0dHJpYnV0ZXMgPSBmYWxzZTtcbiAgICB2YXIgcHJldmlvdXNJblNraXAgPSBmYWxzZTtcblxuICAgIGNvbnRleHQgPSBuZXcgQ29udGV4dCgpO1xuICAgIHJvb3QgPSBub2RlO1xuICAgIGRvYyA9IG5vZGUub3duZXJEb2N1bWVudDtcbiAgICBjdXJyZW50UGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xuXG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gICAgcnVuKG5vZGUsIGZuLCBkYXRhKTtcblxuICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICAgIGNvbnRleHQubm90aWZ5Q2hhbmdlcygpO1xuXG4gICAgY29udGV4dCA9IHByZXZDb250ZXh0O1xuICAgIHJvb3QgPSBwcmV2Um9vdDtcbiAgICBkb2MgPSBwcmV2RG9jO1xuICAgIGN1cnJlbnROb2RlID0gcHJldkN1cnJlbnROb2RlO1xuICAgIGN1cnJlbnRQYXJlbnQgPSBwcmV2Q3VycmVudFBhcmVudDtcbiAgfTtcbiAgcmV0dXJuIGY7XG59O1xuXG4vKipcbiAqIFBhdGNoZXMgdGhlIGRvY3VtZW50IHN0YXJ0aW5nIGF0IG5vZGUgd2l0aCB0aGUgcHJvdmlkZWQgZnVuY3Rpb24uIFRoaXNcbiAqIGZ1bmN0aW9uIG1heSBiZSBjYWxsZWQgZHVyaW5nIGFuIGV4aXN0aW5nIHBhdGNoIG9wZXJhdGlvbi5cbiAqIEBwYXJhbSB7IUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnR9IG5vZGUgVGhlIEVsZW1lbnQgb3IgRG9jdW1lbnRcbiAqICAgICB0byBwYXRjaC5cbiAqIEBwYXJhbSB7IWZ1bmN0aW9uKFQpfSBmbiBBIGZ1bmN0aW9uIGNvbnRhaW5pbmcgZWxlbWVudE9wZW4vZWxlbWVudENsb3NlL2V0Yy5cbiAqICAgICBjYWxscyB0aGF0IGRlc2NyaWJlIHRoZSBET00uXG4gKiBAcGFyYW0ge1Q9fSBkYXRhIEFuIGFyZ3VtZW50IHBhc3NlZCB0byBmbiB0byByZXByZXNlbnQgRE9NIHN0YXRlLlxuICogQHRlbXBsYXRlIFRcbiAqL1xudmFyIHBhdGNoSW5uZXIgPSBwYXRjaEZhY3RvcnkoZnVuY3Rpb24gKG5vZGUsIGZuLCBkYXRhKSB7XG4gIGN1cnJlbnROb2RlID0gbm9kZTtcblxuICBlbnRlck5vZGUoKTtcbiAgZm4oZGF0YSk7XG4gIGV4aXROb2RlKCk7XG5cbiAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxufSk7XG5cbi8qKlxuICogUGF0Y2hlcyBhbiBFbGVtZW50IHdpdGggdGhlIHRoZSBwcm92aWRlZCBmdW5jdGlvbi4gRXhhY3RseSBvbmUgdG9wIGxldmVsXG4gKiBlbGVtZW50IGNhbGwgc2hvdWxkIGJlIG1hZGUgY29ycmVzcG9uZGluZyB0byBgbm9kZWAuXG4gKiBAcGFyYW0geyFFbGVtZW50fSBub2RlIFRoZSBFbGVtZW50IHdoZXJlIHRoZSBwYXRjaCBzaG91bGQgc3RhcnQuXG4gKiBAcGFyYW0geyFmdW5jdGlvbihUKX0gZm4gQSBmdW5jdGlvbiBjb250YWluaW5nIGVsZW1lbnRPcGVuL2VsZW1lbnRDbG9zZS9ldGMuXG4gKiAgICAgY2FsbHMgdGhhdCBkZXNjcmliZSB0aGUgRE9NLiBUaGlzIHNob3VsZCBoYXZlIGF0IG1vc3Qgb25lIHRvcCBsZXZlbFxuICogICAgIGVsZW1lbnQgY2FsbC5cbiAqIEBwYXJhbSB7VD19IGRhdGEgQW4gYXJndW1lbnQgcGFzc2VkIHRvIGZuIHRvIHJlcHJlc2VudCBET00gc3RhdGUuXG4gKiBAdGVtcGxhdGUgVFxuICovXG52YXIgcGF0Y2hPdXRlciA9IHBhdGNoRmFjdG9yeShmdW5jdGlvbiAobm9kZSwgZm4sIGRhdGEpIHtcbiAgY3VycmVudE5vZGUgPSAvKiogQHR5cGUgeyFFbGVtZW50fSAqL3sgbmV4dFNpYmxpbmc6IG5vZGUgfTtcblxuICBmbihkYXRhKTtcblxuICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG59KTtcblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciBvciBub3QgdGhlIGN1cnJlbnQgbm9kZSBtYXRjaGVzIHRoZSBzcGVjaWZpZWQgbm9kZU5hbWUgYW5kXG4gKiBrZXkuXG4gKlxuICogQHBhcmFtIHs/c3RyaW5nfSBub2RlTmFtZSBUaGUgbm9kZU5hbWUgZm9yIHRoaXMgbm9kZS5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBBbiBvcHRpb25hbCBrZXkgdGhhdCBpZGVudGlmaWVzIGEgbm9kZS5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIG5vZGUgbWF0Y2hlcywgZmFsc2Ugb3RoZXJ3aXNlLlxuICovXG52YXIgbWF0Y2hlcyA9IGZ1bmN0aW9uIChub2RlTmFtZSwga2V5KSB7XG4gIHZhciBkYXRhID0gZ2V0RGF0YShjdXJyZW50Tm9kZSk7XG5cbiAgLy8gS2V5IGNoZWNrIGlzIGRvbmUgdXNpbmcgZG91YmxlIGVxdWFscyBhcyB3ZSB3YW50IHRvIHRyZWF0IGEgbnVsbCBrZXkgdGhlXG4gIC8vIHNhbWUgYXMgdW5kZWZpbmVkLiBUaGlzIHNob3VsZCBiZSBva2F5IGFzIHRoZSBvbmx5IHZhbHVlcyBhbGxvd2VkIGFyZVxuICAvLyBzdHJpbmdzLCBudWxsIGFuZCB1bmRlZmluZWQgc28gdGhlID09IHNlbWFudGljcyBhcmUgbm90IHRvbyB3ZWlyZC5cbiAgcmV0dXJuIG5vZGVOYW1lID09PSBkYXRhLm5vZGVOYW1lICYmIGtleSA9PSBkYXRhLmtleTtcbn07XG5cbi8qKlxuICogQWxpZ25zIHRoZSB2aXJ0dWFsIEVsZW1lbnQgZGVmaW5pdGlvbiB3aXRoIHRoZSBhY3R1YWwgRE9NLCBtb3ZpbmcgdGhlXG4gKiBjb3JyZXNwb25kaW5nIERPTSBub2RlIHRvIHRoZSBjb3JyZWN0IGxvY2F0aW9uIG9yIGNyZWF0aW5nIGl0IGlmIG5lY2Vzc2FyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBub2RlTmFtZSBGb3IgYW4gRWxlbWVudCwgdGhpcyBzaG91bGQgYmUgYSB2YWxpZCB0YWcgc3RyaW5nLlxuICogICAgIEZvciBhIFRleHQsIHRoaXMgc2hvdWxkIGJlICN0ZXh0LlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuXG4gKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgRm9yIGFuIEVsZW1lbnQsIHRoaXMgc2hvdWxkIGJlIGFuIGFycmF5IG9mXG4gKiAgICAgbmFtZS12YWx1ZSBwYWlycy5cbiAqL1xudmFyIGFsaWduV2l0aERPTSA9IGZ1bmN0aW9uIChub2RlTmFtZSwga2V5LCBzdGF0aWNzKSB7XG4gIGlmIChjdXJyZW50Tm9kZSAmJiBtYXRjaGVzKG5vZGVOYW1lLCBrZXkpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIG5vZGUgPSB1bmRlZmluZWQ7XG5cbiAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSBub2RlIGhhcyBtb3ZlZCB3aXRoaW4gdGhlIHBhcmVudC5cbiAgaWYgKGtleSkge1xuICAgIG5vZGUgPSBnZXRDaGlsZChjdXJyZW50UGFyZW50LCBrZXkpO1xuICAgIGlmIChub2RlICYmICdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICBhc3NlcnRLZXllZFRhZ01hdGNoZXMoZ2V0RGF0YShub2RlKS5ub2RlTmFtZSwgbm9kZU5hbWUsIGtleSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ3JlYXRlIHRoZSBub2RlIGlmIGl0IGRvZXNuJ3QgZXhpc3QuXG4gIGlmICghbm9kZSkge1xuICAgIGlmIChub2RlTmFtZSA9PT0gJyN0ZXh0Jykge1xuICAgICAgbm9kZSA9IGNyZWF0ZVRleHQoZG9jKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZSA9IGNyZWF0ZUVsZW1lbnQoZG9jLCBjdXJyZW50UGFyZW50LCBub2RlTmFtZSwga2V5LCBzdGF0aWNzKTtcbiAgICB9XG5cbiAgICBpZiAoa2V5KSB7XG4gICAgICByZWdpc3RlckNoaWxkKGN1cnJlbnRQYXJlbnQsIGtleSwgbm9kZSk7XG4gICAgfVxuXG4gICAgY29udGV4dC5tYXJrQ3JlYXRlZChub2RlKTtcbiAgfVxuXG4gIC8vIElmIHRoZSBub2RlIGhhcyBhIGtleSwgcmVtb3ZlIGl0IGZyb20gdGhlIERPTSB0byBwcmV2ZW50IGEgbGFyZ2UgbnVtYmVyXG4gIC8vIG9mIHJlLW9yZGVycyBpbiB0aGUgY2FzZSB0aGF0IGl0IG1vdmVkIGZhciBvciB3YXMgY29tcGxldGVseSByZW1vdmVkLlxuICAvLyBTaW5jZSB3ZSBob2xkIG9uIHRvIGEgcmVmZXJlbmNlIHRocm91Z2ggdGhlIGtleU1hcCwgd2UgY2FuIGFsd2F5cyBhZGQgaXRcbiAgLy8gYmFjay5cbiAgaWYgKGN1cnJlbnROb2RlICYmIGdldERhdGEoY3VycmVudE5vZGUpLmtleSkge1xuICAgIGN1cnJlbnRQYXJlbnQucmVwbGFjZUNoaWxkKG5vZGUsIGN1cnJlbnROb2RlKTtcbiAgICBnZXREYXRhKGN1cnJlbnRQYXJlbnQpLmtleU1hcFZhbGlkID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgY3VycmVudFBhcmVudC5pbnNlcnRCZWZvcmUobm9kZSwgY3VycmVudE5vZGUpO1xuICB9XG5cbiAgY3VycmVudE5vZGUgPSBub2RlO1xufTtcblxuLyoqXG4gKiBDbGVhcnMgb3V0IGFueSB1bnZpc2l0ZWQgTm9kZXMsIGFzIHRoZSBjb3JyZXNwb25kaW5nIHZpcnR1YWwgZWxlbWVudFxuICogZnVuY3Rpb25zIHdlcmUgbmV2ZXIgY2FsbGVkIGZvciB0aGVtLlxuICovXG52YXIgY2xlYXJVbnZpc2l0ZWRET00gPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBub2RlID0gY3VycmVudFBhcmVudDtcbiAgdmFyIGRhdGEgPSBnZXREYXRhKG5vZGUpO1xuICB2YXIga2V5TWFwID0gZGF0YS5rZXlNYXA7XG4gIHZhciBrZXlNYXBWYWxpZCA9IGRhdGEua2V5TWFwVmFsaWQ7XG4gIHZhciBjaGlsZCA9IG5vZGUubGFzdENoaWxkO1xuICB2YXIga2V5ID0gdW5kZWZpbmVkO1xuXG4gIGlmIChjaGlsZCA9PT0gY3VycmVudE5vZGUgJiYga2V5TWFwVmFsaWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoZGF0YS5hdHRyc1tzeW1ib2xzLnBsYWNlaG9sZGVyXSAmJiBub2RlICE9PSByb290KSB7XG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuICAgIHJldHVybjtcbiAgfVxuXG4gIHdoaWxlIChjaGlsZCAhPT0gY3VycmVudE5vZGUpIHtcbiAgICBub2RlLnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgICBjb250ZXh0Lm1hcmtEZWxldGVkKCAvKiogQHR5cGUgeyFOb2RlfSovY2hpbGQpO1xuXG4gICAga2V5ID0gZ2V0RGF0YShjaGlsZCkua2V5O1xuICAgIGlmIChrZXkpIHtcbiAgICAgIGRlbGV0ZSBrZXlNYXBba2V5XTtcbiAgICB9XG4gICAgY2hpbGQgPSBub2RlLmxhc3RDaGlsZDtcbiAgfVxuXG4gIC8vIENsZWFuIHRoZSBrZXlNYXAsIHJlbW92aW5nIGFueSB1bnVzdWVkIGtleXMuXG4gIGlmICgha2V5TWFwVmFsaWQpIHtcbiAgICBmb3IgKGtleSBpbiBrZXlNYXApIHtcbiAgICAgIGNoaWxkID0ga2V5TWFwW2tleV07XG4gICAgICBpZiAoY2hpbGQucGFyZW50Tm9kZSAhPT0gbm9kZSkge1xuICAgICAgICBjb250ZXh0Lm1hcmtEZWxldGVkKGNoaWxkKTtcbiAgICAgICAgZGVsZXRlIGtleU1hcFtrZXldO1xuICAgICAgfVxuICAgIH1cblxuICAgIGRhdGEua2V5TWFwVmFsaWQgPSB0cnVlO1xuICB9XG59O1xuXG4vKipcbiAqIENoYW5nZXMgdG8gdGhlIGZpcnN0IGNoaWxkIG9mIHRoZSBjdXJyZW50IG5vZGUuXG4gKi9cbnZhciBlbnRlck5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50Tm9kZTtcbiAgY3VycmVudE5vZGUgPSBudWxsO1xufTtcblxuLyoqXG4gKiBDaGFuZ2VzIHRvIHRoZSBuZXh0IHNpYmxpbmcgb2YgdGhlIGN1cnJlbnQgbm9kZS5cbiAqL1xudmFyIG5leHROb2RlID0gZnVuY3Rpb24gKCkge1xuICBpZiAoY3VycmVudE5vZGUpIHtcbiAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlLm5leHRTaWJsaW5nO1xuICB9IGVsc2Uge1xuICAgIGN1cnJlbnROb2RlID0gY3VycmVudFBhcmVudC5maXJzdENoaWxkO1xuICB9XG59O1xuXG4vKipcbiAqIENoYW5nZXMgdG8gdGhlIHBhcmVudCBvZiB0aGUgY3VycmVudCBub2RlLCByZW1vdmluZyBhbnkgdW52aXNpdGVkIGNoaWxkcmVuLlxuICovXG52YXIgZXhpdE5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gIGNsZWFyVW52aXNpdGVkRE9NKCk7XG5cbiAgY3VycmVudE5vZGUgPSBjdXJyZW50UGFyZW50O1xuICBjdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudC5wYXJlbnROb2RlO1xufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoYXQgdGhlIGN1cnJlbnQgbm9kZSBpcyBhbiBFbGVtZW50IHdpdGggYSBtYXRjaGluZyB0YWdOYW1lIGFuZFxuICoga2V5LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC4gVGhpcyBjYW4gYmUgYW5cbiAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAqICAgICB3aGVuIGl0ZXJhdGluZyBvdmVyIGFuIGFycmF5IG9mIGl0ZW1zLlxuICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbnZhciBjb3JlRWxlbWVudE9wZW4gPSBmdW5jdGlvbiAodGFnLCBrZXksIHN0YXRpY3MpIHtcbiAgbmV4dE5vZGUoKTtcbiAgYWxpZ25XaXRoRE9NKHRhZywga2V5LCBzdGF0aWNzKTtcbiAgZW50ZXJOb2RlKCk7XG4gIHJldHVybiAoLyoqIEB0eXBlIHshRWxlbWVudH0gKi9jdXJyZW50UGFyZW50XG4gICk7XG59O1xuXG4vKipcbiAqIENsb3NlcyB0aGUgY3VycmVudGx5IG9wZW4gRWxlbWVudCwgcmVtb3ZpbmcgYW55IHVudmlzaXRlZCBjaGlsZHJlbiBpZlxuICogbmVjZXNzYXJ5LlxuICpcbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG52YXIgY29yZUVsZW1lbnRDbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gIGV4aXROb2RlKCk7XG4gIHJldHVybiAoLyoqIEB0eXBlIHshRWxlbWVudH0gKi9jdXJyZW50Tm9kZVxuICApO1xufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoZSBjdXJyZW50IG5vZGUgaXMgYSBUZXh0IG5vZGUgYW5kIGNyZWF0ZXMgYSBUZXh0IG5vZGUgaWYgaXQgaXNcbiAqIG5vdC5cbiAqXG4gKiBAcmV0dXJuIHshVGV4dH0gVGhlIGNvcnJlc3BvbmRpbmcgVGV4dCBOb2RlLlxuICovXG52YXIgY29yZVRleHQgPSBmdW5jdGlvbiAoKSB7XG4gIG5leHROb2RlKCk7XG4gIGFsaWduV2l0aERPTSgnI3RleHQnLCBudWxsLCBudWxsKTtcbiAgcmV0dXJuICgvKiogQHR5cGUgeyFUZXh0fSAqL2N1cnJlbnROb2RlXG4gICk7XG59O1xuXG4vKipcbiAqIEdldHMgdGhlIGN1cnJlbnQgRWxlbWVudCBiZWluZyBwYXRjaGVkLlxuICogQHJldHVybiB7IUVsZW1lbnR9XG4gKi9cbnZhciBjdXJyZW50RWxlbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuICByZXR1cm4gKC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovY3VycmVudFBhcmVudFxuICApO1xufTtcblxuLyoqXG4gKiBTa2lwcyB0aGUgY2hpbGRyZW4gaW4gYSBzdWJ0cmVlLCBhbGxvd2luZyBhbiBFbGVtZW50IHRvIGJlIGNsb3NlZCB3aXRob3V0XG4gKiBjbGVhcmluZyBvdXQgdGhlIGNoaWxkcmVuLlxuICovXG52YXIgc2tpcCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuICBjdXJyZW50Tm9kZSA9IGN1cnJlbnRQYXJlbnQubGFzdENoaWxkO1xufTtcblxuLyoqXG4gKiBUaGUgb2Zmc2V0IGluIHRoZSB2aXJ0dWFsIGVsZW1lbnQgZGVjbGFyYXRpb24gd2hlcmUgdGhlIGF0dHJpYnV0ZXMgYXJlXG4gKiBzcGVjaWZpZWQuXG4gKiBAY29uc3RcbiAqL1xudmFyIEFUVFJJQlVURVNfT0ZGU0VUID0gMztcblxuLyoqXG4gKiBCdWlsZHMgYW4gYXJyYXkgb2YgYXJndW1lbnRzIGZvciB1c2Ugd2l0aCBlbGVtZW50T3BlblN0YXJ0LCBhdHRyIGFuZFxuICogZWxlbWVudE9wZW5FbmQuXG4gKiBAY29uc3Qge0FycmF5PCo+fVxuICovXG52YXIgYXJnc0J1aWxkZXIgPSBbXTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gKiAgICAgd2hlbiBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBvZiBpdGVtcy5cbiAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICogICAgIEVsZW1lbnQgaXMgY3JlYXRlZC5cbiAqIEBwYXJhbSB7Li4uKn0gY29uc3RfYXJncyBBdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGUgZHluYW1pYyBhdHRyaWJ1dGVzXG4gKiAgICAgZm9yIHRoZSBFbGVtZW50LlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbnZhciBlbGVtZW50T3BlbiA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcywgY29uc3RfYXJncykge1xuICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgdmFyIG5vZGUgPSBjb3JlRWxlbWVudE9wZW4odGFnLCBrZXksIHN0YXRpY3MpO1xuICB2YXIgZGF0YSA9IGdldERhdGEobm9kZSk7XG5cbiAgLypcbiAgICogQ2hlY2tzIHRvIHNlZSBpZiBvbmUgb3IgbW9yZSBhdHRyaWJ1dGVzIGhhdmUgY2hhbmdlZCBmb3IgYSBnaXZlbiBFbGVtZW50LlxuICAgKiBXaGVuIG5vIGF0dHJpYnV0ZXMgaGF2ZSBjaGFuZ2VkLCB0aGlzIGlzIG11Y2ggZmFzdGVyIHRoYW4gY2hlY2tpbmcgZWFjaFxuICAgKiBpbmRpdmlkdWFsIGFyZ3VtZW50LiBXaGVuIGF0dHJpYnV0ZXMgaGF2ZSBjaGFuZ2VkLCB0aGUgb3ZlcmhlYWQgb2YgdGhpcyBpc1xuICAgKiBtaW5pbWFsLlxuICAgKi9cbiAgdmFyIGF0dHJzQXJyID0gZGF0YS5hdHRyc0FycjtcbiAgdmFyIG5ld0F0dHJzID0gZGF0YS5uZXdBdHRycztcbiAgdmFyIGF0dHJzQ2hhbmdlZCA9IGZhbHNlO1xuICB2YXIgaSA9IEFUVFJJQlVURVNfT0ZGU0VUO1xuICB2YXIgaiA9IDA7XG5cbiAgZm9yICg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDEsIGogKz0gMSkge1xuICAgIGlmIChhdHRyc0FycltqXSAhPT0gYXJndW1lbnRzW2ldKSB7XG4gICAgICBhdHRyc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgZm9yICg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDEsIGogKz0gMSkge1xuICAgIGF0dHJzQXJyW2pdID0gYXJndW1lbnRzW2ldO1xuICB9XG5cbiAgaWYgKGogPCBhdHRyc0Fyci5sZW5ndGgpIHtcbiAgICBhdHRyc0NoYW5nZWQgPSB0cnVlO1xuICAgIGF0dHJzQXJyLmxlbmd0aCA9IGo7XG4gIH1cblxuICAvKlxuICAgKiBBY3R1YWxseSBwZXJmb3JtIHRoZSBhdHRyaWJ1dGUgdXBkYXRlLlxuICAgKi9cbiAgaWYgKGF0dHJzQ2hhbmdlZCkge1xuICAgIGZvciAoaSA9IEFUVFJJQlVURVNfT0ZGU0VUOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBuZXdBdHRyc1thcmd1bWVudHNbaV1dID0gYXJndW1lbnRzW2kgKyAxXTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBfYXR0ciBpbiBuZXdBdHRycykge1xuICAgICAgdXBkYXRlQXR0cmlidXRlKG5vZGUsIF9hdHRyLCBuZXdBdHRyc1tfYXR0cl0pO1xuICAgICAgbmV3QXR0cnNbX2F0dHJdID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBub2RlO1xufTtcblxuLyoqXG4gKiBEZWNsYXJlcyBhIHZpcnR1YWwgRWxlbWVudCBhdCB0aGUgY3VycmVudCBsb2NhdGlvbiBpbiB0aGUgZG9jdW1lbnQuIFRoaXNcbiAqIGNvcnJlc3BvbmRzIHRvIGFuIG9wZW5pbmcgdGFnIGFuZCBhIGVsZW1lbnRDbG9zZSB0YWcgaXMgcmVxdWlyZWQuIFRoaXMgaXNcbiAqIGxpa2UgZWxlbWVudE9wZW4sIGJ1dCB0aGUgYXR0cmlidXRlcyBhcmUgZGVmaW5lZCB1c2luZyB0aGUgYXR0ciBmdW5jdGlvblxuICogcmF0aGVyIHRoYW4gYmVpbmcgcGFzc2VkIGFzIGFyZ3VtZW50cy4gTXVzdCBiZSBmb2xsbG93ZWQgYnkgMCBvciBtb3JlIGNhbGxzXG4gKiB0byBhdHRyLCB0aGVuIGEgY2FsbCB0byBlbGVtZW50T3BlbkVuZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC4gVGhpcyBjYW4gYmUgYW5cbiAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAqICAgICB3aGVuIGl0ZXJhdGluZyBvdmVyIGFuIGFycmF5IG9mIGl0ZW1zLlxuICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICovXG52YXIgZWxlbWVudE9wZW5TdGFydCA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcykge1xuICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgYXJnc0J1aWxkZXJbMF0gPSB0YWc7XG4gIGFyZ3NCdWlsZGVyWzFdID0ga2V5O1xuICBhcmdzQnVpbGRlclsyXSA9IHN0YXRpY3M7XG59O1xuXG4vKioqXG4gKiBEZWZpbmVzIGEgdmlydHVhbCBhdHRyaWJ1dGUgYXQgdGhpcyBwb2ludCBvZiB0aGUgRE9NLiBUaGlzIGlzIG9ubHkgdmFsaWRcbiAqIHdoZW4gY2FsbGVkIGJldHdlZW4gZWxlbWVudE9wZW5TdGFydCBhbmQgZWxlbWVudE9wZW5FbmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7Kn0gdmFsdWVcbiAqL1xudmFyIGF0dHIgPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gIGFyZ3NCdWlsZGVyLnB1c2gobmFtZSwgdmFsdWUpO1xufTtcblxuLyoqXG4gKiBDbG9zZXMgYW4gb3BlbiB0YWcgc3RhcnRlZCB3aXRoIGVsZW1lbnRPcGVuU3RhcnQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xudmFyIGVsZW1lbnRPcGVuRW5kID0gZnVuY3Rpb24gKCkge1xuICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgdmFyIG5vZGUgPSBlbGVtZW50T3Blbi5hcHBseShudWxsLCBhcmdzQnVpbGRlcik7XG4gIGFyZ3NCdWlsZGVyLmxlbmd0aCA9IDA7XG4gIHJldHVybiBub2RlO1xufTtcblxuLyoqXG4gKiBDbG9zZXMgYW4gb3BlbiB2aXJ0dWFsIEVsZW1lbnQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG52YXIgZWxlbWVudENsb3NlID0gZnVuY3Rpb24gKHRhZykge1xuICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgdmFyIG5vZGUgPSBjb3JlRWxlbWVudENsb3NlKCk7XG5cbiAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gIHJldHVybiBub2RlO1xufTtcblxuLyoqXG4gKiBEZWNsYXJlcyBhIHZpcnR1YWwgRWxlbWVudCBhdCB0aGUgY3VycmVudCBsb2NhdGlvbiBpbiB0aGUgZG9jdW1lbnQgdGhhdCBoYXNcbiAqIG5vIGNoaWxkcmVuLlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICogICAgIGVtcHR5IHN0cmluZywgYnV0IHBlcmZvcm1hbmNlIG1heSBiZSBiZXR0ZXIgaWYgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZFxuICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gKiBAcGFyYW0gey4uLip9IGNvbnN0X2FyZ3MgQXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlIGR5bmFtaWMgYXR0cmlidXRlc1xuICogICAgIGZvciB0aGUgRWxlbWVudC5cbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG52YXIgZWxlbWVudFZvaWQgPSBmdW5jdGlvbiAodGFnLCBrZXksIHN0YXRpY3MsIGNvbnN0X2FyZ3MpIHtcbiAgZWxlbWVudE9wZW4uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgcmV0dXJuIGVsZW1lbnRDbG9zZSh0YWcpO1xufTtcblxuLyoqXG4gKiBEZWNsYXJlcyBhIHZpcnR1YWwgRWxlbWVudCBhdCB0aGUgY3VycmVudCBsb2NhdGlvbiBpbiB0aGUgZG9jdW1lbnQgdGhhdCBpcyBhXG4gKiBwbGFjZWhvbGRlciBlbGVtZW50LiBDaGlsZHJlbiBvZiB0aGlzIEVsZW1lbnQgY2FuIGJlIG1hbnVhbGx5IG1hbmFnZWQgYW5kXG4gKiB3aWxsIG5vdCBiZSBjbGVhcmVkIGJ5IHRoZSBsaWJyYXJ5LlxuICpcbiAqIEEga2V5IG11c3QgYmUgc3BlY2lmaWVkIHRvIG1ha2Ugc3VyZSB0aGF0IHRoaXMgbm9kZSBpcyBjb3JyZWN0bHkgcHJlc2VydmVkXG4gKiBhY3Jvc3MgYWxsIGNvbmRpdGlvbmFscy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LlxuICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICogQHBhcmFtIHsuLi4qfSBjb25zdF9hcmdzIEF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZSBkeW5hbWljIGF0dHJpYnV0ZXNcbiAqICAgICBmb3IgdGhlIEVsZW1lbnQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xudmFyIGVsZW1lbnRQbGFjZWhvbGRlciA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcywgY29uc3RfYXJncykge1xuICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgZWxlbWVudE9wZW4uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgc2tpcCgpO1xuICByZXR1cm4gZWxlbWVudENsb3NlKHRhZyk7XG59O1xuXG4vKipcbiAqIERlY2xhcmVzIGEgdmlydHVhbCBUZXh0IGF0IHRoaXMgcG9pbnQgaW4gdGhlIGRvY3VtZW50LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcnxib29sZWFufSB2YWx1ZSBUaGUgdmFsdWUgb2YgdGhlIFRleHQuXG4gKiBAcGFyYW0gey4uLihmdW5jdGlvbigoc3RyaW5nfG51bWJlcnxib29sZWFuKSk6c3RyaW5nKX0gY29uc3RfYXJnc1xuICogICAgIEZ1bmN0aW9ucyB0byBmb3JtYXQgdGhlIHZhbHVlIHdoaWNoIGFyZSBjYWxsZWQgb25seSB3aGVuIHRoZSB2YWx1ZSBoYXNcbiAqICAgICBjaGFuZ2VkLlxuICogQHJldHVybiB7IVRleHR9IFRoZSBjb3JyZXNwb25kaW5nIHRleHQgbm9kZS5cbiAqL1xudmFyIHRleHQgPSBmdW5jdGlvbiAodmFsdWUsIGNvbnN0X2FyZ3MpIHtcbiAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gIHZhciBub2RlID0gY29yZVRleHQoKTtcbiAgdmFyIGRhdGEgPSBnZXREYXRhKG5vZGUpO1xuXG4gIGlmIChkYXRhLnRleHQgIT09IHZhbHVlKSB7XG4gICAgZGF0YS50ZXh0ID0gLyoqIEB0eXBlIHtzdHJpbmd9ICovdmFsdWU7XG5cbiAgICB2YXIgZm9ybWF0dGVkID0gdmFsdWU7XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIC8qXG4gICAgICAgKiBDYWxsIHRoZSBmb3JtYXR0ZXIgZnVuY3Rpb24gZGlyZWN0bHkgdG8gcHJldmVudCBsZWFraW5nIGFyZ3VtZW50cy5cbiAgICAgICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9nb29nbGUvaW5jcmVtZW50YWwtZG9tL3B1bGwvMjA0I2lzc3VlY29tbWVudC0xNzgyMjM1NzRcbiAgICAgICAqL1xuICAgICAgdmFyIGZuID0gYXJndW1lbnRzW2ldO1xuICAgICAgZm9ybWF0dGVkID0gZm4oZm9ybWF0dGVkKTtcbiAgICB9XG5cbiAgICBub2RlLmRhdGEgPSBmb3JtYXR0ZWQ7XG4gIH1cblxuICByZXR1cm4gbm9kZTtcbn07XG5cbmV4cG9ydHMucGF0Y2ggPSBwYXRjaElubmVyO1xuZXhwb3J0cy5wYXRjaElubmVyID0gcGF0Y2hJbm5lcjtcbmV4cG9ydHMucGF0Y2hPdXRlciA9IHBhdGNoT3V0ZXI7XG5leHBvcnRzLmN1cnJlbnRFbGVtZW50ID0gY3VycmVudEVsZW1lbnQ7XG5leHBvcnRzLnNraXAgPSBza2lwO1xuZXhwb3J0cy5lbGVtZW50Vm9pZCA9IGVsZW1lbnRWb2lkO1xuZXhwb3J0cy5lbGVtZW50T3BlblN0YXJ0ID0gZWxlbWVudE9wZW5TdGFydDtcbmV4cG9ydHMuZWxlbWVudE9wZW5FbmQgPSBlbGVtZW50T3BlbkVuZDtcbmV4cG9ydHMuZWxlbWVudE9wZW4gPSBlbGVtZW50T3BlbjtcbmV4cG9ydHMuZWxlbWVudENsb3NlID0gZWxlbWVudENsb3NlO1xuZXhwb3J0cy5lbGVtZW50UGxhY2Vob2xkZXIgPSBlbGVtZW50UGxhY2Vob2xkZXI7XG5leHBvcnRzLnRleHQgPSB0ZXh0O1xuZXhwb3J0cy5hdHRyID0gYXR0cjtcbmV4cG9ydHMuc3ltYm9scyA9IHN5bWJvbHM7XG5leHBvcnRzLmF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzO1xuZXhwb3J0cy5hcHBseUF0dHIgPSBhcHBseUF0dHI7XG5leHBvcnRzLmFwcGx5UHJvcCA9IGFwcGx5UHJvcDtcbmV4cG9ydHMubm90aWZpY2F0aW9ucyA9IG5vdGlmaWNhdGlvbnM7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluY3JlbWVudGFsLWRvbS1janMuanMubWFwIiwibW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChhcnIpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYXJncywgb3B0cykge1xuICAgIGlmICghb3B0cykgb3B0cyA9IHt9O1xuICAgIFxuICAgIHZhciBmbGFncyA9IHsgYm9vbHMgOiB7fSwgc3RyaW5ncyA6IHt9LCB1bmtub3duRm46IG51bGwgfTtcblxuICAgIGlmICh0eXBlb2Ygb3B0c1sndW5rbm93biddID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGZsYWdzLnVua25vd25GbiA9IG9wdHNbJ3Vua25vd24nXTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9wdHNbJ2Jvb2xlYW4nXSA9PT0gJ2Jvb2xlYW4nICYmIG9wdHNbJ2Jvb2xlYW4nXSkge1xuICAgICAgZmxhZ3MuYWxsQm9vbHMgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBbXS5jb25jYXQob3B0c1snYm9vbGVhbiddKS5maWx0ZXIoQm9vbGVhbikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgZmxhZ3MuYm9vbHNba2V5XSA9IHRydWU7XG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgdmFyIGFsaWFzZXMgPSB7fTtcbiAgICBPYmplY3Qua2V5cyhvcHRzLmFsaWFzIHx8IHt9KS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgYWxpYXNlc1trZXldID0gW10uY29uY2F0KG9wdHMuYWxpYXNba2V5XSk7XG4gICAgICAgIGFsaWFzZXNba2V5XS5mb3JFYWNoKGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICBhbGlhc2VzW3hdID0gW2tleV0uY29uY2F0KGFsaWFzZXNba2V5XS5maWx0ZXIoZnVuY3Rpb24gKHkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geCAhPT0geTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBbXS5jb25jYXQob3B0cy5zdHJpbmcpLmZpbHRlcihCb29sZWFuKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgZmxhZ3Muc3RyaW5nc1trZXldID0gdHJ1ZTtcbiAgICAgICAgaWYgKGFsaWFzZXNba2V5XSkge1xuICAgICAgICAgICAgZmxhZ3Muc3RyaW5nc1thbGlhc2VzW2tleV1dID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICB9KTtcblxuICAgIHZhciBkZWZhdWx0cyA9IG9wdHNbJ2RlZmF1bHQnXSB8fCB7fTtcbiAgICBcbiAgICB2YXIgYXJndiA9IHsgXyA6IFtdIH07XG4gICAgT2JqZWN0LmtleXMoZmxhZ3MuYm9vbHMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBzZXRBcmcoa2V5LCBkZWZhdWx0c1trZXldID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IGRlZmF1bHRzW2tleV0pO1xuICAgIH0pO1xuICAgIFxuICAgIHZhciBub3RGbGFncyA9IFtdO1xuXG4gICAgaWYgKGFyZ3MuaW5kZXhPZignLS0nKSAhPT0gLTEpIHtcbiAgICAgICAgbm90RmxhZ3MgPSBhcmdzLnNsaWNlKGFyZ3MuaW5kZXhPZignLS0nKSsxKTtcbiAgICAgICAgYXJncyA9IGFyZ3Muc2xpY2UoMCwgYXJncy5pbmRleE9mKCctLScpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhcmdEZWZpbmVkKGtleSwgYXJnKSB7XG4gICAgICAgIHJldHVybiAoZmxhZ3MuYWxsQm9vbHMgJiYgL14tLVtePV0rJC8udGVzdChhcmcpKSB8fFxuICAgICAgICAgICAgZmxhZ3Muc3RyaW5nc1trZXldIHx8IGZsYWdzLmJvb2xzW2tleV0gfHwgYWxpYXNlc1trZXldO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldEFyZyAoa2V5LCB2YWwsIGFyZykge1xuICAgICAgICBpZiAoYXJnICYmIGZsYWdzLnVua25vd25GbiAmJiAhYXJnRGVmaW5lZChrZXksIGFyZykpIHtcbiAgICAgICAgICAgIGlmIChmbGFncy51bmtub3duRm4oYXJnKSA9PT0gZmFsc2UpIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB2YWx1ZSA9ICFmbGFncy5zdHJpbmdzW2tleV0gJiYgaXNOdW1iZXIodmFsKVxuICAgICAgICAgICAgPyBOdW1iZXIodmFsKSA6IHZhbFxuICAgICAgICA7XG4gICAgICAgIHNldEtleShhcmd2LCBrZXkuc3BsaXQoJy4nKSwgdmFsdWUpO1xuICAgICAgICBcbiAgICAgICAgKGFsaWFzZXNba2V5XSB8fCBbXSkuZm9yRWFjaChmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgc2V0S2V5KGFyZ3YsIHguc3BsaXQoJy4nKSwgdmFsdWUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRLZXkgKG9iaiwga2V5cywgdmFsdWUpIHtcbiAgICAgICAgdmFyIG8gPSBvYmo7XG4gICAgICAgIGtleXMuc2xpY2UoMCwtMSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICBpZiAob1trZXldID09PSB1bmRlZmluZWQpIG9ba2V5XSA9IHt9O1xuICAgICAgICAgICAgbyA9IG9ba2V5XTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGtleSA9IGtleXNba2V5cy5sZW5ndGggLSAxXTtcbiAgICAgICAgaWYgKG9ba2V5XSA9PT0gdW5kZWZpbmVkIHx8IGZsYWdzLmJvb2xzW2tleV0gfHwgdHlwZW9mIG9ba2V5XSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICBvW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9ba2V5XSkpIHtcbiAgICAgICAgICAgIG9ba2V5XS5wdXNoKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG9ba2V5XSA9IFsgb1trZXldLCB2YWx1ZSBdO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIGFsaWFzSXNCb29sZWFuKGtleSkge1xuICAgICAgcmV0dXJuIGFsaWFzZXNba2V5XS5zb21lKGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgcmV0dXJuIGZsYWdzLmJvb2xzW3hdO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBhcmcgPSBhcmdzW2ldO1xuICAgICAgICBcbiAgICAgICAgaWYgKC9eLS0uKz0vLnRlc3QoYXJnKSkge1xuICAgICAgICAgICAgLy8gVXNpbmcgW1xcc1xcU10gaW5zdGVhZCBvZiAuIGJlY2F1c2UganMgZG9lc24ndCBzdXBwb3J0IHRoZVxuICAgICAgICAgICAgLy8gJ2RvdGFsbCcgcmVnZXggbW9kaWZpZXIuIFNlZTpcbiAgICAgICAgICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEwNjgzMDgvMTMyMTZcbiAgICAgICAgICAgIHZhciBtID0gYXJnLm1hdGNoKC9eLS0oW149XSspPShbXFxzXFxTXSopJC8pO1xuICAgICAgICAgICAgdmFyIGtleSA9IG1bMV07XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBtWzJdO1xuICAgICAgICAgICAgaWYgKGZsYWdzLmJvb2xzW2tleV0pIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICE9PSAnZmFsc2UnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2V0QXJnKGtleSwgdmFsdWUsIGFyZyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoL14tLW5vLS4rLy50ZXN0KGFyZykpIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBhcmcubWF0Y2goL14tLW5vLSguKykvKVsxXTtcbiAgICAgICAgICAgIHNldEFyZyhrZXksIGZhbHNlLCBhcmcpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKC9eLS0uKy8udGVzdChhcmcpKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gYXJnLm1hdGNoKC9eLS0oLispLylbMV07XG4gICAgICAgICAgICB2YXIgbmV4dCA9IGFyZ3NbaSArIDFdO1xuICAgICAgICAgICAgaWYgKG5leHQgIT09IHVuZGVmaW5lZCAmJiAhL14tLy50ZXN0KG5leHQpXG4gICAgICAgICAgICAmJiAhZmxhZ3MuYm9vbHNba2V5XVxuICAgICAgICAgICAgJiYgIWZsYWdzLmFsbEJvb2xzXG4gICAgICAgICAgICAmJiAoYWxpYXNlc1trZXldID8gIWFsaWFzSXNCb29sZWFuKGtleSkgOiB0cnVlKSkge1xuICAgICAgICAgICAgICAgIHNldEFyZyhrZXksIG5leHQsIGFyZyk7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoL14odHJ1ZXxmYWxzZSkkLy50ZXN0KG5leHQpKSB7XG4gICAgICAgICAgICAgICAgc2V0QXJnKGtleSwgbmV4dCA9PT0gJ3RydWUnLCBhcmcpO1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNldEFyZyhrZXksIGZsYWdzLnN0cmluZ3Nba2V5XSA/ICcnIDogdHJ1ZSwgYXJnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICgvXi1bXi1dKy8udGVzdChhcmcpKSB7XG4gICAgICAgICAgICB2YXIgbGV0dGVycyA9IGFyZy5zbGljZSgxLC0xKS5zcGxpdCgnJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBicm9rZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGV0dGVycy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0ID0gYXJnLnNsaWNlKGorMik7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKG5leHQgPT09ICctJykge1xuICAgICAgICAgICAgICAgICAgICBzZXRBcmcobGV0dGVyc1tqXSwgbmV4dCwgYXJnKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKC9bQS1aYS16XS8udGVzdChsZXR0ZXJzW2pdKSAmJiAvPS8udGVzdChuZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRBcmcobGV0dGVyc1tqXSwgbmV4dC5zcGxpdCgnPScpWzFdLCBhcmcpO1xuICAgICAgICAgICAgICAgICAgICBicm9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKC9bQS1aYS16XS8udGVzdChsZXR0ZXJzW2pdKVxuICAgICAgICAgICAgICAgICYmIC8tP1xcZCsoXFwuXFxkKik/KGUtP1xcZCspPyQvLnRlc3QobmV4dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0QXJnKGxldHRlcnNbal0sIG5leHQsIGFyZyk7XG4gICAgICAgICAgICAgICAgICAgIGJyb2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAobGV0dGVyc1tqKzFdICYmIGxldHRlcnNbaisxXS5tYXRjaCgvXFxXLykpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0QXJnKGxldHRlcnNbal0sIGFyZy5zbGljZShqKzIpLCBhcmcpO1xuICAgICAgICAgICAgICAgICAgICBicm9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEFyZyhsZXR0ZXJzW2pdLCBmbGFncy5zdHJpbmdzW2xldHRlcnNbal1dID8gJycgOiB0cnVlLCBhcmcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGtleSA9IGFyZy5zbGljZSgtMSlbMF07XG4gICAgICAgICAgICBpZiAoIWJyb2tlbiAmJiBrZXkgIT09ICctJykge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzW2krMV0gJiYgIS9eKC18LS0pW14tXS8udGVzdChhcmdzW2krMV0pXG4gICAgICAgICAgICAgICAgJiYgIWZsYWdzLmJvb2xzW2tleV1cbiAgICAgICAgICAgICAgICAmJiAoYWxpYXNlc1trZXldID8gIWFsaWFzSXNCb29sZWFuKGtleSkgOiB0cnVlKSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRBcmcoa2V5LCBhcmdzW2krMV0sIGFyZyk7XG4gICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoYXJnc1tpKzFdICYmIC90cnVlfGZhbHNlLy50ZXN0KGFyZ3NbaSsxXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0QXJnKGtleSwgYXJnc1tpKzFdID09PSAndHJ1ZScsIGFyZyk7XG4gICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEFyZyhrZXksIGZsYWdzLnN0cmluZ3Nba2V5XSA/ICcnIDogdHJ1ZSwgYXJnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoIWZsYWdzLnVua25vd25GbiB8fCBmbGFncy51bmtub3duRm4oYXJnKSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBhcmd2Ll8ucHVzaChcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3Muc3RyaW5nc1snXyddIHx8ICFpc051bWJlcihhcmcpID8gYXJnIDogTnVtYmVyKGFyZylcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9wdHMuc3RvcEVhcmx5KSB7XG4gICAgICAgICAgICAgICAgYXJndi5fLnB1c2guYXBwbHkoYXJndi5fLCBhcmdzLnNsaWNlKGkgKyAxKSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgT2JqZWN0LmtleXMoZGVmYXVsdHMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBpZiAoIWhhc0tleShhcmd2LCBrZXkuc3BsaXQoJy4nKSkpIHtcbiAgICAgICAgICAgIHNldEtleShhcmd2LCBrZXkuc3BsaXQoJy4nKSwgZGVmYXVsdHNba2V5XSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIChhbGlhc2VzW2tleV0gfHwgW10pLmZvckVhY2goZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICBzZXRLZXkoYXJndiwgeC5zcGxpdCgnLicpLCBkZWZhdWx0c1trZXldKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgXG4gICAgaWYgKG9wdHNbJy0tJ10pIHtcbiAgICAgICAgYXJndlsnLS0nXSA9IG5ldyBBcnJheSgpO1xuICAgICAgICBub3RGbGFncy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgYXJndlsnLS0nXS5wdXNoKGtleSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgbm90RmxhZ3MuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgIGFyZ3YuXy5wdXNoKGtleSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBhcmd2O1xufTtcblxuZnVuY3Rpb24gaGFzS2V5IChvYmosIGtleXMpIHtcbiAgICB2YXIgbyA9IG9iajtcbiAgICBrZXlzLnNsaWNlKDAsLTEpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBvID0gKG9ba2V5XSB8fCB7fSk7XG4gICAgfSk7XG5cbiAgICB2YXIga2V5ID0ga2V5c1trZXlzLmxlbmd0aCAtIDFdO1xuICAgIHJldHVybiBrZXkgaW4gbztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIgKHgpIHtcbiAgICBpZiAodHlwZW9mIHggPT09ICdudW1iZXInKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoL14weFswLTlhLWZdKyQvaS50ZXN0KHgpKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gL15bLStdPyg/OlxcZCsoPzpcXC5cXGQqKT98XFwuXFxkKykoZVstK10/XFxkKyk/JC8udGVzdCh4KTtcbn1cblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZGlzdC9jbGllbnQnKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLypcbiAgICAoaGFwaSluZXMgV2ViU29ja2V0IENsaWVudCAoaHR0cHM6Ly9naXRodWIuY29tL2hhcGlqcy9uZXMpXG4gICAgQ29weXJpZ2h0IChjKSAyMDE1LCBFcmFuIEhhbW1lciA8ZXJhbkBoYW1tZXIuaW8+IGFuZCBvdGhlciBjb250cmlidXRvcnNcbiAgICBCU0QgTGljZW5zZWRcbiovXG5cbnZhciBfdHlwZW9mID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIgPyBmdW5jdGlvbiAob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9IDogZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9O1xuXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblxuICAgIC8vICRsYWI6Y292ZXJhZ2U6b2ZmJFxuXG4gICAgaWYgKCh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcgPyAndW5kZWZpbmVkJyA6IF90eXBlb2YoZXhwb3J0cykpID09PSAnb2JqZWN0JyAmJiAodHlwZW9mIG1vZHVsZSA9PT0gJ3VuZGVmaW5lZCcgPyAndW5kZWZpbmVkJyA6IF90eXBlb2YobW9kdWxlKSkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpOyAvLyBFeHBvcnQgaWYgdXNlZCBhcyBhIG1vZHVsZVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgICAgICBkZWZpbmUoZmFjdG9yeSk7XG4gICAgICAgIH0gZWxzZSBpZiAoKHR5cGVvZiBleHBvcnRzID09PSAndW5kZWZpbmVkJyA/ICd1bmRlZmluZWQnIDogX3R5cGVvZihleHBvcnRzKSkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBleHBvcnRzLm5lcyA9IGZhY3RvcnkoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJvb3QubmVzID0gZmFjdG9yeSgpO1xuICAgICAgICB9XG5cbiAgICAvLyAkbGFiOmNvdmVyYWdlOm9uJFxufSkodW5kZWZpbmVkLCBmdW5jdGlvbiAoKSB7XG5cbiAgICAvLyBVdGlsaXRpZXNcblxuICAgIHZhciB2ZXJzaW9uID0gJzInO1xuICAgIHZhciBpZ25vcmUgPSBmdW5jdGlvbiBpZ25vcmUoKSB7fTtcblxuICAgIHZhciBwYXJzZSA9IGZ1bmN0aW9uIHBhcnNlKG1lc3NhZ2UsIG5leHQpIHtcblxuICAgICAgICB2YXIgb2JqID0gbnVsbDtcbiAgICAgICAgdmFyIGVycm9yID0gbnVsbDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgb2JqID0gSlNPTi5wYXJzZShtZXNzYWdlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBlcnJvciA9IG5ldyBOZXNFcnJvcihlcnIsICdwcm90b2NvbCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5leHQoZXJyb3IsIG9iaik7XG4gICAgfTtcblxuICAgIHZhciBzdHJpbmdpZnkgPSBmdW5jdGlvbiBzdHJpbmdpZnkobWVzc2FnZSwgbmV4dCkge1xuXG4gICAgICAgIHZhciBzdHJpbmcgPSBudWxsO1xuICAgICAgICB2YXIgZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzdHJpbmcgPSBKU09OLnN0cmluZ2lmeShtZXNzYWdlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBlcnJvciA9IG5ldyBOZXNFcnJvcihlcnIsICd1c2VyJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV4dChlcnJvciwgc3RyaW5nKTtcbiAgICB9O1xuXG4gICAgdmFyIE5lc0Vycm9yID0gZnVuY3Rpb24gTmVzRXJyb3IoZXJyLCB0eXBlKSB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBlcnIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBlcnIgPSBuZXcgRXJyb3IoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVyci50eXBlID0gdHlwZTtcbiAgICAgICAgcmV0dXJuIGVycjtcbiAgICB9O1xuXG4gICAgLy8gRXJyb3IgY29kZXNcblxuICAgIHZhciBlcnJvckNvZGVzID0ge1xuICAgICAgICAxMDAwOiAnTm9ybWFsIGNsb3N1cmUnLFxuICAgICAgICAxMDAxOiAnR29pbmcgYXdheScsXG4gICAgICAgIDEwMDI6ICdQcm90b2NvbCBlcnJvcicsXG4gICAgICAgIDEwMDM6ICdVbnN1cHBvcnRlZCBkYXRhJyxcbiAgICAgICAgMTAwNDogJ1Jlc2VydmVkJyxcbiAgICAgICAgMTAwNTogJ05vIHN0YXR1cyByZWNlaXZlZCcsXG4gICAgICAgIDEwMDY6ICdBYm5vcm1hbCBjbG9zdXJlJyxcbiAgICAgICAgMTAwNzogJ0ludmFsaWQgZnJhbWUgcGF5bG9hZCBkYXRhJyxcbiAgICAgICAgMTAwODogJ1BvbGljeSB2aW9sYXRpb24nLFxuICAgICAgICAxMDA5OiAnTWVzc2FnZSB0b28gYmlnJyxcbiAgICAgICAgMTAxMDogJ01hbmRhdG9yeSBleHRlbnNpb24nLFxuICAgICAgICAxMDExOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyxcbiAgICAgICAgMTAxNTogJ1RMUyBoYW5kc2hha2UnXG4gICAgfTtcblxuICAgIC8vIENsaWVudFxuXG4gICAgdmFyIENsaWVudCA9IGZ1bmN0aW9uIENsaWVudCh1cmwsIG9wdGlvbnMpIHtcblxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAvLyBDb25maWd1cmF0aW9uXG5cbiAgICAgICAgdGhpcy5fdXJsID0gdXJsO1xuICAgICAgICB0aGlzLl9zZXR0aW5ncyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMuX2hlYXJ0YmVhdFRpbWVvdXQgPSBmYWxzZTsgLy8gU2VydmVyIGhlYXJ0YmVhdCBjb25maWd1cmF0aW9uXG5cbiAgICAgICAgLy8gU3RhdGVcblxuICAgICAgICB0aGlzLl93cyA9IG51bGw7XG4gICAgICAgIHRoaXMuX3JlY29ubmVjdGlvbiA9IG51bGw7XG4gICAgICAgIHRoaXMuX2lkcyA9IDA7IC8vIElkIGNvdW50ZXJcbiAgICAgICAgdGhpcy5fcmVxdWVzdHMgPSB7fTsgLy8gaWQgLT4geyBjYWxsYmFjaywgdGltZW91dCB9XG4gICAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSB7fTsgLy8gcGF0aCAtPiBbY2FsbGJhY2tzXVxuICAgICAgICB0aGlzLl9oZWFydGJlYXQgPSBudWxsO1xuXG4gICAgICAgIC8vIEV2ZW50c1xuXG4gICAgICAgIHRoaXMub25FcnJvciA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIH07IC8vIEdlbmVyYWwgZXJyb3IgY2FsbGJhY2sgKG9ubHkgd2hlbiBhbiBlcnJvciBjYW5ub3QgYmUgYXNzb2NpYXRlZCB3aXRoIGEgcmVxdWVzdClcbiAgICAgICAgdGhpcy5vbkNvbm5lY3QgPSBpZ25vcmU7IC8vIENhbGxlZCB3aGVuZXZlciBhIGNvbm5lY3Rpb24gaXMgZXN0YWJsaXNoZWRcbiAgICAgICAgdGhpcy5vbkRpc2Nvbm5lY3QgPSBpZ25vcmU7IC8vIENhbGxlZCB3aGVuZXZlciBhIGNvbm5lY3Rpb24gaXMgbG9zdDogZnVuY3Rpb24od2lsbFJlY29ubmVjdClcbiAgICAgICAgdGhpcy5vblVwZGF0ZSA9IGlnbm9yZTtcblxuICAgICAgICAvLyBQdWJsaWMgcHJvcGVydGllc1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsOyAvLyBBc3NpZ25lZCB3aGVuIGhlbGxvIHJlc3BvbnNlIGlzIHJlY2VpdmVkXG4gICAgfTtcblxuICAgIENsaWVudC5XZWJTb2NrZXQgPSAvKiAkbGFiOmNvdmVyYWdlOm9mZiQgKi90eXBlb2YgV2ViU29ja2V0ID09PSAndW5kZWZpbmVkJyA/IG51bGwgOiBXZWJTb2NrZXQ7IC8qICRsYWI6Y292ZXJhZ2U6b24kICovXG5cbiAgICBDbGllbnQucHJvdG90eXBlLmNvbm5lY3QgPSBmdW5jdGlvbiAob3B0aW9ucywgY2FsbGJhY2spIHtcblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gYXJndW1lbnRzWzBdO1xuICAgICAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMucmVjb25uZWN0ICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgLy8gRGVmYXVsdHMgdG8gdHJ1ZVxuICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uID0geyAvLyBPcHRpb25zOiByZWNvbm5lY3QsIGRlbGF5LCBtYXhEZWxheVxuICAgICAgICAgICAgICAgIHdhaXQ6IDAsXG4gICAgICAgICAgICAgICAgZGVsYXk6IG9wdGlvbnMuZGVsYXkgfHwgMTAwMCwgLy8gMSBzZWNvbmRcbiAgICAgICAgICAgICAgICBtYXhEZWxheTogb3B0aW9ucy5tYXhEZWxheSB8fCA1MDAwLCAvLyA1IHNlY29uZHNcbiAgICAgICAgICAgICAgICByZXRyaWVzOiBvcHRpb25zLnJldHJpZXMgfHwgSW5maW5pdHksIC8vIFVubGltaXRlZFxuICAgICAgICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICAgICAgICAgIGF1dGg6IG9wdGlvbnMuYXV0aCxcbiAgICAgICAgICAgICAgICAgICAgdGltZW91dDogb3B0aW9ucy50aW1lb3V0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3JlY29ubmVjdGlvbiA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jb25uZWN0KG9wdGlvbnMsIHRydWUsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5fY29ubmVjdCA9IGZ1bmN0aW9uIChvcHRpb25zLCBpbml0aWFsLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIHZhciBzZW50Q2FsbGJhY2sgPSBmYWxzZTtcbiAgICAgICAgdmFyIHRpbWVvdXRIYW5kbGVyID0gZnVuY3Rpb24gdGltZW91dEhhbmRsZXIoKSB7XG5cbiAgICAgICAgICAgIHNlbnRDYWxsYmFjayA9IHRydWU7XG4gICAgICAgICAgICBfdGhpcy5fd3MuY2xvc2UoKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBOZXNFcnJvcignQ29ubmVjdGlvbiB0aW1lZCBvdXQnLCAndGltZW91dCcpKTtcbiAgICAgICAgICAgIF90aGlzLl9jbGVhbnVwKCk7XG4gICAgICAgICAgICBpZiAoaW5pdGlhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5fcmVjb25uZWN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHRpbWVvdXQgPSBvcHRpb25zLnRpbWVvdXQgPyBzZXRUaW1lb3V0KHRpbWVvdXRIYW5kbGVyLCBvcHRpb25zLnRpbWVvdXQpIDogbnVsbDtcblxuICAgICAgICB2YXIgd3MgPSBuZXcgQ2xpZW50LldlYlNvY2tldCh0aGlzLl91cmwsIHRoaXMuX3NldHRpbmdzLndzKTsgLy8gU2V0dGluZ3MgdXNlZCBieSBub2RlLmpzIG9ubHlcbiAgICAgICAgdGhpcy5fd3MgPSB3cztcblxuICAgICAgICB3cy5vbm9wZW4gPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblxuICAgICAgICAgICAgaWYgKCFzZW50Q2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBzZW50Q2FsbGJhY2sgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5faGVsbG8ob3B0aW9ucy5hdXRoLCBmdW5jdGlvbiAoZXJyKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5wYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIF90aGlzLl9zdWJzY3JpcHRpb25zW2Vyci5wYXRoXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGlzY29ubmVjdCgpOyAvLyBTdG9wIHJlY29ubmVjdGlvbiB3aGVuIHRoZSBoZWxsbyBtZXNzYWdlIHJldHVybnMgZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgX3RoaXMub25Db25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHdzLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICAgICAgICAgICAgdmFyIGVyciA9IG5ldyBOZXNFcnJvcignU29ja2V0IGVycm9yJywgJ3dzJyk7XG5cbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblxuICAgICAgICAgICAgaWYgKCFzZW50Q2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBzZW50Q2FsbGJhY2sgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gX3RoaXMub25FcnJvcihlcnIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHdzLm9uY2xvc2UgPSBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICAgICAgICAgICAgdmFyIGxvZyA9IHtcbiAgICAgICAgICAgICAgICBjb2RlOiBldmVudC5jb2RlLFxuICAgICAgICAgICAgICAgIGV4cGxhbmF0aW9uOiBlcnJvckNvZGVzW2V2ZW50LmNvZGVdIHx8ICdVbmtub3duJyxcbiAgICAgICAgICAgICAgICByZWFzb246IGV2ZW50LnJlYXNvbixcbiAgICAgICAgICAgICAgICB3YXNDbGVhbjogZXZlbnQud2FzQ2xlYW5cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIF90aGlzLl9jbGVhbnVwKCk7XG4gICAgICAgICAgICBfdGhpcy5vbkRpc2Nvbm5lY3QoISEoX3RoaXMuX3JlY29ubmVjdGlvbiAmJiBfdGhpcy5fcmVjb25uZWN0aW9uLnJldHJpZXMgPj0gMSksIGxvZyk7XG4gICAgICAgICAgICBfdGhpcy5fcmVjb25uZWN0KCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgd3Mub25tZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcblxuICAgICAgICAgICAgcmV0dXJuIF90aGlzLl9vbk1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUuZGlzY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB0aGlzLl9yZWNvbm5lY3Rpb24gPSBudWxsO1xuXG4gICAgICAgIGlmICghdGhpcy5fd3MpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl93cy5yZWFkeVN0YXRlID09PSBDbGllbnQuV2ViU29ja2V0Lk9QRU4gfHwgdGhpcy5fd3MucmVhZHlTdGF0ZSA9PT0gQ2xpZW50LldlYlNvY2tldC5DT05ORUNUSU5HKSB7XG5cbiAgICAgICAgICAgIHRoaXMuX3dzLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5fY2xlYW51cCA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB2YXIgd3MgPSB0aGlzLl93cztcbiAgICAgICAgaWYgKCF3cykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fd3MgPSBudWxsO1xuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgd3Mub25vcGVuID0gbnVsbDtcbiAgICAgICAgd3Mub25jbG9zZSA9IG51bGw7XG4gICAgICAgIHdzLm9uZXJyb3IgPSBpZ25vcmU7XG4gICAgICAgIHdzLm9ubWVzc2FnZSA9IG51bGw7XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2hlYXJ0YmVhdCk7XG5cbiAgICAgICAgLy8gRmx1c2ggcGVuZGluZyByZXF1ZXN0c1xuXG4gICAgICAgIHZhciBlcnJvciA9IG5ldyBOZXNFcnJvcignUmVxdWVzdCBmYWlsZWQgLSBzZXJ2ZXIgZGlzY29ubmVjdGVkJywgJ2Rpc2Nvbm5lY3QnKTtcblxuICAgICAgICB2YXIgaWRzID0gT2JqZWN0LmtleXModGhpcy5fcmVxdWVzdHMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGlkcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdmFyIGlkID0gaWRzW2ldO1xuICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSB0aGlzLl9yZXF1ZXN0c1tpZF07XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSByZXF1ZXN0LmNhbGxiYWNrO1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHJlcXVlc3QudGltZW91dCk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fcmVxdWVzdHNbaWRdO1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyb3IpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUuX3JlY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgICAgLy8gUmVjb25uZWN0XG5cbiAgICAgICAgaWYgKHRoaXMuX3JlY29ubmVjdGlvbikge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3JlY29ubmVjdGlvbi5yZXRyaWVzIDwgMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdCgpOyAvLyBDbGVhciBfcmVjb25uZWN0aW9uIHN0YXRlXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAtLXRoaXMuX3JlY29ubmVjdGlvbi5yZXRyaWVzO1xuICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uLndhaXQgPSB0aGlzLl9yZWNvbm5lY3Rpb24ud2FpdCArIHRoaXMuX3JlY29ubmVjdGlvbi5kZWxheTtcblxuICAgICAgICAgICAgdmFyIHRpbWVvdXQgPSBNYXRoLm1pbih0aGlzLl9yZWNvbm5lY3Rpb24ud2FpdCwgdGhpcy5fcmVjb25uZWN0aW9uLm1heERlbGF5KTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAgICAgaWYgKCFfdGhpczIuX3JlY29ubmVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgX3RoaXMyLl9jb25uZWN0KF90aGlzMi5fcmVjb25uZWN0aW9uLnNldHRpbmdzLCBmYWxzZSwgZnVuY3Rpb24gKGVycikge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzMi5vbkVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpczIuX2NsZWFudXAoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfdGhpczIuX3JlY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLnJlcXVlc3QgPSBmdW5jdGlvbiAob3B0aW9ucywgY2FsbGJhY2spIHtcblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBvcHRpb25zID0ge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgcGF0aDogb3B0aW9uc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgdHlwZTogJ3JlcXVlc3QnLFxuICAgICAgICAgICAgbWV0aG9kOiBvcHRpb25zLm1ldGhvZCB8fCAnR0VUJyxcbiAgICAgICAgICAgIHBhdGg6IG9wdGlvbnMucGF0aCxcbiAgICAgICAgICAgIGhlYWRlcnM6IG9wdGlvbnMuaGVhZGVycyxcbiAgICAgICAgICAgIHBheWxvYWQ6IG9wdGlvbnMucGF5bG9hZFxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9zZW5kKHJlcXVlc3QsIHRydWUsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5tZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UsIGNhbGxiYWNrKSB7XG5cbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XG4gICAgICAgICAgICB0eXBlOiAnbWVzc2FnZScsXG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbmQocmVxdWVzdCwgdHJ1ZSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLl9zZW5kID0gZnVuY3Rpb24gKHJlcXVlc3QsIHRyYWNrLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGlnbm9yZTtcblxuICAgICAgICBpZiAoIXRoaXMuX3dzIHx8IHRoaXMuX3dzLnJlYWR5U3RhdGUgIT09IENsaWVudC5XZWJTb2NrZXQuT1BFTikge1xuXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IE5lc0Vycm9yKCdGYWlsZWQgdG8gc2VuZCBtZXNzYWdlIC0gc2VydmVyIGRpc2Nvbm5lY3RlZCcsICdkaXNjb25uZWN0JykpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVxdWVzdC5pZCA9ICsrdGhpcy5faWRzO1xuXG4gICAgICAgIHN0cmluZ2lmeShyZXF1ZXN0LCBmdW5jdGlvbiAoZXJyLCBlbmNvZGVkKSB7XG5cbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSWdub3JlIGVycm9yc1xuXG4gICAgICAgICAgICBpZiAoIXRyYWNrKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzMy5fd3Muc2VuZChlbmNvZGVkKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBOZXNFcnJvcihlcnIsICd3cycpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRyYWNrIGVycm9yc1xuXG4gICAgICAgICAgICB2YXIgcmVjb3JkID0ge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBjYWxsYmFjayxcbiAgICAgICAgICAgICAgICB0aW1lb3V0OiBudWxsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoX3RoaXMzLl9zZXR0aW5ncy50aW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgcmVjb3JkLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgICAgICAgICByZWNvcmQuY2FsbGJhY2sgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICByZWNvcmQudGltZW91dCA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBOZXNFcnJvcignUmVxdWVzdCB0aW1lZCBvdXQnLCAndGltZW91dCcpKTtcbiAgICAgICAgICAgICAgICB9LCBfdGhpczMuX3NldHRpbmdzLnRpbWVvdXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBfdGhpczMuX3JlcXVlc3RzW3JlcXVlc3QuaWRdID0gcmVjb3JkO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIF90aGlzMy5fd3Muc2VuZChlbmNvZGVkKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpczMuX3JlcXVlc3RzW3JlcXVlc3QuaWRdLnRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBfdGhpczMuX3JlcXVlc3RzW3JlcXVlc3QuaWRdO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgTmVzRXJyb3IoZXJyLCAnd3MnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLl9oZWxsbyA9IGZ1bmN0aW9uIChhdXRoLCBjYWxsYmFjaykge1xuXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgdHlwZTogJ2hlbGxvJyxcbiAgICAgICAgICAgIHZlcnNpb246IHZlcnNpb25cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoYXV0aCkge1xuICAgICAgICAgICAgcmVxdWVzdC5hdXRoID0gYXV0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdWJzID0gdGhpcy5zdWJzY3JpcHRpb25zKCk7XG4gICAgICAgIGlmIChzdWJzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmVxdWVzdC5zdWJzID0gc3VicztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl9zZW5kKHJlcXVlc3QsIHRydWUsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5zdWJzY3JpcHRpb25zID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLl9zdWJzY3JpcHRpb25zKTtcbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbiAocGF0aCwgaGFuZGxlciwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIF90aGlzNCA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCFwYXRoIHx8IHBhdGhbMF0gIT09ICcvJykge1xuXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IE5lc0Vycm9yKCdJbnZhbGlkIHBhdGgnLCAndXNlcicpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdWJzID0gdGhpcy5fc3Vic2NyaXB0aW9uc1twYXRoXTtcbiAgICAgICAgaWYgKHN1YnMpIHtcblxuICAgICAgICAgICAgLy8gQWxyZWFkeSBzdWJzY3JpYmVkXG5cbiAgICAgICAgICAgIGlmIChzdWJzLmluZGV4T2YoaGFuZGxlcikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgc3Vicy5wdXNoKGhhbmRsZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnNbcGF0aF0gPSBbaGFuZGxlcl07XG5cbiAgICAgICAgaWYgKCF0aGlzLl93cyB8fCB0aGlzLl93cy5yZWFkeVN0YXRlICE9PSBDbGllbnQuV2ViU29ja2V0Lk9QRU4pIHtcblxuICAgICAgICAgICAgLy8gUXVldWVkIHN1YnNjcmlwdGlvblxuXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgdHlwZTogJ3N1YicsXG4gICAgICAgICAgICBwYXRoOiBwYXRoXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbmQocmVxdWVzdCwgdHJ1ZSwgZnVuY3Rpb24gKGVycikge1xuXG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIF90aGlzNC5fc3Vic2NyaXB0aW9uc1twYXRoXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24gKHBhdGgsIGhhbmRsZXIpIHtcblxuICAgICAgICBpZiAoIXBhdGggfHwgcGF0aFswXSAhPT0gJy8nKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBoYW5kbGVyKG5ldyBOZXNFcnJvcignSW52YWxpZCBwYXRoJywgJ3VzZXInKSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3VicyA9IHRoaXMuX3N1YnNjcmlwdGlvbnNbcGF0aF07XG4gICAgICAgIGlmICghc3Vicykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN5bmMgPSBmYWxzZTtcbiAgICAgICAgaWYgKCFoYW5kbGVyKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fc3Vic2NyaXB0aW9uc1twYXRoXTtcbiAgICAgICAgICAgIHN5bmMgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHBvcyA9IHN1YnMuaW5kZXhPZihoYW5kbGVyKTtcbiAgICAgICAgICAgIGlmIChwb3MgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdWJzLnNwbGljZShwb3MsIDEpO1xuICAgICAgICAgICAgaWYgKCFzdWJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9zdWJzY3JpcHRpb25zW3BhdGhdO1xuICAgICAgICAgICAgICAgIHN5bmMgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzeW5jIHx8ICF0aGlzLl93cyB8fCB0aGlzLl93cy5yZWFkeVN0YXRlICE9PSBDbGllbnQuV2ViU29ja2V0Lk9QRU4pIHtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XG4gICAgICAgICAgICB0eXBlOiAndW5zdWInLFxuICAgICAgICAgICAgcGF0aDogcGF0aFxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9zZW5kKHJlcXVlc3QsIGZhbHNlKTsgLy8gSWdub3JpbmcgZXJyb3JzIGFzIHRoZSBzdWJzY3JpcHRpb24gaGFuZGxlcnMgYXJlIGFscmVhZHkgcmVtb3ZlZFxuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLl9vbk1lc3NhZ2UgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICB2YXIgX3RoaXM1ID0gdGhpcztcblxuICAgICAgICB0aGlzLl9iZWF0KCk7XG5cbiAgICAgICAgcGFyc2UobWVzc2FnZS5kYXRhLCBmdW5jdGlvbiAoZXJyLCB1cGRhdGUpIHtcblxuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdGhpczUub25FcnJvcihlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBSZWNyZWF0ZSBlcnJvclxuXG4gICAgICAgICAgICB2YXIgZXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgaWYgKHVwZGF0ZS5zdGF0dXNDb2RlICYmIHVwZGF0ZS5zdGF0dXNDb2RlID49IDQwMCAmJiB1cGRhdGUuc3RhdHVzQ29kZSA8PSA1OTkpIHtcblxuICAgICAgICAgICAgICAgIGVycm9yID0gbmV3IE5lc0Vycm9yKHVwZGF0ZS5wYXlsb2FkLm1lc3NhZ2UgfHwgdXBkYXRlLnBheWxvYWQuZXJyb3IsICdzZXJ2ZXInKTtcbiAgICAgICAgICAgICAgICBlcnJvci5zdGF0dXNDb2RlID0gdXBkYXRlLnN0YXR1c0NvZGU7XG4gICAgICAgICAgICAgICAgZXJyb3IuZGF0YSA9IHVwZGF0ZS5wYXlsb2FkO1xuICAgICAgICAgICAgICAgIGVycm9yLmhlYWRlcnMgPSB1cGRhdGUuaGVhZGVycztcbiAgICAgICAgICAgICAgICBlcnJvci5wYXRoID0gdXBkYXRlLnBhdGg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFBpbmdcblxuICAgICAgICAgICAgaWYgKHVwZGF0ZS50eXBlID09PSAncGluZycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXM1Ll9zZW5kKHsgdHlwZTogJ3BpbmcnIH0sIGZhbHNlKTsgLy8gSWdub3JlIGVycm9yc1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBCcm9hZGNhc3QgYW5kIHVwZGF0ZVxuXG4gICAgICAgICAgICBpZiAodXBkYXRlLnR5cGUgPT09ICd1cGRhdGUnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzNS5vblVwZGF0ZSh1cGRhdGUubWVzc2FnZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFB1Ymxpc2hcblxuICAgICAgICAgICAgaWYgKHVwZGF0ZS50eXBlID09PSAncHViJykge1xuICAgICAgICAgICAgICAgIHZhciBoYW5kbGVycyA9IF90aGlzNS5fc3Vic2NyaXB0aW9uc1t1cGRhdGUucGF0aF07XG4gICAgICAgICAgICAgICAgaWYgKGhhbmRsZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGFuZGxlcnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXJzW2ldKHVwZGF0ZS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTG9va3VwIGNhbGxiYWNrIChtZXNzYWdlIG11c3QgaW5jbHVkZSBhbiBpZCBmcm9tIHRoaXMgcG9pbnQpXG5cbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0gX3RoaXM1Ll9yZXF1ZXN0c1t1cGRhdGUuaWRdO1xuICAgICAgICAgICAgaWYgKCFyZXF1ZXN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzNS5vbkVycm9yKG5ldyBOZXNFcnJvcignUmVjZWl2ZWQgcmVzcG9uc2UgZm9yIHVua25vd24gcmVxdWVzdCcsICdwcm90b2NvbCcpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gcmVxdWVzdC5jYWxsYmFjaztcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChyZXF1ZXN0LnRpbWVvdXQpO1xuICAgICAgICAgICAgZGVsZXRlIF90aGlzNS5fcmVxdWVzdHNbdXBkYXRlLmlkXTtcblxuICAgICAgICAgICAgaWYgKCFjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHJldHVybjsgLy8gUmVzcG9uc2UgcmVjZWl2ZWQgYWZ0ZXIgdGltZW91dFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBSZXNwb25zZVxuXG4gICAgICAgICAgICBpZiAodXBkYXRlLnR5cGUgPT09ICdyZXF1ZXN0Jykge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvciwgdXBkYXRlLnBheWxvYWQsIHVwZGF0ZS5zdGF0dXNDb2RlLCB1cGRhdGUuaGVhZGVycyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEN1c3RvbSBtZXNzYWdlXG5cbiAgICAgICAgICAgIGlmICh1cGRhdGUudHlwZSA9PT0gJ21lc3NhZ2UnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yLCB1cGRhdGUubWVzc2FnZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEF1dGhlbnRpY2F0aW9uXG5cbiAgICAgICAgICAgIGlmICh1cGRhdGUudHlwZSA9PT0gJ2hlbGxvJykge1xuICAgICAgICAgICAgICAgIF90aGlzNS5pZCA9IHVwZGF0ZS5zb2NrZXQ7XG4gICAgICAgICAgICAgICAgaWYgKHVwZGF0ZS5oZWFydGJlYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXM1Ll9oZWFydGJlYXRUaW1lb3V0ID0gdXBkYXRlLmhlYXJ0YmVhdC5pbnRlcnZhbCArIHVwZGF0ZS5oZWFydGJlYXQudGltZW91dDtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXM1Ll9iZWF0KCk7IC8vIENhbGwgYWdhaW4gb25jZSB0aW1lb3V0IGlzIHNldFxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFN1YnNjcmlwdGlvbnNcblxuICAgICAgICAgICAgaWYgKHVwZGF0ZS50eXBlID09PSAnc3ViJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBfdGhpczUub25FcnJvcihuZXcgTmVzRXJyb3IoJ1JlY2VpdmVkIHVua25vd24gcmVzcG9uc2UgdHlwZTogJyArIHVwZGF0ZS50eXBlLCAncHJvdG9jb2wnKSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLl9iZWF0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXM2ID0gdGhpcztcblxuICAgICAgICBpZiAoIXRoaXMuX2hlYXJ0YmVhdFRpbWVvdXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9oZWFydGJlYXQpO1xuXG4gICAgICAgIHRoaXMuX2hlYXJ0YmVhdCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICBfdGhpczYub25FcnJvcihuZXcgTmVzRXJyb3IoJ0Rpc2Nvbm5lY3RpbmcgZHVlIHRvIGhlYXJ0YmVhdCB0aW1lb3V0JywgJ3RpbWVvdXQnKSk7XG4gICAgICAgICAgICBfdGhpczYuX3dzLmNsb3NlKCk7XG4gICAgICAgIH0sIHRoaXMuX2hlYXJ0YmVhdFRpbWVvdXQpO1xuICAgIH07XG5cbiAgICAvLyBFeHBvc2UgaW50ZXJmYWNlXG5cbiAgICByZXR1cm4geyBDbGllbnQ6IENsaWVudCB9O1xufSk7XG4iLCIgIC8qIGdsb2JhbHMgcmVxdWlyZSwgbW9kdWxlICovXG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qKlxuICAgKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICAgKi9cblxuICB2YXIgcGF0aHRvUmVnZXhwID0gcmVxdWlyZSgncGF0aC10by1yZWdleHAnKTtcblxuICAvKipcbiAgICogTW9kdWxlIGV4cG9ydHMuXG4gICAqL1xuXG4gIG1vZHVsZS5leHBvcnRzID0gcGFnZTtcblxuICAvKipcbiAgICogRGV0ZWN0IGNsaWNrIGV2ZW50XG4gICAqL1xuICB2YXIgY2xpY2tFdmVudCA9ICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIGRvY3VtZW50KSAmJiBkb2N1bWVudC5vbnRvdWNoc3RhcnQgPyAndG91Y2hzdGFydCcgOiAnY2xpY2snO1xuXG4gIC8qKlxuICAgKiBUbyB3b3JrIHByb3Blcmx5IHdpdGggdGhlIFVSTFxuICAgKiBoaXN0b3J5LmxvY2F0aW9uIGdlbmVyYXRlZCBwb2x5ZmlsbCBpbiBodHRwczovL2dpdGh1Yi5jb20vZGV2b3RlL0hUTUw1LUhpc3RvcnktQVBJXG4gICAqL1xuXG4gIHZhciBsb2NhdGlvbiA9ICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIHdpbmRvdykgJiYgKHdpbmRvdy5oaXN0b3J5LmxvY2F0aW9uIHx8IHdpbmRvdy5sb2NhdGlvbik7XG5cbiAgLyoqXG4gICAqIFBlcmZvcm0gaW5pdGlhbCBkaXNwYXRjaC5cbiAgICovXG5cbiAgdmFyIGRpc3BhdGNoID0gdHJ1ZTtcblxuXG4gIC8qKlxuICAgKiBEZWNvZGUgVVJMIGNvbXBvbmVudHMgKHF1ZXJ5IHN0cmluZywgcGF0aG5hbWUsIGhhc2gpLlxuICAgKiBBY2NvbW1vZGF0ZXMgYm90aCByZWd1bGFyIHBlcmNlbnQgZW5jb2RpbmcgYW5kIHgtd3d3LWZvcm0tdXJsZW5jb2RlZCBmb3JtYXQuXG4gICAqL1xuICB2YXIgZGVjb2RlVVJMQ29tcG9uZW50cyA9IHRydWU7XG5cbiAgLyoqXG4gICAqIEJhc2UgcGF0aC5cbiAgICovXG5cbiAgdmFyIGJhc2UgPSAnJztcblxuICAvKipcbiAgICogUnVubmluZyBmbGFnLlxuICAgKi9cblxuICB2YXIgcnVubmluZztcblxuICAvKipcbiAgICogSGFzaEJhbmcgb3B0aW9uXG4gICAqL1xuXG4gIHZhciBoYXNoYmFuZyA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBQcmV2aW91cyBjb250ZXh0LCBmb3IgY2FwdHVyaW5nXG4gICAqIHBhZ2UgZXhpdCBldmVudHMuXG4gICAqL1xuXG4gIHZhciBwcmV2Q29udGV4dDtcblxuICAvKipcbiAgICogUmVnaXN0ZXIgYHBhdGhgIHdpdGggY2FsbGJhY2sgYGZuKClgLFxuICAgKiBvciByb3V0ZSBgcGF0aGAsIG9yIHJlZGlyZWN0aW9uLFxuICAgKiBvciBgcGFnZS5zdGFydCgpYC5cbiAgICpcbiAgICogICBwYWdlKGZuKTtcbiAgICogICBwYWdlKCcqJywgZm4pO1xuICAgKiAgIHBhZ2UoJy91c2VyLzppZCcsIGxvYWQsIHVzZXIpO1xuICAgKiAgIHBhZ2UoJy91c2VyLycgKyB1c2VyLmlkLCB7IHNvbWU6ICd0aGluZycgfSk7XG4gICAqICAgcGFnZSgnL3VzZXIvJyArIHVzZXIuaWQpO1xuICAgKiAgIHBhZ2UoJy9mcm9tJywgJy90bycpXG4gICAqICAgcGFnZSgpO1xuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ3xGdW5jdGlvbn0gcGF0aFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbi4uLlxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBmdW5jdGlvbiBwYWdlKHBhdGgsIGZuKSB7XG4gICAgLy8gPGNhbGxiYWNrPlxuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgcGF0aCkge1xuICAgICAgcmV0dXJuIHBhZ2UoJyonLCBwYXRoKTtcbiAgICB9XG5cbiAgICAvLyByb3V0ZSA8cGF0aD4gdG8gPGNhbGxiYWNrIC4uLj5cbiAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGZuKSB7XG4gICAgICB2YXIgcm91dGUgPSBuZXcgUm91dGUocGF0aCk7XG4gICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgICBwYWdlLmNhbGxiYWNrcy5wdXNoKHJvdXRlLm1pZGRsZXdhcmUoYXJndW1lbnRzW2ldKSk7XG4gICAgICB9XG4gICAgICAvLyBzaG93IDxwYXRoPiB3aXRoIFtzdGF0ZV1cbiAgICB9IGVsc2UgaWYgKCdzdHJpbmcnID09PSB0eXBlb2YgcGF0aCkge1xuICAgICAgcGFnZVsnc3RyaW5nJyA9PT0gdHlwZW9mIGZuID8gJ3JlZGlyZWN0JyA6ICdzaG93J10ocGF0aCwgZm4pO1xuICAgICAgLy8gc3RhcnQgW29wdGlvbnNdXG4gICAgfSBlbHNlIHtcbiAgICAgIHBhZ2Uuc3RhcnQocGF0aCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxiYWNrIGZ1bmN0aW9ucy5cbiAgICovXG5cbiAgcGFnZS5jYWxsYmFja3MgPSBbXTtcbiAgcGFnZS5leGl0cyA9IFtdO1xuXG4gIC8qKlxuICAgKiBDdXJyZW50IHBhdGggYmVpbmcgcHJvY2Vzc2VkXG4gICAqIEB0eXBlIHtTdHJpbmd9XG4gICAqL1xuICBwYWdlLmN1cnJlbnQgPSAnJztcblxuICAvKipcbiAgICogTnVtYmVyIG9mIHBhZ2VzIG5hdmlnYXRlZCB0by5cbiAgICogQHR5cGUge251bWJlcn1cbiAgICpcbiAgICogICAgIHBhZ2UubGVuID09IDA7XG4gICAqICAgICBwYWdlKCcvbG9naW4nKTtcbiAgICogICAgIHBhZ2UubGVuID09IDE7XG4gICAqL1xuXG4gIHBhZ2UubGVuID0gMDtcblxuICAvKipcbiAgICogR2V0IG9yIHNldCBiYXNlcGF0aCB0byBgcGF0aGAuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIHBhZ2UuYmFzZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgICBpZiAoMCA9PT0gYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGJhc2U7XG4gICAgYmFzZSA9IHBhdGg7XG4gIH07XG5cbiAgLyoqXG4gICAqIEJpbmQgd2l0aCB0aGUgZ2l2ZW4gYG9wdGlvbnNgLlxuICAgKlxuICAgKiBPcHRpb25zOlxuICAgKlxuICAgKiAgICAtIGBjbGlja2AgYmluZCB0byBjbGljayBldmVudHMgW3RydWVdXG4gICAqICAgIC0gYHBvcHN0YXRlYCBiaW5kIHRvIHBvcHN0YXRlIFt0cnVlXVxuICAgKiAgICAtIGBkaXNwYXRjaGAgcGVyZm9ybSBpbml0aWFsIGRpc3BhdGNoIFt0cnVlXVxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBwYWdlLnN0YXJ0ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIGlmIChydW5uaW5nKSByZXR1cm47XG4gICAgcnVubmluZyA9IHRydWU7XG4gICAgaWYgKGZhbHNlID09PSBvcHRpb25zLmRpc3BhdGNoKSBkaXNwYXRjaCA9IGZhbHNlO1xuICAgIGlmIChmYWxzZSA9PT0gb3B0aW9ucy5kZWNvZGVVUkxDb21wb25lbnRzKSBkZWNvZGVVUkxDb21wb25lbnRzID0gZmFsc2U7XG4gICAgaWYgKGZhbHNlICE9PSBvcHRpb25zLnBvcHN0YXRlKSB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncG9wc3RhdGUnLCBvbnBvcHN0YXRlLCBmYWxzZSk7XG4gICAgaWYgKGZhbHNlICE9PSBvcHRpb25zLmNsaWNrKSB7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKGNsaWNrRXZlbnQsIG9uY2xpY2ssIGZhbHNlKTtcbiAgICB9XG4gICAgaWYgKHRydWUgPT09IG9wdGlvbnMuaGFzaGJhbmcpIGhhc2hiYW5nID0gdHJ1ZTtcbiAgICBpZiAoIWRpc3BhdGNoKSByZXR1cm47XG4gICAgdmFyIHVybCA9IChoYXNoYmFuZyAmJiB+bG9jYXRpb24uaGFzaC5pbmRleE9mKCcjIScpKSA/IGxvY2F0aW9uLmhhc2guc3Vic3RyKDIpICsgbG9jYXRpb24uc2VhcmNoIDogbG9jYXRpb24ucGF0aG5hbWUgKyBsb2NhdGlvbi5zZWFyY2ggKyBsb2NhdGlvbi5oYXNoO1xuICAgIHBhZ2UucmVwbGFjZSh1cmwsIG51bGwsIHRydWUsIGRpc3BhdGNoKTtcbiAgfTtcblxuICAvKipcbiAgICogVW5iaW5kIGNsaWNrIGFuZCBwb3BzdGF0ZSBldmVudCBoYW5kbGVycy5cbiAgICpcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgcGFnZS5zdG9wID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCFydW5uaW5nKSByZXR1cm47XG4gICAgcGFnZS5jdXJyZW50ID0gJyc7XG4gICAgcGFnZS5sZW4gPSAwO1xuICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGNsaWNrRXZlbnQsIG9uY2xpY2ssIGZhbHNlKTtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9wc3RhdGUnLCBvbnBvcHN0YXRlLCBmYWxzZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNob3cgYHBhdGhgIHdpdGggb3B0aW9uYWwgYHN0YXRlYCBvYmplY3QuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzdGF0ZVxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGRpc3BhdGNoXG4gICAqIEByZXR1cm4ge0NvbnRleHR9XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIHBhZ2Uuc2hvdyA9IGZ1bmN0aW9uKHBhdGgsIHN0YXRlLCBkaXNwYXRjaCwgcHVzaCkge1xuICAgIHZhciBjdHggPSBuZXcgQ29udGV4dChwYXRoLCBzdGF0ZSk7XG4gICAgcGFnZS5jdXJyZW50ID0gY3R4LnBhdGg7XG4gICAgaWYgKGZhbHNlICE9PSBkaXNwYXRjaCkgcGFnZS5kaXNwYXRjaChjdHgpO1xuICAgIGlmIChmYWxzZSAhPT0gY3R4LmhhbmRsZWQgJiYgZmFsc2UgIT09IHB1c2gpIGN0eC5wdXNoU3RhdGUoKTtcbiAgICByZXR1cm4gY3R4O1xuICB9O1xuXG4gIC8qKlxuICAgKiBHb2VzIGJhY2sgaW4gdGhlIGhpc3RvcnlcbiAgICogQmFjayBzaG91bGQgYWx3YXlzIGxldCB0aGUgY3VycmVudCByb3V0ZSBwdXNoIHN0YXRlIGFuZCB0aGVuIGdvIGJhY2suXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIC0gZmFsbGJhY2sgcGF0aCB0byBnbyBiYWNrIGlmIG5vIG1vcmUgaGlzdG9yeSBleGlzdHMsIGlmIHVuZGVmaW5lZCBkZWZhdWx0cyB0byBwYWdlLmJhc2VcbiAgICogQHBhcmFtIHtPYmplY3R9IFtzdGF0ZV1cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgcGFnZS5iYWNrID0gZnVuY3Rpb24ocGF0aCwgc3RhdGUpIHtcbiAgICBpZiAocGFnZS5sZW4gPiAwKSB7XG4gICAgICAvLyB0aGlzIG1heSBuZWVkIG1vcmUgdGVzdGluZyB0byBzZWUgaWYgYWxsIGJyb3dzZXJzXG4gICAgICAvLyB3YWl0IGZvciB0aGUgbmV4dCB0aWNrIHRvIGdvIGJhY2sgaW4gaGlzdG9yeVxuICAgICAgaGlzdG9yeS5iYWNrKCk7XG4gICAgICBwYWdlLmxlbi0tO1xuICAgIH0gZWxzZSBpZiAocGF0aCkge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgcGFnZS5zaG93KHBhdGgsIHN0YXRlKTtcbiAgICAgIH0pO1xuICAgIH1lbHNle1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgcGFnZS5zaG93KGJhc2UsIHN0YXRlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciByb3V0ZSB0byByZWRpcmVjdCBmcm9tIG9uZSBwYXRoIHRvIG90aGVyXG4gICAqIG9yIGp1c3QgcmVkaXJlY3QgdG8gYW5vdGhlciByb3V0ZVxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gZnJvbSAtIGlmIHBhcmFtICd0bycgaXMgdW5kZWZpbmVkIHJlZGlyZWN0cyB0byAnZnJvbSdcbiAgICogQHBhcmFtIHtTdHJpbmd9IFt0b11cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG4gIHBhZ2UucmVkaXJlY3QgPSBmdW5jdGlvbihmcm9tLCB0bykge1xuICAgIC8vIERlZmluZSByb3V0ZSBmcm9tIGEgcGF0aCB0byBhbm90aGVyXG4gICAgaWYgKCdzdHJpbmcnID09PSB0eXBlb2YgZnJvbSAmJiAnc3RyaW5nJyA9PT0gdHlwZW9mIHRvKSB7XG4gICAgICBwYWdlKGZyb20sIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBwYWdlLnJlcGxhY2UodG8pO1xuICAgICAgICB9LCAwKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFdhaXQgZm9yIHRoZSBwdXNoIHN0YXRlIGFuZCByZXBsYWNlIGl0IHdpdGggYW5vdGhlclxuICAgIGlmICgnc3RyaW5nJyA9PT0gdHlwZW9mIGZyb20gJiYgJ3VuZGVmaW5lZCcgPT09IHR5cGVvZiB0bykge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgcGFnZS5yZXBsYWNlKGZyb20pO1xuICAgICAgfSwgMCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBSZXBsYWNlIGBwYXRoYCB3aXRoIG9wdGlvbmFsIGBzdGF0ZWAgb2JqZWN0LlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAcGFyYW0ge09iamVjdH0gc3RhdGVcbiAgICogQHJldHVybiB7Q29udGV4dH1cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cblxuICBwYWdlLnJlcGxhY2UgPSBmdW5jdGlvbihwYXRoLCBzdGF0ZSwgaW5pdCwgZGlzcGF0Y2gpIHtcbiAgICB2YXIgY3R4ID0gbmV3IENvbnRleHQocGF0aCwgc3RhdGUpO1xuICAgIHBhZ2UuY3VycmVudCA9IGN0eC5wYXRoO1xuICAgIGN0eC5pbml0ID0gaW5pdDtcbiAgICBjdHguc2F2ZSgpOyAvLyBzYXZlIGJlZm9yZSBkaXNwYXRjaGluZywgd2hpY2ggbWF5IHJlZGlyZWN0XG4gICAgaWYgKGZhbHNlICE9PSBkaXNwYXRjaCkgcGFnZS5kaXNwYXRjaChjdHgpO1xuICAgIHJldHVybiBjdHg7XG4gIH07XG5cbiAgLyoqXG4gICAqIERpc3BhdGNoIHRoZSBnaXZlbiBgY3R4YC5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGN0eFxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgcGFnZS5kaXNwYXRjaCA9IGZ1bmN0aW9uKGN0eCkge1xuICAgIHZhciBwcmV2ID0gcHJldkNvbnRleHQsXG4gICAgICBpID0gMCxcbiAgICAgIGogPSAwO1xuXG4gICAgcHJldkNvbnRleHQgPSBjdHg7XG5cbiAgICBmdW5jdGlvbiBuZXh0RXhpdCgpIHtcbiAgICAgIHZhciBmbiA9IHBhZ2UuZXhpdHNbaisrXTtcbiAgICAgIGlmICghZm4pIHJldHVybiBuZXh0RW50ZXIoKTtcbiAgICAgIGZuKHByZXYsIG5leHRFeGl0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBuZXh0RW50ZXIoKSB7XG4gICAgICB2YXIgZm4gPSBwYWdlLmNhbGxiYWNrc1tpKytdO1xuXG4gICAgICBpZiAoY3R4LnBhdGggIT09IHBhZ2UuY3VycmVudCkge1xuICAgICAgICBjdHguaGFuZGxlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoIWZuKSByZXR1cm4gdW5oYW5kbGVkKGN0eCk7XG4gICAgICBmbihjdHgsIG5leHRFbnRlcik7XG4gICAgfVxuXG4gICAgaWYgKHByZXYpIHtcbiAgICAgIG5leHRFeGl0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5leHRFbnRlcigpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogVW5oYW5kbGVkIGBjdHhgLiBXaGVuIGl0J3Mgbm90IHRoZSBpbml0aWFsXG4gICAqIHBvcHN0YXRlIHRoZW4gcmVkaXJlY3QuIElmIHlvdSB3aXNoIHRvIGhhbmRsZVxuICAgKiA0MDRzIG9uIHlvdXIgb3duIHVzZSBgcGFnZSgnKicsIGNhbGxiYWNrKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29udGV4dH0gY3R4XG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBmdW5jdGlvbiB1bmhhbmRsZWQoY3R4KSB7XG4gICAgaWYgKGN0eC5oYW5kbGVkKSByZXR1cm47XG4gICAgdmFyIGN1cnJlbnQ7XG5cbiAgICBpZiAoaGFzaGJhbmcpIHtcbiAgICAgIGN1cnJlbnQgPSBiYXNlICsgbG9jYXRpb24uaGFzaC5yZXBsYWNlKCcjIScsICcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY3VycmVudCA9IGxvY2F0aW9uLnBhdGhuYW1lICsgbG9jYXRpb24uc2VhcmNoO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50ID09PSBjdHguY2Fub25pY2FsUGF0aCkgcmV0dXJuO1xuICAgIHBhZ2Uuc3RvcCgpO1xuICAgIGN0eC5oYW5kbGVkID0gZmFsc2U7XG4gICAgbG9jYXRpb24uaHJlZiA9IGN0eC5jYW5vbmljYWxQYXRoO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGFuIGV4aXQgcm91dGUgb24gYHBhdGhgIHdpdGhcbiAgICogY2FsbGJhY2sgYGZuKClgLCB3aGljaCB3aWxsIGJlIGNhbGxlZFxuICAgKiBvbiB0aGUgcHJldmlvdXMgY29udGV4dCB3aGVuIGEgbmV3XG4gICAqIHBhZ2UgaXMgdmlzaXRlZC5cbiAgICovXG4gIHBhZ2UuZXhpdCA9IGZ1bmN0aW9uKHBhdGgsIGZuKSB7XG4gICAgaWYgKHR5cGVvZiBwYXRoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gcGFnZS5leGl0KCcqJywgcGF0aCk7XG4gICAgfVxuXG4gICAgdmFyIHJvdXRlID0gbmV3IFJvdXRlKHBhdGgpO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICBwYWdlLmV4aXRzLnB1c2gocm91dGUubWlkZGxld2FyZShhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBVUkwgZW5jb2RpbmcgZnJvbSB0aGUgZ2l2ZW4gYHN0cmAuXG4gICAqIEFjY29tbW9kYXRlcyB3aGl0ZXNwYWNlIGluIGJvdGggeC13d3ctZm9ybS11cmxlbmNvZGVkXG4gICAqIGFuZCByZWd1bGFyIHBlcmNlbnQtZW5jb2RlZCBmb3JtLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cn0gVVJMIGNvbXBvbmVudCB0byBkZWNvZGVcbiAgICovXG4gIGZ1bmN0aW9uIGRlY29kZVVSTEVuY29kZWRVUklDb21wb25lbnQodmFsKSB7XG4gICAgaWYgKHR5cGVvZiB2YWwgIT09ICdzdHJpbmcnKSB7IHJldHVybiB2YWw7IH1cbiAgICByZXR1cm4gZGVjb2RlVVJMQ29tcG9uZW50cyA/IGRlY29kZVVSSUNvbXBvbmVudCh2YWwucmVwbGFjZSgvXFwrL2csICcgJykpIDogdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgYSBuZXcgXCJyZXF1ZXN0XCIgYENvbnRleHRgXG4gICAqIHdpdGggdGhlIGdpdmVuIGBwYXRoYCBhbmQgb3B0aW9uYWwgaW5pdGlhbCBgc3RhdGVgLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAcGFyYW0ge09iamVjdH0gc3RhdGVcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgZnVuY3Rpb24gQ29udGV4dChwYXRoLCBzdGF0ZSkge1xuICAgIGlmICgnLycgPT09IHBhdGhbMF0gJiYgMCAhPT0gcGF0aC5pbmRleE9mKGJhc2UpKSBwYXRoID0gYmFzZSArIChoYXNoYmFuZyA/ICcjIScgOiAnJykgKyBwYXRoO1xuICAgIHZhciBpID0gcGF0aC5pbmRleE9mKCc/Jyk7XG5cbiAgICB0aGlzLmNhbm9uaWNhbFBhdGggPSBwYXRoO1xuICAgIHRoaXMucGF0aCA9IHBhdGgucmVwbGFjZShiYXNlLCAnJykgfHwgJy8nO1xuICAgIGlmIChoYXNoYmFuZykgdGhpcy5wYXRoID0gdGhpcy5wYXRoLnJlcGxhY2UoJyMhJywgJycpIHx8ICcvJztcblxuICAgIHRoaXMudGl0bGUgPSBkb2N1bWVudC50aXRsZTtcbiAgICB0aGlzLnN0YXRlID0gc3RhdGUgfHwge307XG4gICAgdGhpcy5zdGF0ZS5wYXRoID0gcGF0aDtcbiAgICB0aGlzLnF1ZXJ5c3RyaW5nID0gfmkgPyBkZWNvZGVVUkxFbmNvZGVkVVJJQ29tcG9uZW50KHBhdGguc2xpY2UoaSArIDEpKSA6ICcnO1xuICAgIHRoaXMucGF0aG5hbWUgPSBkZWNvZGVVUkxFbmNvZGVkVVJJQ29tcG9uZW50KH5pID8gcGF0aC5zbGljZSgwLCBpKSA6IHBhdGgpO1xuICAgIHRoaXMucGFyYW1zID0ge307XG5cbiAgICAvLyBmcmFnbWVudFxuICAgIHRoaXMuaGFzaCA9ICcnO1xuICAgIGlmICghaGFzaGJhbmcpIHtcbiAgICAgIGlmICghfnRoaXMucGF0aC5pbmRleE9mKCcjJykpIHJldHVybjtcbiAgICAgIHZhciBwYXJ0cyA9IHRoaXMucGF0aC5zcGxpdCgnIycpO1xuICAgICAgdGhpcy5wYXRoID0gcGFydHNbMF07XG4gICAgICB0aGlzLmhhc2ggPSBkZWNvZGVVUkxFbmNvZGVkVVJJQ29tcG9uZW50KHBhcnRzWzFdKSB8fCAnJztcbiAgICAgIHRoaXMucXVlcnlzdHJpbmcgPSB0aGlzLnF1ZXJ5c3RyaW5nLnNwbGl0KCcjJylbMF07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4cG9zZSBgQ29udGV4dGAuXG4gICAqL1xuXG4gIHBhZ2UuQ29udGV4dCA9IENvbnRleHQ7XG5cbiAgLyoqXG4gICAqIFB1c2ggc3RhdGUuXG4gICAqXG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBDb250ZXh0LnByb3RvdHlwZS5wdXNoU3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBwYWdlLmxlbisrO1xuICAgIGhpc3RvcnkucHVzaFN0YXRlKHRoaXMuc3RhdGUsIHRoaXMudGl0bGUsIGhhc2hiYW5nICYmIHRoaXMucGF0aCAhPT0gJy8nID8gJyMhJyArIHRoaXMucGF0aCA6IHRoaXMuY2Fub25pY2FsUGF0aCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNhdmUgdGhlIGNvbnRleHQgc3RhdGUuXG4gICAqXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIENvbnRleHQucHJvdG90eXBlLnNhdmUgPSBmdW5jdGlvbigpIHtcbiAgICBoaXN0b3J5LnJlcGxhY2VTdGF0ZSh0aGlzLnN0YXRlLCB0aGlzLnRpdGxlLCBoYXNoYmFuZyAmJiB0aGlzLnBhdGggIT09ICcvJyA/ICcjIScgKyB0aGlzLnBhdGggOiB0aGlzLmNhbm9uaWNhbFBhdGgpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGBSb3V0ZWAgd2l0aCB0aGUgZ2l2ZW4gSFRUUCBgcGF0aGAsXG4gICAqIGFuZCBhbiBhcnJheSBvZiBgY2FsbGJhY2tzYCBhbmQgYG9wdGlvbnNgLlxuICAgKlxuICAgKiBPcHRpb25zOlxuICAgKlxuICAgKiAgIC0gYHNlbnNpdGl2ZWAgICAgZW5hYmxlIGNhc2Utc2Vuc2l0aXZlIHJvdXRlc1xuICAgKiAgIC0gYHN0cmljdGAgICAgICAgZW5hYmxlIHN0cmljdCBtYXRjaGluZyBmb3IgdHJhaWxpbmcgc2xhc2hlc1xuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucy5cbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIGZ1bmN0aW9uIFJvdXRlKHBhdGgsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0aGlzLnBhdGggPSAocGF0aCA9PT0gJyonKSA/ICcoLiopJyA6IHBhdGg7XG4gICAgdGhpcy5tZXRob2QgPSAnR0VUJztcbiAgICB0aGlzLnJlZ2V4cCA9IHBhdGh0b1JlZ2V4cCh0aGlzLnBhdGgsXG4gICAgICB0aGlzLmtleXMgPSBbXSxcbiAgICAgIG9wdGlvbnMuc2Vuc2l0aXZlLFxuICAgICAgb3B0aW9ucy5zdHJpY3QpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4cG9zZSBgUm91dGVgLlxuICAgKi9cblxuICBwYWdlLlJvdXRlID0gUm91dGU7XG5cbiAgLyoqXG4gICAqIFJldHVybiByb3V0ZSBtaWRkbGV3YXJlIHdpdGhcbiAgICogdGhlIGdpdmVuIGNhbGxiYWNrIGBmbigpYC5cbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAgICogQHJldHVybiB7RnVuY3Rpb259XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIFJvdXRlLnByb3RvdHlwZS5taWRkbGV3YXJlID0gZnVuY3Rpb24oZm4pIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGN0eCwgbmV4dCkge1xuICAgICAgaWYgKHNlbGYubWF0Y2goY3R4LnBhdGgsIGN0eC5wYXJhbXMpKSByZXR1cm4gZm4oY3R4LCBuZXh0KTtcbiAgICAgIG5leHQoKTtcbiAgICB9O1xuICB9O1xuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGlzIHJvdXRlIG1hdGNoZXMgYHBhdGhgLCBpZiBzb1xuICAgKiBwb3B1bGF0ZSBgcGFyYW1zYC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtc1xuICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgUm91dGUucHJvdG90eXBlLm1hdGNoID0gZnVuY3Rpb24ocGF0aCwgcGFyYW1zKSB7XG4gICAgdmFyIGtleXMgPSB0aGlzLmtleXMsXG4gICAgICBxc0luZGV4ID0gcGF0aC5pbmRleE9mKCc/JyksXG4gICAgICBwYXRobmFtZSA9IH5xc0luZGV4ID8gcGF0aC5zbGljZSgwLCBxc0luZGV4KSA6IHBhdGgsXG4gICAgICBtID0gdGhpcy5yZWdleHAuZXhlYyhkZWNvZGVVUklDb21wb25lbnQocGF0aG5hbWUpKTtcblxuICAgIGlmICghbSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDEsIGxlbiA9IG0ubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgIHZhciBrZXkgPSBrZXlzW2kgLSAxXTtcbiAgICAgIHZhciB2YWwgPSBkZWNvZGVVUkxFbmNvZGVkVVJJQ29tcG9uZW50KG1baV0pO1xuICAgICAgaWYgKHZhbCAhPT0gdW5kZWZpbmVkIHx8ICEoaGFzT3duUHJvcGVydHkuY2FsbChwYXJhbXMsIGtleS5uYW1lKSkpIHtcbiAgICAgICAgcGFyYW1zW2tleS5uYW1lXSA9IHZhbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBIYW5kbGUgXCJwb3B1bGF0ZVwiIGV2ZW50cy5cbiAgICovXG5cbiAgdmFyIG9ucG9wc3RhdGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBsb2FkZWQgPSBmYWxzZTtcbiAgICBpZiAoJ3VuZGVmaW5lZCcgPT09IHR5cGVvZiB3aW5kb3cpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcbiAgICAgIGxvYWRlZCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgfSwgMCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIG9ucG9wc3RhdGUoZSkge1xuICAgICAgaWYgKCFsb2FkZWQpIHJldHVybjtcbiAgICAgIGlmIChlLnN0YXRlKSB7XG4gICAgICAgIHZhciBwYXRoID0gZS5zdGF0ZS5wYXRoO1xuICAgICAgICBwYWdlLnJlcGxhY2UocGF0aCwgZS5zdGF0ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYWdlLnNob3cobG9jYXRpb24ucGF0aG5hbWUgKyBsb2NhdGlvbi5oYXNoLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgZmFsc2UpO1xuICAgICAgfVxuICAgIH07XG4gIH0pKCk7XG4gIC8qKlxuICAgKiBIYW5kbGUgXCJjbGlja1wiIGV2ZW50cy5cbiAgICovXG5cbiAgZnVuY3Rpb24gb25jbGljayhlKSB7XG5cbiAgICBpZiAoMSAhPT0gd2hpY2goZSkpIHJldHVybjtcblxuICAgIGlmIChlLm1ldGFLZXkgfHwgZS5jdHJsS2V5IHx8IGUuc2hpZnRLZXkpIHJldHVybjtcbiAgICBpZiAoZS5kZWZhdWx0UHJldmVudGVkKSByZXR1cm47XG5cblxuXG4gICAgLy8gZW5zdXJlIGxpbmtcbiAgICB2YXIgZWwgPSBlLnRhcmdldDtcbiAgICB3aGlsZSAoZWwgJiYgJ0EnICE9PSBlbC5ub2RlTmFtZSkgZWwgPSBlbC5wYXJlbnROb2RlO1xuICAgIGlmICghZWwgfHwgJ0EnICE9PSBlbC5ub2RlTmFtZSkgcmV0dXJuO1xuXG5cblxuICAgIC8vIElnbm9yZSBpZiB0YWcgaGFzXG4gICAgLy8gMS4gXCJkb3dubG9hZFwiIGF0dHJpYnV0ZVxuICAgIC8vIDIuIHJlbD1cImV4dGVybmFsXCIgYXR0cmlidXRlXG4gICAgaWYgKGVsLmhhc0F0dHJpYnV0ZSgnZG93bmxvYWQnKSB8fCBlbC5nZXRBdHRyaWJ1dGUoJ3JlbCcpID09PSAnZXh0ZXJuYWwnKSByZXR1cm47XG5cbiAgICAvLyBlbnN1cmUgbm9uLWhhc2ggZm9yIHRoZSBzYW1lIHBhdGhcbiAgICB2YXIgbGluayA9IGVsLmdldEF0dHJpYnV0ZSgnaHJlZicpO1xuICAgIGlmICghaGFzaGJhbmcgJiYgZWwucGF0aG5hbWUgPT09IGxvY2F0aW9uLnBhdGhuYW1lICYmIChlbC5oYXNoIHx8ICcjJyA9PT0gbGluaykpIHJldHVybjtcblxuXG5cbiAgICAvLyBDaGVjayBmb3IgbWFpbHRvOiBpbiB0aGUgaHJlZlxuICAgIGlmIChsaW5rICYmIGxpbmsuaW5kZXhPZignbWFpbHRvOicpID4gLTEpIHJldHVybjtcblxuICAgIC8vIGNoZWNrIHRhcmdldFxuICAgIGlmIChlbC50YXJnZXQpIHJldHVybjtcblxuICAgIC8vIHgtb3JpZ2luXG4gICAgaWYgKCFzYW1lT3JpZ2luKGVsLmhyZWYpKSByZXR1cm47XG5cblxuXG4gICAgLy8gcmVidWlsZCBwYXRoXG4gICAgdmFyIHBhdGggPSBlbC5wYXRobmFtZSArIGVsLnNlYXJjaCArIChlbC5oYXNoIHx8ICcnKTtcblxuICAgIC8vIHN0cmlwIGxlYWRpbmcgXCIvW2RyaXZlIGxldHRlcl06XCIgb24gTlcuanMgb24gV2luZG93c1xuICAgIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgcGF0aC5tYXRjaCgvXlxcL1thLXpBLVpdOlxcLy8pKSB7XG4gICAgICBwYXRoID0gcGF0aC5yZXBsYWNlKC9eXFwvW2EtekEtWl06XFwvLywgJy8nKTtcbiAgICB9XG5cbiAgICAvLyBzYW1lIHBhZ2VcbiAgICB2YXIgb3JpZyA9IHBhdGg7XG5cbiAgICBpZiAocGF0aC5pbmRleE9mKGJhc2UpID09PSAwKSB7XG4gICAgICBwYXRoID0gcGF0aC5zdWJzdHIoYmFzZS5sZW5ndGgpO1xuICAgIH1cblxuICAgIGlmIChoYXNoYmFuZykgcGF0aCA9IHBhdGgucmVwbGFjZSgnIyEnLCAnJyk7XG5cbiAgICBpZiAoYmFzZSAmJiBvcmlnID09PSBwYXRoKSByZXR1cm47XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgcGFnZS5zaG93KG9yaWcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV2ZW50IGJ1dHRvbi5cbiAgICovXG5cbiAgZnVuY3Rpb24gd2hpY2goZSkge1xuICAgIGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcbiAgICByZXR1cm4gbnVsbCA9PT0gZS53aGljaCA/IGUuYnV0dG9uIDogZS53aGljaDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBgaHJlZmAgaXMgdGhlIHNhbWUgb3JpZ2luLlxuICAgKi9cblxuICBmdW5jdGlvbiBzYW1lT3JpZ2luKGhyZWYpIHtcbiAgICB2YXIgb3JpZ2luID0gbG9jYXRpb24ucHJvdG9jb2wgKyAnLy8nICsgbG9jYXRpb24uaG9zdG5hbWU7XG4gICAgaWYgKGxvY2F0aW9uLnBvcnQpIG9yaWdpbiArPSAnOicgKyBsb2NhdGlvbi5wb3J0O1xuICAgIHJldHVybiAoaHJlZiAmJiAoMCA9PT0gaHJlZi5pbmRleE9mKG9yaWdpbikpKTtcbiAgfVxuXG4gIHBhZ2Uuc2FtZU9yaWdpbiA9IHNhbWVPcmlnaW47XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gcmVzb2x2ZXMgLiBhbmQgLi4gZWxlbWVudHMgaW4gYSBwYXRoIGFycmF5IHdpdGggZGlyZWN0b3J5IG5hbWVzIHRoZXJlXG4vLyBtdXN0IGJlIG5vIHNsYXNoZXMsIGVtcHR5IGVsZW1lbnRzLCBvciBkZXZpY2UgbmFtZXMgKGM6XFwpIGluIHRoZSBhcnJheVxuLy8gKHNvIGFsc28gbm8gbGVhZGluZyBhbmQgdHJhaWxpbmcgc2xhc2hlcyAtIGl0IGRvZXMgbm90IGRpc3Rpbmd1aXNoXG4vLyByZWxhdGl2ZSBhbmQgYWJzb2x1dGUgcGF0aHMpXG5mdW5jdGlvbiBub3JtYWxpemVBcnJheShwYXJ0cywgYWxsb3dBYm92ZVJvb3QpIHtcbiAgLy8gaWYgdGhlIHBhdGggdHJpZXMgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIGB1cGAgZW5kcyB1cCA+IDBcbiAgdmFyIHVwID0gMDtcbiAgZm9yICh2YXIgaSA9IHBhcnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGxhc3QgPSBwYXJ0c1tpXTtcbiAgICBpZiAobGFzdCA9PT0gJy4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgfSBlbHNlIGlmIChsYXN0ID09PSAnLi4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cCsrO1xuICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHBhcnRzLnVuc2hpZnQoJy4uJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzO1xufVxuXG4vLyBTcGxpdCBhIGZpbGVuYW1lIGludG8gW3Jvb3QsIGRpciwgYmFzZW5hbWUsIGV4dF0sIHVuaXggdmVyc2lvblxuLy8gJ3Jvb3QnIGlzIGp1c3QgYSBzbGFzaCwgb3Igbm90aGluZy5cbnZhciBzcGxpdFBhdGhSZSA9XG4gICAgL14oXFwvP3wpKFtcXHNcXFNdKj8pKCg/OlxcLnsxLDJ9fFteXFwvXSs/fCkoXFwuW14uXFwvXSp8KSkoPzpbXFwvXSopJC87XG52YXIgc3BsaXRQYXRoID0gZnVuY3Rpb24oZmlsZW5hbWUpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aFJlLmV4ZWMoZmlsZW5hbWUpLnNsaWNlKDEpO1xufTtcblxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZXNvbHZlID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXNvbHZlZFBhdGggPSAnJyxcbiAgICAgIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcblxuICBmb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gLTEgJiYgIXJlc29sdmVkQWJzb2x1dGU7IGktLSkge1xuICAgIHZhciBwYXRoID0gKGkgPj0gMCkgPyBhcmd1bWVudHNbaV0gOiBwcm9jZXNzLmN3ZCgpO1xuXG4gICAgLy8gU2tpcCBlbXB0eSBhbmQgaW52YWxpZCBlbnRyaWVzXG4gICAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGgucmVzb2x2ZSBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9IGVsc2UgaWYgKCFwYXRoKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICByZXNvbHZlZFBhdGggPSBwYXRoICsgJy8nICsgcmVzb2x2ZWRQYXRoO1xuICAgIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xuICB9XG5cbiAgLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsIGJ1dFxuICAvLyBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKSBmYWlscylcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcmVzb2x2ZWRQYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHJlc29sdmVkUGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFyZXNvbHZlZEFic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgcmV0dXJuICgocmVzb2x2ZWRBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHJlc29sdmVkUGF0aCkgfHwgJy4nO1xufTtcblxuLy8gcGF0aC5ub3JtYWxpemUocGF0aClcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMubm9ybWFsaXplID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgaXNBYnNvbHV0ZSA9IGV4cG9ydHMuaXNBYnNvbHV0ZShwYXRoKSxcbiAgICAgIHRyYWlsaW5nU2xhc2ggPSBzdWJzdHIocGF0aCwgLTEpID09PSAnLyc7XG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFpc0Fic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgaWYgKCFwYXRoICYmICFpc0Fic29sdXRlKSB7XG4gICAgcGF0aCA9ICcuJztcbiAgfVxuICBpZiAocGF0aCAmJiB0cmFpbGluZ1NsYXNoKSB7XG4gICAgcGF0aCArPSAnLyc7XG4gIH1cblxuICByZXR1cm4gKGlzQWJzb2x1dGUgPyAnLycgOiAnJykgKyBwYXRoO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5pc0Fic29sdXRlID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuam9pbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGF0aHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICByZXR1cm4gZXhwb3J0cy5ub3JtYWxpemUoZmlsdGVyKHBhdGhzLCBmdW5jdGlvbihwLCBpbmRleCkge1xuICAgIGlmICh0eXBlb2YgcCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLmpvaW4gbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9KS5qb2luKCcvJykpO1xufTtcblxuXG4vLyBwYXRoLnJlbGF0aXZlKGZyb20sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZWxhdGl2ZSA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gIGZyb20gPSBleHBvcnRzLnJlc29sdmUoZnJvbSkuc3Vic3RyKDEpO1xuICB0byA9IGV4cG9ydHMucmVzb2x2ZSh0bykuc3Vic3RyKDEpO1xuXG4gIGZ1bmN0aW9uIHRyaW0oYXJyKSB7XG4gICAgdmFyIHN0YXJ0ID0gMDtcbiAgICBmb3IgKDsgc3RhcnQgPCBhcnIubGVuZ3RoOyBzdGFydCsrKSB7XG4gICAgICBpZiAoYXJyW3N0YXJ0XSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBlbmQgPSBhcnIubGVuZ3RoIC0gMTtcbiAgICBmb3IgKDsgZW5kID49IDA7IGVuZC0tKSB7XG4gICAgICBpZiAoYXJyW2VuZF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc3RhcnQgPiBlbmQpIHJldHVybiBbXTtcbiAgICByZXR1cm4gYXJyLnNsaWNlKHN0YXJ0LCBlbmQgLSBzdGFydCArIDEpO1xuICB9XG5cbiAgdmFyIGZyb21QYXJ0cyA9IHRyaW0oZnJvbS5zcGxpdCgnLycpKTtcbiAgdmFyIHRvUGFydHMgPSB0cmltKHRvLnNwbGl0KCcvJykpO1xuXG4gIHZhciBsZW5ndGggPSBNYXRoLm1pbihmcm9tUGFydHMubGVuZ3RoLCB0b1BhcnRzLmxlbmd0aCk7XG4gIHZhciBzYW1lUGFydHNMZW5ndGggPSBsZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZnJvbVBhcnRzW2ldICE9PSB0b1BhcnRzW2ldKSB7XG4gICAgICBzYW1lUGFydHNMZW5ndGggPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdmFyIG91dHB1dFBhcnRzID0gW107XG4gIGZvciAodmFyIGkgPSBzYW1lUGFydHNMZW5ndGg7IGkgPCBmcm9tUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBvdXRwdXRQYXJ0cy5wdXNoKCcuLicpO1xuICB9XG5cbiAgb3V0cHV0UGFydHMgPSBvdXRwdXRQYXJ0cy5jb25jYXQodG9QYXJ0cy5zbGljZShzYW1lUGFydHNMZW5ndGgpKTtcblxuICByZXR1cm4gb3V0cHV0UGFydHMuam9pbignLycpO1xufTtcblxuZXhwb3J0cy5zZXAgPSAnLyc7XG5leHBvcnRzLmRlbGltaXRlciA9ICc6JztcblxuZXhwb3J0cy5kaXJuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgcmVzdWx0ID0gc3BsaXRQYXRoKHBhdGgpLFxuICAgICAgcm9vdCA9IHJlc3VsdFswXSxcbiAgICAgIGRpciA9IHJlc3VsdFsxXTtcblxuICBpZiAoIXJvb3QgJiYgIWRpcikge1xuICAgIC8vIE5vIGRpcm5hbWUgd2hhdHNvZXZlclxuICAgIHJldHVybiAnLic7XG4gIH1cblxuICBpZiAoZGlyKSB7XG4gICAgLy8gSXQgaGFzIGEgZGlybmFtZSwgc3RyaXAgdHJhaWxpbmcgc2xhc2hcbiAgICBkaXIgPSBkaXIuc3Vic3RyKDAsIGRpci5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIHJldHVybiByb290ICsgZGlyO1xufTtcblxuXG5leHBvcnRzLmJhc2VuYW1lID0gZnVuY3Rpb24ocGF0aCwgZXh0KSB7XG4gIHZhciBmID0gc3BsaXRQYXRoKHBhdGgpWzJdO1xuICAvLyBUT0RPOiBtYWtlIHRoaXMgY29tcGFyaXNvbiBjYXNlLWluc2Vuc2l0aXZlIG9uIHdpbmRvd3M/XG4gIGlmIChleHQgJiYgZi5zdWJzdHIoLTEgKiBleHQubGVuZ3RoKSA9PT0gZXh0KSB7XG4gICAgZiA9IGYuc3Vic3RyKDAsIGYubGVuZ3RoIC0gZXh0Lmxlbmd0aCk7XG4gIH1cbiAgcmV0dXJuIGY7XG59O1xuXG5cbmV4cG9ydHMuZXh0bmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aChwYXRoKVszXTtcbn07XG5cbmZ1bmN0aW9uIGZpbHRlciAoeHMsIGYpIHtcbiAgICBpZiAoeHMuZmlsdGVyKSByZXR1cm4geHMuZmlsdGVyKGYpO1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChmKHhzW2ldLCBpLCB4cykpIHJlcy5wdXNoKHhzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gU3RyaW5nLnByb3RvdHlwZS5zdWJzdHIgLSBuZWdhdGl2ZSBpbmRleCBkb24ndCB3b3JrIGluIElFOFxudmFyIHN1YnN0ciA9ICdhYicuc3Vic3RyKC0xKSA9PT0gJ2InXG4gICAgPyBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7IHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pIH1cbiAgICA6IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHtcbiAgICAgICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSBzdHIubGVuZ3RoICsgc3RhcnQ7XG4gICAgICAgIHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pO1xuICAgIH1cbjtcbiIsInZhciBpc2FycmF5ID0gcmVxdWlyZSgnaXNhcnJheScpXG5cbi8qKlxuICogRXhwb3NlIGBwYXRoVG9SZWdleHBgLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHBhdGhUb1JlZ2V4cFxubW9kdWxlLmV4cG9ydHMucGFyc2UgPSBwYXJzZVxubW9kdWxlLmV4cG9ydHMuY29tcGlsZSA9IGNvbXBpbGVcbm1vZHVsZS5leHBvcnRzLnRva2Vuc1RvRnVuY3Rpb24gPSB0b2tlbnNUb0Z1bmN0aW9uXG5tb2R1bGUuZXhwb3J0cy50b2tlbnNUb1JlZ0V4cCA9IHRva2Vuc1RvUmVnRXhwXG5cbi8qKlxuICogVGhlIG1haW4gcGF0aCBtYXRjaGluZyByZWdleHAgdXRpbGl0eS5cbiAqXG4gKiBAdHlwZSB7UmVnRXhwfVxuICovXG52YXIgUEFUSF9SRUdFWFAgPSBuZXcgUmVnRXhwKFtcbiAgLy8gTWF0Y2ggZXNjYXBlZCBjaGFyYWN0ZXJzIHRoYXQgd291bGQgb3RoZXJ3aXNlIGFwcGVhciBpbiBmdXR1cmUgbWF0Y2hlcy5cbiAgLy8gVGhpcyBhbGxvd3MgdGhlIHVzZXIgdG8gZXNjYXBlIHNwZWNpYWwgY2hhcmFjdGVycyB0aGF0IHdvbid0IHRyYW5zZm9ybS5cbiAgJyhcXFxcXFxcXC4pJyxcbiAgLy8gTWF0Y2ggRXhwcmVzcy1zdHlsZSBwYXJhbWV0ZXJzIGFuZCB1bi1uYW1lZCBwYXJhbWV0ZXJzIHdpdGggYSBwcmVmaXhcbiAgLy8gYW5kIG9wdGlvbmFsIHN1ZmZpeGVzLiBNYXRjaGVzIGFwcGVhciBhczpcbiAgLy9cbiAgLy8gXCIvOnRlc3QoXFxcXGQrKT9cIiA9PiBbXCIvXCIsIFwidGVzdFwiLCBcIlxcZCtcIiwgdW5kZWZpbmVkLCBcIj9cIiwgdW5kZWZpbmVkXVxuICAvLyBcIi9yb3V0ZShcXFxcZCspXCIgID0+IFt1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBcIlxcZCtcIiwgdW5kZWZpbmVkLCB1bmRlZmluZWRdXG4gIC8vIFwiLypcIiAgICAgICAgICAgID0+IFtcIi9cIiwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBcIipcIl1cbiAgJyhbXFxcXC8uXSk/KD86KD86XFxcXDooXFxcXHcrKSg/OlxcXFwoKCg/OlxcXFxcXFxcLnxbXigpXSkrKVxcXFwpKT98XFxcXCgoKD86XFxcXFxcXFwufFteKCldKSspXFxcXCkpKFsrKj9dKT98KFxcXFwqKSknXG5dLmpvaW4oJ3wnKSwgJ2cnKVxuXG4vKipcbiAqIFBhcnNlIGEgc3RyaW5nIGZvciB0aGUgcmF3IHRva2Vucy5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7QXJyYXl9XG4gKi9cbmZ1bmN0aW9uIHBhcnNlIChzdHIpIHtcbiAgdmFyIHRva2VucyA9IFtdXG4gIHZhciBrZXkgPSAwXG4gIHZhciBpbmRleCA9IDBcbiAgdmFyIHBhdGggPSAnJ1xuICB2YXIgcmVzXG5cbiAgd2hpbGUgKChyZXMgPSBQQVRIX1JFR0VYUC5leGVjKHN0cikpICE9IG51bGwpIHtcbiAgICB2YXIgbSA9IHJlc1swXVxuICAgIHZhciBlc2NhcGVkID0gcmVzWzFdXG4gICAgdmFyIG9mZnNldCA9IHJlcy5pbmRleFxuICAgIHBhdGggKz0gc3RyLnNsaWNlKGluZGV4LCBvZmZzZXQpXG4gICAgaW5kZXggPSBvZmZzZXQgKyBtLmxlbmd0aFxuXG4gICAgLy8gSWdub3JlIGFscmVhZHkgZXNjYXBlZCBzZXF1ZW5jZXMuXG4gICAgaWYgKGVzY2FwZWQpIHtcbiAgICAgIHBhdGggKz0gZXNjYXBlZFsxXVxuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICAvLyBQdXNoIHRoZSBjdXJyZW50IHBhdGggb250byB0aGUgdG9rZW5zLlxuICAgIGlmIChwYXRoKSB7XG4gICAgICB0b2tlbnMucHVzaChwYXRoKVxuICAgICAgcGF0aCA9ICcnXG4gICAgfVxuXG4gICAgdmFyIHByZWZpeCA9IHJlc1syXVxuICAgIHZhciBuYW1lID0gcmVzWzNdXG4gICAgdmFyIGNhcHR1cmUgPSByZXNbNF1cbiAgICB2YXIgZ3JvdXAgPSByZXNbNV1cbiAgICB2YXIgc3VmZml4ID0gcmVzWzZdXG4gICAgdmFyIGFzdGVyaXNrID0gcmVzWzddXG5cbiAgICB2YXIgcmVwZWF0ID0gc3VmZml4ID09PSAnKycgfHwgc3VmZml4ID09PSAnKidcbiAgICB2YXIgb3B0aW9uYWwgPSBzdWZmaXggPT09ICc/JyB8fCBzdWZmaXggPT09ICcqJ1xuICAgIHZhciBkZWxpbWl0ZXIgPSBwcmVmaXggfHwgJy8nXG4gICAgdmFyIHBhdHRlcm4gPSBjYXB0dXJlIHx8IGdyb3VwIHx8IChhc3RlcmlzayA/ICcuKicgOiAnW14nICsgZGVsaW1pdGVyICsgJ10rPycpXG5cbiAgICB0b2tlbnMucHVzaCh7XG4gICAgICBuYW1lOiBuYW1lIHx8IGtleSsrLFxuICAgICAgcHJlZml4OiBwcmVmaXggfHwgJycsXG4gICAgICBkZWxpbWl0ZXI6IGRlbGltaXRlcixcbiAgICAgIG9wdGlvbmFsOiBvcHRpb25hbCxcbiAgICAgIHJlcGVhdDogcmVwZWF0LFxuICAgICAgcGF0dGVybjogZXNjYXBlR3JvdXAocGF0dGVybilcbiAgICB9KVxuICB9XG5cbiAgLy8gTWF0Y2ggYW55IGNoYXJhY3RlcnMgc3RpbGwgcmVtYWluaW5nLlxuICBpZiAoaW5kZXggPCBzdHIubGVuZ3RoKSB7XG4gICAgcGF0aCArPSBzdHIuc3Vic3RyKGluZGV4KVxuICB9XG5cbiAgLy8gSWYgdGhlIHBhdGggZXhpc3RzLCBwdXNoIGl0IG9udG8gdGhlIGVuZC5cbiAgaWYgKHBhdGgpIHtcbiAgICB0b2tlbnMucHVzaChwYXRoKVxuICB9XG5cbiAgcmV0dXJuIHRva2Vuc1xufVxuXG4vKipcbiAqIENvbXBpbGUgYSBzdHJpbmcgdG8gYSB0ZW1wbGF0ZSBmdW5jdGlvbiBmb3IgdGhlIHBhdGguXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSAgIHN0clxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGUgKHN0cikge1xuICByZXR1cm4gdG9rZW5zVG9GdW5jdGlvbihwYXJzZShzdHIpKVxufVxuXG4vKipcbiAqIEV4cG9zZSBhIG1ldGhvZCBmb3IgdHJhbnNmb3JtaW5nIHRva2VucyBpbnRvIHRoZSBwYXRoIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiB0b2tlbnNUb0Z1bmN0aW9uICh0b2tlbnMpIHtcbiAgLy8gQ29tcGlsZSBhbGwgdGhlIHRva2VucyBpbnRvIHJlZ2V4cHMuXG4gIHZhciBtYXRjaGVzID0gbmV3IEFycmF5KHRva2Vucy5sZW5ndGgpXG5cbiAgLy8gQ29tcGlsZSBhbGwgdGhlIHBhdHRlcm5zIGJlZm9yZSBjb21waWxhdGlvbi5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodHlwZW9mIHRva2Vuc1tpXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIG1hdGNoZXNbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRva2Vuc1tpXS5wYXR0ZXJuICsgJyQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHBhdGggPSAnJ1xuICAgIHZhciBkYXRhID0gb2JqIHx8IHt9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHRva2VuID0gdG9rZW5zW2ldXG5cbiAgICAgIGlmICh0eXBlb2YgdG9rZW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHBhdGggKz0gdG9rZW5cblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICB2YXIgdmFsdWUgPSBkYXRhW3Rva2VuLm5hbWVdXG4gICAgICB2YXIgc2VnbWVudFxuXG4gICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICBpZiAodG9rZW4ub3B0aW9uYWwpIHtcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gYmUgZGVmaW5lZCcpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGlzYXJyYXkodmFsdWUpKSB7XG4gICAgICAgIGlmICghdG9rZW4ucmVwZWF0KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBub3QgcmVwZWF0LCBidXQgcmVjZWl2ZWQgXCInICsgdmFsdWUgKyAnXCInKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGlmICh0b2tlbi5vcHRpb25hbCkge1xuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBub3QgYmUgZW1wdHknKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsdWUubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBzZWdtZW50ID0gZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlW2pdKVxuXG4gICAgICAgICAgaWYgKCFtYXRjaGVzW2ldLnRlc3Qoc2VnbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIGFsbCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG1hdGNoIFwiJyArIHRva2VuLnBhdHRlcm4gKyAnXCIsIGJ1dCByZWNlaXZlZCBcIicgKyBzZWdtZW50ICsgJ1wiJylcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwYXRoICs9IChqID09PSAwID8gdG9rZW4ucHJlZml4IDogdG9rZW4uZGVsaW1pdGVyKSArIHNlZ21lbnRcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIHNlZ21lbnQgPSBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpXG5cbiAgICAgIGlmICghbWF0Y2hlc1tpXS50ZXN0KHNlZ21lbnQpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gbWF0Y2ggXCInICsgdG9rZW4ucGF0dGVybiArICdcIiwgYnV0IHJlY2VpdmVkIFwiJyArIHNlZ21lbnQgKyAnXCInKVxuICAgICAgfVxuXG4gICAgICBwYXRoICs9IHRva2VuLnByZWZpeCArIHNlZ21lbnRcbiAgICB9XG5cbiAgICByZXR1cm4gcGF0aFxuICB9XG59XG5cbi8qKlxuICogRXNjYXBlIGEgcmVndWxhciBleHByZXNzaW9uIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBlc2NhcGVTdHJpbmcgKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbLisqPz1eIToke30oKVtcXF18XFwvXSkvZywgJ1xcXFwkMScpXG59XG5cbi8qKlxuICogRXNjYXBlIHRoZSBjYXB0dXJpbmcgZ3JvdXAgYnkgZXNjYXBpbmcgc3BlY2lhbCBjaGFyYWN0ZXJzIGFuZCBtZWFuaW5nLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gZ3JvdXBcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZXNjYXBlR3JvdXAgKGdyb3VwKSB7XG4gIHJldHVybiBncm91cC5yZXBsYWNlKC8oWz0hOiRcXC8oKV0pL2csICdcXFxcJDEnKVxufVxuXG4vKipcbiAqIEF0dGFjaCB0aGUga2V5cyBhcyBhIHByb3BlcnR5IG9mIHRoZSByZWdleHAuXG4gKlxuICogQHBhcmFtICB7UmVnRXhwfSByZVxuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIGF0dGFjaEtleXMgKHJlLCBrZXlzKSB7XG4gIHJlLmtleXMgPSBrZXlzXG4gIHJldHVybiByZVxufVxuXG4vKipcbiAqIEdldCB0aGUgZmxhZ3MgZm9yIGEgcmVnZXhwIGZyb20gdGhlIG9wdGlvbnMuXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZsYWdzIChvcHRpb25zKSB7XG4gIHJldHVybiBvcHRpb25zLnNlbnNpdGl2ZSA/ICcnIDogJ2knXG59XG5cbi8qKlxuICogUHVsbCBvdXQga2V5cyBmcm9tIGEgcmVnZXhwLlxuICpcbiAqIEBwYXJhbSAge1JlZ0V4cH0gcGF0aFxuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIHJlZ2V4cFRvUmVnZXhwIChwYXRoLCBrZXlzKSB7XG4gIC8vIFVzZSBhIG5lZ2F0aXZlIGxvb2thaGVhZCB0byBtYXRjaCBvbmx5IGNhcHR1cmluZyBncm91cHMuXG4gIHZhciBncm91cHMgPSBwYXRoLnNvdXJjZS5tYXRjaCgvXFwoKD8hXFw/KS9nKVxuXG4gIGlmIChncm91cHMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdyb3Vwcy5sZW5ndGg7IGkrKykge1xuICAgICAga2V5cy5wdXNoKHtcbiAgICAgICAgbmFtZTogaSxcbiAgICAgICAgcHJlZml4OiBudWxsLFxuICAgICAgICBkZWxpbWl0ZXI6IG51bGwsXG4gICAgICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICAgICAgcmVwZWF0OiBmYWxzZSxcbiAgICAgICAgcGF0dGVybjogbnVsbFxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXR0YWNoS2V5cyhwYXRoLCBrZXlzKVxufVxuXG4vKipcbiAqIFRyYW5zZm9ybSBhbiBhcnJheSBpbnRvIGEgcmVnZXhwLlxuICpcbiAqIEBwYXJhbSAge0FycmF5fSAgcGF0aFxuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gYXJyYXlUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICB2YXIgcGFydHMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgIHBhcnRzLnB1c2gocGF0aFRvUmVnZXhwKHBhdGhbaV0sIGtleXMsIG9wdGlvbnMpLnNvdXJjZSlcbiAgfVxuXG4gIHZhciByZWdleHAgPSBuZXcgUmVnRXhwKCcoPzonICsgcGFydHMuam9pbignfCcpICsgJyknLCBmbGFncyhvcHRpb25zKSlcblxuICByZXR1cm4gYXR0YWNoS2V5cyhyZWdleHAsIGtleXMpXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgcGF0aCByZWdleHAgZnJvbSBzdHJpbmcgaW5wdXQuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gIGtleXNcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7UmVnRXhwfVxuICovXG5mdW5jdGlvbiBzdHJpbmdUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICB2YXIgdG9rZW5zID0gcGFyc2UocGF0aClcbiAgdmFyIHJlID0gdG9rZW5zVG9SZWdFeHAodG9rZW5zLCBvcHRpb25zKVxuXG4gIC8vIEF0dGFjaCBrZXlzIGJhY2sgdG8gdGhlIHJlZ2V4cC5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodHlwZW9mIHRva2Vuc1tpXSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGtleXMucHVzaCh0b2tlbnNbaV0pXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dGFjaEtleXMocmUsIGtleXMpXG59XG5cbi8qKlxuICogRXhwb3NlIGEgZnVuY3Rpb24gZm9yIHRha2luZyB0b2tlbnMgYW5kIHJldHVybmluZyBhIFJlZ0V4cC5cbiAqXG4gKiBAcGFyYW0gIHtBcnJheX0gIHRva2Vuc1xuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gdG9rZW5zVG9SZWdFeHAgKHRva2Vucywgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuXG4gIHZhciBzdHJpY3QgPSBvcHRpb25zLnN0cmljdFxuICB2YXIgZW5kID0gb3B0aW9ucy5lbmQgIT09IGZhbHNlXG4gIHZhciByb3V0ZSA9ICcnXG4gIHZhciBsYXN0VG9rZW4gPSB0b2tlbnNbdG9rZW5zLmxlbmd0aCAtIDFdXG4gIHZhciBlbmRzV2l0aFNsYXNoID0gdHlwZW9mIGxhc3RUb2tlbiA9PT0gJ3N0cmluZycgJiYgL1xcLyQvLnRlc3QobGFzdFRva2VuKVxuXG4gIC8vIEl0ZXJhdGUgb3ZlciB0aGUgdG9rZW5zIGFuZCBjcmVhdGUgb3VyIHJlZ2V4cCBzdHJpbmcuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHRva2VuID0gdG9rZW5zW2ldXG5cbiAgICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgICAgcm91dGUgKz0gZXNjYXBlU3RyaW5nKHRva2VuKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgcHJlZml4ID0gZXNjYXBlU3RyaW5nKHRva2VuLnByZWZpeClcbiAgICAgIHZhciBjYXB0dXJlID0gdG9rZW4ucGF0dGVyblxuXG4gICAgICBpZiAodG9rZW4ucmVwZWF0KSB7XG4gICAgICAgIGNhcHR1cmUgKz0gJyg/OicgKyBwcmVmaXggKyBjYXB0dXJlICsgJykqJ1xuICAgICAgfVxuXG4gICAgICBpZiAodG9rZW4ub3B0aW9uYWwpIHtcbiAgICAgICAgaWYgKHByZWZpeCkge1xuICAgICAgICAgIGNhcHR1cmUgPSAnKD86JyArIHByZWZpeCArICcoJyArIGNhcHR1cmUgKyAnKSk/J1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhcHR1cmUgPSAnKCcgKyBjYXB0dXJlICsgJyk/J1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYXB0dXJlID0gcHJlZml4ICsgJygnICsgY2FwdHVyZSArICcpJ1xuICAgICAgfVxuXG4gICAgICByb3V0ZSArPSBjYXB0dXJlXG4gICAgfVxuICB9XG5cbiAgLy8gSW4gbm9uLXN0cmljdCBtb2RlIHdlIGFsbG93IGEgc2xhc2ggYXQgdGhlIGVuZCBvZiBtYXRjaC4gSWYgdGhlIHBhdGggdG9cbiAgLy8gbWF0Y2ggYWxyZWFkeSBlbmRzIHdpdGggYSBzbGFzaCwgd2UgcmVtb3ZlIGl0IGZvciBjb25zaXN0ZW5jeS4gVGhlIHNsYXNoXG4gIC8vIGlzIHZhbGlkIGF0IHRoZSBlbmQgb2YgYSBwYXRoIG1hdGNoLCBub3QgaW4gdGhlIG1pZGRsZS4gVGhpcyBpcyBpbXBvcnRhbnRcbiAgLy8gaW4gbm9uLWVuZGluZyBtb2RlLCB3aGVyZSBcIi90ZXN0L1wiIHNob3VsZG4ndCBtYXRjaCBcIi90ZXN0Ly9yb3V0ZVwiLlxuICBpZiAoIXN0cmljdCkge1xuICAgIHJvdXRlID0gKGVuZHNXaXRoU2xhc2ggPyByb3V0ZS5zbGljZSgwLCAtMikgOiByb3V0ZSkgKyAnKD86XFxcXC8oPz0kKSk/J1xuICB9XG5cbiAgaWYgKGVuZCkge1xuICAgIHJvdXRlICs9ICckJ1xuICB9IGVsc2Uge1xuICAgIC8vIEluIG5vbi1lbmRpbmcgbW9kZSwgd2UgbmVlZCB0aGUgY2FwdHVyaW5nIGdyb3VwcyB0byBtYXRjaCBhcyBtdWNoIGFzXG4gICAgLy8gcG9zc2libGUgYnkgdXNpbmcgYSBwb3NpdGl2ZSBsb29rYWhlYWQgdG8gdGhlIGVuZCBvciBuZXh0IHBhdGggc2VnbWVudC5cbiAgICByb3V0ZSArPSBzdHJpY3QgJiYgZW5kc1dpdGhTbGFzaCA/ICcnIDogJyg/PVxcXFwvfCQpJ1xuICB9XG5cbiAgcmV0dXJuIG5ldyBSZWdFeHAoJ14nICsgcm91dGUsIGZsYWdzKG9wdGlvbnMpKVxufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgZ2l2ZW4gcGF0aCBzdHJpbmcsIHJldHVybmluZyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAqXG4gKiBBbiBlbXB0eSBhcnJheSBjYW4gYmUgcGFzc2VkIGluIGZvciB0aGUga2V5cywgd2hpY2ggd2lsbCBob2xkIHRoZVxuICogcGxhY2Vob2xkZXIga2V5IGRlc2NyaXB0aW9ucy4gRm9yIGV4YW1wbGUsIHVzaW5nIGAvdXNlci86aWRgLCBga2V5c2Agd2lsbFxuICogY29udGFpbiBgW3sgbmFtZTogJ2lkJywgZGVsaW1pdGVyOiAnLycsIG9wdGlvbmFsOiBmYWxzZSwgcmVwZWF0OiBmYWxzZSB9XWAuXG4gKlxuICogQHBhcmFtICB7KFN0cmluZ3xSZWdFeHB8QXJyYXkpfSBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgICAgICAgICAgIFtrZXlzXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgICAgICAgICBbb3B0aW9uc11cbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gcGF0aFRvUmVnZXhwIChwYXRoLCBrZXlzLCBvcHRpb25zKSB7XG4gIGtleXMgPSBrZXlzIHx8IFtdXG5cbiAgaWYgKCFpc2FycmF5KGtleXMpKSB7XG4gICAgb3B0aW9ucyA9IGtleXNcbiAgICBrZXlzID0gW11cbiAgfSBlbHNlIGlmICghb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSB7fVxuICB9XG5cbiAgaWYgKHBhdGggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICByZXR1cm4gcmVnZXhwVG9SZWdleHAocGF0aCwga2V5cywgb3B0aW9ucylcbiAgfVxuXG4gIGlmIChpc2FycmF5KHBhdGgpKSB7XG4gICAgcmV0dXJuIGFycmF5VG9SZWdleHAocGF0aCwga2V5cywgb3B0aW9ucylcbiAgfVxuXG4gIHJldHVybiBzdHJpbmdUb1JlZ2V4cChwYXRoLCBrZXlzLCBvcHRpb25zKVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4ndXNlIHN0cmljdCc7XG5cbi8vIElmIG9iai5oYXNPd25Qcm9wZXJ0eSBoYXMgYmVlbiBvdmVycmlkZGVuLCB0aGVuIGNhbGxpbmdcbi8vIG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSB3aWxsIGJyZWFrLlxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vam95ZW50L25vZGUvaXNzdWVzLzE3MDdcbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocXMsIHNlcCwgZXEsIG9wdGlvbnMpIHtcbiAgc2VwID0gc2VwIHx8ICcmJztcbiAgZXEgPSBlcSB8fCAnPSc7XG4gIHZhciBvYmogPSB7fTtcblxuICBpZiAodHlwZW9mIHFzICE9PSAnc3RyaW5nJyB8fCBxcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG5cbiAgdmFyIHJlZ2V4cCA9IC9cXCsvZztcbiAgcXMgPSBxcy5zcGxpdChzZXApO1xuXG4gIHZhciBtYXhLZXlzID0gMTAwMDtcbiAgaWYgKG9wdGlvbnMgJiYgdHlwZW9mIG9wdGlvbnMubWF4S2V5cyA9PT0gJ251bWJlcicpIHtcbiAgICBtYXhLZXlzID0gb3B0aW9ucy5tYXhLZXlzO1xuICB9XG5cbiAgdmFyIGxlbiA9IHFzLmxlbmd0aDtcbiAgLy8gbWF4S2V5cyA8PSAwIG1lYW5zIHRoYXQgd2Ugc2hvdWxkIG5vdCBsaW1pdCBrZXlzIGNvdW50XG4gIGlmIChtYXhLZXlzID4gMCAmJiBsZW4gPiBtYXhLZXlzKSB7XG4gICAgbGVuID0gbWF4S2V5cztcbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICB2YXIgeCA9IHFzW2ldLnJlcGxhY2UocmVnZXhwLCAnJTIwJyksXG4gICAgICAgIGlkeCA9IHguaW5kZXhPZihlcSksXG4gICAgICAgIGtzdHIsIHZzdHIsIGssIHY7XG5cbiAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgIGtzdHIgPSB4LnN1YnN0cigwLCBpZHgpO1xuICAgICAgdnN0ciA9IHguc3Vic3RyKGlkeCArIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrc3RyID0geDtcbiAgICAgIHZzdHIgPSAnJztcbiAgICB9XG5cbiAgICBrID0gZGVjb2RlVVJJQ29tcG9uZW50KGtzdHIpO1xuICAgIHYgPSBkZWNvZGVVUklDb21wb25lbnQodnN0cik7XG5cbiAgICBpZiAoIWhhc093blByb3BlcnR5KG9iaiwgaykpIHtcbiAgICAgIG9ialtrXSA9IHY7XG4gICAgfSBlbHNlIGlmIChpc0FycmF5KG9ialtrXSkpIHtcbiAgICAgIG9ialtrXS5wdXNoKHYpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvYmpba10gPSBbb2JqW2tdLCB2XTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uICh4cykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3RyaW5naWZ5UHJpbWl0aXZlID0gZnVuY3Rpb24odikge1xuICBzd2l0Y2ggKHR5cGVvZiB2KSB7XG4gICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgIHJldHVybiB2O1xuXG4gICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICByZXR1cm4gdiA/ICd0cnVlJyA6ICdmYWxzZSc7XG5cbiAgICBjYXNlICdudW1iZXInOlxuICAgICAgcmV0dXJuIGlzRmluaXRlKHYpID8gdiA6ICcnO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAnJztcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmosIHNlcCwgZXEsIG5hbWUpIHtcbiAgc2VwID0gc2VwIHx8ICcmJztcbiAgZXEgPSBlcSB8fCAnPSc7XG4gIGlmIChvYmogPT09IG51bGwpIHtcbiAgICBvYmogPSB1bmRlZmluZWQ7XG4gIH1cblxuICBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gbWFwKG9iamVjdEtleXMob2JqKSwgZnVuY3Rpb24oaykge1xuICAgICAgdmFyIGtzID0gZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShrKSkgKyBlcTtcbiAgICAgIGlmIChpc0FycmF5KG9ialtrXSkpIHtcbiAgICAgICAgcmV0dXJuIG1hcChvYmpba10sIGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICByZXR1cm4ga3MgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKHYpKTtcbiAgICAgICAgfSkuam9pbihzZXApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGtzICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShvYmpba10pKTtcbiAgICAgIH1cbiAgICB9KS5qb2luKHNlcCk7XG5cbiAgfVxuXG4gIGlmICghbmFtZSkgcmV0dXJuICcnO1xuICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShuYW1lKSkgKyBlcSArXG4gICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKG9iaikpO1xufTtcblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uICh4cykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG5cbmZ1bmN0aW9uIG1hcCAoeHMsIGYpIHtcbiAgaWYgKHhzLm1hcCkgcmV0dXJuIHhzLm1hcChmKTtcbiAgdmFyIHJlcyA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgcmVzLnB1c2goZih4c1tpXSwgaSkpO1xuICB9XG4gIHJldHVybiByZXM7XG59XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIgcmVzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgcmVzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4gcmVzO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5kZWNvZGUgPSBleHBvcnRzLnBhcnNlID0gcmVxdWlyZSgnLi9kZWNvZGUnKTtcbmV4cG9ydHMuZW5jb2RlID0gZXhwb3J0cy5zdHJpbmdpZnkgPSByZXF1aXJlKCcuL2VuY29kZScpO1xuIl19
