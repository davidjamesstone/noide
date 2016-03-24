(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Nes = require('nes/client')
var host = window.location.host
var client = new Nes.Client('ws://' + host)

module.exports = client

},{"nes/client":35}],2:[function(require,module,exports){
var state = require('../state')
var sessions = require('../sessions')
var fs = require('../fs')
var util = require('../util')
var config = require('../../config/client')

var editor = window.ace.edit('editor')

// Set editor options
editor.setOptions({
  enableSnippets: true,
  enableBasicAutocompletion: true,
  enableLiveAutocompletion: false,
  fontSize: config.ace.fontSize
})

editor.commands.addCommands([{
  name: 'help',
  bindKey: {
    win: 'Ctrl-H',
    mac: 'Command-H'
  },
  exec: function () {
    // $modal.open({
    //   templateUrl: '/client/fs/views/keyboard-shortcuts.html',
    //   size: 'lg'
    // })
  },
  readOnly: false // this command should apply in readOnly mode
}])

editor.setTheme('ace/theme/' + config.ace.theme)

editor.commands.addCommands([{
  name: 'save',
  bindKey: {
    win: 'Ctrl-S',
    mac: 'Command-S'
  },
  exec: function (editor) {
    var file = state.current
    var editSession = sessions.find(file).editSession
    fs.writeFile(file.path, editSession.getValue(), function (err, payload) {
      if (err) {
        return util.handleError(err)
      }
      file.stat = payload.stat
      editSession.getUndoManager().markClean()
    })
  },
  readOnly: false
}, {
  name: 'saveall',
  bindKey: {
    win: 'Ctrl-Shift-S',
    mac: 'Command-Option-S'
  },
  exec: function (editor) {
    // saveAll()
  },
  readOnly: false
}])

module.exports = editor

},{"../../config/client":28,"../fs":6,"../sessions":20,"../state":23,"../util":26}],3:[function(require,module,exports){
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

},{"../fs":6,"../patch":12,"./view.html":4}],4:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementVoid = IncrementalDOM.elementVoid
var elementClose = IncrementalDOM.elementClose
var elementPlaceholder = IncrementalDOM.elementPlaceholder
var text = IncrementalDOM.text

module.exports = (function () {
var hoisted1 = ["class", "form-group"]
var hoisted2 = ["for", "name"]
var hoisted3 = ["class", "input-group"]
var hoisted4 = ["type", "text", "class", "form-control input-sm", "id", "rename"]
var hoisted5 = ["class", "input-group-btn"]
var hoisted6 = ["class", "btn btn-primary btn-sm", "type", "submit"]
var hoisted7 = ["class", "btn btn-secondary btn-sm", "type", "button"]
var hoisted8 = ["class", "help-block"]

return function fileEditor (model) {
  var file = model.file
  elementOpen("form", null, null, "onsubmit", function ($event) {
    $event.preventDefault();
    var $element = this;
  model.rename(file.relativePath, this.rename.value)})
    elementOpen("div", null, hoisted1)
      elementOpen("label", null, hoisted2)
        text("Rename")
      elementClose("label")
      elementOpen("div", null, hoisted3)
        elementOpen("input", null, hoisted4, "value", file.relativePath)
        elementClose("input")
        elementOpen("span", null, hoisted5)
          elementOpen("button", null, hoisted6)
            text("OK")
          elementClose("button")
          elementOpen("button", null, hoisted7)
            text("Cancel")
          elementClose("button")
        elementClose("span")
      elementClose("div")
    elementClose("div")
    elementOpen("span", null, hoisted8)
      text("Help here...")
    elementClose("span")
  elementClose("form")
}
})();

},{"incremental-dom":34}],5:[function(require,module,exports){
var Fsos = require('./fsos')

module.exports = new Fsos()

},{"./fsos":8}],6:[function(require,module,exports){
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
  // this._socket.emit('mkdir', path, callback)
  client.request({
    path: '/mkdir',
    payload: {
      path: path
    },
    method: 'POST'
  }, callback)
}

function mkfile (path, callback) {
  // this._socket.emit('mkfile', path, callback)
  client.request({ path: '/mkfile',
    payload: {
      path: path
    },
    method: 'POST'
  }, callback)
}

function copy (source, destination, callback) {
  // this._socket.emit('copy', source, destination, callback)
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
  // this._socket.emit('rename', oldPath, newPath, callback)
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
  // this._socket.emit('remove', path, callback)
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

},{"./client":1}],7:[function(require,module,exports){
var extend = require('extend')

function File (data) {
  extend(this, data)
  if (this.isDirectory) {
    this.expanded = false
  }
}
Object.defineProperties(File.prototype, {
  id: {
    get: function () {
      return this.relativePath
    }
  },
  isFile: {
    get: function () {
      return !this.isDirectory
    }
  }
})

module.exports = File

},{"extend":33}],8:[function(require,module,exports){
function Files () {
  this.items = []
}
Files.prototype.find = function (file) {
  return this.items.find(function (item) {
    return item.relativePath === file.relativePath
  })
}
Files.prototype.remove = function (file) {
  var item = this.find(file)
  if (item) {
    this.items.splice(this.items.indexOf(item), 1)
  }
}
Files.prototype.findByPath = function (relativePath) {
  return this.items.find(function (item) {
    return item.relativePath === relativePath
  })
}
module.exports = Files

},{}],9:[function(require,module,exports){
var page = require('page')
var qs = require('querystring')
var fs = require('./fs')
var state = require('./state')
var client = require('./client')
var sessions = require('./sessions')
var files = require('./files')
var Tree = require('./tree')
var Fso = require('./fso')
var Recent = require('./recent')
var Processes = require('./processes')
var util = require('./util')
var splitter = require('./splitter')
var editor = require('./editor')
var fileEditor = require('./file-editor')
var linter = require('./standard')
var watch = require('./watch')

var processesEl = document.getElementById('processes')
var recentEl = document.getElementById('recent')
var treeEl = document.getElementById('tree')
var workspacesEl = document.getElementById('workspaces')

window.onbeforeunload = function () {
  if (sessions.dirty.length) {
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

    // Initialize the files
    files.items = payload.watched.map(function (item) {
      return new Fso(item)
    })

    // Subscribe to watched file changes
    // that happen on the file system
    watch(files)

    // Load the state from localStorage
    state.load(files)

    // Save state on page unload
    window.onunload = function () {
      console.log('log')
      state.save(files)
    }

    // Build the tree pane
    var treeView = new Tree(treeEl, files, state)
    treeView.render()

    // Build the recent list pane
    var recentView = new Recent(recentEl, state)
    recentView.render()

    // Build the procsses pane
    var processesView = new Processes(processesEl)
    processesView.render()

    /* Initialize the splitters */
    function resizeEditor () {
      editor.resize()
      processesView.editor.resize()
    }

    splitter(document.getElementById('sidebar-workspaces'), resizeEditor)
    splitter(document.getElementById('workspaces-info'), resizeEditor)
    splitter(document.getElementById('main-footer'), resizeEditor)

    /* Initialize the linter */
    linter()

    page('/', function (ctx) {
      workspacesEl.className = 'welcome'
    })

    page('/file', function (ctx, next) {
      var relativePath = qs.parse(ctx.querystring).path
      var file = files.findByPath(relativePath)

      if (!file) {
        return next()
      }

      var session = sessions.find(file)

      function setSession () {
        workspacesEl.className = 'editor'

        // Update state
        state.current = file

        var recent = state.recent
        if (!recent.find(file)) {
          recent.items.unshift(file)
        }

        // Set the editor session
        editor.setSession(session.editSession)
        editor.resize()

        recentView.render()
      }

      if (session) {
        setSession()
      } else {
        fs.readFile(relativePath, function (err, payload) {
          if (err) {
            return util.handleError(err)
          }

          session = sessions.add(file, payload.contents)
          setSession()
        })
      }
    })

    page('*', function (ctx) {
      workspacesEl.className = 'not-found'
    })

    page({
      hashbang: true
    })

    window.files = files
    window.fileEditor = fileEditor
  })
})

},{"./client":1,"./editor":2,"./file-editor":3,"./files":5,"./fs":6,"./fso":7,"./processes":14,"./recent":19,"./sessions":20,"./splitter":21,"./standard":22,"./state":23,"./tree":24,"./util":26,"./watch":27,"page":37,"querystring":32}],10:[function(require,module,exports){
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
module.exports = function (file) {
  var modes = {
    '.js': 'ace/mode/javascript',
    '.css': 'ace/mode/css',
    '.scss': 'ace/mode/scss',
    '.less': 'ace/mode/less',
    '.html': 'ace/mode/html',
    '.htm': 'ace/mode/html',
    '.ejs': 'ace/mode/html',
    '.json': 'ace/mode/json',
    '.md': 'ace/mode/markdown',
    '.coffee': 'ace/mode/coffee',
    '.jade': 'ace/mode/jade',
    '.php': 'ace/mode/php',
    '.py': 'ace/mode/python',
    '.sass': 'ace/mode/sass',
    '.txt': 'ace/mode/text',
    '.typescript': 'ace/mode/typescript',
    '.gitignore': 'ace/mode/gitignore',
    '.xml': 'ace/mode/xml'
  }

  return modes[file.ext]
}

},{}],12:[function(require,module,exports){
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

},{"incremental-dom":34}],13:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementVoid = IncrementalDOM.elementVoid
var elementClose = IncrementalDOM.elementClose
var elementPlaceholder = IncrementalDOM.elementPlaceholder
var text = IncrementalDOM.text

module.exports = (function () {
var hoisted1 = ["class", "control"]
var hoisted2 = ["class", "input-group"]
var hoisted3 = ["class", "input-group-btn dropup"]
var hoisted4 = ["type", "button", "class", "btn btn-default btn-sm dropdown-toggle", "data-toggle", "dropdown"]
var hoisted5 = ["class", "caret"]
var hoisted6 = ["class", "dropdown-menu"]
var hoisted7 = ["href", "#"]
var hoisted8 = ["type", "text", "class", "form-control input-sm", "name", "command", "required", "", "autocomplete", "off", "placeholder", ">"]
var hoisted9 = ["class", "input-group-btn"]
var hoisted10 = ["class", "btn btn-default btn-sm", "type", "submit", "title", "Run command"]
var hoisted11 = ["class", "btn btn-success btn-sm", "type", "button", "title", "Remove dead processes"]
var hoisted12 = ["class", "nav nav-tabs xnav-justified"]
var hoisted13 = ["class", "dropdown-toggle", "data-toggle", "dropdown"]
var hoisted14 = ["class", "caret"]
var hoisted15 = ["class", "dropdown-menu"]
var hoisted16 = ["class", "dropdown-header"]
var hoisted17 = ["role", "separator", "class", "divider"]
var hoisted18 = ["class", "fa fa-stop"]
var hoisted19 = ["class", "fa fa-refresh"]
var hoisted20 = ["class", "fa fa-close"]
var hoisted21 = ["class", "processes"]
var hoisted22 = ["class", "output"]

return function description (model, actions) {
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
            ;(Array.isArray(model.tasks) ? model.tasks : Object.keys(model.tasks)).forEach(function(task, $index) {
              elementOpen("li", task.name)
                elementOpen("a", null, hoisted7, "onclick", function ($event) {
                  $event.preventDefault();
                  var $element = this;
                actions.setCommand('npm run ' + task.name)})
                  text("" + (task.name) + "")
                elementClose("a")
              elementClose("li")
            }, model.tasks)
          elementClose("ul")
        elementClose("div")
        elementOpen("input", null, hoisted8, "value", model.command)
        elementClose("input")
        elementOpen("span", null, hoisted9)
          elementOpen("button", null, hoisted10)
            text("Run")
          elementClose("button")
          if (model.dead.length) {
            elementOpen("button", null, hoisted11, "onclick", function ($event) {
              $event.preventDefault();
              var $element = this;
            actions.removeAllDead()})
              text("Clear completed")
            elementClose("button")
          }
        elementClose("span")
      elementClose("div")
    elementClose("form")
    elementOpen("ul", null, hoisted12)
      ;(Array.isArray(model.processes) ? model.processes : Object.keys(model.processes)).forEach(function(process, $index) {
        elementOpen("li", process.pid, null, "class", process === model.current ? 'dropup active' : 'dropup')
          elementOpen("a", null, hoisted13, "onclick", function ($event) {
            $event.preventDefault();
            var $element = this;
          actions.setCurrent(process)})
            elementOpen("span", null, null, "class", 'circle ' + (!process.isAlive ? 'dead' : (process.isActive ? 'alive active' : 'alive')))
            elementClose("span")
            text(" \
                      " + (process.name || process.command) + " \
                      ")
            elementOpen("span", null, hoisted14)
            elementClose("span")
          elementClose("a")
          elementOpen("ul", null, hoisted15)
            elementOpen("li", null, hoisted16)
              text("Process [" + (process.pid) + "]")
            elementClose("li")
            elementOpen("li", null, hoisted17)
            elementClose("li")
            elementOpen("li")
              if (process.isAlive) {
                elementOpen("a", "kill-tab", null, "onclick", function ($event) {
                  $event.preventDefault();
                  var $element = this;
                actions.kill(process)})
                  elementOpen("i", null, hoisted18)
                    text(" Stop")
                  elementClose("i")
                elementClose("a")
              }
            elementClose("li")
            if (!process.isAlive) {
              elementOpen("li")
                elementOpen("a", "resurrect-tab", null, "onclick", function ($event) {
                  $event.preventDefault();
                  var $element = this;
                actions.resurrect(process)})
                  elementOpen("i", null, hoisted19)
                  elementClose("i")
                  text(" Resurrect")
                elementClose("a")
              elementClose("li")
              elementOpen("li")
                elementOpen("a", "remove-tab", null, "onclick", function ($event) {
                  $event.preventDefault();
                  var $element = this;
                actions.remove(process)})
                  elementOpen("i", null, hoisted20)
                    text(" Close")
                  elementClose("i")
                elementClose("a")
              elementClose("li")
            }
          elementClose("ul")
        elementClose("li")
      }, model.processes)
    elementClose("ul")
  elementClose("div")
  elementOpen("div", null, hoisted21, "style", {display: model.current ? '' : 'none'})
    elementPlaceholder("placeholder", "output", hoisted22)
  elementClose("div")
}
})();

},{"incremental-dom":34}],14:[function(require,module,exports){
var patch = require('../patch')
var view = require('./index.html')
var model = require('./model')
var Task = require('./task')
var Process = require('./process')
var client = require('../client')
var io = require('../io')
var fs = require('../fs')
var util = require('../util')

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
          console.log('timeout')
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
    console.log('procs', procs)
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

  function readTasks () {
    fs.readFile('package.json', function (err, payload) {
      if (err) {
        util.handleError(err)
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
  }

  readTasks()

  function render () {
    patch(el, view, model, actions)

    if (!editor) {
      var outputEl = el.querySelector('.output')
      commandEl = el.querySelector('input[name="command"]')
      editor = window.ace.edit(outputEl)

      editor.setTheme('ace/theme/terminal')
      editor.setReadOnly(true)
      editor.renderer.setShowGutter(false)
      editor.setHighlightActiveLine(false)
      editor.setShowPrintMargin(false)
    // splitter(document.getElementById('list-output'), editor.resize.bind(editor))
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

module.exports = Processes

},{"../client":1,"../fs":6,"../io":10,"../patch":12,"../util":26,"./index.html":13,"./model":15,"./process":16,"./task":17}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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

},{"extend":33}],17:[function(require,module,exports){
function Task (data) {
  this.name = data.name
  this.command = data.command
}

module.exports = Task

},{}],18:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementVoid = IncrementalDOM.elementVoid
var elementClose = IncrementalDOM.elementClose
var elementPlaceholder = IncrementalDOM.elementPlaceholder
var text = IncrementalDOM.text

module.exports = (function () {
var hoisted1 = ["class", "list-group"]
var hoisted2 = ["class", "close"]
var hoisted3 = ["class", "name icon icon-file-text"]
var hoisted4 = ["class", "list-group-item-text"]

return function recent (files, current, onClickClose) {
  elementOpen("div", null, hoisted1, "style", {display: files.length ? '' : 'none'})
    ;(Array.isArray(files) ? files : Object.keys(files)).forEach(function(file, $index) {
      elementOpen("a", file.relativePath, null, "title", file.relativePath, "href", '/file?path=' + file.relativePath, "class", 'list-group-item' + (file === current ? ' active' : ''))
        elementOpen("span", null, hoisted2, "onclick", function ($event) {
          $event.preventDefault();
          var $element = this;
        onClickClose(file)})
          text("×")
        elementClose("span")
        elementOpen("span", null, hoisted3, "data-name", file.name, "data-path", file.relativePath)
          text("" + (file.name) + "")
        elementClose("span")
        if (false) {
          elementOpen("p", null, hoisted4)
            text("" + ('./' + (file.relativePath !== file.name ? file.relativeDir : '')) + "")
          elementClose("p")
        }
      elementClose("a")
    }, files)
  elementClose("div")
}
})();

},{"incremental-dom":34}],19:[function(require,module,exports){
var page = require('page')
var patch = require('../patch')
var state = require('../state')
var view = require('./index.html')
var sessions = require('../sessions')

function closeFile (file) {
  var session = sessions.find(file)

  var close = session && session.isDirty
    ? window.confirm('There are unsaved changes to this file. Are you sure?')
    : true

  if (close) {
    // Remove from recent files
    state.recent.remove(file)

    if (session) {
      // Remove session
      sessions.items.splice(sessions.items.indexOf(session), 1)

      if (state.current === file) {
        if (sessions.items.length) {
          // Open the first session
          page('/file?path=' + sessions.items[0].file.relativePath)
        } else if (state.recent.items.length) {
          page('/file?path=' + state.recent.items[0].relativePath)
        } else {
          page('/')
        }
      }
    }
  }
}

function Recent (el) {
  function onClickClose (file) {
    closeFile(file)
    render()
  }

  function render () {
    patch(el, view, state.recent.items, state.current, onClickClose)
  }

  this.render = render
}

module.exports = Recent

},{"../patch":12,"../sessions":20,"../state":23,"./index.html":18,"page":37}],20:[function(require,module,exports){
var config = require('../config/client')
var modes = require('./modes')
var EditSession = window.ace.require('ace/edit_session').EditSession
var UndoManager = window.ace.require('ace/undomanager').UndoManager

var sessions = {
  items: [],
  get dirty () {
    return this.items.filter(function (item) {
      return !item.isClean
    })
  },
  find: function (file) {
    return this.items.find(function (item) {
      return item.file === file
    })
  },
  add: function (file, contents) {
    var editSession = new EditSession(contents, modes(file))
    editSession.setMode(modes(file))
    editSession.setUseWorker(false)
    editSession.setTabSize(config.ace.tabSize)
    editSession.setUseSoftTabs(config.ace.useSoftTabs)
    editSession.setUndoManager(new UndoManager())

    var session = {
      file: file,
      editSession: editSession,
      get isClean () {
        return this.editSession.getUndoManager().isClean()
      },
      get isDirty () {
        return !this.isClean
      }
    }

    this.items.push(session)

    return session
  }
}

module.exports = sessions

},{"../config/client":28,"./modes":11}],21:[function(require,module,exports){
var w = window
var d = document

function splitter (handle, onEndCallback) {
  var last
  var horizontal = handle.classList.contains('horizontal')
  var el1 = handle.previousElementSibling
  var el2 = handle.nextElementSibling

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

    last = horizontal ? e.clientY : e.clientX

    w.addEventListener('mousemove', onDrag)
    w.addEventListener('mouseup', onEndDrag)
  })
}

module.exports = splitter

},{}],22:[function(require,module,exports){
var util = require('./util')
var state = require('./state')
var client = require('./client')
var sessions = require('./sessions')

function linter () {
  function lint () {
    var file = state.current
    if (file && file.ext === '.js') {
      var editSession = sessions.find(file).editSession
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
        setTimeout(lint, 2000)
      })
    } else {
      setTimeout(lint, 2000)
    }
  }
  lint()
}

module.exports = linter

},{"./client":1,"./sessions":20,"./state":23,"./util":26}],23:[function(require,module,exports){
var Fsos = require('./fsos')
var storageKey = 'noide'

function saveState (files) {
  var storage = {
    recent: this.recent.items.map(function (item) {
      return item.relativePath
    }),
    expanded: files.items.filter(function (item) {
      return item.expanded
    }).map(function (item) {
      return item.relativePath
    })
  }
  window.localStorage.setItem(storageKey, JSON.stringify(storage))
}

function loadState (files) {
  var storage = window.localStorage.getItem(storageKey)
  storage = storage ? JSON.parse(storage) : {}

  var dir, file, i
  this.recent = new Fsos()

  if (storage.recent) {
    for (i = 0; i < storage.recent.length; i++) {
      file = files.findByPath(storage.recent[i])
      if (file) {
        this.recent.items.push(file)
      }
    }
  }

  if (storage.expanded) {
    for (i = 0; i < storage.expanded.length; i++) {
      dir = files.findByPath(storage.expanded[i])
      if (dir) {
        dir.expanded = true
      }
    }
  }
}

var state = {
  recent: null,
  current: null,
  save: saveState,
  load: loadState
}

module.exports = state

},{"./fsos":8}],24:[function(require,module,exports){
var patch = require('../patch')
var view = require('./view.html')

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
  return treeify(files.items, 'path', 'dir', 'children')
}

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

  // files.on('change', render)
  // state.on('change:current', render)

  this.render = render
}

module.exports = Tree

},{"../patch":12,"./view.html":25}],25:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementVoid = IncrementalDOM.elementVoid
var elementClose = IncrementalDOM.elementClose
var elementPlaceholder = IncrementalDOM.elementPlaceholder
var text = IncrementalDOM.text

module.exports = (function () {
var hoisted1 = ["class", "name icon icon-file-text"]
var hoisted2 = ["class", "file-name"]
var hoisted3 = ["class", "expanded"]
var hoisted4 = ["class", "collapsed"]
var hoisted5 = ["class", "name icon icon-file-directory"]
var hoisted6 = ["class", "dir-name"]
var hoisted7 = ["class", "triangle-left"]

return function tree (data, isRoot, current, onClick) {
  elementOpen("ul", null, null, "class", isRoot ? 'tree' : '')
    ;(Array.isArray(data) ? data : Object.keys(data)).forEach(function(fso, $index) {
      elementOpen("li", fso.path, null, "class", fso.isDirectory ? 'dir' : 'file' + (fso === current ? ' selected' : ''))
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

                    // var viewModel = {
                    //   isRoot: false,
                    //   tree: fso.children,
                    //   current: data.current,
                    //   view: data.view,
                    //   onClick: data.onClick
                    // }

                    tree(fso.children, false, current, onClick)
        }
      elementClose("li")
    }, data)
  elementClose("ul")
}
})();

},{"incremental-dom":34}],26:[function(require,module,exports){
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
var sessions = require('./sessions')

function watch (files) {
  // Subscribe to watched file changes
  // that happen on the file system
  // Reload the session if the changes
  // do not match the state of the file
  client.subscribe('/fs/change', function (payload) {
    sessions.items.forEach(function (session) {
      var file = session.file
      if (payload.path === file.path) {
        if (payload.stat.mtime !== file.stat.mtime) {
          fs.readFile(file.path, function (err, payload) {
            if (err) {
              return util.handleError(err)
            }
            file.stat = payload.stat
            session.editSession.setValue(payload.contents)
          })
        }
      }
    })
  }, function (err) {
    if (err) {
      return util.handleError(err)
    }
  })

  // Subscribe to watched file changes
  // that happen on the file system
  // Reload the session if the changes
  // do not match the state of the file
  // client.subscribe('/fs/unlink', function (payload) {
  //   sessions.items.forEach(function (session) {
  //     var file = session.file
  //     if (payload.path === file.path) {
  //       if (payload.stat.mtime !== file.stat.mtime) {
  //         fs.readFile(file.path, function (err, payload) {
  //           if (err) {
  //             return util.handleError(err)
  //           }
  //           file.stat = payload.stat
  //           session.editSession.setValue(payload.contents)
  //         })
  //       }
  //     }
  //   })
  // }, function (err) {
  //   if (err) {
  //     return util.handleError(err)
  //   }
  // })
}

module.exports = watch

},{"./client":1,"./fs":6,"./sessions":20,"./util":26}],28:[function(require,module,exports){
module.exports = {
  ace: {
    tabSize: 2,
    fontSize: 12,
    theme: 'monokai',
    useSoftTabs: true
  }
}

},{}],29:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
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
    var timeout = setTimeout(cleanUpNextTick);
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
    clearTimeout(timeout);
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
        setTimeout(drainQueue, 0);
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

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],30:[function(require,module,exports){
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

},{}],31:[function(require,module,exports){
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

},{}],32:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":30,"./encode":31}],33:[function(require,module,exports){
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


},{}],34:[function(require,module,exports){
(function (process){

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
  * Keeps track whether or not we are in an attributes declaration (after
  * elementOpenStart, but before elementOpenEnd).
  * @type {boolean}
  */
var inAttributes = false;

/**
  * Keeps track whether or not we are in an element that should not have its
  * children cleared.
  * @type {boolean}
  */
var inSkip = false;

/**
 * Makes sure that there is a current patch context.
 * @param {*} context
 */
var assertInPatch = function (context) {
  if (!context) {
    throw new Error('Cannot call currentElement() unless in patch');
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

/**
 * Makes sure that a patch closes every node that it opened.
 * @param {?Node} openElement
 * @param {!Node|!DocumentFragment} root
 */
var assertNoUnclosedTags = function (openElement, root) {
  if (openElement === root) {
    return;
  }

  var currentElement = openElement;
  var openTags = [];
  while (currentElement && currentElement !== root) {
    openTags.push(currentElement.nodeName.toLowerCase());
    currentElement = currentElement.parentNode;
  }

  throw new Error('One or more tags were not closed:\n' + openTags.join('\n'));
};

/**
 * Makes sure that the caller is not where attributes are expected.
 * @param {string} functionName
 */
var assertNotInAttributes = function (functionName) {
  if (inAttributes) {
    throw new Error(functionName + '() may not be called between ' + 'elementOpenStart() and elementOpenEnd().');
  }
};

/**
 * Makes sure that the caller is not inside an element that has declared skip.
 * @param {string} functionName
 */
var assertNotInSkip = function (functionName) {
  if (inSkip) {
    throw new Error(functionName + '() may not be called inside an element ' + 'that has called skip().');
  }
};

/**
 * Makes sure that the caller is where attributes are expected.
 * @param {string} functionName
 */
var assertInAttributes = function (functionName) {
  if (!inAttributes) {
    throw new Error(functionName + '() must be called after ' + 'elementOpenStart().');
  }
};

/**
 * Makes sure the patch closes virtual attributes call
 */
var assertVirtualAttributesClosed = function () {
  if (inAttributes) {
    throw new Error('elementOpenEnd() must be called after calling ' + 'elementOpenStart().');
  }
};

/**
  * Makes sure that placeholders have a key specified. Otherwise, conditional
  * placeholders and conditional elements next to placeholders will cause
  * placeholder elements to be re-used as non-placeholders and vice versa.
  * @param {string} key
  */
var assertPlaceholderKeySpecified = function (key) {
  if (!key) {
    throw new Error('Placeholder elements must have a key specified.');
  }
};

/**
  * Makes sure that tags are correctly nested.
  * @param {string} nodeName
  * @param {string} tag
  */
var assertCloseMatchesOpenTag = function (nodeName, tag) {
  if (nodeName !== tag) {
    throw new Error('Received a call to close ' + tag + ' but ' + nodeName + ' was open.');
  }
};

/**
 * Makes sure that no children elements have been declared yet in the current
 * element.
 * @param {string} functionName
 * @param {?Node} previousNode
 */
var assertNoChildrenDeclaredYet = function (functionName, previousNode) {
  if (previousNode !== null) {
    throw new Error(functionName + '() must come before any child ' + 'declarations inside the current element.');
  }
};

/**
 * Updates the state of being in an attribute declaration.
 * @param {boolean} value
 * @return {boolean} the previous value.
 */
var setInAttributes = function (value) {
  var previous = inAttributes;
  inAttributes = value;
  return previous;
};

/**
 * Updates the state of being in a skip element.
 * @param {boolean} value
 * @return {boolean} the previous value.
 */
var setInSkip = function (value) {
  var previous = inSkip;
  inSkip = value;
  return previous;
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

/** */
exports.notifications = {
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
  this.created = exports.notifications.nodesCreated && [];

  /**
   * @type {(Array<!Node>|undefined)}
   */
  this.deleted = exports.notifications.nodesDeleted && [];
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
    exports.notifications.nodesCreated(this.created);
  }

  if (this.deleted && this.deleted.length > 0) {
    exports.notifications.nodesDeleted(this.deleted);
  }
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

exports.symbols = {
  default: '__default',

  placeholder: '__placeholder'
};

/**
 * Applies an attribute or property to a given Element. If the value is null
 * or undefined, it is removed from the Element. Otherwise, the value is set
 * as an attribute.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {?(boolean|number|string)=} value The attribute's value.
 */
exports.applyAttr = function (el, name, value) {
  if (value == null) {
    el.removeAttribute(name);
  } else {
    el.setAttribute(name, value);
  }
};

/**
 * Applies a property to a given Element.
 * @param {!Element} el
 * @param {string} name The property's name.
 * @param {*} value The property's value.
 */
exports.applyProp = function (el, name, value) {
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
    exports.applyProp(el, name, value);
  } else {
    exports.applyAttr(el, name, /** @type {?(boolean|number|string)} */value);
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

  var mutator = exports.attributes[name] || exports.attributes[exports.symbols.default];
  mutator(el, name, value);

  attrs[name] = value;
};

/**
 * A publicly mutable object to provide custom mutators for attributes.
 * @const {!Object<string, function(!Element, string, *)>}
 */
exports.attributes = createMap();

// Special generic mutator that's called for any attribute that does not
// have a specific mutator.
exports.attributes[exports.symbols.default] = applyAttributeTyped;

exports.attributes[exports.symbols.placeholder] = function () {};

exports.attributes['style'] = applyStyle;

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
  var el;

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
  var children = el.children;
  var count = children.length;

  for (var i = 0; i < count; i += 1) {
    var child = children[i];
    var key = getData(child).key;

    if (key) {
      map[key] = child;
    }
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

/** @type {?Context} */
var context = null;

/** @type {?Node} */
var currentNode;

/** @type {?Node} */
var currentParent;

/** @type {?Node} */
var previousNode;

/** @type {?Element|?DocumentFragment} */
var root;

/** @type {?Document} */
var doc;

/**
 * Patches the document starting at el with the provided function. This function
 * may be called during an existing patch operation.
 * @param {!Element|!DocumentFragment} node The Element or Document
 *     to patch.
 * @param {!function(T)} fn A function containing elementOpen/elementClose/etc.
 *     calls that describe the DOM.
 * @param {T=} data An argument passed to fn to represent DOM state.
 * @template T
 */
exports.patch = function (node, fn, data) {
  var prevContext = context;
  var prevRoot = root;
  var prevDoc = doc;
  var prevCurrentNode = currentNode;
  var prevCurrentParent = currentParent;
  var prevPreviousNode = previousNode;
  var previousInAttributes = false;
  var previousInSkip = false;

  context = new Context();
  root = node;
  doc = node.ownerDocument;
  currentNode = node;
  currentParent = null;
  previousNode = null;

  if (process.env.NODE_ENV !== 'production') {
    previousInAttributes = setInAttributes(false);
    previousInSkip = setInSkip(false);
  }

  enterNode();
  fn(data);
  exitNode();

  if (process.env.NODE_ENV !== 'production') {
    assertVirtualAttributesClosed();
    assertNoUnclosedTags(previousNode, node);
    setInAttributes(previousInAttributes);
    setInSkip(previousInSkip);
  }

  context.notifyChanges();

  context = prevContext;
  root = prevRoot;
  doc = prevDoc;
  currentNode = prevCurrentNode;
  currentParent = prevCurrentParent;
  previousNode = prevPreviousNode;
};

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

  var node;

  // Check to see if the node has moved within the parent.
  if (key) {
    node = getChild(currentParent, key);
    if (node && process.env.NODE_ENV !== 'production') {
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
  var key;

  if (child === previousNode && keyMapValid) {
    return;
  }

  if (data.attrs[exports.symbols.placeholder] && node !== root) {
    return;
  }

  while (child !== previousNode) {
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
  currentNode = currentNode.firstChild;
  previousNode = null;
};

/**
 * Changes to the next sibling of the current node.
 */
var nextNode = function () {
  previousNode = currentNode;
  currentNode = currentNode.nextSibling;
};

/**
 * Changes to the parent of the current node, removing any unvisited children.
 */
var exitNode = function () {
  clearUnvisitedDOM();

  previousNode = currentParent;
  currentNode = currentParent.nextSibling;
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
var _elementOpen = function (tag, key, statics) {
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
var _elementClose = function () {
  if (process.env.NODE_ENV !== 'production') {
    setInSkip(false);
  }

  exitNode();
  return (/** @type {!Element} */previousNode
  );
};

/**
 * Makes sure the current node is a Text node and creates a Text node if it is
 * not.
 *
 * @return {!Text} The corresponding Text Node.
 */
var _text = function () {
  alignWithDOM('#text', null, null);
  nextNode();
  return (/** @type {!Text} */previousNode
  );
};

/**
 * Gets the current Element being patched.
 * @return {!Element}
 */
exports.currentElement = function () {
  if (process.env.NODE_ENV !== 'production') {
    assertInPatch(context);
    assertNotInAttributes('currentElement');
  }
  return (/** @type {!Element} */currentParent
  );
};

/**
 * Skips the children in a subtree, allowing an Element to be closed without
 * clearing out the children.
 */
exports.skip = function () {
  if (process.env.NODE_ENV !== 'production') {
    assertNoChildrenDeclaredYet('skip', previousNode);
    setInSkip(true);
  }
  previousNode = currentParent.lastChild;
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
 * @param {...*} var_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {!Element} The corresponding Element.
 */
exports.elementOpen = function (tag, key, statics, var_args) {
  if (process.env.NODE_ENV !== 'production') {
    assertNotInAttributes('elementOpen');
    assertNotInSkip('elementOpen');
  }

  var node = _elementOpen(tag, key, statics);
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

    for (var attr in newAttrs) {
      updateAttribute(node, attr, newAttrs[attr]);
      newAttrs[attr] = undefined;
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
exports.elementOpenStart = function (tag, key, statics) {
  if (process.env.NODE_ENV !== 'production') {
    assertNotInAttributes('elementOpenStart');
    setInAttributes(true);
  }

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
exports.attr = function (name, value) {
  if (process.env.NODE_ENV !== 'production') {
    assertInAttributes('attr');
  }

  argsBuilder.push(name, value);
};

/**
 * Closes an open tag started with elementOpenStart.
 * @return {!Element} The corresponding Element.
 */
exports.elementOpenEnd = function () {
  if (process.env.NODE_ENV !== 'production') {
    assertInAttributes('elementOpenEnd');
    setInAttributes(false);
  }

  var node = exports.elementOpen.apply(null, argsBuilder);
  argsBuilder.length = 0;
  return node;
};

/**
 * Closes an open virtual Element.
 *
 * @param {string} tag The element's tag.
 * @return {!Element} The corresponding Element.
 */
exports.elementClose = function (tag) {
  if (process.env.NODE_ENV !== 'production') {
    assertNotInAttributes('elementClose');
  }

  var node = _elementClose();

  if (process.env.NODE_ENV !== 'production') {
    assertCloseMatchesOpenTag(getData(node).nodeName, tag);
  }

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
 * @param {...*} var_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {!Element} The corresponding Element.
 */
exports.elementVoid = function (tag, key, statics, var_args) {
  var node = exports.elementOpen.apply(null, arguments);
  exports.elementClose.apply(null, arguments);
  return node;
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
 * @param {...*} var_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {!Element} The corresponding Element.
 */
exports.elementPlaceholder = function (tag, key, statics, var_args) {
  if (process.env.NODE_ENV !== 'production') {
    assertPlaceholderKeySpecified(key);
  }

  exports.elementOpen.apply(null, arguments);
  exports.skip();
  return exports.elementClose.apply(null, arguments);
};

/**
 * Declares a virtual Text at this point in the document.
 *
 * @param {string|number|boolean} value The value of the Text.
 * @param {...(function((string|number|boolean)):string)} var_args
 *     Functions to format the value which are called only when the value has
 *     changed.
 * @return {!Text} The corresponding text node.
 */
exports.text = function (value, var_args) {
  if (process.env.NODE_ENV !== 'production') {
    assertNotInAttributes('text');
    assertNotInSkip('text');
  }

  var node = _text();
  var data = getData(node);

  if (data.text !== value) {
    data.text = /** @type {string} */value;

    var formatted = value;
    for (var i = 1; i < arguments.length; i += 1) {
      formatted = arguments[i](formatted);
    }

    node.data = formatted;
  }

  return node;
};

}).call(this,require('_process'))

},{"_process":29}],35:[function(require,module,exports){
'use strict';

module.exports = require('./dist/client');

},{"./dist/client":36}],36:[function(require,module,exports){
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

},{}],37:[function(require,module,exports){
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

},{"_process":29,"path-to-regexp":38}],38:[function(require,module,exports){
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

},{"isarray":39}],39:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvY2xpZW50LmpzIiwiY2xpZW50L2VkaXRvci9pbmRleC5qcyIsImNsaWVudC9maWxlLWVkaXRvci9pbmRleC5qcyIsImNsaWVudC9maWxlLWVkaXRvci92aWV3Lmh0bWwiLCJjbGllbnQvZmlsZXMuanMiLCJjbGllbnQvZnMuanMiLCJjbGllbnQvZnNvLmpzIiwiY2xpZW50L2Zzb3MuanMiLCJjbGllbnQvaW5kZXguanMiLCJjbGllbnQvaW8uanMiLCJjbGllbnQvbW9kZXMuanMiLCJjbGllbnQvcGF0Y2guanMiLCJjbGllbnQvcHJvY2Vzc2VzL2luZGV4Lmh0bWwiLCJjbGllbnQvcHJvY2Vzc2VzL2luZGV4LmpzIiwiY2xpZW50L3Byb2Nlc3Nlcy9tb2RlbC5qcyIsImNsaWVudC9wcm9jZXNzZXMvcHJvY2Vzcy5qcyIsImNsaWVudC9wcm9jZXNzZXMvdGFzay5qcyIsImNsaWVudC9yZWNlbnQvaW5kZXguaHRtbCIsImNsaWVudC9yZWNlbnQvaW5kZXguanMiLCJjbGllbnQvc2Vzc2lvbnMuanMiLCJjbGllbnQvc3BsaXR0ZXIuanMiLCJjbGllbnQvc3RhbmRhcmQuanMiLCJjbGllbnQvc3RhdGUuanMiLCJjbGllbnQvdHJlZS9pbmRleC5qcyIsImNsaWVudC90cmVlL3ZpZXcuaHRtbCIsImNsaWVudC91dGlsLmpzIiwiY2xpZW50L3dhdGNoLmpzIiwiY29uZmlnL2NsaWVudC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcXVlcnlzdHJpbmctZXMzL2RlY29kZS5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9xdWVyeXN0cmluZy1lczMvZW5jb2RlLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3F1ZXJ5c3RyaW5nLWVzMy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9leHRlbmQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaW5jcmVtZW50YWwtZG9tL2Rpc3QvaW5jcmVtZW50YWwtZG9tLWNqcy5qcyIsIm5vZGVfbW9kdWxlcy9uZXMvY2xpZW50LmpzIiwibm9kZV9tb2R1bGVzL25lcy9kaXN0L2NsaWVudC5qcyIsIm5vZGVfbW9kdWxlcy9wYWdlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3BhZ2Uvbm9kZV9tb2R1bGVzL3BhdGgtdG8tcmVnZXhwL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3BhZ2Uvbm9kZV9tb2R1bGVzL3BhdGgtdG8tcmVnZXhwL25vZGVfbW9kdWxlcy9pc2FycmF5L2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdHBDQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzVtQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzNtQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFlBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBOZXMgPSByZXF1aXJlKCduZXMvY2xpZW50JylcbnZhciBob3N0ID0gd2luZG93LmxvY2F0aW9uLmhvc3RcbnZhciBjbGllbnQgPSBuZXcgTmVzLkNsaWVudCgnd3M6Ly8nICsgaG9zdClcblxubW9kdWxlLmV4cG9ydHMgPSBjbGllbnRcbiIsInZhciBzdGF0ZSA9IHJlcXVpcmUoJy4uL3N0YXRlJylcbnZhciBzZXNzaW9ucyA9IHJlcXVpcmUoJy4uL3Nlc3Npb25zJylcbnZhciBmcyA9IHJlcXVpcmUoJy4uL2ZzJylcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpXG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vLi4vY29uZmlnL2NsaWVudCcpXG5cbnZhciBlZGl0b3IgPSB3aW5kb3cuYWNlLmVkaXQoJ2VkaXRvcicpXG5cbi8vIFNldCBlZGl0b3Igb3B0aW9uc1xuZWRpdG9yLnNldE9wdGlvbnMoe1xuICBlbmFibGVTbmlwcGV0czogdHJ1ZSxcbiAgZW5hYmxlQmFzaWNBdXRvY29tcGxldGlvbjogdHJ1ZSxcbiAgZW5hYmxlTGl2ZUF1dG9jb21wbGV0aW9uOiBmYWxzZSxcbiAgZm9udFNpemU6IGNvbmZpZy5hY2UuZm9udFNpemVcbn0pXG5cbmVkaXRvci5jb21tYW5kcy5hZGRDb21tYW5kcyhbe1xuICBuYW1lOiAnaGVscCcsXG4gIGJpbmRLZXk6IHtcbiAgICB3aW46ICdDdHJsLUgnLFxuICAgIG1hYzogJ0NvbW1hbmQtSCdcbiAgfSxcbiAgZXhlYzogZnVuY3Rpb24gKCkge1xuICAgIC8vICRtb2RhbC5vcGVuKHtcbiAgICAvLyAgIHRlbXBsYXRlVXJsOiAnL2NsaWVudC9mcy92aWV3cy9rZXlib2FyZC1zaG9ydGN1dHMuaHRtbCcsXG4gICAgLy8gICBzaXplOiAnbGcnXG4gICAgLy8gfSlcbiAgfSxcbiAgcmVhZE9ubHk6IGZhbHNlIC8vIHRoaXMgY29tbWFuZCBzaG91bGQgYXBwbHkgaW4gcmVhZE9ubHkgbW9kZVxufV0pXG5cbmVkaXRvci5zZXRUaGVtZSgnYWNlL3RoZW1lLycgKyBjb25maWcuYWNlLnRoZW1lKVxuXG5lZGl0b3IuY29tbWFuZHMuYWRkQ29tbWFuZHMoW3tcbiAgbmFtZTogJ3NhdmUnLFxuICBiaW5kS2V5OiB7XG4gICAgd2luOiAnQ3RybC1TJyxcbiAgICBtYWM6ICdDb21tYW5kLVMnXG4gIH0sXG4gIGV4ZWM6IGZ1bmN0aW9uIChlZGl0b3IpIHtcbiAgICB2YXIgZmlsZSA9IHN0YXRlLmN1cnJlbnRcbiAgICB2YXIgZWRpdFNlc3Npb24gPSBzZXNzaW9ucy5maW5kKGZpbGUpLmVkaXRTZXNzaW9uXG4gICAgZnMud3JpdGVGaWxlKGZpbGUucGF0aCwgZWRpdFNlc3Npb24uZ2V0VmFsdWUoKSwgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gdXRpbC5oYW5kbGVFcnJvcihlcnIpXG4gICAgICB9XG4gICAgICBmaWxlLnN0YXQgPSBwYXlsb2FkLnN0YXRcbiAgICAgIGVkaXRTZXNzaW9uLmdldFVuZG9NYW5hZ2VyKCkubWFya0NsZWFuKClcbiAgICB9KVxuICB9LFxuICByZWFkT25seTogZmFsc2Vcbn0sIHtcbiAgbmFtZTogJ3NhdmVhbGwnLFxuICBiaW5kS2V5OiB7XG4gICAgd2luOiAnQ3RybC1TaGlmdC1TJyxcbiAgICBtYWM6ICdDb21tYW5kLU9wdGlvbi1TJ1xuICB9LFxuICBleGVjOiBmdW5jdGlvbiAoZWRpdG9yKSB7XG4gICAgLy8gc2F2ZUFsbCgpXG4gIH0sXG4gIHJlYWRPbmx5OiBmYWxzZVxufV0pXG5cbm1vZHVsZS5leHBvcnRzID0gZWRpdG9yXG4iLCJ2YXIgcGF0Y2ggPSByZXF1aXJlKCcuLi9wYXRjaCcpXG52YXIgZnMgPSByZXF1aXJlKCcuLi9mcycpXG52YXIgdmlldyA9IHJlcXVpcmUoJy4vdmlldy5odG1sJylcblxuZnVuY3Rpb24gRmlsZUVkaXRvciAoZWwpIHtcbiAgdmFyIG1vZGVsID0ge1xuICAgIG1vZGU6ICcnLFxuICAgIHJlbmFtZTogZnMucmVuYW1lXG4gIH1cblxuICBmdW5jdGlvbiBzaG93IChmaWxlLCBtb2RlKSB7XG4gICAgbW9kZWwuZmlsZSA9IGZpbGVcbiAgICBtb2RlbC5tb2RlID0gbW9kZVxuICAgIHBhdGNoKGVsLCB2aWV3LCBtb2RlbClcbiAgfVxuXG4gIHRoaXMuc2hvdyA9IHNob3dcbn1cbkZpbGVFZGl0b3IucHJvdG90eXBlLnJlbmFtZSA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gIHRoaXMuc2hvdyhmaWxlLCAncmVuYW1lJylcbn1cblxudmFyIGZpbGVFZGl0b3IgPSBuZXcgRmlsZUVkaXRvcihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmlsZS1lZGl0b3InKSlcblxubW9kdWxlLmV4cG9ydHMgPSBmaWxlRWRpdG9yXG4iLCJ2YXIgSW5jcmVtZW50YWxET00gPSByZXF1aXJlKCdpbmNyZW1lbnRhbC1kb20nKVxudmFyIHBhdGNoID0gSW5jcmVtZW50YWxET00ucGF0Y2hcbnZhciBlbGVtZW50T3BlbiA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRPcGVuXG52YXIgZWxlbWVudFZvaWQgPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50Vm9pZFxudmFyIGVsZW1lbnRDbG9zZSA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRDbG9zZVxudmFyIGVsZW1lbnRQbGFjZWhvbGRlciA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRQbGFjZWhvbGRlclxudmFyIHRleHQgPSBJbmNyZW1lbnRhbERPTS50ZXh0XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcbnZhciBob2lzdGVkMSA9IFtcImNsYXNzXCIsIFwiZm9ybS1ncm91cFwiXVxudmFyIGhvaXN0ZWQyID0gW1wiZm9yXCIsIFwibmFtZVwiXVxudmFyIGhvaXN0ZWQzID0gW1wiY2xhc3NcIiwgXCJpbnB1dC1ncm91cFwiXVxudmFyIGhvaXN0ZWQ0ID0gW1widHlwZVwiLCBcInRleHRcIiwgXCJjbGFzc1wiLCBcImZvcm0tY29udHJvbCBpbnB1dC1zbVwiLCBcImlkXCIsIFwicmVuYW1lXCJdXG52YXIgaG9pc3RlZDUgPSBbXCJjbGFzc1wiLCBcImlucHV0LWdyb3VwLWJ0blwiXVxudmFyIGhvaXN0ZWQ2ID0gW1wiY2xhc3NcIiwgXCJidG4gYnRuLXByaW1hcnkgYnRuLXNtXCIsIFwidHlwZVwiLCBcInN1Ym1pdFwiXVxudmFyIGhvaXN0ZWQ3ID0gW1wiY2xhc3NcIiwgXCJidG4gYnRuLXNlY29uZGFyeSBidG4tc21cIiwgXCJ0eXBlXCIsIFwiYnV0dG9uXCJdXG52YXIgaG9pc3RlZDggPSBbXCJjbGFzc1wiLCBcImhlbHAtYmxvY2tcIl1cblxucmV0dXJuIGZ1bmN0aW9uIGZpbGVFZGl0b3IgKG1vZGVsKSB7XG4gIHZhciBmaWxlID0gbW9kZWwuZmlsZVxuICBlbGVtZW50T3BlbihcImZvcm1cIiwgbnVsbCwgbnVsbCwgXCJvbnN1Ym1pdFwiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgbW9kZWwucmVuYW1lKGZpbGUucmVsYXRpdmVQYXRoLCB0aGlzLnJlbmFtZS52YWx1ZSl9KVxuICAgIGVsZW1lbnRPcGVuKFwiZGl2XCIsIG51bGwsIGhvaXN0ZWQxKVxuICAgICAgZWxlbWVudE9wZW4oXCJsYWJlbFwiLCBudWxsLCBob2lzdGVkMilcbiAgICAgICAgdGV4dChcIlJlbmFtZVwiKVxuICAgICAgZWxlbWVudENsb3NlKFwibGFiZWxcIilcbiAgICAgIGVsZW1lbnRPcGVuKFwiZGl2XCIsIG51bGwsIGhvaXN0ZWQzKVxuICAgICAgICBlbGVtZW50T3BlbihcImlucHV0XCIsIG51bGwsIGhvaXN0ZWQ0LCBcInZhbHVlXCIsIGZpbGUucmVsYXRpdmVQYXRoKVxuICAgICAgICBlbGVtZW50Q2xvc2UoXCJpbnB1dFwiKVxuICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgaG9pc3RlZDUpXG4gICAgICAgICAgZWxlbWVudE9wZW4oXCJidXR0b25cIiwgbnVsbCwgaG9pc3RlZDYpXG4gICAgICAgICAgICB0ZXh0KFwiT0tcIilcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJidXR0b25cIilcbiAgICAgICAgICBlbGVtZW50T3BlbihcImJ1dHRvblwiLCBudWxsLCBob2lzdGVkNylcbiAgICAgICAgICAgIHRleHQoXCJDYW5jZWxcIilcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJidXR0b25cIilcbiAgICAgICAgZWxlbWVudENsb3NlKFwic3BhblwiKVxuICAgICAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gICAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gICAgZWxlbWVudE9wZW4oXCJzcGFuXCIsIG51bGwsIGhvaXN0ZWQ4KVxuICAgICAgdGV4dChcIkhlbHAgaGVyZS4uLlwiKVxuICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgZWxlbWVudENsb3NlKFwiZm9ybVwiKVxufVxufSkoKTtcbiIsInZhciBGc29zID0gcmVxdWlyZSgnLi9mc29zJylcblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgRnNvcygpXG4iLCJ2YXIgY2xpZW50ID0gcmVxdWlyZSgnLi9jbGllbnQnKVxuXG5mdW5jdGlvbiByZWFkRmlsZSAocGF0aCwgY2FsbGJhY2spIHtcbiAgY2xpZW50LnJlcXVlc3Qoe1xuICAgIHBhdGg6ICcvcmVhZGZpbGU/cGF0aD0nICsgcGF0aCxcbiAgICBtZXRob2Q6ICdHRVQnXG4gIH0sIGNhbGxiYWNrKVxufVxuXG5mdW5jdGlvbiB3cml0ZUZpbGUgKHBhdGgsIGNvbnRlbnRzLCBjYWxsYmFjaykge1xuICBjbGllbnQucmVxdWVzdCh7XG4gICAgcGF0aDogJy93cml0ZWZpbGUnLFxuICAgIHBheWxvYWQ6IHtcbiAgICAgIHBhdGg6IHBhdGgsXG4gICAgICBjb250ZW50czogY29udGVudHNcbiAgICB9LFxuICAgIG1ldGhvZDogJ1BVVCdcbiAgfSwgY2FsbGJhY2spXG59XG5cbmZ1bmN0aW9uIG1rZGlyIChwYXRoLCBjYWxsYmFjaykge1xuICAvLyB0aGlzLl9zb2NrZXQuZW1pdCgnbWtkaXInLCBwYXRoLCBjYWxsYmFjaylcbiAgY2xpZW50LnJlcXVlc3Qoe1xuICAgIHBhdGg6ICcvbWtkaXInLFxuICAgIHBheWxvYWQ6IHtcbiAgICAgIHBhdGg6IHBhdGhcbiAgICB9LFxuICAgIG1ldGhvZDogJ1BPU1QnXG4gIH0sIGNhbGxiYWNrKVxufVxuXG5mdW5jdGlvbiBta2ZpbGUgKHBhdGgsIGNhbGxiYWNrKSB7XG4gIC8vIHRoaXMuX3NvY2tldC5lbWl0KCdta2ZpbGUnLCBwYXRoLCBjYWxsYmFjaylcbiAgY2xpZW50LnJlcXVlc3QoeyBwYXRoOiAnL21rZmlsZScsXG4gICAgcGF5bG9hZDoge1xuICAgICAgcGF0aDogcGF0aFxuICAgIH0sXG4gICAgbWV0aG9kOiAnUE9TVCdcbiAgfSwgY2FsbGJhY2spXG59XG5cbmZ1bmN0aW9uIGNvcHkgKHNvdXJjZSwgZGVzdGluYXRpb24sIGNhbGxiYWNrKSB7XG4gIC8vIHRoaXMuX3NvY2tldC5lbWl0KCdjb3B5Jywgc291cmNlLCBkZXN0aW5hdGlvbiwgY2FsbGJhY2spXG4gIGNsaWVudC5yZXF1ZXN0KHtcbiAgICBwYXRoOiAnL2NvcHknLFxuICAgIHBheWxvYWQ6IHtcbiAgICAgIHNvdXJjZTogc291cmNlLFxuICAgICAgZGVzdGluYXRpb246IGRlc3RpbmF0aW9uXG4gICAgfSxcbiAgICBtZXRob2Q6ICdQT1NUJ1xuICB9LCBjYWxsYmFjaylcbn1cblxuZnVuY3Rpb24gcmVuYW1lIChvbGRQYXRoLCBuZXdQYXRoLCBjYWxsYmFjaykge1xuICAvLyB0aGlzLl9zb2NrZXQuZW1pdCgncmVuYW1lJywgb2xkUGF0aCwgbmV3UGF0aCwgY2FsbGJhY2spXG4gIGNsaWVudC5yZXF1ZXN0KHtcbiAgICBwYXRoOiAnL3JlbmFtZScsXG4gICAgcGF5bG9hZDoge1xuICAgICAgb2xkUGF0aDogb2xkUGF0aCxcbiAgICAgIG5ld1BhdGg6IG5ld1BhdGhcbiAgICB9LFxuICAgIG1ldGhvZDogJ1BVVCdcbiAgfSwgY2FsbGJhY2spXG59XG5cbmZ1bmN0aW9uIHJlbW92ZSAocGF0aCwgY2FsbGJhY2spIHtcbiAgLy8gdGhpcy5fc29ja2V0LmVtaXQoJ3JlbW92ZScsIHBhdGgsIGNhbGxiYWNrKVxuICBjbGllbnQucmVxdWVzdCh7XG4gICAgcGF0aDogJy9yZW1vdmUnLFxuICAgIHBheWxvYWQ6IHtcbiAgICAgIHBhdGg6IHBhdGhcbiAgICB9LFxuICAgIG1ldGhvZDogJ0RFTEVURSdcbiAgfSwgY2FsbGJhY2spXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBta2RpcjogbWtkaXIsXG4gIG1rZmlsZTogbWtmaWxlLFxuICBjb3B5OiBjb3B5LFxuICByZWFkRmlsZTogcmVhZEZpbGUsXG4gIHdyaXRlRmlsZTogd3JpdGVGaWxlLFxuICByZW5hbWU6IHJlbmFtZSxcbiAgcmVtb3ZlOiByZW1vdmVcbn1cbiIsInZhciBleHRlbmQgPSByZXF1aXJlKCdleHRlbmQnKVxuXG5mdW5jdGlvbiBGaWxlIChkYXRhKSB7XG4gIGV4dGVuZCh0aGlzLCBkYXRhKVxuICBpZiAodGhpcy5pc0RpcmVjdG9yeSkge1xuICAgIHRoaXMuZXhwYW5kZWQgPSBmYWxzZVxuICB9XG59XG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhGaWxlLnByb3RvdHlwZSwge1xuICBpZDoge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMucmVsYXRpdmVQYXRoXG4gICAgfVxuICB9LFxuICBpc0ZpbGU6IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiAhdGhpcy5pc0RpcmVjdG9yeVxuICAgIH1cbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlXG4iLCJmdW5jdGlvbiBGaWxlcyAoKSB7XG4gIHRoaXMuaXRlbXMgPSBbXVxufVxuRmlsZXMucHJvdG90eXBlLmZpbmQgPSBmdW5jdGlvbiAoZmlsZSkge1xuICByZXR1cm4gdGhpcy5pdGVtcy5maW5kKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgcmV0dXJuIGl0ZW0ucmVsYXRpdmVQYXRoID09PSBmaWxlLnJlbGF0aXZlUGF0aFxuICB9KVxufVxuRmlsZXMucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gIHZhciBpdGVtID0gdGhpcy5maW5kKGZpbGUpXG4gIGlmIChpdGVtKSB7XG4gICAgdGhpcy5pdGVtcy5zcGxpY2UodGhpcy5pdGVtcy5pbmRleE9mKGl0ZW0pLCAxKVxuICB9XG59XG5GaWxlcy5wcm90b3R5cGUuZmluZEJ5UGF0aCA9IGZ1bmN0aW9uIChyZWxhdGl2ZVBhdGgpIHtcbiAgcmV0dXJuIHRoaXMuaXRlbXMuZmluZChmdW5jdGlvbiAoaXRlbSkge1xuICAgIHJldHVybiBpdGVtLnJlbGF0aXZlUGF0aCA9PT0gcmVsYXRpdmVQYXRoXG4gIH0pXG59XG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVzXG4iLCJ2YXIgcGFnZSA9IHJlcXVpcmUoJ3BhZ2UnKVxudmFyIHFzID0gcmVxdWlyZSgncXVlcnlzdHJpbmcnKVxudmFyIGZzID0gcmVxdWlyZSgnLi9mcycpXG52YXIgc3RhdGUgPSByZXF1aXJlKCcuL3N0YXRlJylcbnZhciBjbGllbnQgPSByZXF1aXJlKCcuL2NsaWVudCcpXG52YXIgc2Vzc2lvbnMgPSByZXF1aXJlKCcuL3Nlc3Npb25zJylcbnZhciBmaWxlcyA9IHJlcXVpcmUoJy4vZmlsZXMnKVxudmFyIFRyZWUgPSByZXF1aXJlKCcuL3RyZWUnKVxudmFyIEZzbyA9IHJlcXVpcmUoJy4vZnNvJylcbnZhciBSZWNlbnQgPSByZXF1aXJlKCcuL3JlY2VudCcpXG52YXIgUHJvY2Vzc2VzID0gcmVxdWlyZSgnLi9wcm9jZXNzZXMnKVxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKVxudmFyIHNwbGl0dGVyID0gcmVxdWlyZSgnLi9zcGxpdHRlcicpXG52YXIgZWRpdG9yID0gcmVxdWlyZSgnLi9lZGl0b3InKVxudmFyIGZpbGVFZGl0b3IgPSByZXF1aXJlKCcuL2ZpbGUtZWRpdG9yJylcbnZhciBsaW50ZXIgPSByZXF1aXJlKCcuL3N0YW5kYXJkJylcbnZhciB3YXRjaCA9IHJlcXVpcmUoJy4vd2F0Y2gnKVxuXG52YXIgcHJvY2Vzc2VzRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncHJvY2Vzc2VzJylcbnZhciByZWNlbnRFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWNlbnQnKVxudmFyIHRyZWVFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0cmVlJylcbnZhciB3b3Jrc3BhY2VzRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd29ya3NwYWNlcycpXG5cbndpbmRvdy5vbmJlZm9yZXVubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHNlc3Npb25zLmRpcnR5Lmxlbmd0aCkge1xuICAgIHJldHVybiAnVW5zYXZlZCBjaGFuZ2VzIHdpbGwgYmUgbG9zdCAtIGFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBsZWF2ZT8nXG4gIH1cbn1cblxuY2xpZW50LmNvbm5lY3QoZnVuY3Rpb24gKGVycikge1xuICBpZiAoZXJyKSB7XG4gICAgcmV0dXJuIHV0aWwuaGFuZGxlRXJyb3IoZXJyKVxuICB9XG5cbiAgY2xpZW50LnJlcXVlc3QoJy93YXRjaGVkJywgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiB1dGlsLmhhbmRsZUVycm9yKGVycilcbiAgICB9XG5cbiAgICAvLyBJbml0aWFsaXplIHRoZSBmaWxlc1xuICAgIGZpbGVzLml0ZW1zID0gcGF5bG9hZC53YXRjaGVkLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgcmV0dXJuIG5ldyBGc28oaXRlbSlcbiAgICB9KVxuXG4gICAgLy8gU3Vic2NyaWJlIHRvIHdhdGNoZWQgZmlsZSBjaGFuZ2VzXG4gICAgLy8gdGhhdCBoYXBwZW4gb24gdGhlIGZpbGUgc3lzdGVtXG4gICAgd2F0Y2goZmlsZXMpXG5cbiAgICAvLyBMb2FkIHRoZSBzdGF0ZSBmcm9tIGxvY2FsU3RvcmFnZVxuICAgIHN0YXRlLmxvYWQoZmlsZXMpXG5cbiAgICAvLyBTYXZlIHN0YXRlIG9uIHBhZ2UgdW5sb2FkXG4gICAgd2luZG93Lm9udW5sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ2xvZycpXG4gICAgICBzdGF0ZS5zYXZlKGZpbGVzKVxuICAgIH1cblxuICAgIC8vIEJ1aWxkIHRoZSB0cmVlIHBhbmVcbiAgICB2YXIgdHJlZVZpZXcgPSBuZXcgVHJlZSh0cmVlRWwsIGZpbGVzLCBzdGF0ZSlcbiAgICB0cmVlVmlldy5yZW5kZXIoKVxuXG4gICAgLy8gQnVpbGQgdGhlIHJlY2VudCBsaXN0IHBhbmVcbiAgICB2YXIgcmVjZW50VmlldyA9IG5ldyBSZWNlbnQocmVjZW50RWwsIHN0YXRlKVxuICAgIHJlY2VudFZpZXcucmVuZGVyKClcblxuICAgIC8vIEJ1aWxkIHRoZSBwcm9jc3NlcyBwYW5lXG4gICAgdmFyIHByb2Nlc3Nlc1ZpZXcgPSBuZXcgUHJvY2Vzc2VzKHByb2Nlc3Nlc0VsKVxuICAgIHByb2Nlc3Nlc1ZpZXcucmVuZGVyKClcblxuICAgIC8qIEluaXRpYWxpemUgdGhlIHNwbGl0dGVycyAqL1xuICAgIGZ1bmN0aW9uIHJlc2l6ZUVkaXRvciAoKSB7XG4gICAgICBlZGl0b3IucmVzaXplKClcbiAgICAgIHByb2Nlc3Nlc1ZpZXcuZWRpdG9yLnJlc2l6ZSgpXG4gICAgfVxuXG4gICAgc3BsaXR0ZXIoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NpZGViYXItd29ya3NwYWNlcycpLCByZXNpemVFZGl0b3IpXG4gICAgc3BsaXR0ZXIoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dvcmtzcGFjZXMtaW5mbycpLCByZXNpemVFZGl0b3IpXG4gICAgc3BsaXR0ZXIoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21haW4tZm9vdGVyJyksIHJlc2l6ZUVkaXRvcilcblxuICAgIC8qIEluaXRpYWxpemUgdGhlIGxpbnRlciAqL1xuICAgIGxpbnRlcigpXG5cbiAgICBwYWdlKCcvJywgZnVuY3Rpb24gKGN0eCkge1xuICAgICAgd29ya3NwYWNlc0VsLmNsYXNzTmFtZSA9ICd3ZWxjb21lJ1xuICAgIH0pXG5cbiAgICBwYWdlKCcvZmlsZScsIGZ1bmN0aW9uIChjdHgsIG5leHQpIHtcbiAgICAgIHZhciByZWxhdGl2ZVBhdGggPSBxcy5wYXJzZShjdHgucXVlcnlzdHJpbmcpLnBhdGhcbiAgICAgIHZhciBmaWxlID0gZmlsZXMuZmluZEJ5UGF0aChyZWxhdGl2ZVBhdGgpXG5cbiAgICAgIGlmICghZmlsZSkge1xuICAgICAgICByZXR1cm4gbmV4dCgpXG4gICAgICB9XG5cbiAgICAgIHZhciBzZXNzaW9uID0gc2Vzc2lvbnMuZmluZChmaWxlKVxuXG4gICAgICBmdW5jdGlvbiBzZXRTZXNzaW9uICgpIHtcbiAgICAgICAgd29ya3NwYWNlc0VsLmNsYXNzTmFtZSA9ICdlZGl0b3InXG5cbiAgICAgICAgLy8gVXBkYXRlIHN0YXRlXG4gICAgICAgIHN0YXRlLmN1cnJlbnQgPSBmaWxlXG5cbiAgICAgICAgdmFyIHJlY2VudCA9IHN0YXRlLnJlY2VudFxuICAgICAgICBpZiAoIXJlY2VudC5maW5kKGZpbGUpKSB7XG4gICAgICAgICAgcmVjZW50Lml0ZW1zLnVuc2hpZnQoZmlsZSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldCB0aGUgZWRpdG9yIHNlc3Npb25cbiAgICAgICAgZWRpdG9yLnNldFNlc3Npb24oc2Vzc2lvbi5lZGl0U2Vzc2lvbilcbiAgICAgICAgZWRpdG9yLnJlc2l6ZSgpXG5cbiAgICAgICAgcmVjZW50Vmlldy5yZW5kZXIoKVxuICAgICAgfVxuXG4gICAgICBpZiAoc2Vzc2lvbikge1xuICAgICAgICBzZXRTZXNzaW9uKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZzLnJlYWRGaWxlKHJlbGF0aXZlUGF0aCwgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiB1dGlsLmhhbmRsZUVycm9yKGVycilcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZXNzaW9uID0gc2Vzc2lvbnMuYWRkKGZpbGUsIHBheWxvYWQuY29udGVudHMpXG4gICAgICAgICAgc2V0U2Vzc2lvbigpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSlcblxuICAgIHBhZ2UoJyonLCBmdW5jdGlvbiAoY3R4KSB7XG4gICAgICB3b3Jrc3BhY2VzRWwuY2xhc3NOYW1lID0gJ25vdC1mb3VuZCdcbiAgICB9KVxuXG4gICAgcGFnZSh7XG4gICAgICBoYXNoYmFuZzogdHJ1ZVxuICAgIH0pXG5cbiAgICB3aW5kb3cuZmlsZXMgPSBmaWxlc1xuICAgIHdpbmRvdy5maWxlRWRpdG9yID0gZmlsZUVkaXRvclxuICB9KVxufSlcbiIsInZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJylcbnZhciBjbGllbnQgPSByZXF1aXJlKCcuL2NsaWVudCcpXG5cbmZ1bmN0aW9uIHJ1biAoY29tbWFuZCwgbmFtZSwgY2FsbGJhY2spIHtcbiAgaWYgKHR5cGVvZiBuYW1lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY2FsbGJhY2sgPSBuYW1lXG4gICAgbmFtZSA9IGNvbW1hbmRcbiAgfVxuICBpZiAoIW5hbWUpIHtcbiAgICBuYW1lID0gY29tbWFuZFxuICB9XG5cbiAgY2xpZW50LnJlcXVlc3Qoe1xuICAgIHBhdGg6ICcvaW8nLFxuICAgIHBheWxvYWQ6IHtcbiAgICAgIG5hbWU6IG5hbWUsXG4gICAgICBjb21tYW5kOiBjb21tYW5kXG4gICAgfSxcbiAgICBtZXRob2Q6ICdQT1NUJ1xuICB9LCBmdW5jdGlvbiAoZXJyLCBwYXlsb2FkKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgdXRpbC5oYW5kbGVFcnJvcihlcnIpXG4gICAgfVxuICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGVyciwgcGF5bG9hZClcbiAgfSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHJ1bjogcnVuXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gIHZhciBtb2RlcyA9IHtcbiAgICAnLmpzJzogJ2FjZS9tb2RlL2phdmFzY3JpcHQnLFxuICAgICcuY3NzJzogJ2FjZS9tb2RlL2NzcycsXG4gICAgJy5zY3NzJzogJ2FjZS9tb2RlL3Njc3MnLFxuICAgICcubGVzcyc6ICdhY2UvbW9kZS9sZXNzJyxcbiAgICAnLmh0bWwnOiAnYWNlL21vZGUvaHRtbCcsXG4gICAgJy5odG0nOiAnYWNlL21vZGUvaHRtbCcsXG4gICAgJy5lanMnOiAnYWNlL21vZGUvaHRtbCcsXG4gICAgJy5qc29uJzogJ2FjZS9tb2RlL2pzb24nLFxuICAgICcubWQnOiAnYWNlL21vZGUvbWFya2Rvd24nLFxuICAgICcuY29mZmVlJzogJ2FjZS9tb2RlL2NvZmZlZScsXG4gICAgJy5qYWRlJzogJ2FjZS9tb2RlL2phZGUnLFxuICAgICcucGhwJzogJ2FjZS9tb2RlL3BocCcsXG4gICAgJy5weSc6ICdhY2UvbW9kZS9weXRob24nLFxuICAgICcuc2Fzcyc6ICdhY2UvbW9kZS9zYXNzJyxcbiAgICAnLnR4dCc6ICdhY2UvbW9kZS90ZXh0JyxcbiAgICAnLnR5cGVzY3JpcHQnOiAnYWNlL21vZGUvdHlwZXNjcmlwdCcsXG4gICAgJy5naXRpZ25vcmUnOiAnYWNlL21vZGUvZ2l0aWdub3JlJyxcbiAgICAnLnhtbCc6ICdhY2UvbW9kZS94bWwnXG4gIH1cblxuICByZXR1cm4gbW9kZXNbZmlsZS5leHRdXG59XG4iLCJ2YXIgSW5jcmVtZW50YWxET00gPSByZXF1aXJlKCdpbmNyZW1lbnRhbC1kb20nKVxudmFyIHBhdGNoID0gSW5jcmVtZW50YWxET00ucGF0Y2hcblxuLy8gRml4IHVwIHRoZSBlbGVtZW50IGB2YWx1ZWAgYXR0cmlidXRlXG5JbmNyZW1lbnRhbERPTS5hdHRyaWJ1dGVzLnZhbHVlID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICBlbC52YWx1ZSA9IHZhbHVlXG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGVsLCB2aWV3LCBkYXRhKSB7XG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKVxuICBpZiAoYXJncy5sZW5ndGggPD0gMykge1xuICAgIHBhdGNoKGVsLCB2aWV3LCBkYXRhKVxuICB9IGVsc2Uge1xuICAgIHBhdGNoKGVsLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2aWV3LmFwcGx5KHRoaXMsIGFyZ3Muc2xpY2UoMikpXG4gICAgfSlcbiAgfVxufVxuIiwidmFyIEluY3JlbWVudGFsRE9NID0gcmVxdWlyZSgnaW5jcmVtZW50YWwtZG9tJylcbnZhciBwYXRjaCA9IEluY3JlbWVudGFsRE9NLnBhdGNoXG52YXIgZWxlbWVudE9wZW4gPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50T3BlblxudmFyIGVsZW1lbnRWb2lkID0gSW5jcmVtZW50YWxET00uZWxlbWVudFZvaWRcbnZhciBlbGVtZW50Q2xvc2UgPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50Q2xvc2VcbnZhciBlbGVtZW50UGxhY2Vob2xkZXIgPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50UGxhY2Vob2xkZXJcbnZhciB0ZXh0ID0gSW5jcmVtZW50YWxET00udGV4dFxuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XG52YXIgaG9pc3RlZDEgPSBbXCJjbGFzc1wiLCBcImNvbnRyb2xcIl1cbnZhciBob2lzdGVkMiA9IFtcImNsYXNzXCIsIFwiaW5wdXQtZ3JvdXBcIl1cbnZhciBob2lzdGVkMyA9IFtcImNsYXNzXCIsIFwiaW5wdXQtZ3JvdXAtYnRuIGRyb3B1cFwiXVxudmFyIGhvaXN0ZWQ0ID0gW1widHlwZVwiLCBcImJ1dHRvblwiLCBcImNsYXNzXCIsIFwiYnRuIGJ0bi1kZWZhdWx0IGJ0bi1zbSBkcm9wZG93bi10b2dnbGVcIiwgXCJkYXRhLXRvZ2dsZVwiLCBcImRyb3Bkb3duXCJdXG52YXIgaG9pc3RlZDUgPSBbXCJjbGFzc1wiLCBcImNhcmV0XCJdXG52YXIgaG9pc3RlZDYgPSBbXCJjbGFzc1wiLCBcImRyb3Bkb3duLW1lbnVcIl1cbnZhciBob2lzdGVkNyA9IFtcImhyZWZcIiwgXCIjXCJdXG52YXIgaG9pc3RlZDggPSBbXCJ0eXBlXCIsIFwidGV4dFwiLCBcImNsYXNzXCIsIFwiZm9ybS1jb250cm9sIGlucHV0LXNtXCIsIFwibmFtZVwiLCBcImNvbW1hbmRcIiwgXCJyZXF1aXJlZFwiLCBcIlwiLCBcImF1dG9jb21wbGV0ZVwiLCBcIm9mZlwiLCBcInBsYWNlaG9sZGVyXCIsIFwiPlwiXVxudmFyIGhvaXN0ZWQ5ID0gW1wiY2xhc3NcIiwgXCJpbnB1dC1ncm91cC1idG5cIl1cbnZhciBob2lzdGVkMTAgPSBbXCJjbGFzc1wiLCBcImJ0biBidG4tZGVmYXVsdCBidG4tc21cIiwgXCJ0eXBlXCIsIFwic3VibWl0XCIsIFwidGl0bGVcIiwgXCJSdW4gY29tbWFuZFwiXVxudmFyIGhvaXN0ZWQxMSA9IFtcImNsYXNzXCIsIFwiYnRuIGJ0bi1zdWNjZXNzIGJ0bi1zbVwiLCBcInR5cGVcIiwgXCJidXR0b25cIiwgXCJ0aXRsZVwiLCBcIlJlbW92ZSBkZWFkIHByb2Nlc3Nlc1wiXVxudmFyIGhvaXN0ZWQxMiA9IFtcImNsYXNzXCIsIFwibmF2IG5hdi10YWJzIHhuYXYtanVzdGlmaWVkXCJdXG52YXIgaG9pc3RlZDEzID0gW1wiY2xhc3NcIiwgXCJkcm9wZG93bi10b2dnbGVcIiwgXCJkYXRhLXRvZ2dsZVwiLCBcImRyb3Bkb3duXCJdXG52YXIgaG9pc3RlZDE0ID0gW1wiY2xhc3NcIiwgXCJjYXJldFwiXVxudmFyIGhvaXN0ZWQxNSA9IFtcImNsYXNzXCIsIFwiZHJvcGRvd24tbWVudVwiXVxudmFyIGhvaXN0ZWQxNiA9IFtcImNsYXNzXCIsIFwiZHJvcGRvd24taGVhZGVyXCJdXG52YXIgaG9pc3RlZDE3ID0gW1wicm9sZVwiLCBcInNlcGFyYXRvclwiLCBcImNsYXNzXCIsIFwiZGl2aWRlclwiXVxudmFyIGhvaXN0ZWQxOCA9IFtcImNsYXNzXCIsIFwiZmEgZmEtc3RvcFwiXVxudmFyIGhvaXN0ZWQxOSA9IFtcImNsYXNzXCIsIFwiZmEgZmEtcmVmcmVzaFwiXVxudmFyIGhvaXN0ZWQyMCA9IFtcImNsYXNzXCIsIFwiZmEgZmEtY2xvc2VcIl1cbnZhciBob2lzdGVkMjEgPSBbXCJjbGFzc1wiLCBcInByb2Nlc3Nlc1wiXVxudmFyIGhvaXN0ZWQyMiA9IFtcImNsYXNzXCIsIFwib3V0cHV0XCJdXG5cbnJldHVybiBmdW5jdGlvbiBkZXNjcmlwdGlvbiAobW9kZWwsIGFjdGlvbnMpIHtcbiAgZWxlbWVudE9wZW4oXCJkaXZcIiwgbnVsbCwgaG9pc3RlZDEpXG4gICAgZWxlbWVudE9wZW4oXCJmb3JtXCIsIG51bGwsIG51bGwsIFwib25zdWJtaXRcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgIGFjdGlvbnMucnVuKHRoaXMuY29tbWFuZC52YWx1ZSl9KVxuICAgICAgZWxlbWVudE9wZW4oXCJkaXZcIiwgbnVsbCwgaG9pc3RlZDIpXG4gICAgICAgIGVsZW1lbnRPcGVuKFwiZGl2XCIsIG51bGwsIGhvaXN0ZWQzKVxuICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYnV0dG9uXCIsIG51bGwsIGhvaXN0ZWQ0KVxuICAgICAgICAgICAgdGV4dChcIlRhc2sgXCIpXG4gICAgICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgaG9pc3RlZDUpXG4gICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJzcGFuXCIpXG4gICAgICAgICAgZWxlbWVudENsb3NlKFwiYnV0dG9uXCIpXG4gICAgICAgICAgZWxlbWVudE9wZW4oXCJ1bFwiLCBudWxsLCBob2lzdGVkNilcbiAgICAgICAgICAgIDsoQXJyYXkuaXNBcnJheShtb2RlbC50YXNrcykgPyBtb2RlbC50YXNrcyA6IE9iamVjdC5rZXlzKG1vZGVsLnRhc2tzKSkuZm9yRWFjaChmdW5jdGlvbih0YXNrLCAkaW5kZXgpIHtcbiAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJsaVwiLCB0YXNrLm5hbWUpXG4gICAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJhXCIsIG51bGwsIGhvaXN0ZWQ3LCBcIm9uY2xpY2tcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgICAgICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGFjdGlvbnMuc2V0Q29tbWFuZCgnbnBtIHJ1biAnICsgdGFzay5uYW1lKX0pXG4gICAgICAgICAgICAgICAgICB0ZXh0KFwiXCIgKyAodGFzay5uYW1lKSArIFwiXCIpXG4gICAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwiYVwiKVxuICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJsaVwiKVxuICAgICAgICAgICAgfSwgbW9kZWwudGFza3MpXG4gICAgICAgICAgZWxlbWVudENsb3NlKFwidWxcIilcbiAgICAgICAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gICAgICAgIGVsZW1lbnRPcGVuKFwiaW5wdXRcIiwgbnVsbCwgaG9pc3RlZDgsIFwidmFsdWVcIiwgbW9kZWwuY29tbWFuZClcbiAgICAgICAgZWxlbWVudENsb3NlKFwiaW5wdXRcIilcbiAgICAgICAgZWxlbWVudE9wZW4oXCJzcGFuXCIsIG51bGwsIGhvaXN0ZWQ5KVxuICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYnV0dG9uXCIsIG51bGwsIGhvaXN0ZWQxMClcbiAgICAgICAgICAgIHRleHQoXCJSdW5cIilcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJidXR0b25cIilcbiAgICAgICAgICBpZiAobW9kZWwuZGVhZC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYnV0dG9uXCIsIG51bGwsIGhvaXN0ZWQxMSwgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgICAgICAgICBhY3Rpb25zLnJlbW92ZUFsbERlYWQoKX0pXG4gICAgICAgICAgICAgIHRleHQoXCJDbGVhciBjb21wbGV0ZWRcIilcbiAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImJ1dHRvblwiKVxuICAgICAgICAgIH1cbiAgICAgICAgZWxlbWVudENsb3NlKFwic3BhblwiKVxuICAgICAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gICAgZWxlbWVudENsb3NlKFwiZm9ybVwiKVxuICAgIGVsZW1lbnRPcGVuKFwidWxcIiwgbnVsbCwgaG9pc3RlZDEyKVxuICAgICAgOyhBcnJheS5pc0FycmF5KG1vZGVsLnByb2Nlc3NlcykgPyBtb2RlbC5wcm9jZXNzZXMgOiBPYmplY3Qua2V5cyhtb2RlbC5wcm9jZXNzZXMpKS5mb3JFYWNoKGZ1bmN0aW9uKHByb2Nlc3MsICRpbmRleCkge1xuICAgICAgICBlbGVtZW50T3BlbihcImxpXCIsIHByb2Nlc3MucGlkLCBudWxsLCBcImNsYXNzXCIsIHByb2Nlc3MgPT09IG1vZGVsLmN1cnJlbnQgPyAnZHJvcHVwIGFjdGl2ZScgOiAnZHJvcHVwJylcbiAgICAgICAgICBlbGVtZW50T3BlbihcImFcIiwgbnVsbCwgaG9pc3RlZDEzLCBcIm9uY2xpY2tcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICAgIGFjdGlvbnMuc2V0Q3VycmVudChwcm9jZXNzKX0pXG4gICAgICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgbnVsbCwgXCJjbGFzc1wiLCAnY2lyY2xlICcgKyAoIXByb2Nlc3MuaXNBbGl2ZSA/ICdkZWFkJyA6IChwcm9jZXNzLmlzQWN0aXZlID8gJ2FsaXZlIGFjdGl2ZScgOiAnYWxpdmUnKSkpXG4gICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJzcGFuXCIpXG4gICAgICAgICAgICB0ZXh0KFwiIFxcXG4gICAgICAgICAgICAgICAgICAgICAgXCIgKyAocHJvY2Vzcy5uYW1lIHx8IHByb2Nlc3MuY29tbWFuZCkgKyBcIiBcXFxuICAgICAgICAgICAgICAgICAgICAgIFwiKVxuICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJzcGFuXCIsIG51bGwsIGhvaXN0ZWQxNClcbiAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJhXCIpXG4gICAgICAgICAgZWxlbWVudE9wZW4oXCJ1bFwiLCBudWxsLCBob2lzdGVkMTUpXG4gICAgICAgICAgICBlbGVtZW50T3BlbihcImxpXCIsIG51bGwsIGhvaXN0ZWQxNilcbiAgICAgICAgICAgICAgdGV4dChcIlByb2Nlc3MgW1wiICsgKHByb2Nlc3MucGlkKSArIFwiXVwiKVxuICAgICAgICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwibGlcIiwgbnVsbCwgaG9pc3RlZDE3KVxuICAgICAgICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwibGlcIilcbiAgICAgICAgICAgICAgaWYgKHByb2Nlc3MuaXNBbGl2ZSkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYVwiLCBcImtpbGwtdGFiXCIsIG51bGwsIFwib25jbGlja1wiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgYWN0aW9ucy5raWxsKHByb2Nlc3MpfSlcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiaVwiLCBudWxsLCBob2lzdGVkMTgpXG4gICAgICAgICAgICAgICAgICAgIHRleHQoXCIgU3RvcFwiKVxuICAgICAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwiaVwiKVxuICAgICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImFcIilcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICAgICAgICAgIGlmICghcHJvY2Vzcy5pc0FsaXZlKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwibGlcIilcbiAgICAgICAgICAgICAgICBlbGVtZW50T3BlbihcImFcIiwgXCJyZXN1cnJlY3QtdGFiXCIsIG51bGwsIFwib25jbGlja1wiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgYWN0aW9ucy5yZXN1cnJlY3QocHJvY2Vzcyl9KVxuICAgICAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJpXCIsIG51bGwsIGhvaXN0ZWQxOSlcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImlcIilcbiAgICAgICAgICAgICAgICAgIHRleHQoXCIgUmVzdXJyZWN0XCIpXG4gICAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwiYVwiKVxuICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJsaVwiKVxuICAgICAgICAgICAgICBlbGVtZW50T3BlbihcImxpXCIpXG4gICAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJhXCIsIFwicmVtb3ZlLXRhYlwiLCBudWxsLCBcIm9uY2xpY2tcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgICAgICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGFjdGlvbnMucmVtb3ZlKHByb2Nlc3MpfSlcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiaVwiLCBudWxsLCBob2lzdGVkMjApXG4gICAgICAgICAgICAgICAgICAgIHRleHQoXCIgQ2xvc2VcIilcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImlcIilcbiAgICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJhXCIpXG4gICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImxpXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgZWxlbWVudENsb3NlKFwidWxcIilcbiAgICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICAgIH0sIG1vZGVsLnByb2Nlc3NlcylcbiAgICBlbGVtZW50Q2xvc2UoXCJ1bFwiKVxuICBlbGVtZW50Q2xvc2UoXCJkaXZcIilcbiAgZWxlbWVudE9wZW4oXCJkaXZcIiwgbnVsbCwgaG9pc3RlZDIxLCBcInN0eWxlXCIsIHtkaXNwbGF5OiBtb2RlbC5jdXJyZW50ID8gJycgOiAnbm9uZSd9KVxuICAgIGVsZW1lbnRQbGFjZWhvbGRlcihcInBsYWNlaG9sZGVyXCIsIFwib3V0cHV0XCIsIGhvaXN0ZWQyMilcbiAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG59XG59KSgpO1xuIiwidmFyIHBhdGNoID0gcmVxdWlyZSgnLi4vcGF0Y2gnKVxudmFyIHZpZXcgPSByZXF1aXJlKCcuL2luZGV4Lmh0bWwnKVxudmFyIG1vZGVsID0gcmVxdWlyZSgnLi9tb2RlbCcpXG52YXIgVGFzayA9IHJlcXVpcmUoJy4vdGFzaycpXG52YXIgUHJvY2VzcyA9IHJlcXVpcmUoJy4vcHJvY2VzcycpXG52YXIgY2xpZW50ID0gcmVxdWlyZSgnLi4vY2xpZW50JylcbnZhciBpbyA9IHJlcXVpcmUoJy4uL2lvJylcbnZhciBmcyA9IHJlcXVpcmUoJy4uL2ZzJylcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpXG5cbmZ1bmN0aW9uIFByb2Nlc3NlcyAoZWwpIHtcbiAgdmFyIGVkaXRvciwgY29tbWFuZEVsXG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGlzQWN0aXZlIHN0YXRlIG9uIHRoZSBwcm9jZXNzLlxuICAgKiBQcm9jZXNzZXMgYXJlIGFjdGl2YXRlZCB3aGVuIHRoZXkgcmVjZWl2ZSBzb21lIGRhdGEuXG4gICAqIEFmdGVyIGEgc2hvcnQgZGVsYXksIHRoaXMgaXMgcmVzZXQgdG8gaW5hY3RpdmUuXG4gICAqL1xuICBmdW5jdGlvbiBzZXRQcm9jZXNzQWN0aXZlU3RhdGUgKHByb2Nlc3MsIHZhbHVlKSB7XG4gICAgaWYgKHByb2Nlc3MuaXNBY3RpdmUgIT09IHZhbHVlKSB7XG4gICAgICB2YXIgdGltZW91dCA9IHByb2Nlc3MuX3RpbWVvdXRcbiAgICAgIGlmICh0aW1lb3V0KSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KVxuICAgICAgfVxuXG4gICAgICBwcm9jZXNzLmlzQWN0aXZlID0gdmFsdWVcbiAgICAgIGlmIChwcm9jZXNzLmlzQWN0aXZlKSB7XG4gICAgICAgIHByb2Nlc3MuX3RpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygndGltZW91dCcpXG4gICAgICAgICAgc2V0UHJvY2Vzc0FjdGl2ZVN0YXRlKHByb2Nlc3MsIGZhbHNlKVxuICAgICAgICB9LCAxNTAwKVxuICAgICAgfVxuICAgICAgcmVuZGVyKClcbiAgICB9XG4gIH1cblxuICBjbGllbnQuc3Vic2NyaWJlKCcvaW8nLCBmdW5jdGlvbiAocGF5bG9hZCkge1xuICAgIHZhciBwcm9jZXNzID0gbW9kZWwuZmluZFByb2Nlc3NCeVBpZChwYXlsb2FkLnBpZClcblxuICAgIGlmIChwcm9jZXNzKSB7XG4gICAgICB2YXIgc2Vzc2lvbiA9IHByb2Nlc3Muc2Vzc2lvblxuXG4gICAgICAvLyBJbnNlcnQgZGF0YSBjaHVua1xuICAgICAgc2Vzc2lvbi5pbnNlcnQoe1xuICAgICAgICByb3c6IHNlc3Npb24uZ2V0TGVuZ3RoKCksXG4gICAgICAgIGNvbHVtbjogMFxuICAgICAgfSwgcGF5bG9hZC5kYXRhKVxuXG4gICAgICAvLyBNb3ZlIHRvIHRoZSBlbmQgb2YgdGhlIG91dHB1dFxuICAgICAgc2Vzc2lvbi5nZXRTZWxlY3Rpb24oKS5tb3ZlQ3Vyc29yRmlsZUVuZCgpXG5cbiAgICAgIC8vIFNldCB0aGUgcHJvY2VzcyBhY3RpdmUgc3RhdGUgdG8gdHJ1ZVxuICAgICAgc2V0UHJvY2Vzc0FjdGl2ZVN0YXRlKHByb2Nlc3MsIHRydWUpXG5cbiAgICAgIHJlbmRlcigpXG4gICAgfVxuICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgcmV0dXJuIHV0aWwuaGFuZGxlRXJyb3IoZXJyKVxuICAgIH1cbiAgfSlcblxuICB2YXIgYWN0aW9ucyA9IHtcbiAgICBydW46IGZ1bmN0aW9uIChjb21tYW5kLCBuYW1lKSB7XG4gICAgICBpby5ydW4oY29tbWFuZCwgbmFtZSwgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIHV0aWwuaGFuZGxlRXJyb3IoZXJyKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0sXG4gICAgcmVtb3ZlOiBmdW5jdGlvbiAocHJvY2Vzcykge1xuICAgICAgaWYgKG1vZGVsLnJlbW92ZShwcm9jZXNzKSkge1xuICAgICAgICByZW5kZXIoKVxuICAgICAgfVxuICAgIH0sXG4gICAgcmVtb3ZlQWxsRGVhZDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGRpZWQgPSBtb2RlbC5yZW1vdmVBbGxEZWFkKClcbiAgICAgIGlmIChkaWVkLmxlbmd0aCkge1xuICAgICAgICByZW5kZXIoKVxuICAgICAgfVxuICAgIH0sXG4gICAgcmVzdXJyZWN0OiBmdW5jdGlvbiAocHJvY2Vzcykge1xuICAgICAgbW9kZWwucmVtb3ZlKHByb2Nlc3MpXG4gICAgICB0aGlzLnJ1bihwcm9jZXNzLmNvbW1hbmQsIHByb2Nlc3MubmFtZSlcbiAgICAgIHJlbmRlcigpXG4gICAgfSxcbiAgICBraWxsOiBmdW5jdGlvbiAocHJvY2Vzcykge1xuICAgICAgY2xpZW50LnJlcXVlc3Qoe1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgcGF0aDogJy9pby9raWxsJyxcbiAgICAgICAgcGF5bG9hZDoge1xuICAgICAgICAgIHBpZDogcHJvY2Vzcy5waWRcbiAgICAgICAgfVxuICAgICAgfSwgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgdXRpbC5oYW5kbGVFcnJvcihlcnIpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSxcbiAgICBzZXRDb21tYW5kOiBmdW5jdGlvbiAoY29tbWFuZCkge1xuICAgICAgbW9kZWwuY29tbWFuZCA9IGNvbW1hbmRcbiAgICAgIHJlbmRlcigpXG4gICAgICBjb21tYW5kRWwuZm9jdXMoKVxuICAgIH0sXG4gICAgc2V0Q3VycmVudDogZnVuY3Rpb24gKHByb2Nlc3MpIHtcbiAgICAgIG1vZGVsLmN1cnJlbnQgPSBwcm9jZXNzXG4gICAgICBpZiAobW9kZWwuY3VycmVudCkge1xuICAgICAgICBlZGl0b3Iuc2V0U2Vzc2lvbihtb2RlbC5jdXJyZW50LnNlc3Npb24pXG4gICAgICB9XG4gICAgICByZW5kZXIoKVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGxvYWRQaWRzIChwcm9jcykge1xuICAgIGNvbnNvbGUubG9nKCdwcm9jcycsIHByb2NzKVxuICAgIHZhciBwcm9jXG4gICAgdmFyIGJvcm4gPSBbXVxuXG4gICAgLy8gRmluZCBhbnkgbmV3IHByb2Nlc3Nlc1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvY3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIHByb2MgPSBwcm9jc1tpXVxuXG4gICAgICB2YXIgcHJvY2VzcyA9IG1vZGVsLnByb2Nlc3Nlcy5maW5kKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIHJldHVybiBpdGVtLnBpZCA9PT0gcHJvYy5waWRcbiAgICAgIH0pXG5cbiAgICAgIGlmICghcHJvY2Vzcykge1xuICAgICAgICAvLyBOZXcgY2hpbGQgcHJvY2VzcyBmb3VuZC4gQWRkIGl0XG4gICAgICAgIC8vIGFuZCBzZXQgaXQncyBjYWNoZWQgYnVmZmVyIGludG8gc2Vzc2lvblxuICAgICAgICBwcm9jZXNzID0gbmV3IFByb2Nlc3MocHJvYylcbiAgICAgICAgcHJvY2Vzcy5zZXNzaW9uLnNldFZhbHVlKHByb2MuYnVmZmVyKVxuICAgICAgICBib3JuLnB1c2gocHJvY2VzcylcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTaHV0IGRvd24gcHJvY2Vzc2VzIHRoYXQgaGF2ZSBkaWVkXG4gICAgbW9kZWwucHJvY2Vzc2VzLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHZhciBtYXRjaCA9IHByb2NzLmZpbmQoZnVuY3Rpb24gKGNoZWNrKSB7XG4gICAgICAgIHJldHVybiBpdGVtLnBpZCA9PT0gY2hlY2sucGlkXG4gICAgICB9KVxuICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICAvLyBpdGVtLnBpZCA9IDBcbiAgICAgICAgaXRlbS5pc0FsaXZlID0gZmFsc2VcbiAgICAgICAgc2V0UHJvY2Vzc0FjdGl2ZVN0YXRlKGl0ZW0sIGZhbHNlKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICAvLyBJbnNlcnQgYW55IG5ldyBjaGlsZCBwcm9jZXNzZXNcbiAgICBpZiAoYm9ybi5sZW5ndGgpIHtcbiAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KG1vZGVsLnByb2Nlc3NlcywgYm9ybilcbiAgICAgIGFjdGlvbnMuc2V0Q3VycmVudChib3JuWzBdKVxuICAgIH1cbiAgICByZW5kZXIoKVxuICB9XG5cbiAgY2xpZW50LnN1YnNjcmliZSgnL2lvL3BpZHMnLCBsb2FkUGlkcywgZnVuY3Rpb24gKGVycikge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiB1dGlsLmhhbmRsZUVycm9yKGVycilcbiAgICB9XG4gIH0pXG5cbiAgY2xpZW50LnJlcXVlc3Qoe1xuICAgIHBhdGg6ICcvaW8vcGlkcydcbiAgfSwgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHV0aWwuaGFuZGxlRXJyb3IoZXJyKVxuICAgIH1cbiAgICBsb2FkUGlkcyhwYXlsb2FkKVxuICB9KVxuXG4gIGZ1bmN0aW9uIHJlYWRUYXNrcyAoKSB7XG4gICAgZnMucmVhZEZpbGUoJ3BhY2thZ2UuanNvbicsIGZ1bmN0aW9uIChlcnIsIHBheWxvYWQpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgdXRpbC5oYW5kbGVFcnJvcihlcnIpXG4gICAgICB9XG5cbiAgICAgIHZhciBwa2cgPSB7fVxuICAgICAgdHJ5IHtcbiAgICAgICAgcGtnID0gSlNPTi5wYXJzZShwYXlsb2FkLmNvbnRlbnRzKVxuICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgY29uc29sZS5sb2cocGtnKVxuICAgICAgaWYgKHBrZy5zY3JpcHRzKSB7XG4gICAgICAgIHZhciB0YXNrcyA9IFtdXG4gICAgICAgIGZvciAodmFyIHNjcmlwdCBpbiBwa2cuc2NyaXB0cykge1xuICAgICAgICAgIGlmIChzY3JpcHQuc3Vic3RyKDAsIDMpID09PSAncHJlJyB8fCBzY3JpcHQuc3Vic3RyKDAsIDQpID09PSAncG9zdCcpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGFza3MucHVzaChuZXcgVGFzayh7XG4gICAgICAgICAgICBuYW1lOiBzY3JpcHQsXG4gICAgICAgICAgICBjb21tYW5kOiBwa2cuc2NyaXB0c1tzY3JpcHRdXG4gICAgICAgICAgfSkpXG4gICAgICAgIH1cbiAgICAgICAgbW9kZWwudGFza3MgPSB0YXNrc1xuICAgICAgICByZW5kZXIoKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICByZWFkVGFza3MoKVxuXG4gIGZ1bmN0aW9uIHJlbmRlciAoKSB7XG4gICAgcGF0Y2goZWwsIHZpZXcsIG1vZGVsLCBhY3Rpb25zKVxuXG4gICAgaWYgKCFlZGl0b3IpIHtcbiAgICAgIHZhciBvdXRwdXRFbCA9IGVsLnF1ZXJ5U2VsZWN0b3IoJy5vdXRwdXQnKVxuICAgICAgY29tbWFuZEVsID0gZWwucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cImNvbW1hbmRcIl0nKVxuICAgICAgZWRpdG9yID0gd2luZG93LmFjZS5lZGl0KG91dHB1dEVsKVxuXG4gICAgICBlZGl0b3Iuc2V0VGhlbWUoJ2FjZS90aGVtZS90ZXJtaW5hbCcpXG4gICAgICBlZGl0b3Iuc2V0UmVhZE9ubHkodHJ1ZSlcbiAgICAgIGVkaXRvci5yZW5kZXJlci5zZXRTaG93R3V0dGVyKGZhbHNlKVxuICAgICAgZWRpdG9yLnNldEhpZ2hsaWdodEFjdGl2ZUxpbmUoZmFsc2UpXG4gICAgICBlZGl0b3Iuc2V0U2hvd1ByaW50TWFyZ2luKGZhbHNlKVxuICAgIC8vIHNwbGl0dGVyKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsaXN0LW91dHB1dCcpLCBlZGl0b3IucmVzaXplLmJpbmQoZWRpdG9yKSlcbiAgICB9XG4gIH1cblxuICB0aGlzLm1vZGVsID0gbW9kZWxcbiAgdGhpcy5yZW5kZXIgPSByZW5kZXJcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgZWRpdG9yOiB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGVkaXRvclxuICAgICAgfVxuICAgIH1cbiAgfSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQcm9jZXNzZXNcbiIsInZhciBtb2RlbCA9IHtcbiAgdGFza3M6IFtdLFxuICBjb21tYW5kOiAnJyxcbiAgcHJvY2Vzc2VzOiBbXSxcbiAgY3VycmVudDogbnVsbCxcbiAgZ2V0IGRlYWQgKCkge1xuICAgIHJldHVybiB0aGlzLnByb2Nlc3Nlcy5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHJldHVybiAhaXRlbS5pc0FsaXZlXG4gICAgfSlcbiAgfSxcbiAgcmVtb3ZlOiBmdW5jdGlvbiAocHJvY2Vzcykge1xuICAgIHZhciBwcm9jZXNzZXMgPSB0aGlzLnByb2Nlc3Nlc1xuICAgIHZhciBpZHggPSBwcm9jZXNzZXMuaW5kZXhPZihwcm9jZXNzKVxuICAgIGlmIChpZHggPiAtMSkge1xuICAgICAgcHJvY2Vzc2VzLnNwbGljZShwcm9jZXNzZXMuaW5kZXhPZihwcm9jZXNzKSwgMSlcbiAgICAgIGlmICh0aGlzLmN1cnJlbnQgPT09IHByb2Nlc3MpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50ID0gcHJvY2Vzc2VzWzBdXG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2VcbiAgfSxcbiAgcmVtb3ZlQWxsRGVhZDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBkZWFkID0gdGhpcy5kZWFkXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZWFkLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLnJlbW92ZShkZWFkW2ldKVxuICAgIH1cbiAgICByZXR1cm4gZGVhZFxuICB9LFxuICBmaW5kUHJvY2Vzc0J5UGlkOiBmdW5jdGlvbiAocGlkKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvY2Vzc2VzLmZpbmQoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHJldHVybiBpdGVtLnBpZCA9PT0gcGlkXG4gICAgfSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1vZGVsXG4iLCJ2YXIgZXh0ZW5kID0gcmVxdWlyZSgnZXh0ZW5kJylcbnZhciBFZGl0U2Vzc2lvbiA9IHdpbmRvdy5hY2UucmVxdWlyZSgnYWNlL2VkaXRfc2Vzc2lvbicpLkVkaXRTZXNzaW9uXG5cbmZ1bmN0aW9uIFByb2Nlc3MgKGRhdGEpIHtcbiAgZXh0ZW5kKHRoaXMsIGRhdGEpXG4gIHZhciBlZGl0U2Vzc2lvbiA9IG5ldyBFZGl0U2Vzc2lvbignJywgJ2FjZS9tb2RlL3NoJylcbiAgZWRpdFNlc3Npb24uc2V0VXNlV29ya2VyKGZhbHNlKVxuICB0aGlzLnNlc3Npb24gPSBlZGl0U2Vzc2lvblxuICB0aGlzLmlzQWxpdmUgPSB0cnVlXG4gIHRoaXMuaXNBY3RpdmUgPSBmYWxzZVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFByb2Nlc3NcbiIsImZ1bmN0aW9uIFRhc2sgKGRhdGEpIHtcbiAgdGhpcy5uYW1lID0gZGF0YS5uYW1lXG4gIHRoaXMuY29tbWFuZCA9IGRhdGEuY29tbWFuZFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRhc2tcbiIsInZhciBJbmNyZW1lbnRhbERPTSA9IHJlcXVpcmUoJ2luY3JlbWVudGFsLWRvbScpXG52YXIgcGF0Y2ggPSBJbmNyZW1lbnRhbERPTS5wYXRjaFxudmFyIGVsZW1lbnRPcGVuID0gSW5jcmVtZW50YWxET00uZWxlbWVudE9wZW5cbnZhciBlbGVtZW50Vm9pZCA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRWb2lkXG52YXIgZWxlbWVudENsb3NlID0gSW5jcmVtZW50YWxET00uZWxlbWVudENsb3NlXG52YXIgZWxlbWVudFBsYWNlaG9sZGVyID0gSW5jcmVtZW50YWxET00uZWxlbWVudFBsYWNlaG9sZGVyXG52YXIgdGV4dCA9IEluY3JlbWVudGFsRE9NLnRleHRcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xudmFyIGhvaXN0ZWQxID0gW1wiY2xhc3NcIiwgXCJsaXN0LWdyb3VwXCJdXG52YXIgaG9pc3RlZDIgPSBbXCJjbGFzc1wiLCBcImNsb3NlXCJdXG52YXIgaG9pc3RlZDMgPSBbXCJjbGFzc1wiLCBcIm5hbWUgaWNvbiBpY29uLWZpbGUtdGV4dFwiXVxudmFyIGhvaXN0ZWQ0ID0gW1wiY2xhc3NcIiwgXCJsaXN0LWdyb3VwLWl0ZW0tdGV4dFwiXVxuXG5yZXR1cm4gZnVuY3Rpb24gcmVjZW50IChmaWxlcywgY3VycmVudCwgb25DbGlja0Nsb3NlKSB7XG4gIGVsZW1lbnRPcGVuKFwiZGl2XCIsIG51bGwsIGhvaXN0ZWQxLCBcInN0eWxlXCIsIHtkaXNwbGF5OiBmaWxlcy5sZW5ndGggPyAnJyA6ICdub25lJ30pXG4gICAgOyhBcnJheS5pc0FycmF5KGZpbGVzKSA/IGZpbGVzIDogT2JqZWN0LmtleXMoZmlsZXMpKS5mb3JFYWNoKGZ1bmN0aW9uKGZpbGUsICRpbmRleCkge1xuICAgICAgZWxlbWVudE9wZW4oXCJhXCIsIGZpbGUucmVsYXRpdmVQYXRoLCBudWxsLCBcInRpdGxlXCIsIGZpbGUucmVsYXRpdmVQYXRoLCBcImhyZWZcIiwgJy9maWxlP3BhdGg9JyArIGZpbGUucmVsYXRpdmVQYXRoLCBcImNsYXNzXCIsICdsaXN0LWdyb3VwLWl0ZW0nICsgKGZpbGUgPT09IGN1cnJlbnQgPyAnIGFjdGl2ZScgOiAnJykpXG4gICAgICAgIGVsZW1lbnRPcGVuKFwic3BhblwiLCBudWxsLCBob2lzdGVkMiwgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICBvbkNsaWNrQ2xvc2UoZmlsZSl9KVxuICAgICAgICAgIHRleHQoXCLDl1wiKVxuICAgICAgICBlbGVtZW50Q2xvc2UoXCJzcGFuXCIpXG4gICAgICAgIGVsZW1lbnRPcGVuKFwic3BhblwiLCBudWxsLCBob2lzdGVkMywgXCJkYXRhLW5hbWVcIiwgZmlsZS5uYW1lLCBcImRhdGEtcGF0aFwiLCBmaWxlLnJlbGF0aXZlUGF0aClcbiAgICAgICAgICB0ZXh0KFwiXCIgKyAoZmlsZS5uYW1lKSArIFwiXCIpXG4gICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgaWYgKGZhbHNlKSB7XG4gICAgICAgICAgZWxlbWVudE9wZW4oXCJwXCIsIG51bGwsIGhvaXN0ZWQ0KVxuICAgICAgICAgICAgdGV4dChcIlwiICsgKCcuLycgKyAoZmlsZS5yZWxhdGl2ZVBhdGggIT09IGZpbGUubmFtZSA/IGZpbGUucmVsYXRpdmVEaXIgOiAnJykpICsgXCJcIilcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJwXCIpXG4gICAgICAgIH1cbiAgICAgIGVsZW1lbnRDbG9zZShcImFcIilcbiAgICB9LCBmaWxlcylcbiAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG59XG59KSgpO1xuIiwidmFyIHBhZ2UgPSByZXF1aXJlKCdwYWdlJylcbnZhciBwYXRjaCA9IHJlcXVpcmUoJy4uL3BhdGNoJylcbnZhciBzdGF0ZSA9IHJlcXVpcmUoJy4uL3N0YXRlJylcbnZhciB2aWV3ID0gcmVxdWlyZSgnLi9pbmRleC5odG1sJylcbnZhciBzZXNzaW9ucyA9IHJlcXVpcmUoJy4uL3Nlc3Npb25zJylcblxuZnVuY3Rpb24gY2xvc2VGaWxlIChmaWxlKSB7XG4gIHZhciBzZXNzaW9uID0gc2Vzc2lvbnMuZmluZChmaWxlKVxuXG4gIHZhciBjbG9zZSA9IHNlc3Npb24gJiYgc2Vzc2lvbi5pc0RpcnR5XG4gICAgPyB3aW5kb3cuY29uZmlybSgnVGhlcmUgYXJlIHVuc2F2ZWQgY2hhbmdlcyB0byB0aGlzIGZpbGUuIEFyZSB5b3Ugc3VyZT8nKVxuICAgIDogdHJ1ZVxuXG4gIGlmIChjbG9zZSkge1xuICAgIC8vIFJlbW92ZSBmcm9tIHJlY2VudCBmaWxlc1xuICAgIHN0YXRlLnJlY2VudC5yZW1vdmUoZmlsZSlcblxuICAgIGlmIChzZXNzaW9uKSB7XG4gICAgICAvLyBSZW1vdmUgc2Vzc2lvblxuICAgICAgc2Vzc2lvbnMuaXRlbXMuc3BsaWNlKHNlc3Npb25zLml0ZW1zLmluZGV4T2Yoc2Vzc2lvbiksIDEpXG5cbiAgICAgIGlmIChzdGF0ZS5jdXJyZW50ID09PSBmaWxlKSB7XG4gICAgICAgIGlmIChzZXNzaW9ucy5pdGVtcy5sZW5ndGgpIHtcbiAgICAgICAgICAvLyBPcGVuIHRoZSBmaXJzdCBzZXNzaW9uXG4gICAgICAgICAgcGFnZSgnL2ZpbGU/cGF0aD0nICsgc2Vzc2lvbnMuaXRlbXNbMF0uZmlsZS5yZWxhdGl2ZVBhdGgpXG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUucmVjZW50Lml0ZW1zLmxlbmd0aCkge1xuICAgICAgICAgIHBhZ2UoJy9maWxlP3BhdGg9JyArIHN0YXRlLnJlY2VudC5pdGVtc1swXS5yZWxhdGl2ZVBhdGgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGFnZSgnLycpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gUmVjZW50IChlbCkge1xuICBmdW5jdGlvbiBvbkNsaWNrQ2xvc2UgKGZpbGUpIHtcbiAgICBjbG9zZUZpbGUoZmlsZSlcbiAgICByZW5kZXIoKVxuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyICgpIHtcbiAgICBwYXRjaChlbCwgdmlldywgc3RhdGUucmVjZW50Lml0ZW1zLCBzdGF0ZS5jdXJyZW50LCBvbkNsaWNrQ2xvc2UpXG4gIH1cblxuICB0aGlzLnJlbmRlciA9IHJlbmRlclxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlY2VudFxuIiwidmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZy9jbGllbnQnKVxudmFyIG1vZGVzID0gcmVxdWlyZSgnLi9tb2RlcycpXG52YXIgRWRpdFNlc3Npb24gPSB3aW5kb3cuYWNlLnJlcXVpcmUoJ2FjZS9lZGl0X3Nlc3Npb24nKS5FZGl0U2Vzc2lvblxudmFyIFVuZG9NYW5hZ2VyID0gd2luZG93LmFjZS5yZXF1aXJlKCdhY2UvdW5kb21hbmFnZXInKS5VbmRvTWFuYWdlclxuXG52YXIgc2Vzc2lvbnMgPSB7XG4gIGl0ZW1zOiBbXSxcbiAgZ2V0IGRpcnR5ICgpIHtcbiAgICByZXR1cm4gdGhpcy5pdGVtcy5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHJldHVybiAhaXRlbS5pc0NsZWFuXG4gICAgfSlcbiAgfSxcbiAgZmluZDogZnVuY3Rpb24gKGZpbGUpIHtcbiAgICByZXR1cm4gdGhpcy5pdGVtcy5maW5kKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5maWxlID09PSBmaWxlXG4gICAgfSlcbiAgfSxcbiAgYWRkOiBmdW5jdGlvbiAoZmlsZSwgY29udGVudHMpIHtcbiAgICB2YXIgZWRpdFNlc3Npb24gPSBuZXcgRWRpdFNlc3Npb24oY29udGVudHMsIG1vZGVzKGZpbGUpKVxuICAgIGVkaXRTZXNzaW9uLnNldE1vZGUobW9kZXMoZmlsZSkpXG4gICAgZWRpdFNlc3Npb24uc2V0VXNlV29ya2VyKGZhbHNlKVxuICAgIGVkaXRTZXNzaW9uLnNldFRhYlNpemUoY29uZmlnLmFjZS50YWJTaXplKVxuICAgIGVkaXRTZXNzaW9uLnNldFVzZVNvZnRUYWJzKGNvbmZpZy5hY2UudXNlU29mdFRhYnMpXG4gICAgZWRpdFNlc3Npb24uc2V0VW5kb01hbmFnZXIobmV3IFVuZG9NYW5hZ2VyKCkpXG5cbiAgICB2YXIgc2Vzc2lvbiA9IHtcbiAgICAgIGZpbGU6IGZpbGUsXG4gICAgICBlZGl0U2Vzc2lvbjogZWRpdFNlc3Npb24sXG4gICAgICBnZXQgaXNDbGVhbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVkaXRTZXNzaW9uLmdldFVuZG9NYW5hZ2VyKCkuaXNDbGVhbigpXG4gICAgICB9LFxuICAgICAgZ2V0IGlzRGlydHkgKCkge1xuICAgICAgICByZXR1cm4gIXRoaXMuaXNDbGVhblxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuaXRlbXMucHVzaChzZXNzaW9uKVxuXG4gICAgcmV0dXJuIHNlc3Npb25cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNlc3Npb25zXG4iLCJ2YXIgdyA9IHdpbmRvd1xudmFyIGQgPSBkb2N1bWVudFxuXG5mdW5jdGlvbiBzcGxpdHRlciAoaGFuZGxlLCBvbkVuZENhbGxiYWNrKSB7XG4gIHZhciBsYXN0XG4gIHZhciBob3Jpem9udGFsID0gaGFuZGxlLmNsYXNzTGlzdC5jb250YWlucygnaG9yaXpvbnRhbCcpXG4gIHZhciBlbDEgPSBoYW5kbGUucHJldmlvdXNFbGVtZW50U2libGluZ1xuICB2YXIgZWwyID0gaGFuZGxlLm5leHRFbGVtZW50U2libGluZ1xuXG4gIGZ1bmN0aW9uIG9uRHJhZyAoZSkge1xuICAgIGlmIChob3Jpem9udGFsKSB7XG4gICAgICB2YXIgaFQsIGhCXG4gICAgICB2YXIgaERpZmYgPSBlLmNsaWVudFkgLSBsYXN0XG5cbiAgICAgIGhUID0gZC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGVsMSwgJycpLmdldFByb3BlcnR5VmFsdWUoJ2hlaWdodCcpXG4gICAgICBoQiA9IGQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbDIsICcnKS5nZXRQcm9wZXJ0eVZhbHVlKCdoZWlnaHQnKVxuICAgICAgaFQgPSBwYXJzZUludChoVCwgMTApICsgaERpZmZcbiAgICAgIGhCID0gcGFyc2VJbnQoaEIsIDEwKSAtIGhEaWZmXG4gICAgICBlbDEuc3R5bGUuaGVpZ2h0ID0gaFQgKyAncHgnXG4gICAgICBlbDIuc3R5bGUuaGVpZ2h0ID0gaEIgKyAncHgnXG4gICAgICBsYXN0ID0gZS5jbGllbnRZXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB3TCwgd1JcbiAgICAgIHZhciB3RGlmZiA9IGUuY2xpZW50WCAtIGxhc3RcblxuICAgICAgd0wgPSBkLmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwxLCAnJykuZ2V0UHJvcGVydHlWYWx1ZSgnd2lkdGgnKVxuICAgICAgd1IgPSBkLmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwyLCAnJykuZ2V0UHJvcGVydHlWYWx1ZSgnd2lkdGgnKVxuICAgICAgd0wgPSBwYXJzZUludCh3TCwgMTApICsgd0RpZmZcbiAgICAgIHdSID0gcGFyc2VJbnQod1IsIDEwKSAtIHdEaWZmXG4gICAgICBlbDEuc3R5bGUud2lkdGggPSB3TCArICdweCdcbiAgICAgIGVsMi5zdHlsZS53aWR0aCA9IHdSICsgJ3B4J1xuICAgICAgbGFzdCA9IGUuY2xpZW50WFxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uRW5kRHJhZyAoZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHcucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgb25EcmFnKVxuICAgIHcucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIG9uRW5kRHJhZylcbiAgICBpZiAob25FbmRDYWxsYmFjaykge1xuICAgICAgb25FbmRDYWxsYmFjaygpXG4gICAgfVxuICAgIC8vIG5vaWRlLmVkaXRvci5yZXNpemUoKVxuICAgIC8vIHZhciBwcm9jZXNzZXMgPSByZXF1aXJlKCcuL3Byb2Nlc3NlcycpXG4gICAgLy8gcHJvY2Vzc2VzLmVkaXRvci5yZXNpemUoKVxuICB9XG5cbiAgaGFuZGxlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBsYXN0ID0gaG9yaXpvbnRhbCA/IGUuY2xpZW50WSA6IGUuY2xpZW50WFxuXG4gICAgdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBvbkRyYWcpXG4gICAgdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgb25FbmREcmFnKVxuICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNwbGl0dGVyXG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpXG52YXIgc3RhdGUgPSByZXF1aXJlKCcuL3N0YXRlJylcbnZhciBjbGllbnQgPSByZXF1aXJlKCcuL2NsaWVudCcpXG52YXIgc2Vzc2lvbnMgPSByZXF1aXJlKCcuL3Nlc3Npb25zJylcblxuZnVuY3Rpb24gbGludGVyICgpIHtcbiAgZnVuY3Rpb24gbGludCAoKSB7XG4gICAgdmFyIGZpbGUgPSBzdGF0ZS5jdXJyZW50XG4gICAgaWYgKGZpbGUgJiYgZmlsZS5leHQgPT09ICcuanMnKSB7XG4gICAgICB2YXIgZWRpdFNlc3Npb24gPSBzZXNzaW9ucy5maW5kKGZpbGUpLmVkaXRTZXNzaW9uXG4gICAgICBjbGllbnQucmVxdWVzdCh7XG4gICAgICAgIHBhdGg6ICcvc3RhbmRhcmQnLFxuICAgICAgICBwYXlsb2FkOiB7XG4gICAgICAgICAgdmFsdWU6IGVkaXRTZXNzaW9uLmdldFZhbHVlKClcbiAgICAgICAgfSxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCdcbiAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIHBheWxvYWQpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJldHVybiB1dGlsLmhhbmRsZUVycm9yKGVycilcbiAgICAgICAgfVxuICAgICAgICBlZGl0U2Vzc2lvbi5zZXRBbm5vdGF0aW9ucyhwYXlsb2FkKVxuICAgICAgICBzZXRUaW1lb3V0KGxpbnQsIDIwMDApXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICBzZXRUaW1lb3V0KGxpbnQsIDIwMDApXG4gICAgfVxuICB9XG4gIGxpbnQoKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxpbnRlclxuIiwidmFyIEZzb3MgPSByZXF1aXJlKCcuL2Zzb3MnKVxudmFyIHN0b3JhZ2VLZXkgPSAnbm9pZGUnXG5cbmZ1bmN0aW9uIHNhdmVTdGF0ZSAoZmlsZXMpIHtcbiAgdmFyIHN0b3JhZ2UgPSB7XG4gICAgcmVjZW50OiB0aGlzLnJlY2VudC5pdGVtcy5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHJldHVybiBpdGVtLnJlbGF0aXZlUGF0aFxuICAgIH0pLFxuICAgIGV4cGFuZGVkOiBmaWxlcy5pdGVtcy5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHJldHVybiBpdGVtLmV4cGFuZGVkXG4gICAgfSkubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5yZWxhdGl2ZVBhdGhcbiAgICB9KVxuICB9XG4gIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShzdG9yYWdlS2V5LCBKU09OLnN0cmluZ2lmeShzdG9yYWdlKSlcbn1cblxuZnVuY3Rpb24gbG9hZFN0YXRlIChmaWxlcykge1xuICB2YXIgc3RvcmFnZSA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShzdG9yYWdlS2V5KVxuICBzdG9yYWdlID0gc3RvcmFnZSA/IEpTT04ucGFyc2Uoc3RvcmFnZSkgOiB7fVxuXG4gIHZhciBkaXIsIGZpbGUsIGlcbiAgdGhpcy5yZWNlbnQgPSBuZXcgRnNvcygpXG5cbiAgaWYgKHN0b3JhZ2UucmVjZW50KSB7XG4gICAgZm9yIChpID0gMDsgaSA8IHN0b3JhZ2UucmVjZW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBmaWxlID0gZmlsZXMuZmluZEJ5UGF0aChzdG9yYWdlLnJlY2VudFtpXSlcbiAgICAgIGlmIChmaWxlKSB7XG4gICAgICAgIHRoaXMucmVjZW50Lml0ZW1zLnB1c2goZmlsZSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoc3RvcmFnZS5leHBhbmRlZCkge1xuICAgIGZvciAoaSA9IDA7IGkgPCBzdG9yYWdlLmV4cGFuZGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICBkaXIgPSBmaWxlcy5maW5kQnlQYXRoKHN0b3JhZ2UuZXhwYW5kZWRbaV0pXG4gICAgICBpZiAoZGlyKSB7XG4gICAgICAgIGRpci5leHBhbmRlZCA9IHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxudmFyIHN0YXRlID0ge1xuICByZWNlbnQ6IG51bGwsXG4gIGN1cnJlbnQ6IG51bGwsXG4gIHNhdmU6IHNhdmVTdGF0ZSxcbiAgbG9hZDogbG9hZFN0YXRlXG59XG5cbm1vZHVsZS5leHBvcnRzID0gc3RhdGVcbiIsInZhciBwYXRjaCA9IHJlcXVpcmUoJy4uL3BhdGNoJylcbnZhciB2aWV3ID0gcmVxdWlyZSgnLi92aWV3Lmh0bWwnKVxuXG5mdW5jdGlvbiBtYWtlVHJlZSAoZmlsZXMpIHtcbiAgZnVuY3Rpb24gdHJlZWlmeSAobGlzdCwgaWRBdHRyLCBwYXJlbnRBdHRyLCBjaGlsZHJlbkF0dHIpIHtcbiAgICB2YXIgdHJlZUxpc3QgPSBbXVxuICAgIHZhciBsb29rdXAgPSB7fVxuICAgIHZhciBpLCBvYmpcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmogPSBsaXN0W2ldXG4gICAgICBsb29rdXBbb2JqW2lkQXR0cl1dID0gb2JqXG4gICAgICBvYmpbY2hpbGRyZW5BdHRyXSA9IFtdXG4gICAgfVxuXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iaiA9IGxpc3RbaV1cbiAgICAgIHZhciBwYXJlbnQgPSBsb29rdXBbb2JqW3BhcmVudEF0dHJdXVxuICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICBvYmoucGFyZW50ID0gcGFyZW50XG4gICAgICAgIGxvb2t1cFtvYmpbcGFyZW50QXR0cl1dW2NoaWxkcmVuQXR0cl0ucHVzaChvYmopXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cmVlTGlzdC5wdXNoKG9iailcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJlZUxpc3RcbiAgfVxuICByZXR1cm4gdHJlZWlmeShmaWxlcy5pdGVtcywgJ3BhdGgnLCAnZGlyJywgJ2NoaWxkcmVuJylcbn1cblxuZnVuY3Rpb24gVHJlZSAoZWwsIGZpbGVzLCBzdGF0ZSkge1xuICBmdW5jdGlvbiBvbkNsaWNrIChmaWxlKSB7XG4gICAgaWYgKGZpbGUuaXNEaXJlY3RvcnkpIHtcbiAgICAgIGZpbGUuZXhwYW5kZWQgPSAhZmlsZS5leHBhbmRlZFxuICAgICAgcmVuZGVyKClcbiAgICB9XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlciAoKSB7XG4gICAgcGF0Y2goZWwsIHZpZXcsIG1ha2VUcmVlKGZpbGVzKSwgdHJ1ZSwgc3RhdGUuY3VycmVudCwgb25DbGljaylcbiAgfVxuXG4gIC8vIGZpbGVzLm9uKCdjaGFuZ2UnLCByZW5kZXIpXG4gIC8vIHN0YXRlLm9uKCdjaGFuZ2U6Y3VycmVudCcsIHJlbmRlcilcblxuICB0aGlzLnJlbmRlciA9IHJlbmRlclxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRyZWVcbiIsInZhciBJbmNyZW1lbnRhbERPTSA9IHJlcXVpcmUoJ2luY3JlbWVudGFsLWRvbScpXG52YXIgcGF0Y2ggPSBJbmNyZW1lbnRhbERPTS5wYXRjaFxudmFyIGVsZW1lbnRPcGVuID0gSW5jcmVtZW50YWxET00uZWxlbWVudE9wZW5cbnZhciBlbGVtZW50Vm9pZCA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRWb2lkXG52YXIgZWxlbWVudENsb3NlID0gSW5jcmVtZW50YWxET00uZWxlbWVudENsb3NlXG52YXIgZWxlbWVudFBsYWNlaG9sZGVyID0gSW5jcmVtZW50YWxET00uZWxlbWVudFBsYWNlaG9sZGVyXG52YXIgdGV4dCA9IEluY3JlbWVudGFsRE9NLnRleHRcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xudmFyIGhvaXN0ZWQxID0gW1wiY2xhc3NcIiwgXCJuYW1lIGljb24gaWNvbi1maWxlLXRleHRcIl1cbnZhciBob2lzdGVkMiA9IFtcImNsYXNzXCIsIFwiZmlsZS1uYW1lXCJdXG52YXIgaG9pc3RlZDMgPSBbXCJjbGFzc1wiLCBcImV4cGFuZGVkXCJdXG52YXIgaG9pc3RlZDQgPSBbXCJjbGFzc1wiLCBcImNvbGxhcHNlZFwiXVxudmFyIGhvaXN0ZWQ1ID0gW1wiY2xhc3NcIiwgXCJuYW1lIGljb24gaWNvbi1maWxlLWRpcmVjdG9yeVwiXVxudmFyIGhvaXN0ZWQ2ID0gW1wiY2xhc3NcIiwgXCJkaXItbmFtZVwiXVxudmFyIGhvaXN0ZWQ3ID0gW1wiY2xhc3NcIiwgXCJ0cmlhbmdsZS1sZWZ0XCJdXG5cbnJldHVybiBmdW5jdGlvbiB0cmVlIChkYXRhLCBpc1Jvb3QsIGN1cnJlbnQsIG9uQ2xpY2spIHtcbiAgZWxlbWVudE9wZW4oXCJ1bFwiLCBudWxsLCBudWxsLCBcImNsYXNzXCIsIGlzUm9vdCA/ICd0cmVlJyA6ICcnKVxuICAgIDsoQXJyYXkuaXNBcnJheShkYXRhKSA/IGRhdGEgOiBPYmplY3Qua2V5cyhkYXRhKSkuZm9yRWFjaChmdW5jdGlvbihmc28sICRpbmRleCkge1xuICAgICAgZWxlbWVudE9wZW4oXCJsaVwiLCBmc28ucGF0aCwgbnVsbCwgXCJjbGFzc1wiLCBmc28uaXNEaXJlY3RvcnkgPyAnZGlyJyA6ICdmaWxlJyArIChmc28gPT09IGN1cnJlbnQgPyAnIHNlbGVjdGVkJyA6ICcnKSlcbiAgICAgICAgaWYgKGZzby5pc0ZpbGUpIHtcbiAgICAgICAgICBlbGVtZW50T3BlbihcImFcIiwgbnVsbCwgbnVsbCwgXCJocmVmXCIsIFwiL2ZpbGU/cGF0aD1cIiArIChmc28ucmVsYXRpdmVQYXRoKSArIFwiXCIpXG4gICAgICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgaG9pc3RlZDEsIFwiZGF0YS1uYW1lXCIsIGZzby5uYW1lLCBcImRhdGEtcGF0aFwiLCBmc28ucmVsYXRpdmVQYXRoKVxuICAgICAgICAgICAgZWxlbWVudENsb3NlKFwic3BhblwiKVxuICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJzcGFuXCIsIG51bGwsIGhvaXN0ZWQyKVxuICAgICAgICAgICAgICB0ZXh0KFwiXCIgKyAoZnNvLm5hbWUpICsgXCJcIilcbiAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJhXCIpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZzby5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYVwiLCBudWxsLCBudWxsLCBcIm9uY2xpY2tcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICAgIG9uQ2xpY2soZnNvKX0pXG4gICAgICAgICAgICBpZiAoZnNvLmV4cGFuZGVkKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwic21hbGxcIiwgbnVsbCwgaG9pc3RlZDMpXG4gICAgICAgICAgICAgICAgdGV4dChcIuKWvFwiKVxuICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJzbWFsbFwiKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFmc28uZXhwYW5kZWQpIHtcbiAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJzbWFsbFwiLCBudWxsLCBob2lzdGVkNClcbiAgICAgICAgICAgICAgICB0ZXh0KFwi4pa2XCIpXG4gICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNtYWxsXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgaG9pc3RlZDUsIFwiZGF0YS1uYW1lXCIsIGZzby5uYW1lLCBcImRhdGEtcGF0aFwiLCBmc28ucmVsYXRpdmVQYXRoKVxuICAgICAgICAgICAgZWxlbWVudENsb3NlKFwic3BhblwiKVxuICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJzcGFuXCIsIG51bGwsIGhvaXN0ZWQ2KVxuICAgICAgICAgICAgICB0ZXh0KFwiXCIgKyAoZnNvLm5hbWUpICsgXCJcIilcbiAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJhXCIpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZzby5pc0ZpbGUgJiYgZnNvID09PSBjdXJyZW50KSB7XG4gICAgICAgICAgZWxlbWVudE9wZW4oXCJzcGFuXCIsIG51bGwsIGhvaXN0ZWQ3KVxuICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgfVxuICAgICAgICBpZiAoZnNvLmlzRGlyZWN0b3J5ICYmIGZzby5leHBhbmRlZCkge1xuICAgICAgICAgIGZzby5jaGlsZHJlbi5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoYS5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGIuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEubmFtZS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgPCBiLm5hbWUudG9Mb3dlckNhc2UoKSA/IC0xIDogMVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChiLmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAxXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS5uYW1lLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICA8IGIubmFtZS50b0xvd2VyQ2FzZSgpID8gLTEgOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIHZhciB2aWV3TW9kZWwgPSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgaXNSb290OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgLy8gICB0cmVlOiBmc28uY2hpbGRyZW4sXG4gICAgICAgICAgICAgICAgICAgIC8vICAgY3VycmVudDogZGF0YS5jdXJyZW50LFxuICAgICAgICAgICAgICAgICAgICAvLyAgIHZpZXc6IGRhdGEudmlldyxcbiAgICAgICAgICAgICAgICAgICAgLy8gICBvbkNsaWNrOiBkYXRhLm9uQ2xpY2tcbiAgICAgICAgICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAgICAgICAgIHRyZWUoZnNvLmNoaWxkcmVuLCBmYWxzZSwgY3VycmVudCwgb25DbGljaylcbiAgICAgICAgfVxuICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICB9LCBkYXRhKVxuICBlbGVtZW50Q2xvc2UoXCJ1bFwiKVxufVxufSkoKTtcbiIsImZ1bmN0aW9uIGhhbmRsZUVycm9yIChlcnIpIHtcbiAgY29uc29sZS5lcnJvcihlcnIpXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBoYW5kbGVFcnJvcjogaGFuZGxlRXJyb3Jcbn1cbiIsInZhciBmcyA9IHJlcXVpcmUoJy4vZnMnKVxudmFyIGNsaWVudCA9IHJlcXVpcmUoJy4vY2xpZW50JylcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJylcbnZhciBzZXNzaW9ucyA9IHJlcXVpcmUoJy4vc2Vzc2lvbnMnKVxuXG5mdW5jdGlvbiB3YXRjaCAoZmlsZXMpIHtcbiAgLy8gU3Vic2NyaWJlIHRvIHdhdGNoZWQgZmlsZSBjaGFuZ2VzXG4gIC8vIHRoYXQgaGFwcGVuIG9uIHRoZSBmaWxlIHN5c3RlbVxuICAvLyBSZWxvYWQgdGhlIHNlc3Npb24gaWYgdGhlIGNoYW5nZXNcbiAgLy8gZG8gbm90IG1hdGNoIHRoZSBzdGF0ZSBvZiB0aGUgZmlsZVxuICBjbGllbnQuc3Vic2NyaWJlKCcvZnMvY2hhbmdlJywgZnVuY3Rpb24gKHBheWxvYWQpIHtcbiAgICBzZXNzaW9ucy5pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChzZXNzaW9uKSB7XG4gICAgICB2YXIgZmlsZSA9IHNlc3Npb24uZmlsZVxuICAgICAgaWYgKHBheWxvYWQucGF0aCA9PT0gZmlsZS5wYXRoKSB7XG4gICAgICAgIGlmIChwYXlsb2FkLnN0YXQubXRpbWUgIT09IGZpbGUuc3RhdC5tdGltZSkge1xuICAgICAgICAgIGZzLnJlYWRGaWxlKGZpbGUucGF0aCwgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICByZXR1cm4gdXRpbC5oYW5kbGVFcnJvcihlcnIpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaWxlLnN0YXQgPSBwYXlsb2FkLnN0YXRcbiAgICAgICAgICAgIHNlc3Npb24uZWRpdFNlc3Npb24uc2V0VmFsdWUocGF5bG9hZC5jb250ZW50cylcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiB1dGlsLmhhbmRsZUVycm9yKGVycilcbiAgICB9XG4gIH0pXG5cbiAgLy8gU3Vic2NyaWJlIHRvIHdhdGNoZWQgZmlsZSBjaGFuZ2VzXG4gIC8vIHRoYXQgaGFwcGVuIG9uIHRoZSBmaWxlIHN5c3RlbVxuICAvLyBSZWxvYWQgdGhlIHNlc3Npb24gaWYgdGhlIGNoYW5nZXNcbiAgLy8gZG8gbm90IG1hdGNoIHRoZSBzdGF0ZSBvZiB0aGUgZmlsZVxuICAvLyBjbGllbnQuc3Vic2NyaWJlKCcvZnMvdW5saW5rJywgZnVuY3Rpb24gKHBheWxvYWQpIHtcbiAgLy8gICBzZXNzaW9ucy5pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChzZXNzaW9uKSB7XG4gIC8vICAgICB2YXIgZmlsZSA9IHNlc3Npb24uZmlsZVxuICAvLyAgICAgaWYgKHBheWxvYWQucGF0aCA9PT0gZmlsZS5wYXRoKSB7XG4gIC8vICAgICAgIGlmIChwYXlsb2FkLnN0YXQubXRpbWUgIT09IGZpbGUuc3RhdC5tdGltZSkge1xuICAvLyAgICAgICAgIGZzLnJlYWRGaWxlKGZpbGUucGF0aCwgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAvLyAgICAgICAgICAgaWYgKGVycikge1xuICAvLyAgICAgICAgICAgICByZXR1cm4gdXRpbC5oYW5kbGVFcnJvcihlcnIpXG4gIC8vICAgICAgICAgICB9XG4gIC8vICAgICAgICAgICBmaWxlLnN0YXQgPSBwYXlsb2FkLnN0YXRcbiAgLy8gICAgICAgICAgIHNlc3Npb24uZWRpdFNlc3Npb24uc2V0VmFsdWUocGF5bG9hZC5jb250ZW50cylcbiAgLy8gICAgICAgICB9KVxuICAvLyAgICAgICB9XG4gIC8vICAgICB9XG4gIC8vICAgfSlcbiAgLy8gfSwgZnVuY3Rpb24gKGVycikge1xuICAvLyAgIGlmIChlcnIpIHtcbiAgLy8gICAgIHJldHVybiB1dGlsLmhhbmRsZUVycm9yKGVycilcbiAgLy8gICB9XG4gIC8vIH0pXG59XG5cbm1vZHVsZS5leHBvcnRzID0gd2F0Y2hcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBhY2U6IHtcbiAgICB0YWJTaXplOiAyLFxuICAgIGZvbnRTaXplOiAxMixcbiAgICB0aGVtZTogJ21vbm9rYWknLFxuICAgIHVzZVNvZnRUYWJzOiB0cnVlXG4gIH1cbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gSWYgb2JqLmhhc093blByb3BlcnR5IGhhcyBiZWVuIG92ZXJyaWRkZW4sIHRoZW4gY2FsbGluZ1xuLy8gb2JqLmhhc093blByb3BlcnR5KHByb3ApIHdpbGwgYnJlYWsuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9qb3llbnQvbm9kZS9pc3N1ZXMvMTcwN1xuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihxcywgc2VwLCBlcSwgb3B0aW9ucykge1xuICBzZXAgPSBzZXAgfHwgJyYnO1xuICBlcSA9IGVxIHx8ICc9JztcbiAgdmFyIG9iaiA9IHt9O1xuXG4gIGlmICh0eXBlb2YgcXMgIT09ICdzdHJpbmcnIHx8IHFzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBvYmo7XG4gIH1cblxuICB2YXIgcmVnZXhwID0gL1xcKy9nO1xuICBxcyA9IHFzLnNwbGl0KHNlcCk7XG5cbiAgdmFyIG1heEtleXMgPSAxMDAwO1xuICBpZiAob3B0aW9ucyAmJiB0eXBlb2Ygb3B0aW9ucy5tYXhLZXlzID09PSAnbnVtYmVyJykge1xuICAgIG1heEtleXMgPSBvcHRpb25zLm1heEtleXM7XG4gIH1cblxuICB2YXIgbGVuID0gcXMubGVuZ3RoO1xuICAvLyBtYXhLZXlzIDw9IDAgbWVhbnMgdGhhdCB3ZSBzaG91bGQgbm90IGxpbWl0IGtleXMgY291bnRcbiAgaWYgKG1heEtleXMgPiAwICYmIGxlbiA+IG1heEtleXMpIHtcbiAgICBsZW4gPSBtYXhLZXlzO1xuICB9XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgIHZhciB4ID0gcXNbaV0ucmVwbGFjZShyZWdleHAsICclMjAnKSxcbiAgICAgICAgaWR4ID0geC5pbmRleE9mKGVxKSxcbiAgICAgICAga3N0ciwgdnN0ciwgaywgdjtcblxuICAgIGlmIChpZHggPj0gMCkge1xuICAgICAga3N0ciA9IHguc3Vic3RyKDAsIGlkeCk7XG4gICAgICB2c3RyID0geC5zdWJzdHIoaWR4ICsgMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtzdHIgPSB4O1xuICAgICAgdnN0ciA9ICcnO1xuICAgIH1cblxuICAgIGsgPSBkZWNvZGVVUklDb21wb25lbnQoa3N0cik7XG4gICAgdiA9IGRlY29kZVVSSUNvbXBvbmVudCh2c3RyKTtcblxuICAgIGlmICghaGFzT3duUHJvcGVydHkob2JqLCBrKSkge1xuICAgICAgb2JqW2tdID0gdjtcbiAgICB9IGVsc2UgaWYgKGlzQXJyYXkob2JqW2tdKSkge1xuICAgICAgb2JqW2tdLnB1c2godik7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9ialtrXSA9IFtvYmpba10sIHZdO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvYmo7XG59O1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHhzKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeHMpID09PSAnW29iamVjdCBBcnJheV0nO1xufTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBzdHJpbmdpZnlQcmltaXRpdmUgPSBmdW5jdGlvbih2KSB7XG4gIHN3aXRjaCAodHlwZW9mIHYpIHtcbiAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgcmV0dXJuIHY7XG5cbiAgICBjYXNlICdib29sZWFuJzpcbiAgICAgIHJldHVybiB2ID8gJ3RydWUnIDogJ2ZhbHNlJztcblxuICAgIGNhc2UgJ251bWJlcic6XG4gICAgICByZXR1cm4gaXNGaW5pdGUodikgPyB2IDogJyc7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuICcnO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaiwgc2VwLCBlcSwgbmFtZSkge1xuICBzZXAgPSBzZXAgfHwgJyYnO1xuICBlcSA9IGVxIHx8ICc9JztcbiAgaWYgKG9iaiA9PT0gbnVsbCkge1xuICAgIG9iaiA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBtYXAob2JqZWN0S2V5cyhvYmopLCBmdW5jdGlvbihrKSB7XG4gICAgICB2YXIga3MgPSBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKGspKSArIGVxO1xuICAgICAgaWYgKGlzQXJyYXkob2JqW2tdKSkge1xuICAgICAgICByZXR1cm4gbWFwKG9ialtrXSwgZnVuY3Rpb24odikge1xuICAgICAgICAgIHJldHVybiBrcyArIGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUodikpO1xuICAgICAgICB9KS5qb2luKHNlcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ga3MgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKG9ialtrXSkpO1xuICAgICAgfVxuICAgIH0pLmpvaW4oc2VwKTtcblxuICB9XG5cbiAgaWYgKCFuYW1lKSByZXR1cm4gJyc7XG4gIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKG5hbWUpKSArIGVxICtcbiAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUob2JqKSk7XG59O1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHhzKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeHMpID09PSAnW29iamVjdCBBcnJheV0nO1xufTtcblxuZnVuY3Rpb24gbWFwICh4cywgZikge1xuICBpZiAoeHMubWFwKSByZXR1cm4geHMubWFwKGYpO1xuICB2YXIgcmVzID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICByZXMucHVzaChmKHhzW2ldLCBpKSk7XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciByZXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSByZXMucHVzaChrZXkpO1xuICB9XG4gIHJldHVybiByZXM7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLmRlY29kZSA9IGV4cG9ydHMucGFyc2UgPSByZXF1aXJlKCcuL2RlY29kZScpO1xuZXhwb3J0cy5lbmNvZGUgPSBleHBvcnRzLnN0cmluZ2lmeSA9IHJlcXVpcmUoJy4vZW5jb2RlJyk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHRvU3RyID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxudmFyIGlzQXJyYXkgPSBmdW5jdGlvbiBpc0FycmF5KGFycikge1xuXHRpZiAodHlwZW9mIEFycmF5LmlzQXJyYXkgPT09ICdmdW5jdGlvbicpIHtcblx0XHRyZXR1cm4gQXJyYXkuaXNBcnJheShhcnIpO1xuXHR9XG5cblx0cmV0dXJuIHRvU3RyLmNhbGwoYXJyKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG5cbnZhciBpc1BsYWluT2JqZWN0ID0gZnVuY3Rpb24gaXNQbGFpbk9iamVjdChvYmopIHtcblx0aWYgKCFvYmogfHwgdG9TdHIuY2FsbChvYmopICE9PSAnW29iamVjdCBPYmplY3RdJykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdHZhciBoYXNPd25Db25zdHJ1Y3RvciA9IGhhc093bi5jYWxsKG9iaiwgJ2NvbnN0cnVjdG9yJyk7XG5cdHZhciBoYXNJc1Byb3RvdHlwZU9mID0gb2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgJiYgaGFzT3duLmNhbGwob2JqLmNvbnN0cnVjdG9yLnByb3RvdHlwZSwgJ2lzUHJvdG90eXBlT2YnKTtcblx0Ly8gTm90IG93biBjb25zdHJ1Y3RvciBwcm9wZXJ0eSBtdXN0IGJlIE9iamVjdFxuXHRpZiAob2JqLmNvbnN0cnVjdG9yICYmICFoYXNPd25Db25zdHJ1Y3RvciAmJiAhaGFzSXNQcm90b3R5cGVPZikge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIE93biBwcm9wZXJ0aWVzIGFyZSBlbnVtZXJhdGVkIGZpcnN0bHksIHNvIHRvIHNwZWVkIHVwLFxuXHQvLyBpZiBsYXN0IG9uZSBpcyBvd24sIHRoZW4gYWxsIHByb3BlcnRpZXMgYXJlIG93bi5cblx0dmFyIGtleTtcblx0Zm9yIChrZXkgaW4gb2JqKSB7LyoqL31cblxuXHRyZXR1cm4gdHlwZW9mIGtleSA9PT0gJ3VuZGVmaW5lZCcgfHwgaGFzT3duLmNhbGwob2JqLCBrZXkpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBleHRlbmQoKSB7XG5cdHZhciBvcHRpb25zLCBuYW1lLCBzcmMsIGNvcHksIGNvcHlJc0FycmF5LCBjbG9uZSxcblx0XHR0YXJnZXQgPSBhcmd1bWVudHNbMF0sXG5cdFx0aSA9IDEsXG5cdFx0bGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aCxcblx0XHRkZWVwID0gZmFsc2U7XG5cblx0Ly8gSGFuZGxlIGEgZGVlcCBjb3B5IHNpdHVhdGlvblxuXHRpZiAodHlwZW9mIHRhcmdldCA9PT0gJ2Jvb2xlYW4nKSB7XG5cdFx0ZGVlcCA9IHRhcmdldDtcblx0XHR0YXJnZXQgPSBhcmd1bWVudHNbMV0gfHwge307XG5cdFx0Ly8gc2tpcCB0aGUgYm9vbGVhbiBhbmQgdGhlIHRhcmdldFxuXHRcdGkgPSAyO1xuXHR9IGVsc2UgaWYgKCh0eXBlb2YgdGFyZ2V0ICE9PSAnb2JqZWN0JyAmJiB0eXBlb2YgdGFyZ2V0ICE9PSAnZnVuY3Rpb24nKSB8fCB0YXJnZXQgPT0gbnVsbCkge1xuXHRcdHRhcmdldCA9IHt9O1xuXHR9XG5cblx0Zm9yICg7IGkgPCBsZW5ndGg7ICsraSkge1xuXHRcdG9wdGlvbnMgPSBhcmd1bWVudHNbaV07XG5cdFx0Ly8gT25seSBkZWFsIHdpdGggbm9uLW51bGwvdW5kZWZpbmVkIHZhbHVlc1xuXHRcdGlmIChvcHRpb25zICE9IG51bGwpIHtcblx0XHRcdC8vIEV4dGVuZCB0aGUgYmFzZSBvYmplY3Rcblx0XHRcdGZvciAobmFtZSBpbiBvcHRpb25zKSB7XG5cdFx0XHRcdHNyYyA9IHRhcmdldFtuYW1lXTtcblx0XHRcdFx0Y29weSA9IG9wdGlvbnNbbmFtZV07XG5cblx0XHRcdFx0Ly8gUHJldmVudCBuZXZlci1lbmRpbmcgbG9vcFxuXHRcdFx0XHRpZiAodGFyZ2V0ICE9PSBjb3B5KSB7XG5cdFx0XHRcdFx0Ly8gUmVjdXJzZSBpZiB3ZSdyZSBtZXJnaW5nIHBsYWluIG9iamVjdHMgb3IgYXJyYXlzXG5cdFx0XHRcdFx0aWYgKGRlZXAgJiYgY29weSAmJiAoaXNQbGFpbk9iamVjdChjb3B5KSB8fCAoY29weUlzQXJyYXkgPSBpc0FycmF5KGNvcHkpKSkpIHtcblx0XHRcdFx0XHRcdGlmIChjb3B5SXNBcnJheSkge1xuXHRcdFx0XHRcdFx0XHRjb3B5SXNBcnJheSA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRjbG9uZSA9IHNyYyAmJiBpc0FycmF5KHNyYykgPyBzcmMgOiBbXTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGNsb25lID0gc3JjICYmIGlzUGxhaW5PYmplY3Qoc3JjKSA/IHNyYyA6IHt9O1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvLyBOZXZlciBtb3ZlIG9yaWdpbmFsIG9iamVjdHMsIGNsb25lIHRoZW1cblx0XHRcdFx0XHRcdHRhcmdldFtuYW1lXSA9IGV4dGVuZChkZWVwLCBjbG9uZSwgY29weSk7XG5cblx0XHRcdFx0XHQvLyBEb24ndCBicmluZyBpbiB1bmRlZmluZWQgdmFsdWVzXG5cdFx0XHRcdFx0fSBlbHNlIGlmICh0eXBlb2YgY29weSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0XHRcdHRhcmdldFtuYW1lXSA9IGNvcHk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Ly8gUmV0dXJuIHRoZSBtb2RpZmllZCBvYmplY3Rcblx0cmV0dXJuIHRhcmdldDtcbn07XG5cbiIsIlxuLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuICAqIEtlZXBzIHRyYWNrIHdoZXRoZXIgb3Igbm90IHdlIGFyZSBpbiBhbiBhdHRyaWJ1dGVzIGRlY2xhcmF0aW9uIChhZnRlclxuICAqIGVsZW1lbnRPcGVuU3RhcnQsIGJ1dCBiZWZvcmUgZWxlbWVudE9wZW5FbmQpLlxuICAqIEB0eXBlIHtib29sZWFufVxuICAqL1xudmFyIGluQXR0cmlidXRlcyA9IGZhbHNlO1xuXG4vKipcbiAgKiBLZWVwcyB0cmFjayB3aGV0aGVyIG9yIG5vdCB3ZSBhcmUgaW4gYW4gZWxlbWVudCB0aGF0IHNob3VsZCBub3QgaGF2ZSBpdHNcbiAgKiBjaGlsZHJlbiBjbGVhcmVkLlxuICAqIEB0eXBlIHtib29sZWFufVxuICAqL1xudmFyIGluU2tpcCA9IGZhbHNlO1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCB0aGVyZSBpcyBhIGN1cnJlbnQgcGF0Y2ggY29udGV4dC5cbiAqIEBwYXJhbSB7Kn0gY29udGV4dFxuICovXG52YXIgYXNzZXJ0SW5QYXRjaCA9IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gIGlmICghY29udGV4dCkge1xuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNhbGwgY3VycmVudEVsZW1lbnQoKSB1bmxlc3MgaW4gcGF0Y2gnKTtcbiAgfVxufTtcblxuLyoqXG4qIE1ha2VzIHN1cmUgdGhhdCBrZXllZCBFbGVtZW50IG1hdGNoZXMgdGhlIHRhZyBuYW1lIHByb3ZpZGVkLlxuKiBAcGFyYW0geyFzdHJpbmd9IG5vZGVOYW1lIFRoZSBub2RlTmFtZSBvZiB0aGUgbm9kZSB0aGF0IGlzIGJlaW5nIG1hdGNoZWQuXG4qIEBwYXJhbSB7c3RyaW5nPX0gdGFnIFRoZSB0YWcgbmFtZSBvZiB0aGUgRWxlbWVudC5cbiogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgb2YgdGhlIEVsZW1lbnQuXG4qL1xudmFyIGFzc2VydEtleWVkVGFnTWF0Y2hlcyA9IGZ1bmN0aW9uIChub2RlTmFtZSwgdGFnLCBrZXkpIHtcbiAgaWYgKG5vZGVOYW1lICE9PSB0YWcpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1dhcyBleHBlY3Rpbmcgbm9kZSB3aXRoIGtleSBcIicgKyBrZXkgKyAnXCIgdG8gYmUgYSAnICsgdGFnICsgJywgbm90IGEgJyArIG5vZGVOYW1lICsgJy4nKTtcbiAgfVxufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoYXQgYSBwYXRjaCBjbG9zZXMgZXZlcnkgbm9kZSB0aGF0IGl0IG9wZW5lZC5cbiAqIEBwYXJhbSB7P05vZGV9IG9wZW5FbGVtZW50XG4gKiBAcGFyYW0geyFOb2RlfCFEb2N1bWVudEZyYWdtZW50fSByb290XG4gKi9cbnZhciBhc3NlcnROb1VuY2xvc2VkVGFncyA9IGZ1bmN0aW9uIChvcGVuRWxlbWVudCwgcm9vdCkge1xuICBpZiAob3BlbkVsZW1lbnQgPT09IHJvb3QpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgY3VycmVudEVsZW1lbnQgPSBvcGVuRWxlbWVudDtcbiAgdmFyIG9wZW5UYWdzID0gW107XG4gIHdoaWxlIChjdXJyZW50RWxlbWVudCAmJiBjdXJyZW50RWxlbWVudCAhPT0gcm9vdCkge1xuICAgIG9wZW5UYWdzLnB1c2goY3VycmVudEVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSk7XG4gICAgY3VycmVudEVsZW1lbnQgPSBjdXJyZW50RWxlbWVudC5wYXJlbnROb2RlO1xuICB9XG5cbiAgdGhyb3cgbmV3IEVycm9yKCdPbmUgb3IgbW9yZSB0YWdzIHdlcmUgbm90IGNsb3NlZDpcXG4nICsgb3BlblRhZ3Muam9pbignXFxuJykpO1xufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoYXQgdGhlIGNhbGxlciBpcyBub3Qgd2hlcmUgYXR0cmlidXRlcyBhcmUgZXhwZWN0ZWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gZnVuY3Rpb25OYW1lXG4gKi9cbnZhciBhc3NlcnROb3RJbkF0dHJpYnV0ZXMgPSBmdW5jdGlvbiAoZnVuY3Rpb25OYW1lKSB7XG4gIGlmIChpbkF0dHJpYnV0ZXMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZnVuY3Rpb25OYW1lICsgJygpIG1heSBub3QgYmUgY2FsbGVkIGJldHdlZW4gJyArICdlbGVtZW50T3BlblN0YXJ0KCkgYW5kIGVsZW1lbnRPcGVuRW5kKCkuJyk7XG4gIH1cbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGF0IHRoZSBjYWxsZXIgaXMgbm90IGluc2lkZSBhbiBlbGVtZW50IHRoYXQgaGFzIGRlY2xhcmVkIHNraXAuXG4gKiBAcGFyYW0ge3N0cmluZ30gZnVuY3Rpb25OYW1lXG4gKi9cbnZhciBhc3NlcnROb3RJblNraXAgPSBmdW5jdGlvbiAoZnVuY3Rpb25OYW1lKSB7XG4gIGlmIChpblNraXApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZnVuY3Rpb25OYW1lICsgJygpIG1heSBub3QgYmUgY2FsbGVkIGluc2lkZSBhbiBlbGVtZW50ICcgKyAndGhhdCBoYXMgY2FsbGVkIHNraXAoKS4nKTtcbiAgfVxufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoYXQgdGhlIGNhbGxlciBpcyB3aGVyZSBhdHRyaWJ1dGVzIGFyZSBleHBlY3RlZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmdW5jdGlvbk5hbWVcbiAqL1xudmFyIGFzc2VydEluQXR0cmlidXRlcyA9IGZ1bmN0aW9uIChmdW5jdGlvbk5hbWUpIHtcbiAgaWYgKCFpbkF0dHJpYnV0ZXMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZnVuY3Rpb25OYW1lICsgJygpIG11c3QgYmUgY2FsbGVkIGFmdGVyICcgKyAnZWxlbWVudE9wZW5TdGFydCgpLicpO1xuICB9XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhlIHBhdGNoIGNsb3NlcyB2aXJ0dWFsIGF0dHJpYnV0ZXMgY2FsbFxuICovXG52YXIgYXNzZXJ0VmlydHVhbEF0dHJpYnV0ZXNDbG9zZWQgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChpbkF0dHJpYnV0ZXMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2VsZW1lbnRPcGVuRW5kKCkgbXVzdCBiZSBjYWxsZWQgYWZ0ZXIgY2FsbGluZyAnICsgJ2VsZW1lbnRPcGVuU3RhcnQoKS4nKTtcbiAgfVxufTtcblxuLyoqXG4gICogTWFrZXMgc3VyZSB0aGF0IHBsYWNlaG9sZGVycyBoYXZlIGEga2V5IHNwZWNpZmllZC4gT3RoZXJ3aXNlLCBjb25kaXRpb25hbFxuICAqIHBsYWNlaG9sZGVycyBhbmQgY29uZGl0aW9uYWwgZWxlbWVudHMgbmV4dCB0byBwbGFjZWhvbGRlcnMgd2lsbCBjYXVzZVxuICAqIHBsYWNlaG9sZGVyIGVsZW1lbnRzIHRvIGJlIHJlLXVzZWQgYXMgbm9uLXBsYWNlaG9sZGVycyBhbmQgdmljZSB2ZXJzYS5cbiAgKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gICovXG52YXIgYXNzZXJ0UGxhY2Vob2xkZXJLZXlTcGVjaWZpZWQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIGlmICgha2V5KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdQbGFjZWhvbGRlciBlbGVtZW50cyBtdXN0IGhhdmUgYSBrZXkgc3BlY2lmaWVkLicpO1xuICB9XG59O1xuXG4vKipcbiAgKiBNYWtlcyBzdXJlIHRoYXQgdGFncyBhcmUgY29ycmVjdGx5IG5lc3RlZC5cbiAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZU5hbWVcbiAgKiBAcGFyYW0ge3N0cmluZ30gdGFnXG4gICovXG52YXIgYXNzZXJ0Q2xvc2VNYXRjaGVzT3BlblRhZyA9IGZ1bmN0aW9uIChub2RlTmFtZSwgdGFnKSB7XG4gIGlmIChub2RlTmFtZSAhPT0gdGFnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdSZWNlaXZlZCBhIGNhbGwgdG8gY2xvc2UgJyArIHRhZyArICcgYnV0ICcgKyBub2RlTmFtZSArICcgd2FzIG9wZW4uJyk7XG4gIH1cbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGF0IG5vIGNoaWxkcmVuIGVsZW1lbnRzIGhhdmUgYmVlbiBkZWNsYXJlZCB5ZXQgaW4gdGhlIGN1cnJlbnRcbiAqIGVsZW1lbnQuXG4gKiBAcGFyYW0ge3N0cmluZ30gZnVuY3Rpb25OYW1lXG4gKiBAcGFyYW0gez9Ob2RlfSBwcmV2aW91c05vZGVcbiAqL1xudmFyIGFzc2VydE5vQ2hpbGRyZW5EZWNsYXJlZFlldCA9IGZ1bmN0aW9uIChmdW5jdGlvbk5hbWUsIHByZXZpb3VzTm9kZSkge1xuICBpZiAocHJldmlvdXNOb2RlICE9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGZ1bmN0aW9uTmFtZSArICcoKSBtdXN0IGNvbWUgYmVmb3JlIGFueSBjaGlsZCAnICsgJ2RlY2xhcmF0aW9ucyBpbnNpZGUgdGhlIGN1cnJlbnQgZWxlbWVudC4nKTtcbiAgfVxufTtcblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBzdGF0ZSBvZiBiZWluZyBpbiBhbiBhdHRyaWJ1dGUgZGVjbGFyYXRpb24uXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHZhbHVlXG4gKiBAcmV0dXJuIHtib29sZWFufSB0aGUgcHJldmlvdXMgdmFsdWUuXG4gKi9cbnZhciBzZXRJbkF0dHJpYnV0ZXMgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgdmFyIHByZXZpb3VzID0gaW5BdHRyaWJ1dGVzO1xuICBpbkF0dHJpYnV0ZXMgPSB2YWx1ZTtcbiAgcmV0dXJuIHByZXZpb3VzO1xufTtcblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBzdGF0ZSBvZiBiZWluZyBpbiBhIHNraXAgZWxlbWVudC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWVcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRoZSBwcmV2aW91cyB2YWx1ZS5cbiAqL1xudmFyIHNldEluU2tpcCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB2YXIgcHJldmlvdXMgPSBpblNraXA7XG4gIGluU2tpcCA9IHZhbHVlO1xuICByZXR1cm4gcHJldmlvdXM7XG59O1xuXG4vKipcbiAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKiAqL1xuZXhwb3J0cy5ub3RpZmljYXRpb25zID0ge1xuICAvKipcbiAgICogQ2FsbGVkIGFmdGVyIHBhdGNoIGhhcyBjb21wbGVhdGVkIHdpdGggYW55IE5vZGVzIHRoYXQgaGF2ZSBiZWVuIGNyZWF0ZWRcbiAgICogYW5kIGFkZGVkIHRvIHRoZSBET00uXG4gICAqIEB0eXBlIHs/ZnVuY3Rpb24oQXJyYXk8IU5vZGU+KX1cbiAgICovXG4gIG5vZGVzQ3JlYXRlZDogbnVsbCxcblxuICAvKipcbiAgICogQ2FsbGVkIGFmdGVyIHBhdGNoIGhhcyBjb21wbGVhdGVkIHdpdGggYW55IE5vZGVzIHRoYXQgaGF2ZSBiZWVuIHJlbW92ZWRcbiAgICogZnJvbSB0aGUgRE9NLlxuICAgKiBOb3RlIGl0J3MgYW4gYXBwbGljYXRpb25zIHJlc3BvbnNpYmlsaXR5IHRvIGhhbmRsZSBhbnkgY2hpbGROb2Rlcy5cbiAgICogQHR5cGUgez9mdW5jdGlvbihBcnJheTwhTm9kZT4pfVxuICAgKi9cbiAgbm9kZXNEZWxldGVkOiBudWxsXG59O1xuXG4vKipcbiAqIEtlZXBzIHRyYWNrIG9mIHRoZSBzdGF0ZSBvZiBhIHBhdGNoLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIENvbnRleHQoKSB7XG4gIC8qKlxuICAgKiBAdHlwZSB7KEFycmF5PCFOb2RlPnx1bmRlZmluZWQpfVxuICAgKi9cbiAgdGhpcy5jcmVhdGVkID0gZXhwb3J0cy5ub3RpZmljYXRpb25zLm5vZGVzQ3JlYXRlZCAmJiBbXTtcblxuICAvKipcbiAgICogQHR5cGUgeyhBcnJheTwhTm9kZT58dW5kZWZpbmVkKX1cbiAgICovXG4gIHRoaXMuZGVsZXRlZCA9IGV4cG9ydHMubm90aWZpY2F0aW9ucy5ub2Rlc0RlbGV0ZWQgJiYgW107XG59XG5cbi8qKlxuICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICovXG5Db250ZXh0LnByb3RvdHlwZS5tYXJrQ3JlYXRlZCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gIGlmICh0aGlzLmNyZWF0ZWQpIHtcbiAgICB0aGlzLmNyZWF0ZWQucHVzaChub2RlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gKi9cbkNvbnRleHQucHJvdG90eXBlLm1hcmtEZWxldGVkID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgaWYgKHRoaXMuZGVsZXRlZCkge1xuICAgIHRoaXMuZGVsZXRlZC5wdXNoKG5vZGUpO1xuICB9XG59O1xuXG4vKipcbiAqIE5vdGlmaWVzIGFib3V0IG5vZGVzIHRoYXQgd2VyZSBjcmVhdGVkIGR1cmluZyB0aGUgcGF0Y2ggb3BlYXJhdGlvbi5cbiAqL1xuQ29udGV4dC5wcm90b3R5cGUubm90aWZ5Q2hhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuY3JlYXRlZCAmJiB0aGlzLmNyZWF0ZWQubGVuZ3RoID4gMCkge1xuICAgIGV4cG9ydHMubm90aWZpY2F0aW9ucy5ub2Rlc0NyZWF0ZWQodGhpcy5jcmVhdGVkKTtcbiAgfVxuXG4gIGlmICh0aGlzLmRlbGV0ZWQgJiYgdGhpcy5kZWxldGVkLmxlbmd0aCA+IDApIHtcbiAgICBleHBvcnRzLm5vdGlmaWNhdGlvbnMubm9kZXNEZWxldGVkKHRoaXMuZGVsZXRlZCk7XG4gIH1cbn07XG5cbi8qKlxuICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4gKiBBIGNhY2hlZCByZWZlcmVuY2UgdG8gdGhlIGhhc093blByb3BlcnR5IGZ1bmN0aW9uLlxuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIEEgY2FjaGVkIHJlZmVyZW5jZSB0byB0aGUgY3JlYXRlIGZ1bmN0aW9uLlxuICovXG52YXIgY3JlYXRlID0gT2JqZWN0LmNyZWF0ZTtcblxuLyoqXG4gKiBVc2VkIHRvIHByZXZlbnQgcHJvcGVydHkgY29sbGlzaW9ucyBiZXR3ZWVuIG91ciBcIm1hcFwiIGFuZCBpdHMgcHJvdG90eXBlLlxuICogQHBhcmFtIHshT2JqZWN0PHN0cmluZywgKj59IG1hcCBUaGUgbWFwIHRvIGNoZWNrLlxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5IFRoZSBwcm9wZXJ0eSB0byBjaGVjay5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgbWFwIGhhcyBwcm9wZXJ0eS5cbiAqL1xudmFyIGhhcyA9IGZ1bmN0aW9uIChtYXAsIHByb3BlcnR5KSB7XG4gIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG1hcCwgcHJvcGVydHkpO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIG1hcCBvYmplY3Qgd2l0aG91dCBhIHByb3RvdHlwZS5cbiAqIEByZXR1cm4geyFPYmplY3R9XG4gKi9cbnZhciBjcmVhdGVNYXAgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBjcmVhdGUobnVsbCk7XG59O1xuXG4vKipcbiAqIEtlZXBzIHRyYWNrIG9mIGluZm9ybWF0aW9uIG5lZWRlZCB0byBwZXJmb3JtIGRpZmZzIGZvciBhIGdpdmVuIERPTSBub2RlLlxuICogQHBhcmFtIHshc3RyaW5nfSBub2RlTmFtZVxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5XG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTm9kZURhdGEobm9kZU5hbWUsIGtleSkge1xuICAvKipcbiAgICogVGhlIGF0dHJpYnV0ZXMgYW5kIHRoZWlyIHZhbHVlcy5cbiAgICogQGNvbnN0IHshT2JqZWN0PHN0cmluZywgKj59XG4gICAqL1xuICB0aGlzLmF0dHJzID0gY3JlYXRlTWFwKCk7XG5cbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzLCB1c2VkIGZvciBxdWlja2x5IGRpZmZpbmcgdGhlXG4gICAqIGluY29tbWluZyBhdHRyaWJ1dGVzIHRvIHNlZSBpZiB0aGUgRE9NIG5vZGUncyBhdHRyaWJ1dGVzIG5lZWQgdG8gYmVcbiAgICogdXBkYXRlZC5cbiAgICogQGNvbnN0IHtBcnJheTwqPn1cbiAgICovXG4gIHRoaXMuYXR0cnNBcnIgPSBbXTtcblxuICAvKipcbiAgICogVGhlIGluY29taW5nIGF0dHJpYnV0ZXMgZm9yIHRoaXMgTm9kZSwgYmVmb3JlIHRoZXkgYXJlIHVwZGF0ZWQuXG4gICAqIEBjb25zdCB7IU9iamVjdDxzdHJpbmcsICo+fVxuICAgKi9cbiAgdGhpcy5uZXdBdHRycyA9IGNyZWF0ZU1hcCgpO1xuXG4gIC8qKlxuICAgKiBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBub2RlLCB1c2VkIHRvIHByZXNlcnZlIERPTSBub2RlcyB3aGVuIHRoZXlcbiAgICogbW92ZSB3aXRoaW4gdGhlaXIgcGFyZW50LlxuICAgKiBAY29uc3RcbiAgICovXG4gIHRoaXMua2V5ID0ga2V5O1xuXG4gIC8qKlxuICAgKiBLZWVwcyB0cmFjayBvZiBjaGlsZHJlbiB3aXRoaW4gdGhpcyBub2RlIGJ5IHRoZWlyIGtleS5cbiAgICogez9PYmplY3Q8c3RyaW5nLCAhRWxlbWVudD59XG4gICAqL1xuICB0aGlzLmtleU1hcCA9IG51bGw7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSBrZXlNYXAgaXMgY3VycmVudGx5IHZhbGlkLlxuICAgKiB7Ym9vbGVhbn1cbiAgICovXG4gIHRoaXMua2V5TWFwVmFsaWQgPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBUaGUgbm9kZSBuYW1lIGZvciB0aGlzIG5vZGUuXG4gICAqIEBjb25zdCB7c3RyaW5nfVxuICAgKi9cbiAgdGhpcy5ub2RlTmFtZSA9IG5vZGVOYW1lO1xuXG4gIC8qKlxuICAgKiBAdHlwZSB7P3N0cmluZ31cbiAgICovXG4gIHRoaXMudGV4dCA9IG51bGw7XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgYSBOb2RlRGF0YSBvYmplY3QgZm9yIGEgTm9kZS5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgVGhlIG5vZGUgdG8gaW5pdGlhbGl6ZSBkYXRhIGZvci5cbiAqIEBwYXJhbSB7c3RyaW5nfSBub2RlTmFtZSBUaGUgbm9kZSBuYW1lIG9mIG5vZGUuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB0aGF0IGlkZW50aWZpZXMgdGhlIG5vZGUuXG4gKiBAcmV0dXJuIHshTm9kZURhdGF9IFRoZSBuZXdseSBpbml0aWFsaXplZCBkYXRhIG9iamVjdFxuICovXG52YXIgaW5pdERhdGEgPSBmdW5jdGlvbiAobm9kZSwgbm9kZU5hbWUsIGtleSkge1xuICB2YXIgZGF0YSA9IG5ldyBOb2RlRGF0YShub2RlTmFtZSwga2V5KTtcbiAgbm9kZVsnX19pbmNyZW1lbnRhbERPTURhdGEnXSA9IGRhdGE7XG4gIHJldHVybiBkYXRhO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIE5vZGVEYXRhIG9iamVjdCBmb3IgYSBOb2RlLCBjcmVhdGluZyBpdCBpZiBuZWNlc3NhcnkuXG4gKlxuICogQHBhcmFtIHtOb2RlfSBub2RlIFRoZSBub2RlIHRvIHJldHJpZXZlIHRoZSBkYXRhIGZvci5cbiAqIEByZXR1cm4geyFOb2RlRGF0YX0gVGhlIE5vZGVEYXRhIGZvciB0aGlzIE5vZGUuXG4gKi9cbnZhciBnZXREYXRhID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgdmFyIGRhdGEgPSBub2RlWydfX2luY3JlbWVudGFsRE9NRGF0YSddO1xuXG4gIGlmICghZGF0YSkge1xuICAgIHZhciBub2RlTmFtZSA9IG5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICB2YXIga2V5ID0gbnVsbDtcblxuICAgIGlmIChub2RlIGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAga2V5ID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ2tleScpO1xuICAgIH1cblxuICAgIGRhdGEgPSBpbml0RGF0YShub2RlLCBub2RlTmFtZSwga2V5KTtcbiAgfVxuXG4gIHJldHVybiBkYXRhO1xufTtcblxuLyoqXG4gKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5leHBvcnRzLnN5bWJvbHMgPSB7XG4gIGRlZmF1bHQ6ICdfX2RlZmF1bHQnLFxuXG4gIHBsYWNlaG9sZGVyOiAnX19wbGFjZWhvbGRlcidcbn07XG5cbi8qKlxuICogQXBwbGllcyBhbiBhdHRyaWJ1dGUgb3IgcHJvcGVydHkgdG8gYSBnaXZlbiBFbGVtZW50LiBJZiB0aGUgdmFsdWUgaXMgbnVsbFxuICogb3IgdW5kZWZpbmVkLCBpdCBpcyByZW1vdmVkIGZyb20gdGhlIEVsZW1lbnQuIE90aGVyd2lzZSwgdGhlIHZhbHVlIGlzIHNldFxuICogYXMgYW4gYXR0cmlidXRlLlxuICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBhdHRyaWJ1dGUncyBuYW1lLlxuICogQHBhcmFtIHs/KGJvb2xlYW58bnVtYmVyfHN0cmluZyk9fSB2YWx1ZSBUaGUgYXR0cmlidXRlJ3MgdmFsdWUuXG4gKi9cbmV4cG9ydHMuYXBwbHlBdHRyID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIGVsLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgfSBlbHNlIHtcbiAgICBlbC5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xuICB9XG59O1xuXG4vKipcbiAqIEFwcGxpZXMgYSBwcm9wZXJ0eSB0byBhIGdpdmVuIEVsZW1lbnQuXG4gKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIHByb3BlcnR5J3MgbmFtZS5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHByb3BlcnR5J3MgdmFsdWUuXG4gKi9cbmV4cG9ydHMuYXBwbHlQcm9wID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICBlbFtuYW1lXSA9IHZhbHVlO1xufTtcblxuLyoqXG4gKiBBcHBsaWVzIGEgc3R5bGUgdG8gYW4gRWxlbWVudC4gTm8gdmVuZG9yIHByZWZpeCBleHBhbnNpb24gaXMgZG9uZSBmb3JcbiAqIHByb3BlcnR5IG5hbWVzL3ZhbHVlcy5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAqIEBwYXJhbSB7Kn0gc3R5bGUgVGhlIHN0eWxlIHRvIHNldC4gRWl0aGVyIGEgc3RyaW5nIG9mIGNzcyBvciBhbiBvYmplY3RcbiAqICAgICBjb250YWluaW5nIHByb3BlcnR5LXZhbHVlIHBhaXJzLlxuICovXG52YXIgYXBwbHlTdHlsZSA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgc3R5bGUpIHtcbiAgaWYgKHR5cGVvZiBzdHlsZSA9PT0gJ3N0cmluZycpIHtcbiAgICBlbC5zdHlsZS5jc3NUZXh0ID0gc3R5bGU7XG4gIH0gZWxzZSB7XG4gICAgZWwuc3R5bGUuY3NzVGV4dCA9ICcnO1xuICAgIHZhciBlbFN0eWxlID0gZWwuc3R5bGU7XG4gICAgdmFyIG9iaiA9IC8qKiBAdHlwZSB7IU9iamVjdDxzdHJpbmcsc3RyaW5nPn0gKi9zdHlsZTtcblxuICAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XG4gICAgICBpZiAoaGFzKG9iaiwgcHJvcCkpIHtcbiAgICAgICAgZWxTdHlsZVtwcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogVXBkYXRlcyBhIHNpbmdsZSBhdHRyaWJ1dGUgb24gYW4gRWxlbWVudC5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIGF0dHJpYnV0ZSdzIHZhbHVlLiBJZiB0aGUgdmFsdWUgaXMgYW4gb2JqZWN0IG9yXG4gKiAgICAgZnVuY3Rpb24gaXQgaXMgc2V0IG9uIHRoZSBFbGVtZW50LCBvdGhlcndpc2UsIGl0IGlzIHNldCBhcyBhbiBIVE1MXG4gKiAgICAgYXR0cmlidXRlLlxuICovXG52YXIgYXBwbHlBdHRyaWJ1dGVUeXBlZCA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG5cbiAgaWYgKHR5cGUgPT09ICdvYmplY3QnIHx8IHR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICBleHBvcnRzLmFwcGx5UHJvcChlbCwgbmFtZSwgdmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIGV4cG9ydHMuYXBwbHlBdHRyKGVsLCBuYW1lLCAvKiogQHR5cGUgez8oYm9vbGVhbnxudW1iZXJ8c3RyaW5nKX0gKi92YWx1ZSk7XG4gIH1cbn07XG5cbi8qKlxuICogQ2FsbHMgdGhlIGFwcHJvcHJpYXRlIGF0dHJpYnV0ZSBtdXRhdG9yIGZvciB0aGlzIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIGF0dHJpYnV0ZSdzIHZhbHVlLlxuICovXG52YXIgdXBkYXRlQXR0cmlidXRlID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICB2YXIgZGF0YSA9IGdldERhdGEoZWwpO1xuICB2YXIgYXR0cnMgPSBkYXRhLmF0dHJzO1xuXG4gIGlmIChhdHRyc1tuYW1lXSA9PT0gdmFsdWUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgbXV0YXRvciA9IGV4cG9ydHMuYXR0cmlidXRlc1tuYW1lXSB8fCBleHBvcnRzLmF0dHJpYnV0ZXNbZXhwb3J0cy5zeW1ib2xzLmRlZmF1bHRdO1xuICBtdXRhdG9yKGVsLCBuYW1lLCB2YWx1ZSk7XG5cbiAgYXR0cnNbbmFtZV0gPSB2YWx1ZTtcbn07XG5cbi8qKlxuICogQSBwdWJsaWNseSBtdXRhYmxlIG9iamVjdCB0byBwcm92aWRlIGN1c3RvbSBtdXRhdG9ycyBmb3IgYXR0cmlidXRlcy5cbiAqIEBjb25zdCB7IU9iamVjdDxzdHJpbmcsIGZ1bmN0aW9uKCFFbGVtZW50LCBzdHJpbmcsICopPn1cbiAqL1xuZXhwb3J0cy5hdHRyaWJ1dGVzID0gY3JlYXRlTWFwKCk7XG5cbi8vIFNwZWNpYWwgZ2VuZXJpYyBtdXRhdG9yIHRoYXQncyBjYWxsZWQgZm9yIGFueSBhdHRyaWJ1dGUgdGhhdCBkb2VzIG5vdFxuLy8gaGF2ZSBhIHNwZWNpZmljIG11dGF0b3IuXG5leHBvcnRzLmF0dHJpYnV0ZXNbZXhwb3J0cy5zeW1ib2xzLmRlZmF1bHRdID0gYXBwbHlBdHRyaWJ1dGVUeXBlZDtcblxuZXhwb3J0cy5hdHRyaWJ1dGVzW2V4cG9ydHMuc3ltYm9scy5wbGFjZWhvbGRlcl0gPSBmdW5jdGlvbiAoKSB7fTtcblxuZXhwb3J0cy5hdHRyaWJ1dGVzWydzdHlsZSddID0gYXBwbHlTdHlsZTtcblxuLyoqXG4gKiBHZXRzIHRoZSBuYW1lc3BhY2UgdG8gY3JlYXRlIGFuIGVsZW1lbnQgKG9mIGEgZ2l2ZW4gdGFnKSBpbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIHRhZyB0byBnZXQgdGhlIG5hbWVzcGFjZSBmb3IuXG4gKiBAcGFyYW0gez9Ob2RlfSBwYXJlbnRcbiAqIEByZXR1cm4gez9zdHJpbmd9IFRoZSBuYW1lc3BhY2UgdG8gY3JlYXRlIHRoZSB0YWcgaW4uXG4gKi9cbnZhciBnZXROYW1lc3BhY2VGb3JUYWcgPSBmdW5jdGlvbiAodGFnLCBwYXJlbnQpIHtcbiAgaWYgKHRhZyA9PT0gJ3N2ZycpIHtcbiAgICByZXR1cm4gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcbiAgfVxuXG4gIGlmIChnZXREYXRhKHBhcmVudCkubm9kZU5hbWUgPT09ICdmb3JlaWduT2JqZWN0Jykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHBhcmVudC5uYW1lc3BhY2VVUkk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gRWxlbWVudC5cbiAqIEBwYXJhbSB7RG9jdW1lbnR9IGRvYyBUaGUgZG9jdW1lbnQgd2l0aCB3aGljaCB0byBjcmVhdGUgdGhlIEVsZW1lbnQuXG4gKiBAcGFyYW0gez9Ob2RlfSBwYXJlbnRcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIHRhZyBmb3IgdGhlIEVsZW1lbnQuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgQSBrZXkgdG8gaWRlbnRpZnkgdGhlIEVsZW1lbnQuXG4gKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LlxuICogQHJldHVybiB7IUVsZW1lbnR9XG4gKi9cbnZhciBjcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24gKGRvYywgcGFyZW50LCB0YWcsIGtleSwgc3RhdGljcykge1xuICB2YXIgbmFtZXNwYWNlID0gZ2V0TmFtZXNwYWNlRm9yVGFnKHRhZywgcGFyZW50KTtcbiAgdmFyIGVsO1xuXG4gIGlmIChuYW1lc3BhY2UpIHtcbiAgICBlbCA9IGRvYy5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCB0YWcpO1xuICB9IGVsc2Uge1xuICAgIGVsID0gZG9jLmNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgfVxuXG4gIGluaXREYXRhKGVsLCB0YWcsIGtleSk7XG5cbiAgaWYgKHN0YXRpY3MpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0YXRpY3MubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIHVwZGF0ZUF0dHJpYnV0ZShlbCwgLyoqIEB0eXBlIHshc3RyaW5nfSovc3RhdGljc1tpXSwgc3RhdGljc1tpICsgMV0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBlbDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRleHQgTm9kZS5cbiAqIEBwYXJhbSB7RG9jdW1lbnR9IGRvYyBUaGUgZG9jdW1lbnQgd2l0aCB3aGljaCB0byBjcmVhdGUgdGhlIEVsZW1lbnQuXG4gKiBAcmV0dXJuIHshVGV4dH1cbiAqL1xudmFyIGNyZWF0ZVRleHQgPSBmdW5jdGlvbiAoZG9jKSB7XG4gIHZhciBub2RlID0gZG9jLmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgaW5pdERhdGEobm9kZSwgJyN0ZXh0JywgbnVsbCk7XG4gIHJldHVybiBub2RlO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbWFwcGluZyB0aGF0IGNhbiBiZSB1c2VkIHRvIGxvb2sgdXAgY2hpbGRyZW4gdXNpbmcgYSBrZXkuXG4gKiBAcGFyYW0gez9Ob2RlfSBlbFxuICogQHJldHVybiB7IU9iamVjdDxzdHJpbmcsICFFbGVtZW50Pn0gQSBtYXBwaW5nIG9mIGtleXMgdG8gdGhlIGNoaWxkcmVuIG9mIHRoZVxuICogICAgIEVsZW1lbnQuXG4gKi9cbnZhciBjcmVhdGVLZXlNYXAgPSBmdW5jdGlvbiAoZWwpIHtcbiAgdmFyIG1hcCA9IGNyZWF0ZU1hcCgpO1xuICB2YXIgY2hpbGRyZW4gPSBlbC5jaGlsZHJlbjtcbiAgdmFyIGNvdW50ID0gY2hpbGRyZW4ubGVuZ3RoO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkgKz0gMSkge1xuICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgIHZhciBrZXkgPSBnZXREYXRhKGNoaWxkKS5rZXk7XG5cbiAgICBpZiAoa2V5KSB7XG4gICAgICBtYXBba2V5XSA9IGNoaWxkO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtYXA7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgbWFwcGluZyBvZiBrZXkgdG8gY2hpbGQgbm9kZSBmb3IgYSBnaXZlbiBFbGVtZW50LCBjcmVhdGluZyBpdFxuICogaWYgbmVjZXNzYXJ5LlxuICogQHBhcmFtIHs/Tm9kZX0gZWxcbiAqIEByZXR1cm4geyFPYmplY3Q8c3RyaW5nLCAhTm9kZT59IEEgbWFwcGluZyBvZiBrZXlzIHRvIGNoaWxkIEVsZW1lbnRzXG4gKi9cbnZhciBnZXRLZXlNYXAgPSBmdW5jdGlvbiAoZWwpIHtcbiAgdmFyIGRhdGEgPSBnZXREYXRhKGVsKTtcblxuICBpZiAoIWRhdGEua2V5TWFwKSB7XG4gICAgZGF0YS5rZXlNYXAgPSBjcmVhdGVLZXlNYXAoZWwpO1xuICB9XG5cbiAgcmV0dXJuIGRhdGEua2V5TWFwO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgYSBjaGlsZCBmcm9tIHRoZSBwYXJlbnQgd2l0aCB0aGUgZ2l2ZW4ga2V5LlxuICogQHBhcmFtIHs/Tm9kZX0gcGFyZW50XG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXlcbiAqIEByZXR1cm4gez9Ob2RlfSBUaGUgY2hpbGQgY29ycmVzcG9uZGluZyB0byB0aGUga2V5LlxuICovXG52YXIgZ2V0Q2hpbGQgPSBmdW5jdGlvbiAocGFyZW50LCBrZXkpIHtcbiAgcmV0dXJuIGtleSA/IGdldEtleU1hcChwYXJlbnQpW2tleV0gOiBudWxsO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgYW4gZWxlbWVudCBhcyBiZWluZyBhIGNoaWxkLiBUaGUgcGFyZW50IHdpbGwga2VlcCB0cmFjayBvZiB0aGVcbiAqIGNoaWxkIHVzaW5nIHRoZSBrZXkuIFRoZSBjaGlsZCBjYW4gYmUgcmV0cmlldmVkIHVzaW5nIHRoZSBzYW1lIGtleSB1c2luZ1xuICogZ2V0S2V5TWFwLiBUaGUgcHJvdmlkZWQga2V5IHNob3VsZCBiZSB1bmlxdWUgd2l0aGluIHRoZSBwYXJlbnQgRWxlbWVudC5cbiAqIEBwYXJhbSB7P05vZGV9IHBhcmVudCBUaGUgcGFyZW50IG9mIGNoaWxkLlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBBIGtleSB0byBpZGVudGlmeSB0aGUgY2hpbGQgd2l0aC5cbiAqIEBwYXJhbSB7IU5vZGV9IGNoaWxkIFRoZSBjaGlsZCB0byByZWdpc3Rlci5cbiAqL1xudmFyIHJlZ2lzdGVyQ2hpbGQgPSBmdW5jdGlvbiAocGFyZW50LCBrZXksIGNoaWxkKSB7XG4gIGdldEtleU1hcChwYXJlbnQpW2tleV0gPSBjaGlsZDtcbn07XG5cbi8qKiBAdHlwZSB7P0NvbnRleHR9ICovXG52YXIgY29udGV4dCA9IG51bGw7XG5cbi8qKiBAdHlwZSB7P05vZGV9ICovXG52YXIgY3VycmVudE5vZGU7XG5cbi8qKiBAdHlwZSB7P05vZGV9ICovXG52YXIgY3VycmVudFBhcmVudDtcblxuLyoqIEB0eXBlIHs/Tm9kZX0gKi9cbnZhciBwcmV2aW91c05vZGU7XG5cbi8qKiBAdHlwZSB7P0VsZW1lbnR8P0RvY3VtZW50RnJhZ21lbnR9ICovXG52YXIgcm9vdDtcblxuLyoqIEB0eXBlIHs/RG9jdW1lbnR9ICovXG52YXIgZG9jO1xuXG4vKipcbiAqIFBhdGNoZXMgdGhlIGRvY3VtZW50IHN0YXJ0aW5nIGF0IGVsIHdpdGggdGhlIHByb3ZpZGVkIGZ1bmN0aW9uLiBUaGlzIGZ1bmN0aW9uXG4gKiBtYXkgYmUgY2FsbGVkIGR1cmluZyBhbiBleGlzdGluZyBwYXRjaCBvcGVyYXRpb24uXG4gKiBAcGFyYW0geyFFbGVtZW50fCFEb2N1bWVudEZyYWdtZW50fSBub2RlIFRoZSBFbGVtZW50IG9yIERvY3VtZW50XG4gKiAgICAgdG8gcGF0Y2guXG4gKiBAcGFyYW0geyFmdW5jdGlvbihUKX0gZm4gQSBmdW5jdGlvbiBjb250YWluaW5nIGVsZW1lbnRPcGVuL2VsZW1lbnRDbG9zZS9ldGMuXG4gKiAgICAgY2FsbHMgdGhhdCBkZXNjcmliZSB0aGUgRE9NLlxuICogQHBhcmFtIHtUPX0gZGF0YSBBbiBhcmd1bWVudCBwYXNzZWQgdG8gZm4gdG8gcmVwcmVzZW50IERPTSBzdGF0ZS5cbiAqIEB0ZW1wbGF0ZSBUXG4gKi9cbmV4cG9ydHMucGF0Y2ggPSBmdW5jdGlvbiAobm9kZSwgZm4sIGRhdGEpIHtcbiAgdmFyIHByZXZDb250ZXh0ID0gY29udGV4dDtcbiAgdmFyIHByZXZSb290ID0gcm9vdDtcbiAgdmFyIHByZXZEb2MgPSBkb2M7XG4gIHZhciBwcmV2Q3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZTtcbiAgdmFyIHByZXZDdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudDtcbiAgdmFyIHByZXZQcmV2aW91c05vZGUgPSBwcmV2aW91c05vZGU7XG4gIHZhciBwcmV2aW91c0luQXR0cmlidXRlcyA9IGZhbHNlO1xuICB2YXIgcHJldmlvdXNJblNraXAgPSBmYWxzZTtcblxuICBjb250ZXh0ID0gbmV3IENvbnRleHQoKTtcbiAgcm9vdCA9IG5vZGU7XG4gIGRvYyA9IG5vZGUub3duZXJEb2N1bWVudDtcbiAgY3VycmVudE5vZGUgPSBub2RlO1xuICBjdXJyZW50UGFyZW50ID0gbnVsbDtcbiAgcHJldmlvdXNOb2RlID0gbnVsbDtcblxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIHByZXZpb3VzSW5BdHRyaWJ1dGVzID0gc2V0SW5BdHRyaWJ1dGVzKGZhbHNlKTtcbiAgICBwcmV2aW91c0luU2tpcCA9IHNldEluU2tpcChmYWxzZSk7XG4gIH1cblxuICBlbnRlck5vZGUoKTtcbiAgZm4oZGF0YSk7XG4gIGV4aXROb2RlKCk7XG5cbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnRWaXJ0dWFsQXR0cmlidXRlc0Nsb3NlZCgpO1xuICAgIGFzc2VydE5vVW5jbG9zZWRUYWdzKHByZXZpb3VzTm9kZSwgbm9kZSk7XG4gICAgc2V0SW5BdHRyaWJ1dGVzKHByZXZpb3VzSW5BdHRyaWJ1dGVzKTtcbiAgICBzZXRJblNraXAocHJldmlvdXNJblNraXApO1xuICB9XG5cbiAgY29udGV4dC5ub3RpZnlDaGFuZ2VzKCk7XG5cbiAgY29udGV4dCA9IHByZXZDb250ZXh0O1xuICByb290ID0gcHJldlJvb3Q7XG4gIGRvYyA9IHByZXZEb2M7XG4gIGN1cnJlbnROb2RlID0gcHJldkN1cnJlbnROb2RlO1xuICBjdXJyZW50UGFyZW50ID0gcHJldkN1cnJlbnRQYXJlbnQ7XG4gIHByZXZpb3VzTm9kZSA9IHByZXZQcmV2aW91c05vZGU7XG59O1xuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIG9yIG5vdCB0aGUgY3VycmVudCBub2RlIG1hdGNoZXMgdGhlIHNwZWNpZmllZCBub2RlTmFtZSBhbmRcbiAqIGtleS5cbiAqXG4gKiBAcGFyYW0gez9zdHJpbmd9IG5vZGVOYW1lIFRoZSBub2RlTmFtZSBmb3IgdGhpcyBub2RlLlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IEFuIG9wdGlvbmFsIGtleSB0aGF0IGlkZW50aWZpZXMgYSBub2RlLlxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgbm9kZSBtYXRjaGVzLCBmYWxzZSBvdGhlcndpc2UuXG4gKi9cbnZhciBtYXRjaGVzID0gZnVuY3Rpb24gKG5vZGVOYW1lLCBrZXkpIHtcbiAgdmFyIGRhdGEgPSBnZXREYXRhKGN1cnJlbnROb2RlKTtcblxuICAvLyBLZXkgY2hlY2sgaXMgZG9uZSB1c2luZyBkb3VibGUgZXF1YWxzIGFzIHdlIHdhbnQgdG8gdHJlYXQgYSBudWxsIGtleSB0aGVcbiAgLy8gc2FtZSBhcyB1bmRlZmluZWQuIFRoaXMgc2hvdWxkIGJlIG9rYXkgYXMgdGhlIG9ubHkgdmFsdWVzIGFsbG93ZWQgYXJlXG4gIC8vIHN0cmluZ3MsIG51bGwgYW5kIHVuZGVmaW5lZCBzbyB0aGUgPT0gc2VtYW50aWNzIGFyZSBub3QgdG9vIHdlaXJkLlxuICByZXR1cm4gbm9kZU5hbWUgPT09IGRhdGEubm9kZU5hbWUgJiYga2V5ID09IGRhdGEua2V5O1xufTtcblxuLyoqXG4gKiBBbGlnbnMgdGhlIHZpcnR1YWwgRWxlbWVudCBkZWZpbml0aW9uIHdpdGggdGhlIGFjdHVhbCBET00sIG1vdmluZyB0aGVcbiAqIGNvcnJlc3BvbmRpbmcgRE9NIG5vZGUgdG8gdGhlIGNvcnJlY3QgbG9jYXRpb24gb3IgY3JlYXRpbmcgaXQgaWYgbmVjZXNzYXJ5LlxuICogQHBhcmFtIHtzdHJpbmd9IG5vZGVOYW1lIEZvciBhbiBFbGVtZW50LCB0aGlzIHNob3VsZCBiZSBhIHZhbGlkIHRhZyBzdHJpbmcuXG4gKiAgICAgRm9yIGEgVGV4dCwgdGhpcyBzaG91bGQgYmUgI3RleHQuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC5cbiAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBGb3IgYW4gRWxlbWVudCwgdGhpcyBzaG91bGQgYmUgYW4gYXJyYXkgb2ZcbiAqICAgICBuYW1lLXZhbHVlIHBhaXJzLlxuICovXG52YXIgYWxpZ25XaXRoRE9NID0gZnVuY3Rpb24gKG5vZGVOYW1lLCBrZXksIHN0YXRpY3MpIHtcbiAgaWYgKGN1cnJlbnROb2RlICYmIG1hdGNoZXMobm9kZU5hbWUsIGtleSkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgbm9kZTtcblxuICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIG5vZGUgaGFzIG1vdmVkIHdpdGhpbiB0aGUgcGFyZW50LlxuICBpZiAoa2V5KSB7XG4gICAgbm9kZSA9IGdldENoaWxkKGN1cnJlbnRQYXJlbnQsIGtleSk7XG4gICAgaWYgKG5vZGUgJiYgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgYXNzZXJ0S2V5ZWRUYWdNYXRjaGVzKGdldERhdGEobm9kZSkubm9kZU5hbWUsIG5vZGVOYW1lLCBrZXkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIENyZWF0ZSB0aGUgbm9kZSBpZiBpdCBkb2Vzbid0IGV4aXN0LlxuICBpZiAoIW5vZGUpIHtcbiAgICBpZiAobm9kZU5hbWUgPT09ICcjdGV4dCcpIHtcbiAgICAgIG5vZGUgPSBjcmVhdGVUZXh0KGRvYyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGUgPSBjcmVhdGVFbGVtZW50KGRvYywgY3VycmVudFBhcmVudCwgbm9kZU5hbWUsIGtleSwgc3RhdGljcyk7XG4gICAgfVxuXG4gICAgaWYgKGtleSkge1xuICAgICAgcmVnaXN0ZXJDaGlsZChjdXJyZW50UGFyZW50LCBrZXksIG5vZGUpO1xuICAgIH1cblxuICAgIGNvbnRleHQubWFya0NyZWF0ZWQobm9kZSk7XG4gIH1cblxuICAvLyBJZiB0aGUgbm9kZSBoYXMgYSBrZXksIHJlbW92ZSBpdCBmcm9tIHRoZSBET00gdG8gcHJldmVudCBhIGxhcmdlIG51bWJlclxuICAvLyBvZiByZS1vcmRlcnMgaW4gdGhlIGNhc2UgdGhhdCBpdCBtb3ZlZCBmYXIgb3Igd2FzIGNvbXBsZXRlbHkgcmVtb3ZlZC5cbiAgLy8gU2luY2Ugd2UgaG9sZCBvbiB0byBhIHJlZmVyZW5jZSB0aHJvdWdoIHRoZSBrZXlNYXAsIHdlIGNhbiBhbHdheXMgYWRkIGl0XG4gIC8vIGJhY2suXG4gIGlmIChjdXJyZW50Tm9kZSAmJiBnZXREYXRhKGN1cnJlbnROb2RlKS5rZXkpIHtcbiAgICBjdXJyZW50UGFyZW50LnJlcGxhY2VDaGlsZChub2RlLCBjdXJyZW50Tm9kZSk7XG4gICAgZ2V0RGF0YShjdXJyZW50UGFyZW50KS5rZXlNYXBWYWxpZCA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIGN1cnJlbnRQYXJlbnQuaW5zZXJ0QmVmb3JlKG5vZGUsIGN1cnJlbnROb2RlKTtcbiAgfVxuXG4gIGN1cnJlbnROb2RlID0gbm9kZTtcbn07XG5cbi8qKlxuICogQ2xlYXJzIG91dCBhbnkgdW52aXNpdGVkIE5vZGVzLCBhcyB0aGUgY29ycmVzcG9uZGluZyB2aXJ0dWFsIGVsZW1lbnRcbiAqIGZ1bmN0aW9ucyB3ZXJlIG5ldmVyIGNhbGxlZCBmb3IgdGhlbS5cbiAqL1xudmFyIGNsZWFyVW52aXNpdGVkRE9NID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbm9kZSA9IGN1cnJlbnRQYXJlbnQ7XG4gIHZhciBkYXRhID0gZ2V0RGF0YShub2RlKTtcbiAgdmFyIGtleU1hcCA9IGRhdGEua2V5TWFwO1xuICB2YXIga2V5TWFwVmFsaWQgPSBkYXRhLmtleU1hcFZhbGlkO1xuICB2YXIgY2hpbGQgPSBub2RlLmxhc3RDaGlsZDtcbiAgdmFyIGtleTtcblxuICBpZiAoY2hpbGQgPT09IHByZXZpb3VzTm9kZSAmJiBrZXlNYXBWYWxpZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChkYXRhLmF0dHJzW2V4cG9ydHMuc3ltYm9scy5wbGFjZWhvbGRlcl0gJiYgbm9kZSAhPT0gcm9vdCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHdoaWxlIChjaGlsZCAhPT0gcHJldmlvdXNOb2RlKSB7XG4gICAgbm9kZS5yZW1vdmVDaGlsZChjaGlsZCk7XG4gICAgY29udGV4dC5tYXJrRGVsZXRlZCggLyoqIEB0eXBlIHshTm9kZX0qL2NoaWxkKTtcblxuICAgIGtleSA9IGdldERhdGEoY2hpbGQpLmtleTtcbiAgICBpZiAoa2V5KSB7XG4gICAgICBkZWxldGUga2V5TWFwW2tleV07XG4gICAgfVxuICAgIGNoaWxkID0gbm9kZS5sYXN0Q2hpbGQ7XG4gIH1cblxuICAvLyBDbGVhbiB0aGUga2V5TWFwLCByZW1vdmluZyBhbnkgdW51c3VlZCBrZXlzLlxuICBpZiAoIWtleU1hcFZhbGlkKSB7XG4gICAgZm9yIChrZXkgaW4ga2V5TWFwKSB7XG4gICAgICBjaGlsZCA9IGtleU1hcFtrZXldO1xuICAgICAgaWYgKGNoaWxkLnBhcmVudE5vZGUgIT09IG5vZGUpIHtcbiAgICAgICAgY29udGV4dC5tYXJrRGVsZXRlZChjaGlsZCk7XG4gICAgICAgIGRlbGV0ZSBrZXlNYXBba2V5XTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBkYXRhLmtleU1hcFZhbGlkID0gdHJ1ZTtcbiAgfVxufTtcblxuLyoqXG4gKiBDaGFuZ2VzIHRvIHRoZSBmaXJzdCBjaGlsZCBvZiB0aGUgY3VycmVudCBub2RlLlxuICovXG52YXIgZW50ZXJOb2RlID0gZnVuY3Rpb24gKCkge1xuICBjdXJyZW50UGFyZW50ID0gY3VycmVudE5vZGU7XG4gIGN1cnJlbnROb2RlID0gY3VycmVudE5vZGUuZmlyc3RDaGlsZDtcbiAgcHJldmlvdXNOb2RlID0gbnVsbDtcbn07XG5cbi8qKlxuICogQ2hhbmdlcyB0byB0aGUgbmV4dCBzaWJsaW5nIG9mIHRoZSBjdXJyZW50IG5vZGUuXG4gKi9cbnZhciBuZXh0Tm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgcHJldmlvdXNOb2RlID0gY3VycmVudE5vZGU7XG4gIGN1cnJlbnROb2RlID0gY3VycmVudE5vZGUubmV4dFNpYmxpbmc7XG59O1xuXG4vKipcbiAqIENoYW5nZXMgdG8gdGhlIHBhcmVudCBvZiB0aGUgY3VycmVudCBub2RlLCByZW1vdmluZyBhbnkgdW52aXNpdGVkIGNoaWxkcmVuLlxuICovXG52YXIgZXhpdE5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gIGNsZWFyVW52aXNpdGVkRE9NKCk7XG5cbiAgcHJldmlvdXNOb2RlID0gY3VycmVudFBhcmVudDtcbiAgY3VycmVudE5vZGUgPSBjdXJyZW50UGFyZW50Lm5leHRTaWJsaW5nO1xuICBjdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudC5wYXJlbnROb2RlO1xufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoYXQgdGhlIGN1cnJlbnQgbm9kZSBpcyBhbiBFbGVtZW50IHdpdGggYSBtYXRjaGluZyB0YWdOYW1lIGFuZFxuICoga2V5LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC4gVGhpcyBjYW4gYmUgYW5cbiAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAqICAgICB3aGVuIGl0ZXJhdGluZyBvdmVyIGFuIGFycmF5IG9mIGl0ZW1zLlxuICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbnZhciBfZWxlbWVudE9wZW4gPSBmdW5jdGlvbiAodGFnLCBrZXksIHN0YXRpY3MpIHtcbiAgYWxpZ25XaXRoRE9NKHRhZywga2V5LCBzdGF0aWNzKTtcbiAgZW50ZXJOb2RlKCk7XG4gIHJldHVybiAoLyoqIEB0eXBlIHshRWxlbWVudH0gKi9jdXJyZW50UGFyZW50XG4gICk7XG59O1xuXG4vKipcbiAqIENsb3NlcyB0aGUgY3VycmVudGx5IG9wZW4gRWxlbWVudCwgcmVtb3ZpbmcgYW55IHVudmlzaXRlZCBjaGlsZHJlbiBpZlxuICogbmVjZXNzYXJ5LlxuICpcbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG52YXIgX2VsZW1lbnRDbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBzZXRJblNraXAoZmFsc2UpO1xuICB9XG5cbiAgZXhpdE5vZGUoKTtcbiAgcmV0dXJuICgvKiogQHR5cGUgeyFFbGVtZW50fSAqL3ByZXZpb3VzTm9kZVxuICApO1xufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoZSBjdXJyZW50IG5vZGUgaXMgYSBUZXh0IG5vZGUgYW5kIGNyZWF0ZXMgYSBUZXh0IG5vZGUgaWYgaXQgaXNcbiAqIG5vdC5cbiAqXG4gKiBAcmV0dXJuIHshVGV4dH0gVGhlIGNvcnJlc3BvbmRpbmcgVGV4dCBOb2RlLlxuICovXG52YXIgX3RleHQgPSBmdW5jdGlvbiAoKSB7XG4gIGFsaWduV2l0aERPTSgnI3RleHQnLCBudWxsLCBudWxsKTtcbiAgbmV4dE5vZGUoKTtcbiAgcmV0dXJuICgvKiogQHR5cGUgeyFUZXh0fSAqL3ByZXZpb3VzTm9kZVxuICApO1xufTtcblxuLyoqXG4gKiBHZXRzIHRoZSBjdXJyZW50IEVsZW1lbnQgYmVpbmcgcGF0Y2hlZC5cbiAqIEByZXR1cm4geyFFbGVtZW50fVxuICovXG5leHBvcnRzLmN1cnJlbnRFbGVtZW50ID0gZnVuY3Rpb24gKCkge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydEluUGF0Y2goY29udGV4dCk7XG4gICAgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzKCdjdXJyZW50RWxlbWVudCcpO1xuICB9XG4gIHJldHVybiAoLyoqIEB0eXBlIHshRWxlbWVudH0gKi9jdXJyZW50UGFyZW50XG4gICk7XG59O1xuXG4vKipcbiAqIFNraXBzIHRoZSBjaGlsZHJlbiBpbiBhIHN1YnRyZWUsIGFsbG93aW5nIGFuIEVsZW1lbnQgdG8gYmUgY2xvc2VkIHdpdGhvdXRcbiAqIGNsZWFyaW5nIG91dCB0aGUgY2hpbGRyZW4uXG4gKi9cbmV4cG9ydHMuc2tpcCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnROb0NoaWxkcmVuRGVjbGFyZWRZZXQoJ3NraXAnLCBwcmV2aW91c05vZGUpO1xuICAgIHNldEluU2tpcCh0cnVlKTtcbiAgfVxuICBwcmV2aW91c05vZGUgPSBjdXJyZW50UGFyZW50Lmxhc3RDaGlsZDtcbn07XG5cbi8qKlxuICogVGhlIG9mZnNldCBpbiB0aGUgdmlydHVhbCBlbGVtZW50IGRlY2xhcmF0aW9uIHdoZXJlIHRoZSBhdHRyaWJ1dGVzIGFyZVxuICogc3BlY2lmaWVkLlxuICogQGNvbnN0XG4gKi9cbnZhciBBVFRSSUJVVEVTX09GRlNFVCA9IDM7XG5cbi8qKlxuICogQnVpbGRzIGFuIGFycmF5IG9mIGFyZ3VtZW50cyBmb3IgdXNlIHdpdGggZWxlbWVudE9wZW5TdGFydCwgYXR0ciBhbmRcbiAqIGVsZW1lbnRPcGVuRW5kLlxuICogQGNvbnN0IHtBcnJheTwqPn1cbiAqL1xudmFyIGFyZ3NCdWlsZGVyID0gW107XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICogICAgIGVtcHR5IHN0cmluZywgYnV0IHBlcmZvcm1hbmNlIG1heSBiZSBiZXR0ZXIgaWYgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZFxuICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gKiBAcGFyYW0gey4uLip9IHZhcl9hcmdzIEF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZSBkeW5hbWljIGF0dHJpYnV0ZXNcbiAqICAgICBmb3IgdGhlIEVsZW1lbnQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xuZXhwb3J0cy5lbGVtZW50T3BlbiA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcywgdmFyX2FyZ3MpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnROb3RJbkF0dHJpYnV0ZXMoJ2VsZW1lbnRPcGVuJyk7XG4gICAgYXNzZXJ0Tm90SW5Ta2lwKCdlbGVtZW50T3BlbicpO1xuICB9XG5cbiAgdmFyIG5vZGUgPSBfZWxlbWVudE9wZW4odGFnLCBrZXksIHN0YXRpY3MpO1xuICB2YXIgZGF0YSA9IGdldERhdGEobm9kZSk7XG5cbiAgLypcbiAgICogQ2hlY2tzIHRvIHNlZSBpZiBvbmUgb3IgbW9yZSBhdHRyaWJ1dGVzIGhhdmUgY2hhbmdlZCBmb3IgYSBnaXZlbiBFbGVtZW50LlxuICAgKiBXaGVuIG5vIGF0dHJpYnV0ZXMgaGF2ZSBjaGFuZ2VkLCB0aGlzIGlzIG11Y2ggZmFzdGVyIHRoYW4gY2hlY2tpbmcgZWFjaFxuICAgKiBpbmRpdmlkdWFsIGFyZ3VtZW50LiBXaGVuIGF0dHJpYnV0ZXMgaGF2ZSBjaGFuZ2VkLCB0aGUgb3ZlcmhlYWQgb2YgdGhpcyBpc1xuICAgKiBtaW5pbWFsLlxuICAgKi9cbiAgdmFyIGF0dHJzQXJyID0gZGF0YS5hdHRyc0FycjtcbiAgdmFyIG5ld0F0dHJzID0gZGF0YS5uZXdBdHRycztcbiAgdmFyIGF0dHJzQ2hhbmdlZCA9IGZhbHNlO1xuICB2YXIgaSA9IEFUVFJJQlVURVNfT0ZGU0VUO1xuICB2YXIgaiA9IDA7XG5cbiAgZm9yICg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDEsIGogKz0gMSkge1xuICAgIGlmIChhdHRyc0FycltqXSAhPT0gYXJndW1lbnRzW2ldKSB7XG4gICAgICBhdHRyc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgZm9yICg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDEsIGogKz0gMSkge1xuICAgIGF0dHJzQXJyW2pdID0gYXJndW1lbnRzW2ldO1xuICB9XG5cbiAgaWYgKGogPCBhdHRyc0Fyci5sZW5ndGgpIHtcbiAgICBhdHRyc0NoYW5nZWQgPSB0cnVlO1xuICAgIGF0dHJzQXJyLmxlbmd0aCA9IGo7XG4gIH1cblxuICAvKlxuICAgKiBBY3R1YWxseSBwZXJmb3JtIHRoZSBhdHRyaWJ1dGUgdXBkYXRlLlxuICAgKi9cbiAgaWYgKGF0dHJzQ2hhbmdlZCkge1xuICAgIGZvciAoaSA9IEFUVFJJQlVURVNfT0ZGU0VUOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBuZXdBdHRyc1thcmd1bWVudHNbaV1dID0gYXJndW1lbnRzW2kgKyAxXTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBhdHRyIGluIG5ld0F0dHJzKSB7XG4gICAgICB1cGRhdGVBdHRyaWJ1dGUobm9kZSwgYXR0ciwgbmV3QXR0cnNbYXR0cl0pO1xuICAgICAgbmV3QXR0cnNbYXR0cl0gPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5vZGU7XG59O1xuXG4vKipcbiAqIERlY2xhcmVzIGEgdmlydHVhbCBFbGVtZW50IGF0IHRoZSBjdXJyZW50IGxvY2F0aW9uIGluIHRoZSBkb2N1bWVudC4gVGhpc1xuICogY29ycmVzcG9uZHMgdG8gYW4gb3BlbmluZyB0YWcgYW5kIGEgZWxlbWVudENsb3NlIHRhZyBpcyByZXF1aXJlZC4gVGhpcyBpc1xuICogbGlrZSBlbGVtZW50T3BlbiwgYnV0IHRoZSBhdHRyaWJ1dGVzIGFyZSBkZWZpbmVkIHVzaW5nIHRoZSBhdHRyIGZ1bmN0aW9uXG4gKiByYXRoZXIgdGhhbiBiZWluZyBwYXNzZWQgYXMgYXJndW1lbnRzLiBNdXN0IGJlIGZvbGxsb3dlZCBieSAwIG9yIG1vcmUgY2FsbHNcbiAqIHRvIGF0dHIsIHRoZW4gYSBjYWxsIHRvIGVsZW1lbnRPcGVuRW5kLlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICogICAgIGVtcHR5IHN0cmluZywgYnV0IHBlcmZvcm1hbmNlIG1heSBiZSBiZXR0ZXIgaWYgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZFxuICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gKi9cbmV4cG9ydHMuZWxlbWVudE9wZW5TdGFydCA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcykge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydE5vdEluQXR0cmlidXRlcygnZWxlbWVudE9wZW5TdGFydCcpO1xuICAgIHNldEluQXR0cmlidXRlcyh0cnVlKTtcbiAgfVxuXG4gIGFyZ3NCdWlsZGVyWzBdID0gdGFnO1xuICBhcmdzQnVpbGRlclsxXSA9IGtleTtcbiAgYXJnc0J1aWxkZXJbMl0gPSBzdGF0aWNzO1xufTtcblxuLyoqKlxuICogRGVmaW5lcyBhIHZpcnR1YWwgYXR0cmlidXRlIGF0IHRoaXMgcG9pbnQgb2YgdGhlIERPTS4gVGhpcyBpcyBvbmx5IHZhbGlkXG4gKiB3aGVuIGNhbGxlZCBiZXR3ZWVuIGVsZW1lbnRPcGVuU3RhcnQgYW5kIGVsZW1lbnRPcGVuRW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0geyp9IHZhbHVlXG4gKi9cbmV4cG9ydHMuYXR0ciA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydEluQXR0cmlidXRlcygnYXR0cicpO1xuICB9XG5cbiAgYXJnc0J1aWxkZXIucHVzaChuYW1lLCB2YWx1ZSk7XG59O1xuXG4vKipcbiAqIENsb3NlcyBhbiBvcGVuIHRhZyBzdGFydGVkIHdpdGggZWxlbWVudE9wZW5TdGFydC5cbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG5leHBvcnRzLmVsZW1lbnRPcGVuRW5kID0gZnVuY3Rpb24gKCkge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydEluQXR0cmlidXRlcygnZWxlbWVudE9wZW5FbmQnKTtcbiAgICBzZXRJbkF0dHJpYnV0ZXMoZmFsc2UpO1xuICB9XG5cbiAgdmFyIG5vZGUgPSBleHBvcnRzLmVsZW1lbnRPcGVuLmFwcGx5KG51bGwsIGFyZ3NCdWlsZGVyKTtcbiAgYXJnc0J1aWxkZXIubGVuZ3RoID0gMDtcbiAgcmV0dXJuIG5vZGU7XG59O1xuXG4vKipcbiAqIENsb3NlcyBhbiBvcGVuIHZpcnR1YWwgRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbmV4cG9ydHMuZWxlbWVudENsb3NlID0gZnVuY3Rpb24gKHRhZykge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydE5vdEluQXR0cmlidXRlcygnZWxlbWVudENsb3NlJyk7XG4gIH1cblxuICB2YXIgbm9kZSA9IF9lbGVtZW50Q2xvc2UoKTtcblxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydENsb3NlTWF0Y2hlc09wZW5UYWcoZ2V0RGF0YShub2RlKS5ub2RlTmFtZSwgdGFnKTtcbiAgfVxuXG4gIHJldHVybiBub2RlO1xufTtcblxuLyoqXG4gKiBEZWNsYXJlcyBhIHZpcnR1YWwgRWxlbWVudCBhdCB0aGUgY3VycmVudCBsb2NhdGlvbiBpbiB0aGUgZG9jdW1lbnQgdGhhdCBoYXNcbiAqIG5vIGNoaWxkcmVuLlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICogICAgIGVtcHR5IHN0cmluZywgYnV0IHBlcmZvcm1hbmNlIG1heSBiZSBiZXR0ZXIgaWYgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZFxuICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gKiBAcGFyYW0gey4uLip9IHZhcl9hcmdzIEF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZSBkeW5hbWljIGF0dHJpYnV0ZXNcbiAqICAgICBmb3IgdGhlIEVsZW1lbnQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xuZXhwb3J0cy5lbGVtZW50Vm9pZCA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcywgdmFyX2FyZ3MpIHtcbiAgdmFyIG5vZGUgPSBleHBvcnRzLmVsZW1lbnRPcGVuLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gIGV4cG9ydHMuZWxlbWVudENsb3NlLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gIHJldHVybiBub2RlO1xufTtcblxuLyoqXG4gKiBEZWNsYXJlcyBhIHZpcnR1YWwgRWxlbWVudCBhdCB0aGUgY3VycmVudCBsb2NhdGlvbiBpbiB0aGUgZG9jdW1lbnQgdGhhdCBpcyBhXG4gKiBwbGFjZWhvbGRlciBlbGVtZW50LiBDaGlsZHJlbiBvZiB0aGlzIEVsZW1lbnQgY2FuIGJlIG1hbnVhbGx5IG1hbmFnZWQgYW5kXG4gKiB3aWxsIG5vdCBiZSBjbGVhcmVkIGJ5IHRoZSBsaWJyYXJ5LlxuICpcbiAqIEEga2V5IG11c3QgYmUgc3BlY2lmaWVkIHRvIG1ha2Ugc3VyZSB0aGF0IHRoaXMgbm9kZSBpcyBjb3JyZWN0bHkgcHJlc2VydmVkXG4gKiBhY3Jvc3MgYWxsIGNvbmRpdGlvbmFscy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LlxuICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICogQHBhcmFtIHsuLi4qfSB2YXJfYXJncyBBdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGUgZHluYW1pYyBhdHRyaWJ1dGVzXG4gKiAgICAgZm9yIHRoZSBFbGVtZW50LlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbmV4cG9ydHMuZWxlbWVudFBsYWNlaG9sZGVyID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzLCB2YXJfYXJncykge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydFBsYWNlaG9sZGVyS2V5U3BlY2lmaWVkKGtleSk7XG4gIH1cblxuICBleHBvcnRzLmVsZW1lbnRPcGVuLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gIGV4cG9ydHMuc2tpcCgpO1xuICByZXR1cm4gZXhwb3J0cy5lbGVtZW50Q2xvc2UuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbn07XG5cbi8qKlxuICogRGVjbGFyZXMgYSB2aXJ0dWFsIFRleHQgYXQgdGhpcyBwb2ludCBpbiB0aGUgZG9jdW1lbnQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfGJvb2xlYW59IHZhbHVlIFRoZSB2YWx1ZSBvZiB0aGUgVGV4dC5cbiAqIEBwYXJhbSB7Li4uKGZ1bmN0aW9uKChzdHJpbmd8bnVtYmVyfGJvb2xlYW4pKTpzdHJpbmcpfSB2YXJfYXJnc1xuICogICAgIEZ1bmN0aW9ucyB0byBmb3JtYXQgdGhlIHZhbHVlIHdoaWNoIGFyZSBjYWxsZWQgb25seSB3aGVuIHRoZSB2YWx1ZSBoYXNcbiAqICAgICBjaGFuZ2VkLlxuICogQHJldHVybiB7IVRleHR9IFRoZSBjb3JyZXNwb25kaW5nIHRleHQgbm9kZS5cbiAqL1xuZXhwb3J0cy50ZXh0ID0gZnVuY3Rpb24gKHZhbHVlLCB2YXJfYXJncykge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydE5vdEluQXR0cmlidXRlcygndGV4dCcpO1xuICAgIGFzc2VydE5vdEluU2tpcCgndGV4dCcpO1xuICB9XG5cbiAgdmFyIG5vZGUgPSBfdGV4dCgpO1xuICB2YXIgZGF0YSA9IGdldERhdGEobm9kZSk7XG5cbiAgaWYgKGRhdGEudGV4dCAhPT0gdmFsdWUpIHtcbiAgICBkYXRhLnRleHQgPSAvKiogQHR5cGUge3N0cmluZ30gKi92YWx1ZTtcblxuICAgIHZhciBmb3JtYXR0ZWQgPSB2YWx1ZTtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgZm9ybWF0dGVkID0gYXJndW1lbnRzW2ldKGZvcm1hdHRlZCk7XG4gICAgfVxuXG4gICAgbm9kZS5kYXRhID0gZm9ybWF0dGVkO1xuICB9XG5cbiAgcmV0dXJuIG5vZGU7XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5jcmVtZW50YWwtZG9tLWNqcy5qcy5tYXAiLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kaXN0L2NsaWVudCcpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKlxuICAgIChoYXBpKW5lcyBXZWJTb2NrZXQgQ2xpZW50IChodHRwczovL2dpdGh1Yi5jb20vaGFwaWpzL25lcylcbiAgICBDb3B5cmlnaHQgKGMpIDIwMTUsIEVyYW4gSGFtbWVyIDxlcmFuQGhhbW1lci5pbz4gYW5kIG90aGVyIGNvbnRyaWJ1dG9yc1xuICAgIEJTRCBMaWNlbnNlZFxuKi9cblxudmFyIF90eXBlb2YgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIiA/IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH0gOiBmdW5jdGlvbiAob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07XG5cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXG4gICAgLy8gJGxhYjpjb3ZlcmFnZTpvZmYkXG5cbiAgICBpZiAoKHR5cGVvZiBleHBvcnRzID09PSAndW5kZWZpbmVkJyA/ICd1bmRlZmluZWQnIDogX3R5cGVvZihleHBvcnRzKSkgPT09ICdvYmplY3QnICYmICh0eXBlb2YgbW9kdWxlID09PSAndW5kZWZpbmVkJyA/ICd1bmRlZmluZWQnIDogX3R5cGVvZihtb2R1bGUpKSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7IC8vIEV4cG9ydCBpZiB1c2VkIGFzIGEgbW9kdWxlXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgICAgIGRlZmluZShmYWN0b3J5KTtcbiAgICAgICAgfSBlbHNlIGlmICgodHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnID8gJ3VuZGVmaW5lZCcgOiBfdHlwZW9mKGV4cG9ydHMpKSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGV4cG9ydHMubmVzID0gZmFjdG9yeSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcm9vdC5uZXMgPSBmYWN0b3J5KCk7XG4gICAgICAgIH1cblxuICAgIC8vICRsYWI6Y292ZXJhZ2U6b24kXG59KSh1bmRlZmluZWQsIGZ1bmN0aW9uICgpIHtcblxuICAgIC8vIFV0aWxpdGllc1xuXG4gICAgdmFyIHZlcnNpb24gPSAnMic7XG4gICAgdmFyIGlnbm9yZSA9IGZ1bmN0aW9uIGlnbm9yZSgpIHt9O1xuXG4gICAgdmFyIHBhcnNlID0gZnVuY3Rpb24gcGFyc2UobWVzc2FnZSwgbmV4dCkge1xuXG4gICAgICAgIHZhciBvYmogPSBudWxsO1xuICAgICAgICB2YXIgZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBvYmogPSBKU09OLnBhcnNlKG1lc3NhZ2UpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGVycm9yID0gbmV3IE5lc0Vycm9yKGVyciwgJ3Byb3RvY29sJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV4dChlcnJvciwgb2JqKTtcbiAgICB9O1xuXG4gICAgdmFyIHN0cmluZ2lmeSA9IGZ1bmN0aW9uIHN0cmluZ2lmeShtZXNzYWdlLCBuZXh0KSB7XG5cbiAgICAgICAgdmFyIHN0cmluZyA9IG51bGw7XG4gICAgICAgIHZhciBlcnJvciA9IG51bGw7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN0cmluZyA9IEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGVycm9yID0gbmV3IE5lc0Vycm9yKGVyciwgJ3VzZXInKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXh0KGVycm9yLCBzdHJpbmcpO1xuICAgIH07XG5cbiAgICB2YXIgTmVzRXJyb3IgPSBmdW5jdGlvbiBOZXNFcnJvcihlcnIsIHR5cGUpIHtcblxuICAgICAgICBpZiAodHlwZW9mIGVyciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGVyciA9IG5ldyBFcnJvcihlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgZXJyLnR5cGUgPSB0eXBlO1xuICAgICAgICByZXR1cm4gZXJyO1xuICAgIH07XG5cbiAgICAvLyBFcnJvciBjb2Rlc1xuXG4gICAgdmFyIGVycm9yQ29kZXMgPSB7XG4gICAgICAgIDEwMDA6ICdOb3JtYWwgY2xvc3VyZScsXG4gICAgICAgIDEwMDE6ICdHb2luZyBhd2F5JyxcbiAgICAgICAgMTAwMjogJ1Byb3RvY29sIGVycm9yJyxcbiAgICAgICAgMTAwMzogJ1Vuc3VwcG9ydGVkIGRhdGEnLFxuICAgICAgICAxMDA0OiAnUmVzZXJ2ZWQnLFxuICAgICAgICAxMDA1OiAnTm8gc3RhdHVzIHJlY2VpdmVkJyxcbiAgICAgICAgMTAwNjogJ0Fibm9ybWFsIGNsb3N1cmUnLFxuICAgICAgICAxMDA3OiAnSW52YWxpZCBmcmFtZSBwYXlsb2FkIGRhdGEnLFxuICAgICAgICAxMDA4OiAnUG9saWN5IHZpb2xhdGlvbicsXG4gICAgICAgIDEwMDk6ICdNZXNzYWdlIHRvbyBiaWcnLFxuICAgICAgICAxMDEwOiAnTWFuZGF0b3J5IGV4dGVuc2lvbicsXG4gICAgICAgIDEwMTE6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InLFxuICAgICAgICAxMDE1OiAnVExTIGhhbmRzaGFrZSdcbiAgICB9O1xuXG4gICAgLy8gQ2xpZW50XG5cbiAgICB2YXIgQ2xpZW50ID0gZnVuY3Rpb24gQ2xpZW50KHVybCwgb3B0aW9ucykge1xuXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgIC8vIENvbmZpZ3VyYXRpb25cblxuICAgICAgICB0aGlzLl91cmwgPSB1cmw7XG4gICAgICAgIHRoaXMuX3NldHRpbmdzID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5faGVhcnRiZWF0VGltZW91dCA9IGZhbHNlOyAvLyBTZXJ2ZXIgaGVhcnRiZWF0IGNvbmZpZ3VyYXRpb25cblxuICAgICAgICAvLyBTdGF0ZVxuXG4gICAgICAgIHRoaXMuX3dzID0gbnVsbDtcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5faWRzID0gMDsgLy8gSWQgY291bnRlclxuICAgICAgICB0aGlzLl9yZXF1ZXN0cyA9IHt9OyAvLyBpZCAtPiB7IGNhbGxiYWNrLCB0aW1lb3V0IH1cbiAgICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IHt9OyAvLyBwYXRoIC0+IFtjYWxsYmFja3NdXG4gICAgICAgIHRoaXMuX2hlYXJ0YmVhdCA9IG51bGw7XG5cbiAgICAgICAgLy8gRXZlbnRzXG5cbiAgICAgICAgdGhpcy5vbkVycm9yID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgfTsgLy8gR2VuZXJhbCBlcnJvciBjYWxsYmFjayAob25seSB3aGVuIGFuIGVycm9yIGNhbm5vdCBiZSBhc3NvY2lhdGVkIHdpdGggYSByZXF1ZXN0KVxuICAgICAgICB0aGlzLm9uQ29ubmVjdCA9IGlnbm9yZTsgLy8gQ2FsbGVkIHdoZW5ldmVyIGEgY29ubmVjdGlvbiBpcyBlc3RhYmxpc2hlZFxuICAgICAgICB0aGlzLm9uRGlzY29ubmVjdCA9IGlnbm9yZTsgLy8gQ2FsbGVkIHdoZW5ldmVyIGEgY29ubmVjdGlvbiBpcyBsb3N0OiBmdW5jdGlvbih3aWxsUmVjb25uZWN0KVxuICAgICAgICB0aGlzLm9uVXBkYXRlID0gaWdub3JlO1xuXG4gICAgICAgIC8vIFB1YmxpYyBwcm9wZXJ0aWVzXG5cbiAgICAgICAgdGhpcy5pZCA9IG51bGw7IC8vIEFzc2lnbmVkIHdoZW4gaGVsbG8gcmVzcG9uc2UgaXMgcmVjZWl2ZWRcbiAgICB9O1xuXG4gICAgQ2xpZW50LldlYlNvY2tldCA9IC8qICRsYWI6Y292ZXJhZ2U6b2ZmJCAqL3R5cGVvZiBXZWJTb2NrZXQgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IFdlYlNvY2tldDsgLyogJGxhYjpjb3ZlcmFnZTpvbiQgKi9cblxuICAgIENsaWVudC5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYWxsYmFjaykge1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBhcmd1bWVudHNbMF07XG4gICAgICAgICAgICBvcHRpb25zID0ge307XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy5yZWNvbm5lY3QgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAvLyBEZWZhdWx0cyB0byB0cnVlXG4gICAgICAgICAgICB0aGlzLl9yZWNvbm5lY3Rpb24gPSB7IC8vIE9wdGlvbnM6IHJlY29ubmVjdCwgZGVsYXksIG1heERlbGF5XG4gICAgICAgICAgICAgICAgd2FpdDogMCxcbiAgICAgICAgICAgICAgICBkZWxheTogb3B0aW9ucy5kZWxheSB8fCAxMDAwLCAvLyAxIHNlY29uZFxuICAgICAgICAgICAgICAgIG1heERlbGF5OiBvcHRpb25zLm1heERlbGF5IHx8IDUwMDAsIC8vIDUgc2Vjb25kc1xuICAgICAgICAgICAgICAgIHJldHJpZXM6IG9wdGlvbnMucmV0cmllcyB8fCBJbmZpbml0eSwgLy8gVW5saW1pdGVkXG4gICAgICAgICAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICAgICAgICAgICAgYXV0aDogb3B0aW9ucy5hdXRoLFxuICAgICAgICAgICAgICAgICAgICB0aW1lb3V0OiBvcHRpb25zLnRpbWVvdXRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2Nvbm5lY3Qob3B0aW9ucywgdHJ1ZSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLl9jb25uZWN0ID0gZnVuY3Rpb24gKG9wdGlvbnMsIGluaXRpYWwsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgdmFyIHNlbnRDYWxsYmFjayA9IGZhbHNlO1xuICAgICAgICB2YXIgdGltZW91dEhhbmRsZXIgPSBmdW5jdGlvbiB0aW1lb3V0SGFuZGxlcigpIHtcblxuICAgICAgICAgICAgc2VudENhbGxiYWNrID0gdHJ1ZTtcbiAgICAgICAgICAgIF90aGlzLl93cy5jbG9zZSgpO1xuICAgICAgICAgICAgY2FsbGJhY2sobmV3IE5lc0Vycm9yKCdDb25uZWN0aW9uIHRpbWVkIG91dCcsICd0aW1lb3V0JykpO1xuICAgICAgICAgICAgX3RoaXMuX2NsZWFudXAoKTtcbiAgICAgICAgICAgIGlmIChpbml0aWFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLl9yZWNvbm5lY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgdGltZW91dCA9IG9wdGlvbnMudGltZW91dCA/IHNldFRpbWVvdXQodGltZW91dEhhbmRsZXIsIG9wdGlvbnMudGltZW91dCkgOiBudWxsO1xuXG4gICAgICAgIHZhciB3cyA9IG5ldyBDbGllbnQuV2ViU29ja2V0KHRoaXMuX3VybCwgdGhpcy5fc2V0dGluZ3Mud3MpOyAvLyBTZXR0aW5ncyB1c2VkIGJ5IG5vZGUuanMgb25seVxuICAgICAgICB0aGlzLl93cyA9IHdzO1xuXG4gICAgICAgIHdzLm9ub3BlbiA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXG4gICAgICAgICAgICBpZiAoIXNlbnRDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHNlbnRDYWxsYmFjayA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLl9oZWxsbyhvcHRpb25zLmF1dGgsIGZ1bmN0aW9uIChlcnIpIHtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLnBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgX3RoaXMuX3N1YnNjcmlwdGlvbnNbZXJyLnBhdGhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5kaXNjb25uZWN0KCk7IC8vIFN0b3AgcmVjb25uZWN0aW9uIHdoZW4gdGhlIGhlbGxvIG1lc3NhZ2UgcmV0dXJucyBlcnJvclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5vbkNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgd3Mub25lcnJvciA9IGZ1bmN0aW9uIChldmVudCkge1xuXG4gICAgICAgICAgICB2YXIgZXJyID0gbmV3IE5lc0Vycm9yKCdTb2NrZXQgZXJyb3InLCAnd3MnKTtcblxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXG4gICAgICAgICAgICBpZiAoIXNlbnRDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHNlbnRDYWxsYmFjayA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5vbkVycm9yKGVycik7XG4gICAgICAgIH07XG5cbiAgICAgICAgd3Mub25jbG9zZSA9IGZ1bmN0aW9uIChldmVudCkge1xuXG4gICAgICAgICAgICB2YXIgbG9nID0ge1xuICAgICAgICAgICAgICAgIGNvZGU6IGV2ZW50LmNvZGUsXG4gICAgICAgICAgICAgICAgZXhwbGFuYXRpb246IGVycm9yQ29kZXNbZXZlbnQuY29kZV0gfHwgJ1Vua25vd24nLFxuICAgICAgICAgICAgICAgIHJlYXNvbjogZXZlbnQucmVhc29uLFxuICAgICAgICAgICAgICAgIHdhc0NsZWFuOiBldmVudC53YXNDbGVhblxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgX3RoaXMuX2NsZWFudXAoKTtcbiAgICAgICAgICAgIF90aGlzLm9uRGlzY29ubmVjdCghIShfdGhpcy5fcmVjb25uZWN0aW9uICYmIF90aGlzLl9yZWNvbm5lY3Rpb24ucmV0cmllcyA+PSAxKSwgbG9nKTtcbiAgICAgICAgICAgIF90aGlzLl9yZWNvbm5lY3QoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB3cy5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuXG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuX29uTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5kaXNjb25uZWN0ID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHRoaXMuX3JlY29ubmVjdGlvbiA9IG51bGw7XG5cbiAgICAgICAgaWYgKCF0aGlzLl93cykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX3dzLnJlYWR5U3RhdGUgPT09IENsaWVudC5XZWJTb2NrZXQuT1BFTiB8fCB0aGlzLl93cy5yZWFkeVN0YXRlID09PSBDbGllbnQuV2ViU29ja2V0LkNPTk5FQ1RJTkcpIHtcblxuICAgICAgICAgICAgdGhpcy5fd3MuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLl9jbGVhbnVwID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHZhciB3cyA9IHRoaXMuX3dzO1xuICAgICAgICBpZiAoIXdzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl93cyA9IG51bGw7XG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB3cy5vbm9wZW4gPSBudWxsO1xuICAgICAgICB3cy5vbmNsb3NlID0gbnVsbDtcbiAgICAgICAgd3Mub25lcnJvciA9IGlnbm9yZTtcbiAgICAgICAgd3Mub25tZXNzYWdlID0gbnVsbDtcblxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5faGVhcnRiZWF0KTtcblxuICAgICAgICAvLyBGbHVzaCBwZW5kaW5nIHJlcXVlc3RzXG5cbiAgICAgICAgdmFyIGVycm9yID0gbmV3IE5lc0Vycm9yKCdSZXF1ZXN0IGZhaWxlZCAtIHNlcnZlciBkaXNjb25uZWN0ZWQnLCAnZGlzY29ubmVjdCcpO1xuXG4gICAgICAgIHZhciBpZHMgPSBPYmplY3Qua2V5cyh0aGlzLl9yZXF1ZXN0cyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaWRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgaWQgPSBpZHNbaV07XG4gICAgICAgICAgICB2YXIgcmVxdWVzdCA9IHRoaXMuX3JlcXVlc3RzW2lkXTtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IHJlcXVlc3QuY2FsbGJhY2s7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQocmVxdWVzdC50aW1lb3V0KTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9yZXF1ZXN0c1tpZF07XG4gICAgICAgICAgICBjYWxsYmFjayhlcnJvcik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5fcmVjb25uZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgICAvLyBSZWNvbm5lY3RcblxuICAgICAgICBpZiAodGhpcy5fcmVjb25uZWN0aW9uKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fcmVjb25uZWN0aW9uLnJldHJpZXMgPCAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7IC8vIENsZWFyIF9yZWNvbm5lY3Rpb24gc3RhdGVcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC0tdGhpcy5fcmVjb25uZWN0aW9uLnJldHJpZXM7XG4gICAgICAgICAgICB0aGlzLl9yZWNvbm5lY3Rpb24ud2FpdCA9IHRoaXMuX3JlY29ubmVjdGlvbi53YWl0ICsgdGhpcy5fcmVjb25uZWN0aW9uLmRlbGF5O1xuXG4gICAgICAgICAgICB2YXIgdGltZW91dCA9IE1hdGgubWluKHRoaXMuX3JlY29ubmVjdGlvbi53YWl0LCB0aGlzLl9yZWNvbm5lY3Rpb24ubWF4RGVsYXkpO1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoIV90aGlzMi5fcmVjb25uZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBfdGhpczIuX2Nvbm5lY3QoX3RoaXMyLl9yZWNvbm5lY3Rpb24uc2V0dGluZ3MsIGZhbHNlLCBmdW5jdGlvbiAoZXJyKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMyLm9uRXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzMi5fY2xlYW51cCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzMi5fcmVjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIHRpbWVvdXQpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUucmVxdWVzdCA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYWxsYmFjaykge1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICBwYXRoOiBvcHRpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XG4gICAgICAgICAgICB0eXBlOiAncmVxdWVzdCcsXG4gICAgICAgICAgICBtZXRob2Q6IG9wdGlvbnMubWV0aG9kIHx8ICdHRVQnLFxuICAgICAgICAgICAgcGF0aDogb3B0aW9ucy5wYXRoLFxuICAgICAgICAgICAgaGVhZGVyczogb3B0aW9ucy5oZWFkZXJzLFxuICAgICAgICAgICAgcGF5bG9hZDogb3B0aW9ucy5wYXlsb2FkXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbmQocmVxdWVzdCwgdHJ1ZSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLm1lc3NhZ2UgPSBmdW5jdGlvbiAobWVzc2FnZSwgY2FsbGJhY2spIHtcblxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcbiAgICAgICAgICAgIHR5cGU6ICdtZXNzYWdlJyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fc2VuZChyZXF1ZXN0LCB0cnVlLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUuX3NlbmQgPSBmdW5jdGlvbiAocmVxdWVzdCwgdHJhY2ssIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBfdGhpczMgPSB0aGlzO1xuXG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgaWdub3JlO1xuXG4gICAgICAgIGlmICghdGhpcy5fd3MgfHwgdGhpcy5fd3MucmVhZHlTdGF0ZSAhPT0gQ2xpZW50LldlYlNvY2tldC5PUEVOKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgTmVzRXJyb3IoJ0ZhaWxlZCB0byBzZW5kIG1lc3NhZ2UgLSBzZXJ2ZXIgZGlzY29ubmVjdGVkJywgJ2Rpc2Nvbm5lY3QnKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXF1ZXN0LmlkID0gKyt0aGlzLl9pZHM7XG5cbiAgICAgICAgc3RyaW5naWZ5KHJlcXVlc3QsIGZ1bmN0aW9uIChlcnIsIGVuY29kZWQpIHtcblxuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJZ25vcmUgZXJyb3JzXG5cbiAgICAgICAgICAgIGlmICghdHJhY2spIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMzLl93cy5zZW5kKGVuY29kZWQpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IE5lc0Vycm9yKGVyciwgJ3dzJykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVHJhY2sgZXJyb3JzXG5cbiAgICAgICAgICAgIHZhciByZWNvcmQgPSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrLFxuICAgICAgICAgICAgICAgIHRpbWVvdXQ6IG51bGxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChfdGhpczMuX3NldHRpbmdzLnRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICByZWNvcmQudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAgICAgICAgIHJlY29yZC5jYWxsYmFjayA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHJlY29yZC50aW1lb3V0ID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IE5lc0Vycm9yKCdSZXF1ZXN0IHRpbWVkIG91dCcsICd0aW1lb3V0JykpO1xuICAgICAgICAgICAgICAgIH0sIF90aGlzMy5fc2V0dGluZ3MudGltZW91dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIF90aGlzMy5fcmVxdWVzdHNbcmVxdWVzdC5pZF0gPSByZWNvcmQ7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgX3RoaXMzLl93cy5zZW5kKGVuY29kZWQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzMy5fcmVxdWVzdHNbcmVxdWVzdC5pZF0udGltZW91dCk7XG4gICAgICAgICAgICAgICAgZGVsZXRlIF90aGlzMy5fcmVxdWVzdHNbcmVxdWVzdC5pZF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBOZXNFcnJvcihlcnIsICd3cycpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUuX2hlbGxvID0gZnVuY3Rpb24gKGF1dGgsIGNhbGxiYWNrKSB7XG5cbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XG4gICAgICAgICAgICB0eXBlOiAnaGVsbG8nLFxuICAgICAgICAgICAgdmVyc2lvbjogdmVyc2lvblxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChhdXRoKSB7XG4gICAgICAgICAgICByZXF1ZXN0LmF1dGggPSBhdXRoO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN1YnMgPSB0aGlzLnN1YnNjcmlwdGlvbnMoKTtcbiAgICAgICAgaWYgKHN1YnMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXF1ZXN0LnN1YnMgPSBzdWJzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbmQocmVxdWVzdCwgdHJ1ZSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLnN1YnNjcmlwdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuX3N1YnNjcmlwdGlvbnMpO1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uIChwYXRoLCBoYW5kbGVyLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgX3RoaXM0ID0gdGhpcztcblxuICAgICAgICBpZiAoIXBhdGggfHwgcGF0aFswXSAhPT0gJy8nKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgTmVzRXJyb3IoJ0ludmFsaWQgcGF0aCcsICd1c2VyJykpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN1YnMgPSB0aGlzLl9zdWJzY3JpcHRpb25zW3BhdGhdO1xuICAgICAgICBpZiAoc3Vicykge1xuXG4gICAgICAgICAgICAvLyBBbHJlYWR5IHN1YnNjcmliZWRcblxuICAgICAgICAgICAgaWYgKHN1YnMuaW5kZXhPZihoYW5kbGVyKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBzdWJzLnB1c2goaGFuZGxlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc3Vic2NyaXB0aW9uc1twYXRoXSA9IFtoYW5kbGVyXTtcblxuICAgICAgICBpZiAoIXRoaXMuX3dzIHx8IHRoaXMuX3dzLnJlYWR5U3RhdGUgIT09IENsaWVudC5XZWJTb2NrZXQuT1BFTikge1xuXG4gICAgICAgICAgICAvLyBRdWV1ZWQgc3Vic2NyaXB0aW9uXG5cbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XG4gICAgICAgICAgICB0eXBlOiAnc3ViJyxcbiAgICAgICAgICAgIHBhdGg6IHBhdGhcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fc2VuZChyZXF1ZXN0LCB0cnVlLCBmdW5jdGlvbiAoZXJyKSB7XG5cbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgX3RoaXM0Ll9zdWJzY3JpcHRpb25zW3BhdGhdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiAocGF0aCwgaGFuZGxlcikge1xuXG4gICAgICAgIGlmICghcGF0aCB8fCBwYXRoWzBdICE9PSAnLycpIHtcblxuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIobmV3IE5lc0Vycm9yKCdJbnZhbGlkIHBhdGgnLCAndXNlcicpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdWJzID0gdGhpcy5fc3Vic2NyaXB0aW9uc1twYXRoXTtcbiAgICAgICAgaWYgKCFzdWJzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3luYyA9IGZhbHNlO1xuICAgICAgICBpZiAoIWhhbmRsZXIpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9zdWJzY3JpcHRpb25zW3BhdGhdO1xuICAgICAgICAgICAgc3luYyA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgcG9zID0gc3Vicy5pbmRleE9mKGhhbmRsZXIpO1xuICAgICAgICAgICAgaWYgKHBvcyA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN1YnMuc3BsaWNlKHBvcywgMSk7XG4gICAgICAgICAgICBpZiAoIXN1YnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3N1YnNjcmlwdGlvbnNbcGF0aF07XG4gICAgICAgICAgICAgICAgc3luYyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXN5bmMgfHwgIXRoaXMuX3dzIHx8IHRoaXMuX3dzLnJlYWR5U3RhdGUgIT09IENsaWVudC5XZWJTb2NrZXQuT1BFTikge1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcbiAgICAgICAgICAgIHR5cGU6ICd1bnN1YicsXG4gICAgICAgICAgICBwYXRoOiBwYXRoXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbmQocmVxdWVzdCwgZmFsc2UpOyAvLyBJZ25vcmluZyBlcnJvcnMgYXMgdGhlIHN1YnNjcmlwdGlvbiBoYW5kbGVycyBhcmUgYWxyZWFkeSByZW1vdmVkXG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUuX29uTWVzc2FnZSA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgIHZhciBfdGhpczUgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuX2JlYXQoKTtcblxuICAgICAgICBwYXJzZShtZXNzYWdlLmRhdGEsIGZ1bmN0aW9uIChlcnIsIHVwZGF0ZSkge1xuXG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzNS5vbkVycm9yKGVycik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFJlY3JlYXRlIGVycm9yXG5cbiAgICAgICAgICAgIHZhciBlcnJvciA9IG51bGw7XG4gICAgICAgICAgICBpZiAodXBkYXRlLnN0YXR1c0NvZGUgJiYgdXBkYXRlLnN0YXR1c0NvZGUgPj0gNDAwICYmIHVwZGF0ZS5zdGF0dXNDb2RlIDw9IDU5OSkge1xuXG4gICAgICAgICAgICAgICAgZXJyb3IgPSBuZXcgTmVzRXJyb3IodXBkYXRlLnBheWxvYWQubWVzc2FnZSB8fCB1cGRhdGUucGF5bG9hZC5lcnJvciwgJ3NlcnZlcicpO1xuICAgICAgICAgICAgICAgIGVycm9yLnN0YXR1c0NvZGUgPSB1cGRhdGUuc3RhdHVzQ29kZTtcbiAgICAgICAgICAgICAgICBlcnJvci5kYXRhID0gdXBkYXRlLnBheWxvYWQ7XG4gICAgICAgICAgICAgICAgZXJyb3IuaGVhZGVycyA9IHVwZGF0ZS5oZWFkZXJzO1xuICAgICAgICAgICAgICAgIGVycm9yLnBhdGggPSB1cGRhdGUucGF0aDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gUGluZ1xuXG4gICAgICAgICAgICBpZiAodXBkYXRlLnR5cGUgPT09ICdwaW5nJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdGhpczUuX3NlbmQoeyB0eXBlOiAncGluZycgfSwgZmFsc2UpOyAvLyBJZ25vcmUgZXJyb3JzXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEJyb2FkY2FzdCBhbmQgdXBkYXRlXG5cbiAgICAgICAgICAgIGlmICh1cGRhdGUudHlwZSA9PT0gJ3VwZGF0ZScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXM1Lm9uVXBkYXRlKHVwZGF0ZS5tZXNzYWdlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gUHVibGlzaFxuXG4gICAgICAgICAgICBpZiAodXBkYXRlLnR5cGUgPT09ICdwdWInKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhhbmRsZXJzID0gX3RoaXM1Ll9zdWJzY3JpcHRpb25zW3VwZGF0ZS5wYXRoXTtcbiAgICAgICAgICAgICAgICBpZiAoaGFuZGxlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoYW5kbGVycy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlcnNbaV0odXBkYXRlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBMb29rdXAgY2FsbGJhY2sgKG1lc3NhZ2UgbXVzdCBpbmNsdWRlIGFuIGlkIGZyb20gdGhpcyBwb2ludClcblxuICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSBfdGhpczUuX3JlcXVlc3RzW3VwZGF0ZS5pZF07XG4gICAgICAgICAgICBpZiAoIXJlcXVlc3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXM1Lm9uRXJyb3IobmV3IE5lc0Vycm9yKCdSZWNlaXZlZCByZXNwb25zZSBmb3IgdW5rbm93biByZXF1ZXN0JywgJ3Byb3RvY29sJykpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSByZXF1ZXN0LmNhbGxiYWNrO1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHJlcXVlc3QudGltZW91dCk7XG4gICAgICAgICAgICBkZWxldGUgX3RoaXM1Ll9yZXF1ZXN0c1t1cGRhdGUuaWRdO1xuXG4gICAgICAgICAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuOyAvLyBSZXNwb25zZSByZWNlaXZlZCBhZnRlciB0aW1lb3V0XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFJlc3BvbnNlXG5cbiAgICAgICAgICAgIGlmICh1cGRhdGUudHlwZSA9PT0gJ3JlcXVlc3QnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yLCB1cGRhdGUucGF5bG9hZCwgdXBkYXRlLnN0YXR1c0NvZGUsIHVwZGF0ZS5oZWFkZXJzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ3VzdG9tIG1lc3NhZ2VcblxuICAgICAgICAgICAgaWYgKHVwZGF0ZS50eXBlID09PSAnbWVzc2FnZScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyb3IsIHVwZGF0ZS5tZXNzYWdlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQXV0aGVudGljYXRpb25cblxuICAgICAgICAgICAgaWYgKHVwZGF0ZS50eXBlID09PSAnaGVsbG8nKSB7XG4gICAgICAgICAgICAgICAgX3RoaXM1LmlkID0gdXBkYXRlLnNvY2tldDtcbiAgICAgICAgICAgICAgICBpZiAodXBkYXRlLmhlYXJ0YmVhdCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpczUuX2hlYXJ0YmVhdFRpbWVvdXQgPSB1cGRhdGUuaGVhcnRiZWF0LmludGVydmFsICsgdXBkYXRlLmhlYXJ0YmVhdC50aW1lb3V0O1xuICAgICAgICAgICAgICAgICAgICBfdGhpczUuX2JlYXQoKTsgLy8gQ2FsbCBhZ2FpbiBvbmNlIHRpbWVvdXQgaXMgc2V0XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU3Vic2NyaXB0aW9uc1xuXG4gICAgICAgICAgICBpZiAodXBkYXRlLnR5cGUgPT09ICdzdWInKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIF90aGlzNS5vbkVycm9yKG5ldyBOZXNFcnJvcignUmVjZWl2ZWQgdW5rbm93biByZXNwb25zZSB0eXBlOiAnICsgdXBkYXRlLnR5cGUsICdwcm90b2NvbCcpKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUuX2JlYXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpczYgPSB0aGlzO1xuXG4gICAgICAgIGlmICghdGhpcy5faGVhcnRiZWF0VGltZW91dCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2hlYXJ0YmVhdCk7XG5cbiAgICAgICAgdGhpcy5faGVhcnRiZWF0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIF90aGlzNi5vbkVycm9yKG5ldyBOZXNFcnJvcignRGlzY29ubmVjdGluZyBkdWUgdG8gaGVhcnRiZWF0IHRpbWVvdXQnLCAndGltZW91dCcpKTtcbiAgICAgICAgICAgIF90aGlzNi5fd3MuY2xvc2UoKTtcbiAgICAgICAgfSwgdGhpcy5faGVhcnRiZWF0VGltZW91dCk7XG4gICAgfTtcblxuICAgIC8vIEV4cG9zZSBpbnRlcmZhY2VcblxuICAgIHJldHVybiB7IENsaWVudDogQ2xpZW50IH07XG59KTtcbiIsIiAgLyogZ2xvYmFscyByZXF1aXJlLCBtb2R1bGUgKi9cblxuICAndXNlIHN0cmljdCc7XG5cbiAgLyoqXG4gICAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gICAqL1xuXG4gIHZhciBwYXRodG9SZWdleHAgPSByZXF1aXJlKCdwYXRoLXRvLXJlZ2V4cCcpO1xuXG4gIC8qKlxuICAgKiBNb2R1bGUgZXhwb3J0cy5cbiAgICovXG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBwYWdlO1xuXG4gIC8qKlxuICAgKiBEZXRlY3QgY2xpY2sgZXZlbnRcbiAgICovXG4gIHZhciBjbGlja0V2ZW50ID0gKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgZG9jdW1lbnQpICYmIGRvY3VtZW50Lm9udG91Y2hzdGFydCA/ICd0b3VjaHN0YXJ0JyA6ICdjbGljayc7XG5cbiAgLyoqXG4gICAqIFRvIHdvcmsgcHJvcGVybHkgd2l0aCB0aGUgVVJMXG4gICAqIGhpc3RvcnkubG9jYXRpb24gZ2VuZXJhdGVkIHBvbHlmaWxsIGluIGh0dHBzOi8vZ2l0aHViLmNvbS9kZXZvdGUvSFRNTDUtSGlzdG9yeS1BUElcbiAgICovXG5cbiAgdmFyIGxvY2F0aW9uID0gKCd1bmRlZmluZWQnICE9PSB0eXBlb2Ygd2luZG93KSAmJiAod2luZG93Lmhpc3RvcnkubG9jYXRpb24gfHwgd2luZG93LmxvY2F0aW9uKTtcblxuICAvKipcbiAgICogUGVyZm9ybSBpbml0aWFsIGRpc3BhdGNoLlxuICAgKi9cblxuICB2YXIgZGlzcGF0Y2ggPSB0cnVlO1xuXG5cbiAgLyoqXG4gICAqIERlY29kZSBVUkwgY29tcG9uZW50cyAocXVlcnkgc3RyaW5nLCBwYXRobmFtZSwgaGFzaCkuXG4gICAqIEFjY29tbW9kYXRlcyBib3RoIHJlZ3VsYXIgcGVyY2VudCBlbmNvZGluZyBhbmQgeC13d3ctZm9ybS11cmxlbmNvZGVkIGZvcm1hdC5cbiAgICovXG4gIHZhciBkZWNvZGVVUkxDb21wb25lbnRzID0gdHJ1ZTtcblxuICAvKipcbiAgICogQmFzZSBwYXRoLlxuICAgKi9cblxuICB2YXIgYmFzZSA9ICcnO1xuXG4gIC8qKlxuICAgKiBSdW5uaW5nIGZsYWcuXG4gICAqL1xuXG4gIHZhciBydW5uaW5nO1xuXG4gIC8qKlxuICAgKiBIYXNoQmFuZyBvcHRpb25cbiAgICovXG5cbiAgdmFyIGhhc2hiYW5nID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFByZXZpb3VzIGNvbnRleHQsIGZvciBjYXB0dXJpbmdcbiAgICogcGFnZSBleGl0IGV2ZW50cy5cbiAgICovXG5cbiAgdmFyIHByZXZDb250ZXh0O1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBgcGF0aGAgd2l0aCBjYWxsYmFjayBgZm4oKWAsXG4gICAqIG9yIHJvdXRlIGBwYXRoYCwgb3IgcmVkaXJlY3Rpb24sXG4gICAqIG9yIGBwYWdlLnN0YXJ0KClgLlxuICAgKlxuICAgKiAgIHBhZ2UoZm4pO1xuICAgKiAgIHBhZ2UoJyonLCBmbik7XG4gICAqICAgcGFnZSgnL3VzZXIvOmlkJywgbG9hZCwgdXNlcik7XG4gICAqICAgcGFnZSgnL3VzZXIvJyArIHVzZXIuaWQsIHsgc29tZTogJ3RoaW5nJyB9KTtcbiAgICogICBwYWdlKCcvdXNlci8nICsgdXNlci5pZCk7XG4gICAqICAgcGFnZSgnL2Zyb20nLCAnL3RvJylcbiAgICogICBwYWdlKCk7XG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfEZ1bmN0aW9ufSBwYXRoXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuLi4uXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHBhZ2UocGF0aCwgZm4pIHtcbiAgICAvLyA8Y2FsbGJhY2s+XG4gICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBwYXRoKSB7XG4gICAgICByZXR1cm4gcGFnZSgnKicsIHBhdGgpO1xuICAgIH1cblxuICAgIC8vIHJvdXRlIDxwYXRoPiB0byA8Y2FsbGJhY2sgLi4uPlxuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZm4pIHtcbiAgICAgIHZhciByb3V0ZSA9IG5ldyBSb3V0ZShwYXRoKTtcbiAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHBhZ2UuY2FsbGJhY2tzLnB1c2gocm91dGUubWlkZGxld2FyZShhcmd1bWVudHNbaV0pKTtcbiAgICAgIH1cbiAgICAgIC8vIHNob3cgPHBhdGg+IHdpdGggW3N0YXRlXVxuICAgIH0gZWxzZSBpZiAoJ3N0cmluZycgPT09IHR5cGVvZiBwYXRoKSB7XG4gICAgICBwYWdlWydzdHJpbmcnID09PSB0eXBlb2YgZm4gPyAncmVkaXJlY3QnIDogJ3Nob3cnXShwYXRoLCBmbik7XG4gICAgICAvLyBzdGFydCBbb3B0aW9uc11cbiAgICB9IGVsc2Uge1xuICAgICAgcGFnZS5zdGFydChwYXRoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGJhY2sgZnVuY3Rpb25zLlxuICAgKi9cblxuICBwYWdlLmNhbGxiYWNrcyA9IFtdO1xuICBwYWdlLmV4aXRzID0gW107XG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgcGF0aCBiZWluZyBwcm9jZXNzZWRcbiAgICogQHR5cGUge1N0cmluZ31cbiAgICovXG4gIHBhZ2UuY3VycmVudCA9ICcnO1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgcGFnZXMgbmF2aWdhdGVkIHRvLlxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKlxuICAgKiAgICAgcGFnZS5sZW4gPT0gMDtcbiAgICogICAgIHBhZ2UoJy9sb2dpbicpO1xuICAgKiAgICAgcGFnZS5sZW4gPT0gMTtcbiAgICovXG5cbiAgcGFnZS5sZW4gPSAwO1xuXG4gIC8qKlxuICAgKiBHZXQgb3Igc2V0IGJhc2VwYXRoIHRvIGBwYXRoYC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgcGFnZS5iYXNlID0gZnVuY3Rpb24ocGF0aCkge1xuICAgIGlmICgwID09PSBhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gYmFzZTtcbiAgICBiYXNlID0gcGF0aDtcbiAgfTtcblxuICAvKipcbiAgICogQmluZCB3aXRoIHRoZSBnaXZlbiBgb3B0aW9uc2AuXG4gICAqXG4gICAqIE9wdGlvbnM6XG4gICAqXG4gICAqICAgIC0gYGNsaWNrYCBiaW5kIHRvIGNsaWNrIGV2ZW50cyBbdHJ1ZV1cbiAgICogICAgLSBgcG9wc3RhdGVgIGJpbmQgdG8gcG9wc3RhdGUgW3RydWVdXG4gICAqICAgIC0gYGRpc3BhdGNoYCBwZXJmb3JtIGluaXRpYWwgZGlzcGF0Y2ggW3RydWVdXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIHBhZ2Uuc3RhcnQgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgaWYgKHJ1bm5pbmcpIHJldHVybjtcbiAgICBydW5uaW5nID0gdHJ1ZTtcbiAgICBpZiAoZmFsc2UgPT09IG9wdGlvbnMuZGlzcGF0Y2gpIGRpc3BhdGNoID0gZmFsc2U7XG4gICAgaWYgKGZhbHNlID09PSBvcHRpb25zLmRlY29kZVVSTENvbXBvbmVudHMpIGRlY29kZVVSTENvbXBvbmVudHMgPSBmYWxzZTtcbiAgICBpZiAoZmFsc2UgIT09IG9wdGlvbnMucG9wc3RhdGUpIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIG9ucG9wc3RhdGUsIGZhbHNlKTtcbiAgICBpZiAoZmFsc2UgIT09IG9wdGlvbnMuY2xpY2spIHtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoY2xpY2tFdmVudCwgb25jbGljaywgZmFsc2UpO1xuICAgIH1cbiAgICBpZiAodHJ1ZSA9PT0gb3B0aW9ucy5oYXNoYmFuZykgaGFzaGJhbmcgPSB0cnVlO1xuICAgIGlmICghZGlzcGF0Y2gpIHJldHVybjtcbiAgICB2YXIgdXJsID0gKGhhc2hiYW5nICYmIH5sb2NhdGlvbi5oYXNoLmluZGV4T2YoJyMhJykpID8gbG9jYXRpb24uaGFzaC5zdWJzdHIoMikgKyBsb2NhdGlvbi5zZWFyY2ggOiBsb2NhdGlvbi5wYXRobmFtZSArIGxvY2F0aW9uLnNlYXJjaCArIGxvY2F0aW9uLmhhc2g7XG4gICAgcGFnZS5yZXBsYWNlKHVybCwgbnVsbCwgdHJ1ZSwgZGlzcGF0Y2gpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBVbmJpbmQgY2xpY2sgYW5kIHBvcHN0YXRlIGV2ZW50IGhhbmRsZXJzLlxuICAgKlxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBwYWdlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXJ1bm5pbmcpIHJldHVybjtcbiAgICBwYWdlLmN1cnJlbnQgPSAnJztcbiAgICBwYWdlLmxlbiA9IDA7XG4gICAgcnVubmluZyA9IGZhbHNlO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoY2xpY2tFdmVudCwgb25jbGljaywgZmFsc2UpO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIG9ucG9wc3RhdGUsIGZhbHNlKTtcbiAgfTtcblxuICAvKipcbiAgICogU2hvdyBgcGF0aGAgd2l0aCBvcHRpb25hbCBgc3RhdGVgIG9iamVjdC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IHN0YXRlXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gZGlzcGF0Y2hcbiAgICogQHJldHVybiB7Q29udGV4dH1cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgcGFnZS5zaG93ID0gZnVuY3Rpb24ocGF0aCwgc3RhdGUsIGRpc3BhdGNoLCBwdXNoKSB7XG4gICAgdmFyIGN0eCA9IG5ldyBDb250ZXh0KHBhdGgsIHN0YXRlKTtcbiAgICBwYWdlLmN1cnJlbnQgPSBjdHgucGF0aDtcbiAgICBpZiAoZmFsc2UgIT09IGRpc3BhdGNoKSBwYWdlLmRpc3BhdGNoKGN0eCk7XG4gICAgaWYgKGZhbHNlICE9PSBjdHguaGFuZGxlZCAmJiBmYWxzZSAhPT0gcHVzaCkgY3R4LnB1c2hTdGF0ZSgpO1xuICAgIHJldHVybiBjdHg7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdvZXMgYmFjayBpbiB0aGUgaGlzdG9yeVxuICAgKiBCYWNrIHNob3VsZCBhbHdheXMgbGV0IHRoZSBjdXJyZW50IHJvdXRlIHB1c2ggc3RhdGUgYW5kIHRoZW4gZ28gYmFjay5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggLSBmYWxsYmFjayBwYXRoIHRvIGdvIGJhY2sgaWYgbm8gbW9yZSBoaXN0b3J5IGV4aXN0cywgaWYgdW5kZWZpbmVkIGRlZmF1bHRzIHRvIHBhZ2UuYmFzZVxuICAgKiBAcGFyYW0ge09iamVjdH0gW3N0YXRlXVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBwYWdlLmJhY2sgPSBmdW5jdGlvbihwYXRoLCBzdGF0ZSkge1xuICAgIGlmIChwYWdlLmxlbiA+IDApIHtcbiAgICAgIC8vIHRoaXMgbWF5IG5lZWQgbW9yZSB0ZXN0aW5nIHRvIHNlZSBpZiBhbGwgYnJvd3NlcnNcbiAgICAgIC8vIHdhaXQgZm9yIHRoZSBuZXh0IHRpY2sgdG8gZ28gYmFjayBpbiBoaXN0b3J5XG4gICAgICBoaXN0b3J5LmJhY2soKTtcbiAgICAgIHBhZ2UubGVuLS07XG4gICAgfSBlbHNlIGlmIChwYXRoKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBwYWdlLnNob3cocGF0aCwgc3RhdGUpO1xuICAgICAgfSk7XG4gICAgfWVsc2V7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBwYWdlLnNob3coYmFzZSwgc3RhdGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIHJvdXRlIHRvIHJlZGlyZWN0IGZyb20gb25lIHBhdGggdG8gb3RoZXJcbiAgICogb3IganVzdCByZWRpcmVjdCB0byBhbm90aGVyIHJvdXRlXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBmcm9tIC0gaWYgcGFyYW0gJ3RvJyBpcyB1bmRlZmluZWQgcmVkaXJlY3RzIHRvICdmcm9tJ1xuICAgKiBAcGFyYW0ge1N0cmluZ30gW3RvXVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cbiAgcGFnZS5yZWRpcmVjdCA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gICAgLy8gRGVmaW5lIHJvdXRlIGZyb20gYSBwYXRoIHRvIGFub3RoZXJcbiAgICBpZiAoJ3N0cmluZycgPT09IHR5cGVvZiBmcm9tICYmICdzdHJpbmcnID09PSB0eXBlb2YgdG8pIHtcbiAgICAgIHBhZ2UoZnJvbSwgZnVuY3Rpb24oZSkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHBhZ2UucmVwbGFjZSh0byk7XG4gICAgICAgIH0sIDApO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gV2FpdCBmb3IgdGhlIHB1c2ggc3RhdGUgYW5kIHJlcGxhY2UgaXQgd2l0aCBhbm90aGVyXG4gICAgaWYgKCdzdHJpbmcnID09PSB0eXBlb2YgZnJvbSAmJiAndW5kZWZpbmVkJyA9PT0gdHlwZW9mIHRvKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBwYWdlLnJlcGxhY2UoZnJvbSk7XG4gICAgICB9LCAwKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlcGxhY2UgYHBhdGhgIHdpdGggb3B0aW9uYWwgYHN0YXRlYCBvYmplY3QuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzdGF0ZVxuICAgKiBAcmV0dXJuIHtDb250ZXh0fVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuXG4gIHBhZ2UucmVwbGFjZSA9IGZ1bmN0aW9uKHBhdGgsIHN0YXRlLCBpbml0LCBkaXNwYXRjaCkge1xuICAgIHZhciBjdHggPSBuZXcgQ29udGV4dChwYXRoLCBzdGF0ZSk7XG4gICAgcGFnZS5jdXJyZW50ID0gY3R4LnBhdGg7XG4gICAgY3R4LmluaXQgPSBpbml0O1xuICAgIGN0eC5zYXZlKCk7IC8vIHNhdmUgYmVmb3JlIGRpc3BhdGNoaW5nLCB3aGljaCBtYXkgcmVkaXJlY3RcbiAgICBpZiAoZmFsc2UgIT09IGRpc3BhdGNoKSBwYWdlLmRpc3BhdGNoKGN0eCk7XG4gICAgcmV0dXJuIGN0eDtcbiAgfTtcblxuICAvKipcbiAgICogRGlzcGF0Y2ggdGhlIGdpdmVuIGBjdHhgLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gY3R4XG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBwYWdlLmRpc3BhdGNoID0gZnVuY3Rpb24oY3R4KSB7XG4gICAgdmFyIHByZXYgPSBwcmV2Q29udGV4dCxcbiAgICAgIGkgPSAwLFxuICAgICAgaiA9IDA7XG5cbiAgICBwcmV2Q29udGV4dCA9IGN0eDtcblxuICAgIGZ1bmN0aW9uIG5leHRFeGl0KCkge1xuICAgICAgdmFyIGZuID0gcGFnZS5leGl0c1tqKytdO1xuICAgICAgaWYgKCFmbikgcmV0dXJuIG5leHRFbnRlcigpO1xuICAgICAgZm4ocHJldiwgbmV4dEV4aXQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5leHRFbnRlcigpIHtcbiAgICAgIHZhciBmbiA9IHBhZ2UuY2FsbGJhY2tzW2krK107XG5cbiAgICAgIGlmIChjdHgucGF0aCAhPT0gcGFnZS5jdXJyZW50KSB7XG4gICAgICAgIGN0eC5oYW5kbGVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICghZm4pIHJldHVybiB1bmhhbmRsZWQoY3R4KTtcbiAgICAgIGZuKGN0eCwgbmV4dEVudGVyKTtcbiAgICB9XG5cbiAgICBpZiAocHJldikge1xuICAgICAgbmV4dEV4aXQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV4dEVudGVyKCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBVbmhhbmRsZWQgYGN0eGAuIFdoZW4gaXQncyBub3QgdGhlIGluaXRpYWxcbiAgICogcG9wc3RhdGUgdGhlbiByZWRpcmVjdC4gSWYgeW91IHdpc2ggdG8gaGFuZGxlXG4gICAqIDQwNHMgb24geW91ciBvd24gdXNlIGBwYWdlKCcqJywgY2FsbGJhY2spYC5cbiAgICpcbiAgICogQHBhcmFtIHtDb250ZXh0fSBjdHhcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHVuaGFuZGxlZChjdHgpIHtcbiAgICBpZiAoY3R4LmhhbmRsZWQpIHJldHVybjtcbiAgICB2YXIgY3VycmVudDtcblxuICAgIGlmIChoYXNoYmFuZykge1xuICAgICAgY3VycmVudCA9IGJhc2UgKyBsb2NhdGlvbi5oYXNoLnJlcGxhY2UoJyMhJywgJycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjdXJyZW50ID0gbG9jYXRpb24ucGF0aG5hbWUgKyBsb2NhdGlvbi5zZWFyY2g7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnQgPT09IGN0eC5jYW5vbmljYWxQYXRoKSByZXR1cm47XG4gICAgcGFnZS5zdG9wKCk7XG4gICAgY3R4LmhhbmRsZWQgPSBmYWxzZTtcbiAgICBsb2NhdGlvbi5ocmVmID0gY3R4LmNhbm9uaWNhbFBhdGg7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYW4gZXhpdCByb3V0ZSBvbiBgcGF0aGAgd2l0aFxuICAgKiBjYWxsYmFjayBgZm4oKWAsIHdoaWNoIHdpbGwgYmUgY2FsbGVkXG4gICAqIG9uIHRoZSBwcmV2aW91cyBjb250ZXh0IHdoZW4gYSBuZXdcbiAgICogcGFnZSBpcyB2aXNpdGVkLlxuICAgKi9cbiAgcGFnZS5leGl0ID0gZnVuY3Rpb24ocGF0aCwgZm4pIHtcbiAgICBpZiAodHlwZW9mIHBhdGggPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBwYWdlLmV4aXQoJyonLCBwYXRoKTtcbiAgICB9XG5cbiAgICB2YXIgcm91dGUgPSBuZXcgUm91dGUocGF0aCk7XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHBhZ2UuZXhpdHMucHVzaChyb3V0ZS5taWRkbGV3YXJlKGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogUmVtb3ZlIFVSTCBlbmNvZGluZyBmcm9tIHRoZSBnaXZlbiBgc3RyYC5cbiAgICogQWNjb21tb2RhdGVzIHdoaXRlc3BhY2UgaW4gYm90aCB4LXd3dy1mb3JtLXVybGVuY29kZWRcbiAgICogYW5kIHJlZ3VsYXIgcGVyY2VudC1lbmNvZGVkIGZvcm0uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyfSBVUkwgY29tcG9uZW50IHRvIGRlY29kZVxuICAgKi9cbiAgZnVuY3Rpb24gZGVjb2RlVVJMRW5jb2RlZFVSSUNvbXBvbmVudCh2YWwpIHtcbiAgICBpZiAodHlwZW9mIHZhbCAhPT0gJ3N0cmluZycpIHsgcmV0dXJuIHZhbDsgfVxuICAgIHJldHVybiBkZWNvZGVVUkxDb21wb25lbnRzID8gZGVjb2RlVVJJQ29tcG9uZW50KHZhbC5yZXBsYWNlKC9cXCsvZywgJyAnKSkgOiB2YWw7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBhIG5ldyBcInJlcXVlc3RcIiBgQ29udGV4dGBcbiAgICogd2l0aCB0aGUgZ2l2ZW4gYHBhdGhgIGFuZCBvcHRpb25hbCBpbml0aWFsIGBzdGF0ZWAuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzdGF0ZVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBmdW5jdGlvbiBDb250ZXh0KHBhdGgsIHN0YXRlKSB7XG4gICAgaWYgKCcvJyA9PT0gcGF0aFswXSAmJiAwICE9PSBwYXRoLmluZGV4T2YoYmFzZSkpIHBhdGggPSBiYXNlICsgKGhhc2hiYW5nID8gJyMhJyA6ICcnKSArIHBhdGg7XG4gICAgdmFyIGkgPSBwYXRoLmluZGV4T2YoJz8nKTtcblxuICAgIHRoaXMuY2Fub25pY2FsUGF0aCA9IHBhdGg7XG4gICAgdGhpcy5wYXRoID0gcGF0aC5yZXBsYWNlKGJhc2UsICcnKSB8fCAnLyc7XG4gICAgaWYgKGhhc2hiYW5nKSB0aGlzLnBhdGggPSB0aGlzLnBhdGgucmVwbGFjZSgnIyEnLCAnJykgfHwgJy8nO1xuXG4gICAgdGhpcy50aXRsZSA9IGRvY3VtZW50LnRpdGxlO1xuICAgIHRoaXMuc3RhdGUgPSBzdGF0ZSB8fCB7fTtcbiAgICB0aGlzLnN0YXRlLnBhdGggPSBwYXRoO1xuICAgIHRoaXMucXVlcnlzdHJpbmcgPSB+aSA/IGRlY29kZVVSTEVuY29kZWRVUklDb21wb25lbnQocGF0aC5zbGljZShpICsgMSkpIDogJyc7XG4gICAgdGhpcy5wYXRobmFtZSA9IGRlY29kZVVSTEVuY29kZWRVUklDb21wb25lbnQofmkgPyBwYXRoLnNsaWNlKDAsIGkpIDogcGF0aCk7XG4gICAgdGhpcy5wYXJhbXMgPSB7fTtcblxuICAgIC8vIGZyYWdtZW50XG4gICAgdGhpcy5oYXNoID0gJyc7XG4gICAgaWYgKCFoYXNoYmFuZykge1xuICAgICAgaWYgKCF+dGhpcy5wYXRoLmluZGV4T2YoJyMnKSkgcmV0dXJuO1xuICAgICAgdmFyIHBhcnRzID0gdGhpcy5wYXRoLnNwbGl0KCcjJyk7XG4gICAgICB0aGlzLnBhdGggPSBwYXJ0c1swXTtcbiAgICAgIHRoaXMuaGFzaCA9IGRlY29kZVVSTEVuY29kZWRVUklDb21wb25lbnQocGFydHNbMV0pIHx8ICcnO1xuICAgICAgdGhpcy5xdWVyeXN0cmluZyA9IHRoaXMucXVlcnlzdHJpbmcuc3BsaXQoJyMnKVswXTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXhwb3NlIGBDb250ZXh0YC5cbiAgICovXG5cbiAgcGFnZS5Db250ZXh0ID0gQ29udGV4dDtcblxuICAvKipcbiAgICogUHVzaCBzdGF0ZS5cbiAgICpcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIENvbnRleHQucHJvdG90eXBlLnB1c2hTdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHBhZ2UubGVuKys7XG4gICAgaGlzdG9yeS5wdXNoU3RhdGUodGhpcy5zdGF0ZSwgdGhpcy50aXRsZSwgaGFzaGJhbmcgJiYgdGhpcy5wYXRoICE9PSAnLycgPyAnIyEnICsgdGhpcy5wYXRoIDogdGhpcy5jYW5vbmljYWxQYXRoKTtcbiAgfTtcblxuICAvKipcbiAgICogU2F2ZSB0aGUgY29udGV4dCBzdGF0ZS5cbiAgICpcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgQ29udGV4dC5wcm90b3R5cGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGhpc3RvcnkucmVwbGFjZVN0YXRlKHRoaXMuc3RhdGUsIHRoaXMudGl0bGUsIGhhc2hiYW5nICYmIHRoaXMucGF0aCAhPT0gJy8nID8gJyMhJyArIHRoaXMucGF0aCA6IHRoaXMuY2Fub25pY2FsUGF0aCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgYFJvdXRlYCB3aXRoIHRoZSBnaXZlbiBIVFRQIGBwYXRoYCxcbiAgICogYW5kIGFuIGFycmF5IG9mIGBjYWxsYmFja3NgIGFuZCBgb3B0aW9uc2AuXG4gICAqXG4gICAqIE9wdGlvbnM6XG4gICAqXG4gICAqICAgLSBgc2Vuc2l0aXZlYCAgICBlbmFibGUgY2FzZS1zZW5zaXRpdmUgcm91dGVzXG4gICAqICAgLSBgc3RyaWN0YCAgICAgICBlbmFibGUgc3RyaWN0IG1hdGNoaW5nIGZvciB0cmFpbGluZyBzbGFzaGVzXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLlxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgZnVuY3Rpb24gUm91dGUocGF0aCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMucGF0aCA9IChwYXRoID09PSAnKicpID8gJyguKiknIDogcGF0aDtcbiAgICB0aGlzLm1ldGhvZCA9ICdHRVQnO1xuICAgIHRoaXMucmVnZXhwID0gcGF0aHRvUmVnZXhwKHRoaXMucGF0aCxcbiAgICAgIHRoaXMua2V5cyA9IFtdLFxuICAgICAgb3B0aW9ucy5zZW5zaXRpdmUsXG4gICAgICBvcHRpb25zLnN0cmljdCk7XG4gIH1cblxuICAvKipcbiAgICogRXhwb3NlIGBSb3V0ZWAuXG4gICAqL1xuXG4gIHBhZ2UuUm91dGUgPSBSb3V0ZTtcblxuICAvKipcbiAgICogUmV0dXJuIHJvdXRlIG1pZGRsZXdhcmUgd2l0aFxuICAgKiB0aGUgZ2l2ZW4gY2FsbGJhY2sgYGZuKClgLlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgUm91dGUucHJvdG90eXBlLm1pZGRsZXdhcmUgPSBmdW5jdGlvbihmbikge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICByZXR1cm4gZnVuY3Rpb24oY3R4LCBuZXh0KSB7XG4gICAgICBpZiAoc2VsZi5tYXRjaChjdHgucGF0aCwgY3R4LnBhcmFtcykpIHJldHVybiBmbihjdHgsIG5leHQpO1xuICAgICAgbmV4dCgpO1xuICAgIH07XG4gIH07XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRoaXMgcm91dGUgbWF0Y2hlcyBgcGF0aGAsIGlmIHNvXG4gICAqIHBvcHVsYXRlIGBwYXJhbXNgLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBSb3V0ZS5wcm90b3R5cGUubWF0Y2ggPSBmdW5jdGlvbihwYXRoLCBwYXJhbXMpIHtcbiAgICB2YXIga2V5cyA9IHRoaXMua2V5cyxcbiAgICAgIHFzSW5kZXggPSBwYXRoLmluZGV4T2YoJz8nKSxcbiAgICAgIHBhdGhuYW1lID0gfnFzSW5kZXggPyBwYXRoLnNsaWNlKDAsIHFzSW5kZXgpIDogcGF0aCxcbiAgICAgIG0gPSB0aGlzLnJlZ2V4cC5leGVjKGRlY29kZVVSSUNvbXBvbmVudChwYXRobmFtZSkpO1xuXG4gICAgaWYgKCFtKSByZXR1cm4gZmFsc2U7XG5cbiAgICBmb3IgKHZhciBpID0gMSwgbGVuID0gbS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgdmFyIGtleSA9IGtleXNbaSAtIDFdO1xuICAgICAgdmFyIHZhbCA9IGRlY29kZVVSTEVuY29kZWRVUklDb21wb25lbnQobVtpXSk7XG4gICAgICBpZiAodmFsICE9PSB1bmRlZmluZWQgfHwgIShoYXNPd25Qcm9wZXJ0eS5jYWxsKHBhcmFtcywga2V5Lm5hbWUpKSkge1xuICAgICAgICBwYXJhbXNba2V5Lm5hbWVdID0gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIEhhbmRsZSBcInBvcHVsYXRlXCIgZXZlbnRzLlxuICAgKi9cblxuICB2YXIgb25wb3BzdGF0ZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxvYWRlZCA9IGZhbHNlO1xuICAgIGlmICgndW5kZWZpbmVkJyA9PT0gdHlwZW9mIHdpbmRvdykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuICAgICAgbG9hZGVkID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBsb2FkZWQgPSB0cnVlO1xuICAgICAgICB9LCAwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gb25wb3BzdGF0ZShlKSB7XG4gICAgICBpZiAoIWxvYWRlZCkgcmV0dXJuO1xuICAgICAgaWYgKGUuc3RhdGUpIHtcbiAgICAgICAgdmFyIHBhdGggPSBlLnN0YXRlLnBhdGg7XG4gICAgICAgIHBhZ2UucmVwbGFjZShwYXRoLCBlLnN0YXRlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhZ2Uuc2hvdyhsb2NhdGlvbi5wYXRobmFtZSArIGxvY2F0aW9uLmhhc2gsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfTtcbiAgfSkoKTtcbiAgLyoqXG4gICAqIEhhbmRsZSBcImNsaWNrXCIgZXZlbnRzLlxuICAgKi9cblxuICBmdW5jdGlvbiBvbmNsaWNrKGUpIHtcblxuICAgIGlmICgxICE9PSB3aGljaChlKSkgcmV0dXJuO1xuXG4gICAgaWYgKGUubWV0YUtleSB8fCBlLmN0cmxLZXkgfHwgZS5zaGlmdEtleSkgcmV0dXJuO1xuICAgIGlmIChlLmRlZmF1bHRQcmV2ZW50ZWQpIHJldHVybjtcblxuXG5cbiAgICAvLyBlbnN1cmUgbGlua1xuICAgIHZhciBlbCA9IGUudGFyZ2V0O1xuICAgIHdoaWxlIChlbCAmJiAnQScgIT09IGVsLm5vZGVOYW1lKSBlbCA9IGVsLnBhcmVudE5vZGU7XG4gICAgaWYgKCFlbCB8fCAnQScgIT09IGVsLm5vZGVOYW1lKSByZXR1cm47XG5cblxuXG4gICAgLy8gSWdub3JlIGlmIHRhZyBoYXNcbiAgICAvLyAxLiBcImRvd25sb2FkXCIgYXR0cmlidXRlXG4gICAgLy8gMi4gcmVsPVwiZXh0ZXJuYWxcIiBhdHRyaWJ1dGVcbiAgICBpZiAoZWwuaGFzQXR0cmlidXRlKCdkb3dubG9hZCcpIHx8IGVsLmdldEF0dHJpYnV0ZSgncmVsJykgPT09ICdleHRlcm5hbCcpIHJldHVybjtcblxuICAgIC8vIGVuc3VyZSBub24taGFzaCBmb3IgdGhlIHNhbWUgcGF0aFxuICAgIHZhciBsaW5rID0gZWwuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG4gICAgaWYgKCFoYXNoYmFuZyAmJiBlbC5wYXRobmFtZSA9PT0gbG9jYXRpb24ucGF0aG5hbWUgJiYgKGVsLmhhc2ggfHwgJyMnID09PSBsaW5rKSkgcmV0dXJuO1xuXG5cblxuICAgIC8vIENoZWNrIGZvciBtYWlsdG86IGluIHRoZSBocmVmXG4gICAgaWYgKGxpbmsgJiYgbGluay5pbmRleE9mKCdtYWlsdG86JykgPiAtMSkgcmV0dXJuO1xuXG4gICAgLy8gY2hlY2sgdGFyZ2V0XG4gICAgaWYgKGVsLnRhcmdldCkgcmV0dXJuO1xuXG4gICAgLy8geC1vcmlnaW5cbiAgICBpZiAoIXNhbWVPcmlnaW4oZWwuaHJlZikpIHJldHVybjtcblxuXG5cbiAgICAvLyByZWJ1aWxkIHBhdGhcbiAgICB2YXIgcGF0aCA9IGVsLnBhdGhuYW1lICsgZWwuc2VhcmNoICsgKGVsLmhhc2ggfHwgJycpO1xuXG4gICAgLy8gc3RyaXAgbGVhZGluZyBcIi9bZHJpdmUgbGV0dGVyXTpcIiBvbiBOVy5qcyBvbiBXaW5kb3dzXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiBwYXRoLm1hdGNoKC9eXFwvW2EtekEtWl06XFwvLykpIHtcbiAgICAgIHBhdGggPSBwYXRoLnJlcGxhY2UoL15cXC9bYS16QS1aXTpcXC8vLCAnLycpO1xuICAgIH1cblxuICAgIC8vIHNhbWUgcGFnZVxuICAgIHZhciBvcmlnID0gcGF0aDtcblxuICAgIGlmIChwYXRoLmluZGV4T2YoYmFzZSkgPT09IDApIHtcbiAgICAgIHBhdGggPSBwYXRoLnN1YnN0cihiYXNlLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgaWYgKGhhc2hiYW5nKSBwYXRoID0gcGF0aC5yZXBsYWNlKCcjIScsICcnKTtcblxuICAgIGlmIChiYXNlICYmIG9yaWcgPT09IHBhdGgpIHJldHVybjtcblxuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBwYWdlLnNob3cob3JpZyk7XG4gIH1cblxuICAvKipcbiAgICogRXZlbnQgYnV0dG9uLlxuICAgKi9cblxuICBmdW5jdGlvbiB3aGljaChlKSB7XG4gICAgZSA9IGUgfHwgd2luZG93LmV2ZW50O1xuICAgIHJldHVybiBudWxsID09PSBlLndoaWNoID8gZS5idXR0b24gOiBlLndoaWNoO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGBocmVmYCBpcyB0aGUgc2FtZSBvcmlnaW4uXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHNhbWVPcmlnaW4oaHJlZikge1xuICAgIHZhciBvcmlnaW4gPSBsb2NhdGlvbi5wcm90b2NvbCArICcvLycgKyBsb2NhdGlvbi5ob3N0bmFtZTtcbiAgICBpZiAobG9jYXRpb24ucG9ydCkgb3JpZ2luICs9ICc6JyArIGxvY2F0aW9uLnBvcnQ7XG4gICAgcmV0dXJuIChocmVmICYmICgwID09PSBocmVmLmluZGV4T2Yob3JpZ2luKSkpO1xuICB9XG5cbiAgcGFnZS5zYW1lT3JpZ2luID0gc2FtZU9yaWdpbjtcbiIsInZhciBpc2FycmF5ID0gcmVxdWlyZSgnaXNhcnJheScpXG5cbi8qKlxuICogRXhwb3NlIGBwYXRoVG9SZWdleHBgLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHBhdGhUb1JlZ2V4cFxubW9kdWxlLmV4cG9ydHMucGFyc2UgPSBwYXJzZVxubW9kdWxlLmV4cG9ydHMuY29tcGlsZSA9IGNvbXBpbGVcbm1vZHVsZS5leHBvcnRzLnRva2Vuc1RvRnVuY3Rpb24gPSB0b2tlbnNUb0Z1bmN0aW9uXG5tb2R1bGUuZXhwb3J0cy50b2tlbnNUb1JlZ0V4cCA9IHRva2Vuc1RvUmVnRXhwXG5cbi8qKlxuICogVGhlIG1haW4gcGF0aCBtYXRjaGluZyByZWdleHAgdXRpbGl0eS5cbiAqXG4gKiBAdHlwZSB7UmVnRXhwfVxuICovXG52YXIgUEFUSF9SRUdFWFAgPSBuZXcgUmVnRXhwKFtcbiAgLy8gTWF0Y2ggZXNjYXBlZCBjaGFyYWN0ZXJzIHRoYXQgd291bGQgb3RoZXJ3aXNlIGFwcGVhciBpbiBmdXR1cmUgbWF0Y2hlcy5cbiAgLy8gVGhpcyBhbGxvd3MgdGhlIHVzZXIgdG8gZXNjYXBlIHNwZWNpYWwgY2hhcmFjdGVycyB0aGF0IHdvbid0IHRyYW5zZm9ybS5cbiAgJyhcXFxcXFxcXC4pJyxcbiAgLy8gTWF0Y2ggRXhwcmVzcy1zdHlsZSBwYXJhbWV0ZXJzIGFuZCB1bi1uYW1lZCBwYXJhbWV0ZXJzIHdpdGggYSBwcmVmaXhcbiAgLy8gYW5kIG9wdGlvbmFsIHN1ZmZpeGVzLiBNYXRjaGVzIGFwcGVhciBhczpcbiAgLy9cbiAgLy8gXCIvOnRlc3QoXFxcXGQrKT9cIiA9PiBbXCIvXCIsIFwidGVzdFwiLCBcIlxcZCtcIiwgdW5kZWZpbmVkLCBcIj9cIiwgdW5kZWZpbmVkXVxuICAvLyBcIi9yb3V0ZShcXFxcZCspXCIgID0+IFt1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBcIlxcZCtcIiwgdW5kZWZpbmVkLCB1bmRlZmluZWRdXG4gIC8vIFwiLypcIiAgICAgICAgICAgID0+IFtcIi9cIiwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBcIipcIl1cbiAgJyhbXFxcXC8uXSk/KD86KD86XFxcXDooXFxcXHcrKSg/OlxcXFwoKCg/OlxcXFxcXFxcLnxbXigpXSkrKVxcXFwpKT98XFxcXCgoKD86XFxcXFxcXFwufFteKCldKSspXFxcXCkpKFsrKj9dKT98KFxcXFwqKSknXG5dLmpvaW4oJ3wnKSwgJ2cnKVxuXG4vKipcbiAqIFBhcnNlIGEgc3RyaW5nIGZvciB0aGUgcmF3IHRva2Vucy5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7QXJyYXl9XG4gKi9cbmZ1bmN0aW9uIHBhcnNlIChzdHIpIHtcbiAgdmFyIHRva2VucyA9IFtdXG4gIHZhciBrZXkgPSAwXG4gIHZhciBpbmRleCA9IDBcbiAgdmFyIHBhdGggPSAnJ1xuICB2YXIgcmVzXG5cbiAgd2hpbGUgKChyZXMgPSBQQVRIX1JFR0VYUC5leGVjKHN0cikpICE9IG51bGwpIHtcbiAgICB2YXIgbSA9IHJlc1swXVxuICAgIHZhciBlc2NhcGVkID0gcmVzWzFdXG4gICAgdmFyIG9mZnNldCA9IHJlcy5pbmRleFxuICAgIHBhdGggKz0gc3RyLnNsaWNlKGluZGV4LCBvZmZzZXQpXG4gICAgaW5kZXggPSBvZmZzZXQgKyBtLmxlbmd0aFxuXG4gICAgLy8gSWdub3JlIGFscmVhZHkgZXNjYXBlZCBzZXF1ZW5jZXMuXG4gICAgaWYgKGVzY2FwZWQpIHtcbiAgICAgIHBhdGggKz0gZXNjYXBlZFsxXVxuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICAvLyBQdXNoIHRoZSBjdXJyZW50IHBhdGggb250byB0aGUgdG9rZW5zLlxuICAgIGlmIChwYXRoKSB7XG4gICAgICB0b2tlbnMucHVzaChwYXRoKVxuICAgICAgcGF0aCA9ICcnXG4gICAgfVxuXG4gICAgdmFyIHByZWZpeCA9IHJlc1syXVxuICAgIHZhciBuYW1lID0gcmVzWzNdXG4gICAgdmFyIGNhcHR1cmUgPSByZXNbNF1cbiAgICB2YXIgZ3JvdXAgPSByZXNbNV1cbiAgICB2YXIgc3VmZml4ID0gcmVzWzZdXG4gICAgdmFyIGFzdGVyaXNrID0gcmVzWzddXG5cbiAgICB2YXIgcmVwZWF0ID0gc3VmZml4ID09PSAnKycgfHwgc3VmZml4ID09PSAnKidcbiAgICB2YXIgb3B0aW9uYWwgPSBzdWZmaXggPT09ICc/JyB8fCBzdWZmaXggPT09ICcqJ1xuICAgIHZhciBkZWxpbWl0ZXIgPSBwcmVmaXggfHwgJy8nXG4gICAgdmFyIHBhdHRlcm4gPSBjYXB0dXJlIHx8IGdyb3VwIHx8IChhc3RlcmlzayA/ICcuKicgOiAnW14nICsgZGVsaW1pdGVyICsgJ10rPycpXG5cbiAgICB0b2tlbnMucHVzaCh7XG4gICAgICBuYW1lOiBuYW1lIHx8IGtleSsrLFxuICAgICAgcHJlZml4OiBwcmVmaXggfHwgJycsXG4gICAgICBkZWxpbWl0ZXI6IGRlbGltaXRlcixcbiAgICAgIG9wdGlvbmFsOiBvcHRpb25hbCxcbiAgICAgIHJlcGVhdDogcmVwZWF0LFxuICAgICAgcGF0dGVybjogZXNjYXBlR3JvdXAocGF0dGVybilcbiAgICB9KVxuICB9XG5cbiAgLy8gTWF0Y2ggYW55IGNoYXJhY3RlcnMgc3RpbGwgcmVtYWluaW5nLlxuICBpZiAoaW5kZXggPCBzdHIubGVuZ3RoKSB7XG4gICAgcGF0aCArPSBzdHIuc3Vic3RyKGluZGV4KVxuICB9XG5cbiAgLy8gSWYgdGhlIHBhdGggZXhpc3RzLCBwdXNoIGl0IG9udG8gdGhlIGVuZC5cbiAgaWYgKHBhdGgpIHtcbiAgICB0b2tlbnMucHVzaChwYXRoKVxuICB9XG5cbiAgcmV0dXJuIHRva2Vuc1xufVxuXG4vKipcbiAqIENvbXBpbGUgYSBzdHJpbmcgdG8gYSB0ZW1wbGF0ZSBmdW5jdGlvbiBmb3IgdGhlIHBhdGguXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSAgIHN0clxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGUgKHN0cikge1xuICByZXR1cm4gdG9rZW5zVG9GdW5jdGlvbihwYXJzZShzdHIpKVxufVxuXG4vKipcbiAqIEV4cG9zZSBhIG1ldGhvZCBmb3IgdHJhbnNmb3JtaW5nIHRva2VucyBpbnRvIHRoZSBwYXRoIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiB0b2tlbnNUb0Z1bmN0aW9uICh0b2tlbnMpIHtcbiAgLy8gQ29tcGlsZSBhbGwgdGhlIHRva2VucyBpbnRvIHJlZ2V4cHMuXG4gIHZhciBtYXRjaGVzID0gbmV3IEFycmF5KHRva2Vucy5sZW5ndGgpXG5cbiAgLy8gQ29tcGlsZSBhbGwgdGhlIHBhdHRlcm5zIGJlZm9yZSBjb21waWxhdGlvbi5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodHlwZW9mIHRva2Vuc1tpXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIG1hdGNoZXNbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRva2Vuc1tpXS5wYXR0ZXJuICsgJyQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHBhdGggPSAnJ1xuICAgIHZhciBkYXRhID0gb2JqIHx8IHt9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHRva2VuID0gdG9rZW5zW2ldXG5cbiAgICAgIGlmICh0eXBlb2YgdG9rZW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHBhdGggKz0gdG9rZW5cblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICB2YXIgdmFsdWUgPSBkYXRhW3Rva2VuLm5hbWVdXG4gICAgICB2YXIgc2VnbWVudFxuXG4gICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICBpZiAodG9rZW4ub3B0aW9uYWwpIHtcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gYmUgZGVmaW5lZCcpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGlzYXJyYXkodmFsdWUpKSB7XG4gICAgICAgIGlmICghdG9rZW4ucmVwZWF0KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBub3QgcmVwZWF0LCBidXQgcmVjZWl2ZWQgXCInICsgdmFsdWUgKyAnXCInKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGlmICh0b2tlbi5vcHRpb25hbCkge1xuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBub3QgYmUgZW1wdHknKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsdWUubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBzZWdtZW50ID0gZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlW2pdKVxuXG4gICAgICAgICAgaWYgKCFtYXRjaGVzW2ldLnRlc3Qoc2VnbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIGFsbCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG1hdGNoIFwiJyArIHRva2VuLnBhdHRlcm4gKyAnXCIsIGJ1dCByZWNlaXZlZCBcIicgKyBzZWdtZW50ICsgJ1wiJylcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwYXRoICs9IChqID09PSAwID8gdG9rZW4ucHJlZml4IDogdG9rZW4uZGVsaW1pdGVyKSArIHNlZ21lbnRcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIHNlZ21lbnQgPSBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpXG5cbiAgICAgIGlmICghbWF0Y2hlc1tpXS50ZXN0KHNlZ21lbnQpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gbWF0Y2ggXCInICsgdG9rZW4ucGF0dGVybiArICdcIiwgYnV0IHJlY2VpdmVkIFwiJyArIHNlZ21lbnQgKyAnXCInKVxuICAgICAgfVxuXG4gICAgICBwYXRoICs9IHRva2VuLnByZWZpeCArIHNlZ21lbnRcbiAgICB9XG5cbiAgICByZXR1cm4gcGF0aFxuICB9XG59XG5cbi8qKlxuICogRXNjYXBlIGEgcmVndWxhciBleHByZXNzaW9uIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBlc2NhcGVTdHJpbmcgKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbLisqPz1eIToke30oKVtcXF18XFwvXSkvZywgJ1xcXFwkMScpXG59XG5cbi8qKlxuICogRXNjYXBlIHRoZSBjYXB0dXJpbmcgZ3JvdXAgYnkgZXNjYXBpbmcgc3BlY2lhbCBjaGFyYWN0ZXJzIGFuZCBtZWFuaW5nLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gZ3JvdXBcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZXNjYXBlR3JvdXAgKGdyb3VwKSB7XG4gIHJldHVybiBncm91cC5yZXBsYWNlKC8oWz0hOiRcXC8oKV0pL2csICdcXFxcJDEnKVxufVxuXG4vKipcbiAqIEF0dGFjaCB0aGUga2V5cyBhcyBhIHByb3BlcnR5IG9mIHRoZSByZWdleHAuXG4gKlxuICogQHBhcmFtICB7UmVnRXhwfSByZVxuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIGF0dGFjaEtleXMgKHJlLCBrZXlzKSB7XG4gIHJlLmtleXMgPSBrZXlzXG4gIHJldHVybiByZVxufVxuXG4vKipcbiAqIEdldCB0aGUgZmxhZ3MgZm9yIGEgcmVnZXhwIGZyb20gdGhlIG9wdGlvbnMuXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZsYWdzIChvcHRpb25zKSB7XG4gIHJldHVybiBvcHRpb25zLnNlbnNpdGl2ZSA/ICcnIDogJ2knXG59XG5cbi8qKlxuICogUHVsbCBvdXQga2V5cyBmcm9tIGEgcmVnZXhwLlxuICpcbiAqIEBwYXJhbSAge1JlZ0V4cH0gcGF0aFxuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIHJlZ2V4cFRvUmVnZXhwIChwYXRoLCBrZXlzKSB7XG4gIC8vIFVzZSBhIG5lZ2F0aXZlIGxvb2thaGVhZCB0byBtYXRjaCBvbmx5IGNhcHR1cmluZyBncm91cHMuXG4gIHZhciBncm91cHMgPSBwYXRoLnNvdXJjZS5tYXRjaCgvXFwoKD8hXFw/KS9nKVxuXG4gIGlmIChncm91cHMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdyb3Vwcy5sZW5ndGg7IGkrKykge1xuICAgICAga2V5cy5wdXNoKHtcbiAgICAgICAgbmFtZTogaSxcbiAgICAgICAgcHJlZml4OiBudWxsLFxuICAgICAgICBkZWxpbWl0ZXI6IG51bGwsXG4gICAgICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICAgICAgcmVwZWF0OiBmYWxzZSxcbiAgICAgICAgcGF0dGVybjogbnVsbFxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXR0YWNoS2V5cyhwYXRoLCBrZXlzKVxufVxuXG4vKipcbiAqIFRyYW5zZm9ybSBhbiBhcnJheSBpbnRvIGEgcmVnZXhwLlxuICpcbiAqIEBwYXJhbSAge0FycmF5fSAgcGF0aFxuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gYXJyYXlUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICB2YXIgcGFydHMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgIHBhcnRzLnB1c2gocGF0aFRvUmVnZXhwKHBhdGhbaV0sIGtleXMsIG9wdGlvbnMpLnNvdXJjZSlcbiAgfVxuXG4gIHZhciByZWdleHAgPSBuZXcgUmVnRXhwKCcoPzonICsgcGFydHMuam9pbignfCcpICsgJyknLCBmbGFncyhvcHRpb25zKSlcblxuICByZXR1cm4gYXR0YWNoS2V5cyhyZWdleHAsIGtleXMpXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgcGF0aCByZWdleHAgZnJvbSBzdHJpbmcgaW5wdXQuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gIGtleXNcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7UmVnRXhwfVxuICovXG5mdW5jdGlvbiBzdHJpbmdUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICB2YXIgdG9rZW5zID0gcGFyc2UocGF0aClcbiAgdmFyIHJlID0gdG9rZW5zVG9SZWdFeHAodG9rZW5zLCBvcHRpb25zKVxuXG4gIC8vIEF0dGFjaCBrZXlzIGJhY2sgdG8gdGhlIHJlZ2V4cC5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodHlwZW9mIHRva2Vuc1tpXSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGtleXMucHVzaCh0b2tlbnNbaV0pXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dGFjaEtleXMocmUsIGtleXMpXG59XG5cbi8qKlxuICogRXhwb3NlIGEgZnVuY3Rpb24gZm9yIHRha2luZyB0b2tlbnMgYW5kIHJldHVybmluZyBhIFJlZ0V4cC5cbiAqXG4gKiBAcGFyYW0gIHtBcnJheX0gIHRva2Vuc1xuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gdG9rZW5zVG9SZWdFeHAgKHRva2Vucywgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuXG4gIHZhciBzdHJpY3QgPSBvcHRpb25zLnN0cmljdFxuICB2YXIgZW5kID0gb3B0aW9ucy5lbmQgIT09IGZhbHNlXG4gIHZhciByb3V0ZSA9ICcnXG4gIHZhciBsYXN0VG9rZW4gPSB0b2tlbnNbdG9rZW5zLmxlbmd0aCAtIDFdXG4gIHZhciBlbmRzV2l0aFNsYXNoID0gdHlwZW9mIGxhc3RUb2tlbiA9PT0gJ3N0cmluZycgJiYgL1xcLyQvLnRlc3QobGFzdFRva2VuKVxuXG4gIC8vIEl0ZXJhdGUgb3ZlciB0aGUgdG9rZW5zIGFuZCBjcmVhdGUgb3VyIHJlZ2V4cCBzdHJpbmcuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHRva2VuID0gdG9rZW5zW2ldXG5cbiAgICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgICAgcm91dGUgKz0gZXNjYXBlU3RyaW5nKHRva2VuKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgcHJlZml4ID0gZXNjYXBlU3RyaW5nKHRva2VuLnByZWZpeClcbiAgICAgIHZhciBjYXB0dXJlID0gdG9rZW4ucGF0dGVyblxuXG4gICAgICBpZiAodG9rZW4ucmVwZWF0KSB7XG4gICAgICAgIGNhcHR1cmUgKz0gJyg/OicgKyBwcmVmaXggKyBjYXB0dXJlICsgJykqJ1xuICAgICAgfVxuXG4gICAgICBpZiAodG9rZW4ub3B0aW9uYWwpIHtcbiAgICAgICAgaWYgKHByZWZpeCkge1xuICAgICAgICAgIGNhcHR1cmUgPSAnKD86JyArIHByZWZpeCArICcoJyArIGNhcHR1cmUgKyAnKSk/J1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhcHR1cmUgPSAnKCcgKyBjYXB0dXJlICsgJyk/J1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYXB0dXJlID0gcHJlZml4ICsgJygnICsgY2FwdHVyZSArICcpJ1xuICAgICAgfVxuXG4gICAgICByb3V0ZSArPSBjYXB0dXJlXG4gICAgfVxuICB9XG5cbiAgLy8gSW4gbm9uLXN0cmljdCBtb2RlIHdlIGFsbG93IGEgc2xhc2ggYXQgdGhlIGVuZCBvZiBtYXRjaC4gSWYgdGhlIHBhdGggdG9cbiAgLy8gbWF0Y2ggYWxyZWFkeSBlbmRzIHdpdGggYSBzbGFzaCwgd2UgcmVtb3ZlIGl0IGZvciBjb25zaXN0ZW5jeS4gVGhlIHNsYXNoXG4gIC8vIGlzIHZhbGlkIGF0IHRoZSBlbmQgb2YgYSBwYXRoIG1hdGNoLCBub3QgaW4gdGhlIG1pZGRsZS4gVGhpcyBpcyBpbXBvcnRhbnRcbiAgLy8gaW4gbm9uLWVuZGluZyBtb2RlLCB3aGVyZSBcIi90ZXN0L1wiIHNob3VsZG4ndCBtYXRjaCBcIi90ZXN0Ly9yb3V0ZVwiLlxuICBpZiAoIXN0cmljdCkge1xuICAgIHJvdXRlID0gKGVuZHNXaXRoU2xhc2ggPyByb3V0ZS5zbGljZSgwLCAtMikgOiByb3V0ZSkgKyAnKD86XFxcXC8oPz0kKSk/J1xuICB9XG5cbiAgaWYgKGVuZCkge1xuICAgIHJvdXRlICs9ICckJ1xuICB9IGVsc2Uge1xuICAgIC8vIEluIG5vbi1lbmRpbmcgbW9kZSwgd2UgbmVlZCB0aGUgY2FwdHVyaW5nIGdyb3VwcyB0byBtYXRjaCBhcyBtdWNoIGFzXG4gICAgLy8gcG9zc2libGUgYnkgdXNpbmcgYSBwb3NpdGl2ZSBsb29rYWhlYWQgdG8gdGhlIGVuZCBvciBuZXh0IHBhdGggc2VnbWVudC5cbiAgICByb3V0ZSArPSBzdHJpY3QgJiYgZW5kc1dpdGhTbGFzaCA/ICcnIDogJyg/PVxcXFwvfCQpJ1xuICB9XG5cbiAgcmV0dXJuIG5ldyBSZWdFeHAoJ14nICsgcm91dGUsIGZsYWdzKG9wdGlvbnMpKVxufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgZ2l2ZW4gcGF0aCBzdHJpbmcsIHJldHVybmluZyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAqXG4gKiBBbiBlbXB0eSBhcnJheSBjYW4gYmUgcGFzc2VkIGluIGZvciB0aGUga2V5cywgd2hpY2ggd2lsbCBob2xkIHRoZVxuICogcGxhY2Vob2xkZXIga2V5IGRlc2NyaXB0aW9ucy4gRm9yIGV4YW1wbGUsIHVzaW5nIGAvdXNlci86aWRgLCBga2V5c2Agd2lsbFxuICogY29udGFpbiBgW3sgbmFtZTogJ2lkJywgZGVsaW1pdGVyOiAnLycsIG9wdGlvbmFsOiBmYWxzZSwgcmVwZWF0OiBmYWxzZSB9XWAuXG4gKlxuICogQHBhcmFtICB7KFN0cmluZ3xSZWdFeHB8QXJyYXkpfSBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgICAgICAgICAgIFtrZXlzXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgICAgICAgICBbb3B0aW9uc11cbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gcGF0aFRvUmVnZXhwIChwYXRoLCBrZXlzLCBvcHRpb25zKSB7XG4gIGtleXMgPSBrZXlzIHx8IFtdXG5cbiAgaWYgKCFpc2FycmF5KGtleXMpKSB7XG4gICAgb3B0aW9ucyA9IGtleXNcbiAgICBrZXlzID0gW11cbiAgfSBlbHNlIGlmICghb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSB7fVxuICB9XG5cbiAgaWYgKHBhdGggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICByZXR1cm4gcmVnZXhwVG9SZWdleHAocGF0aCwga2V5cywgb3B0aW9ucylcbiAgfVxuXG4gIGlmIChpc2FycmF5KHBhdGgpKSB7XG4gICAgcmV0dXJuIGFycmF5VG9SZWdleHAocGF0aCwga2V5cywgb3B0aW9ucylcbiAgfVxuXG4gIHJldHVybiBzdHJpbmdUb1JlZ2V4cChwYXRoLCBrZXlzLCBvcHRpb25zKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChhcnIpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIl19
