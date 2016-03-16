(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Nes = require('nes/client')
var host = window.location.host
var client = new Nes.Client('ws://' + host)

module.exports = client

},{"nes/client":32}],2:[function(require,module,exports){
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

},{"../../config/client":26,"../fs":5,"../sessions":19,"../state":21,"../util":24}],3:[function(require,module,exports){
var supermodels = require('supermodels.js')

var schema = {
  name: String,
  path: String,
  relativeDir: String,
  relativePath: String,
  dir: String,
  isDirectory: Boolean,
  ext: String,
  stat: Object,
  get isFile () {
    return !this.isDirectory
  },
  expanded: Boolean
}

module.exports = supermodels(schema)

},{"supermodels.js":37}],4:[function(require,module,exports){
var supermodels = require('supermodels.js')
var File = require('./file')

var schema = {
  items: [File],
  find: function (relativePath) {
    return this.items.find(function (item) {
      return item.relativePath === relativePath
    })
  },
  findByPath: function (path) {
    return this.items.find(function (item) {
      return item.path === path
    })
  }
}

module.exports = supermodels(schema)

},{"./file":3,"supermodels.js":37}],5:[function(require,module,exports){
var client = require('./client')

// var supermodels = require('supermodels.js')
// var Files = require('./files')
// var State = require('./state')
//
// var schema = {
//   files: Files,
//   state: State
// }
//
// module.exports = supermodels(schema)

function readFile (path, callback) {
  client.request({
    path: '/readfile?path=' + path,
    // payload: {
    //   path: path
    // },
    method: 'GET'
  }, callback)
}

// function openFile (file) {
//   var session = sessions.find(file)
//   if (session) {
//     state.current = file
//     editor.setSession(session.editSession)
//   } else {
//     readFile(file.path, function (err, payload) {
//       if (err) {
//         return handleError(err)
//       }
//
//       if (!state.recent.findByPath(file.path)) {
//         state.recent.unshift(file)
//       }
//
//       session = sessions.add(file, payload.contents)
//       state.current = file
//       editor.setSession(session.editSession)
//     })
//   }
// }

// function closeFile (file) {
//   var close = false
//   var session = sessions.find(file)
//
//   if (session && session.isDirty) {
//     if (window.confirm('There are unsaved changes to this file. Are you sure?')) {
//       close = true
//     }
//   } else {
//     close = true
//   }
//
//   if (close) {
//     // Remove from recent files
//     state.recent.splice(state.recent.indexOf(file), 1)
//
//     if (session) {
//       // Remove session
//       sessions.items.splice(sessions.items.indexOf(session), 1)
//
//       if (state.current === file) {
//         if (sessions.items.length) {
//           // Open the next session
//           openFile(sessions.items[0].file)
//         } else if (state.recent.length) {
//           // Open the next file
//           openFile(state.recent[0])
//         } else {
//           state.current = null
//           editor.setSession(null)
//         }
//       }
//     }
//   }
// }

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

module.exports = {
  // run: run,
  // openFile: openFile,
  // closeFile: closeFile,
  readFile: readFile,
  writeFile: writeFile// ,
  // handleError: handleError
}

},{"./client":1}],6:[function(require,module,exports){
var page = require('page')
var qs = require('querystring')
var fs = require('./fs')
var state = require('./state')
var sessions = require('./sessions')
var Files = require('./files')
var Tree = require('./tree')
var Recent = require('./recent')
var Processes = require('./processes')
var util = require('./util')
var splitter = require('./splitter')
var editor = require('./editor')
var client = require('./client')

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
    var files = new Files({
      items: payload.watched
    })

    // Load the state from localStorage
    state.load(files)

    // Subscribe to watched file changes
    // that happen on the file system
    // Reload the session if the changes
    // do not match the state of the file
    client.subscribe('/change', function (payload) {
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

    // Save state on page unload
    window.onunload = function () {
      console.log('log')
      state.save(files)
    }

    // Create a new noide instance
    // var noide = new Noide({
    //   state: state,
    //   files: files
    // })

    // Build the tree pane
    var treeView = new Tree(treeEl, files, state)
    treeView.render()

    // Build the recent list pane
    var recentView = new Recent(recentEl, state)
    recentView.render()

    // Build the procsses pane
    var processesView = new Processes(processesEl)
    processesView.render()

    function resizeEditor () {
      editor.resize()
      processesView.editor.resize()
    }

    splitter(document.getElementById('sidebar-workspaces'), resizeEditor)
    splitter(document.getElementById('workspaces-info'), resizeEditor)
    splitter(document.getElementById('main-footer'), resizeEditor)

    page('/', function (ctx) {
      workspacesEl.className = 'welcome'
    })

    page('/file', function (ctx, next) {
      var path = qs.parse(ctx.querystring).path
      var file = files.find(path)

      if (!file) {
        return next()
      }

      var session = sessions.find(file)

      function setSession () {
        workspacesEl.className = 'editor'

        // Update state
        state.current = file

        var items = state.recent.items
        if (items.indexOf(file) < 0) {
          items.unshift(file)
        }

        // Set the editor session
        editor.setSession(session.editSession)
        editor.resize()
      }

      if (session) {
        setSession()
      } else {
        fs.readFile(path, function (err, payload) {
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
  })
})

},{"./client":1,"./editor":2,"./files":4,"./fs":5,"./processes":11,"./recent":17,"./sessions":19,"./splitter":20,"./state":21,"./tree":22,"./util":24,"page":34,"querystring":30}],7:[function(require,module,exports){
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

},{"./client":1,"./util":24}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
var patch = require('incremental-dom').patch

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

},{"incremental-dom":31}],10:[function(require,module,exports){
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
var hoisted8 = ["type", "text", "class", "form-control input-sm", "name", "command", "id", "command", "required", "", "autocomplete", "off"]
var hoisted9 = ["class", "input-group-btn"]
var hoisted10 = ["class", "btn btn-default btn-sm", "type", "submit"]
var hoisted11 = ["class", "nav nav-tabs"]
var hoisted12 = ["class", "btn btn-default btn-xs"]
var hoisted13 = ["class", "fa fa-stop"]
var hoisted14 = ["class", "btn btn-default btn-xs"]
var hoisted15 = ["class", "fa fa-refresh"]
var hoisted16 = ["class", "btn btn-default btn-xs"]
var hoisted17 = ["class", "fa fa-close"]
var hoisted18 = ["class", "processes"]
var hoisted19 = ["class", "list"]
var hoisted20 = ["class", "nav nav-tabs"]
var hoisted21 = ["class", "btn btn-default btn-xs"]
var hoisted22 = ["class", "fa fa-stop"]
var hoisted23 = ["class", "btn btn-default btn-xs"]
var hoisted24 = ["class", "fa fa-refresh"]
var hoisted25 = ["class", "btn btn-default btn-xs"]
var hoisted26 = ["class", "fa fa-close"]
var hoisted27 = ["id", "list-output", "class", "splitter"]
var hoisted28 = ["class", "output"]

return function description (model, showOutput) {
  elementOpen("div", null, hoisted1)
    elementOpen("form", null, null, "onsubmit", function ($event) {
      $event.preventDefault();
      var $element = this;
    model.run(this.command.value)})
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
                model.command = 'npm run ' + task.name; jQuery('#command').focus()})
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
        elementClose("span")
      elementClose("div")
    elementClose("form")
    elementOpen("ul", null, hoisted11)
      ;(Array.isArray(model.processes) ? model.processes : Object.keys(model.processes)).forEach(function(process, $index) {
        elementOpen("li", process.pid)
          elementOpen("a", null, null, "onclick", function ($event) {
            $event.preventDefault();
            var $element = this;
          showOutput(process)})
            elementOpen("span", null, null, "class", 'circle ' + (!process.isAlive ? 'dead' : (process.isActive ? 'alive active' : 'alive')))
            elementClose("span")
            text(" \
                      " + (process.name || process.command) + "")
            elementOpen("span")
              text("[" + (process.pid) + "]")
            elementClose("span")
            if (process.isAlive) {
              elementOpen("button", "kill-tab", hoisted12, "onclick", function ($event) {
                $event.preventDefault();
                var $element = this;
              model.kill(process)})
                elementOpen("i", null, hoisted13)
                elementClose("i")
              elementClose("button")
            }
            if (!process.isAlive) {
              elementOpen("button", "resurrect-tab", hoisted14, "onclick", function ($event) {
                $event.preventDefault();
                var $element = this;
              model.resurrect(process)})
                elementOpen("i", null, hoisted15)
                elementClose("i")
              elementClose("button")
              elementOpen("button", "remove-tab", hoisted16, "onclick", function ($event) {
                $event.preventDefault();
                var $element = this;
              model.remove(process)})
                elementOpen("i", null, hoisted17)
                elementClose("i")
              elementClose("button")
            }
          elementClose("a")
        elementClose("li")
      }, model.processes)
    elementClose("ul")
  elementClose("div")
  elementOpen("div", null, hoisted18)
    elementOpen("div", null, hoisted19)
      if (model.processes.length) {
        elementOpen("ul", null, hoisted20)
          ;(Array.isArray(model.processes) ? model.processes : Object.keys(model.processes)).forEach(function(process, $index) {
            elementOpen("li", process.pid)
              elementOpen("a", null, null, "onclick", function ($event) {
                $event.preventDefault();
                var $element = this;
              showOutput(process)})
                elementOpen("span", null, null, "class", 'circle ' + (!process.isAlive ? 'dead' : (process.isActive ? 'alive active' : 'alive')))
                elementClose("span")
                text(" \
                           " + (process.name || process.command) + "")
                elementOpen("span")
                  text("[" + (process.pid) + "]")
                elementClose("span")
                if (process.isAlive) {
                  elementOpen("button", "kill", hoisted21, "onclick", function ($event) {
                    $event.preventDefault();
                    var $element = this;
                  model.kill(process)})
                    elementOpen("i", null, hoisted22)
                    elementClose("i")
                  elementClose("button")
                }
                if (!process.isAlive) {
                  elementOpen("button", "resurrect", hoisted23, "onclick", function ($event) {
                    $event.preventDefault();
                    var $element = this;
                  model.resurrect(process)})
                    elementOpen("i", null, hoisted24)
                    elementClose("i")
                  elementClose("button")
                  elementOpen("button", "remove", hoisted25, "onclick", function ($event) {
                    $event.preventDefault();
                    var $element = this;
                  model.remove(process)})
                    elementOpen("i", null, hoisted26)
                    elementClose("i")
                  elementClose("button")
                }
              elementClose("a")
            elementClose("li")
          }, model.processes)
        elementClose("ul")
      }
    elementClose("div")
    elementPlaceholder("placeholder", "list-output", hoisted27)
    elementPlaceholder("placeholder", "output", hoisted28)
  elementClose("div")
}
})();

},{"incremental-dom":31}],11:[function(require,module,exports){
var patch = require('incremental-dom').patch
var view = require('./index.html')
var Model = require('./model')
var Task = require('./task')
var Process = require('./process')
var splitter = require('../splitter')
var client = require('../client')
var fs = require('../fs')
var util = require('../util')

function Processes (el) {
  var editor

  client.subscribe('/io', function (payload) {
    var process = model.processes.find(function (item) {
      return item.pid === payload.pid
    })

    if (process) {
      var session = process.session
      session.insert({
        row: session.getLength(),
        column: 0
      }, payload.data)
      session.getSelection().moveCursorFileEnd()
      process.isActive = true
    }
  }, function (err) {
    if (err) {
      return util.handleError(err)
    }
  })

  function showOutput (process) {
    editor.setSession(process.session)
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

  function loadPids (procs) {
    console.log('procs', procs)
    var proc
    var born = []

    // find any new processes
    for (var i = 0; i < procs.length; i++) {
      proc = procs[i]

      var process = model.processes.find(function (item) {
        return item.pid === proc.pid
      })

      if (!process) {
        // new child process found. Add it
        // and set it's cached buffer into session
        process = new Process(proc)
        process.session.setValue(proc.buffer)
        born.push(process)
      }
    }

    // shut down processes that have died
    model.processes.forEach(function (item) {
      var match = procs.find(function (check) {
        return item.pid === check.pid
      })
      if (!match) {
        // item.pid = 0
        item.isAlive = false
        item.isActive = false
      }
    })

    // insert any new child processes
    if (born.length) {
      model.processes.splice.apply(model.processes, [0, 0].concat(born))
      showOutput(born[0])
    }
  }

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
      }
    })
  }

  readTasks()

  function update (model) {
    view(model, showOutput)
  }

  function render () {
    patch(el, update, model)

    if (!editor) {
      var outputEl = el.querySelector('.output')
      editor = window.ace.edit(outputEl)

      editor.setTheme('ace/theme/terminal')
      editor.setReadOnly(true)
      editor.renderer.setShowGutter(false)
      editor.setHighlightActiveLine(false)
      editor.setShowPrintMargin(false)
      splitter(document.getElementById('list-output'), editor.resize.bind(editor))
    }
  }

  var model = new Model()

  model.on('change', render)

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

},{"../client":1,"../fs":5,"../splitter":20,"../util":24,"./index.html":10,"./model":12,"./process":13,"./task":14,"incremental-dom":31}],12:[function(require,module,exports){
var supermodels = require('supermodels.js')
var io = require('../io')
var client = require('../client')
var util = require('../util')
var Task = require('./task')
var Process = require('./process')

var schema = {
  tasks: [Task],
  command: String,
  current: Process,
  processes: [Process],
  get dead () {
    return this.processes.filter(function (item) {
      return !item.isAlive
    })
  },
  run: function (command, name) {
    io.run(command, name, function (err, payload) {
      if (err) {
        return util.handleError(err)
      }
    })
  },
  remove: function (process) {
    var processes = this.processes
    processes.splice(processes.indexOf(process), 1)
  },
  removeAllDead: function () {
    var dead = this.dead
    for (var i = 0; i < dead.length; i++) {
      this.remove(dead[i])
    }
  },
  resurrect: function (process) {
    this.remove(process)
    this.run(process.command, process.name)
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
  }
}

module.exports = supermodels(schema)

},{"../client":1,"../io":7,"../util":24,"./process":13,"./task":14,"supermodels.js":37}],13:[function(require,module,exports){
var supermodels = require('supermodels.js')
var prop = require('../prop')
var EditSession = window.ace.require('ace/edit_session').EditSession

function createSession () {
  var editSession = new EditSession('', 'ace/mode/sh')
  editSession.setUseWorker(false)
  return editSession
}
var schema = {
  pid: prop(Number),
  name: prop(String).required(),
  command: prop(String).required(),
  isAlive: prop(Boolean).required().value(true),
  session: prop(Object).value(createSession),
  get isActive () {
    return !!this._isActive
  },
  set isActive (value) {
    if (this._isActive !== value) {
      var timeout = this._timeout
      if (timeout) {
        clearTimeout(timeout)
      }

      var oldValue = this._isActive
      this._isActive = value
      console.log('isActive', value, oldValue)
      this.__notifyChange('isActive', value, oldValue)
      if (this._isActive) {
        this._timeout = setTimeout(function () {
          console.log('tomeout')
          this.isActive = false
        }.bind(this), 1500)
      }
    }
  }
}

module.exports = supermodels(schema)

},{"../prop":15,"supermodels.js":37}],14:[function(require,module,exports){
var supermodels = require('supermodels.js')
var prop = require('../prop')

var schema = {
  name: prop(String).required(),
  command: prop(String).required()
}

module.exports = supermodels(schema)

},{"../prop":15,"supermodels.js":37}],15:[function(require,module,exports){
var supermodels = require('supermodels.js')
var validators = require('./validators')
var prop = supermodels.prop()

// Registering validators makes them part
// of the fluent interface when using `prop`.
prop.register('required', validators.required)

module.exports = prop

},{"./validators":25,"supermodels.js":37}],16:[function(require,module,exports){
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

},{"incremental-dom":31}],17:[function(require,module,exports){
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
    state.recent.items.splice(state.recent.items.indexOf(file), 1)

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
  }

  function render () {
    patch(el, view, state.recent.items, state.current, onClickClose)
  }

  state.on('change', render)

  this.render = render
}

module.exports = Recent

},{"../patch":9,"../sessions":19,"../state":21,"./index.html":16,"page":34}],18:[function(require,module,exports){
var supermodels = require('supermodels.js')
var File = require('./file')
var prop = supermodels.prop()

module.exports = supermodels({
  file: File,
  editSession: Object,
  created: prop(Date).value(Date.now),
  modified: prop(Date).value(Date.now),
  get isClean () {
    return this.editSession.getUndoManager().isClean()
  },
  get isDirty () {
    return !this.isClean
  }
})

},{"./file":3,"supermodels.js":37}],19:[function(require,module,exports){
var supermodels = require('supermodels.js')
var config = require('../config/client')
var modes = require('./modes')
var Session = require('./session')
var EditSession = window.ace.require('ace/edit_session').EditSession
var UndoManager = window.ace.require('ace/undomanager').UndoManager

var schema = {
  items: [Session],
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

    var session = new Session({
      file: file,
      editSession: editSession
    })

    this.items.push(session)

    return session
  }
}

var Sessions = supermodels(schema)

var sessions = new Sessions()

module.exports = sessions

},{"../config/client":26,"./modes":8,"./session":18,"supermodels.js":37}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
var supermodels = require('supermodels.js')
var File = require('./file')
var Files = require('./files')
var storageKey = 'noide'

function saveState (files) {
  var storage = {
    recent: this.recent.items.map(function (item) {
      return item.path
    }),
    expanded: files.items.filter(function (item) {
      return item.expanded
    }).map(function (item) {
      return item.path
    })
  }
  window.localStorage.setItem(storageKey, JSON.stringify(storage))
}

function loadState (files) {
  var storage = window.localStorage.getItem(storageKey)
  storage = storage ? JSON.parse(storage) : {}

  var dir, file, i
  this.recent = new Files()

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

var schema = {
  recent: Files,
  current: File,
  save: saveState,
  load: loadState
}

var State = supermodels(schema)

var state = new State()

module.exports = state

},{"./file":3,"./files":4,"supermodels.js":37}],22:[function(require,module,exports){
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
  }

  function render () {
    patch(el, view, makeTree(files), true, state.current, onClick)
  }

  files.on('change', render)
  state.on('change:current', render)

  this.render = render
}

module.exports = Tree

},{"../patch":9,"./view.html":23}],23:[function(require,module,exports){
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
          elementOpen("a", null, null, "href", '/file?path=' + fso.relativePath)
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

},{"incremental-dom":31}],24:[function(require,module,exports){
function handleError (err) {
  console.error(err)
}

module.exports = {
  handleError: handleError
}

},{}],25:[function(require,module,exports){
function required (val, name) {
  if (!val) {
    return name + ' is required'
  }
}

module.exports = {
  required: required
}

},{}],26:[function(require,module,exports){
module.exports = {
  ace: {
    tabSize: 2,
    fontSize: 12,
    theme: 'monokai',
    useSoftTabs: true
  }
}

},{}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
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

},{}],29:[function(require,module,exports){
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

},{}],30:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":28,"./encode":29}],31:[function(require,module,exports){
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

},{"_process":27}],32:[function(require,module,exports){
'use strict';

module.exports = require('./dist/client');

},{"./dist/client":33}],33:[function(require,module,exports){
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

},{}],34:[function(require,module,exports){
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

},{"_process":27,"path-to-regexp":35}],35:[function(require,module,exports){
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

},{"isarray":36}],36:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],37:[function(require,module,exports){
module.exports = require('./lib/supermodels');

},{"./lib/supermodels":48}],38:[function(require,module,exports){
'use strict'

var util = require('./util')
var createWrapperFactory = require('./factory')

function resolve (from) {
  var isCtor = util.isConstructor(from)
  var isSupermodelCtor = util.isSupermodelConstructor(from)
  var isArray = util.isArray(from)

  if (isCtor || isSupermodelCtor || isArray) {
    return {
      __type: from
    }
  }

  var isValue = !util.isObject(from)
  if (isValue) {
    return {
      __value: from
    }
  }

  return from
}

function createDef (from) {
  from = resolve(from)

  var __VALIDATORS = '__validators'
  var __VALUE = '__value'
  var __TYPE = '__type'
  var __DISPLAYNAME = '__displayName'
  var __GET = '__get'
  var __SET = '__set'
  var __ENUMERABLE = '__enumerable'
  var __CONFIGURABLE = '__configurable'
  var __WRITABLE = '__writable'
  var __SPECIAL_PROPS = [
    __VALIDATORS, __VALUE, __TYPE, __DISPLAYNAME,
    __GET, __SET, __ENUMERABLE, __CONFIGURABLE, __WRITABLE
  ]

  var def = {
    from: from,
    type: from[__TYPE],
    value: from[__VALUE],
    validators: from[__VALIDATORS] || [],
    enumerable: from[__ENUMERABLE] !== false,
    configurable: !!from[__CONFIGURABLE],
    writable: from[__WRITABLE] !== false,
    displayName: from[__DISPLAYNAME],
    getter: from[__GET],
    setter: from[__SET]
  }

  var type = def.type

  // Simple 'Constructor' Type
  if (util.isSimpleConstructor(type)) {
    def.isSimple = true

    def.cast = function (value) {
      return util.cast(value, type)
    }
  } else if (util.isSupermodelConstructor(type)) {
    def.isReference = true
  } else if (def.value) {
    // If a value is present, use
    // that and short-circuit the rest
    def.isSimple = true
  } else {
    // Otherwise look for other non-special
    // keys and also any item definition
    // in the case of Arrays

    var keys = Object.keys(from)
    var childKeys = keys.filter(function (item) {
      return __SPECIAL_PROPS.indexOf(item) === -1
    })

    if (childKeys.length) {
      var defs = {}
      var proto

      childKeys.forEach(function (key) {
        var descriptor = Object.getOwnPropertyDescriptor(from, key)
        var value

        if (descriptor.get || descriptor.set) {
          value = {
            __get: descriptor.get,
            __set: descriptor.set
          }
        } else {
          value = from[key]
        }

        if (!util.isConstructor(value) && !util.isSupermodelConstructor(value) && util.isFunction(value)) {
          if (!proto) {
            proto = {}
          }
          proto[key] = value
        } else {
          defs[key] = createDef(value)
        }
      })

      def.defs = defs
      def.proto = proto
    }

    // Check for Array
    if (type === Array || util.isArray(type)) {
      def.isArray = true

      if (type.length > 0) {
        def.def = createDef(type[0])
      }
    } else if (childKeys.length === 0) {
      def.isSimple = true
    }
  }

  def.create = createWrapperFactory(def)

  return def
}

module.exports = createDef

},{"./factory":42,"./util":49}],39:[function(require,module,exports){
'use strict'

module.exports = function (callback) {
  var arr = []

  /**
   * Proxied array mutators methods
   *
   * @param {Object} obj
   * @return {Object}
   * @api private
   */
  var pop = function () {
    var result = Array.prototype.pop.apply(arr)

    callback('pop', arr, {
      value: result
    })

    return result
  }
  var push = function () {
    var result = Array.prototype.push.apply(arr, arguments)

    callback('push', arr, {
      value: result
    })

    return result
  }
  var shift = function () {
    var result = Array.prototype.shift.apply(arr)

    callback('shift', arr, {
      value: result
    })

    return result
  }
  var sort = function () {
    var result = Array.prototype.sort.apply(arr, arguments)

    callback('sort', arr, {
      value: result
    })

    return result
  }
  var unshift = function () {
    var result = Array.prototype.unshift.apply(arr, arguments)

    callback('unshift', arr, {
      value: result
    })

    return result
  }
  var reverse = function () {
    var result = Array.prototype.reverse.apply(arr)

    callback('reverse', arr, {
      value: result
    })

    return result
  }
  var splice = function () {
    if (!arguments.length) {
      return
    }

    var result = Array.prototype.splice.apply(arr, arguments)

    callback('splice', arr, {
      value: result,
      removed: result,
      added: Array.prototype.slice.call(arguments, 2)
    })

    return result
  }

  /**
   * Proxy all Array.prototype mutator methods on this array instance
   */
  arr.pop = arr.pop && pop
  arr.push = arr.push && push
  arr.shift = arr.shift && shift
  arr.unshift = arr.unshift && unshift
  arr.sort = arr.sort && sort
  arr.reverse = arr.reverse && reverse
  arr.splice = arr.splice && splice

  /**
   * Special update function since we can't detect
   * assignment by index e.g. arr[0] = 'something'
   */
  arr.update = function (index, value) {
    var oldValue = arr[index]
    var newValue = arr[index] = value

    callback('update', arr, {
      index: index,
      value: newValue,
      oldValue: oldValue
    })

    return newValue
  }

  return arr
}

},{}],40:[function(require,module,exports){
'use strict'

module.exports = function EmitterEvent (name, path, target, detail) {
  this.name = name
  this.path = path
  this.target = target

  if (detail) {
    this.detail = detail
  }
}

},{}],41:[function(require,module,exports){
'use strict'

/**
 * Expose `Emitter`.
 */

module.exports = Emitter

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter (obj) {
  var ctx = obj || this

  if (obj) {
    ctx = mixin(obj)
    return ctx
  }
}

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin (obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key]
  }
  return obj
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on = Emitter.prototype.addEventListener = function (event, fn) {
  (this.__callbacks[event] = this.__callbacks[event] || [])
    .push(fn)
  return this
}

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function (event, fn) {
  function on () {
    this.off(event, on)
    fn.apply(this, arguments)
  }

  on.fn = fn
  this.on(event, on)
  return this
}

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off = Emitter.prototype.removeEventListener = Emitter.prototype.removeAllListeners = function (event, fn) {
  // all
  if (arguments.length === 0) {
    this.__callbacks = {}
    return this
  }

  // specific event
  var callbacks = this.__callbacks[event]
  if (!callbacks) {
    return this
  }

  // remove all handlers
  if (arguments.length === 1) {
    delete this.__callbacks[event]
    return this
  }

  // remove specific handler
  var cb
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i]
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1)
      break
    }
  }
  return this
}

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function (event) {
  var args = [].slice.call(arguments, 1)
  var callbacks = this.__callbacks[event]

  if (callbacks) {
    callbacks = callbacks.slice(0)
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args)
    }
  }

  return this
}

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function (event) {
  return this.__callbacks[event] || []
}

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function (event) {
  return !!this.listeners(event).length
}

},{}],42:[function(require,module,exports){
'use strict'

var util = require('./util')
var createModelPrototype = require('./proto')
var Wrapper = require('./wrapper')

function createModelDescriptors (def, parent) {
  var __ = {}

  var desc = {
    __: {
      value: __
    },
    __def: {
      value: def
    },
    __parent: {
      value: parent,
      writable: true
    },
    __callbacks: {
      value: {},
      writable: true
    }
  }

  return desc
}

function defineProperties (model) {
  var defs = model.__def.defs
  for (var key in defs) {
    defineProperty(model, key, defs[key])
  }
}

function defineProperty (model, key, def) {
  var desc = {
    get: function () {
      return this.__get(key)
    },
    enumerable: def.enumerable,
    configurable: def.configurable
  }

  if (def.writable) {
    desc.set = function (value) {
      this.__setNotifyChange(key, value)
    }
  }

  Object.defineProperty(model, key, desc)

  // Silently initialize the property wrapper
  model.__[key] = def.create(model)
}

function createWrapperFactory (def) {
  var wrapper, defaultValue, assert

  if (def.isSimple) {
    wrapper = new Wrapper(def.value, def.writable, def.validators, def.getter, def.setter, def.cast, null)
  } else if (def.isReference) {
    // Hold a reference to the
    // refererenced types' definition
    var refDef = def.type.def

    if (refDef.isSimple) {
      // If the referenced type is itself simple,
      // we can set just return a wrapper and
      // the property will get initialized.
      wrapper = new Wrapper(refDef.value, refDef.writable, refDef.validators, def.getter, def.setter, refDef.cast, null)
    } else {
      // If we're not dealing with a simple reference model
      // we need to define an assertion that the instance
      // being set is of the correct type. We do this be
      // comparing the defs.

      assert = function (value) {
        // compare the defintions of the value instance
        // being passed and the def property attached
        // to the type SupermodelConstructor. Allow the
        // value to be undefined or null also.
        var isCorrectType = false

        if (util.isNullOrUndefined(value)) {
          isCorrectType = true
        } else {
          isCorrectType = refDef === value.__def
        }

        if (!isCorrectType) {
          throw new Error('Value should be an instance of the referenced model, null or undefined')
        }
      }

      wrapper = new Wrapper(def.value, def.writable, def.validators, def.getter, def.setter, null, assert)
    }
  } else if (def.isArray) {
    defaultValue = function (parent) {
      // for Arrays, we create a new Array and each
      // time, mix the model properties into it
      var model = createModelPrototype(def)
      Object.defineProperties(model, createModelDescriptors(def, parent))
      defineProperties(model)
      return model
    }

    assert = function (value) {
      // todo: further array type validation
      if (!util.isArray(value)) {
        throw new Error('Value should be an array')
      }
    }

    wrapper = new Wrapper(defaultValue, def.writable, def.validators, def.getter, def.setter, null, assert)
  } else {
    // for Objects, we can create and reuse
    // a prototype object. We then need to only
    // define the defs and the 'instance' properties
    // e.g. __, parent etc.
    var proto = createModelPrototype(def)

    defaultValue = function (parent) {
      var model = Object.create(proto, createModelDescriptors(def, parent))
      defineProperties(model)
      return model
    }

    assert = function (value) {
      if (!proto.isPrototypeOf(value)) {
        throw new Error('Invalid prototype')
      }
    }

    wrapper = new Wrapper(defaultValue, def.writable, def.validators, def.getter, def.setter, null, assert)
  }

  var factory = function (parent) {
    var wrap = Object.create(wrapper)
    // if (!wrap.isInitialized) {
    wrap._initialize(parent)
    // }
    return wrap
  }

  // expose the wrapper, this is used
  // for validating array items later
  factory.wrapper = wrapper

  return factory
}

module.exports = createWrapperFactory

},{"./proto":46,"./util":49,"./wrapper":51}],43:[function(require,module,exports){
'use strict'

function merge (model, obj) {
  var isArray = model.__def.isArray
  var defs = model.__def.defs
  var defKeys, def, key, i, isSimple,
    isSimpleReference, isInitializedReference

  if (defs) {
    defKeys = Object.keys(defs)
    for (i = 0; i < defKeys.length; i++) {
      key = defKeys[i]
      if (obj.hasOwnProperty(key)) {
        def = defs[key]

        isSimple = def.isSimple
        isSimpleReference = def.isReference && def.type.def.isSimple
        isInitializedReference = def.isReference && obj[key] && obj[key].__supermodel

        if (isSimple || isSimpleReference || isInitializedReference) {
          model[key] = obj[key]
        } else if (obj[key]) {
          if (def.isReference) {
            model[key] = def.type()
          }
          merge(model[key], obj[key])
        }
      }
    }
  }

  if (isArray && Array.isArray(obj)) {
    for (i = 0; i < obj.length; i++) {
      if (obj[i] && obj[i].__supermodel) {
        model.push(obj[i])
      } else {
        var item = model.create()
        model.push(item && item.__supermodel ? merge(item, obj[i]) : obj[i])
      }
    }
  }

  return model
}

module.exports = merge

},{}],44:[function(require,module,exports){
'use strict'

var EmitterEvent = require('./emitter-event')
var ValidationError = require('./validation-error')
var Wrapper = require('./wrapper')
var merge = require('./merge')

var descriptors = {
  __supermodel: {
    value: true
  },
  __keys: {
    get: function () {
      var keys = Object.keys(this)

      if (Array.isArray(this)) {
        var omit = [
          'addEventListener', 'on', 'once', 'removeEventListener', 'removeAllListeners',
          'removeListener', 'off', 'emit', 'listeners', 'hasListeners', 'pop', 'push',
          'reverse', 'shift', 'sort', 'splice', 'update', 'unshift', 'create', '__merge',
          '__setNotifyChange', '__notifyChange', '__set', '__get', '__chain', '__relativePath'
        ]

        keys = keys.filter(function (item) {
          return omit.indexOf(item) < 0
        })
      }

      return keys
    }
  },
  __name: {
    get: function () {
      if (this.__isRoot) {
        return ''
      }

      // Work out the 'name' of the model
      // Look up to the parent and loop through it's keys,
      // Any value or array found to contain the value of this (this model)
      // then we return the key and index in the case we found the model in an array.
      var parentKeys = this.__parent.__keys
      var parentKey, parentValue

      for (var i = 0; i < parentKeys.length; i++) {
        parentKey = parentKeys[i]
        parentValue = this.__parent[parentKey]

        if (parentValue === this) {
          return parentKey
        }
      }
    }
  },
  __path: {
    get: function () {
      if (this.__hasAncestors && !this.__parent.__isRoot) {
        return this.__parent.__path + '.' + this.__name
      } else {
        return this.__name
      }
    }
  },
  __isRoot: {
    get: function () {
      return !this.__hasAncestors
    }
  },
  __children: {
    get: function () {
      var children = []

      var keys = this.__keys
      var key, value

      for (var i = 0; i < keys.length; i++) {
        key = keys[i]
        value = this[key]

        if (value && value.__supermodel) {
          children.push(value)
        }
      }

      return children
    }
  },
  __ancestors: {
    get: function () {
      var ancestors = []
      var r = this

      while (r.__parent) {
        ancestors.push(r.__parent)
        r = r.__parent
      }

      return ancestors
    }
  },
  __descendants: {
    get: function () {
      var descendants = []

      function checkAndAddDescendantIfModel (obj) {
        var keys = obj.__keys
        var key, value

        for (var i = 0; i < keys.length; i++) {
          key = keys[i]
          value = obj[key]

          if (value && value.__supermodel) {
            descendants.push(value)
            checkAndAddDescendantIfModel(value)
          }
        }
      }

      checkAndAddDescendantIfModel(this)

      return descendants
    }
  },
  __hasAncestors: {
    get: function () {
      return !!this.__ancestors.length
    }
  },
  __hasDescendants: {
    get: function () {
      return !!this.__descendants.length
    }
  },
  errors: {
    get: function () {
      var errors = []
      var def = this.__def
      var validator, error, i

      // Run own validators
      var own = def.validators.slice(0)
      for (i = 0; i < own.length; i++) {
        validator = own[i]
        error = validator.call(this, this)

        if (error) {
          errors.push(new ValidationError(this, error, validator))
        }
      }
      // Run through keys and evaluate validators
      var keys = this.__keys
      var value, key, itemDef, displayName

      for (i = 0; i < keys.length; i++) {
        key = keys[i]
        displayName = this.__def.defs && this.__def.defs[key].displayName
        // If we are an Array with an item definition
        // then we have to look into the Array for our value
        // and also get hold of the wrapper. We only need to
        // do this if the key is not a property of the array.
        // We check the defs to work this out (i.e. 0, 1, 2).
        // todo: This could be better to check !NaN on the key?
        if (def.isArray && def.def && (!def.defs || !(key in def.defs))) {
          // If we are an Array with a simple item definition
          // or a reference to a simple type definition
          // substitute the value with the wrapper we get from the
          // create factory function. Otherwise set the value to
          // the real value of the property.
          itemDef = def.def

          if (itemDef.isSimple) {
            value = itemDef.create.wrapper
            value._setValue(this[key])
          } else if (itemDef.isReference && itemDef.type.def.isSimple) {
            value = itemDef.type.def.create.wrapper
            value._setValue(this[key])
          } else {
            value = this[key]
          }
        } else {
          // Set the value to the wrapped value of the property
          value = this.__[key]
        }

        if (value) {
          if (value.__supermodel) {
            Array.prototype.push.apply(errors, value.errors)
          } else if (value instanceof Wrapper) {
            var wrapperValue = value._getValue(this)

            if (wrapperValue && wrapperValue.__supermodel) {
              Array.prototype.push.apply(errors, wrapperValue.errors)
            } else {
              Array.prototype.push.apply(errors, value._getErrors(this, key, displayName || key))
            }
          }
        }
      }

      return errors
    }
  }
}

var proto = {
  __get: function (key) {
    return this.__[key]._getValue(this)
  },
  __set: function (key, value) {
    this.__[key]._setValue(value, this)
  },
  __relativePath: function (to, key) {
    var relativePath = this.__path
      ? to.substr(this.__path.length + 1)
      : to

    if (relativePath) {
      return key ? relativePath + '.' + key : relativePath
    }
    return key
  },
  __chain: function (fn) {
    return [this].concat(this.__ancestors).forEach(fn)
  },
  __merge: function (data) {
    return merge(this, data)
  },
  __notifyChange: function (key, newValue, oldValue) {
    var target = this
    var targetPath = this.__path
    var eventName = 'set'
    var data = {
      oldValue: oldValue,
      newValue: newValue
    }

    this.emit(eventName, new EmitterEvent(eventName, key, target, data))
    this.emit('change', new EmitterEvent(eventName, key, target, data))
    this.emit('change:' + key, new EmitterEvent(eventName, key, target, data))

    this.__ancestors.forEach(function (item) {
      var path = item.__relativePath(targetPath, key)
      item.emit('change', new EmitterEvent(eventName, path, target, data))
    })
  },
  __setNotifyChange: function (key, value) {
    var oldValue = this.__get(key)
    this.__set(key, value)
    var newValue = this.__get(key)
    this.__notifyChange(key, newValue, oldValue)
  }
}

module.exports = {
  proto: proto,
  descriptors: descriptors
}

},{"./emitter-event":40,"./merge":43,"./validation-error":50,"./wrapper":51}],45:[function(require,module,exports){
'use strict'

function factory () {
  function Prop (type) {
    if (!(this instanceof Prop)) {
      return new Prop(type)
    }

    this.__type = type
    this.__validators = []
  }
  Prop.prototype.type = function (type) {
    this.__type = type
    return this
  }
  Prop.prototype.enumerable = function (enumerable) {
    this.__enumerable = enumerable
    return this
  }
  Prop.prototype.configurable = function (configurable) {
    this.__configurable = configurable
    return this
  }
  Prop.prototype.writable = function (writable) {
    this.__writable = writable
    return this
  }
  Prop.prototype.keys = function (keys) {
    if (this.__type !== Array) {
      this.__type = Object
    }
    for (var key in keys) {
      this[key] = keys[key]
    }
    return this
  }
  Prop.prototype.validate = function (fn) {
    this.__validators.push(fn)
    return this
  }
  Prop.prototype.get = function (fn) {
    this.__get = fn
    return this
  }
  Prop.prototype.set = function (fn) {
    this.__set = fn
    return this
  }
  Prop.prototype.value = function (value) {
    this.__value = value
    return this
  }
  Prop.prototype.name = function (name) {
    this.__displayName = name
    return this
  }
  Prop.register = function (name, fn) {
    var wrapper = function () {
      this.__validators.push(fn.apply(this, arguments))
      return this
    }
    Object.defineProperty(Prop.prototype, name, {
      value: wrapper
    })
  }
  return Prop
}

module.exports = factory

},{}],46:[function(require,module,exports){
'use strict'

var emitter = require('./emitter-object')
var emitterArray = require('./emitter-array')
var EmitterEvent = require('./emitter-event')

var extend = require('./util').extend
var model = require('./model')
var modelProto = model.proto
var modelDescriptors = model.descriptors

var modelPrototype = Object.create(modelProto, modelDescriptors)
var objectPrototype = (function () {
  var p = Object.create(modelPrototype)

  emitter(p)

  return p
})()

function createArrayPrototype () {
  var p = emitterArray(function (eventName, arr, e) {
    if (eventName === 'update') {
      /**
       * Forward the special array update
       * events as standard __notifyChange events
       */
      arr.__notifyChange(e.index, e.value, e.oldValue)
    } else {
      /**
       * All other events e.g. push, splice are relayed
       */
      var target = arr
      var path = arr.__path
      var data = e
      var key = e.index

      arr.emit(eventName, new EmitterEvent(eventName, '', target, data))
      arr.emit('change', new EmitterEvent(eventName, '', target, data))
      arr.__ancestors.forEach(function (item) {
        var name = item.__relativePath(path, key)
        item.emit('change', new EmitterEvent(eventName, name, target, data))
      })
    }
  })

  Object.defineProperties(p, modelDescriptors)

  emitter(p)

  extend(p, modelProto)

  return p
}

function createObjectModelPrototype (proto) {
  var p = Object.create(objectPrototype)

  if (proto) {
    extend(p, proto)
  }

  return p
}

function createArrayModelPrototype (proto, itemDef) {
  // We do not to attempt to subclass Array,
  // instead create a new instance each time
  // and mixin the proto object
  var p = createArrayPrototype()

  if (proto) {
    extend(p, proto)
  }

  if (itemDef) {
    // We have a definition for the items
    // that belong in this array.

    // Use the `wrapper` prototype property as a
    // virtual Wrapper object we can use
    // validate all the items in the array.
    var arrItemWrapper = itemDef.create.wrapper

    // Validate new models by overriding the emitter array
    // mutators that can cause new items to enter the array.
    overrideArrayAddingMutators(p, arrItemWrapper)

    // Provide a convenient model factory
    // for creating array item instances
    p.create = function () {
      return itemDef.isReference ? itemDef.type() : itemDef.create()._getValue(this)
    }
  }

  return p
}

function overrideArrayAddingMutators (arr, itemWrapper) {
  function getArrayArgs (items) {
    var args = []
    for (var i = 0; i < items.length; i++) {
      itemWrapper._setValue(items[i], arr)
      args.push(itemWrapper._getValue(arr))
    }
    return args
  }

  var push = arr.push
  var unshift = arr.unshift
  var splice = arr.splice
  var update = arr.update

  if (push) {
    arr.push = function () {
      var args = getArrayArgs(arguments)
      return push.apply(arr, args)
    }
  }

  if (unshift) {
    arr.unshift = function () {
      var args = getArrayArgs(arguments)
      return unshift.apply(arr, args)
    }
  }

  if (splice) {
    arr.splice = function () {
      var args = getArrayArgs(Array.prototype.slice.call(arguments, 2))
      args.unshift(arguments[1])
      args.unshift(arguments[0])
      return splice.apply(arr, args)
    }
  }

  if (update) {
    arr.update = function () {
      var args = getArrayArgs([arguments[1]])
      args.unshift(arguments[0])
      return update.apply(arr, args)
    }
  }
}

function createModelPrototype (def) {
  return def.isArray ? createArrayModelPrototype(def.proto, def.def) : createObjectModelPrototype(def.proto)
}

module.exports = createModelPrototype

},{"./emitter-array":39,"./emitter-event":40,"./emitter-object":41,"./model":44,"./util":49}],47:[function(require,module,exports){
'use strict'

module.exports = {}

},{}],48:[function(require,module,exports){
'use strict'

var prop = require('./prop')
var merge = require('./merge')
var createDef = require('./def')
var Supermodel = require('./supermodel')

function supermodels (schema) {
  var def = createDef(schema)

  function SupermodelConstructor (data) {
    var model = def.isSimple ? def.create() : def.create()._getValue({})

    if (data) {
      // if twe have been passed some
      // data, merge it into the model.
      model.__merge(data)
    }
    return model
  }
  Object.defineProperty(SupermodelConstructor, 'def', {
    value: def // this is used to validate referenced SupermodelConstructors
  })
  SupermodelConstructor.prototype = Supermodel // this shared object is used, as a prototype, to identify SupermodelConstructors
  SupermodelConstructor.constructor = SupermodelConstructor
  return SupermodelConstructor
}

supermodels.prop = prop
supermodels.merge = merge

module.exports = supermodels

},{"./def":38,"./merge":43,"./prop":45,"./supermodel":47}],49:[function(require,module,exports){
'use strict'

var Supermodel = require('./supermodel')

function extend (origin, add) {
  // Don't do anything if add isn't an object
  if (!add || typeof add !== 'object') {
    return origin
  }

  var keys = Object.keys(add)
  var i = keys.length
  while (i--) {
    origin[keys[i]] = add[keys[i]]
  }
  return origin
}

var util = {
  extend: extend,
  typeOf: function (obj) {
    return Object.prototype.toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
  },
  isObject: function (value) {
    return this.typeOf(value) === 'object'
  },
  isArray: function (value) {
    return Array.isArray(value)
  },
  isSimple: function (value) {
    // 'Simple' here means anything
    // other than an Object or an Array
    // i.e. number, string, date, bool, null, undefined, regex...
    return !this.isObject(value) && !this.isArray(value)
  },
  isFunction: function (value) {
    return this.typeOf(value) === 'function'
  },
  isDate: function (value) {
    return this.typeOf(value) === 'date'
  },
  isNull: function (value) {
    return value === null
  },
  isUndefined: function (value) {
    return typeof (value) === 'undefined'
  },
  isNullOrUndefined: function (value) {
    return this.isNull(value) || this.isUndefined(value)
  },
  cast: function (value, type) {
    if (!type) {
      return value
    }

    switch (type) {
      case String:
        return util.castString(value)
      case Number:
        return util.castNumber(value)
      case Boolean:
        return util.castBoolean(value)
      case Date:
        return util.castDate(value)
      case Object:
      case Function:
        return value
      default:
        throw new Error('Invalid cast')
    }
  },
  castString: function (value) {
    if (value === undefined || value === null || util.typeOf(value) === 'string') {
      return value
    }
    return value.toString && value.toString()
  },
  castNumber: function (value) {
    if (value === undefined || value === null) {
      return NaN
    }
    if (util.typeOf(value) === 'number') {
      return value
    }
    return Number(value)
  },
  castBoolean: function (value) {
    if (!value) {
      return false
    }
    var falsey = ['0', 'false', 'off', 'no']
    return falsey.indexOf(value) === -1
  },
  castDate: function (value) {
    if (value === undefined || value === null || util.typeOf(value) === 'date') {
      return value
    }
    return new Date(value)
  },
  isConstructor: function (value) {
    return this.isSimpleConstructor(value) || [Array, Object].indexOf(value) > -1
  },
  isSimpleConstructor: function (value) {
    return [String, Number, Date, Boolean].indexOf(value) > -1
  },
  isSupermodelConstructor: function (value) {
    return this.isFunction(value) && value.prototype === Supermodel
  }
}

module.exports = util

},{"./supermodel":47}],50:[function(require,module,exports){
'use strict'

function ValidationError (target, error, validator, key) {
  this.target = target
  this.error = error
  this.validator = validator

  if (key) {
    this.key = key
  }
}

module.exports = ValidationError

},{}],51:[function(require,module,exports){
'use strict'

var util = require('./util')
var ValidationError = require('./validation-error')

function Wrapper (defaultValue, writable, validators, getter, setter, beforeSet, assert) {
  this.validators = validators

  this._defaultValue = defaultValue
  this._writable = writable
  this._getter = getter
  this._setter = setter
  this._beforeSet = beforeSet
  this._assert = assert
  this.isInitialized = false

  if (!util.isFunction(defaultValue)) {
    this.isInitialized = true

    if (!util.isUndefined(defaultValue)) {
      this._value = defaultValue
    }
  }
}
Wrapper.prototype._initialize = function (parent) {
  if (this.isInitialized) {
    return
  }

  this._setValue(this._defaultValue(parent), parent)
  this.isInitialized = true
}
Wrapper.prototype._getErrors = function (model, key, displayName) {
  model = model || this
  key = key || ''
  displayName = displayName || key

  var simple = this.validators
  var errors = []
  var value = this._getValue(model)
  var validator, error

  for (var i = 0; i < simple.length; i++) {
    validator = simple[i]
    error = validator.call(model, value, displayName)

    if (error) {
      errors.push(new ValidationError(model, error, validator, key))
    }
  }

  return errors
}
Wrapper.prototype._getValue = function (model) {
  return this._getter ? this._getter.call(model) : this._value
}
Wrapper.prototype._setValue = function (value, model) {
  if (!this._writable) {
    throw new Error('Value is readonly')
  }

  // Hook up the parent ref if necessary
  if (value && value.__supermodel && model) {
    if (value.__parent !== model) {
      value.__parent = model
    }
  }

  var val
  if (this._setter) {
    this._setter.call(model, value)
    val = this._getValue(model)
  } else {
    val = this._beforeSet ? this._beforeSet(value) : value
  }

  if (this._assert) {
    this._assert(val)
  }

  this._value = val
}

Object.defineProperties(Wrapper.prototype, {
  value: {
    get: function () {
      return this._getValue()
    },
    set: function (value) {
      this._setValue(value)
    }
  },
  errors: {
    get: function () {
      return this._getErrors()
    }
  }
})
module.exports = Wrapper

},{"./util":49,"./validation-error":50}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvY2xpZW50LmpzIiwiY2xpZW50L2VkaXRvci9pbmRleC5qcyIsImNsaWVudC9maWxlLmpzIiwiY2xpZW50L2ZpbGVzLmpzIiwiY2xpZW50L2ZzLmpzIiwiY2xpZW50L2luZGV4LmpzIiwiY2xpZW50L2lvLmpzIiwiY2xpZW50L21vZGVzLmpzIiwiY2xpZW50L3BhdGNoLmpzIiwiY2xpZW50L3Byb2Nlc3Nlcy9pbmRleC5odG1sIiwiY2xpZW50L3Byb2Nlc3Nlcy9pbmRleC5qcyIsImNsaWVudC9wcm9jZXNzZXMvbW9kZWwuanMiLCJjbGllbnQvcHJvY2Vzc2VzL3Byb2Nlc3MuanMiLCJjbGllbnQvcHJvY2Vzc2VzL3Rhc2suanMiLCJjbGllbnQvcHJvcC5qcyIsImNsaWVudC9yZWNlbnQvaW5kZXguaHRtbCIsImNsaWVudC9yZWNlbnQvaW5kZXguanMiLCJjbGllbnQvc2Vzc2lvbi5qcyIsImNsaWVudC9zZXNzaW9ucy5qcyIsImNsaWVudC9zcGxpdHRlci5qcyIsImNsaWVudC9zdGF0ZS5qcyIsImNsaWVudC90cmVlL2luZGV4LmpzIiwiY2xpZW50L3RyZWUvdmlldy5odG1sIiwiY2xpZW50L3V0aWwuanMiLCJjbGllbnQvdmFsaWRhdG9ycy5qcyIsImNvbmZpZy9jbGllbnQuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3F1ZXJ5c3RyaW5nLWVzMy9kZWNvZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcXVlcnlzdHJpbmctZXMzL2VuY29kZS5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9xdWVyeXN0cmluZy1lczMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaW5jcmVtZW50YWwtZG9tL2Rpc3QvaW5jcmVtZW50YWwtZG9tLWNqcy5qcyIsIm5vZGVfbW9kdWxlcy9uZXMvY2xpZW50LmpzIiwibm9kZV9tb2R1bGVzL25lcy9kaXN0L2NsaWVudC5qcyIsIm5vZGVfbW9kdWxlcy9wYWdlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3BhZ2Uvbm9kZV9tb2R1bGVzL3BhdGgtdG8tcmVnZXhwL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3BhZ2Uvbm9kZV9tb2R1bGVzL3BhdGgtdG8tcmVnZXhwL25vZGVfbW9kdWxlcy9pc2FycmF5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybW9kZWxzLmpzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybW9kZWxzLmpzL2xpYi9kZWYuanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL2VtaXR0ZXItYXJyYXkuanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL2VtaXR0ZXItZXZlbnQuanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL2VtaXR0ZXItb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybW9kZWxzLmpzL2xpYi9mYWN0b3J5LmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybW9kZWxzLmpzL2xpYi9tZXJnZS5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcm1vZGVscy5qcy9saWIvbW9kZWwuanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL3Byb3AuanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL3Byb3RvLmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybW9kZWxzLmpzL2xpYi9zdXBlcm1vZGVsLmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybW9kZWxzLmpzL2xpYi9zdXBlcm1vZGVscy5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcm1vZGVscy5qcy9saWIvdXRpbC5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcm1vZGVscy5qcy9saWIvdmFsaWRhdGlvbi1lcnJvci5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcm1vZGVscy5qcy9saWIvd3JhcHBlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3RwQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM1bUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMzbUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RZQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBOZXMgPSByZXF1aXJlKCduZXMvY2xpZW50JylcbnZhciBob3N0ID0gd2luZG93LmxvY2F0aW9uLmhvc3RcbnZhciBjbGllbnQgPSBuZXcgTmVzLkNsaWVudCgnd3M6Ly8nICsgaG9zdClcblxubW9kdWxlLmV4cG9ydHMgPSBjbGllbnRcbiIsInZhciBzdGF0ZSA9IHJlcXVpcmUoJy4uL3N0YXRlJylcbnZhciBzZXNzaW9ucyA9IHJlcXVpcmUoJy4uL3Nlc3Npb25zJylcbnZhciBmcyA9IHJlcXVpcmUoJy4uL2ZzJylcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpXG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vLi4vY29uZmlnL2NsaWVudCcpXG5cbnZhciBlZGl0b3IgPSB3aW5kb3cuYWNlLmVkaXQoJ2VkaXRvcicpXG5cbi8vIFNldCBlZGl0b3Igb3B0aW9uc1xuZWRpdG9yLnNldE9wdGlvbnMoe1xuICBlbmFibGVTbmlwcGV0czogdHJ1ZSxcbiAgZW5hYmxlQmFzaWNBdXRvY29tcGxldGlvbjogdHJ1ZSxcbiAgZW5hYmxlTGl2ZUF1dG9jb21wbGV0aW9uOiBmYWxzZSxcbiAgZm9udFNpemU6IGNvbmZpZy5hY2UuZm9udFNpemVcbn0pXG5cbmVkaXRvci5jb21tYW5kcy5hZGRDb21tYW5kcyhbe1xuICBuYW1lOiAnaGVscCcsXG4gIGJpbmRLZXk6IHtcbiAgICB3aW46ICdDdHJsLUgnLFxuICAgIG1hYzogJ0NvbW1hbmQtSCdcbiAgfSxcbiAgZXhlYzogZnVuY3Rpb24gKCkge1xuICAgIC8vICRtb2RhbC5vcGVuKHtcbiAgICAvLyAgIHRlbXBsYXRlVXJsOiAnL2NsaWVudC9mcy92aWV3cy9rZXlib2FyZC1zaG9ydGN1dHMuaHRtbCcsXG4gICAgLy8gICBzaXplOiAnbGcnXG4gICAgLy8gfSlcbiAgfSxcbiAgcmVhZE9ubHk6IGZhbHNlIC8vIHRoaXMgY29tbWFuZCBzaG91bGQgYXBwbHkgaW4gcmVhZE9ubHkgbW9kZVxufV0pXG5cbmVkaXRvci5zZXRUaGVtZSgnYWNlL3RoZW1lLycgKyBjb25maWcuYWNlLnRoZW1lKVxuXG5lZGl0b3IuY29tbWFuZHMuYWRkQ29tbWFuZHMoW3tcbiAgbmFtZTogJ3NhdmUnLFxuICBiaW5kS2V5OiB7XG4gICAgd2luOiAnQ3RybC1TJyxcbiAgICBtYWM6ICdDb21tYW5kLVMnXG4gIH0sXG4gIGV4ZWM6IGZ1bmN0aW9uIChlZGl0b3IpIHtcbiAgICB2YXIgZmlsZSA9IHN0YXRlLmN1cnJlbnRcbiAgICB2YXIgZWRpdFNlc3Npb24gPSBzZXNzaW9ucy5maW5kKGZpbGUpLmVkaXRTZXNzaW9uXG4gICAgZnMud3JpdGVGaWxlKGZpbGUucGF0aCwgZWRpdFNlc3Npb24uZ2V0VmFsdWUoKSwgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gdXRpbC5oYW5kbGVFcnJvcihlcnIpXG4gICAgICB9XG4gICAgICBmaWxlLnN0YXQgPSBwYXlsb2FkLnN0YXRcbiAgICAgIGVkaXRTZXNzaW9uLmdldFVuZG9NYW5hZ2VyKCkubWFya0NsZWFuKClcbiAgICB9KVxuICB9LFxuICByZWFkT25seTogZmFsc2Vcbn0sIHtcbiAgbmFtZTogJ3NhdmVhbGwnLFxuICBiaW5kS2V5OiB7XG4gICAgd2luOiAnQ3RybC1TaGlmdC1TJyxcbiAgICBtYWM6ICdDb21tYW5kLU9wdGlvbi1TJ1xuICB9LFxuICBleGVjOiBmdW5jdGlvbiAoZWRpdG9yKSB7XG4gICAgLy8gc2F2ZUFsbCgpXG4gIH0sXG4gIHJlYWRPbmx5OiBmYWxzZVxufV0pXG5cbm1vZHVsZS5leHBvcnRzID0gZWRpdG9yXG4iLCJ2YXIgc3VwZXJtb2RlbHMgPSByZXF1aXJlKCdzdXBlcm1vZGVscy5qcycpXG5cbnZhciBzY2hlbWEgPSB7XG4gIG5hbWU6IFN0cmluZyxcbiAgcGF0aDogU3RyaW5nLFxuICByZWxhdGl2ZURpcjogU3RyaW5nLFxuICByZWxhdGl2ZVBhdGg6IFN0cmluZyxcbiAgZGlyOiBTdHJpbmcsXG4gIGlzRGlyZWN0b3J5OiBCb29sZWFuLFxuICBleHQ6IFN0cmluZyxcbiAgc3RhdDogT2JqZWN0LFxuICBnZXQgaXNGaWxlICgpIHtcbiAgICByZXR1cm4gIXRoaXMuaXNEaXJlY3RvcnlcbiAgfSxcbiAgZXhwYW5kZWQ6IEJvb2xlYW5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdXBlcm1vZGVscyhzY2hlbWEpXG4iLCJ2YXIgc3VwZXJtb2RlbHMgPSByZXF1aXJlKCdzdXBlcm1vZGVscy5qcycpXG52YXIgRmlsZSA9IHJlcXVpcmUoJy4vZmlsZScpXG5cbnZhciBzY2hlbWEgPSB7XG4gIGl0ZW1zOiBbRmlsZV0sXG4gIGZpbmQ6IGZ1bmN0aW9uIChyZWxhdGl2ZVBhdGgpIHtcbiAgICByZXR1cm4gdGhpcy5pdGVtcy5maW5kKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5yZWxhdGl2ZVBhdGggPT09IHJlbGF0aXZlUGF0aFxuICAgIH0pXG4gIH0sXG4gIGZpbmRCeVBhdGg6IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXRlbXMuZmluZChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0ucGF0aCA9PT0gcGF0aFxuICAgIH0pXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdXBlcm1vZGVscyhzY2hlbWEpXG4iLCJ2YXIgY2xpZW50ID0gcmVxdWlyZSgnLi9jbGllbnQnKVxuXG4vLyB2YXIgc3VwZXJtb2RlbHMgPSByZXF1aXJlKCdzdXBlcm1vZGVscy5qcycpXG4vLyB2YXIgRmlsZXMgPSByZXF1aXJlKCcuL2ZpbGVzJylcbi8vIHZhciBTdGF0ZSA9IHJlcXVpcmUoJy4vc3RhdGUnKVxuLy9cbi8vIHZhciBzY2hlbWEgPSB7XG4vLyAgIGZpbGVzOiBGaWxlcyxcbi8vICAgc3RhdGU6IFN0YXRlXG4vLyB9XG4vL1xuLy8gbW9kdWxlLmV4cG9ydHMgPSBzdXBlcm1vZGVscyhzY2hlbWEpXG5cbmZ1bmN0aW9uIHJlYWRGaWxlIChwYXRoLCBjYWxsYmFjaykge1xuICBjbGllbnQucmVxdWVzdCh7XG4gICAgcGF0aDogJy9yZWFkZmlsZT9wYXRoPScgKyBwYXRoLFxuICAgIC8vIHBheWxvYWQ6IHtcbiAgICAvLyAgIHBhdGg6IHBhdGhcbiAgICAvLyB9LFxuICAgIG1ldGhvZDogJ0dFVCdcbiAgfSwgY2FsbGJhY2spXG59XG5cbi8vIGZ1bmN0aW9uIG9wZW5GaWxlIChmaWxlKSB7XG4vLyAgIHZhciBzZXNzaW9uID0gc2Vzc2lvbnMuZmluZChmaWxlKVxuLy8gICBpZiAoc2Vzc2lvbikge1xuLy8gICAgIHN0YXRlLmN1cnJlbnQgPSBmaWxlXG4vLyAgICAgZWRpdG9yLnNldFNlc3Npb24oc2Vzc2lvbi5lZGl0U2Vzc2lvbilcbi8vICAgfSBlbHNlIHtcbi8vICAgICByZWFkRmlsZShmaWxlLnBhdGgsIGZ1bmN0aW9uIChlcnIsIHBheWxvYWQpIHtcbi8vICAgICAgIGlmIChlcnIpIHtcbi8vICAgICAgICAgcmV0dXJuIGhhbmRsZUVycm9yKGVycilcbi8vICAgICAgIH1cbi8vXG4vLyAgICAgICBpZiAoIXN0YXRlLnJlY2VudC5maW5kQnlQYXRoKGZpbGUucGF0aCkpIHtcbi8vICAgICAgICAgc3RhdGUucmVjZW50LnVuc2hpZnQoZmlsZSlcbi8vICAgICAgIH1cbi8vXG4vLyAgICAgICBzZXNzaW9uID0gc2Vzc2lvbnMuYWRkKGZpbGUsIHBheWxvYWQuY29udGVudHMpXG4vLyAgICAgICBzdGF0ZS5jdXJyZW50ID0gZmlsZVxuLy8gICAgICAgZWRpdG9yLnNldFNlc3Npb24oc2Vzc2lvbi5lZGl0U2Vzc2lvbilcbi8vICAgICB9KVxuLy8gICB9XG4vLyB9XG5cbi8vIGZ1bmN0aW9uIGNsb3NlRmlsZSAoZmlsZSkge1xuLy8gICB2YXIgY2xvc2UgPSBmYWxzZVxuLy8gICB2YXIgc2Vzc2lvbiA9IHNlc3Npb25zLmZpbmQoZmlsZSlcbi8vXG4vLyAgIGlmIChzZXNzaW9uICYmIHNlc3Npb24uaXNEaXJ0eSkge1xuLy8gICAgIGlmICh3aW5kb3cuY29uZmlybSgnVGhlcmUgYXJlIHVuc2F2ZWQgY2hhbmdlcyB0byB0aGlzIGZpbGUuIEFyZSB5b3Ugc3VyZT8nKSkge1xuLy8gICAgICAgY2xvc2UgPSB0cnVlXG4vLyAgICAgfVxuLy8gICB9IGVsc2Uge1xuLy8gICAgIGNsb3NlID0gdHJ1ZVxuLy8gICB9XG4vL1xuLy8gICBpZiAoY2xvc2UpIHtcbi8vICAgICAvLyBSZW1vdmUgZnJvbSByZWNlbnQgZmlsZXNcbi8vICAgICBzdGF0ZS5yZWNlbnQuc3BsaWNlKHN0YXRlLnJlY2VudC5pbmRleE9mKGZpbGUpLCAxKVxuLy9cbi8vICAgICBpZiAoc2Vzc2lvbikge1xuLy8gICAgICAgLy8gUmVtb3ZlIHNlc3Npb25cbi8vICAgICAgIHNlc3Npb25zLml0ZW1zLnNwbGljZShzZXNzaW9ucy5pdGVtcy5pbmRleE9mKHNlc3Npb24pLCAxKVxuLy9cbi8vICAgICAgIGlmIChzdGF0ZS5jdXJyZW50ID09PSBmaWxlKSB7XG4vLyAgICAgICAgIGlmIChzZXNzaW9ucy5pdGVtcy5sZW5ndGgpIHtcbi8vICAgICAgICAgICAvLyBPcGVuIHRoZSBuZXh0IHNlc3Npb25cbi8vICAgICAgICAgICBvcGVuRmlsZShzZXNzaW9ucy5pdGVtc1swXS5maWxlKVxuLy8gICAgICAgICB9IGVsc2UgaWYgKHN0YXRlLnJlY2VudC5sZW5ndGgpIHtcbi8vICAgICAgICAgICAvLyBPcGVuIHRoZSBuZXh0IGZpbGVcbi8vICAgICAgICAgICBvcGVuRmlsZShzdGF0ZS5yZWNlbnRbMF0pXG4vLyAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgc3RhdGUuY3VycmVudCA9IG51bGxcbi8vICAgICAgICAgICBlZGl0b3Iuc2V0U2Vzc2lvbihudWxsKVxuLy8gICAgICAgICB9XG4vLyAgICAgICB9XG4vLyAgICAgfVxuLy8gICB9XG4vLyB9XG5cbmZ1bmN0aW9uIHdyaXRlRmlsZSAocGF0aCwgY29udGVudHMsIGNhbGxiYWNrKSB7XG4gIGNsaWVudC5yZXF1ZXN0KHtcbiAgICBwYXRoOiAnL3dyaXRlZmlsZScsXG4gICAgcGF5bG9hZDoge1xuICAgICAgcGF0aDogcGF0aCxcbiAgICAgIGNvbnRlbnRzOiBjb250ZW50c1xuICAgIH0sXG4gICAgbWV0aG9kOiAnUFVUJ1xuICB9LCBjYWxsYmFjaylcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIC8vIHJ1bjogcnVuLFxuICAvLyBvcGVuRmlsZTogb3BlbkZpbGUsXG4gIC8vIGNsb3NlRmlsZTogY2xvc2VGaWxlLFxuICByZWFkRmlsZTogcmVhZEZpbGUsXG4gIHdyaXRlRmlsZTogd3JpdGVGaWxlLy8gLFxuICAvLyBoYW5kbGVFcnJvcjogaGFuZGxlRXJyb3Jcbn1cbiIsInZhciBwYWdlID0gcmVxdWlyZSgncGFnZScpXG52YXIgcXMgPSByZXF1aXJlKCdxdWVyeXN0cmluZycpXG52YXIgZnMgPSByZXF1aXJlKCcuL2ZzJylcbnZhciBzdGF0ZSA9IHJlcXVpcmUoJy4vc3RhdGUnKVxudmFyIHNlc3Npb25zID0gcmVxdWlyZSgnLi9zZXNzaW9ucycpXG52YXIgRmlsZXMgPSByZXF1aXJlKCcuL2ZpbGVzJylcbnZhciBUcmVlID0gcmVxdWlyZSgnLi90cmVlJylcbnZhciBSZWNlbnQgPSByZXF1aXJlKCcuL3JlY2VudCcpXG52YXIgUHJvY2Vzc2VzID0gcmVxdWlyZSgnLi9wcm9jZXNzZXMnKVxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKVxudmFyIHNwbGl0dGVyID0gcmVxdWlyZSgnLi9zcGxpdHRlcicpXG52YXIgZWRpdG9yID0gcmVxdWlyZSgnLi9lZGl0b3InKVxudmFyIGNsaWVudCA9IHJlcXVpcmUoJy4vY2xpZW50JylcblxudmFyIHByb2Nlc3Nlc0VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Byb2Nlc3NlcycpXG52YXIgcmVjZW50RWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVjZW50JylcbnZhciB0cmVlRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJlZScpXG52YXIgd29ya3NwYWNlc0VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dvcmtzcGFjZXMnKVxuXG53aW5kb3cub25iZWZvcmV1bmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChzZXNzaW9ucy5kaXJ0eS5sZW5ndGgpIHtcbiAgICByZXR1cm4gJ1Vuc2F2ZWQgY2hhbmdlcyB3aWxsIGJlIGxvc3QgLSBhcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gbGVhdmU/J1xuICB9XG59XG5cbmNsaWVudC5jb25uZWN0KGZ1bmN0aW9uIChlcnIpIHtcbiAgaWYgKGVycikge1xuICAgIHJldHVybiB1dGlsLmhhbmRsZUVycm9yKGVycilcbiAgfVxuXG4gIGNsaWVudC5yZXF1ZXN0KCcvd2F0Y2hlZCcsIGZ1bmN0aW9uIChlcnIsIHBheWxvYWQpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICByZXR1cm4gdXRpbC5oYW5kbGVFcnJvcihlcnIpXG4gICAgfVxuXG4gICAgLy8gSW5pdGlhbGl6ZSB0aGUgZmlsZXNcbiAgICB2YXIgZmlsZXMgPSBuZXcgRmlsZXMoe1xuICAgICAgaXRlbXM6IHBheWxvYWQud2F0Y2hlZFxuICAgIH0pXG5cbiAgICAvLyBMb2FkIHRoZSBzdGF0ZSBmcm9tIGxvY2FsU3RvcmFnZVxuICAgIHN0YXRlLmxvYWQoZmlsZXMpXG5cbiAgICAvLyBTdWJzY3JpYmUgdG8gd2F0Y2hlZCBmaWxlIGNoYW5nZXNcbiAgICAvLyB0aGF0IGhhcHBlbiBvbiB0aGUgZmlsZSBzeXN0ZW1cbiAgICAvLyBSZWxvYWQgdGhlIHNlc3Npb24gaWYgdGhlIGNoYW5nZXNcbiAgICAvLyBkbyBub3QgbWF0Y2ggdGhlIHN0YXRlIG9mIHRoZSBmaWxlXG4gICAgY2xpZW50LnN1YnNjcmliZSgnL2NoYW5nZScsIGZ1bmN0aW9uIChwYXlsb2FkKSB7XG4gICAgICBzZXNzaW9ucy5pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChzZXNzaW9uKSB7XG4gICAgICAgIHZhciBmaWxlID0gc2Vzc2lvbi5maWxlXG4gICAgICAgIGlmIChwYXlsb2FkLnBhdGggPT09IGZpbGUucGF0aCkge1xuICAgICAgICAgIGlmIChwYXlsb2FkLnN0YXQubXRpbWUgIT09IGZpbGUuc3RhdC5tdGltZSkge1xuICAgICAgICAgICAgZnMucmVhZEZpbGUoZmlsZS5wYXRoLCBmdW5jdGlvbiAoZXJyLCBwYXlsb2FkKSB7XG4gICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXRpbC5oYW5kbGVFcnJvcihlcnIpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZmlsZS5zdGF0ID0gcGF5bG9hZC5zdGF0XG4gICAgICAgICAgICAgIHNlc3Npb24uZWRpdFNlc3Npb24uc2V0VmFsdWUocGF5bG9hZC5jb250ZW50cylcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIHV0aWwuaGFuZGxlRXJyb3IoZXJyKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICAvLyBTYXZlIHN0YXRlIG9uIHBhZ2UgdW5sb2FkXG4gICAgd2luZG93Lm9udW5sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ2xvZycpXG4gICAgICBzdGF0ZS5zYXZlKGZpbGVzKVxuICAgIH1cblxuICAgIC8vIENyZWF0ZSBhIG5ldyBub2lkZSBpbnN0YW5jZVxuICAgIC8vIHZhciBub2lkZSA9IG5ldyBOb2lkZSh7XG4gICAgLy8gICBzdGF0ZTogc3RhdGUsXG4gICAgLy8gICBmaWxlczogZmlsZXNcbiAgICAvLyB9KVxuXG4gICAgLy8gQnVpbGQgdGhlIHRyZWUgcGFuZVxuICAgIHZhciB0cmVlVmlldyA9IG5ldyBUcmVlKHRyZWVFbCwgZmlsZXMsIHN0YXRlKVxuICAgIHRyZWVWaWV3LnJlbmRlcigpXG5cbiAgICAvLyBCdWlsZCB0aGUgcmVjZW50IGxpc3QgcGFuZVxuICAgIHZhciByZWNlbnRWaWV3ID0gbmV3IFJlY2VudChyZWNlbnRFbCwgc3RhdGUpXG4gICAgcmVjZW50Vmlldy5yZW5kZXIoKVxuXG4gICAgLy8gQnVpbGQgdGhlIHByb2Nzc2VzIHBhbmVcbiAgICB2YXIgcHJvY2Vzc2VzVmlldyA9IG5ldyBQcm9jZXNzZXMocHJvY2Vzc2VzRWwpXG4gICAgcHJvY2Vzc2VzVmlldy5yZW5kZXIoKVxuXG4gICAgZnVuY3Rpb24gcmVzaXplRWRpdG9yICgpIHtcbiAgICAgIGVkaXRvci5yZXNpemUoKVxuICAgICAgcHJvY2Vzc2VzVmlldy5lZGl0b3IucmVzaXplKClcbiAgICB9XG5cbiAgICBzcGxpdHRlcihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2lkZWJhci13b3Jrc3BhY2VzJyksIHJlc2l6ZUVkaXRvcilcbiAgICBzcGxpdHRlcihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd29ya3NwYWNlcy1pbmZvJyksIHJlc2l6ZUVkaXRvcilcbiAgICBzcGxpdHRlcihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFpbi1mb290ZXInKSwgcmVzaXplRWRpdG9yKVxuXG4gICAgcGFnZSgnLycsIGZ1bmN0aW9uIChjdHgpIHtcbiAgICAgIHdvcmtzcGFjZXNFbC5jbGFzc05hbWUgPSAnd2VsY29tZSdcbiAgICB9KVxuXG4gICAgcGFnZSgnL2ZpbGUnLCBmdW5jdGlvbiAoY3R4LCBuZXh0KSB7XG4gICAgICB2YXIgcGF0aCA9IHFzLnBhcnNlKGN0eC5xdWVyeXN0cmluZykucGF0aFxuICAgICAgdmFyIGZpbGUgPSBmaWxlcy5maW5kKHBhdGgpXG5cbiAgICAgIGlmICghZmlsZSkge1xuICAgICAgICByZXR1cm4gbmV4dCgpXG4gICAgICB9XG5cbiAgICAgIHZhciBzZXNzaW9uID0gc2Vzc2lvbnMuZmluZChmaWxlKVxuXG4gICAgICBmdW5jdGlvbiBzZXRTZXNzaW9uICgpIHtcbiAgICAgICAgd29ya3NwYWNlc0VsLmNsYXNzTmFtZSA9ICdlZGl0b3InXG5cbiAgICAgICAgLy8gVXBkYXRlIHN0YXRlXG4gICAgICAgIHN0YXRlLmN1cnJlbnQgPSBmaWxlXG5cbiAgICAgICAgdmFyIGl0ZW1zID0gc3RhdGUucmVjZW50Lml0ZW1zXG4gICAgICAgIGlmIChpdGVtcy5pbmRleE9mKGZpbGUpIDwgMCkge1xuICAgICAgICAgIGl0ZW1zLnVuc2hpZnQoZmlsZSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldCB0aGUgZWRpdG9yIHNlc3Npb25cbiAgICAgICAgZWRpdG9yLnNldFNlc3Npb24oc2Vzc2lvbi5lZGl0U2Vzc2lvbilcbiAgICAgICAgZWRpdG9yLnJlc2l6ZSgpXG4gICAgICB9XG5cbiAgICAgIGlmIChzZXNzaW9uKSB7XG4gICAgICAgIHNldFNlc3Npb24oKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZnMucmVhZEZpbGUocGF0aCwgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiB1dGlsLmhhbmRsZUVycm9yKGVycilcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZXNzaW9uID0gc2Vzc2lvbnMuYWRkKGZpbGUsIHBheWxvYWQuY29udGVudHMpXG4gICAgICAgICAgc2V0U2Vzc2lvbigpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSlcblxuICAgIHBhZ2UoJyonLCBmdW5jdGlvbiAoY3R4KSB7XG4gICAgICB3b3Jrc3BhY2VzRWwuY2xhc3NOYW1lID0gJ25vdC1mb3VuZCdcbiAgICB9KVxuXG4gICAgcGFnZSh7XG4gICAgICBoYXNoYmFuZzogdHJ1ZVxuICAgIH0pXG4gIH0pXG59KVxuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKVxudmFyIGNsaWVudCA9IHJlcXVpcmUoJy4vY2xpZW50JylcblxuZnVuY3Rpb24gcnVuIChjb21tYW5kLCBuYW1lLCBjYWxsYmFjaykge1xuICBpZiAodHlwZW9mIG5hbWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjYWxsYmFjayA9IG5hbWVcbiAgICBuYW1lID0gY29tbWFuZFxuICB9XG4gIGlmICghbmFtZSkge1xuICAgIG5hbWUgPSBjb21tYW5kXG4gIH1cblxuICBjbGllbnQucmVxdWVzdCh7XG4gICAgcGF0aDogJy9pbycsXG4gICAgcGF5bG9hZDoge1xuICAgICAgbmFtZTogbmFtZSxcbiAgICAgIGNvbW1hbmQ6IGNvbW1hbmRcbiAgICB9LFxuICAgIG1ldGhvZDogJ1BPU1QnXG4gIH0sIGZ1bmN0aW9uIChlcnIsIHBheWxvYWQpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICB1dGlsLmhhbmRsZUVycm9yKGVycilcbiAgICB9XG4gICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soZXJyLCBwYXlsb2FkKVxuICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgcnVuOiBydW5cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGZpbGUpIHtcbiAgdmFyIG1vZGVzID0ge1xuICAgICcuanMnOiAnYWNlL21vZGUvamF2YXNjcmlwdCcsXG4gICAgJy5jc3MnOiAnYWNlL21vZGUvY3NzJyxcbiAgICAnLnNjc3MnOiAnYWNlL21vZGUvc2NzcycsXG4gICAgJy5sZXNzJzogJ2FjZS9tb2RlL2xlc3MnLFxuICAgICcuaHRtbCc6ICdhY2UvbW9kZS9odG1sJyxcbiAgICAnLmh0bSc6ICdhY2UvbW9kZS9odG1sJyxcbiAgICAnLmVqcyc6ICdhY2UvbW9kZS9odG1sJyxcbiAgICAnLmpzb24nOiAnYWNlL21vZGUvanNvbicsXG4gICAgJy5tZCc6ICdhY2UvbW9kZS9tYXJrZG93bicsXG4gICAgJy5jb2ZmZWUnOiAnYWNlL21vZGUvY29mZmVlJyxcbiAgICAnLmphZGUnOiAnYWNlL21vZGUvamFkZScsXG4gICAgJy5waHAnOiAnYWNlL21vZGUvcGhwJyxcbiAgICAnLnB5JzogJ2FjZS9tb2RlL3B5dGhvbicsXG4gICAgJy5zYXNzJzogJ2FjZS9tb2RlL3Nhc3MnLFxuICAgICcudHh0JzogJ2FjZS9tb2RlL3RleHQnLFxuICAgICcudHlwZXNjcmlwdCc6ICdhY2UvbW9kZS90eXBlc2NyaXB0JyxcbiAgICAnLmdpdGlnbm9yZSc6ICdhY2UvbW9kZS9naXRpZ25vcmUnLFxuICAgICcueG1sJzogJ2FjZS9tb2RlL3htbCdcbiAgfVxuXG4gIHJldHVybiBtb2Rlc1tmaWxlLmV4dF1cbn1cbiIsInZhciBwYXRjaCA9IHJlcXVpcmUoJ2luY3JlbWVudGFsLWRvbScpLnBhdGNoXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGVsLCB2aWV3LCBkYXRhKSB7XG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKVxuICBpZiAoYXJncy5sZW5ndGggPD0gMykge1xuICAgIHBhdGNoKGVsLCB2aWV3LCBkYXRhKVxuICB9IGVsc2Uge1xuICAgIHBhdGNoKGVsLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2aWV3LmFwcGx5KHRoaXMsIGFyZ3Muc2xpY2UoMikpXG4gICAgfSlcbiAgfVxufVxuIiwidmFyIEluY3JlbWVudGFsRE9NID0gcmVxdWlyZSgnaW5jcmVtZW50YWwtZG9tJylcbnZhciBwYXRjaCA9IEluY3JlbWVudGFsRE9NLnBhdGNoXG52YXIgZWxlbWVudE9wZW4gPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50T3BlblxudmFyIGVsZW1lbnRWb2lkID0gSW5jcmVtZW50YWxET00uZWxlbWVudFZvaWRcbnZhciBlbGVtZW50Q2xvc2UgPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50Q2xvc2VcbnZhciBlbGVtZW50UGxhY2Vob2xkZXIgPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50UGxhY2Vob2xkZXJcbnZhciB0ZXh0ID0gSW5jcmVtZW50YWxET00udGV4dFxuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XG52YXIgaG9pc3RlZDEgPSBbXCJjbGFzc1wiLCBcImNvbnRyb2xcIl1cbnZhciBob2lzdGVkMiA9IFtcImNsYXNzXCIsIFwiaW5wdXQtZ3JvdXBcIl1cbnZhciBob2lzdGVkMyA9IFtcImNsYXNzXCIsIFwiaW5wdXQtZ3JvdXAtYnRuIGRyb3B1cFwiXVxudmFyIGhvaXN0ZWQ0ID0gW1widHlwZVwiLCBcImJ1dHRvblwiLCBcImNsYXNzXCIsIFwiYnRuIGJ0bi1kZWZhdWx0IGJ0bi1zbSBkcm9wZG93bi10b2dnbGVcIiwgXCJkYXRhLXRvZ2dsZVwiLCBcImRyb3Bkb3duXCJdXG52YXIgaG9pc3RlZDUgPSBbXCJjbGFzc1wiLCBcImNhcmV0XCJdXG52YXIgaG9pc3RlZDYgPSBbXCJjbGFzc1wiLCBcImRyb3Bkb3duLW1lbnVcIl1cbnZhciBob2lzdGVkNyA9IFtcImhyZWZcIiwgXCIjXCJdXG52YXIgaG9pc3RlZDggPSBbXCJ0eXBlXCIsIFwidGV4dFwiLCBcImNsYXNzXCIsIFwiZm9ybS1jb250cm9sIGlucHV0LXNtXCIsIFwibmFtZVwiLCBcImNvbW1hbmRcIiwgXCJpZFwiLCBcImNvbW1hbmRcIiwgXCJyZXF1aXJlZFwiLCBcIlwiLCBcImF1dG9jb21wbGV0ZVwiLCBcIm9mZlwiXVxudmFyIGhvaXN0ZWQ5ID0gW1wiY2xhc3NcIiwgXCJpbnB1dC1ncm91cC1idG5cIl1cbnZhciBob2lzdGVkMTAgPSBbXCJjbGFzc1wiLCBcImJ0biBidG4tZGVmYXVsdCBidG4tc21cIiwgXCJ0eXBlXCIsIFwic3VibWl0XCJdXG52YXIgaG9pc3RlZDExID0gW1wiY2xhc3NcIiwgXCJuYXYgbmF2LXRhYnNcIl1cbnZhciBob2lzdGVkMTIgPSBbXCJjbGFzc1wiLCBcImJ0biBidG4tZGVmYXVsdCBidG4teHNcIl1cbnZhciBob2lzdGVkMTMgPSBbXCJjbGFzc1wiLCBcImZhIGZhLXN0b3BcIl1cbnZhciBob2lzdGVkMTQgPSBbXCJjbGFzc1wiLCBcImJ0biBidG4tZGVmYXVsdCBidG4teHNcIl1cbnZhciBob2lzdGVkMTUgPSBbXCJjbGFzc1wiLCBcImZhIGZhLXJlZnJlc2hcIl1cbnZhciBob2lzdGVkMTYgPSBbXCJjbGFzc1wiLCBcImJ0biBidG4tZGVmYXVsdCBidG4teHNcIl1cbnZhciBob2lzdGVkMTcgPSBbXCJjbGFzc1wiLCBcImZhIGZhLWNsb3NlXCJdXG52YXIgaG9pc3RlZDE4ID0gW1wiY2xhc3NcIiwgXCJwcm9jZXNzZXNcIl1cbnZhciBob2lzdGVkMTkgPSBbXCJjbGFzc1wiLCBcImxpc3RcIl1cbnZhciBob2lzdGVkMjAgPSBbXCJjbGFzc1wiLCBcIm5hdiBuYXYtdGFic1wiXVxudmFyIGhvaXN0ZWQyMSA9IFtcImNsYXNzXCIsIFwiYnRuIGJ0bi1kZWZhdWx0IGJ0bi14c1wiXVxudmFyIGhvaXN0ZWQyMiA9IFtcImNsYXNzXCIsIFwiZmEgZmEtc3RvcFwiXVxudmFyIGhvaXN0ZWQyMyA9IFtcImNsYXNzXCIsIFwiYnRuIGJ0bi1kZWZhdWx0IGJ0bi14c1wiXVxudmFyIGhvaXN0ZWQyNCA9IFtcImNsYXNzXCIsIFwiZmEgZmEtcmVmcmVzaFwiXVxudmFyIGhvaXN0ZWQyNSA9IFtcImNsYXNzXCIsIFwiYnRuIGJ0bi1kZWZhdWx0IGJ0bi14c1wiXVxudmFyIGhvaXN0ZWQyNiA9IFtcImNsYXNzXCIsIFwiZmEgZmEtY2xvc2VcIl1cbnZhciBob2lzdGVkMjcgPSBbXCJpZFwiLCBcImxpc3Qtb3V0cHV0XCIsIFwiY2xhc3NcIiwgXCJzcGxpdHRlclwiXVxudmFyIGhvaXN0ZWQyOCA9IFtcImNsYXNzXCIsIFwib3V0cHV0XCJdXG5cbnJldHVybiBmdW5jdGlvbiBkZXNjcmlwdGlvbiAobW9kZWwsIHNob3dPdXRwdXQpIHtcbiAgZWxlbWVudE9wZW4oXCJkaXZcIiwgbnVsbCwgaG9pc3RlZDEpXG4gICAgZWxlbWVudE9wZW4oXCJmb3JtXCIsIG51bGwsIG51bGwsIFwib25zdWJtaXRcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgIG1vZGVsLnJ1bih0aGlzLmNvbW1hbmQudmFsdWUpfSlcbiAgICAgIGVsZW1lbnRPcGVuKFwiZGl2XCIsIG51bGwsIGhvaXN0ZWQyKVxuICAgICAgICBlbGVtZW50T3BlbihcImRpdlwiLCBudWxsLCBob2lzdGVkMylcbiAgICAgICAgICBlbGVtZW50T3BlbihcImJ1dHRvblwiLCBudWxsLCBob2lzdGVkNClcbiAgICAgICAgICAgIHRleHQoXCJUYXNrIFwiKVxuICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJzcGFuXCIsIG51bGwsIGhvaXN0ZWQ1KVxuICAgICAgICAgICAgZWxlbWVudENsb3NlKFwic3BhblwiKVxuICAgICAgICAgIGVsZW1lbnRDbG9zZShcImJ1dHRvblwiKVxuICAgICAgICAgIGVsZW1lbnRPcGVuKFwidWxcIiwgbnVsbCwgaG9pc3RlZDYpXG4gICAgICAgICAgICA7KEFycmF5LmlzQXJyYXkobW9kZWwudGFza3MpID8gbW9kZWwudGFza3MgOiBPYmplY3Qua2V5cyhtb2RlbC50YXNrcykpLmZvckVhY2goZnVuY3Rpb24odGFzaywgJGluZGV4KSB7XG4gICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwibGlcIiwgdGFzay5uYW1lKVxuICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYVwiLCBudWxsLCBob2lzdGVkNywgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgICAgICAgICAgICBtb2RlbC5jb21tYW5kID0gJ25wbSBydW4gJyArIHRhc2submFtZTsgalF1ZXJ5KCcjY29tbWFuZCcpLmZvY3VzKCl9KVxuICAgICAgICAgICAgICAgICAgdGV4dChcIlwiICsgKHRhc2submFtZSkgKyBcIlwiKVxuICAgICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImFcIilcbiAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICAgICAgICAgIH0sIG1vZGVsLnRhc2tzKVxuICAgICAgICAgIGVsZW1lbnRDbG9zZShcInVsXCIpXG4gICAgICAgIGVsZW1lbnRDbG9zZShcImRpdlwiKVxuICAgICAgICBlbGVtZW50T3BlbihcImlucHV0XCIsIG51bGwsIGhvaXN0ZWQ4LCBcInZhbHVlXCIsIG1vZGVsLmNvbW1hbmQpXG4gICAgICAgIGVsZW1lbnRDbG9zZShcImlucHV0XCIpXG4gICAgICAgIGVsZW1lbnRPcGVuKFwic3BhblwiLCBudWxsLCBob2lzdGVkOSlcbiAgICAgICAgICBlbGVtZW50T3BlbihcImJ1dHRvblwiLCBudWxsLCBob2lzdGVkMTApXG4gICAgICAgICAgICB0ZXh0KFwiUnVuXCIpXG4gICAgICAgICAgZWxlbWVudENsb3NlKFwiYnV0dG9uXCIpXG4gICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgIGVsZW1lbnRDbG9zZShcImRpdlwiKVxuICAgIGVsZW1lbnRDbG9zZShcImZvcm1cIilcbiAgICBlbGVtZW50T3BlbihcInVsXCIsIG51bGwsIGhvaXN0ZWQxMSlcbiAgICAgIDsoQXJyYXkuaXNBcnJheShtb2RlbC5wcm9jZXNzZXMpID8gbW9kZWwucHJvY2Vzc2VzIDogT2JqZWN0LmtleXMobW9kZWwucHJvY2Vzc2VzKSkuZm9yRWFjaChmdW5jdGlvbihwcm9jZXNzLCAkaW5kZXgpIHtcbiAgICAgICAgZWxlbWVudE9wZW4oXCJsaVwiLCBwcm9jZXNzLnBpZClcbiAgICAgICAgICBlbGVtZW50T3BlbihcImFcIiwgbnVsbCwgbnVsbCwgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAgICRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgICAgICBzaG93T3V0cHV0KHByb2Nlc3MpfSlcbiAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwic3BhblwiLCBudWxsLCBudWxsLCBcImNsYXNzXCIsICdjaXJjbGUgJyArICghcHJvY2Vzcy5pc0FsaXZlID8gJ2RlYWQnIDogKHByb2Nlc3MuaXNBY3RpdmUgPyAnYWxpdmUgYWN0aXZlJyA6ICdhbGl2ZScpKSlcbiAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgICAgIHRleHQoXCIgXFxcbiAgICAgICAgICAgICAgICAgICAgICBcIiArIChwcm9jZXNzLm5hbWUgfHwgcHJvY2Vzcy5jb21tYW5kKSArIFwiXCIpXG4gICAgICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIilcbiAgICAgICAgICAgICAgdGV4dChcIltcIiArIChwcm9jZXNzLnBpZCkgKyBcIl1cIilcbiAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgICAgIGlmIChwcm9jZXNzLmlzQWxpdmUpIHtcbiAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJidXR0b25cIiwgXCJraWxsLXRhYlwiLCBob2lzdGVkMTIsIFwib25jbGlja1wiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgICAgICAgICAgbW9kZWwua2lsbChwcm9jZXNzKX0pXG4gICAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJpXCIsIG51bGwsIGhvaXN0ZWQxMylcbiAgICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJpXCIpXG4gICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImJ1dHRvblwiKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFwcm9jZXNzLmlzQWxpdmUpIHtcbiAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJidXR0b25cIiwgXCJyZXN1cnJlY3QtdGFiXCIsIGhvaXN0ZWQxNCwgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICAgICAgICBtb2RlbC5yZXN1cnJlY3QocHJvY2Vzcyl9KVxuICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiaVwiLCBudWxsLCBob2lzdGVkMTUpXG4gICAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwiaVwiKVxuICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJidXR0b25cIilcbiAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJidXR0b25cIiwgXCJyZW1vdmUtdGFiXCIsIGhvaXN0ZWQxNiwgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICAgICAgICBtb2RlbC5yZW1vdmUocHJvY2Vzcyl9KVxuICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiaVwiLCBudWxsLCBob2lzdGVkMTcpXG4gICAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwiaVwiKVxuICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJidXR0b25cIilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJhXCIpXG4gICAgICAgIGVsZW1lbnRDbG9zZShcImxpXCIpXG4gICAgICB9LCBtb2RlbC5wcm9jZXNzZXMpXG4gICAgZWxlbWVudENsb3NlKFwidWxcIilcbiAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gIGVsZW1lbnRPcGVuKFwiZGl2XCIsIG51bGwsIGhvaXN0ZWQxOClcbiAgICBlbGVtZW50T3BlbihcImRpdlwiLCBudWxsLCBob2lzdGVkMTkpXG4gICAgICBpZiAobW9kZWwucHJvY2Vzc2VzLmxlbmd0aCkge1xuICAgICAgICBlbGVtZW50T3BlbihcInVsXCIsIG51bGwsIGhvaXN0ZWQyMClcbiAgICAgICAgICA7KEFycmF5LmlzQXJyYXkobW9kZWwucHJvY2Vzc2VzKSA/IG1vZGVsLnByb2Nlc3NlcyA6IE9iamVjdC5rZXlzKG1vZGVsLnByb2Nlc3NlcykpLmZvckVhY2goZnVuY3Rpb24ocHJvY2VzcywgJGluZGV4KSB7XG4gICAgICAgICAgICBlbGVtZW50T3BlbihcImxpXCIsIHByb2Nlc3MucGlkKVxuICAgICAgICAgICAgICBlbGVtZW50T3BlbihcImFcIiwgbnVsbCwgbnVsbCwgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICAgICAgICBzaG93T3V0cHV0KHByb2Nlc3MpfSlcbiAgICAgICAgICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgbnVsbCwgXCJjbGFzc1wiLCAnY2lyY2xlICcgKyAoIXByb2Nlc3MuaXNBbGl2ZSA/ICdkZWFkJyA6IChwcm9jZXNzLmlzQWN0aXZlID8gJ2FsaXZlIGFjdGl2ZScgOiAnYWxpdmUnKSkpXG4gICAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwic3BhblwiKVxuICAgICAgICAgICAgICAgIHRleHQoXCIgXFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiICsgKHByb2Nlc3MubmFtZSB8fCBwcm9jZXNzLmNvbW1hbmQpICsgXCJcIilcbiAgICAgICAgICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIilcbiAgICAgICAgICAgICAgICAgIHRleHQoXCJbXCIgKyAocHJvY2Vzcy5waWQpICsgXCJdXCIpXG4gICAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwic3BhblwiKVxuICAgICAgICAgICAgICAgIGlmIChwcm9jZXNzLmlzQWxpdmUpIHtcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYnV0dG9uXCIsIFwia2lsbFwiLCBob2lzdGVkMjEsIFwib25jbGlja1wiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgbW9kZWwua2lsbChwcm9jZXNzKX0pXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiaVwiLCBudWxsLCBob2lzdGVkMjIpXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImlcIilcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImJ1dHRvblwiKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXByb2Nlc3MuaXNBbGl2ZSkge1xuICAgICAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJidXR0b25cIiwgXCJyZXN1cnJlY3RcIiwgaG9pc3RlZDIzLCBcIm9uY2xpY2tcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgIG1vZGVsLnJlc3VycmVjdChwcm9jZXNzKX0pXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiaVwiLCBudWxsLCBob2lzdGVkMjQpXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImlcIilcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImJ1dHRvblwiKVxuICAgICAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJidXR0b25cIiwgXCJyZW1vdmVcIiwgaG9pc3RlZDI1LCBcIm9uY2xpY2tcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgIG1vZGVsLnJlbW92ZShwcm9jZXNzKX0pXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiaVwiLCBudWxsLCBob2lzdGVkMjYpXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImlcIilcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImJ1dHRvblwiKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwiYVwiKVxuICAgICAgICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICAgICAgICB9LCBtb2RlbC5wcm9jZXNzZXMpXG4gICAgICAgIGVsZW1lbnRDbG9zZShcInVsXCIpXG4gICAgICB9XG4gICAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gICAgZWxlbWVudFBsYWNlaG9sZGVyKFwicGxhY2Vob2xkZXJcIiwgXCJsaXN0LW91dHB1dFwiLCBob2lzdGVkMjcpXG4gICAgZWxlbWVudFBsYWNlaG9sZGVyKFwicGxhY2Vob2xkZXJcIiwgXCJvdXRwdXRcIiwgaG9pc3RlZDI4KVxuICBlbGVtZW50Q2xvc2UoXCJkaXZcIilcbn1cbn0pKCk7XG4iLCJ2YXIgcGF0Y2ggPSByZXF1aXJlKCdpbmNyZW1lbnRhbC1kb20nKS5wYXRjaFxudmFyIHZpZXcgPSByZXF1aXJlKCcuL2luZGV4Lmh0bWwnKVxudmFyIE1vZGVsID0gcmVxdWlyZSgnLi9tb2RlbCcpXG52YXIgVGFzayA9IHJlcXVpcmUoJy4vdGFzaycpXG52YXIgUHJvY2VzcyA9IHJlcXVpcmUoJy4vcHJvY2VzcycpXG52YXIgc3BsaXR0ZXIgPSByZXF1aXJlKCcuLi9zcGxpdHRlcicpXG52YXIgY2xpZW50ID0gcmVxdWlyZSgnLi4vY2xpZW50JylcbnZhciBmcyA9IHJlcXVpcmUoJy4uL2ZzJylcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpXG5cbmZ1bmN0aW9uIFByb2Nlc3NlcyAoZWwpIHtcbiAgdmFyIGVkaXRvclxuXG4gIGNsaWVudC5zdWJzY3JpYmUoJy9pbycsIGZ1bmN0aW9uIChwYXlsb2FkKSB7XG4gICAgdmFyIHByb2Nlc3MgPSBtb2RlbC5wcm9jZXNzZXMuZmluZChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0ucGlkID09PSBwYXlsb2FkLnBpZFxuICAgIH0pXG5cbiAgICBpZiAocHJvY2Vzcykge1xuICAgICAgdmFyIHNlc3Npb24gPSBwcm9jZXNzLnNlc3Npb25cbiAgICAgIHNlc3Npb24uaW5zZXJ0KHtcbiAgICAgICAgcm93OiBzZXNzaW9uLmdldExlbmd0aCgpLFxuICAgICAgICBjb2x1bW46IDBcbiAgICAgIH0sIHBheWxvYWQuZGF0YSlcbiAgICAgIHNlc3Npb24uZ2V0U2VsZWN0aW9uKCkubW92ZUN1cnNvckZpbGVFbmQoKVxuICAgICAgcHJvY2Vzcy5pc0FjdGl2ZSA9IHRydWVcbiAgICB9XG4gIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICByZXR1cm4gdXRpbC5oYW5kbGVFcnJvcihlcnIpXG4gICAgfVxuICB9KVxuXG4gIGZ1bmN0aW9uIHNob3dPdXRwdXQgKHByb2Nlc3MpIHtcbiAgICBlZGl0b3Iuc2V0U2Vzc2lvbihwcm9jZXNzLnNlc3Npb24pXG4gIH1cblxuICBjbGllbnQuc3Vic2NyaWJlKCcvaW8vcGlkcycsIGxvYWRQaWRzLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgcmV0dXJuIHV0aWwuaGFuZGxlRXJyb3IoZXJyKVxuICAgIH1cbiAgfSlcblxuICBjbGllbnQucmVxdWVzdCh7XG4gICAgcGF0aDogJy9pby9waWRzJ1xuICB9LCBmdW5jdGlvbiAoZXJyLCBwYXlsb2FkKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgdXRpbC5oYW5kbGVFcnJvcihlcnIpXG4gICAgfVxuICAgIGxvYWRQaWRzKHBheWxvYWQpXG4gIH0pXG5cbiAgZnVuY3Rpb24gbG9hZFBpZHMgKHByb2NzKSB7XG4gICAgY29uc29sZS5sb2coJ3Byb2NzJywgcHJvY3MpXG4gICAgdmFyIHByb2NcbiAgICB2YXIgYm9ybiA9IFtdXG5cbiAgICAvLyBmaW5kIGFueSBuZXcgcHJvY2Vzc2VzXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9jcy5sZW5ndGg7IGkrKykge1xuICAgICAgcHJvYyA9IHByb2NzW2ldXG5cbiAgICAgIHZhciBwcm9jZXNzID0gbW9kZWwucHJvY2Vzc2VzLmZpbmQoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIGl0ZW0ucGlkID09PSBwcm9jLnBpZFxuICAgICAgfSlcblxuICAgICAgaWYgKCFwcm9jZXNzKSB7XG4gICAgICAgIC8vIG5ldyBjaGlsZCBwcm9jZXNzIGZvdW5kLiBBZGQgaXRcbiAgICAgICAgLy8gYW5kIHNldCBpdCdzIGNhY2hlZCBidWZmZXIgaW50byBzZXNzaW9uXG4gICAgICAgIHByb2Nlc3MgPSBuZXcgUHJvY2Vzcyhwcm9jKVxuICAgICAgICBwcm9jZXNzLnNlc3Npb24uc2V0VmFsdWUocHJvYy5idWZmZXIpXG4gICAgICAgIGJvcm4ucHVzaChwcm9jZXNzKVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHNodXQgZG93biBwcm9jZXNzZXMgdGhhdCBoYXZlIGRpZWRcbiAgICBtb2RlbC5wcm9jZXNzZXMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgdmFyIG1hdGNoID0gcHJvY3MuZmluZChmdW5jdGlvbiAoY2hlY2spIHtcbiAgICAgICAgcmV0dXJuIGl0ZW0ucGlkID09PSBjaGVjay5waWRcbiAgICAgIH0pXG4gICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgIC8vIGl0ZW0ucGlkID0gMFxuICAgICAgICBpdGVtLmlzQWxpdmUgPSBmYWxzZVxuICAgICAgICBpdGVtLmlzQWN0aXZlID0gZmFsc2VcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgLy8gaW5zZXJ0IGFueSBuZXcgY2hpbGQgcHJvY2Vzc2VzXG4gICAgaWYgKGJvcm4ubGVuZ3RoKSB7XG4gICAgICBtb2RlbC5wcm9jZXNzZXMuc3BsaWNlLmFwcGx5KG1vZGVsLnByb2Nlc3NlcywgWzAsIDBdLmNvbmNhdChib3JuKSlcbiAgICAgIHNob3dPdXRwdXQoYm9yblswXSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFkVGFza3MgKCkge1xuICAgIGZzLnJlYWRGaWxlKCdwYWNrYWdlLmpzb24nLCBmdW5jdGlvbiAoZXJyLCBwYXlsb2FkKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHV0aWwuaGFuZGxlRXJyb3IoZXJyKVxuICAgICAgfVxuXG4gICAgICB2YXIgcGtnID0ge31cbiAgICAgIHRyeSB7XG4gICAgICAgIHBrZyA9IEpTT04ucGFyc2UocGF5bG9hZC5jb250ZW50cylcbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG5cbiAgICAgIGNvbnNvbGUubG9nKHBrZylcbiAgICAgIGlmIChwa2cuc2NyaXB0cykge1xuICAgICAgICB2YXIgdGFza3MgPSBbXVxuICAgICAgICBmb3IgKHZhciBzY3JpcHQgaW4gcGtnLnNjcmlwdHMpIHtcbiAgICAgICAgICBpZiAoc2NyaXB0LnN1YnN0cigwLCAzKSA9PT0gJ3ByZScgfHwgc2NyaXB0LnN1YnN0cigwLCA0KSA9PT0gJ3Bvc3QnKSB7XG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRhc2tzLnB1c2gobmV3IFRhc2soe1xuICAgICAgICAgICAgbmFtZTogc2NyaXB0LFxuICAgICAgICAgICAgY29tbWFuZDogcGtnLnNjcmlwdHNbc2NyaXB0XVxuICAgICAgICAgIH0pKVxuICAgICAgICB9XG4gICAgICAgIG1vZGVsLnRhc2tzID0gdGFza3NcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgcmVhZFRhc2tzKClcblxuICBmdW5jdGlvbiB1cGRhdGUgKG1vZGVsKSB7XG4gICAgdmlldyhtb2RlbCwgc2hvd091dHB1dClcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlciAoKSB7XG4gICAgcGF0Y2goZWwsIHVwZGF0ZSwgbW9kZWwpXG5cbiAgICBpZiAoIWVkaXRvcikge1xuICAgICAgdmFyIG91dHB1dEVsID0gZWwucXVlcnlTZWxlY3RvcignLm91dHB1dCcpXG4gICAgICBlZGl0b3IgPSB3aW5kb3cuYWNlLmVkaXQob3V0cHV0RWwpXG5cbiAgICAgIGVkaXRvci5zZXRUaGVtZSgnYWNlL3RoZW1lL3Rlcm1pbmFsJylcbiAgICAgIGVkaXRvci5zZXRSZWFkT25seSh0cnVlKVxuICAgICAgZWRpdG9yLnJlbmRlcmVyLnNldFNob3dHdXR0ZXIoZmFsc2UpXG4gICAgICBlZGl0b3Iuc2V0SGlnaGxpZ2h0QWN0aXZlTGluZShmYWxzZSlcbiAgICAgIGVkaXRvci5zZXRTaG93UHJpbnRNYXJnaW4oZmFsc2UpXG4gICAgICBzcGxpdHRlcihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGlzdC1vdXRwdXQnKSwgZWRpdG9yLnJlc2l6ZS5iaW5kKGVkaXRvcikpXG4gICAgfVxuICB9XG5cbiAgdmFyIG1vZGVsID0gbmV3IE1vZGVsKClcblxuICBtb2RlbC5vbignY2hhbmdlJywgcmVuZGVyKVxuXG4gIHRoaXMubW9kZWwgPSBtb2RlbFxuICB0aGlzLnJlbmRlciA9IHJlbmRlclxuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICBlZGl0b3I6IHtcbiAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZWRpdG9yXG4gICAgICB9XG4gICAgfVxuICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFByb2Nlc3Nlc1xuIiwidmFyIHN1cGVybW9kZWxzID0gcmVxdWlyZSgnc3VwZXJtb2RlbHMuanMnKVxudmFyIGlvID0gcmVxdWlyZSgnLi4vaW8nKVxudmFyIGNsaWVudCA9IHJlcXVpcmUoJy4uL2NsaWVudCcpXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKVxudmFyIFRhc2sgPSByZXF1aXJlKCcuL3Rhc2snKVxudmFyIFByb2Nlc3MgPSByZXF1aXJlKCcuL3Byb2Nlc3MnKVxuXG52YXIgc2NoZW1hID0ge1xuICB0YXNrczogW1Rhc2tdLFxuICBjb21tYW5kOiBTdHJpbmcsXG4gIGN1cnJlbnQ6IFByb2Nlc3MsXG4gIHByb2Nlc3NlczogW1Byb2Nlc3NdLFxuICBnZXQgZGVhZCAoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvY2Vzc2VzLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgcmV0dXJuICFpdGVtLmlzQWxpdmVcbiAgICB9KVxuICB9LFxuICBydW46IGZ1bmN0aW9uIChjb21tYW5kLCBuYW1lKSB7XG4gICAgaW8ucnVuKGNvbW1hbmQsIG5hbWUsIGZ1bmN0aW9uIChlcnIsIHBheWxvYWQpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIHV0aWwuaGFuZGxlRXJyb3IoZXJyKVxuICAgICAgfVxuICAgIH0pXG4gIH0sXG4gIHJlbW92ZTogZnVuY3Rpb24gKHByb2Nlc3MpIHtcbiAgICB2YXIgcHJvY2Vzc2VzID0gdGhpcy5wcm9jZXNzZXNcbiAgICBwcm9jZXNzZXMuc3BsaWNlKHByb2Nlc3Nlcy5pbmRleE9mKHByb2Nlc3MpLCAxKVxuICB9LFxuICByZW1vdmVBbGxEZWFkOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGRlYWQgPSB0aGlzLmRlYWRcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlYWQubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMucmVtb3ZlKGRlYWRbaV0pXG4gICAgfVxuICB9LFxuICByZXN1cnJlY3Q6IGZ1bmN0aW9uIChwcm9jZXNzKSB7XG4gICAgdGhpcy5yZW1vdmUocHJvY2VzcylcbiAgICB0aGlzLnJ1bihwcm9jZXNzLmNvbW1hbmQsIHByb2Nlc3MubmFtZSlcbiAgfSxcbiAga2lsbDogZnVuY3Rpb24gKHByb2Nlc3MpIHtcbiAgICBjbGllbnQucmVxdWVzdCh7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIHBhdGg6ICcvaW8va2lsbCcsXG4gICAgICBwYXlsb2FkOiB7XG4gICAgICAgIHBpZDogcHJvY2Vzcy5waWRcbiAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiAoZXJyLCBwYXlsb2FkKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHV0aWwuaGFuZGxlRXJyb3IoZXJyKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdXBlcm1vZGVscyhzY2hlbWEpXG4iLCJ2YXIgc3VwZXJtb2RlbHMgPSByZXF1aXJlKCdzdXBlcm1vZGVscy5qcycpXG52YXIgcHJvcCA9IHJlcXVpcmUoJy4uL3Byb3AnKVxudmFyIEVkaXRTZXNzaW9uID0gd2luZG93LmFjZS5yZXF1aXJlKCdhY2UvZWRpdF9zZXNzaW9uJykuRWRpdFNlc3Npb25cblxuZnVuY3Rpb24gY3JlYXRlU2Vzc2lvbiAoKSB7XG4gIHZhciBlZGl0U2Vzc2lvbiA9IG5ldyBFZGl0U2Vzc2lvbignJywgJ2FjZS9tb2RlL3NoJylcbiAgZWRpdFNlc3Npb24uc2V0VXNlV29ya2VyKGZhbHNlKVxuICByZXR1cm4gZWRpdFNlc3Npb25cbn1cbnZhciBzY2hlbWEgPSB7XG4gIHBpZDogcHJvcChOdW1iZXIpLFxuICBuYW1lOiBwcm9wKFN0cmluZykucmVxdWlyZWQoKSxcbiAgY29tbWFuZDogcHJvcChTdHJpbmcpLnJlcXVpcmVkKCksXG4gIGlzQWxpdmU6IHByb3AoQm9vbGVhbikucmVxdWlyZWQoKS52YWx1ZSh0cnVlKSxcbiAgc2Vzc2lvbjogcHJvcChPYmplY3QpLnZhbHVlKGNyZWF0ZVNlc3Npb24pLFxuICBnZXQgaXNBY3RpdmUgKCkge1xuICAgIHJldHVybiAhIXRoaXMuX2lzQWN0aXZlXG4gIH0sXG4gIHNldCBpc0FjdGl2ZSAodmFsdWUpIHtcbiAgICBpZiAodGhpcy5faXNBY3RpdmUgIT09IHZhbHVlKSB7XG4gICAgICB2YXIgdGltZW91dCA9IHRoaXMuX3RpbWVvdXRcbiAgICAgIGlmICh0aW1lb3V0KSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KVxuICAgICAgfVxuXG4gICAgICB2YXIgb2xkVmFsdWUgPSB0aGlzLl9pc0FjdGl2ZVxuICAgICAgdGhpcy5faXNBY3RpdmUgPSB2YWx1ZVxuICAgICAgY29uc29sZS5sb2coJ2lzQWN0aXZlJywgdmFsdWUsIG9sZFZhbHVlKVxuICAgICAgdGhpcy5fX25vdGlmeUNoYW5nZSgnaXNBY3RpdmUnLCB2YWx1ZSwgb2xkVmFsdWUpXG4gICAgICBpZiAodGhpcy5faXNBY3RpdmUpIHtcbiAgICAgICAgdGhpcy5fdGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCd0b21lb3V0JylcbiAgICAgICAgICB0aGlzLmlzQWN0aXZlID0gZmFsc2VcbiAgICAgICAgfS5iaW5kKHRoaXMpLCAxNTAwKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN1cGVybW9kZWxzKHNjaGVtYSlcbiIsInZhciBzdXBlcm1vZGVscyA9IHJlcXVpcmUoJ3N1cGVybW9kZWxzLmpzJylcbnZhciBwcm9wID0gcmVxdWlyZSgnLi4vcHJvcCcpXG5cbnZhciBzY2hlbWEgPSB7XG4gIG5hbWU6IHByb3AoU3RyaW5nKS5yZXF1aXJlZCgpLFxuICBjb21tYW5kOiBwcm9wKFN0cmluZykucmVxdWlyZWQoKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN1cGVybW9kZWxzKHNjaGVtYSlcbiIsInZhciBzdXBlcm1vZGVscyA9IHJlcXVpcmUoJ3N1cGVybW9kZWxzLmpzJylcbnZhciB2YWxpZGF0b3JzID0gcmVxdWlyZSgnLi92YWxpZGF0b3JzJylcbnZhciBwcm9wID0gc3VwZXJtb2RlbHMucHJvcCgpXG5cbi8vIFJlZ2lzdGVyaW5nIHZhbGlkYXRvcnMgbWFrZXMgdGhlbSBwYXJ0XG4vLyBvZiB0aGUgZmx1ZW50IGludGVyZmFjZSB3aGVuIHVzaW5nIGBwcm9wYC5cbnByb3AucmVnaXN0ZXIoJ3JlcXVpcmVkJywgdmFsaWRhdG9ycy5yZXF1aXJlZClcblxubW9kdWxlLmV4cG9ydHMgPSBwcm9wXG4iLCJ2YXIgSW5jcmVtZW50YWxET00gPSByZXF1aXJlKCdpbmNyZW1lbnRhbC1kb20nKVxudmFyIHBhdGNoID0gSW5jcmVtZW50YWxET00ucGF0Y2hcbnZhciBlbGVtZW50T3BlbiA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRPcGVuXG52YXIgZWxlbWVudFZvaWQgPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50Vm9pZFxudmFyIGVsZW1lbnRDbG9zZSA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRDbG9zZVxudmFyIGVsZW1lbnRQbGFjZWhvbGRlciA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRQbGFjZWhvbGRlclxudmFyIHRleHQgPSBJbmNyZW1lbnRhbERPTS50ZXh0XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcbnZhciBob2lzdGVkMSA9IFtcImNsYXNzXCIsIFwibGlzdC1ncm91cFwiXVxudmFyIGhvaXN0ZWQyID0gW1wiY2xhc3NcIiwgXCJjbG9zZVwiXVxudmFyIGhvaXN0ZWQzID0gW1wiY2xhc3NcIiwgXCJuYW1lIGljb24gaWNvbi1maWxlLXRleHRcIl1cbnZhciBob2lzdGVkNCA9IFtcImNsYXNzXCIsIFwibGlzdC1ncm91cC1pdGVtLXRleHRcIl1cblxucmV0dXJuIGZ1bmN0aW9uIHJlY2VudCAoZmlsZXMsIGN1cnJlbnQsIG9uQ2xpY2tDbG9zZSkge1xuICBlbGVtZW50T3BlbihcImRpdlwiLCBudWxsLCBob2lzdGVkMSwgXCJzdHlsZVwiLCB7ZGlzcGxheTogZmlsZXMubGVuZ3RoID8gJycgOiAnbm9uZSd9KVxuICAgIDsoQXJyYXkuaXNBcnJheShmaWxlcykgPyBmaWxlcyA6IE9iamVjdC5rZXlzKGZpbGVzKSkuZm9yRWFjaChmdW5jdGlvbihmaWxlLCAkaW5kZXgpIHtcbiAgICAgIGVsZW1lbnRPcGVuKFwiYVwiLCBmaWxlLnJlbGF0aXZlUGF0aCwgbnVsbCwgXCJ0aXRsZVwiLCBmaWxlLnJlbGF0aXZlUGF0aCwgXCJocmVmXCIsICcvZmlsZT9wYXRoPScgKyBmaWxlLnJlbGF0aXZlUGF0aCwgXCJjbGFzc1wiLCAnbGlzdC1ncm91cC1pdGVtJyArIChmaWxlID09PSBjdXJyZW50ID8gJyBhY3RpdmUnIDogJycpKVxuICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgaG9pc3RlZDIsIFwib25jbGlja1wiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgICAgb25DbGlja0Nsb3NlKGZpbGUpfSlcbiAgICAgICAgICB0ZXh0KFwiw5dcIilcbiAgICAgICAgZWxlbWVudENsb3NlKFwic3BhblwiKVxuICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgaG9pc3RlZDMsIFwiZGF0YS1uYW1lXCIsIGZpbGUubmFtZSwgXCJkYXRhLXBhdGhcIiwgZmlsZS5yZWxhdGl2ZVBhdGgpXG4gICAgICAgICAgdGV4dChcIlwiICsgKGZpbGUubmFtZSkgKyBcIlwiKVxuICAgICAgICBlbGVtZW50Q2xvc2UoXCJzcGFuXCIpXG4gICAgICAgIGlmIChmYWxzZSkge1xuICAgICAgICAgIGVsZW1lbnRPcGVuKFwicFwiLCBudWxsLCBob2lzdGVkNClcbiAgICAgICAgICAgIHRleHQoXCJcIiArICgnLi8nICsgKGZpbGUucmVsYXRpdmVQYXRoICE9PSBmaWxlLm5hbWUgPyBmaWxlLnJlbGF0aXZlRGlyIDogJycpKSArIFwiXCIpXG4gICAgICAgICAgZWxlbWVudENsb3NlKFwicFwiKVxuICAgICAgICB9XG4gICAgICBlbGVtZW50Q2xvc2UoXCJhXCIpXG4gICAgfSwgZmlsZXMpXG4gIGVsZW1lbnRDbG9zZShcImRpdlwiKVxufVxufSkoKTtcbiIsInZhciBwYWdlID0gcmVxdWlyZSgncGFnZScpXG52YXIgcGF0Y2ggPSByZXF1aXJlKCcuLi9wYXRjaCcpXG52YXIgc3RhdGUgPSByZXF1aXJlKCcuLi9zdGF0ZScpXG52YXIgdmlldyA9IHJlcXVpcmUoJy4vaW5kZXguaHRtbCcpXG52YXIgc2Vzc2lvbnMgPSByZXF1aXJlKCcuLi9zZXNzaW9ucycpXG5cbmZ1bmN0aW9uIGNsb3NlRmlsZSAoZmlsZSkge1xuICB2YXIgc2Vzc2lvbiA9IHNlc3Npb25zLmZpbmQoZmlsZSlcblxuICB2YXIgY2xvc2UgPSBzZXNzaW9uICYmIHNlc3Npb24uaXNEaXJ0eVxuICAgID8gd2luZG93LmNvbmZpcm0oJ1RoZXJlIGFyZSB1bnNhdmVkIGNoYW5nZXMgdG8gdGhpcyBmaWxlLiBBcmUgeW91IHN1cmU/JylcbiAgICA6IHRydWVcblxuICBpZiAoY2xvc2UpIHtcbiAgICAvLyBSZW1vdmUgZnJvbSByZWNlbnQgZmlsZXNcbiAgICBzdGF0ZS5yZWNlbnQuaXRlbXMuc3BsaWNlKHN0YXRlLnJlY2VudC5pdGVtcy5pbmRleE9mKGZpbGUpLCAxKVxuXG4gICAgaWYgKHNlc3Npb24pIHtcbiAgICAgIC8vIFJlbW92ZSBzZXNzaW9uXG4gICAgICBzZXNzaW9ucy5pdGVtcy5zcGxpY2Uoc2Vzc2lvbnMuaXRlbXMuaW5kZXhPZihzZXNzaW9uKSwgMSlcblxuICAgICAgaWYgKHN0YXRlLmN1cnJlbnQgPT09IGZpbGUpIHtcbiAgICAgICAgaWYgKHNlc3Npb25zLml0ZW1zLmxlbmd0aCkge1xuICAgICAgICAgIC8vIE9wZW4gdGhlIGZpcnN0IHNlc3Npb25cbiAgICAgICAgICBwYWdlKCcvZmlsZT9wYXRoPScgKyBzZXNzaW9ucy5pdGVtc1swXS5maWxlLnJlbGF0aXZlUGF0aClcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZS5yZWNlbnQuaXRlbXMubGVuZ3RoKSB7XG4gICAgICAgICAgcGFnZSgnL2ZpbGU/cGF0aD0nICsgc3RhdGUucmVjZW50Lml0ZW1zWzBdLnJlbGF0aXZlUGF0aClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwYWdlKCcvJylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBSZWNlbnQgKGVsKSB7XG4gIGZ1bmN0aW9uIG9uQ2xpY2tDbG9zZSAoZmlsZSkge1xuICAgIGNsb3NlRmlsZShmaWxlKVxuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyICgpIHtcbiAgICBwYXRjaChlbCwgdmlldywgc3RhdGUucmVjZW50Lml0ZW1zLCBzdGF0ZS5jdXJyZW50LCBvbkNsaWNrQ2xvc2UpXG4gIH1cblxuICBzdGF0ZS5vbignY2hhbmdlJywgcmVuZGVyKVxuXG4gIHRoaXMucmVuZGVyID0gcmVuZGVyXG59XG5cbm1vZHVsZS5leHBvcnRzID0gUmVjZW50XG4iLCJ2YXIgc3VwZXJtb2RlbHMgPSByZXF1aXJlKCdzdXBlcm1vZGVscy5qcycpXG52YXIgRmlsZSA9IHJlcXVpcmUoJy4vZmlsZScpXG52YXIgcHJvcCA9IHN1cGVybW9kZWxzLnByb3AoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN1cGVybW9kZWxzKHtcbiAgZmlsZTogRmlsZSxcbiAgZWRpdFNlc3Npb246IE9iamVjdCxcbiAgY3JlYXRlZDogcHJvcChEYXRlKS52YWx1ZShEYXRlLm5vdyksXG4gIG1vZGlmaWVkOiBwcm9wKERhdGUpLnZhbHVlKERhdGUubm93KSxcbiAgZ2V0IGlzQ2xlYW4gKCkge1xuICAgIHJldHVybiB0aGlzLmVkaXRTZXNzaW9uLmdldFVuZG9NYW5hZ2VyKCkuaXNDbGVhbigpXG4gIH0sXG4gIGdldCBpc0RpcnR5ICgpIHtcbiAgICByZXR1cm4gIXRoaXMuaXNDbGVhblxuICB9XG59KVxuIiwidmFyIHN1cGVybW9kZWxzID0gcmVxdWlyZSgnc3VwZXJtb2RlbHMuanMnKVxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZy9jbGllbnQnKVxudmFyIG1vZGVzID0gcmVxdWlyZSgnLi9tb2RlcycpXG52YXIgU2Vzc2lvbiA9IHJlcXVpcmUoJy4vc2Vzc2lvbicpXG52YXIgRWRpdFNlc3Npb24gPSB3aW5kb3cuYWNlLnJlcXVpcmUoJ2FjZS9lZGl0X3Nlc3Npb24nKS5FZGl0U2Vzc2lvblxudmFyIFVuZG9NYW5hZ2VyID0gd2luZG93LmFjZS5yZXF1aXJlKCdhY2UvdW5kb21hbmFnZXInKS5VbmRvTWFuYWdlclxuXG52YXIgc2NoZW1hID0ge1xuICBpdGVtczogW1Nlc3Npb25dLFxuICBnZXQgZGlydHkgKCkge1xuICAgIHJldHVybiB0aGlzLml0ZW1zLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgcmV0dXJuICFpdGVtLmlzQ2xlYW5cbiAgICB9KVxuICB9LFxuICBmaW5kOiBmdW5jdGlvbiAoZmlsZSkge1xuICAgIHJldHVybiB0aGlzLml0ZW1zLmZpbmQoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHJldHVybiBpdGVtLmZpbGUgPT09IGZpbGVcbiAgICB9KVxuICB9LFxuICBhZGQ6IGZ1bmN0aW9uIChmaWxlLCBjb250ZW50cykge1xuICAgIHZhciBlZGl0U2Vzc2lvbiA9IG5ldyBFZGl0U2Vzc2lvbihjb250ZW50cywgbW9kZXMoZmlsZSkpXG4gICAgZWRpdFNlc3Npb24uc2V0TW9kZShtb2RlcyhmaWxlKSlcbiAgICBlZGl0U2Vzc2lvbi5zZXRVc2VXb3JrZXIoZmFsc2UpXG4gICAgZWRpdFNlc3Npb24uc2V0VGFiU2l6ZShjb25maWcuYWNlLnRhYlNpemUpXG4gICAgZWRpdFNlc3Npb24uc2V0VXNlU29mdFRhYnMoY29uZmlnLmFjZS51c2VTb2Z0VGFicylcbiAgICBlZGl0U2Vzc2lvbi5zZXRVbmRvTWFuYWdlcihuZXcgVW5kb01hbmFnZXIoKSlcblxuICAgIHZhciBzZXNzaW9uID0gbmV3IFNlc3Npb24oe1xuICAgICAgZmlsZTogZmlsZSxcbiAgICAgIGVkaXRTZXNzaW9uOiBlZGl0U2Vzc2lvblxuICAgIH0pXG5cbiAgICB0aGlzLml0ZW1zLnB1c2goc2Vzc2lvbilcblxuICAgIHJldHVybiBzZXNzaW9uXG4gIH1cbn1cblxudmFyIFNlc3Npb25zID0gc3VwZXJtb2RlbHMoc2NoZW1hKVxuXG52YXIgc2Vzc2lvbnMgPSBuZXcgU2Vzc2lvbnMoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNlc3Npb25zXG4iLCJ2YXIgdyA9IHdpbmRvd1xudmFyIGQgPSBkb2N1bWVudFxuXG5mdW5jdGlvbiBzcGxpdHRlciAoaGFuZGxlLCBvbkVuZENhbGxiYWNrKSB7XG4gIHZhciBsYXN0XG4gIHZhciBob3Jpem9udGFsID0gaGFuZGxlLmNsYXNzTGlzdC5jb250YWlucygnaG9yaXpvbnRhbCcpXG4gIHZhciBlbDEgPSBoYW5kbGUucHJldmlvdXNFbGVtZW50U2libGluZ1xuICB2YXIgZWwyID0gaGFuZGxlLm5leHRFbGVtZW50U2libGluZ1xuXG4gIGZ1bmN0aW9uIG9uRHJhZyAoZSkge1xuICAgIGlmIChob3Jpem9udGFsKSB7XG4gICAgICB2YXIgaFQsIGhCXG4gICAgICB2YXIgaERpZmYgPSBlLmNsaWVudFkgLSBsYXN0XG5cbiAgICAgIGhUID0gZC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGVsMSwgJycpLmdldFByb3BlcnR5VmFsdWUoJ2hlaWdodCcpXG4gICAgICBoQiA9IGQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbDIsICcnKS5nZXRQcm9wZXJ0eVZhbHVlKCdoZWlnaHQnKVxuICAgICAgaFQgPSBwYXJzZUludChoVCwgMTApICsgaERpZmZcbiAgICAgIGhCID0gcGFyc2VJbnQoaEIsIDEwKSAtIGhEaWZmXG4gICAgICBlbDEuc3R5bGUuaGVpZ2h0ID0gaFQgKyAncHgnXG4gICAgICBlbDIuc3R5bGUuaGVpZ2h0ID0gaEIgKyAncHgnXG4gICAgICBsYXN0ID0gZS5jbGllbnRZXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB3TCwgd1JcbiAgICAgIHZhciB3RGlmZiA9IGUuY2xpZW50WCAtIGxhc3RcblxuICAgICAgd0wgPSBkLmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwxLCAnJykuZ2V0UHJvcGVydHlWYWx1ZSgnd2lkdGgnKVxuICAgICAgd1IgPSBkLmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwyLCAnJykuZ2V0UHJvcGVydHlWYWx1ZSgnd2lkdGgnKVxuICAgICAgd0wgPSBwYXJzZUludCh3TCwgMTApICsgd0RpZmZcbiAgICAgIHdSID0gcGFyc2VJbnQod1IsIDEwKSAtIHdEaWZmXG4gICAgICBlbDEuc3R5bGUud2lkdGggPSB3TCArICdweCdcbiAgICAgIGVsMi5zdHlsZS53aWR0aCA9IHdSICsgJ3B4J1xuICAgICAgbGFzdCA9IGUuY2xpZW50WFxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uRW5kRHJhZyAoZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHcucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgb25EcmFnKVxuICAgIHcucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIG9uRW5kRHJhZylcbiAgICBpZiAob25FbmRDYWxsYmFjaykge1xuICAgICAgb25FbmRDYWxsYmFjaygpXG4gICAgfVxuICAgIC8vIG5vaWRlLmVkaXRvci5yZXNpemUoKVxuICAgIC8vIHZhciBwcm9jZXNzZXMgPSByZXF1aXJlKCcuL3Byb2Nlc3NlcycpXG4gICAgLy8gcHJvY2Vzc2VzLmVkaXRvci5yZXNpemUoKVxuICB9XG5cbiAgaGFuZGxlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBsYXN0ID0gaG9yaXpvbnRhbCA/IGUuY2xpZW50WSA6IGUuY2xpZW50WFxuXG4gICAgdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBvbkRyYWcpXG4gICAgdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgb25FbmREcmFnKVxuICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNwbGl0dGVyXG4iLCJ2YXIgc3VwZXJtb2RlbHMgPSByZXF1aXJlKCdzdXBlcm1vZGVscy5qcycpXG52YXIgRmlsZSA9IHJlcXVpcmUoJy4vZmlsZScpXG52YXIgRmlsZXMgPSByZXF1aXJlKCcuL2ZpbGVzJylcbnZhciBzdG9yYWdlS2V5ID0gJ25vaWRlJ1xuXG5mdW5jdGlvbiBzYXZlU3RhdGUgKGZpbGVzKSB7XG4gIHZhciBzdG9yYWdlID0ge1xuICAgIHJlY2VudDogdGhpcy5yZWNlbnQuaXRlbXMubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5wYXRoXG4gICAgfSksXG4gICAgZXhwYW5kZWQ6IGZpbGVzLml0ZW1zLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0uZXhwYW5kZWRcbiAgICB9KS5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHJldHVybiBpdGVtLnBhdGhcbiAgICB9KVxuICB9XG4gIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShzdG9yYWdlS2V5LCBKU09OLnN0cmluZ2lmeShzdG9yYWdlKSlcbn1cblxuZnVuY3Rpb24gbG9hZFN0YXRlIChmaWxlcykge1xuICB2YXIgc3RvcmFnZSA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShzdG9yYWdlS2V5KVxuICBzdG9yYWdlID0gc3RvcmFnZSA/IEpTT04ucGFyc2Uoc3RvcmFnZSkgOiB7fVxuXG4gIHZhciBkaXIsIGZpbGUsIGlcbiAgdGhpcy5yZWNlbnQgPSBuZXcgRmlsZXMoKVxuXG4gIGlmIChzdG9yYWdlLnJlY2VudCkge1xuICAgIGZvciAoaSA9IDA7IGkgPCBzdG9yYWdlLnJlY2VudC5sZW5ndGg7IGkrKykge1xuICAgICAgZmlsZSA9IGZpbGVzLmZpbmRCeVBhdGgoc3RvcmFnZS5yZWNlbnRbaV0pXG4gICAgICBpZiAoZmlsZSkge1xuICAgICAgICB0aGlzLnJlY2VudC5pdGVtcy5wdXNoKGZpbGUpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHN0b3JhZ2UuZXhwYW5kZWQpIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgc3RvcmFnZS5leHBhbmRlZC5sZW5ndGg7IGkrKykge1xuICAgICAgZGlyID0gZmlsZXMuZmluZEJ5UGF0aChzdG9yYWdlLmV4cGFuZGVkW2ldKVxuICAgICAgaWYgKGRpcikge1xuICAgICAgICBkaXIuZXhwYW5kZWQgPSB0cnVlXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbnZhciBzY2hlbWEgPSB7XG4gIHJlY2VudDogRmlsZXMsXG4gIGN1cnJlbnQ6IEZpbGUsXG4gIHNhdmU6IHNhdmVTdGF0ZSxcbiAgbG9hZDogbG9hZFN0YXRlXG59XG5cbnZhciBTdGF0ZSA9IHN1cGVybW9kZWxzKHNjaGVtYSlcblxudmFyIHN0YXRlID0gbmV3IFN0YXRlKClcblxubW9kdWxlLmV4cG9ydHMgPSBzdGF0ZVxuIiwidmFyIHBhdGNoID0gcmVxdWlyZSgnLi4vcGF0Y2gnKVxudmFyIHZpZXcgPSByZXF1aXJlKCcuL3ZpZXcuaHRtbCcpXG5cbmZ1bmN0aW9uIG1ha2VUcmVlIChmaWxlcykge1xuICBmdW5jdGlvbiB0cmVlaWZ5IChsaXN0LCBpZEF0dHIsIHBhcmVudEF0dHIsIGNoaWxkcmVuQXR0cikge1xuICAgIHZhciB0cmVlTGlzdCA9IFtdXG4gICAgdmFyIGxvb2t1cCA9IHt9XG4gICAgdmFyIGksIG9ialxuXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iaiA9IGxpc3RbaV1cbiAgICAgIGxvb2t1cFtvYmpbaWRBdHRyXV0gPSBvYmpcbiAgICAgIG9ialtjaGlsZHJlbkF0dHJdID0gW11cbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqID0gbGlzdFtpXVxuICAgICAgdmFyIHBhcmVudCA9IGxvb2t1cFtvYmpbcGFyZW50QXR0cl1dXG4gICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgIG9iai5wYXJlbnQgPSBwYXJlbnRcbiAgICAgICAgbG9va3VwW29ialtwYXJlbnRBdHRyXV1bY2hpbGRyZW5BdHRyXS5wdXNoKG9iailcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyZWVMaXN0LnB1c2gob2JqKVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cmVlTGlzdFxuICB9XG4gIHJldHVybiB0cmVlaWZ5KGZpbGVzLml0ZW1zLCAncGF0aCcsICdkaXInLCAnY2hpbGRyZW4nKVxufVxuXG5mdW5jdGlvbiBUcmVlIChlbCwgZmlsZXMsIHN0YXRlKSB7XG4gIGZ1bmN0aW9uIG9uQ2xpY2sgKGZpbGUpIHtcbiAgICBpZiAoZmlsZS5pc0RpcmVjdG9yeSkge1xuICAgICAgZmlsZS5leHBhbmRlZCA9ICFmaWxlLmV4cGFuZGVkXG4gICAgICByZW5kZXIoKVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlciAoKSB7XG4gICAgcGF0Y2goZWwsIHZpZXcsIG1ha2VUcmVlKGZpbGVzKSwgdHJ1ZSwgc3RhdGUuY3VycmVudCwgb25DbGljaylcbiAgfVxuXG4gIGZpbGVzLm9uKCdjaGFuZ2UnLCByZW5kZXIpXG4gIHN0YXRlLm9uKCdjaGFuZ2U6Y3VycmVudCcsIHJlbmRlcilcblxuICB0aGlzLnJlbmRlciA9IHJlbmRlclxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRyZWVcbiIsInZhciBJbmNyZW1lbnRhbERPTSA9IHJlcXVpcmUoJ2luY3JlbWVudGFsLWRvbScpXG52YXIgcGF0Y2ggPSBJbmNyZW1lbnRhbERPTS5wYXRjaFxudmFyIGVsZW1lbnRPcGVuID0gSW5jcmVtZW50YWxET00uZWxlbWVudE9wZW5cbnZhciBlbGVtZW50Vm9pZCA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRWb2lkXG52YXIgZWxlbWVudENsb3NlID0gSW5jcmVtZW50YWxET00uZWxlbWVudENsb3NlXG52YXIgZWxlbWVudFBsYWNlaG9sZGVyID0gSW5jcmVtZW50YWxET00uZWxlbWVudFBsYWNlaG9sZGVyXG52YXIgdGV4dCA9IEluY3JlbWVudGFsRE9NLnRleHRcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xudmFyIGhvaXN0ZWQxID0gW1wiY2xhc3NcIiwgXCJuYW1lIGljb24gaWNvbi1maWxlLXRleHRcIl1cbnZhciBob2lzdGVkMiA9IFtcImNsYXNzXCIsIFwiZmlsZS1uYW1lXCJdXG52YXIgaG9pc3RlZDMgPSBbXCJjbGFzc1wiLCBcImV4cGFuZGVkXCJdXG52YXIgaG9pc3RlZDQgPSBbXCJjbGFzc1wiLCBcImNvbGxhcHNlZFwiXVxudmFyIGhvaXN0ZWQ1ID0gW1wiY2xhc3NcIiwgXCJuYW1lIGljb24gaWNvbi1maWxlLWRpcmVjdG9yeVwiXVxudmFyIGhvaXN0ZWQ2ID0gW1wiY2xhc3NcIiwgXCJkaXItbmFtZVwiXVxudmFyIGhvaXN0ZWQ3ID0gW1wiY2xhc3NcIiwgXCJ0cmlhbmdsZS1sZWZ0XCJdXG5cbnJldHVybiBmdW5jdGlvbiB0cmVlIChkYXRhLCBpc1Jvb3QsIGN1cnJlbnQsIG9uQ2xpY2spIHtcbiAgZWxlbWVudE9wZW4oXCJ1bFwiLCBudWxsLCBudWxsLCBcImNsYXNzXCIsIGlzUm9vdCA/ICd0cmVlJyA6ICcnKVxuICAgIDsoQXJyYXkuaXNBcnJheShkYXRhKSA/IGRhdGEgOiBPYmplY3Qua2V5cyhkYXRhKSkuZm9yRWFjaChmdW5jdGlvbihmc28sICRpbmRleCkge1xuICAgICAgZWxlbWVudE9wZW4oXCJsaVwiLCBmc28ucGF0aCwgbnVsbCwgXCJjbGFzc1wiLCBmc28uaXNEaXJlY3RvcnkgPyAnZGlyJyA6ICdmaWxlJyArIChmc28gPT09IGN1cnJlbnQgPyAnIHNlbGVjdGVkJyA6ICcnKSlcbiAgICAgICAgaWYgKGZzby5pc0ZpbGUpIHtcbiAgICAgICAgICBlbGVtZW50T3BlbihcImFcIiwgbnVsbCwgbnVsbCwgXCJocmVmXCIsICcvZmlsZT9wYXRoPScgKyBmc28ucmVsYXRpdmVQYXRoKVxuICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJzcGFuXCIsIG51bGwsIGhvaXN0ZWQxLCBcImRhdGEtbmFtZVwiLCBmc28ubmFtZSwgXCJkYXRhLXBhdGhcIiwgZnNvLnJlbGF0aXZlUGF0aClcbiAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwic3BhblwiLCBudWxsLCBob2lzdGVkMilcbiAgICAgICAgICAgICAgdGV4dChcIlwiICsgKGZzby5uYW1lKSArIFwiXCIpXG4gICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJzcGFuXCIpXG4gICAgICAgICAgZWxlbWVudENsb3NlKFwiYVwiKVxuICAgICAgICB9XG4gICAgICAgIGlmIChmc28uaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICBlbGVtZW50T3BlbihcImFcIiwgbnVsbCwgbnVsbCwgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAgICRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgICAgICBvbkNsaWNrKGZzbyl9KVxuICAgICAgICAgICAgaWYgKGZzby5leHBhbmRlZCkge1xuICAgICAgICAgICAgICBlbGVtZW50T3BlbihcInNtYWxsXCIsIG51bGwsIGhvaXN0ZWQzKVxuICAgICAgICAgICAgICAgIHRleHQoXCLilrxcIilcbiAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwic21hbGxcIilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghZnNvLmV4cGFuZGVkKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwic21hbGxcIiwgbnVsbCwgaG9pc3RlZDQpXG4gICAgICAgICAgICAgICAgdGV4dChcIuKWtlwiKVxuICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJzbWFsbFwiKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJzcGFuXCIsIG51bGwsIGhvaXN0ZWQ1LCBcImRhdGEtbmFtZVwiLCBmc28ubmFtZSwgXCJkYXRhLXBhdGhcIiwgZnNvLnJlbGF0aXZlUGF0aClcbiAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwic3BhblwiLCBudWxsLCBob2lzdGVkNilcbiAgICAgICAgICAgICAgdGV4dChcIlwiICsgKGZzby5uYW1lKSArIFwiXCIpXG4gICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJzcGFuXCIpXG4gICAgICAgICAgZWxlbWVudENsb3NlKFwiYVwiKVxuICAgICAgICB9XG4gICAgICAgIGlmIChmc28uaXNGaWxlICYmIGZzbyA9PT0gY3VycmVudCkge1xuICAgICAgICAgIGVsZW1lbnRPcGVuKFwic3BhblwiLCBudWxsLCBob2lzdGVkNylcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJzcGFuXCIpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZzby5pc0RpcmVjdG9yeSAmJiBmc28uZXhwYW5kZWQpIHtcbiAgICAgICAgICBmc28uY2hpbGRyZW4uc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhLmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGIuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhLm5hbWUudG9Mb3dlckNhc2UoKVxuICAgICAgICAgIDwgYi5uYW1lLnRvTG93ZXJDYXNlKCkgPyAtMSA6IDFcbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChiLmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMVxuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS5uYW1lLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICA8IGIubmFtZS50b0xvd2VyQ2FzZSgpID8gLTEgOiAxXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAvLyB2YXIgdmlld01vZGVsID0ge1xuICAgICAgICAgICAgICAgICAgLy8gICBpc1Jvb3Q6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgLy8gICB0cmVlOiBmc28uY2hpbGRyZW4sXG4gICAgICAgICAgICAgICAgICAvLyAgIGN1cnJlbnQ6IGRhdGEuY3VycmVudCxcbiAgICAgICAgICAgICAgICAgIC8vICAgdmlldzogZGF0YS52aWV3LFxuICAgICAgICAgICAgICAgICAgLy8gICBvbkNsaWNrOiBkYXRhLm9uQ2xpY2tcbiAgICAgICAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgICAgICAgdHJlZShmc28uY2hpbGRyZW4sIGZhbHNlLCBjdXJyZW50LCBvbkNsaWNrKVxuICAgICAgICB9XG4gICAgICBlbGVtZW50Q2xvc2UoXCJsaVwiKVxuICAgIH0sIGRhdGEpXG4gIGVsZW1lbnRDbG9zZShcInVsXCIpXG59XG59KSgpO1xuIiwiZnVuY3Rpb24gaGFuZGxlRXJyb3IgKGVycikge1xuICBjb25zb2xlLmVycm9yKGVycilcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGhhbmRsZUVycm9yOiBoYW5kbGVFcnJvclxufVxuIiwiZnVuY3Rpb24gcmVxdWlyZWQgKHZhbCwgbmFtZSkge1xuICBpZiAoIXZhbCkge1xuICAgIHJldHVybiBuYW1lICsgJyBpcyByZXF1aXJlZCdcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgcmVxdWlyZWQ6IHJlcXVpcmVkXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWNlOiB7XG4gICAgdGFiU2l6ZTogMixcbiAgICBmb250U2l6ZTogMTIsXG4gICAgdGhlbWU6ICdtb25va2FpJyxcbiAgICB1c2VTb2Z0VGFiczogdHJ1ZVxuICB9XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4ndXNlIHN0cmljdCc7XG5cbi8vIElmIG9iai5oYXNPd25Qcm9wZXJ0eSBoYXMgYmVlbiBvdmVycmlkZGVuLCB0aGVuIGNhbGxpbmdcbi8vIG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSB3aWxsIGJyZWFrLlxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vam95ZW50L25vZGUvaXNzdWVzLzE3MDdcbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocXMsIHNlcCwgZXEsIG9wdGlvbnMpIHtcbiAgc2VwID0gc2VwIHx8ICcmJztcbiAgZXEgPSBlcSB8fCAnPSc7XG4gIHZhciBvYmogPSB7fTtcblxuICBpZiAodHlwZW9mIHFzICE9PSAnc3RyaW5nJyB8fCBxcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG5cbiAgdmFyIHJlZ2V4cCA9IC9cXCsvZztcbiAgcXMgPSBxcy5zcGxpdChzZXApO1xuXG4gIHZhciBtYXhLZXlzID0gMTAwMDtcbiAgaWYgKG9wdGlvbnMgJiYgdHlwZW9mIG9wdGlvbnMubWF4S2V5cyA9PT0gJ251bWJlcicpIHtcbiAgICBtYXhLZXlzID0gb3B0aW9ucy5tYXhLZXlzO1xuICB9XG5cbiAgdmFyIGxlbiA9IHFzLmxlbmd0aDtcbiAgLy8gbWF4S2V5cyA8PSAwIG1lYW5zIHRoYXQgd2Ugc2hvdWxkIG5vdCBsaW1pdCBrZXlzIGNvdW50XG4gIGlmIChtYXhLZXlzID4gMCAmJiBsZW4gPiBtYXhLZXlzKSB7XG4gICAgbGVuID0gbWF4S2V5cztcbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICB2YXIgeCA9IHFzW2ldLnJlcGxhY2UocmVnZXhwLCAnJTIwJyksXG4gICAgICAgIGlkeCA9IHguaW5kZXhPZihlcSksXG4gICAgICAgIGtzdHIsIHZzdHIsIGssIHY7XG5cbiAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgIGtzdHIgPSB4LnN1YnN0cigwLCBpZHgpO1xuICAgICAgdnN0ciA9IHguc3Vic3RyKGlkeCArIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrc3RyID0geDtcbiAgICAgIHZzdHIgPSAnJztcbiAgICB9XG5cbiAgICBrID0gZGVjb2RlVVJJQ29tcG9uZW50KGtzdHIpO1xuICAgIHYgPSBkZWNvZGVVUklDb21wb25lbnQodnN0cik7XG5cbiAgICBpZiAoIWhhc093blByb3BlcnR5KG9iaiwgaykpIHtcbiAgICAgIG9ialtrXSA9IHY7XG4gICAgfSBlbHNlIGlmIChpc0FycmF5KG9ialtrXSkpIHtcbiAgICAgIG9ialtrXS5wdXNoKHYpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvYmpba10gPSBbb2JqW2tdLCB2XTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uICh4cykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3RyaW5naWZ5UHJpbWl0aXZlID0gZnVuY3Rpb24odikge1xuICBzd2l0Y2ggKHR5cGVvZiB2KSB7XG4gICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgIHJldHVybiB2O1xuXG4gICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICByZXR1cm4gdiA/ICd0cnVlJyA6ICdmYWxzZSc7XG5cbiAgICBjYXNlICdudW1iZXInOlxuICAgICAgcmV0dXJuIGlzRmluaXRlKHYpID8gdiA6ICcnO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAnJztcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmosIHNlcCwgZXEsIG5hbWUpIHtcbiAgc2VwID0gc2VwIHx8ICcmJztcbiAgZXEgPSBlcSB8fCAnPSc7XG4gIGlmIChvYmogPT09IG51bGwpIHtcbiAgICBvYmogPSB1bmRlZmluZWQ7XG4gIH1cblxuICBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gbWFwKG9iamVjdEtleXMob2JqKSwgZnVuY3Rpb24oaykge1xuICAgICAgdmFyIGtzID0gZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShrKSkgKyBlcTtcbiAgICAgIGlmIChpc0FycmF5KG9ialtrXSkpIHtcbiAgICAgICAgcmV0dXJuIG1hcChvYmpba10sIGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICByZXR1cm4ga3MgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKHYpKTtcbiAgICAgICAgfSkuam9pbihzZXApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGtzICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShvYmpba10pKTtcbiAgICAgIH1cbiAgICB9KS5qb2luKHNlcCk7XG5cbiAgfVxuXG4gIGlmICghbmFtZSkgcmV0dXJuICcnO1xuICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShuYW1lKSkgKyBlcSArXG4gICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKG9iaikpO1xufTtcblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uICh4cykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG5cbmZ1bmN0aW9uIG1hcCAoeHMsIGYpIHtcbiAgaWYgKHhzLm1hcCkgcmV0dXJuIHhzLm1hcChmKTtcbiAgdmFyIHJlcyA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgcmVzLnB1c2goZih4c1tpXSwgaSkpO1xuICB9XG4gIHJldHVybiByZXM7XG59XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIgcmVzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgcmVzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4gcmVzO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5kZWNvZGUgPSBleHBvcnRzLnBhcnNlID0gcmVxdWlyZSgnLi9kZWNvZGUnKTtcbmV4cG9ydHMuZW5jb2RlID0gZXhwb3J0cy5zdHJpbmdpZnkgPSByZXF1aXJlKCcuL2VuY29kZScpO1xuIiwiXG4vKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4gICogS2VlcHMgdHJhY2sgd2hldGhlciBvciBub3Qgd2UgYXJlIGluIGFuIGF0dHJpYnV0ZXMgZGVjbGFyYXRpb24gKGFmdGVyXG4gICogZWxlbWVudE9wZW5TdGFydCwgYnV0IGJlZm9yZSBlbGVtZW50T3BlbkVuZCkuXG4gICogQHR5cGUge2Jvb2xlYW59XG4gICovXG52YXIgaW5BdHRyaWJ1dGVzID0gZmFsc2U7XG5cbi8qKlxuICAqIEtlZXBzIHRyYWNrIHdoZXRoZXIgb3Igbm90IHdlIGFyZSBpbiBhbiBlbGVtZW50IHRoYXQgc2hvdWxkIG5vdCBoYXZlIGl0c1xuICAqIGNoaWxkcmVuIGNsZWFyZWQuXG4gICogQHR5cGUge2Jvb2xlYW59XG4gICovXG52YXIgaW5Ta2lwID0gZmFsc2U7XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGF0IHRoZXJlIGlzIGEgY3VycmVudCBwYXRjaCBjb250ZXh0LlxuICogQHBhcmFtIHsqfSBjb250ZXh0XG4gKi9cbnZhciBhc3NlcnRJblBhdGNoID0gZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgaWYgKCFjb250ZXh0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY2FsbCBjdXJyZW50RWxlbWVudCgpIHVubGVzcyBpbiBwYXRjaCcpO1xuICB9XG59O1xuXG4vKipcbiogTWFrZXMgc3VyZSB0aGF0IGtleWVkIEVsZW1lbnQgbWF0Y2hlcyB0aGUgdGFnIG5hbWUgcHJvdmlkZWQuXG4qIEBwYXJhbSB7IXN0cmluZ30gbm9kZU5hbWUgVGhlIG5vZGVOYW1lIG9mIHRoZSBub2RlIHRoYXQgaXMgYmVpbmcgbWF0Y2hlZC5cbiogQHBhcmFtIHtzdHJpbmc9fSB0YWcgVGhlIHRhZyBuYW1lIG9mIHRoZSBFbGVtZW50LlxuKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSBvZiB0aGUgRWxlbWVudC5cbiovXG52YXIgYXNzZXJ0S2V5ZWRUYWdNYXRjaGVzID0gZnVuY3Rpb24gKG5vZGVOYW1lLCB0YWcsIGtleSkge1xuICBpZiAobm9kZU5hbWUgIT09IHRhZykge1xuICAgIHRocm93IG5ldyBFcnJvcignV2FzIGV4cGVjdGluZyBub2RlIHdpdGgga2V5IFwiJyArIGtleSArICdcIiB0byBiZSBhICcgKyB0YWcgKyAnLCBub3QgYSAnICsgbm9kZU5hbWUgKyAnLicpO1xuICB9XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCBhIHBhdGNoIGNsb3NlcyBldmVyeSBub2RlIHRoYXQgaXQgb3BlbmVkLlxuICogQHBhcmFtIHs/Tm9kZX0gb3BlbkVsZW1lbnRcbiAqIEBwYXJhbSB7IU5vZGV8IURvY3VtZW50RnJhZ21lbnR9IHJvb3RcbiAqL1xudmFyIGFzc2VydE5vVW5jbG9zZWRUYWdzID0gZnVuY3Rpb24gKG9wZW5FbGVtZW50LCByb290KSB7XG4gIGlmIChvcGVuRWxlbWVudCA9PT0gcm9vdCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBjdXJyZW50RWxlbWVudCA9IG9wZW5FbGVtZW50O1xuICB2YXIgb3BlblRhZ3MgPSBbXTtcbiAgd2hpbGUgKGN1cnJlbnRFbGVtZW50ICYmIGN1cnJlbnRFbGVtZW50ICE9PSByb290KSB7XG4gICAgb3BlblRhZ3MucHVzaChjdXJyZW50RWxlbWVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKTtcbiAgICBjdXJyZW50RWxlbWVudCA9IGN1cnJlbnRFbGVtZW50LnBhcmVudE5vZGU7XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoJ09uZSBvciBtb3JlIHRhZ3Mgd2VyZSBub3QgY2xvc2VkOlxcbicgKyBvcGVuVGFncy5qb2luKCdcXG4nKSk7XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCB0aGUgY2FsbGVyIGlzIG5vdCB3aGVyZSBhdHRyaWJ1dGVzIGFyZSBleHBlY3RlZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmdW5jdGlvbk5hbWVcbiAqL1xudmFyIGFzc2VydE5vdEluQXR0cmlidXRlcyA9IGZ1bmN0aW9uIChmdW5jdGlvbk5hbWUpIHtcbiAgaWYgKGluQXR0cmlidXRlcykge1xuICAgIHRocm93IG5ldyBFcnJvcihmdW5jdGlvbk5hbWUgKyAnKCkgbWF5IG5vdCBiZSBjYWxsZWQgYmV0d2VlbiAnICsgJ2VsZW1lbnRPcGVuU3RhcnQoKSBhbmQgZWxlbWVudE9wZW5FbmQoKS4nKTtcbiAgfVxufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoYXQgdGhlIGNhbGxlciBpcyBub3QgaW5zaWRlIGFuIGVsZW1lbnQgdGhhdCBoYXMgZGVjbGFyZWQgc2tpcC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmdW5jdGlvbk5hbWVcbiAqL1xudmFyIGFzc2VydE5vdEluU2tpcCA9IGZ1bmN0aW9uIChmdW5jdGlvbk5hbWUpIHtcbiAgaWYgKGluU2tpcCkge1xuICAgIHRocm93IG5ldyBFcnJvcihmdW5jdGlvbk5hbWUgKyAnKCkgbWF5IG5vdCBiZSBjYWxsZWQgaW5zaWRlIGFuIGVsZW1lbnQgJyArICd0aGF0IGhhcyBjYWxsZWQgc2tpcCgpLicpO1xuICB9XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCB0aGUgY2FsbGVyIGlzIHdoZXJlIGF0dHJpYnV0ZXMgYXJlIGV4cGVjdGVkLlxuICogQHBhcmFtIHtzdHJpbmd9IGZ1bmN0aW9uTmFtZVxuICovXG52YXIgYXNzZXJ0SW5BdHRyaWJ1dGVzID0gZnVuY3Rpb24gKGZ1bmN0aW9uTmFtZSkge1xuICBpZiAoIWluQXR0cmlidXRlcykge1xuICAgIHRocm93IG5ldyBFcnJvcihmdW5jdGlvbk5hbWUgKyAnKCkgbXVzdCBiZSBjYWxsZWQgYWZ0ZXIgJyArICdlbGVtZW50T3BlblN0YXJ0KCkuJyk7XG4gIH1cbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGUgcGF0Y2ggY2xvc2VzIHZpcnR1YWwgYXR0cmlidXRlcyBjYWxsXG4gKi9cbnZhciBhc3NlcnRWaXJ0dWFsQXR0cmlidXRlc0Nsb3NlZCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKGluQXR0cmlidXRlcykge1xuICAgIHRocm93IG5ldyBFcnJvcignZWxlbWVudE9wZW5FbmQoKSBtdXN0IGJlIGNhbGxlZCBhZnRlciBjYWxsaW5nICcgKyAnZWxlbWVudE9wZW5TdGFydCgpLicpO1xuICB9XG59O1xuXG4vKipcbiAgKiBNYWtlcyBzdXJlIHRoYXQgcGxhY2Vob2xkZXJzIGhhdmUgYSBrZXkgc3BlY2lmaWVkLiBPdGhlcndpc2UsIGNvbmRpdGlvbmFsXG4gICogcGxhY2Vob2xkZXJzIGFuZCBjb25kaXRpb25hbCBlbGVtZW50cyBuZXh0IHRvIHBsYWNlaG9sZGVycyB3aWxsIGNhdXNlXG4gICogcGxhY2Vob2xkZXIgZWxlbWVudHMgdG8gYmUgcmUtdXNlZCBhcyBub24tcGxhY2Vob2xkZXJzIGFuZCB2aWNlIHZlcnNhLlxuICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAgKi9cbnZhciBhc3NlcnRQbGFjZWhvbGRlcktleVNwZWNpZmllZCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKCFrZXkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsYWNlaG9sZGVyIGVsZW1lbnRzIG11c3QgaGF2ZSBhIGtleSBzcGVjaWZpZWQuJyk7XG4gIH1cbn07XG5cbi8qKlxuICAqIE1ha2VzIHN1cmUgdGhhdCB0YWdzIGFyZSBjb3JyZWN0bHkgbmVzdGVkLlxuICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlTmFtZVxuICAqIEBwYXJhbSB7c3RyaW5nfSB0YWdcbiAgKi9cbnZhciBhc3NlcnRDbG9zZU1hdGNoZXNPcGVuVGFnID0gZnVuY3Rpb24gKG5vZGVOYW1lLCB0YWcpIHtcbiAgaWYgKG5vZGVOYW1lICE9PSB0YWcpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlY2VpdmVkIGEgY2FsbCB0byBjbG9zZSAnICsgdGFnICsgJyBidXQgJyArIG5vZGVOYW1lICsgJyB3YXMgb3Blbi4nKTtcbiAgfVxufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoYXQgbm8gY2hpbGRyZW4gZWxlbWVudHMgaGF2ZSBiZWVuIGRlY2xhcmVkIHlldCBpbiB0aGUgY3VycmVudFxuICogZWxlbWVudC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmdW5jdGlvbk5hbWVcbiAqIEBwYXJhbSB7P05vZGV9IHByZXZpb3VzTm9kZVxuICovXG52YXIgYXNzZXJ0Tm9DaGlsZHJlbkRlY2xhcmVkWWV0ID0gZnVuY3Rpb24gKGZ1bmN0aW9uTmFtZSwgcHJldmlvdXNOb2RlKSB7XG4gIGlmIChwcmV2aW91c05vZGUgIT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZnVuY3Rpb25OYW1lICsgJygpIG11c3QgY29tZSBiZWZvcmUgYW55IGNoaWxkICcgKyAnZGVjbGFyYXRpb25zIGluc2lkZSB0aGUgY3VycmVudCBlbGVtZW50LicpO1xuICB9XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHN0YXRlIG9mIGJlaW5nIGluIGFuIGF0dHJpYnV0ZSBkZWNsYXJhdGlvbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWVcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRoZSBwcmV2aW91cyB2YWx1ZS5cbiAqL1xudmFyIHNldEluQXR0cmlidXRlcyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB2YXIgcHJldmlvdXMgPSBpbkF0dHJpYnV0ZXM7XG4gIGluQXR0cmlidXRlcyA9IHZhbHVlO1xuICByZXR1cm4gcHJldmlvdXM7XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHN0YXRlIG9mIGJlaW5nIGluIGEgc2tpcCBlbGVtZW50LlxuICogQHBhcmFtIHtib29sZWFufSB2YWx1ZVxuICogQHJldHVybiB7Ym9vbGVhbn0gdGhlIHByZXZpb3VzIHZhbHVlLlxuICovXG52YXIgc2V0SW5Ta2lwID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHZhciBwcmV2aW91cyA9IGluU2tpcDtcbiAgaW5Ta2lwID0gdmFsdWU7XG4gIHJldHVybiBwcmV2aW91cztcbn07XG5cbi8qKlxuICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqICovXG5leHBvcnRzLm5vdGlmaWNhdGlvbnMgPSB7XG4gIC8qKlxuICAgKiBDYWxsZWQgYWZ0ZXIgcGF0Y2ggaGFzIGNvbXBsZWF0ZWQgd2l0aCBhbnkgTm9kZXMgdGhhdCBoYXZlIGJlZW4gY3JlYXRlZFxuICAgKiBhbmQgYWRkZWQgdG8gdGhlIERPTS5cbiAgICogQHR5cGUgez9mdW5jdGlvbihBcnJheTwhTm9kZT4pfVxuICAgKi9cbiAgbm9kZXNDcmVhdGVkOiBudWxsLFxuXG4gIC8qKlxuICAgKiBDYWxsZWQgYWZ0ZXIgcGF0Y2ggaGFzIGNvbXBsZWF0ZWQgd2l0aCBhbnkgTm9kZXMgdGhhdCBoYXZlIGJlZW4gcmVtb3ZlZFxuICAgKiBmcm9tIHRoZSBET00uXG4gICAqIE5vdGUgaXQncyBhbiBhcHBsaWNhdGlvbnMgcmVzcG9uc2liaWxpdHkgdG8gaGFuZGxlIGFueSBjaGlsZE5vZGVzLlxuICAgKiBAdHlwZSB7P2Z1bmN0aW9uKEFycmF5PCFOb2RlPil9XG4gICAqL1xuICBub2Rlc0RlbGV0ZWQ6IG51bGxcbn07XG5cbi8qKlxuICogS2VlcHMgdHJhY2sgb2YgdGhlIHN0YXRlIG9mIGEgcGF0Y2guXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQ29udGV4dCgpIHtcbiAgLyoqXG4gICAqIEB0eXBlIHsoQXJyYXk8IU5vZGU+fHVuZGVmaW5lZCl9XG4gICAqL1xuICB0aGlzLmNyZWF0ZWQgPSBleHBvcnRzLm5vdGlmaWNhdGlvbnMubm9kZXNDcmVhdGVkICYmIFtdO1xuXG4gIC8qKlxuICAgKiBAdHlwZSB7KEFycmF5PCFOb2RlPnx1bmRlZmluZWQpfVxuICAgKi9cbiAgdGhpcy5kZWxldGVkID0gZXhwb3J0cy5ub3RpZmljYXRpb25zLm5vZGVzRGVsZXRlZCAmJiBbXTtcbn1cblxuLyoqXG4gKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gKi9cbkNvbnRleHQucHJvdG90eXBlLm1hcmtDcmVhdGVkID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgaWYgKHRoaXMuY3JlYXRlZCkge1xuICAgIHRoaXMuY3JlYXRlZC5wdXNoKG5vZGUpO1xuICB9XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAqL1xuQ29udGV4dC5wcm90b3R5cGUubWFya0RlbGV0ZWQgPSBmdW5jdGlvbiAobm9kZSkge1xuICBpZiAodGhpcy5kZWxldGVkKSB7XG4gICAgdGhpcy5kZWxldGVkLnB1c2gobm9kZSk7XG4gIH1cbn07XG5cbi8qKlxuICogTm90aWZpZXMgYWJvdXQgbm9kZXMgdGhhdCB3ZXJlIGNyZWF0ZWQgZHVyaW5nIHRoZSBwYXRjaCBvcGVhcmF0aW9uLlxuICovXG5Db250ZXh0LnByb3RvdHlwZS5ub3RpZnlDaGFuZ2VzID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5jcmVhdGVkICYmIHRoaXMuY3JlYXRlZC5sZW5ndGggPiAwKSB7XG4gICAgZXhwb3J0cy5ub3RpZmljYXRpb25zLm5vZGVzQ3JlYXRlZCh0aGlzLmNyZWF0ZWQpO1xuICB9XG5cbiAgaWYgKHRoaXMuZGVsZXRlZCAmJiB0aGlzLmRlbGV0ZWQubGVuZ3RoID4gMCkge1xuICAgIGV4cG9ydHMubm90aWZpY2F0aW9ucy5ub2Rlc0RlbGV0ZWQodGhpcy5kZWxldGVkKTtcbiAgfVxufTtcblxuLyoqXG4gKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIEEgY2FjaGVkIHJlZmVyZW5jZSB0byB0aGUgaGFzT3duUHJvcGVydHkgZnVuY3Rpb24uXG4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogQSBjYWNoZWQgcmVmZXJlbmNlIHRvIHRoZSBjcmVhdGUgZnVuY3Rpb24uXG4gKi9cbnZhciBjcmVhdGUgPSBPYmplY3QuY3JlYXRlO1xuXG4vKipcbiAqIFVzZWQgdG8gcHJldmVudCBwcm9wZXJ0eSBjb2xsaXNpb25zIGJldHdlZW4gb3VyIFwibWFwXCIgYW5kIGl0cyBwcm90b3R5cGUuXG4gKiBAcGFyYW0geyFPYmplY3Q8c3RyaW5nLCAqPn0gbWFwIFRoZSBtYXAgdG8gY2hlY2suXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHkgVGhlIHByb3BlcnR5IHRvIGNoZWNrLlxuICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciBtYXAgaGFzIHByb3BlcnR5LlxuICovXG52YXIgaGFzID0gZnVuY3Rpb24gKG1hcCwgcHJvcGVydHkpIHtcbiAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwobWFwLCBwcm9wZXJ0eSk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gbWFwIG9iamVjdCB3aXRob3V0IGEgcHJvdG90eXBlLlxuICogQHJldHVybiB7IU9iamVjdH1cbiAqL1xudmFyIGNyZWF0ZU1hcCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGNyZWF0ZShudWxsKTtcbn07XG5cbi8qKlxuICogS2VlcHMgdHJhY2sgb2YgaW5mb3JtYXRpb24gbmVlZGVkIHRvIHBlcmZvcm0gZGlmZnMgZm9yIGEgZ2l2ZW4gRE9NIG5vZGUuXG4gKiBAcGFyYW0geyFzdHJpbmd9IG5vZGVOYW1lXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXlcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBOb2RlRGF0YShub2RlTmFtZSwga2V5KSB7XG4gIC8qKlxuICAgKiBUaGUgYXR0cmlidXRlcyBhbmQgdGhlaXIgdmFsdWVzLlxuICAgKiBAY29uc3QgeyFPYmplY3Q8c3RyaW5nLCAqPn1cbiAgICovXG4gIHRoaXMuYXR0cnMgPSBjcmVhdGVNYXAoKTtcblxuICAvKipcbiAgICogQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMsIHVzZWQgZm9yIHF1aWNrbHkgZGlmZmluZyB0aGVcbiAgICogaW5jb21taW5nIGF0dHJpYnV0ZXMgdG8gc2VlIGlmIHRoZSBET00gbm9kZSdzIGF0dHJpYnV0ZXMgbmVlZCB0byBiZVxuICAgKiB1cGRhdGVkLlxuICAgKiBAY29uc3Qge0FycmF5PCo+fVxuICAgKi9cbiAgdGhpcy5hdHRyc0FyciA9IFtdO1xuXG4gIC8qKlxuICAgKiBUaGUgaW5jb21pbmcgYXR0cmlidXRlcyBmb3IgdGhpcyBOb2RlLCBiZWZvcmUgdGhleSBhcmUgdXBkYXRlZC5cbiAgICogQGNvbnN0IHshT2JqZWN0PHN0cmluZywgKj59XG4gICAqL1xuICB0aGlzLm5ld0F0dHJzID0gY3JlYXRlTWFwKCk7XG5cbiAgLyoqXG4gICAqIFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIG5vZGUsIHVzZWQgdG8gcHJlc2VydmUgRE9NIG5vZGVzIHdoZW4gdGhleVxuICAgKiBtb3ZlIHdpdGhpbiB0aGVpciBwYXJlbnQuXG4gICAqIEBjb25zdFxuICAgKi9cbiAgdGhpcy5rZXkgPSBrZXk7XG5cbiAgLyoqXG4gICAqIEtlZXBzIHRyYWNrIG9mIGNoaWxkcmVuIHdpdGhpbiB0aGlzIG5vZGUgYnkgdGhlaXIga2V5LlxuICAgKiB7P09iamVjdDxzdHJpbmcsICFFbGVtZW50Pn1cbiAgICovXG4gIHRoaXMua2V5TWFwID0gbnVsbDtcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIGtleU1hcCBpcyBjdXJyZW50bHkgdmFsaWQuXG4gICAqIHtib29sZWFufVxuICAgKi9cbiAgdGhpcy5rZXlNYXBWYWxpZCA9IHRydWU7XG5cbiAgLyoqXG4gICAqIFRoZSBub2RlIG5hbWUgZm9yIHRoaXMgbm9kZS5cbiAgICogQGNvbnN0IHtzdHJpbmd9XG4gICAqL1xuICB0aGlzLm5vZGVOYW1lID0gbm9kZU5hbWU7XG5cbiAgLyoqXG4gICAqIEB0eXBlIHs/c3RyaW5nfVxuICAgKi9cbiAgdGhpcy50ZXh0ID0gbnVsbDtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplcyBhIE5vZGVEYXRhIG9iamVjdCBmb3IgYSBOb2RlLlxuICpcbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgbm9kZSB0byBpbml0aWFsaXplIGRhdGEgZm9yLlxuICogQHBhcmFtIHtzdHJpbmd9IG5vZGVOYW1lIFRoZSBub2RlIG5hbWUgb2Ygbm9kZS5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHRoYXQgaWRlbnRpZmllcyB0aGUgbm9kZS5cbiAqIEByZXR1cm4geyFOb2RlRGF0YX0gVGhlIG5ld2x5IGluaXRpYWxpemVkIGRhdGEgb2JqZWN0XG4gKi9cbnZhciBpbml0RGF0YSA9IGZ1bmN0aW9uIChub2RlLCBub2RlTmFtZSwga2V5KSB7XG4gIHZhciBkYXRhID0gbmV3IE5vZGVEYXRhKG5vZGVOYW1lLCBrZXkpO1xuICBub2RlWydfX2luY3JlbWVudGFsRE9NRGF0YSddID0gZGF0YTtcbiAgcmV0dXJuIGRhdGE7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgTm9kZURhdGEgb2JqZWN0IGZvciBhIE5vZGUsIGNyZWF0aW5nIGl0IGlmIG5lY2Vzc2FyeS5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgVGhlIG5vZGUgdG8gcmV0cmlldmUgdGhlIGRhdGEgZm9yLlxuICogQHJldHVybiB7IU5vZGVEYXRhfSBUaGUgTm9kZURhdGEgZm9yIHRoaXMgTm9kZS5cbiAqL1xudmFyIGdldERhdGEgPSBmdW5jdGlvbiAobm9kZSkge1xuICB2YXIgZGF0YSA9IG5vZGVbJ19faW5jcmVtZW50YWxET01EYXRhJ107XG5cbiAgaWYgKCFkYXRhKSB7XG4gICAgdmFyIG5vZGVOYW1lID0gbm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIHZhciBrZXkgPSBudWxsO1xuXG4gICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICBrZXkgPSBub2RlLmdldEF0dHJpYnV0ZSgna2V5Jyk7XG4gICAgfVxuXG4gICAgZGF0YSA9IGluaXREYXRhKG5vZGUsIG5vZGVOYW1lLCBrZXkpO1xuICB9XG5cbiAgcmV0dXJuIGRhdGE7XG59O1xuXG4vKipcbiAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmV4cG9ydHMuc3ltYm9scyA9IHtcbiAgZGVmYXVsdDogJ19fZGVmYXVsdCcsXG5cbiAgcGxhY2Vob2xkZXI6ICdfX3BsYWNlaG9sZGVyJ1xufTtcblxuLyoqXG4gKiBBcHBsaWVzIGFuIGF0dHJpYnV0ZSBvciBwcm9wZXJ0eSB0byBhIGdpdmVuIEVsZW1lbnQuIElmIHRoZSB2YWx1ZSBpcyBudWxsXG4gKiBvciB1bmRlZmluZWQsIGl0IGlzIHJlbW92ZWQgZnJvbSB0aGUgRWxlbWVudC4gT3RoZXJ3aXNlLCB0aGUgdmFsdWUgaXMgc2V0XG4gKiBhcyBhbiBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gKiBAcGFyYW0gez8oYm9vbGVhbnxudW1iZXJ8c3RyaW5nKT19IHZhbHVlIFRoZSBhdHRyaWJ1dGUncyB2YWx1ZS5cbiAqL1xuZXhwb3J0cy5hcHBseUF0dHIgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgZWwucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICB9IGVsc2Uge1xuICAgIGVsLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gIH1cbn07XG5cbi8qKlxuICogQXBwbGllcyBhIHByb3BlcnR5IHRvIGEgZ2l2ZW4gRWxlbWVudC5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgcHJvcGVydHkncyBuYW1lLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgcHJvcGVydHkncyB2YWx1ZS5cbiAqL1xuZXhwb3J0cy5hcHBseVByb3AgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gIGVsW25hbWVdID0gdmFsdWU7XG59O1xuXG4vKipcbiAqIEFwcGxpZXMgYSBzdHlsZSB0byBhbiBFbGVtZW50LiBObyB2ZW5kb3IgcHJlZml4IGV4cGFuc2lvbiBpcyBkb25lIGZvclxuICogcHJvcGVydHkgbmFtZXMvdmFsdWVzLlxuICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBhdHRyaWJ1dGUncyBuYW1lLlxuICogQHBhcmFtIHsqfSBzdHlsZSBUaGUgc3R5bGUgdG8gc2V0LiBFaXRoZXIgYSBzdHJpbmcgb2YgY3NzIG9yIGFuIG9iamVjdFxuICogICAgIGNvbnRhaW5pbmcgcHJvcGVydHktdmFsdWUgcGFpcnMuXG4gKi9cbnZhciBhcHBseVN0eWxlID0gZnVuY3Rpb24gKGVsLCBuYW1lLCBzdHlsZSkge1xuICBpZiAodHlwZW9mIHN0eWxlID09PSAnc3RyaW5nJykge1xuICAgIGVsLnN0eWxlLmNzc1RleHQgPSBzdHlsZTtcbiAgfSBlbHNlIHtcbiAgICBlbC5zdHlsZS5jc3NUZXh0ID0gJyc7XG4gICAgdmFyIGVsU3R5bGUgPSBlbC5zdHlsZTtcbiAgICB2YXIgb2JqID0gLyoqIEB0eXBlIHshT2JqZWN0PHN0cmluZyxzdHJpbmc+fSAqL3N0eWxlO1xuXG4gICAgZm9yICh2YXIgcHJvcCBpbiBvYmopIHtcbiAgICAgIGlmIChoYXMob2JqLCBwcm9wKSkge1xuICAgICAgICBlbFN0eWxlW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBVcGRhdGVzIGEgc2luZ2xlIGF0dHJpYnV0ZSBvbiBhbiBFbGVtZW50LlxuICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBhdHRyaWJ1dGUncyBuYW1lLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgYXR0cmlidXRlJ3MgdmFsdWUuIElmIHRoZSB2YWx1ZSBpcyBhbiBvYmplY3Qgb3JcbiAqICAgICBmdW5jdGlvbiBpdCBpcyBzZXQgb24gdGhlIEVsZW1lbnQsIG90aGVyd2lzZSwgaXQgaXMgc2V0IGFzIGFuIEhUTUxcbiAqICAgICBhdHRyaWJ1dGUuXG4gKi9cbnZhciBhcHBseUF0dHJpYnV0ZVR5cGVkID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcblxuICBpZiAodHlwZSA9PT0gJ29iamVjdCcgfHwgdHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGV4cG9ydHMuYXBwbHlQcm9wKGVsLCBuYW1lLCB2YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgZXhwb3J0cy5hcHBseUF0dHIoZWwsIG5hbWUsIC8qKiBAdHlwZSB7Pyhib29sZWFufG51bWJlcnxzdHJpbmcpfSAqL3ZhbHVlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBDYWxscyB0aGUgYXBwcm9wcmlhdGUgYXR0cmlidXRlIG11dGF0b3IgZm9yIHRoaXMgYXR0cmlidXRlLlxuICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBhdHRyaWJ1dGUncyBuYW1lLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgYXR0cmlidXRlJ3MgdmFsdWUuXG4gKi9cbnZhciB1cGRhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gIHZhciBkYXRhID0gZ2V0RGF0YShlbCk7XG4gIHZhciBhdHRycyA9IGRhdGEuYXR0cnM7XG5cbiAgaWYgKGF0dHJzW25hbWVdID09PSB2YWx1ZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBtdXRhdG9yID0gZXhwb3J0cy5hdHRyaWJ1dGVzW25hbWVdIHx8IGV4cG9ydHMuYXR0cmlidXRlc1tleHBvcnRzLnN5bWJvbHMuZGVmYXVsdF07XG4gIG11dGF0b3IoZWwsIG5hbWUsIHZhbHVlKTtcblxuICBhdHRyc1tuYW1lXSA9IHZhbHVlO1xufTtcblxuLyoqXG4gKiBBIHB1YmxpY2x5IG11dGFibGUgb2JqZWN0IHRvIHByb3ZpZGUgY3VzdG9tIG11dGF0b3JzIGZvciBhdHRyaWJ1dGVzLlxuICogQGNvbnN0IHshT2JqZWN0PHN0cmluZywgZnVuY3Rpb24oIUVsZW1lbnQsIHN0cmluZywgKik+fVxuICovXG5leHBvcnRzLmF0dHJpYnV0ZXMgPSBjcmVhdGVNYXAoKTtcblxuLy8gU3BlY2lhbCBnZW5lcmljIG11dGF0b3IgdGhhdCdzIGNhbGxlZCBmb3IgYW55IGF0dHJpYnV0ZSB0aGF0IGRvZXMgbm90XG4vLyBoYXZlIGEgc3BlY2lmaWMgbXV0YXRvci5cbmV4cG9ydHMuYXR0cmlidXRlc1tleHBvcnRzLnN5bWJvbHMuZGVmYXVsdF0gPSBhcHBseUF0dHJpYnV0ZVR5cGVkO1xuXG5leHBvcnRzLmF0dHJpYnV0ZXNbZXhwb3J0cy5zeW1ib2xzLnBsYWNlaG9sZGVyXSA9IGZ1bmN0aW9uICgpIHt9O1xuXG5leHBvcnRzLmF0dHJpYnV0ZXNbJ3N0eWxlJ10gPSBhcHBseVN0eWxlO1xuXG4vKipcbiAqIEdldHMgdGhlIG5hbWVzcGFjZSB0byBjcmVhdGUgYW4gZWxlbWVudCAob2YgYSBnaXZlbiB0YWcpIGluLlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgdGFnIHRvIGdldCB0aGUgbmFtZXNwYWNlIGZvci5cbiAqIEBwYXJhbSB7P05vZGV9IHBhcmVudFxuICogQHJldHVybiB7P3N0cmluZ30gVGhlIG5hbWVzcGFjZSB0byBjcmVhdGUgdGhlIHRhZyBpbi5cbiAqL1xudmFyIGdldE5hbWVzcGFjZUZvclRhZyA9IGZ1bmN0aW9uICh0YWcsIHBhcmVudCkge1xuICBpZiAodGFnID09PSAnc3ZnJykge1xuICAgIHJldHVybiAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xuICB9XG5cbiAgaWYgKGdldERhdGEocGFyZW50KS5ub2RlTmFtZSA9PT0gJ2ZvcmVpZ25PYmplY3QnKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gcGFyZW50Lm5hbWVzcGFjZVVSSTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50LlxuICogQHBhcmFtIHtEb2N1bWVudH0gZG9jIFRoZSBkb2N1bWVudCB3aXRoIHdoaWNoIHRvIGNyZWF0ZSB0aGUgRWxlbWVudC5cbiAqIEBwYXJhbSB7P05vZGV9IHBhcmVudFxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgdGFnIGZvciB0aGUgRWxlbWVudC5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBBIGtleSB0byBpZGVudGlmeSB0aGUgRWxlbWVudC5cbiAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH1cbiAqL1xudmFyIGNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbiAoZG9jLCBwYXJlbnQsIHRhZywga2V5LCBzdGF0aWNzKSB7XG4gIHZhciBuYW1lc3BhY2UgPSBnZXROYW1lc3BhY2VGb3JUYWcodGFnLCBwYXJlbnQpO1xuICB2YXIgZWw7XG5cbiAgaWYgKG5hbWVzcGFjZSkge1xuICAgIGVsID0gZG9jLmNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2UsIHRhZyk7XG4gIH0gZWxzZSB7XG4gICAgZWwgPSBkb2MuY3JlYXRlRWxlbWVudCh0YWcpO1xuICB9XG5cbiAgaW5pdERhdGEoZWwsIHRhZywga2V5KTtcblxuICBpZiAoc3RhdGljcykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhdGljcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgdXBkYXRlQXR0cmlidXRlKGVsLCAvKiogQHR5cGUgeyFzdHJpbmd9Ki9zdGF0aWNzW2ldLCBzdGF0aWNzW2kgKyAxXSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGVsO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgVGV4dCBOb2RlLlxuICogQHBhcmFtIHtEb2N1bWVudH0gZG9jIFRoZSBkb2N1bWVudCB3aXRoIHdoaWNoIHRvIGNyZWF0ZSB0aGUgRWxlbWVudC5cbiAqIEByZXR1cm4geyFUZXh0fVxuICovXG52YXIgY3JlYXRlVGV4dCA9IGZ1bmN0aW9uIChkb2MpIHtcbiAgdmFyIG5vZGUgPSBkb2MuY3JlYXRlVGV4dE5vZGUoJycpO1xuICBpbml0RGF0YShub2RlLCAnI3RleHQnLCBudWxsKTtcbiAgcmV0dXJuIG5vZGU7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXBwaW5nIHRoYXQgY2FuIGJlIHVzZWQgdG8gbG9vayB1cCBjaGlsZHJlbiB1c2luZyBhIGtleS5cbiAqIEBwYXJhbSB7P05vZGV9IGVsXG4gKiBAcmV0dXJuIHshT2JqZWN0PHN0cmluZywgIUVsZW1lbnQ+fSBBIG1hcHBpbmcgb2Yga2V5cyB0byB0aGUgY2hpbGRyZW4gb2YgdGhlXG4gKiAgICAgRWxlbWVudC5cbiAqL1xudmFyIGNyZWF0ZUtleU1hcCA9IGZ1bmN0aW9uIChlbCkge1xuICB2YXIgbWFwID0gY3JlYXRlTWFwKCk7XG4gIHZhciBjaGlsZHJlbiA9IGVsLmNoaWxkcmVuO1xuICB2YXIgY291bnQgPSBjaGlsZHJlbi5sZW5ndGg7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSArPSAxKSB7XG4gICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgdmFyIGtleSA9IGdldERhdGEoY2hpbGQpLmtleTtcblxuICAgIGlmIChrZXkpIHtcbiAgICAgIG1hcFtrZXldID0gY2hpbGQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG1hcDtcbn07XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBtYXBwaW5nIG9mIGtleSB0byBjaGlsZCBub2RlIGZvciBhIGdpdmVuIEVsZW1lbnQsIGNyZWF0aW5nIGl0XG4gKiBpZiBuZWNlc3NhcnkuXG4gKiBAcGFyYW0gez9Ob2RlfSBlbFxuICogQHJldHVybiB7IU9iamVjdDxzdHJpbmcsICFOb2RlPn0gQSBtYXBwaW5nIG9mIGtleXMgdG8gY2hpbGQgRWxlbWVudHNcbiAqL1xudmFyIGdldEtleU1hcCA9IGZ1bmN0aW9uIChlbCkge1xuICB2YXIgZGF0YSA9IGdldERhdGEoZWwpO1xuXG4gIGlmICghZGF0YS5rZXlNYXApIHtcbiAgICBkYXRhLmtleU1hcCA9IGNyZWF0ZUtleU1hcChlbCk7XG4gIH1cblxuICByZXR1cm4gZGF0YS5rZXlNYXA7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyBhIGNoaWxkIGZyb20gdGhlIHBhcmVudCB3aXRoIHRoZSBnaXZlbiBrZXkuXG4gKiBAcGFyYW0gez9Ob2RlfSBwYXJlbnRcbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleVxuICogQHJldHVybiB7P05vZGV9IFRoZSBjaGlsZCBjb3JyZXNwb25kaW5nIHRvIHRoZSBrZXkuXG4gKi9cbnZhciBnZXRDaGlsZCA9IGZ1bmN0aW9uIChwYXJlbnQsIGtleSkge1xuICByZXR1cm4ga2V5ID8gZ2V0S2V5TWFwKHBhcmVudClba2V5XSA6IG51bGw7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVycyBhbiBlbGVtZW50IGFzIGJlaW5nIGEgY2hpbGQuIFRoZSBwYXJlbnQgd2lsbCBrZWVwIHRyYWNrIG9mIHRoZVxuICogY2hpbGQgdXNpbmcgdGhlIGtleS4gVGhlIGNoaWxkIGNhbiBiZSByZXRyaWV2ZWQgdXNpbmcgdGhlIHNhbWUga2V5IHVzaW5nXG4gKiBnZXRLZXlNYXAuIFRoZSBwcm92aWRlZCBrZXkgc2hvdWxkIGJlIHVuaXF1ZSB3aXRoaW4gdGhlIHBhcmVudCBFbGVtZW50LlxuICogQHBhcmFtIHs/Tm9kZX0gcGFyZW50IFRoZSBwYXJlbnQgb2YgY2hpbGQuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IEEga2V5IHRvIGlkZW50aWZ5IHRoZSBjaGlsZCB3aXRoLlxuICogQHBhcmFtIHshTm9kZX0gY2hpbGQgVGhlIGNoaWxkIHRvIHJlZ2lzdGVyLlxuICovXG52YXIgcmVnaXN0ZXJDaGlsZCA9IGZ1bmN0aW9uIChwYXJlbnQsIGtleSwgY2hpbGQpIHtcbiAgZ2V0S2V5TWFwKHBhcmVudClba2V5XSA9IGNoaWxkO1xufTtcblxuLyoqIEB0eXBlIHs/Q29udGV4dH0gKi9cbnZhciBjb250ZXh0ID0gbnVsbDtcblxuLyoqIEB0eXBlIHs/Tm9kZX0gKi9cbnZhciBjdXJyZW50Tm9kZTtcblxuLyoqIEB0eXBlIHs/Tm9kZX0gKi9cbnZhciBjdXJyZW50UGFyZW50O1xuXG4vKiogQHR5cGUgez9Ob2RlfSAqL1xudmFyIHByZXZpb3VzTm9kZTtcblxuLyoqIEB0eXBlIHs/RWxlbWVudHw/RG9jdW1lbnRGcmFnbWVudH0gKi9cbnZhciByb290O1xuXG4vKiogQHR5cGUgez9Eb2N1bWVudH0gKi9cbnZhciBkb2M7XG5cbi8qKlxuICogUGF0Y2hlcyB0aGUgZG9jdW1lbnQgc3RhcnRpbmcgYXQgZWwgd2l0aCB0aGUgcHJvdmlkZWQgZnVuY3Rpb24uIFRoaXMgZnVuY3Rpb25cbiAqIG1heSBiZSBjYWxsZWQgZHVyaW5nIGFuIGV4aXN0aW5nIHBhdGNoIG9wZXJhdGlvbi5cbiAqIEBwYXJhbSB7IUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnR9IG5vZGUgVGhlIEVsZW1lbnQgb3IgRG9jdW1lbnRcbiAqICAgICB0byBwYXRjaC5cbiAqIEBwYXJhbSB7IWZ1bmN0aW9uKFQpfSBmbiBBIGZ1bmN0aW9uIGNvbnRhaW5pbmcgZWxlbWVudE9wZW4vZWxlbWVudENsb3NlL2V0Yy5cbiAqICAgICBjYWxscyB0aGF0IGRlc2NyaWJlIHRoZSBET00uXG4gKiBAcGFyYW0ge1Q9fSBkYXRhIEFuIGFyZ3VtZW50IHBhc3NlZCB0byBmbiB0byByZXByZXNlbnQgRE9NIHN0YXRlLlxuICogQHRlbXBsYXRlIFRcbiAqL1xuZXhwb3J0cy5wYXRjaCA9IGZ1bmN0aW9uIChub2RlLCBmbiwgZGF0YSkge1xuICB2YXIgcHJldkNvbnRleHQgPSBjb250ZXh0O1xuICB2YXIgcHJldlJvb3QgPSByb290O1xuICB2YXIgcHJldkRvYyA9IGRvYztcbiAgdmFyIHByZXZDdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlO1xuICB2YXIgcHJldkN1cnJlbnRQYXJlbnQgPSBjdXJyZW50UGFyZW50O1xuICB2YXIgcHJldlByZXZpb3VzTm9kZSA9IHByZXZpb3VzTm9kZTtcbiAgdmFyIHByZXZpb3VzSW5BdHRyaWJ1dGVzID0gZmFsc2U7XG4gIHZhciBwcmV2aW91c0luU2tpcCA9IGZhbHNlO1xuXG4gIGNvbnRleHQgPSBuZXcgQ29udGV4dCgpO1xuICByb290ID0gbm9kZTtcbiAgZG9jID0gbm9kZS5vd25lckRvY3VtZW50O1xuICBjdXJyZW50Tm9kZSA9IG5vZGU7XG4gIGN1cnJlbnRQYXJlbnQgPSBudWxsO1xuICBwcmV2aW91c05vZGUgPSBudWxsO1xuXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgcHJldmlvdXNJbkF0dHJpYnV0ZXMgPSBzZXRJbkF0dHJpYnV0ZXMoZmFsc2UpO1xuICAgIHByZXZpb3VzSW5Ta2lwID0gc2V0SW5Ta2lwKGZhbHNlKTtcbiAgfVxuXG4gIGVudGVyTm9kZSgpO1xuICBmbihkYXRhKTtcbiAgZXhpdE5vZGUoKTtcblxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydFZpcnR1YWxBdHRyaWJ1dGVzQ2xvc2VkKCk7XG4gICAgYXNzZXJ0Tm9VbmNsb3NlZFRhZ3MocHJldmlvdXNOb2RlLCBub2RlKTtcbiAgICBzZXRJbkF0dHJpYnV0ZXMocHJldmlvdXNJbkF0dHJpYnV0ZXMpO1xuICAgIHNldEluU2tpcChwcmV2aW91c0luU2tpcCk7XG4gIH1cblxuICBjb250ZXh0Lm5vdGlmeUNoYW5nZXMoKTtcblxuICBjb250ZXh0ID0gcHJldkNvbnRleHQ7XG4gIHJvb3QgPSBwcmV2Um9vdDtcbiAgZG9jID0gcHJldkRvYztcbiAgY3VycmVudE5vZGUgPSBwcmV2Q3VycmVudE5vZGU7XG4gIGN1cnJlbnRQYXJlbnQgPSBwcmV2Q3VycmVudFBhcmVudDtcbiAgcHJldmlvdXNOb2RlID0gcHJldlByZXZpb3VzTm9kZTtcbn07XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgb3Igbm90IHRoZSBjdXJyZW50IG5vZGUgbWF0Y2hlcyB0aGUgc3BlY2lmaWVkIG5vZGVOYW1lIGFuZFxuICoga2V5LlxuICpcbiAqIEBwYXJhbSB7P3N0cmluZ30gbm9kZU5hbWUgVGhlIG5vZGVOYW1lIGZvciB0aGlzIG5vZGUuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgQW4gb3B0aW9uYWwga2V5IHRoYXQgaWRlbnRpZmllcyBhIG5vZGUuXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSBub2RlIG1hdGNoZXMsIGZhbHNlIG90aGVyd2lzZS5cbiAqL1xudmFyIG1hdGNoZXMgPSBmdW5jdGlvbiAobm9kZU5hbWUsIGtleSkge1xuICB2YXIgZGF0YSA9IGdldERhdGEoY3VycmVudE5vZGUpO1xuXG4gIC8vIEtleSBjaGVjayBpcyBkb25lIHVzaW5nIGRvdWJsZSBlcXVhbHMgYXMgd2Ugd2FudCB0byB0cmVhdCBhIG51bGwga2V5IHRoZVxuICAvLyBzYW1lIGFzIHVuZGVmaW5lZC4gVGhpcyBzaG91bGQgYmUgb2theSBhcyB0aGUgb25seSB2YWx1ZXMgYWxsb3dlZCBhcmVcbiAgLy8gc3RyaW5ncywgbnVsbCBhbmQgdW5kZWZpbmVkIHNvIHRoZSA9PSBzZW1hbnRpY3MgYXJlIG5vdCB0b28gd2VpcmQuXG4gIHJldHVybiBub2RlTmFtZSA9PT0gZGF0YS5ub2RlTmFtZSAmJiBrZXkgPT0gZGF0YS5rZXk7XG59O1xuXG4vKipcbiAqIEFsaWducyB0aGUgdmlydHVhbCBFbGVtZW50IGRlZmluaXRpb24gd2l0aCB0aGUgYWN0dWFsIERPTSwgbW92aW5nIHRoZVxuICogY29ycmVzcG9uZGluZyBET00gbm9kZSB0byB0aGUgY29ycmVjdCBsb2NhdGlvbiBvciBjcmVhdGluZyBpdCBpZiBuZWNlc3NhcnkuXG4gKiBAcGFyYW0ge3N0cmluZ30gbm9kZU5hbWUgRm9yIGFuIEVsZW1lbnQsIHRoaXMgc2hvdWxkIGJlIGEgdmFsaWQgdGFnIHN0cmluZy5cbiAqICAgICBGb3IgYSBUZXh0LCB0aGlzIHNob3VsZCBiZSAjdGV4dC5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LlxuICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEZvciBhbiBFbGVtZW50LCB0aGlzIHNob3VsZCBiZSBhbiBhcnJheSBvZlxuICogICAgIG5hbWUtdmFsdWUgcGFpcnMuXG4gKi9cbnZhciBhbGlnbldpdGhET00gPSBmdW5jdGlvbiAobm9kZU5hbWUsIGtleSwgc3RhdGljcykge1xuICBpZiAoY3VycmVudE5vZGUgJiYgbWF0Y2hlcyhub2RlTmFtZSwga2V5KSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBub2RlO1xuXG4gIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgbm9kZSBoYXMgbW92ZWQgd2l0aGluIHRoZSBwYXJlbnQuXG4gIGlmIChrZXkpIHtcbiAgICBub2RlID0gZ2V0Q2hpbGQoY3VycmVudFBhcmVudCwga2V5KTtcbiAgICBpZiAobm9kZSAmJiBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICBhc3NlcnRLZXllZFRhZ01hdGNoZXMoZ2V0RGF0YShub2RlKS5ub2RlTmFtZSwgbm9kZU5hbWUsIGtleSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ3JlYXRlIHRoZSBub2RlIGlmIGl0IGRvZXNuJ3QgZXhpc3QuXG4gIGlmICghbm9kZSkge1xuICAgIGlmIChub2RlTmFtZSA9PT0gJyN0ZXh0Jykge1xuICAgICAgbm9kZSA9IGNyZWF0ZVRleHQoZG9jKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZSA9IGNyZWF0ZUVsZW1lbnQoZG9jLCBjdXJyZW50UGFyZW50LCBub2RlTmFtZSwga2V5LCBzdGF0aWNzKTtcbiAgICB9XG5cbiAgICBpZiAoa2V5KSB7XG4gICAgICByZWdpc3RlckNoaWxkKGN1cnJlbnRQYXJlbnQsIGtleSwgbm9kZSk7XG4gICAgfVxuXG4gICAgY29udGV4dC5tYXJrQ3JlYXRlZChub2RlKTtcbiAgfVxuXG4gIC8vIElmIHRoZSBub2RlIGhhcyBhIGtleSwgcmVtb3ZlIGl0IGZyb20gdGhlIERPTSB0byBwcmV2ZW50IGEgbGFyZ2UgbnVtYmVyXG4gIC8vIG9mIHJlLW9yZGVycyBpbiB0aGUgY2FzZSB0aGF0IGl0IG1vdmVkIGZhciBvciB3YXMgY29tcGxldGVseSByZW1vdmVkLlxuICAvLyBTaW5jZSB3ZSBob2xkIG9uIHRvIGEgcmVmZXJlbmNlIHRocm91Z2ggdGhlIGtleU1hcCwgd2UgY2FuIGFsd2F5cyBhZGQgaXRcbiAgLy8gYmFjay5cbiAgaWYgKGN1cnJlbnROb2RlICYmIGdldERhdGEoY3VycmVudE5vZGUpLmtleSkge1xuICAgIGN1cnJlbnRQYXJlbnQucmVwbGFjZUNoaWxkKG5vZGUsIGN1cnJlbnROb2RlKTtcbiAgICBnZXREYXRhKGN1cnJlbnRQYXJlbnQpLmtleU1hcFZhbGlkID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgY3VycmVudFBhcmVudC5pbnNlcnRCZWZvcmUobm9kZSwgY3VycmVudE5vZGUpO1xuICB9XG5cbiAgY3VycmVudE5vZGUgPSBub2RlO1xufTtcblxuLyoqXG4gKiBDbGVhcnMgb3V0IGFueSB1bnZpc2l0ZWQgTm9kZXMsIGFzIHRoZSBjb3JyZXNwb25kaW5nIHZpcnR1YWwgZWxlbWVudFxuICogZnVuY3Rpb25zIHdlcmUgbmV2ZXIgY2FsbGVkIGZvciB0aGVtLlxuICovXG52YXIgY2xlYXJVbnZpc2l0ZWRET00gPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBub2RlID0gY3VycmVudFBhcmVudDtcbiAgdmFyIGRhdGEgPSBnZXREYXRhKG5vZGUpO1xuICB2YXIga2V5TWFwID0gZGF0YS5rZXlNYXA7XG4gIHZhciBrZXlNYXBWYWxpZCA9IGRhdGEua2V5TWFwVmFsaWQ7XG4gIHZhciBjaGlsZCA9IG5vZGUubGFzdENoaWxkO1xuICB2YXIga2V5O1xuXG4gIGlmIChjaGlsZCA9PT0gcHJldmlvdXNOb2RlICYmIGtleU1hcFZhbGlkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKGRhdGEuYXR0cnNbZXhwb3J0cy5zeW1ib2xzLnBsYWNlaG9sZGVyXSAmJiBub2RlICE9PSByb290KSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgd2hpbGUgKGNoaWxkICE9PSBwcmV2aW91c05vZGUpIHtcbiAgICBub2RlLnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgICBjb250ZXh0Lm1hcmtEZWxldGVkKCAvKiogQHR5cGUgeyFOb2RlfSovY2hpbGQpO1xuXG4gICAga2V5ID0gZ2V0RGF0YShjaGlsZCkua2V5O1xuICAgIGlmIChrZXkpIHtcbiAgICAgIGRlbGV0ZSBrZXlNYXBba2V5XTtcbiAgICB9XG4gICAgY2hpbGQgPSBub2RlLmxhc3RDaGlsZDtcbiAgfVxuXG4gIC8vIENsZWFuIHRoZSBrZXlNYXAsIHJlbW92aW5nIGFueSB1bnVzdWVkIGtleXMuXG4gIGlmICgha2V5TWFwVmFsaWQpIHtcbiAgICBmb3IgKGtleSBpbiBrZXlNYXApIHtcbiAgICAgIGNoaWxkID0ga2V5TWFwW2tleV07XG4gICAgICBpZiAoY2hpbGQucGFyZW50Tm9kZSAhPT0gbm9kZSkge1xuICAgICAgICBjb250ZXh0Lm1hcmtEZWxldGVkKGNoaWxkKTtcbiAgICAgICAgZGVsZXRlIGtleU1hcFtrZXldO1xuICAgICAgfVxuICAgIH1cblxuICAgIGRhdGEua2V5TWFwVmFsaWQgPSB0cnVlO1xuICB9XG59O1xuXG4vKipcbiAqIENoYW5nZXMgdG8gdGhlIGZpcnN0IGNoaWxkIG9mIHRoZSBjdXJyZW50IG5vZGUuXG4gKi9cbnZhciBlbnRlck5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50Tm9kZTtcbiAgY3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZS5maXJzdENoaWxkO1xuICBwcmV2aW91c05vZGUgPSBudWxsO1xufTtcblxuLyoqXG4gKiBDaGFuZ2VzIHRvIHRoZSBuZXh0IHNpYmxpbmcgb2YgdGhlIGN1cnJlbnQgbm9kZS5cbiAqL1xudmFyIG5leHROb2RlID0gZnVuY3Rpb24gKCkge1xuICBwcmV2aW91c05vZGUgPSBjdXJyZW50Tm9kZTtcbiAgY3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZS5uZXh0U2libGluZztcbn07XG5cbi8qKlxuICogQ2hhbmdlcyB0byB0aGUgcGFyZW50IG9mIHRoZSBjdXJyZW50IG5vZGUsIHJlbW92aW5nIGFueSB1bnZpc2l0ZWQgY2hpbGRyZW4uXG4gKi9cbnZhciBleGl0Tm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgY2xlYXJVbnZpc2l0ZWRET00oKTtcblxuICBwcmV2aW91c05vZGUgPSBjdXJyZW50UGFyZW50O1xuICBjdXJyZW50Tm9kZSA9IGN1cnJlbnRQYXJlbnQubmV4dFNpYmxpbmc7XG4gIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50UGFyZW50LnBhcmVudE5vZGU7XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCB0aGUgY3VycmVudCBub2RlIGlzIGFuIEVsZW1lbnQgd2l0aCBhIG1hdGNoaW5nIHRhZ05hbWUgYW5kXG4gKiBrZXkuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICogICAgIGVtcHR5IHN0cmluZywgYnV0IHBlcmZvcm1hbmNlIG1heSBiZSBiZXR0ZXIgaWYgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZFxuICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xudmFyIF9lbGVtZW50T3BlbiA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcykge1xuICBhbGlnbldpdGhET00odGFnLCBrZXksIHN0YXRpY3MpO1xuICBlbnRlck5vZGUoKTtcbiAgcmV0dXJuICgvKiogQHR5cGUgeyFFbGVtZW50fSAqL2N1cnJlbnRQYXJlbnRcbiAgKTtcbn07XG5cbi8qKlxuICogQ2xvc2VzIHRoZSBjdXJyZW50bHkgb3BlbiBFbGVtZW50LCByZW1vdmluZyBhbnkgdW52aXNpdGVkIGNoaWxkcmVuIGlmXG4gKiBuZWNlc3NhcnkuXG4gKlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbnZhciBfZWxlbWVudENsb3NlID0gZnVuY3Rpb24gKCkge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIHNldEluU2tpcChmYWxzZSk7XG4gIH1cblxuICBleGl0Tm9kZSgpO1xuICByZXR1cm4gKC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovcHJldmlvdXNOb2RlXG4gICk7XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhlIGN1cnJlbnQgbm9kZSBpcyBhIFRleHQgbm9kZSBhbmQgY3JlYXRlcyBhIFRleHQgbm9kZSBpZiBpdCBpc1xuICogbm90LlxuICpcbiAqIEByZXR1cm4geyFUZXh0fSBUaGUgY29ycmVzcG9uZGluZyBUZXh0IE5vZGUuXG4gKi9cbnZhciBfdGV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgYWxpZ25XaXRoRE9NKCcjdGV4dCcsIG51bGwsIG51bGwpO1xuICBuZXh0Tm9kZSgpO1xuICByZXR1cm4gKC8qKiBAdHlwZSB7IVRleHR9ICovcHJldmlvdXNOb2RlXG4gICk7XG59O1xuXG4vKipcbiAqIEdldHMgdGhlIGN1cnJlbnQgRWxlbWVudCBiZWluZyBwYXRjaGVkLlxuICogQHJldHVybiB7IUVsZW1lbnR9XG4gKi9cbmV4cG9ydHMuY3VycmVudEVsZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0SW5QYXRjaChjb250ZXh0KTtcbiAgICBhc3NlcnROb3RJbkF0dHJpYnV0ZXMoJ2N1cnJlbnRFbGVtZW50Jyk7XG4gIH1cbiAgcmV0dXJuICgvKiogQHR5cGUgeyFFbGVtZW50fSAqL2N1cnJlbnRQYXJlbnRcbiAgKTtcbn07XG5cbi8qKlxuICogU2tpcHMgdGhlIGNoaWxkcmVuIGluIGEgc3VidHJlZSwgYWxsb3dpbmcgYW4gRWxlbWVudCB0byBiZSBjbG9zZWQgd2l0aG91dFxuICogY2xlYXJpbmcgb3V0IHRoZSBjaGlsZHJlbi5cbiAqL1xuZXhwb3J0cy5za2lwID0gZnVuY3Rpb24gKCkge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydE5vQ2hpbGRyZW5EZWNsYXJlZFlldCgnc2tpcCcsIHByZXZpb3VzTm9kZSk7XG4gICAgc2V0SW5Ta2lwKHRydWUpO1xuICB9XG4gIHByZXZpb3VzTm9kZSA9IGN1cnJlbnRQYXJlbnQubGFzdENoaWxkO1xufTtcblxuLyoqXG4gKiBUaGUgb2Zmc2V0IGluIHRoZSB2aXJ0dWFsIGVsZW1lbnQgZGVjbGFyYXRpb24gd2hlcmUgdGhlIGF0dHJpYnV0ZXMgYXJlXG4gKiBzcGVjaWZpZWQuXG4gKiBAY29uc3RcbiAqL1xudmFyIEFUVFJJQlVURVNfT0ZGU0VUID0gMztcblxuLyoqXG4gKiBCdWlsZHMgYW4gYXJyYXkgb2YgYXJndW1lbnRzIGZvciB1c2Ugd2l0aCBlbGVtZW50T3BlblN0YXJ0LCBhdHRyIGFuZFxuICogZWxlbWVudE9wZW5FbmQuXG4gKiBAY29uc3Qge0FycmF5PCo+fVxuICovXG52YXIgYXJnc0J1aWxkZXIgPSBbXTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gKiAgICAgd2hlbiBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBvZiBpdGVtcy5cbiAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICogICAgIEVsZW1lbnQgaXMgY3JlYXRlZC5cbiAqIEBwYXJhbSB7Li4uKn0gdmFyX2FyZ3MgQXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlIGR5bmFtaWMgYXR0cmlidXRlc1xuICogICAgIGZvciB0aGUgRWxlbWVudC5cbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG5leHBvcnRzLmVsZW1lbnRPcGVuID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzLCB2YXJfYXJncykge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydE5vdEluQXR0cmlidXRlcygnZWxlbWVudE9wZW4nKTtcbiAgICBhc3NlcnROb3RJblNraXAoJ2VsZW1lbnRPcGVuJyk7XG4gIH1cblxuICB2YXIgbm9kZSA9IF9lbGVtZW50T3Blbih0YWcsIGtleSwgc3RhdGljcyk7XG4gIHZhciBkYXRhID0gZ2V0RGF0YShub2RlKTtcblxuICAvKlxuICAgKiBDaGVja3MgdG8gc2VlIGlmIG9uZSBvciBtb3JlIGF0dHJpYnV0ZXMgaGF2ZSBjaGFuZ2VkIGZvciBhIGdpdmVuIEVsZW1lbnQuXG4gICAqIFdoZW4gbm8gYXR0cmlidXRlcyBoYXZlIGNoYW5nZWQsIHRoaXMgaXMgbXVjaCBmYXN0ZXIgdGhhbiBjaGVja2luZyBlYWNoXG4gICAqIGluZGl2aWR1YWwgYXJndW1lbnQuIFdoZW4gYXR0cmlidXRlcyBoYXZlIGNoYW5nZWQsIHRoZSBvdmVyaGVhZCBvZiB0aGlzIGlzXG4gICAqIG1pbmltYWwuXG4gICAqL1xuICB2YXIgYXR0cnNBcnIgPSBkYXRhLmF0dHJzQXJyO1xuICB2YXIgbmV3QXR0cnMgPSBkYXRhLm5ld0F0dHJzO1xuICB2YXIgYXR0cnNDaGFuZ2VkID0gZmFsc2U7XG4gIHZhciBpID0gQVRUUklCVVRFU19PRkZTRVQ7XG4gIHZhciBqID0gMDtcblxuICBmb3IgKDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMSwgaiArPSAxKSB7XG4gICAgaWYgKGF0dHJzQXJyW2pdICE9PSBhcmd1bWVudHNbaV0pIHtcbiAgICAgIGF0dHJzQ2hhbmdlZCA9IHRydWU7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMSwgaiArPSAxKSB7XG4gICAgYXR0cnNBcnJbal0gPSBhcmd1bWVudHNbaV07XG4gIH1cblxuICBpZiAoaiA8IGF0dHJzQXJyLmxlbmd0aCkge1xuICAgIGF0dHJzQ2hhbmdlZCA9IHRydWU7XG4gICAgYXR0cnNBcnIubGVuZ3RoID0gajtcbiAgfVxuXG4gIC8qXG4gICAqIEFjdHVhbGx5IHBlcmZvcm0gdGhlIGF0dHJpYnV0ZSB1cGRhdGUuXG4gICAqL1xuICBpZiAoYXR0cnNDaGFuZ2VkKSB7XG4gICAgZm9yIChpID0gQVRUUklCVVRFU19PRkZTRVQ7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIG5ld0F0dHJzW2FyZ3VtZW50c1tpXV0gPSBhcmd1bWVudHNbaSArIDFdO1xuICAgIH1cblxuICAgIGZvciAodmFyIGF0dHIgaW4gbmV3QXR0cnMpIHtcbiAgICAgIHVwZGF0ZUF0dHJpYnV0ZShub2RlLCBhdHRyLCBuZXdBdHRyc1thdHRyXSk7XG4gICAgICBuZXdBdHRyc1thdHRyXSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbm9kZTtcbn07XG5cbi8qKlxuICogRGVjbGFyZXMgYSB2aXJ0dWFsIEVsZW1lbnQgYXQgdGhlIGN1cnJlbnQgbG9jYXRpb24gaW4gdGhlIGRvY3VtZW50LiBUaGlzXG4gKiBjb3JyZXNwb25kcyB0byBhbiBvcGVuaW5nIHRhZyBhbmQgYSBlbGVtZW50Q2xvc2UgdGFnIGlzIHJlcXVpcmVkLiBUaGlzIGlzXG4gKiBsaWtlIGVsZW1lbnRPcGVuLCBidXQgdGhlIGF0dHJpYnV0ZXMgYXJlIGRlZmluZWQgdXNpbmcgdGhlIGF0dHIgZnVuY3Rpb25cbiAqIHJhdGhlciB0aGFuIGJlaW5nIHBhc3NlZCBhcyBhcmd1bWVudHMuIE11c3QgYmUgZm9sbGxvd2VkIGJ5IDAgb3IgbW9yZSBjYWxsc1xuICogdG8gYXR0ciwgdGhlbiBhIGNhbGwgdG8gZWxlbWVudE9wZW5FbmQuXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gKiAgICAgd2hlbiBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBvZiBpdGVtcy5cbiAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICogICAgIEVsZW1lbnQgaXMgY3JlYXRlZC5cbiAqL1xuZXhwb3J0cy5lbGVtZW50T3BlblN0YXJ0ID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzKCdlbGVtZW50T3BlblN0YXJ0Jyk7XG4gICAgc2V0SW5BdHRyaWJ1dGVzKHRydWUpO1xuICB9XG5cbiAgYXJnc0J1aWxkZXJbMF0gPSB0YWc7XG4gIGFyZ3NCdWlsZGVyWzFdID0ga2V5O1xuICBhcmdzQnVpbGRlclsyXSA9IHN0YXRpY3M7XG59O1xuXG4vKioqXG4gKiBEZWZpbmVzIGEgdmlydHVhbCBhdHRyaWJ1dGUgYXQgdGhpcyBwb2ludCBvZiB0aGUgRE9NLiBUaGlzIGlzIG9ubHkgdmFsaWRcbiAqIHdoZW4gY2FsbGVkIGJldHdlZW4gZWxlbWVudE9wZW5TdGFydCBhbmQgZWxlbWVudE9wZW5FbmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7Kn0gdmFsdWVcbiAqL1xuZXhwb3J0cy5hdHRyID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0SW5BdHRyaWJ1dGVzKCdhdHRyJyk7XG4gIH1cblxuICBhcmdzQnVpbGRlci5wdXNoKG5hbWUsIHZhbHVlKTtcbn07XG5cbi8qKlxuICogQ2xvc2VzIGFuIG9wZW4gdGFnIHN0YXJ0ZWQgd2l0aCBlbGVtZW50T3BlblN0YXJ0LlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbmV4cG9ydHMuZWxlbWVudE9wZW5FbmQgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0SW5BdHRyaWJ1dGVzKCdlbGVtZW50T3BlbkVuZCcpO1xuICAgIHNldEluQXR0cmlidXRlcyhmYWxzZSk7XG4gIH1cblxuICB2YXIgbm9kZSA9IGV4cG9ydHMuZWxlbWVudE9wZW4uYXBwbHkobnVsbCwgYXJnc0J1aWxkZXIpO1xuICBhcmdzQnVpbGRlci5sZW5ndGggPSAwO1xuICByZXR1cm4gbm9kZTtcbn07XG5cbi8qKlxuICogQ2xvc2VzIGFuIG9wZW4gdmlydHVhbCBFbGVtZW50LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xuZXhwb3J0cy5lbGVtZW50Q2xvc2UgPSBmdW5jdGlvbiAodGFnKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzKCdlbGVtZW50Q2xvc2UnKTtcbiAgfVxuXG4gIHZhciBub2RlID0gX2VsZW1lbnRDbG9zZSgpO1xuXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0Q2xvc2VNYXRjaGVzT3BlblRhZyhnZXREYXRhKG5vZGUpLm5vZGVOYW1lLCB0YWcpO1xuICB9XG5cbiAgcmV0dXJuIG5vZGU7XG59O1xuXG4vKipcbiAqIERlY2xhcmVzIGEgdmlydHVhbCBFbGVtZW50IGF0IHRoZSBjdXJyZW50IGxvY2F0aW9uIGluIHRoZSBkb2N1bWVudCB0aGF0IGhhc1xuICogbm8gY2hpbGRyZW4uXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gKiAgICAgd2hlbiBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBvZiBpdGVtcy5cbiAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICogICAgIEVsZW1lbnQgaXMgY3JlYXRlZC5cbiAqIEBwYXJhbSB7Li4uKn0gdmFyX2FyZ3MgQXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlIGR5bmFtaWMgYXR0cmlidXRlc1xuICogICAgIGZvciB0aGUgRWxlbWVudC5cbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG5leHBvcnRzLmVsZW1lbnRWb2lkID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzLCB2YXJfYXJncykge1xuICB2YXIgbm9kZSA9IGV4cG9ydHMuZWxlbWVudE9wZW4uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgZXhwb3J0cy5lbGVtZW50Q2xvc2UuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgcmV0dXJuIG5vZGU7XG59O1xuXG4vKipcbiAqIERlY2xhcmVzIGEgdmlydHVhbCBFbGVtZW50IGF0IHRoZSBjdXJyZW50IGxvY2F0aW9uIGluIHRoZSBkb2N1bWVudCB0aGF0IGlzIGFcbiAqIHBsYWNlaG9sZGVyIGVsZW1lbnQuIENoaWxkcmVuIG9mIHRoaXMgRWxlbWVudCBjYW4gYmUgbWFudWFsbHkgbWFuYWdlZCBhbmRcbiAqIHdpbGwgbm90IGJlIGNsZWFyZWQgYnkgdGhlIGxpYnJhcnkuXG4gKlxuICogQSBrZXkgbXVzdCBiZSBzcGVjaWZpZWQgdG8gbWFrZSBzdXJlIHRoYXQgdGhpcyBub2RlIGlzIGNvcnJlY3RseSBwcmVzZXJ2ZWRcbiAqIGFjcm9zcyBhbGwgY29uZGl0aW9uYWxzLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuXG4gKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gKiBAcGFyYW0gey4uLip9IHZhcl9hcmdzIEF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZSBkeW5hbWljIGF0dHJpYnV0ZXNcbiAqICAgICBmb3IgdGhlIEVsZW1lbnQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xuZXhwb3J0cy5lbGVtZW50UGxhY2Vob2xkZXIgPSBmdW5jdGlvbiAodGFnLCBrZXksIHN0YXRpY3MsIHZhcl9hcmdzKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0UGxhY2Vob2xkZXJLZXlTcGVjaWZpZWQoa2V5KTtcbiAgfVxuXG4gIGV4cG9ydHMuZWxlbWVudE9wZW4uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgZXhwb3J0cy5za2lwKCk7XG4gIHJldHVybiBleHBvcnRzLmVsZW1lbnRDbG9zZS5hcHBseShudWxsLCBhcmd1bWVudHMpO1xufTtcblxuLyoqXG4gKiBEZWNsYXJlcyBhIHZpcnR1YWwgVGV4dCBhdCB0aGlzIHBvaW50IGluIHRoZSBkb2N1bWVudC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ8Ym9vbGVhbn0gdmFsdWUgVGhlIHZhbHVlIG9mIHRoZSBUZXh0LlxuICogQHBhcmFtIHsuLi4oZnVuY3Rpb24oKHN0cmluZ3xudW1iZXJ8Ym9vbGVhbikpOnN0cmluZyl9IHZhcl9hcmdzXG4gKiAgICAgRnVuY3Rpb25zIHRvIGZvcm1hdCB0aGUgdmFsdWUgd2hpY2ggYXJlIGNhbGxlZCBvbmx5IHdoZW4gdGhlIHZhbHVlIGhhc1xuICogICAgIGNoYW5nZWQuXG4gKiBAcmV0dXJuIHshVGV4dH0gVGhlIGNvcnJlc3BvbmRpbmcgdGV4dCBub2RlLlxuICovXG5leHBvcnRzLnRleHQgPSBmdW5jdGlvbiAodmFsdWUsIHZhcl9hcmdzKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzKCd0ZXh0Jyk7XG4gICAgYXNzZXJ0Tm90SW5Ta2lwKCd0ZXh0Jyk7XG4gIH1cblxuICB2YXIgbm9kZSA9IF90ZXh0KCk7XG4gIHZhciBkYXRhID0gZ2V0RGF0YShub2RlKTtcblxuICBpZiAoZGF0YS50ZXh0ICE9PSB2YWx1ZSkge1xuICAgIGRhdGEudGV4dCA9IC8qKiBAdHlwZSB7c3RyaW5nfSAqL3ZhbHVlO1xuXG4gICAgdmFyIGZvcm1hdHRlZCA9IHZhbHVlO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBmb3JtYXR0ZWQgPSBhcmd1bWVudHNbaV0oZm9ybWF0dGVkKTtcbiAgICB9XG5cbiAgICBub2RlLmRhdGEgPSBmb3JtYXR0ZWQ7XG4gIH1cblxuICByZXR1cm4gbm9kZTtcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmNyZW1lbnRhbC1kb20tY2pzLmpzLm1hcCIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2Rpc3QvY2xpZW50Jyk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qXG4gICAgKGhhcGkpbmVzIFdlYlNvY2tldCBDbGllbnQgKGh0dHBzOi8vZ2l0aHViLmNvbS9oYXBpanMvbmVzKVxuICAgIENvcHlyaWdodCAoYykgMjAxNSwgRXJhbiBIYW1tZXIgPGVyYW5AaGFtbWVyLmlvPiBhbmQgb3RoZXIgY29udHJpYnV0b3JzXG4gICAgQlNEIExpY2Vuc2VkXG4qL1xuXG52YXIgX3R5cGVvZiA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiID8gZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfSA6IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTtcblxuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cbiAgICAvLyAkbGFiOmNvdmVyYWdlOm9mZiRcblxuICAgIGlmICgodHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnID8gJ3VuZGVmaW5lZCcgOiBfdHlwZW9mKGV4cG9ydHMpKSA9PT0gJ29iamVjdCcgJiYgKHR5cGVvZiBtb2R1bGUgPT09ICd1bmRlZmluZWQnID8gJ3VuZGVmaW5lZCcgOiBfdHlwZW9mKG1vZHVsZSkpID09PSAnb2JqZWN0Jykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTsgLy8gRXhwb3J0IGlmIHVzZWQgYXMgYSBtb2R1bGVcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICAgICAgZGVmaW5lKGZhY3RvcnkpO1xuICAgICAgICB9IGVsc2UgaWYgKCh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcgPyAndW5kZWZpbmVkJyA6IF90eXBlb2YoZXhwb3J0cykpID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgZXhwb3J0cy5uZXMgPSBmYWN0b3J5KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByb290Lm5lcyA9IGZhY3RvcnkoKTtcbiAgICAgICAgfVxuXG4gICAgLy8gJGxhYjpjb3ZlcmFnZTpvbiRcbn0pKHVuZGVmaW5lZCwgZnVuY3Rpb24gKCkge1xuXG4gICAgLy8gVXRpbGl0aWVzXG5cbiAgICB2YXIgdmVyc2lvbiA9ICcyJztcbiAgICB2YXIgaWdub3JlID0gZnVuY3Rpb24gaWdub3JlKCkge307XG5cbiAgICB2YXIgcGFyc2UgPSBmdW5jdGlvbiBwYXJzZShtZXNzYWdlLCBuZXh0KSB7XG5cbiAgICAgICAgdmFyIG9iaiA9IG51bGw7XG4gICAgICAgIHZhciBlcnJvciA9IG51bGw7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG9iaiA9IEpTT04ucGFyc2UobWVzc2FnZSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgZXJyb3IgPSBuZXcgTmVzRXJyb3IoZXJyLCAncHJvdG9jb2wnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXh0KGVycm9yLCBvYmopO1xuICAgIH07XG5cbiAgICB2YXIgc3RyaW5naWZ5ID0gZnVuY3Rpb24gc3RyaW5naWZ5KG1lc3NhZ2UsIG5leHQpIHtcblxuICAgICAgICB2YXIgc3RyaW5nID0gbnVsbDtcbiAgICAgICAgdmFyIGVycm9yID0gbnVsbDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc3RyaW5nID0gSlNPTi5zdHJpbmdpZnkobWVzc2FnZSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgZXJyb3IgPSBuZXcgTmVzRXJyb3IoZXJyLCAndXNlcicpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5leHQoZXJyb3IsIHN0cmluZyk7XG4gICAgfTtcblxuICAgIHZhciBOZXNFcnJvciA9IGZ1bmN0aW9uIE5lc0Vycm9yKGVyciwgdHlwZSkge1xuXG4gICAgICAgIGlmICh0eXBlb2YgZXJyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgZXJyID0gbmV3IEVycm9yKGVycik7XG4gICAgICAgIH1cblxuICAgICAgICBlcnIudHlwZSA9IHR5cGU7XG4gICAgICAgIHJldHVybiBlcnI7XG4gICAgfTtcblxuICAgIC8vIEVycm9yIGNvZGVzXG5cbiAgICB2YXIgZXJyb3JDb2RlcyA9IHtcbiAgICAgICAgMTAwMDogJ05vcm1hbCBjbG9zdXJlJyxcbiAgICAgICAgMTAwMTogJ0dvaW5nIGF3YXknLFxuICAgICAgICAxMDAyOiAnUHJvdG9jb2wgZXJyb3InLFxuICAgICAgICAxMDAzOiAnVW5zdXBwb3J0ZWQgZGF0YScsXG4gICAgICAgIDEwMDQ6ICdSZXNlcnZlZCcsXG4gICAgICAgIDEwMDU6ICdObyBzdGF0dXMgcmVjZWl2ZWQnLFxuICAgICAgICAxMDA2OiAnQWJub3JtYWwgY2xvc3VyZScsXG4gICAgICAgIDEwMDc6ICdJbnZhbGlkIGZyYW1lIHBheWxvYWQgZGF0YScsXG4gICAgICAgIDEwMDg6ICdQb2xpY3kgdmlvbGF0aW9uJyxcbiAgICAgICAgMTAwOTogJ01lc3NhZ2UgdG9vIGJpZycsXG4gICAgICAgIDEwMTA6ICdNYW5kYXRvcnkgZXh0ZW5zaW9uJyxcbiAgICAgICAgMTAxMTogJ0ludGVybmFsIHNlcnZlciBlcnJvcicsXG4gICAgICAgIDEwMTU6ICdUTFMgaGFuZHNoYWtlJ1xuICAgIH07XG5cbiAgICAvLyBDbGllbnRcblxuICAgIHZhciBDbGllbnQgPSBmdW5jdGlvbiBDbGllbnQodXJsLCBvcHRpb25zKSB7XG5cbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgLy8gQ29uZmlndXJhdGlvblxuXG4gICAgICAgIHRoaXMuX3VybCA9IHVybDtcbiAgICAgICAgdGhpcy5fc2V0dGluZ3MgPSBvcHRpb25zO1xuICAgICAgICB0aGlzLl9oZWFydGJlYXRUaW1lb3V0ID0gZmFsc2U7IC8vIFNlcnZlciBoZWFydGJlYXQgY29uZmlndXJhdGlvblxuXG4gICAgICAgIC8vIFN0YXRlXG5cbiAgICAgICAgdGhpcy5fd3MgPSBudWxsO1xuICAgICAgICB0aGlzLl9yZWNvbm5lY3Rpb24gPSBudWxsO1xuICAgICAgICB0aGlzLl9pZHMgPSAwOyAvLyBJZCBjb3VudGVyXG4gICAgICAgIHRoaXMuX3JlcXVlc3RzID0ge307IC8vIGlkIC0+IHsgY2FsbGJhY2ssIHRpbWVvdXQgfVxuICAgICAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0ge307IC8vIHBhdGggLT4gW2NhbGxiYWNrc11cbiAgICAgICAgdGhpcy5faGVhcnRiZWF0ID0gbnVsbDtcblxuICAgICAgICAvLyBFdmVudHNcblxuICAgICAgICB0aGlzLm9uRXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICByZXR1cm4gY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9OyAvLyBHZW5lcmFsIGVycm9yIGNhbGxiYWNrIChvbmx5IHdoZW4gYW4gZXJyb3IgY2Fubm90IGJlIGFzc29jaWF0ZWQgd2l0aCBhIHJlcXVlc3QpXG4gICAgICAgIHRoaXMub25Db25uZWN0ID0gaWdub3JlOyAvLyBDYWxsZWQgd2hlbmV2ZXIgYSBjb25uZWN0aW9uIGlzIGVzdGFibGlzaGVkXG4gICAgICAgIHRoaXMub25EaXNjb25uZWN0ID0gaWdub3JlOyAvLyBDYWxsZWQgd2hlbmV2ZXIgYSBjb25uZWN0aW9uIGlzIGxvc3Q6IGZ1bmN0aW9uKHdpbGxSZWNvbm5lY3QpXG4gICAgICAgIHRoaXMub25VcGRhdGUgPSBpZ25vcmU7XG5cbiAgICAgICAgLy8gUHVibGljIHByb3BlcnRpZXNcblxuICAgICAgICB0aGlzLmlkID0gbnVsbDsgLy8gQXNzaWduZWQgd2hlbiBoZWxsbyByZXNwb25zZSBpcyByZWNlaXZlZFxuICAgIH07XG5cbiAgICBDbGllbnQuV2ViU29ja2V0ID0gLyogJGxhYjpjb3ZlcmFnZTpvZmYkICovdHlwZW9mIFdlYlNvY2tldCA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogV2ViU29ja2V0OyAvKiAkbGFiOmNvdmVyYWdlOm9uJCAqL1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5jb25uZWN0ID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRpb25zLnJlY29ubmVjdCAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIC8vIERlZmF1bHRzIHRvIHRydWVcbiAgICAgICAgICAgIHRoaXMuX3JlY29ubmVjdGlvbiA9IHsgLy8gT3B0aW9uczogcmVjb25uZWN0LCBkZWxheSwgbWF4RGVsYXlcbiAgICAgICAgICAgICAgICB3YWl0OiAwLFxuICAgICAgICAgICAgICAgIGRlbGF5OiBvcHRpb25zLmRlbGF5IHx8IDEwMDAsIC8vIDEgc2Vjb25kXG4gICAgICAgICAgICAgICAgbWF4RGVsYXk6IG9wdGlvbnMubWF4RGVsYXkgfHwgNTAwMCwgLy8gNSBzZWNvbmRzXG4gICAgICAgICAgICAgICAgcmV0cmllczogb3B0aW9ucy5yZXRyaWVzIHx8IEluZmluaXR5LCAvLyBVbmxpbWl0ZWRcbiAgICAgICAgICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgICAgICAgICBhdXRoOiBvcHRpb25zLmF1dGgsXG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ6IG9wdGlvbnMudGltZW91dFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9yZWNvbm5lY3Rpb24gPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY29ubmVjdChvcHRpb25zLCB0cnVlLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUuX2Nvbm5lY3QgPSBmdW5jdGlvbiAob3B0aW9ucywgaW5pdGlhbCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICB2YXIgc2VudENhbGxiYWNrID0gZmFsc2U7XG4gICAgICAgIHZhciB0aW1lb3V0SGFuZGxlciA9IGZ1bmN0aW9uIHRpbWVvdXRIYW5kbGVyKCkge1xuXG4gICAgICAgICAgICBzZW50Q2FsbGJhY2sgPSB0cnVlO1xuICAgICAgICAgICAgX3RoaXMuX3dzLmNsb3NlKCk7XG4gICAgICAgICAgICBjYWxsYmFjayhuZXcgTmVzRXJyb3IoJ0Nvbm5lY3Rpb24gdGltZWQgb3V0JywgJ3RpbWVvdXQnKSk7XG4gICAgICAgICAgICBfdGhpcy5fY2xlYW51cCgpO1xuICAgICAgICAgICAgaWYgKGluaXRpYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMuX3JlY29ubmVjdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciB0aW1lb3V0ID0gb3B0aW9ucy50aW1lb3V0ID8gc2V0VGltZW91dCh0aW1lb3V0SGFuZGxlciwgb3B0aW9ucy50aW1lb3V0KSA6IG51bGw7XG5cbiAgICAgICAgdmFyIHdzID0gbmV3IENsaWVudC5XZWJTb2NrZXQodGhpcy5fdXJsLCB0aGlzLl9zZXR0aW5ncy53cyk7IC8vIFNldHRpbmdzIHVzZWQgYnkgbm9kZS5qcyBvbmx5XG4gICAgICAgIHRoaXMuX3dzID0gd3M7XG5cbiAgICAgICAgd3Mub25vcGVuID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG5cbiAgICAgICAgICAgIGlmICghc2VudENhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgc2VudENhbGxiYWNrID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMuX2hlbGxvKG9wdGlvbnMuYXV0aCwgZnVuY3Rpb24gKGVycikge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIucGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBfdGhpcy5fc3Vic2NyaXB0aW9uc1tlcnIucGF0aF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmRpc2Nvbm5lY3QoKTsgLy8gU3RvcCByZWNvbm5lY3Rpb24gd2hlbiB0aGUgaGVsbG8gbWVzc2FnZSByZXR1cm5zIGVycm9yXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLm9uQ29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB3cy5vbmVycm9yID0gZnVuY3Rpb24gKGV2ZW50KSB7XG5cbiAgICAgICAgICAgIHZhciBlcnIgPSBuZXcgTmVzRXJyb3IoJ1NvY2tldCBlcnJvcicsICd3cycpO1xuXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG5cbiAgICAgICAgICAgIGlmICghc2VudENhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgc2VudENhbGxiYWNrID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIF90aGlzLm9uRXJyb3IoZXJyKTtcbiAgICAgICAgfTtcblxuICAgICAgICB3cy5vbmNsb3NlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG5cbiAgICAgICAgICAgIHZhciBsb2cgPSB7XG4gICAgICAgICAgICAgICAgY29kZTogZXZlbnQuY29kZSxcbiAgICAgICAgICAgICAgICBleHBsYW5hdGlvbjogZXJyb3JDb2Rlc1tldmVudC5jb2RlXSB8fCAnVW5rbm93bicsXG4gICAgICAgICAgICAgICAgcmVhc29uOiBldmVudC5yZWFzb24sXG4gICAgICAgICAgICAgICAgd2FzQ2xlYW46IGV2ZW50Lndhc0NsZWFuXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBfdGhpcy5fY2xlYW51cCgpO1xuICAgICAgICAgICAgX3RoaXMub25EaXNjb25uZWN0KCEhKF90aGlzLl9yZWNvbm5lY3Rpb24gJiYgX3RoaXMuX3JlY29ubmVjdGlvbi5yZXRyaWVzID49IDEpLCBsb2cpO1xuICAgICAgICAgICAgX3RoaXMuX3JlY29ubmVjdCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHdzLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5fb25NZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uID0gbnVsbDtcblxuICAgICAgICBpZiAoIXRoaXMuX3dzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fd3MucmVhZHlTdGF0ZSA9PT0gQ2xpZW50LldlYlNvY2tldC5PUEVOIHx8IHRoaXMuX3dzLnJlYWR5U3RhdGUgPT09IENsaWVudC5XZWJTb2NrZXQuQ09OTkVDVElORykge1xuXG4gICAgICAgICAgICB0aGlzLl93cy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUuX2NsZWFudXAgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgdmFyIHdzID0gdGhpcy5fd3M7XG4gICAgICAgIGlmICghd3MpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3dzID0gbnVsbDtcbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHdzLm9ub3BlbiA9IG51bGw7XG4gICAgICAgIHdzLm9uY2xvc2UgPSBudWxsO1xuICAgICAgICB3cy5vbmVycm9yID0gaWdub3JlO1xuICAgICAgICB3cy5vbm1lc3NhZ2UgPSBudWxsO1xuXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9oZWFydGJlYXQpO1xuXG4gICAgICAgIC8vIEZsdXNoIHBlbmRpbmcgcmVxdWVzdHNcblxuICAgICAgICB2YXIgZXJyb3IgPSBuZXcgTmVzRXJyb3IoJ1JlcXVlc3QgZmFpbGVkIC0gc2VydmVyIGRpc2Nvbm5lY3RlZCcsICdkaXNjb25uZWN0Jyk7XG5cbiAgICAgICAgdmFyIGlkcyA9IE9iamVjdC5rZXlzKHRoaXMuX3JlcXVlc3RzKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpZHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBpZCA9IGlkc1tpXTtcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0gdGhpcy5fcmVxdWVzdHNbaWRdO1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gcmVxdWVzdC5jYWxsYmFjaztcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChyZXF1ZXN0LnRpbWVvdXQpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3JlcXVlc3RzW2lkXTtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVycm9yKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLl9yZWNvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG4gICAgICAgIC8vIFJlY29ubmVjdFxuXG4gICAgICAgIGlmICh0aGlzLl9yZWNvbm5lY3Rpb24pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9yZWNvbm5lY3Rpb24ucmV0cmllcyA8IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoKTsgLy8gQ2xlYXIgX3JlY29ubmVjdGlvbiBzdGF0ZVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLS10aGlzLl9yZWNvbm5lY3Rpb24ucmV0cmllcztcbiAgICAgICAgICAgIHRoaXMuX3JlY29ubmVjdGlvbi53YWl0ID0gdGhpcy5fcmVjb25uZWN0aW9uLndhaXQgKyB0aGlzLl9yZWNvbm5lY3Rpb24uZGVsYXk7XG5cbiAgICAgICAgICAgIHZhciB0aW1lb3V0ID0gTWF0aC5taW4odGhpcy5fcmVjb25uZWN0aW9uLndhaXQsIHRoaXMuX3JlY29ubmVjdGlvbi5tYXhEZWxheSk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgICAgIGlmICghX3RoaXMyLl9yZWNvbm5lY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIF90aGlzMi5fY29ubmVjdChfdGhpczIuX3JlY29ubmVjdGlvbi5zZXR0aW5ncywgZmFsc2UsIGZ1bmN0aW9uIChlcnIpIHtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpczIub25FcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMyLl9jbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMyLl9yZWNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5yZXF1ZXN0ID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHBhdGg6IG9wdGlvbnNcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcbiAgICAgICAgICAgIHR5cGU6ICdyZXF1ZXN0JyxcbiAgICAgICAgICAgIG1ldGhvZDogb3B0aW9ucy5tZXRob2QgfHwgJ0dFVCcsXG4gICAgICAgICAgICBwYXRoOiBvcHRpb25zLnBhdGgsXG4gICAgICAgICAgICBoZWFkZXJzOiBvcHRpb25zLmhlYWRlcnMsXG4gICAgICAgICAgICBwYXlsb2FkOiBvcHRpb25zLnBheWxvYWRcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fc2VuZChyZXF1ZXN0LCB0cnVlLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUubWVzc2FnZSA9IGZ1bmN0aW9uIChtZXNzYWdlLCBjYWxsYmFjaykge1xuXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgdHlwZTogJ21lc3NhZ2UnLFxuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9zZW5kKHJlcXVlc3QsIHRydWUsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5fc2VuZCA9IGZ1bmN0aW9uIChyZXF1ZXN0LCB0cmFjaywgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIF90aGlzMyA9IHRoaXM7XG5cbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBpZ25vcmU7XG5cbiAgICAgICAgaWYgKCF0aGlzLl93cyB8fCB0aGlzLl93cy5yZWFkeVN0YXRlICE9PSBDbGllbnQuV2ViU29ja2V0Lk9QRU4pIHtcblxuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBOZXNFcnJvcignRmFpbGVkIHRvIHNlbmQgbWVzc2FnZSAtIHNlcnZlciBkaXNjb25uZWN0ZWQnLCAnZGlzY29ubmVjdCcpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcXVlc3QuaWQgPSArK3RoaXMuX2lkcztcblxuICAgICAgICBzdHJpbmdpZnkocmVxdWVzdCwgZnVuY3Rpb24gKGVyciwgZW5jb2RlZCkge1xuXG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElnbm9yZSBlcnJvcnNcblxuICAgICAgICAgICAgaWYgKCF0cmFjaykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfdGhpczMuX3dzLnNlbmQoZW5jb2RlZCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgTmVzRXJyb3IoZXJyLCAnd3MnKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUcmFjayBlcnJvcnNcblxuICAgICAgICAgICAgdmFyIHJlY29yZCA9IHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2ssXG4gICAgICAgICAgICAgICAgdGltZW91dDogbnVsbFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKF90aGlzMy5fc2V0dGluZ3MudGltZW91dCkge1xuICAgICAgICAgICAgICAgIHJlY29yZC50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVjb3JkLmNhbGxiYWNrID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgcmVjb3JkLnRpbWVvdXQgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgTmVzRXJyb3IoJ1JlcXVlc3QgdGltZWQgb3V0JywgJ3RpbWVvdXQnKSk7XG4gICAgICAgICAgICAgICAgfSwgX3RoaXMzLl9zZXR0aW5ncy50aW1lb3V0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgX3RoaXMzLl9yZXF1ZXN0c1tyZXF1ZXN0LmlkXSA9IHJlY29yZDtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBfdGhpczMuX3dzLnNlbmQoZW5jb2RlZCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoX3RoaXMzLl9yZXF1ZXN0c1tyZXF1ZXN0LmlkXS50aW1lb3V0KTtcbiAgICAgICAgICAgICAgICBkZWxldGUgX3RoaXMzLl9yZXF1ZXN0c1tyZXF1ZXN0LmlkXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IE5lc0Vycm9yKGVyciwgJ3dzJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5faGVsbG8gPSBmdW5jdGlvbiAoYXV0aCwgY2FsbGJhY2spIHtcblxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcbiAgICAgICAgICAgIHR5cGU6ICdoZWxsbycsXG4gICAgICAgICAgICB2ZXJzaW9uOiB2ZXJzaW9uXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGF1dGgpIHtcbiAgICAgICAgICAgIHJlcXVlc3QuYXV0aCA9IGF1dGg7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3VicyA9IHRoaXMuc3Vic2NyaXB0aW9ucygpO1xuICAgICAgICBpZiAoc3Vicy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJlcXVlc3Quc3VicyA9IHN1YnM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5fc2VuZChyZXF1ZXN0LCB0cnVlLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUuc3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5fc3Vic2NyaXB0aW9ucyk7XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24gKHBhdGgsIGhhbmRsZXIsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBfdGhpczQgPSB0aGlzO1xuXG4gICAgICAgIGlmICghcGF0aCB8fCBwYXRoWzBdICE9PSAnLycpIHtcblxuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBOZXNFcnJvcignSW52YWxpZCBwYXRoJywgJ3VzZXInKSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3VicyA9IHRoaXMuX3N1YnNjcmlwdGlvbnNbcGF0aF07XG4gICAgICAgIGlmIChzdWJzKSB7XG5cbiAgICAgICAgICAgIC8vIEFscmVhZHkgc3Vic2NyaWJlZFxuXG4gICAgICAgICAgICBpZiAoc3Vicy5pbmRleE9mKGhhbmRsZXIpID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHN1YnMucHVzaChoYW5kbGVyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zdWJzY3JpcHRpb25zW3BhdGhdID0gW2hhbmRsZXJdO1xuXG4gICAgICAgIGlmICghdGhpcy5fd3MgfHwgdGhpcy5fd3MucmVhZHlTdGF0ZSAhPT0gQ2xpZW50LldlYlNvY2tldC5PUEVOKSB7XG5cbiAgICAgICAgICAgIC8vIFF1ZXVlZCBzdWJzY3JpcHRpb25cblxuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdWInLFxuICAgICAgICAgICAgcGF0aDogcGF0aFxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9zZW5kKHJlcXVlc3QsIHRydWUsIGZ1bmN0aW9uIChlcnIpIHtcblxuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBfdGhpczQuX3N1YnNjcmlwdGlvbnNbcGF0aF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS51bnN1YnNjcmliZSA9IGZ1bmN0aW9uIChwYXRoLCBoYW5kbGVyKSB7XG5cbiAgICAgICAgaWYgKCFwYXRoIHx8IHBhdGhbMF0gIT09ICcvJykge1xuXG4gICAgICAgICAgICByZXR1cm4gaGFuZGxlcihuZXcgTmVzRXJyb3IoJ0ludmFsaWQgcGF0aCcsICd1c2VyJykpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN1YnMgPSB0aGlzLl9zdWJzY3JpcHRpb25zW3BhdGhdO1xuICAgICAgICBpZiAoIXN1YnMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzeW5jID0gZmFsc2U7XG4gICAgICAgIGlmICghaGFuZGxlcikge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3N1YnNjcmlwdGlvbnNbcGF0aF07XG4gICAgICAgICAgICBzeW5jID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBwb3MgPSBzdWJzLmluZGV4T2YoaGFuZGxlcik7XG4gICAgICAgICAgICBpZiAocG9zID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3Vicy5zcGxpY2UocG9zLCAxKTtcbiAgICAgICAgICAgIGlmICghc3Vicy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fc3Vic2NyaXB0aW9uc1twYXRoXTtcbiAgICAgICAgICAgICAgICBzeW5jID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc3luYyB8fCAhdGhpcy5fd3MgfHwgdGhpcy5fd3MucmVhZHlTdGF0ZSAhPT0gQ2xpZW50LldlYlNvY2tldC5PUEVOKSB7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgdHlwZTogJ3Vuc3ViJyxcbiAgICAgICAgICAgIHBhdGg6IHBhdGhcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fc2VuZChyZXF1ZXN0LCBmYWxzZSk7IC8vIElnbm9yaW5nIGVycm9ycyBhcyB0aGUgc3Vic2NyaXB0aW9uIGhhbmRsZXJzIGFyZSBhbHJlYWR5IHJlbW92ZWRcbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5fb25NZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgdmFyIF90aGlzNSA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5fYmVhdCgpO1xuXG4gICAgICAgIHBhcnNlKG1lc3NhZ2UuZGF0YSwgZnVuY3Rpb24gKGVyciwgdXBkYXRlKSB7XG5cbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXM1Lm9uRXJyb3IoZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gUmVjcmVhdGUgZXJyb3JcblxuICAgICAgICAgICAgdmFyIGVycm9yID0gbnVsbDtcbiAgICAgICAgICAgIGlmICh1cGRhdGUuc3RhdHVzQ29kZSAmJiB1cGRhdGUuc3RhdHVzQ29kZSA+PSA0MDAgJiYgdXBkYXRlLnN0YXR1c0NvZGUgPD0gNTk5KSB7XG5cbiAgICAgICAgICAgICAgICBlcnJvciA9IG5ldyBOZXNFcnJvcih1cGRhdGUucGF5bG9hZC5tZXNzYWdlIHx8IHVwZGF0ZS5wYXlsb2FkLmVycm9yLCAnc2VydmVyJyk7XG4gICAgICAgICAgICAgICAgZXJyb3Iuc3RhdHVzQ29kZSA9IHVwZGF0ZS5zdGF0dXNDb2RlO1xuICAgICAgICAgICAgICAgIGVycm9yLmRhdGEgPSB1cGRhdGUucGF5bG9hZDtcbiAgICAgICAgICAgICAgICBlcnJvci5oZWFkZXJzID0gdXBkYXRlLmhlYWRlcnM7XG4gICAgICAgICAgICAgICAgZXJyb3IucGF0aCA9IHVwZGF0ZS5wYXRoO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBQaW5nXG5cbiAgICAgICAgICAgIGlmICh1cGRhdGUudHlwZSA9PT0gJ3BpbmcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzNS5fc2VuZCh7IHR5cGU6ICdwaW5nJyB9LCBmYWxzZSk7IC8vIElnbm9yZSBlcnJvcnNcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQnJvYWRjYXN0IGFuZCB1cGRhdGVcblxuICAgICAgICAgICAgaWYgKHVwZGF0ZS50eXBlID09PSAndXBkYXRlJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdGhpczUub25VcGRhdGUodXBkYXRlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBQdWJsaXNoXG5cbiAgICAgICAgICAgIGlmICh1cGRhdGUudHlwZSA9PT0gJ3B1YicpIHtcbiAgICAgICAgICAgICAgICB2YXIgaGFuZGxlcnMgPSBfdGhpczUuX3N1YnNjcmlwdGlvbnNbdXBkYXRlLnBhdGhdO1xuICAgICAgICAgICAgICAgIGlmIChoYW5kbGVycykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhhbmRsZXJzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyc1tpXSh1cGRhdGUubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIExvb2t1cCBjYWxsYmFjayAobWVzc2FnZSBtdXN0IGluY2x1ZGUgYW4gaWQgZnJvbSB0aGlzIHBvaW50KVxuXG4gICAgICAgICAgICB2YXIgcmVxdWVzdCA9IF90aGlzNS5fcmVxdWVzdHNbdXBkYXRlLmlkXTtcbiAgICAgICAgICAgIGlmICghcmVxdWVzdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdGhpczUub25FcnJvcihuZXcgTmVzRXJyb3IoJ1JlY2VpdmVkIHJlc3BvbnNlIGZvciB1bmtub3duIHJlcXVlc3QnLCAncHJvdG9jb2wnKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IHJlcXVlc3QuY2FsbGJhY2s7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQocmVxdWVzdC50aW1lb3V0KTtcbiAgICAgICAgICAgIGRlbGV0ZSBfdGhpczUuX3JlcXVlc3RzW3VwZGF0ZS5pZF07XG5cbiAgICAgICAgICAgIGlmICghY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICByZXR1cm47IC8vIFJlc3BvbnNlIHJlY2VpdmVkIGFmdGVyIHRpbWVvdXRcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gUmVzcG9uc2VcblxuICAgICAgICAgICAgaWYgKHVwZGF0ZS50eXBlID09PSAncmVxdWVzdCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyb3IsIHVwZGF0ZS5wYXlsb2FkLCB1cGRhdGUuc3RhdHVzQ29kZSwgdXBkYXRlLmhlYWRlcnMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDdXN0b20gbWVzc2FnZVxuXG4gICAgICAgICAgICBpZiAodXBkYXRlLnR5cGUgPT09ICdtZXNzYWdlJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvciwgdXBkYXRlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBBdXRoZW50aWNhdGlvblxuXG4gICAgICAgICAgICBpZiAodXBkYXRlLnR5cGUgPT09ICdoZWxsbycpIHtcbiAgICAgICAgICAgICAgICBfdGhpczUuaWQgPSB1cGRhdGUuc29ja2V0O1xuICAgICAgICAgICAgICAgIGlmICh1cGRhdGUuaGVhcnRiZWF0KSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzNS5faGVhcnRiZWF0VGltZW91dCA9IHVwZGF0ZS5oZWFydGJlYXQuaW50ZXJ2YWwgKyB1cGRhdGUuaGVhcnRiZWF0LnRpbWVvdXQ7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzNS5fYmVhdCgpOyAvLyBDYWxsIGFnYWluIG9uY2UgdGltZW91dCBpcyBzZXRcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyb3IpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTdWJzY3JpcHRpb25zXG5cbiAgICAgICAgICAgIGlmICh1cGRhdGUudHlwZSA9PT0gJ3N1YicpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyb3IpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gX3RoaXM1Lm9uRXJyb3IobmV3IE5lc0Vycm9yKCdSZWNlaXZlZCB1bmtub3duIHJlc3BvbnNlIHR5cGU6ICcgKyB1cGRhdGUudHlwZSwgJ3Byb3RvY29sJykpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5fYmVhdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzNiA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCF0aGlzLl9oZWFydGJlYXRUaW1lb3V0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5faGVhcnRiZWF0KTtcblxuICAgICAgICB0aGlzLl9oZWFydGJlYXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgX3RoaXM2Lm9uRXJyb3IobmV3IE5lc0Vycm9yKCdEaXNjb25uZWN0aW5nIGR1ZSB0byBoZWFydGJlYXQgdGltZW91dCcsICd0aW1lb3V0JykpO1xuICAgICAgICAgICAgX3RoaXM2Ll93cy5jbG9zZSgpO1xuICAgICAgICB9LCB0aGlzLl9oZWFydGJlYXRUaW1lb3V0KTtcbiAgICB9O1xuXG4gICAgLy8gRXhwb3NlIGludGVyZmFjZVxuXG4gICAgcmV0dXJuIHsgQ2xpZW50OiBDbGllbnQgfTtcbn0pO1xuIiwiICAvKiBnbG9iYWxzIHJlcXVpcmUsIG1vZHVsZSAqL1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICAvKipcbiAgICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAgICovXG5cbiAgdmFyIHBhdGh0b1JlZ2V4cCA9IHJlcXVpcmUoJ3BhdGgtdG8tcmVnZXhwJyk7XG5cbiAgLyoqXG4gICAqIE1vZHVsZSBleHBvcnRzLlxuICAgKi9cblxuICBtb2R1bGUuZXhwb3J0cyA9IHBhZ2U7XG5cbiAgLyoqXG4gICAqIERldGVjdCBjbGljayBldmVudFxuICAgKi9cbiAgdmFyIGNsaWNrRXZlbnQgPSAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBkb2N1bWVudCkgJiYgZG9jdW1lbnQub250b3VjaHN0YXJ0ID8gJ3RvdWNoc3RhcnQnIDogJ2NsaWNrJztcblxuICAvKipcbiAgICogVG8gd29yayBwcm9wZXJseSB3aXRoIHRoZSBVUkxcbiAgICogaGlzdG9yeS5sb2NhdGlvbiBnZW5lcmF0ZWQgcG9seWZpbGwgaW4gaHR0cHM6Ly9naXRodWIuY29tL2Rldm90ZS9IVE1MNS1IaXN0b3J5LUFQSVxuICAgKi9cblxuICB2YXIgbG9jYXRpb24gPSAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiB3aW5kb3cpICYmICh3aW5kb3cuaGlzdG9yeS5sb2NhdGlvbiB8fCB3aW5kb3cubG9jYXRpb24pO1xuXG4gIC8qKlxuICAgKiBQZXJmb3JtIGluaXRpYWwgZGlzcGF0Y2guXG4gICAqL1xuXG4gIHZhciBkaXNwYXRjaCA9IHRydWU7XG5cblxuICAvKipcbiAgICogRGVjb2RlIFVSTCBjb21wb25lbnRzIChxdWVyeSBzdHJpbmcsIHBhdGhuYW1lLCBoYXNoKS5cbiAgICogQWNjb21tb2RhdGVzIGJvdGggcmVndWxhciBwZXJjZW50IGVuY29kaW5nIGFuZCB4LXd3dy1mb3JtLXVybGVuY29kZWQgZm9ybWF0LlxuICAgKi9cbiAgdmFyIGRlY29kZVVSTENvbXBvbmVudHMgPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBCYXNlIHBhdGguXG4gICAqL1xuXG4gIHZhciBiYXNlID0gJyc7XG5cbiAgLyoqXG4gICAqIFJ1bm5pbmcgZmxhZy5cbiAgICovXG5cbiAgdmFyIHJ1bm5pbmc7XG5cbiAgLyoqXG4gICAqIEhhc2hCYW5nIG9wdGlvblxuICAgKi9cblxuICB2YXIgaGFzaGJhbmcgPSBmYWxzZTtcblxuICAvKipcbiAgICogUHJldmlvdXMgY29udGV4dCwgZm9yIGNhcHR1cmluZ1xuICAgKiBwYWdlIGV4aXQgZXZlbnRzLlxuICAgKi9cblxuICB2YXIgcHJldkNvbnRleHQ7XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGBwYXRoYCB3aXRoIGNhbGxiYWNrIGBmbigpYCxcbiAgICogb3Igcm91dGUgYHBhdGhgLCBvciByZWRpcmVjdGlvbixcbiAgICogb3IgYHBhZ2Uuc3RhcnQoKWAuXG4gICAqXG4gICAqICAgcGFnZShmbik7XG4gICAqICAgcGFnZSgnKicsIGZuKTtcbiAgICogICBwYWdlKCcvdXNlci86aWQnLCBsb2FkLCB1c2VyKTtcbiAgICogICBwYWdlKCcvdXNlci8nICsgdXNlci5pZCwgeyBzb21lOiAndGhpbmcnIH0pO1xuICAgKiAgIHBhZ2UoJy91c2VyLycgKyB1c2VyLmlkKTtcbiAgICogICBwYWdlKCcvZnJvbScsICcvdG8nKVxuICAgKiAgIHBhZ2UoKTtcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd8RnVuY3Rpb259IHBhdGhcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4uLi5cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgZnVuY3Rpb24gcGFnZShwYXRoLCBmbikge1xuICAgIC8vIDxjYWxsYmFjaz5cbiAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIHBhdGgpIHtcbiAgICAgIHJldHVybiBwYWdlKCcqJywgcGF0aCk7XG4gICAgfVxuXG4gICAgLy8gcm91dGUgPHBhdGg+IHRvIDxjYWxsYmFjayAuLi4+XG4gICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBmbikge1xuICAgICAgdmFyIHJvdXRlID0gbmV3IFJvdXRlKHBhdGgpO1xuICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgcGFnZS5jYWxsYmFja3MucHVzaChyb3V0ZS5taWRkbGV3YXJlKGFyZ3VtZW50c1tpXSkpO1xuICAgICAgfVxuICAgICAgLy8gc2hvdyA8cGF0aD4gd2l0aCBbc3RhdGVdXG4gICAgfSBlbHNlIGlmICgnc3RyaW5nJyA9PT0gdHlwZW9mIHBhdGgpIHtcbiAgICAgIHBhZ2VbJ3N0cmluZycgPT09IHR5cGVvZiBmbiA/ICdyZWRpcmVjdCcgOiAnc2hvdyddKHBhdGgsIGZuKTtcbiAgICAgIC8vIHN0YXJ0IFtvcHRpb25zXVxuICAgIH0gZWxzZSB7XG4gICAgICBwYWdlLnN0YXJ0KHBhdGgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsYmFjayBmdW5jdGlvbnMuXG4gICAqL1xuXG4gIHBhZ2UuY2FsbGJhY2tzID0gW107XG4gIHBhZ2UuZXhpdHMgPSBbXTtcblxuICAvKipcbiAgICogQ3VycmVudCBwYXRoIGJlaW5nIHByb2Nlc3NlZFxuICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgKi9cbiAgcGFnZS5jdXJyZW50ID0gJyc7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBwYWdlcyBuYXZpZ2F0ZWQgdG8uXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqXG4gICAqICAgICBwYWdlLmxlbiA9PSAwO1xuICAgKiAgICAgcGFnZSgnL2xvZ2luJyk7XG4gICAqICAgICBwYWdlLmxlbiA9PSAxO1xuICAgKi9cblxuICBwYWdlLmxlbiA9IDA7XG5cbiAgLyoqXG4gICAqIEdldCBvciBzZXQgYmFzZXBhdGggdG8gYHBhdGhgLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBwYWdlLmJhc2UgPSBmdW5jdGlvbihwYXRoKSB7XG4gICAgaWYgKDAgPT09IGFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBiYXNlO1xuICAgIGJhc2UgPSBwYXRoO1xuICB9O1xuXG4gIC8qKlxuICAgKiBCaW5kIHdpdGggdGhlIGdpdmVuIGBvcHRpb25zYC5cbiAgICpcbiAgICogT3B0aW9uczpcbiAgICpcbiAgICogICAgLSBgY2xpY2tgIGJpbmQgdG8gY2xpY2sgZXZlbnRzIFt0cnVlXVxuICAgKiAgICAtIGBwb3BzdGF0ZWAgYmluZCB0byBwb3BzdGF0ZSBbdHJ1ZV1cbiAgICogICAgLSBgZGlzcGF0Y2hgIHBlcmZvcm0gaW5pdGlhbCBkaXNwYXRjaCBbdHJ1ZV1cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgcGFnZS5zdGFydCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBpZiAocnVubmluZykgcmV0dXJuO1xuICAgIHJ1bm5pbmcgPSB0cnVlO1xuICAgIGlmIChmYWxzZSA9PT0gb3B0aW9ucy5kaXNwYXRjaCkgZGlzcGF0Y2ggPSBmYWxzZTtcbiAgICBpZiAoZmFsc2UgPT09IG9wdGlvbnMuZGVjb2RlVVJMQ29tcG9uZW50cykgZGVjb2RlVVJMQ29tcG9uZW50cyA9IGZhbHNlO1xuICAgIGlmIChmYWxzZSAhPT0gb3B0aW9ucy5wb3BzdGF0ZSkgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3BvcHN0YXRlJywgb25wb3BzdGF0ZSwgZmFsc2UpO1xuICAgIGlmIChmYWxzZSAhPT0gb3B0aW9ucy5jbGljaykge1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihjbGlja0V2ZW50LCBvbmNsaWNrLCBmYWxzZSk7XG4gICAgfVxuICAgIGlmICh0cnVlID09PSBvcHRpb25zLmhhc2hiYW5nKSBoYXNoYmFuZyA9IHRydWU7XG4gICAgaWYgKCFkaXNwYXRjaCkgcmV0dXJuO1xuICAgIHZhciB1cmwgPSAoaGFzaGJhbmcgJiYgfmxvY2F0aW9uLmhhc2guaW5kZXhPZignIyEnKSkgPyBsb2NhdGlvbi5oYXNoLnN1YnN0cigyKSArIGxvY2F0aW9uLnNlYXJjaCA6IGxvY2F0aW9uLnBhdGhuYW1lICsgbG9jYXRpb24uc2VhcmNoICsgbG9jYXRpb24uaGFzaDtcbiAgICBwYWdlLnJlcGxhY2UodXJsLCBudWxsLCB0cnVlLCBkaXNwYXRjaCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFVuYmluZCBjbGljayBhbmQgcG9wc3RhdGUgZXZlbnQgaGFuZGxlcnMuXG4gICAqXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIHBhZ2Uuc3RvcCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghcnVubmluZykgcmV0dXJuO1xuICAgIHBhZ2UuY3VycmVudCA9ICcnO1xuICAgIHBhZ2UubGVuID0gMDtcbiAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihjbGlja0V2ZW50LCBvbmNsaWNrLCBmYWxzZSk7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvcHN0YXRlJywgb25wb3BzdGF0ZSwgZmFsc2UpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTaG93IGBwYXRoYCB3aXRoIG9wdGlvbmFsIGBzdGF0ZWAgb2JqZWN0LlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAcGFyYW0ge09iamVjdH0gc3RhdGVcbiAgICogQHBhcmFtIHtCb29sZWFufSBkaXNwYXRjaFxuICAgKiBAcmV0dXJuIHtDb250ZXh0fVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBwYWdlLnNob3cgPSBmdW5jdGlvbihwYXRoLCBzdGF0ZSwgZGlzcGF0Y2gsIHB1c2gpIHtcbiAgICB2YXIgY3R4ID0gbmV3IENvbnRleHQocGF0aCwgc3RhdGUpO1xuICAgIHBhZ2UuY3VycmVudCA9IGN0eC5wYXRoO1xuICAgIGlmIChmYWxzZSAhPT0gZGlzcGF0Y2gpIHBhZ2UuZGlzcGF0Y2goY3R4KTtcbiAgICBpZiAoZmFsc2UgIT09IGN0eC5oYW5kbGVkICYmIGZhbHNlICE9PSBwdXNoKSBjdHgucHVzaFN0YXRlKCk7XG4gICAgcmV0dXJuIGN0eDtcbiAgfTtcblxuICAvKipcbiAgICogR29lcyBiYWNrIGluIHRoZSBoaXN0b3J5XG4gICAqIEJhY2sgc2hvdWxkIGFsd2F5cyBsZXQgdGhlIGN1cnJlbnQgcm91dGUgcHVzaCBzdGF0ZSBhbmQgdGhlbiBnbyBiYWNrLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCAtIGZhbGxiYWNrIHBhdGggdG8gZ28gYmFjayBpZiBubyBtb3JlIGhpc3RvcnkgZXhpc3RzLCBpZiB1bmRlZmluZWQgZGVmYXVsdHMgdG8gcGFnZS5iYXNlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbc3RhdGVdXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIHBhZ2UuYmFjayA9IGZ1bmN0aW9uKHBhdGgsIHN0YXRlKSB7XG4gICAgaWYgKHBhZ2UubGVuID4gMCkge1xuICAgICAgLy8gdGhpcyBtYXkgbmVlZCBtb3JlIHRlc3RpbmcgdG8gc2VlIGlmIGFsbCBicm93c2Vyc1xuICAgICAgLy8gd2FpdCBmb3IgdGhlIG5leHQgdGljayB0byBnbyBiYWNrIGluIGhpc3RvcnlcbiAgICAgIGhpc3RvcnkuYmFjaygpO1xuICAgICAgcGFnZS5sZW4tLTtcbiAgICB9IGVsc2UgaWYgKHBhdGgpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHBhZ2Uuc2hvdyhwYXRoLCBzdGF0ZSk7XG4gICAgICB9KTtcbiAgICB9ZWxzZXtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHBhZ2Uuc2hvdyhiYXNlLCBzdGF0ZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cblxuICAvKipcbiAgICogUmVnaXN0ZXIgcm91dGUgdG8gcmVkaXJlY3QgZnJvbSBvbmUgcGF0aCB0byBvdGhlclxuICAgKiBvciBqdXN0IHJlZGlyZWN0IHRvIGFub3RoZXIgcm91dGVcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGZyb20gLSBpZiBwYXJhbSAndG8nIGlzIHVuZGVmaW5lZCByZWRpcmVjdHMgdG8gJ2Zyb20nXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBbdG9dXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuICBwYWdlLnJlZGlyZWN0ID0gZnVuY3Rpb24oZnJvbSwgdG8pIHtcbiAgICAvLyBEZWZpbmUgcm91dGUgZnJvbSBhIHBhdGggdG8gYW5vdGhlclxuICAgIGlmICgnc3RyaW5nJyA9PT0gdHlwZW9mIGZyb20gJiYgJ3N0cmluZycgPT09IHR5cGVvZiB0bykge1xuICAgICAgcGFnZShmcm9tLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcGFnZS5yZXBsYWNlKHRvKTtcbiAgICAgICAgfSwgMCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBXYWl0IGZvciB0aGUgcHVzaCBzdGF0ZSBhbmQgcmVwbGFjZSBpdCB3aXRoIGFub3RoZXJcbiAgICBpZiAoJ3N0cmluZycgPT09IHR5cGVvZiBmcm9tICYmICd1bmRlZmluZWQnID09PSB0eXBlb2YgdG8pIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHBhZ2UucmVwbGFjZShmcm9tKTtcbiAgICAgIH0sIDApO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogUmVwbGFjZSBgcGF0aGAgd2l0aCBvcHRpb25hbCBgc3RhdGVgIG9iamVjdC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IHN0YXRlXG4gICAqIEByZXR1cm4ge0NvbnRleHR9XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG5cbiAgcGFnZS5yZXBsYWNlID0gZnVuY3Rpb24ocGF0aCwgc3RhdGUsIGluaXQsIGRpc3BhdGNoKSB7XG4gICAgdmFyIGN0eCA9IG5ldyBDb250ZXh0KHBhdGgsIHN0YXRlKTtcbiAgICBwYWdlLmN1cnJlbnQgPSBjdHgucGF0aDtcbiAgICBjdHguaW5pdCA9IGluaXQ7XG4gICAgY3R4LnNhdmUoKTsgLy8gc2F2ZSBiZWZvcmUgZGlzcGF0Y2hpbmcsIHdoaWNoIG1heSByZWRpcmVjdFxuICAgIGlmIChmYWxzZSAhPT0gZGlzcGF0Y2gpIHBhZ2UuZGlzcGF0Y2goY3R4KTtcbiAgICByZXR1cm4gY3R4O1xuICB9O1xuXG4gIC8qKlxuICAgKiBEaXNwYXRjaCB0aGUgZ2l2ZW4gYGN0eGAuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjdHhcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIHBhZ2UuZGlzcGF0Y2ggPSBmdW5jdGlvbihjdHgpIHtcbiAgICB2YXIgcHJldiA9IHByZXZDb250ZXh0LFxuICAgICAgaSA9IDAsXG4gICAgICBqID0gMDtcblxuICAgIHByZXZDb250ZXh0ID0gY3R4O1xuXG4gICAgZnVuY3Rpb24gbmV4dEV4aXQoKSB7XG4gICAgICB2YXIgZm4gPSBwYWdlLmV4aXRzW2orK107XG4gICAgICBpZiAoIWZuKSByZXR1cm4gbmV4dEVudGVyKCk7XG4gICAgICBmbihwcmV2LCBuZXh0RXhpdCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbmV4dEVudGVyKCkge1xuICAgICAgdmFyIGZuID0gcGFnZS5jYWxsYmFja3NbaSsrXTtcblxuICAgICAgaWYgKGN0eC5wYXRoICE9PSBwYWdlLmN1cnJlbnQpIHtcbiAgICAgICAgY3R4LmhhbmRsZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCFmbikgcmV0dXJuIHVuaGFuZGxlZChjdHgpO1xuICAgICAgZm4oY3R4LCBuZXh0RW50ZXIpO1xuICAgIH1cblxuICAgIGlmIChwcmV2KSB7XG4gICAgICBuZXh0RXhpdCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXh0RW50ZXIoKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFVuaGFuZGxlZCBgY3R4YC4gV2hlbiBpdCdzIG5vdCB0aGUgaW5pdGlhbFxuICAgKiBwb3BzdGF0ZSB0aGVuIHJlZGlyZWN0LiBJZiB5b3Ugd2lzaCB0byBoYW5kbGVcbiAgICogNDA0cyBvbiB5b3VyIG93biB1c2UgYHBhZ2UoJyonLCBjYWxsYmFjaylgLlxuICAgKlxuICAgKiBAcGFyYW0ge0NvbnRleHR9IGN0eFxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgZnVuY3Rpb24gdW5oYW5kbGVkKGN0eCkge1xuICAgIGlmIChjdHguaGFuZGxlZCkgcmV0dXJuO1xuICAgIHZhciBjdXJyZW50O1xuXG4gICAgaWYgKGhhc2hiYW5nKSB7XG4gICAgICBjdXJyZW50ID0gYmFzZSArIGxvY2F0aW9uLmhhc2gucmVwbGFjZSgnIyEnLCAnJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGN1cnJlbnQgPSBsb2NhdGlvbi5wYXRobmFtZSArIGxvY2F0aW9uLnNlYXJjaDtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudCA9PT0gY3R4LmNhbm9uaWNhbFBhdGgpIHJldHVybjtcbiAgICBwYWdlLnN0b3AoKTtcbiAgICBjdHguaGFuZGxlZCA9IGZhbHNlO1xuICAgIGxvY2F0aW9uLmhyZWYgPSBjdHguY2Fub25pY2FsUGF0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhbiBleGl0IHJvdXRlIG9uIGBwYXRoYCB3aXRoXG4gICAqIGNhbGxiYWNrIGBmbigpYCwgd2hpY2ggd2lsbCBiZSBjYWxsZWRcbiAgICogb24gdGhlIHByZXZpb3VzIGNvbnRleHQgd2hlbiBhIG5ld1xuICAgKiBwYWdlIGlzIHZpc2l0ZWQuXG4gICAqL1xuICBwYWdlLmV4aXQgPSBmdW5jdGlvbihwYXRoLCBmbikge1xuICAgIGlmICh0eXBlb2YgcGF0aCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHBhZ2UuZXhpdCgnKicsIHBhdGgpO1xuICAgIH1cblxuICAgIHZhciByb3V0ZSA9IG5ldyBSb3V0ZShwYXRoKTtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgcGFnZS5leGl0cy5wdXNoKHJvdXRlLm1pZGRsZXdhcmUoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBSZW1vdmUgVVJMIGVuY29kaW5nIGZyb20gdGhlIGdpdmVuIGBzdHJgLlxuICAgKiBBY2NvbW1vZGF0ZXMgd2hpdGVzcGFjZSBpbiBib3RoIHgtd3d3LWZvcm0tdXJsZW5jb2RlZFxuICAgKiBhbmQgcmVndWxhciBwZXJjZW50LWVuY29kZWQgZm9ybS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJ9IFVSTCBjb21wb25lbnQgdG8gZGVjb2RlXG4gICAqL1xuICBmdW5jdGlvbiBkZWNvZGVVUkxFbmNvZGVkVVJJQ29tcG9uZW50KHZhbCkge1xuICAgIGlmICh0eXBlb2YgdmFsICE9PSAnc3RyaW5nJykgeyByZXR1cm4gdmFsOyB9XG4gICAgcmV0dXJuIGRlY29kZVVSTENvbXBvbmVudHMgPyBkZWNvZGVVUklDb21wb25lbnQodmFsLnJlcGxhY2UoL1xcKy9nLCAnICcpKSA6IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGEgbmV3IFwicmVxdWVzdFwiIGBDb250ZXh0YFxuICAgKiB3aXRoIHRoZSBnaXZlbiBgcGF0aGAgYW5kIG9wdGlvbmFsIGluaXRpYWwgYHN0YXRlYC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IHN0YXRlXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGZ1bmN0aW9uIENvbnRleHQocGF0aCwgc3RhdGUpIHtcbiAgICBpZiAoJy8nID09PSBwYXRoWzBdICYmIDAgIT09IHBhdGguaW5kZXhPZihiYXNlKSkgcGF0aCA9IGJhc2UgKyAoaGFzaGJhbmcgPyAnIyEnIDogJycpICsgcGF0aDtcbiAgICB2YXIgaSA9IHBhdGguaW5kZXhPZignPycpO1xuXG4gICAgdGhpcy5jYW5vbmljYWxQYXRoID0gcGF0aDtcbiAgICB0aGlzLnBhdGggPSBwYXRoLnJlcGxhY2UoYmFzZSwgJycpIHx8ICcvJztcbiAgICBpZiAoaGFzaGJhbmcpIHRoaXMucGF0aCA9IHRoaXMucGF0aC5yZXBsYWNlKCcjIScsICcnKSB8fCAnLyc7XG5cbiAgICB0aGlzLnRpdGxlID0gZG9jdW1lbnQudGl0bGU7XG4gICAgdGhpcy5zdGF0ZSA9IHN0YXRlIHx8IHt9O1xuICAgIHRoaXMuc3RhdGUucGF0aCA9IHBhdGg7XG4gICAgdGhpcy5xdWVyeXN0cmluZyA9IH5pID8gZGVjb2RlVVJMRW5jb2RlZFVSSUNvbXBvbmVudChwYXRoLnNsaWNlKGkgKyAxKSkgOiAnJztcbiAgICB0aGlzLnBhdGhuYW1lID0gZGVjb2RlVVJMRW5jb2RlZFVSSUNvbXBvbmVudCh+aSA/IHBhdGguc2xpY2UoMCwgaSkgOiBwYXRoKTtcbiAgICB0aGlzLnBhcmFtcyA9IHt9O1xuXG4gICAgLy8gZnJhZ21lbnRcbiAgICB0aGlzLmhhc2ggPSAnJztcbiAgICBpZiAoIWhhc2hiYW5nKSB7XG4gICAgICBpZiAoIX50aGlzLnBhdGguaW5kZXhPZignIycpKSByZXR1cm47XG4gICAgICB2YXIgcGFydHMgPSB0aGlzLnBhdGguc3BsaXQoJyMnKTtcbiAgICAgIHRoaXMucGF0aCA9IHBhcnRzWzBdO1xuICAgICAgdGhpcy5oYXNoID0gZGVjb2RlVVJMRW5jb2RlZFVSSUNvbXBvbmVudChwYXJ0c1sxXSkgfHwgJyc7XG4gICAgICB0aGlzLnF1ZXJ5c3RyaW5nID0gdGhpcy5xdWVyeXN0cmluZy5zcGxpdCgnIycpWzBdO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeHBvc2UgYENvbnRleHRgLlxuICAgKi9cblxuICBwYWdlLkNvbnRleHQgPSBDb250ZXh0O1xuXG4gIC8qKlxuICAgKiBQdXNoIHN0YXRlLlxuICAgKlxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgQ29udGV4dC5wcm90b3R5cGUucHVzaFN0YXRlID0gZnVuY3Rpb24oKSB7XG4gICAgcGFnZS5sZW4rKztcbiAgICBoaXN0b3J5LnB1c2hTdGF0ZSh0aGlzLnN0YXRlLCB0aGlzLnRpdGxlLCBoYXNoYmFuZyAmJiB0aGlzLnBhdGggIT09ICcvJyA/ICcjIScgKyB0aGlzLnBhdGggOiB0aGlzLmNhbm9uaWNhbFBhdGgpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTYXZlIHRoZSBjb250ZXh0IHN0YXRlLlxuICAgKlxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBDb250ZXh0LnByb3RvdHlwZS5zYXZlID0gZnVuY3Rpb24oKSB7XG4gICAgaGlzdG9yeS5yZXBsYWNlU3RhdGUodGhpcy5zdGF0ZSwgdGhpcy50aXRsZSwgaGFzaGJhbmcgJiYgdGhpcy5wYXRoICE9PSAnLycgPyAnIyEnICsgdGhpcy5wYXRoIDogdGhpcy5jYW5vbmljYWxQYXRoKTtcbiAgfTtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBgUm91dGVgIHdpdGggdGhlIGdpdmVuIEhUVFAgYHBhdGhgLFxuICAgKiBhbmQgYW4gYXJyYXkgb2YgYGNhbGxiYWNrc2AgYW5kIGBvcHRpb25zYC5cbiAgICpcbiAgICogT3B0aW9uczpcbiAgICpcbiAgICogICAtIGBzZW5zaXRpdmVgICAgIGVuYWJsZSBjYXNlLXNlbnNpdGl2ZSByb3V0ZXNcbiAgICogICAtIGBzdHJpY3RgICAgICAgIGVuYWJsZSBzdHJpY3QgbWF0Y2hpbmcgZm9yIHRyYWlsaW5nIHNsYXNoZXNcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMuXG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBmdW5jdGlvbiBSb3V0ZShwYXRoLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy5wYXRoID0gKHBhdGggPT09ICcqJykgPyAnKC4qKScgOiBwYXRoO1xuICAgIHRoaXMubWV0aG9kID0gJ0dFVCc7XG4gICAgdGhpcy5yZWdleHAgPSBwYXRodG9SZWdleHAodGhpcy5wYXRoLFxuICAgICAgdGhpcy5rZXlzID0gW10sXG4gICAgICBvcHRpb25zLnNlbnNpdGl2ZSxcbiAgICAgIG9wdGlvbnMuc3RyaWN0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHBvc2UgYFJvdXRlYC5cbiAgICovXG5cbiAgcGFnZS5Sb3V0ZSA9IFJvdXRlO1xuXG4gIC8qKlxuICAgKiBSZXR1cm4gcm91dGUgbWlkZGxld2FyZSB3aXRoXG4gICAqIHRoZSBnaXZlbiBjYWxsYmFjayBgZm4oKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBSb3V0ZS5wcm90b3R5cGUubWlkZGxld2FyZSA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiBmdW5jdGlvbihjdHgsIG5leHQpIHtcbiAgICAgIGlmIChzZWxmLm1hdGNoKGN0eC5wYXRoLCBjdHgucGFyYW1zKSkgcmV0dXJuIGZuKGN0eCwgbmV4dCk7XG4gICAgICBuZXh0KCk7XG4gICAgfTtcbiAgfTtcblxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhpcyByb3V0ZSBtYXRjaGVzIGBwYXRoYCwgaWYgc29cbiAgICogcG9wdWxhdGUgYHBhcmFtc2AuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXNcbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIFJvdXRlLnByb3RvdHlwZS5tYXRjaCA9IGZ1bmN0aW9uKHBhdGgsIHBhcmFtcykge1xuICAgIHZhciBrZXlzID0gdGhpcy5rZXlzLFxuICAgICAgcXNJbmRleCA9IHBhdGguaW5kZXhPZignPycpLFxuICAgICAgcGF0aG5hbWUgPSB+cXNJbmRleCA/IHBhdGguc2xpY2UoMCwgcXNJbmRleCkgOiBwYXRoLFxuICAgICAgbSA9IHRoaXMucmVnZXhwLmV4ZWMoZGVjb2RlVVJJQ29tcG9uZW50KHBhdGhuYW1lKSk7XG5cbiAgICBpZiAoIW0pIHJldHVybiBmYWxzZTtcblxuICAgIGZvciAodmFyIGkgPSAxLCBsZW4gPSBtLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICB2YXIga2V5ID0ga2V5c1tpIC0gMV07XG4gICAgICB2YXIgdmFsID0gZGVjb2RlVVJMRW5jb2RlZFVSSUNvbXBvbmVudChtW2ldKTtcbiAgICAgIGlmICh2YWwgIT09IHVuZGVmaW5lZCB8fCAhKGhhc093blByb3BlcnR5LmNhbGwocGFyYW1zLCBrZXkubmFtZSkpKSB7XG4gICAgICAgIHBhcmFtc1trZXkubmFtZV0gPSB2YWw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cblxuICAvKipcbiAgICogSGFuZGxlIFwicG9wdWxhdGVcIiBldmVudHMuXG4gICAqL1xuXG4gIHZhciBvbnBvcHN0YXRlID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbG9hZGVkID0gZmFsc2U7XG4gICAgaWYgKCd1bmRlZmluZWQnID09PSB0eXBlb2Ygd2luZG93KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XG4gICAgICBsb2FkZWQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGxvYWRlZCA9IHRydWU7XG4gICAgICAgIH0sIDApO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiBvbnBvcHN0YXRlKGUpIHtcbiAgICAgIGlmICghbG9hZGVkKSByZXR1cm47XG4gICAgICBpZiAoZS5zdGF0ZSkge1xuICAgICAgICB2YXIgcGF0aCA9IGUuc3RhdGUucGF0aDtcbiAgICAgICAgcGFnZS5yZXBsYWNlKHBhdGgsIGUuc3RhdGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFnZS5zaG93KGxvY2F0aW9uLnBhdGhuYW1lICsgbG9jYXRpb24uaGFzaCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9O1xuICB9KSgpO1xuICAvKipcbiAgICogSGFuZGxlIFwiY2xpY2tcIiBldmVudHMuXG4gICAqL1xuXG4gIGZ1bmN0aW9uIG9uY2xpY2soZSkge1xuXG4gICAgaWYgKDEgIT09IHdoaWNoKGUpKSByZXR1cm47XG5cbiAgICBpZiAoZS5tZXRhS2V5IHx8IGUuY3RybEtleSB8fCBlLnNoaWZ0S2V5KSByZXR1cm47XG4gICAgaWYgKGUuZGVmYXVsdFByZXZlbnRlZCkgcmV0dXJuO1xuXG5cblxuICAgIC8vIGVuc3VyZSBsaW5rXG4gICAgdmFyIGVsID0gZS50YXJnZXQ7XG4gICAgd2hpbGUgKGVsICYmICdBJyAhPT0gZWwubm9kZU5hbWUpIGVsID0gZWwucGFyZW50Tm9kZTtcbiAgICBpZiAoIWVsIHx8ICdBJyAhPT0gZWwubm9kZU5hbWUpIHJldHVybjtcblxuXG5cbiAgICAvLyBJZ25vcmUgaWYgdGFnIGhhc1xuICAgIC8vIDEuIFwiZG93bmxvYWRcIiBhdHRyaWJ1dGVcbiAgICAvLyAyLiByZWw9XCJleHRlcm5hbFwiIGF0dHJpYnV0ZVxuICAgIGlmIChlbC5oYXNBdHRyaWJ1dGUoJ2Rvd25sb2FkJykgfHwgZWwuZ2V0QXR0cmlidXRlKCdyZWwnKSA9PT0gJ2V4dGVybmFsJykgcmV0dXJuO1xuXG4gICAgLy8gZW5zdXJlIG5vbi1oYXNoIGZvciB0aGUgc2FtZSBwYXRoXG4gICAgdmFyIGxpbmsgPSBlbC5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcbiAgICBpZiAoIWhhc2hiYW5nICYmIGVsLnBhdGhuYW1lID09PSBsb2NhdGlvbi5wYXRobmFtZSAmJiAoZWwuaGFzaCB8fCAnIycgPT09IGxpbmspKSByZXR1cm47XG5cblxuXG4gICAgLy8gQ2hlY2sgZm9yIG1haWx0bzogaW4gdGhlIGhyZWZcbiAgICBpZiAobGluayAmJiBsaW5rLmluZGV4T2YoJ21haWx0bzonKSA+IC0xKSByZXR1cm47XG5cbiAgICAvLyBjaGVjayB0YXJnZXRcbiAgICBpZiAoZWwudGFyZ2V0KSByZXR1cm47XG5cbiAgICAvLyB4LW9yaWdpblxuICAgIGlmICghc2FtZU9yaWdpbihlbC5ocmVmKSkgcmV0dXJuO1xuXG5cblxuICAgIC8vIHJlYnVpbGQgcGF0aFxuICAgIHZhciBwYXRoID0gZWwucGF0aG5hbWUgKyBlbC5zZWFyY2ggKyAoZWwuaGFzaCB8fCAnJyk7XG5cbiAgICAvLyBzdHJpcCBsZWFkaW5nIFwiL1tkcml2ZSBsZXR0ZXJdOlwiIG9uIE5XLmpzIG9uIFdpbmRvd3NcbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHBhdGgubWF0Y2goL15cXC9bYS16QS1aXTpcXC8vKSkge1xuICAgICAgcGF0aCA9IHBhdGgucmVwbGFjZSgvXlxcL1thLXpBLVpdOlxcLy8sICcvJyk7XG4gICAgfVxuXG4gICAgLy8gc2FtZSBwYWdlXG4gICAgdmFyIG9yaWcgPSBwYXRoO1xuXG4gICAgaWYgKHBhdGguaW5kZXhPZihiYXNlKSA9PT0gMCkge1xuICAgICAgcGF0aCA9IHBhdGguc3Vic3RyKGJhc2UubGVuZ3RoKTtcbiAgICB9XG5cbiAgICBpZiAoaGFzaGJhbmcpIHBhdGggPSBwYXRoLnJlcGxhY2UoJyMhJywgJycpO1xuXG4gICAgaWYgKGJhc2UgJiYgb3JpZyA9PT0gcGF0aCkgcmV0dXJuO1xuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHBhZ2Uuc2hvdyhvcmlnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmVudCBidXR0b24uXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHdoaWNoKGUpIHtcbiAgICBlID0gZSB8fCB3aW5kb3cuZXZlbnQ7XG4gICAgcmV0dXJuIG51bGwgPT09IGUud2hpY2ggPyBlLmJ1dHRvbiA6IGUud2hpY2g7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYGhyZWZgIGlzIHRoZSBzYW1lIG9yaWdpbi5cbiAgICovXG5cbiAgZnVuY3Rpb24gc2FtZU9yaWdpbihocmVmKSB7XG4gICAgdmFyIG9yaWdpbiA9IGxvY2F0aW9uLnByb3RvY29sICsgJy8vJyArIGxvY2F0aW9uLmhvc3RuYW1lO1xuICAgIGlmIChsb2NhdGlvbi5wb3J0KSBvcmlnaW4gKz0gJzonICsgbG9jYXRpb24ucG9ydDtcbiAgICByZXR1cm4gKGhyZWYgJiYgKDAgPT09IGhyZWYuaW5kZXhPZihvcmlnaW4pKSk7XG4gIH1cblxuICBwYWdlLnNhbWVPcmlnaW4gPSBzYW1lT3JpZ2luO1xuIiwidmFyIGlzYXJyYXkgPSByZXF1aXJlKCdpc2FycmF5JylcblxuLyoqXG4gKiBFeHBvc2UgYHBhdGhUb1JlZ2V4cGAuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gcGF0aFRvUmVnZXhwXG5tb2R1bGUuZXhwb3J0cy5wYXJzZSA9IHBhcnNlXG5tb2R1bGUuZXhwb3J0cy5jb21waWxlID0gY29tcGlsZVxubW9kdWxlLmV4cG9ydHMudG9rZW5zVG9GdW5jdGlvbiA9IHRva2Vuc1RvRnVuY3Rpb25cbm1vZHVsZS5leHBvcnRzLnRva2Vuc1RvUmVnRXhwID0gdG9rZW5zVG9SZWdFeHBcblxuLyoqXG4gKiBUaGUgbWFpbiBwYXRoIG1hdGNoaW5nIHJlZ2V4cCB1dGlsaXR5LlxuICpcbiAqIEB0eXBlIHtSZWdFeHB9XG4gKi9cbnZhciBQQVRIX1JFR0VYUCA9IG5ldyBSZWdFeHAoW1xuICAvLyBNYXRjaCBlc2NhcGVkIGNoYXJhY3RlcnMgdGhhdCB3b3VsZCBvdGhlcndpc2UgYXBwZWFyIGluIGZ1dHVyZSBtYXRjaGVzLlxuICAvLyBUaGlzIGFsbG93cyB0aGUgdXNlciB0byBlc2NhcGUgc3BlY2lhbCBjaGFyYWN0ZXJzIHRoYXQgd29uJ3QgdHJhbnNmb3JtLlxuICAnKFxcXFxcXFxcLiknLFxuICAvLyBNYXRjaCBFeHByZXNzLXN0eWxlIHBhcmFtZXRlcnMgYW5kIHVuLW5hbWVkIHBhcmFtZXRlcnMgd2l0aCBhIHByZWZpeFxuICAvLyBhbmQgb3B0aW9uYWwgc3VmZml4ZXMuIE1hdGNoZXMgYXBwZWFyIGFzOlxuICAvL1xuICAvLyBcIi86dGVzdChcXFxcZCspP1wiID0+IFtcIi9cIiwgXCJ0ZXN0XCIsIFwiXFxkK1wiLCB1bmRlZmluZWQsIFwiP1wiLCB1bmRlZmluZWRdXG4gIC8vIFwiL3JvdXRlKFxcXFxkKylcIiAgPT4gW3VuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIFwiXFxkK1wiLCB1bmRlZmluZWQsIHVuZGVmaW5lZF1cbiAgLy8gXCIvKlwiICAgICAgICAgICAgPT4gW1wiL1wiLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIFwiKlwiXVxuICAnKFtcXFxcLy5dKT8oPzooPzpcXFxcOihcXFxcdyspKD86XFxcXCgoKD86XFxcXFxcXFwufFteKCldKSspXFxcXCkpP3xcXFxcKCgoPzpcXFxcXFxcXC58W14oKV0pKylcXFxcKSkoWysqP10pP3woXFxcXCopKSdcbl0uam9pbignfCcpLCAnZycpXG5cbi8qKlxuICogUGFyc2UgYSBzdHJpbmcgZm9yIHRoZSByYXcgdG9rZW5zLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqL1xuZnVuY3Rpb24gcGFyc2UgKHN0cikge1xuICB2YXIgdG9rZW5zID0gW11cbiAgdmFyIGtleSA9IDBcbiAgdmFyIGluZGV4ID0gMFxuICB2YXIgcGF0aCA9ICcnXG4gIHZhciByZXNcblxuICB3aGlsZSAoKHJlcyA9IFBBVEhfUkVHRVhQLmV4ZWMoc3RyKSkgIT0gbnVsbCkge1xuICAgIHZhciBtID0gcmVzWzBdXG4gICAgdmFyIGVzY2FwZWQgPSByZXNbMV1cbiAgICB2YXIgb2Zmc2V0ID0gcmVzLmluZGV4XG4gICAgcGF0aCArPSBzdHIuc2xpY2UoaW5kZXgsIG9mZnNldClcbiAgICBpbmRleCA9IG9mZnNldCArIG0ubGVuZ3RoXG5cbiAgICAvLyBJZ25vcmUgYWxyZWFkeSBlc2NhcGVkIHNlcXVlbmNlcy5cbiAgICBpZiAoZXNjYXBlZCkge1xuICAgICAgcGF0aCArPSBlc2NhcGVkWzFdXG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIC8vIFB1c2ggdGhlIGN1cnJlbnQgcGF0aCBvbnRvIHRoZSB0b2tlbnMuXG4gICAgaWYgKHBhdGgpIHtcbiAgICAgIHRva2Vucy5wdXNoKHBhdGgpXG4gICAgICBwYXRoID0gJydcbiAgICB9XG5cbiAgICB2YXIgcHJlZml4ID0gcmVzWzJdXG4gICAgdmFyIG5hbWUgPSByZXNbM11cbiAgICB2YXIgY2FwdHVyZSA9IHJlc1s0XVxuICAgIHZhciBncm91cCA9IHJlc1s1XVxuICAgIHZhciBzdWZmaXggPSByZXNbNl1cbiAgICB2YXIgYXN0ZXJpc2sgPSByZXNbN11cblxuICAgIHZhciByZXBlYXQgPSBzdWZmaXggPT09ICcrJyB8fCBzdWZmaXggPT09ICcqJ1xuICAgIHZhciBvcHRpb25hbCA9IHN1ZmZpeCA9PT0gJz8nIHx8IHN1ZmZpeCA9PT0gJyonXG4gICAgdmFyIGRlbGltaXRlciA9IHByZWZpeCB8fCAnLydcbiAgICB2YXIgcGF0dGVybiA9IGNhcHR1cmUgfHwgZ3JvdXAgfHwgKGFzdGVyaXNrID8gJy4qJyA6ICdbXicgKyBkZWxpbWl0ZXIgKyAnXSs/JylcblxuICAgIHRva2Vucy5wdXNoKHtcbiAgICAgIG5hbWU6IG5hbWUgfHwga2V5KyssXG4gICAgICBwcmVmaXg6IHByZWZpeCB8fCAnJyxcbiAgICAgIGRlbGltaXRlcjogZGVsaW1pdGVyLFxuICAgICAgb3B0aW9uYWw6IG9wdGlvbmFsLFxuICAgICAgcmVwZWF0OiByZXBlYXQsXG4gICAgICBwYXR0ZXJuOiBlc2NhcGVHcm91cChwYXR0ZXJuKVxuICAgIH0pXG4gIH1cblxuICAvLyBNYXRjaCBhbnkgY2hhcmFjdGVycyBzdGlsbCByZW1haW5pbmcuXG4gIGlmIChpbmRleCA8IHN0ci5sZW5ndGgpIHtcbiAgICBwYXRoICs9IHN0ci5zdWJzdHIoaW5kZXgpXG4gIH1cblxuICAvLyBJZiB0aGUgcGF0aCBleGlzdHMsIHB1c2ggaXQgb250byB0aGUgZW5kLlxuICBpZiAocGF0aCkge1xuICAgIHRva2Vucy5wdXNoKHBhdGgpXG4gIH1cblxuICByZXR1cm4gdG9rZW5zXG59XG5cbi8qKlxuICogQ29tcGlsZSBhIHN0cmluZyB0byBhIHRlbXBsYXRlIGZ1bmN0aW9uIGZvciB0aGUgcGF0aC5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAgc3RyXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqL1xuZnVuY3Rpb24gY29tcGlsZSAoc3RyKSB7XG4gIHJldHVybiB0b2tlbnNUb0Z1bmN0aW9uKHBhcnNlKHN0cikpXG59XG5cbi8qKlxuICogRXhwb3NlIGEgbWV0aG9kIGZvciB0cmFuc2Zvcm1pbmcgdG9rZW5zIGludG8gdGhlIHBhdGggZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIHRva2Vuc1RvRnVuY3Rpb24gKHRva2Vucykge1xuICAvLyBDb21waWxlIGFsbCB0aGUgdG9rZW5zIGludG8gcmVnZXhwcy5cbiAgdmFyIG1hdGNoZXMgPSBuZXcgQXJyYXkodG9rZW5zLmxlbmd0aClcblxuICAvLyBDb21waWxlIGFsbCB0aGUgcGF0dGVybnMgYmVmb3JlIGNvbXBpbGF0aW9uLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0eXBlb2YgdG9rZW5zW2ldID09PSAnb2JqZWN0Jykge1xuICAgICAgbWF0Y2hlc1tpXSA9IG5ldyBSZWdFeHAoJ14nICsgdG9rZW5zW2ldLnBhdHRlcm4gKyAnJCcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgcGF0aCA9ICcnXG4gICAgdmFyIGRhdGEgPSBvYmogfHwge31cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgdG9rZW4gPSB0b2tlbnNbaV1cblxuICAgICAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcGF0aCArPSB0b2tlblxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIHZhciB2YWx1ZSA9IGRhdGFbdG9rZW4ubmFtZV1cbiAgICAgIHZhciBzZWdtZW50XG5cbiAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgIGlmICh0b2tlbi5vcHRpb25hbCkge1xuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBiZSBkZWZpbmVkJylcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaXNhcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgaWYgKCF0b2tlbi5yZXBlYXQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG5vdCByZXBlYXQsIGJ1dCByZWNlaXZlZCBcIicgKyB2YWx1ZSArICdcIicpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgaWYgKHRva2VuLm9wdGlvbmFsKSB7XG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG5vdCBiZSBlbXB0eScpXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2YWx1ZS5sZW5ndGg7IGorKykge1xuICAgICAgICAgIHNlZ21lbnQgPSBlbmNvZGVVUklDb21wb25lbnQodmFsdWVbal0pXG5cbiAgICAgICAgICBpZiAoIW1hdGNoZXNbaV0udGVzdChzZWdtZW50KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgYWxsIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gbWF0Y2ggXCInICsgdG9rZW4ucGF0dGVybiArICdcIiwgYnV0IHJlY2VpdmVkIFwiJyArIHNlZ21lbnQgKyAnXCInKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHBhdGggKz0gKGogPT09IDAgPyB0b2tlbi5wcmVmaXggOiB0b2tlbi5kZWxpbWl0ZXIpICsgc2VnbWVudFxuICAgICAgICB9XG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgc2VnbWVudCA9IGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSlcblxuICAgICAgaWYgKCFtYXRjaGVzW2ldLnRlc3Qoc2VnbWVudCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBtYXRjaCBcIicgKyB0b2tlbi5wYXR0ZXJuICsgJ1wiLCBidXQgcmVjZWl2ZWQgXCInICsgc2VnbWVudCArICdcIicpXG4gICAgICB9XG5cbiAgICAgIHBhdGggKz0gdG9rZW4ucHJlZml4ICsgc2VnbWVudFxuICAgIH1cblxuICAgIHJldHVybiBwYXRoXG4gIH1cbn1cblxuLyoqXG4gKiBFc2NhcGUgYSByZWd1bGFyIGV4cHJlc3Npb24gc3RyaW5nLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVzY2FwZVN0cmluZyAoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvKFsuKyo/PV4hOiR7fSgpW1xcXXxcXC9dKS9nLCAnXFxcXCQxJylcbn1cblxuLyoqXG4gKiBFc2NhcGUgdGhlIGNhcHR1cmluZyBncm91cCBieSBlc2NhcGluZyBzcGVjaWFsIGNoYXJhY3RlcnMgYW5kIG1lYW5pbmcuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBncm91cFxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBlc2NhcGVHcm91cCAoZ3JvdXApIHtcbiAgcmV0dXJuIGdyb3VwLnJlcGxhY2UoLyhbPSE6JFxcLygpXSkvZywgJ1xcXFwkMScpXG59XG5cbi8qKlxuICogQXR0YWNoIHRoZSBrZXlzIGFzIGEgcHJvcGVydHkgb2YgdGhlIHJlZ2V4cC5cbiAqXG4gKiBAcGFyYW0gIHtSZWdFeHB9IHJlXG4gKiBAcGFyYW0gIHtBcnJheX0gIGtleXNcbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gYXR0YWNoS2V5cyAocmUsIGtleXMpIHtcbiAgcmUua2V5cyA9IGtleXNcbiAgcmV0dXJuIHJlXG59XG5cbi8qKlxuICogR2V0IHRoZSBmbGFncyBmb3IgYSByZWdleHAgZnJvbSB0aGUgb3B0aW9ucy5cbiAqXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZmxhZ3MgKG9wdGlvbnMpIHtcbiAgcmV0dXJuIG9wdGlvbnMuc2Vuc2l0aXZlID8gJycgOiAnaSdcbn1cblxuLyoqXG4gKiBQdWxsIG91dCBrZXlzIGZyb20gYSByZWdleHAuXG4gKlxuICogQHBhcmFtICB7UmVnRXhwfSBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gIGtleXNcbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gcmVnZXhwVG9SZWdleHAgKHBhdGgsIGtleXMpIHtcbiAgLy8gVXNlIGEgbmVnYXRpdmUgbG9va2FoZWFkIHRvIG1hdGNoIG9ubHkgY2FwdHVyaW5nIGdyb3Vwcy5cbiAgdmFyIGdyb3VwcyA9IHBhdGguc291cmNlLm1hdGNoKC9cXCgoPyFcXD8pL2cpXG5cbiAgaWYgKGdyb3Vwcykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ3JvdXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBrZXlzLnB1c2goe1xuICAgICAgICBuYW1lOiBpLFxuICAgICAgICBwcmVmaXg6IG51bGwsXG4gICAgICAgIGRlbGltaXRlcjogbnVsbCxcbiAgICAgICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgICAgICByZXBlYXQ6IGZhbHNlLFxuICAgICAgICBwYXR0ZXJuOiBudWxsXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRhY2hLZXlzKHBhdGgsIGtleXMpXG59XG5cbi8qKlxuICogVHJhbnNmb3JtIGFuIGFycmF5IGludG8gYSByZWdleHAuXG4gKlxuICogQHBhcmFtICB7QXJyYXl9ICBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gIGtleXNcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7UmVnRXhwfVxuICovXG5mdW5jdGlvbiBhcnJheVRvUmVnZXhwIChwYXRoLCBrZXlzLCBvcHRpb25zKSB7XG4gIHZhciBwYXJ0cyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgcGFydHMucHVzaChwYXRoVG9SZWdleHAocGF0aFtpXSwga2V5cywgb3B0aW9ucykuc291cmNlKVxuICB9XG5cbiAgdmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoJyg/OicgKyBwYXJ0cy5qb2luKCd8JykgKyAnKScsIGZsYWdzKG9wdGlvbnMpKVxuXG4gIHJldHVybiBhdHRhY2hLZXlzKHJlZ2V4cCwga2V5cylcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBwYXRoIHJlZ2V4cCBmcm9tIHN0cmluZyBpbnB1dC5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHBhdGhcbiAqIEBwYXJhbSAge0FycmF5fSAga2V5c1xuICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIHN0cmluZ1RvUmVnZXhwIChwYXRoLCBrZXlzLCBvcHRpb25zKSB7XG4gIHZhciB0b2tlbnMgPSBwYXJzZShwYXRoKVxuICB2YXIgcmUgPSB0b2tlbnNUb1JlZ0V4cCh0b2tlbnMsIG9wdGlvbnMpXG5cbiAgLy8gQXR0YWNoIGtleXMgYmFjayB0byB0aGUgcmVnZXhwLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0eXBlb2YgdG9rZW5zW2ldICE9PSAnc3RyaW5nJykge1xuICAgICAga2V5cy5wdXNoKHRva2Vuc1tpXSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXR0YWNoS2V5cyhyZSwga2V5cylcbn1cblxuLyoqXG4gKiBFeHBvc2UgYSBmdW5jdGlvbiBmb3IgdGFraW5nIHRva2VucyBhbmQgcmV0dXJuaW5nIGEgUmVnRXhwLlxuICpcbiAqIEBwYXJhbSAge0FycmF5fSAgdG9rZW5zXG4gKiBAcGFyYW0gIHtBcnJheX0gIGtleXNcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7UmVnRXhwfVxuICovXG5mdW5jdGlvbiB0b2tlbnNUb1JlZ0V4cCAodG9rZW5zLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG5cbiAgdmFyIHN0cmljdCA9IG9wdGlvbnMuc3RyaWN0XG4gIHZhciBlbmQgPSBvcHRpb25zLmVuZCAhPT0gZmFsc2VcbiAgdmFyIHJvdXRlID0gJydcbiAgdmFyIGxhc3RUb2tlbiA9IHRva2Vuc1t0b2tlbnMubGVuZ3RoIC0gMV1cbiAgdmFyIGVuZHNXaXRoU2xhc2ggPSB0eXBlb2YgbGFzdFRva2VuID09PSAnc3RyaW5nJyAmJiAvXFwvJC8udGVzdChsYXN0VG9rZW4pXG5cbiAgLy8gSXRlcmF0ZSBvdmVyIHRoZSB0b2tlbnMgYW5kIGNyZWF0ZSBvdXIgcmVnZXhwIHN0cmluZy5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdG9rZW4gPSB0b2tlbnNbaV1cblxuICAgIGlmICh0eXBlb2YgdG9rZW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICByb3V0ZSArPSBlc2NhcGVTdHJpbmcodG9rZW4pXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBwcmVmaXggPSBlc2NhcGVTdHJpbmcodG9rZW4ucHJlZml4KVxuICAgICAgdmFyIGNhcHR1cmUgPSB0b2tlbi5wYXR0ZXJuXG5cbiAgICAgIGlmICh0b2tlbi5yZXBlYXQpIHtcbiAgICAgICAgY2FwdHVyZSArPSAnKD86JyArIHByZWZpeCArIGNhcHR1cmUgKyAnKSonXG4gICAgICB9XG5cbiAgICAgIGlmICh0b2tlbi5vcHRpb25hbCkge1xuICAgICAgICBpZiAocHJlZml4KSB7XG4gICAgICAgICAgY2FwdHVyZSA9ICcoPzonICsgcHJlZml4ICsgJygnICsgY2FwdHVyZSArICcpKT8nXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2FwdHVyZSA9ICcoJyArIGNhcHR1cmUgKyAnKT8nXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNhcHR1cmUgPSBwcmVmaXggKyAnKCcgKyBjYXB0dXJlICsgJyknXG4gICAgICB9XG5cbiAgICAgIHJvdXRlICs9IGNhcHR1cmVcbiAgICB9XG4gIH1cblxuICAvLyBJbiBub24tc3RyaWN0IG1vZGUgd2UgYWxsb3cgYSBzbGFzaCBhdCB0aGUgZW5kIG9mIG1hdGNoLiBJZiB0aGUgcGF0aCB0b1xuICAvLyBtYXRjaCBhbHJlYWR5IGVuZHMgd2l0aCBhIHNsYXNoLCB3ZSByZW1vdmUgaXQgZm9yIGNvbnNpc3RlbmN5LiBUaGUgc2xhc2hcbiAgLy8gaXMgdmFsaWQgYXQgdGhlIGVuZCBvZiBhIHBhdGggbWF0Y2gsIG5vdCBpbiB0aGUgbWlkZGxlLiBUaGlzIGlzIGltcG9ydGFudFxuICAvLyBpbiBub24tZW5kaW5nIG1vZGUsIHdoZXJlIFwiL3Rlc3QvXCIgc2hvdWxkbid0IG1hdGNoIFwiL3Rlc3QvL3JvdXRlXCIuXG4gIGlmICghc3RyaWN0KSB7XG4gICAgcm91dGUgPSAoZW5kc1dpdGhTbGFzaCA/IHJvdXRlLnNsaWNlKDAsIC0yKSA6IHJvdXRlKSArICcoPzpcXFxcLyg/PSQpKT8nXG4gIH1cblxuICBpZiAoZW5kKSB7XG4gICAgcm91dGUgKz0gJyQnXG4gIH0gZWxzZSB7XG4gICAgLy8gSW4gbm9uLWVuZGluZyBtb2RlLCB3ZSBuZWVkIHRoZSBjYXB0dXJpbmcgZ3JvdXBzIHRvIG1hdGNoIGFzIG11Y2ggYXNcbiAgICAvLyBwb3NzaWJsZSBieSB1c2luZyBhIHBvc2l0aXZlIGxvb2thaGVhZCB0byB0aGUgZW5kIG9yIG5leHQgcGF0aCBzZWdtZW50LlxuICAgIHJvdXRlICs9IHN0cmljdCAmJiBlbmRzV2l0aFNsYXNoID8gJycgOiAnKD89XFxcXC98JCknXG4gIH1cblxuICByZXR1cm4gbmV3IFJlZ0V4cCgnXicgKyByb3V0ZSwgZmxhZ3Mob3B0aW9ucykpXG59XG5cbi8qKlxuICogTm9ybWFsaXplIHRoZSBnaXZlbiBwYXRoIHN0cmluZywgcmV0dXJuaW5nIGEgcmVndWxhciBleHByZXNzaW9uLlxuICpcbiAqIEFuIGVtcHR5IGFycmF5IGNhbiBiZSBwYXNzZWQgaW4gZm9yIHRoZSBrZXlzLCB3aGljaCB3aWxsIGhvbGQgdGhlXG4gKiBwbGFjZWhvbGRlciBrZXkgZGVzY3JpcHRpb25zLiBGb3IgZXhhbXBsZSwgdXNpbmcgYC91c2VyLzppZGAsIGBrZXlzYCB3aWxsXG4gKiBjb250YWluIGBbeyBuYW1lOiAnaWQnLCBkZWxpbWl0ZXI6ICcvJywgb3B0aW9uYWw6IGZhbHNlLCByZXBlYXQ6IGZhbHNlIH1dYC5cbiAqXG4gKiBAcGFyYW0gIHsoU3RyaW5nfFJlZ0V4cHxBcnJheSl9IHBhdGhcbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICAgICAgICAgICAgW2tleXNdXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgICAgICAgIFtvcHRpb25zXVxuICogQHJldHVybiB7UmVnRXhwfVxuICovXG5mdW5jdGlvbiBwYXRoVG9SZWdleHAgKHBhdGgsIGtleXMsIG9wdGlvbnMpIHtcbiAga2V5cyA9IGtleXMgfHwgW11cblxuICBpZiAoIWlzYXJyYXkoa2V5cykpIHtcbiAgICBvcHRpb25zID0ga2V5c1xuICAgIGtleXMgPSBbXVxuICB9IGVsc2UgaWYgKCFvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IHt9XG4gIH1cblxuICBpZiAocGF0aCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgIHJldHVybiByZWdleHBUb1JlZ2V4cChwYXRoLCBrZXlzLCBvcHRpb25zKVxuICB9XG5cbiAgaWYgKGlzYXJyYXkocGF0aCkpIHtcbiAgICByZXR1cm4gYXJyYXlUb1JlZ2V4cChwYXRoLCBrZXlzLCBvcHRpb25zKVxuICB9XG5cbiAgcmV0dXJuIHN0cmluZ1RvUmVnZXhwKHBhdGgsIGtleXMsIG9wdGlvbnMpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKGFycikge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFycikgPT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL3N1cGVybW9kZWxzJyk7XG4iLCIndXNlIHN0cmljdCdcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKVxudmFyIGNyZWF0ZVdyYXBwZXJGYWN0b3J5ID0gcmVxdWlyZSgnLi9mYWN0b3J5JylcblxuZnVuY3Rpb24gcmVzb2x2ZSAoZnJvbSkge1xuICB2YXIgaXNDdG9yID0gdXRpbC5pc0NvbnN0cnVjdG9yKGZyb20pXG4gIHZhciBpc1N1cGVybW9kZWxDdG9yID0gdXRpbC5pc1N1cGVybW9kZWxDb25zdHJ1Y3Rvcihmcm9tKVxuICB2YXIgaXNBcnJheSA9IHV0aWwuaXNBcnJheShmcm9tKVxuXG4gIGlmIChpc0N0b3IgfHwgaXNTdXBlcm1vZGVsQ3RvciB8fCBpc0FycmF5KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIF9fdHlwZTogZnJvbVxuICAgIH1cbiAgfVxuXG4gIHZhciBpc1ZhbHVlID0gIXV0aWwuaXNPYmplY3QoZnJvbSlcbiAgaWYgKGlzVmFsdWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgX192YWx1ZTogZnJvbVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmcm9tXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZURlZiAoZnJvbSkge1xuICBmcm9tID0gcmVzb2x2ZShmcm9tKVxuXG4gIHZhciBfX1ZBTElEQVRPUlMgPSAnX192YWxpZGF0b3JzJ1xuICB2YXIgX19WQUxVRSA9ICdfX3ZhbHVlJ1xuICB2YXIgX19UWVBFID0gJ19fdHlwZSdcbiAgdmFyIF9fRElTUExBWU5BTUUgPSAnX19kaXNwbGF5TmFtZSdcbiAgdmFyIF9fR0VUID0gJ19fZ2V0J1xuICB2YXIgX19TRVQgPSAnX19zZXQnXG4gIHZhciBfX0VOVU1FUkFCTEUgPSAnX19lbnVtZXJhYmxlJ1xuICB2YXIgX19DT05GSUdVUkFCTEUgPSAnX19jb25maWd1cmFibGUnXG4gIHZhciBfX1dSSVRBQkxFID0gJ19fd3JpdGFibGUnXG4gIHZhciBfX1NQRUNJQUxfUFJPUFMgPSBbXG4gICAgX19WQUxJREFUT1JTLCBfX1ZBTFVFLCBfX1RZUEUsIF9fRElTUExBWU5BTUUsXG4gICAgX19HRVQsIF9fU0VULCBfX0VOVU1FUkFCTEUsIF9fQ09ORklHVVJBQkxFLCBfX1dSSVRBQkxFXG4gIF1cblxuICB2YXIgZGVmID0ge1xuICAgIGZyb206IGZyb20sXG4gICAgdHlwZTogZnJvbVtfX1RZUEVdLFxuICAgIHZhbHVlOiBmcm9tW19fVkFMVUVdLFxuICAgIHZhbGlkYXRvcnM6IGZyb21bX19WQUxJREFUT1JTXSB8fCBbXSxcbiAgICBlbnVtZXJhYmxlOiBmcm9tW19fRU5VTUVSQUJMRV0gIT09IGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogISFmcm9tW19fQ09ORklHVVJBQkxFXSxcbiAgICB3cml0YWJsZTogZnJvbVtfX1dSSVRBQkxFXSAhPT0gZmFsc2UsXG4gICAgZGlzcGxheU5hbWU6IGZyb21bX19ESVNQTEFZTkFNRV0sXG4gICAgZ2V0dGVyOiBmcm9tW19fR0VUXSxcbiAgICBzZXR0ZXI6IGZyb21bX19TRVRdXG4gIH1cblxuICB2YXIgdHlwZSA9IGRlZi50eXBlXG5cbiAgLy8gU2ltcGxlICdDb25zdHJ1Y3RvcicgVHlwZVxuICBpZiAodXRpbC5pc1NpbXBsZUNvbnN0cnVjdG9yKHR5cGUpKSB7XG4gICAgZGVmLmlzU2ltcGxlID0gdHJ1ZVxuXG4gICAgZGVmLmNhc3QgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiB1dGlsLmNhc3QodmFsdWUsIHR5cGUpXG4gICAgfVxuICB9IGVsc2UgaWYgKHV0aWwuaXNTdXBlcm1vZGVsQ29uc3RydWN0b3IodHlwZSkpIHtcbiAgICBkZWYuaXNSZWZlcmVuY2UgPSB0cnVlXG4gIH0gZWxzZSBpZiAoZGVmLnZhbHVlKSB7XG4gICAgLy8gSWYgYSB2YWx1ZSBpcyBwcmVzZW50LCB1c2VcbiAgICAvLyB0aGF0IGFuZCBzaG9ydC1jaXJjdWl0IHRoZSByZXN0XG4gICAgZGVmLmlzU2ltcGxlID0gdHJ1ZVxuICB9IGVsc2Uge1xuICAgIC8vIE90aGVyd2lzZSBsb29rIGZvciBvdGhlciBub24tc3BlY2lhbFxuICAgIC8vIGtleXMgYW5kIGFsc28gYW55IGl0ZW0gZGVmaW5pdGlvblxuICAgIC8vIGluIHRoZSBjYXNlIG9mIEFycmF5c1xuXG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhmcm9tKVxuICAgIHZhciBjaGlsZEtleXMgPSBrZXlzLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgcmV0dXJuIF9fU1BFQ0lBTF9QUk9QUy5pbmRleE9mKGl0ZW0pID09PSAtMVxuICAgIH0pXG5cbiAgICBpZiAoY2hpbGRLZXlzLmxlbmd0aCkge1xuICAgICAgdmFyIGRlZnMgPSB7fVxuICAgICAgdmFyIHByb3RvXG5cbiAgICAgIGNoaWxkS2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgdmFyIGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGZyb20sIGtleSlcbiAgICAgICAgdmFyIHZhbHVlXG5cbiAgICAgICAgaWYgKGRlc2NyaXB0b3IuZ2V0IHx8IGRlc2NyaXB0b3Iuc2V0KSB7XG4gICAgICAgICAgdmFsdWUgPSB7XG4gICAgICAgICAgICBfX2dldDogZGVzY3JpcHRvci5nZXQsXG4gICAgICAgICAgICBfX3NldDogZGVzY3JpcHRvci5zZXRcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsdWUgPSBmcm9tW2tleV1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdXRpbC5pc0NvbnN0cnVjdG9yKHZhbHVlKSAmJiAhdXRpbC5pc1N1cGVybW9kZWxDb25zdHJ1Y3Rvcih2YWx1ZSkgJiYgdXRpbC5pc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgICAgIGlmICghcHJvdG8pIHtcbiAgICAgICAgICAgIHByb3RvID0ge31cbiAgICAgICAgICB9XG4gICAgICAgICAgcHJvdG9ba2V5XSA9IHZhbHVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVmc1trZXldID0gY3JlYXRlRGVmKHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICBkZWYuZGVmcyA9IGRlZnNcbiAgICAgIGRlZi5wcm90byA9IHByb3RvXG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIEFycmF5XG4gICAgaWYgKHR5cGUgPT09IEFycmF5IHx8IHV0aWwuaXNBcnJheSh0eXBlKSkge1xuICAgICAgZGVmLmlzQXJyYXkgPSB0cnVlXG5cbiAgICAgIGlmICh0eXBlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZGVmLmRlZiA9IGNyZWF0ZURlZih0eXBlWzBdKVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY2hpbGRLZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgZGVmLmlzU2ltcGxlID0gdHJ1ZVxuICAgIH1cbiAgfVxuXG4gIGRlZi5jcmVhdGUgPSBjcmVhdGVXcmFwcGVyRmFjdG9yeShkZWYpXG5cbiAgcmV0dXJuIGRlZlxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZURlZlxuIiwiJ3VzZSBzdHJpY3QnXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gIHZhciBhcnIgPSBbXVxuXG4gIC8qKlxuICAgKiBQcm94aWVkIGFycmF5IG11dGF0b3JzIG1ldGhvZHNcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IG9ialxuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cbiAgdmFyIHBvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVzdWx0ID0gQXJyYXkucHJvdG90eXBlLnBvcC5hcHBseShhcnIpXG5cbiAgICBjYWxsYmFjaygncG9wJywgYXJyLCB7XG4gICAgICB2YWx1ZTogcmVzdWx0XG4gICAgfSlcblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICB2YXIgcHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVzdWx0ID0gQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoYXJyLCBhcmd1bWVudHMpXG5cbiAgICBjYWxsYmFjaygncHVzaCcsIGFyciwge1xuICAgICAgdmFsdWU6IHJlc3VsdFxuICAgIH0pXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbiAgdmFyIHNoaWZ0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZXN1bHQgPSBBcnJheS5wcm90b3R5cGUuc2hpZnQuYXBwbHkoYXJyKVxuXG4gICAgY2FsbGJhY2soJ3NoaWZ0JywgYXJyLCB7XG4gICAgICB2YWx1ZTogcmVzdWx0XG4gICAgfSlcblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICB2YXIgc29ydCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVzdWx0ID0gQXJyYXkucHJvdG90eXBlLnNvcnQuYXBwbHkoYXJyLCBhcmd1bWVudHMpXG5cbiAgICBjYWxsYmFjaygnc29ydCcsIGFyciwge1xuICAgICAgdmFsdWU6IHJlc3VsdFxuICAgIH0pXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbiAgdmFyIHVuc2hpZnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlc3VsdCA9IEFycmF5LnByb3RvdHlwZS51bnNoaWZ0LmFwcGx5KGFyciwgYXJndW1lbnRzKVxuXG4gICAgY2FsbGJhY2soJ3Vuc2hpZnQnLCBhcnIsIHtcbiAgICAgIHZhbHVlOiByZXN1bHRcbiAgICB9KVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG4gIHZhciByZXZlcnNlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZXN1bHQgPSBBcnJheS5wcm90b3R5cGUucmV2ZXJzZS5hcHBseShhcnIpXG5cbiAgICBjYWxsYmFjaygncmV2ZXJzZScsIGFyciwge1xuICAgICAgdmFsdWU6IHJlc3VsdFxuICAgIH0pXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbiAgdmFyIHNwbGljZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHZhciByZXN1bHQgPSBBcnJheS5wcm90b3R5cGUuc3BsaWNlLmFwcGx5KGFyciwgYXJndW1lbnRzKVxuXG4gICAgY2FsbGJhY2soJ3NwbGljZScsIGFyciwge1xuICAgICAgdmFsdWU6IHJlc3VsdCxcbiAgICAgIHJlbW92ZWQ6IHJlc3VsdCxcbiAgICAgIGFkZGVkOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpXG4gICAgfSlcblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm94eSBhbGwgQXJyYXkucHJvdG90eXBlIG11dGF0b3IgbWV0aG9kcyBvbiB0aGlzIGFycmF5IGluc3RhbmNlXG4gICAqL1xuICBhcnIucG9wID0gYXJyLnBvcCAmJiBwb3BcbiAgYXJyLnB1c2ggPSBhcnIucHVzaCAmJiBwdXNoXG4gIGFyci5zaGlmdCA9IGFyci5zaGlmdCAmJiBzaGlmdFxuICBhcnIudW5zaGlmdCA9IGFyci51bnNoaWZ0ICYmIHVuc2hpZnRcbiAgYXJyLnNvcnQgPSBhcnIuc29ydCAmJiBzb3J0XG4gIGFyci5yZXZlcnNlID0gYXJyLnJldmVyc2UgJiYgcmV2ZXJzZVxuICBhcnIuc3BsaWNlID0gYXJyLnNwbGljZSAmJiBzcGxpY2VcblxuICAvKipcbiAgICogU3BlY2lhbCB1cGRhdGUgZnVuY3Rpb24gc2luY2Ugd2UgY2FuJ3QgZGV0ZWN0XG4gICAqIGFzc2lnbm1lbnQgYnkgaW5kZXggZS5nLiBhcnJbMF0gPSAnc29tZXRoaW5nJ1xuICAgKi9cbiAgYXJyLnVwZGF0ZSA9IGZ1bmN0aW9uIChpbmRleCwgdmFsdWUpIHtcbiAgICB2YXIgb2xkVmFsdWUgPSBhcnJbaW5kZXhdXG4gICAgdmFyIG5ld1ZhbHVlID0gYXJyW2luZGV4XSA9IHZhbHVlXG5cbiAgICBjYWxsYmFjaygndXBkYXRlJywgYXJyLCB7XG4gICAgICBpbmRleDogaW5kZXgsXG4gICAgICB2YWx1ZTogbmV3VmFsdWUsXG4gICAgICBvbGRWYWx1ZTogb2xkVmFsdWVcbiAgICB9KVxuXG4gICAgcmV0dXJuIG5ld1ZhbHVlXG4gIH1cblxuICByZXR1cm4gYXJyXG59XG4iLCIndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBFbWl0dGVyRXZlbnQgKG5hbWUsIHBhdGgsIHRhcmdldCwgZGV0YWlsKSB7XG4gIHRoaXMubmFtZSA9IG5hbWVcbiAgdGhpcy5wYXRoID0gcGF0aFxuICB0aGlzLnRhcmdldCA9IHRhcmdldFxuXG4gIGlmIChkZXRhaWwpIHtcbiAgICB0aGlzLmRldGFpbCA9IGRldGFpbFxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxuLyoqXG4gKiBFeHBvc2UgYEVtaXR0ZXJgLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gRW1pdHRlclxuXG4vKipcbiAqIEluaXRpYWxpemUgYSBuZXcgYEVtaXR0ZXJgLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gRW1pdHRlciAob2JqKSB7XG4gIHZhciBjdHggPSBvYmogfHwgdGhpc1xuXG4gIGlmIChvYmopIHtcbiAgICBjdHggPSBtaXhpbihvYmopXG4gICAgcmV0dXJuIGN0eFxuICB9XG59XG5cbi8qKlxuICogTWl4aW4gdGhlIGVtaXR0ZXIgcHJvcGVydGllcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBtaXhpbiAob2JqKSB7XG4gIGZvciAodmFyIGtleSBpbiBFbWl0dGVyLnByb3RvdHlwZSkge1xuICAgIG9ialtrZXldID0gRW1pdHRlci5wcm90b3R5cGVba2V5XVxuICB9XG4gIHJldHVybiBvYmpcbn1cblxuLyoqXG4gKiBMaXN0ZW4gb24gdGhlIGdpdmVuIGBldmVudGAgd2l0aCBgZm5gLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9uID0gRW1pdHRlci5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIChldmVudCwgZm4pIHtcbiAgKHRoaXMuX19jYWxsYmFja3NbZXZlbnRdID0gdGhpcy5fX2NhbGxiYWNrc1tldmVudF0gfHwgW10pXG4gICAgLnB1c2goZm4pXG4gIHJldHVybiB0aGlzXG59XG5cbi8qKlxuICogQWRkcyBhbiBgZXZlbnRgIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBpbnZva2VkIGEgc2luZ2xlXG4gKiB0aW1lIHRoZW4gYXV0b21hdGljYWxseSByZW1vdmVkLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiAoZXZlbnQsIGZuKSB7XG4gIGZ1bmN0aW9uIG9uICgpIHtcbiAgICB0aGlzLm9mZihldmVudCwgb24pXG4gICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICB9XG5cbiAgb24uZm4gPSBmblxuICB0aGlzLm9uKGV2ZW50LCBvbilcbiAgcmV0dXJuIHRoaXNcbn1cblxuLyoqXG4gKiBSZW1vdmUgdGhlIGdpdmVuIGNhbGxiYWNrIGZvciBgZXZlbnRgIG9yIGFsbFxuICogcmVnaXN0ZXJlZCBjYWxsYmFja3MuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub2ZmID0gRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIChldmVudCwgZm4pIHtcbiAgLy8gYWxsXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhpcy5fX2NhbGxiYWNrcyA9IHt9XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8vIHNwZWNpZmljIGV2ZW50XG4gIHZhciBjYWxsYmFja3MgPSB0aGlzLl9fY2FsbGJhY2tzW2V2ZW50XVxuICBpZiAoIWNhbGxiYWNrcykge1xuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvLyByZW1vdmUgYWxsIGhhbmRsZXJzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgZGVsZXRlIHRoaXMuX19jYWxsYmFja3NbZXZlbnRdXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8vIHJlbW92ZSBzcGVjaWZpYyBoYW5kbGVyXG4gIHZhciBjYlxuICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgIGNiID0gY2FsbGJhY2tzW2ldXG4gICAgaWYgKGNiID09PSBmbiB8fCBjYi5mbiA9PT0gZm4pIHtcbiAgICAgIGNhbGxiYWNrcy5zcGxpY2UoaSwgMSlcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbi8qKlxuICogRW1pdCBgZXZlbnRgIHdpdGggdGhlIGdpdmVuIGFyZ3MuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge01peGVkfSAuLi5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIChldmVudCkge1xuICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKVxuICB2YXIgY2FsbGJhY2tzID0gdGhpcy5fX2NhbGxiYWNrc1tldmVudF1cblxuICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgY2FsbGJhY2tzID0gY2FsbGJhY2tzLnNsaWNlKDApXG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNhbGxiYWNrcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgY2FsbGJhY2tzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXNcbn1cblxuLyoqXG4gKiBSZXR1cm4gYXJyYXkgb2YgY2FsbGJhY2tzIGZvciBgZXZlbnRgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHJldHVybiB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChldmVudCkge1xuICByZXR1cm4gdGhpcy5fX2NhbGxiYWNrc1tldmVudF0gfHwgW11cbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGlzIGVtaXR0ZXIgaGFzIGBldmVudGAgaGFuZGxlcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5oYXNMaXN0ZW5lcnMgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgcmV0dXJuICEhdGhpcy5saXN0ZW5lcnMoZXZlbnQpLmxlbmd0aFxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJylcbnZhciBjcmVhdGVNb2RlbFByb3RvdHlwZSA9IHJlcXVpcmUoJy4vcHJvdG8nKVxudmFyIFdyYXBwZXIgPSByZXF1aXJlKCcuL3dyYXBwZXInKVxuXG5mdW5jdGlvbiBjcmVhdGVNb2RlbERlc2NyaXB0b3JzIChkZWYsIHBhcmVudCkge1xuICB2YXIgX18gPSB7fVxuXG4gIHZhciBkZXNjID0ge1xuICAgIF9fOiB7XG4gICAgICB2YWx1ZTogX19cbiAgICB9LFxuICAgIF9fZGVmOiB7XG4gICAgICB2YWx1ZTogZGVmXG4gICAgfSxcbiAgICBfX3BhcmVudDoge1xuICAgICAgdmFsdWU6IHBhcmVudCxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfSxcbiAgICBfX2NhbGxiYWNrczoge1xuICAgICAgdmFsdWU6IHt9LFxuICAgICAgd3JpdGFibGU6IHRydWVcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZGVzY1xufVxuXG5mdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzIChtb2RlbCkge1xuICB2YXIgZGVmcyA9IG1vZGVsLl9fZGVmLmRlZnNcbiAgZm9yICh2YXIga2V5IGluIGRlZnMpIHtcbiAgICBkZWZpbmVQcm9wZXJ0eShtb2RlbCwga2V5LCBkZWZzW2tleV0pXG4gIH1cbn1cblxuZnVuY3Rpb24gZGVmaW5lUHJvcGVydHkgKG1vZGVsLCBrZXksIGRlZikge1xuICB2YXIgZGVzYyA9IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fZ2V0KGtleSlcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IGRlZi5lbnVtZXJhYmxlLFxuICAgIGNvbmZpZ3VyYWJsZTogZGVmLmNvbmZpZ3VyYWJsZVxuICB9XG5cbiAgaWYgKGRlZi53cml0YWJsZSkge1xuICAgIGRlc2Muc2V0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICB0aGlzLl9fc2V0Tm90aWZ5Q2hhbmdlKGtleSwgdmFsdWUpXG4gICAgfVxuICB9XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG1vZGVsLCBrZXksIGRlc2MpXG5cbiAgLy8gU2lsZW50bHkgaW5pdGlhbGl6ZSB0aGUgcHJvcGVydHkgd3JhcHBlclxuICBtb2RlbC5fX1trZXldID0gZGVmLmNyZWF0ZShtb2RlbClcbn1cblxuZnVuY3Rpb24gY3JlYXRlV3JhcHBlckZhY3RvcnkgKGRlZikge1xuICB2YXIgd3JhcHBlciwgZGVmYXVsdFZhbHVlLCBhc3NlcnRcblxuICBpZiAoZGVmLmlzU2ltcGxlKSB7XG4gICAgd3JhcHBlciA9IG5ldyBXcmFwcGVyKGRlZi52YWx1ZSwgZGVmLndyaXRhYmxlLCBkZWYudmFsaWRhdG9ycywgZGVmLmdldHRlciwgZGVmLnNldHRlciwgZGVmLmNhc3QsIG51bGwpXG4gIH0gZWxzZSBpZiAoZGVmLmlzUmVmZXJlbmNlKSB7XG4gICAgLy8gSG9sZCBhIHJlZmVyZW5jZSB0byB0aGVcbiAgICAvLyByZWZlcmVyZW5jZWQgdHlwZXMnIGRlZmluaXRpb25cbiAgICB2YXIgcmVmRGVmID0gZGVmLnR5cGUuZGVmXG5cbiAgICBpZiAocmVmRGVmLmlzU2ltcGxlKSB7XG4gICAgICAvLyBJZiB0aGUgcmVmZXJlbmNlZCB0eXBlIGlzIGl0c2VsZiBzaW1wbGUsXG4gICAgICAvLyB3ZSBjYW4gc2V0IGp1c3QgcmV0dXJuIGEgd3JhcHBlciBhbmRcbiAgICAgIC8vIHRoZSBwcm9wZXJ0eSB3aWxsIGdldCBpbml0aWFsaXplZC5cbiAgICAgIHdyYXBwZXIgPSBuZXcgV3JhcHBlcihyZWZEZWYudmFsdWUsIHJlZkRlZi53cml0YWJsZSwgcmVmRGVmLnZhbGlkYXRvcnMsIGRlZi5nZXR0ZXIsIGRlZi5zZXR0ZXIsIHJlZkRlZi5jYXN0LCBudWxsKVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB3ZSdyZSBub3QgZGVhbGluZyB3aXRoIGEgc2ltcGxlIHJlZmVyZW5jZSBtb2RlbFxuICAgICAgLy8gd2UgbmVlZCB0byBkZWZpbmUgYW4gYXNzZXJ0aW9uIHRoYXQgdGhlIGluc3RhbmNlXG4gICAgICAvLyBiZWluZyBzZXQgaXMgb2YgdGhlIGNvcnJlY3QgdHlwZS4gV2UgZG8gdGhpcyBiZVxuICAgICAgLy8gY29tcGFyaW5nIHRoZSBkZWZzLlxuXG4gICAgICBhc3NlcnQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gY29tcGFyZSB0aGUgZGVmaW50aW9ucyBvZiB0aGUgdmFsdWUgaW5zdGFuY2VcbiAgICAgICAgLy8gYmVpbmcgcGFzc2VkIGFuZCB0aGUgZGVmIHByb3BlcnR5IGF0dGFjaGVkXG4gICAgICAgIC8vIHRvIHRoZSB0eXBlIFN1cGVybW9kZWxDb25zdHJ1Y3Rvci4gQWxsb3cgdGhlXG4gICAgICAgIC8vIHZhbHVlIHRvIGJlIHVuZGVmaW5lZCBvciBudWxsIGFsc28uXG4gICAgICAgIHZhciBpc0NvcnJlY3RUeXBlID0gZmFsc2VcblxuICAgICAgICBpZiAodXRpbC5pc051bGxPclVuZGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgICBpc0NvcnJlY3RUeXBlID0gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlzQ29ycmVjdFR5cGUgPSByZWZEZWYgPT09IHZhbHVlLl9fZGVmXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWlzQ29ycmVjdFR5cGUpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZhbHVlIHNob3VsZCBiZSBhbiBpbnN0YW5jZSBvZiB0aGUgcmVmZXJlbmNlZCBtb2RlbCwgbnVsbCBvciB1bmRlZmluZWQnKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHdyYXBwZXIgPSBuZXcgV3JhcHBlcihkZWYudmFsdWUsIGRlZi53cml0YWJsZSwgZGVmLnZhbGlkYXRvcnMsIGRlZi5nZXR0ZXIsIGRlZi5zZXR0ZXIsIG51bGwsIGFzc2VydClcbiAgICB9XG4gIH0gZWxzZSBpZiAoZGVmLmlzQXJyYXkpIHtcbiAgICBkZWZhdWx0VmFsdWUgPSBmdW5jdGlvbiAocGFyZW50KSB7XG4gICAgICAvLyBmb3IgQXJyYXlzLCB3ZSBjcmVhdGUgYSBuZXcgQXJyYXkgYW5kIGVhY2hcbiAgICAgIC8vIHRpbWUsIG1peCB0aGUgbW9kZWwgcHJvcGVydGllcyBpbnRvIGl0XG4gICAgICB2YXIgbW9kZWwgPSBjcmVhdGVNb2RlbFByb3RvdHlwZShkZWYpXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhtb2RlbCwgY3JlYXRlTW9kZWxEZXNjcmlwdG9ycyhkZWYsIHBhcmVudCkpXG4gICAgICBkZWZpbmVQcm9wZXJ0aWVzKG1vZGVsKVxuICAgICAgcmV0dXJuIG1vZGVsXG4gICAgfVxuXG4gICAgYXNzZXJ0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAvLyB0b2RvOiBmdXJ0aGVyIGFycmF5IHR5cGUgdmFsaWRhdGlvblxuICAgICAgaWYgKCF1dGlsLmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVmFsdWUgc2hvdWxkIGJlIGFuIGFycmF5JylcbiAgICAgIH1cbiAgICB9XG5cbiAgICB3cmFwcGVyID0gbmV3IFdyYXBwZXIoZGVmYXVsdFZhbHVlLCBkZWYud3JpdGFibGUsIGRlZi52YWxpZGF0b3JzLCBkZWYuZ2V0dGVyLCBkZWYuc2V0dGVyLCBudWxsLCBhc3NlcnQpXG4gIH0gZWxzZSB7XG4gICAgLy8gZm9yIE9iamVjdHMsIHdlIGNhbiBjcmVhdGUgYW5kIHJldXNlXG4gICAgLy8gYSBwcm90b3R5cGUgb2JqZWN0LiBXZSB0aGVuIG5lZWQgdG8gb25seVxuICAgIC8vIGRlZmluZSB0aGUgZGVmcyBhbmQgdGhlICdpbnN0YW5jZScgcHJvcGVydGllc1xuICAgIC8vIGUuZy4gX18sIHBhcmVudCBldGMuXG4gICAgdmFyIHByb3RvID0gY3JlYXRlTW9kZWxQcm90b3R5cGUoZGVmKVxuXG4gICAgZGVmYXVsdFZhbHVlID0gZnVuY3Rpb24gKHBhcmVudCkge1xuICAgICAgdmFyIG1vZGVsID0gT2JqZWN0LmNyZWF0ZShwcm90bywgY3JlYXRlTW9kZWxEZXNjcmlwdG9ycyhkZWYsIHBhcmVudCkpXG4gICAgICBkZWZpbmVQcm9wZXJ0aWVzKG1vZGVsKVxuICAgICAgcmV0dXJuIG1vZGVsXG4gICAgfVxuXG4gICAgYXNzZXJ0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoIXByb3RvLmlzUHJvdG90eXBlT2YodmFsdWUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwcm90b3R5cGUnKVxuICAgICAgfVxuICAgIH1cblxuICAgIHdyYXBwZXIgPSBuZXcgV3JhcHBlcihkZWZhdWx0VmFsdWUsIGRlZi53cml0YWJsZSwgZGVmLnZhbGlkYXRvcnMsIGRlZi5nZXR0ZXIsIGRlZi5zZXR0ZXIsIG51bGwsIGFzc2VydClcbiAgfVxuXG4gIHZhciBmYWN0b3J5ID0gZnVuY3Rpb24gKHBhcmVudCkge1xuICAgIHZhciB3cmFwID0gT2JqZWN0LmNyZWF0ZSh3cmFwcGVyKVxuICAgIC8vIGlmICghd3JhcC5pc0luaXRpYWxpemVkKSB7XG4gICAgd3JhcC5faW5pdGlhbGl6ZShwYXJlbnQpXG4gICAgLy8gfVxuICAgIHJldHVybiB3cmFwXG4gIH1cblxuICAvLyBleHBvc2UgdGhlIHdyYXBwZXIsIHRoaXMgaXMgdXNlZFxuICAvLyBmb3IgdmFsaWRhdGluZyBhcnJheSBpdGVtcyBsYXRlclxuICBmYWN0b3J5LndyYXBwZXIgPSB3cmFwcGVyXG5cbiAgcmV0dXJuIGZhY3Rvcnlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVXcmFwcGVyRmFjdG9yeVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmZ1bmN0aW9uIG1lcmdlIChtb2RlbCwgb2JqKSB7XG4gIHZhciBpc0FycmF5ID0gbW9kZWwuX19kZWYuaXNBcnJheVxuICB2YXIgZGVmcyA9IG1vZGVsLl9fZGVmLmRlZnNcbiAgdmFyIGRlZktleXMsIGRlZiwga2V5LCBpLCBpc1NpbXBsZSxcbiAgICBpc1NpbXBsZVJlZmVyZW5jZSwgaXNJbml0aWFsaXplZFJlZmVyZW5jZVxuXG4gIGlmIChkZWZzKSB7XG4gICAgZGVmS2V5cyA9IE9iamVjdC5rZXlzKGRlZnMpXG4gICAgZm9yIChpID0gMDsgaSA8IGRlZktleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGtleSA9IGRlZktleXNbaV1cbiAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBkZWYgPSBkZWZzW2tleV1cblxuICAgICAgICBpc1NpbXBsZSA9IGRlZi5pc1NpbXBsZVxuICAgICAgICBpc1NpbXBsZVJlZmVyZW5jZSA9IGRlZi5pc1JlZmVyZW5jZSAmJiBkZWYudHlwZS5kZWYuaXNTaW1wbGVcbiAgICAgICAgaXNJbml0aWFsaXplZFJlZmVyZW5jZSA9IGRlZi5pc1JlZmVyZW5jZSAmJiBvYmpba2V5XSAmJiBvYmpba2V5XS5fX3N1cGVybW9kZWxcblxuICAgICAgICBpZiAoaXNTaW1wbGUgfHwgaXNTaW1wbGVSZWZlcmVuY2UgfHwgaXNJbml0aWFsaXplZFJlZmVyZW5jZSkge1xuICAgICAgICAgIG1vZGVsW2tleV0gPSBvYmpba2V5XVxuICAgICAgICB9IGVsc2UgaWYgKG9ialtrZXldKSB7XG4gICAgICAgICAgaWYgKGRlZi5pc1JlZmVyZW5jZSkge1xuICAgICAgICAgICAgbW9kZWxba2V5XSA9IGRlZi50eXBlKClcbiAgICAgICAgICB9XG4gICAgICAgICAgbWVyZ2UobW9kZWxba2V5XSwgb2JqW2tleV0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoaXNBcnJheSAmJiBBcnJheS5pc0FycmF5KG9iaikpIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgb2JqLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAob2JqW2ldICYmIG9ialtpXS5fX3N1cGVybW9kZWwpIHtcbiAgICAgICAgbW9kZWwucHVzaChvYmpbaV0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgaXRlbSA9IG1vZGVsLmNyZWF0ZSgpXG4gICAgICAgIG1vZGVsLnB1c2goaXRlbSAmJiBpdGVtLl9fc3VwZXJtb2RlbCA/IG1lcmdlKGl0ZW0sIG9ialtpXSkgOiBvYmpbaV0pXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG1vZGVsXG59XG5cbm1vZHVsZS5leHBvcnRzID0gbWVyZ2VcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgRW1pdHRlckV2ZW50ID0gcmVxdWlyZSgnLi9lbWl0dGVyLWV2ZW50JylcbnZhciBWYWxpZGF0aW9uRXJyb3IgPSByZXF1aXJlKCcuL3ZhbGlkYXRpb24tZXJyb3InKVxudmFyIFdyYXBwZXIgPSByZXF1aXJlKCcuL3dyYXBwZXInKVxudmFyIG1lcmdlID0gcmVxdWlyZSgnLi9tZXJnZScpXG5cbnZhciBkZXNjcmlwdG9ycyA9IHtcbiAgX19zdXBlcm1vZGVsOiB7XG4gICAgdmFsdWU6IHRydWVcbiAgfSxcbiAgX19rZXlzOiB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMpXG5cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMpKSB7XG4gICAgICAgIHZhciBvbWl0ID0gW1xuICAgICAgICAgICdhZGRFdmVudExpc3RlbmVyJywgJ29uJywgJ29uY2UnLCAncmVtb3ZlRXZlbnRMaXN0ZW5lcicsICdyZW1vdmVBbGxMaXN0ZW5lcnMnLFxuICAgICAgICAgICdyZW1vdmVMaXN0ZW5lcicsICdvZmYnLCAnZW1pdCcsICdsaXN0ZW5lcnMnLCAnaGFzTGlzdGVuZXJzJywgJ3BvcCcsICdwdXNoJyxcbiAgICAgICAgICAncmV2ZXJzZScsICdzaGlmdCcsICdzb3J0JywgJ3NwbGljZScsICd1cGRhdGUnLCAndW5zaGlmdCcsICdjcmVhdGUnLCAnX19tZXJnZScsXG4gICAgICAgICAgJ19fc2V0Tm90aWZ5Q2hhbmdlJywgJ19fbm90aWZ5Q2hhbmdlJywgJ19fc2V0JywgJ19fZ2V0JywgJ19fY2hhaW4nLCAnX19yZWxhdGl2ZVBhdGgnXG4gICAgICAgIF1cblxuICAgICAgICBrZXlzID0ga2V5cy5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICByZXR1cm4gb21pdC5pbmRleE9mKGl0ZW0pIDwgMFxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICByZXR1cm4ga2V5c1xuICAgIH1cbiAgfSxcbiAgX19uYW1lOiB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5fX2lzUm9vdCkge1xuICAgICAgICByZXR1cm4gJydcbiAgICAgIH1cblxuICAgICAgLy8gV29yayBvdXQgdGhlICduYW1lJyBvZiB0aGUgbW9kZWxcbiAgICAgIC8vIExvb2sgdXAgdG8gdGhlIHBhcmVudCBhbmQgbG9vcCB0aHJvdWdoIGl0J3Mga2V5cyxcbiAgICAgIC8vIEFueSB2YWx1ZSBvciBhcnJheSBmb3VuZCB0byBjb250YWluIHRoZSB2YWx1ZSBvZiB0aGlzICh0aGlzIG1vZGVsKVxuICAgICAgLy8gdGhlbiB3ZSByZXR1cm4gdGhlIGtleSBhbmQgaW5kZXggaW4gdGhlIGNhc2Ugd2UgZm91bmQgdGhlIG1vZGVsIGluIGFuIGFycmF5LlxuICAgICAgdmFyIHBhcmVudEtleXMgPSB0aGlzLl9fcGFyZW50Ll9fa2V5c1xuICAgICAgdmFyIHBhcmVudEtleSwgcGFyZW50VmFsdWVcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJlbnRLZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHBhcmVudEtleSA9IHBhcmVudEtleXNbaV1cbiAgICAgICAgcGFyZW50VmFsdWUgPSB0aGlzLl9fcGFyZW50W3BhcmVudEtleV1cblxuICAgICAgICBpZiAocGFyZW50VmFsdWUgPT09IHRoaXMpIHtcbiAgICAgICAgICByZXR1cm4gcGFyZW50S2V5XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIF9fcGF0aDoge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuX19oYXNBbmNlc3RvcnMgJiYgIXRoaXMuX19wYXJlbnQuX19pc1Jvb3QpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19wYXJlbnQuX19wYXRoICsgJy4nICsgdGhpcy5fX25hbWVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fbmFtZVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgX19pc1Jvb3Q6IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiAhdGhpcy5fX2hhc0FuY2VzdG9yc1xuICAgIH1cbiAgfSxcbiAgX19jaGlsZHJlbjoge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGNoaWxkcmVuID0gW11cblxuICAgICAgdmFyIGtleXMgPSB0aGlzLl9fa2V5c1xuICAgICAgdmFyIGtleSwgdmFsdWVcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGtleSA9IGtleXNbaV1cbiAgICAgICAgdmFsdWUgPSB0aGlzW2tleV1cblxuICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUuX19zdXBlcm1vZGVsKSB7XG4gICAgICAgICAgY2hpbGRyZW4ucHVzaCh2YWx1ZSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2hpbGRyZW5cbiAgICB9XG4gIH0sXG4gIF9fYW5jZXN0b3JzOiB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgYW5jZXN0b3JzID0gW11cbiAgICAgIHZhciByID0gdGhpc1xuXG4gICAgICB3aGlsZSAoci5fX3BhcmVudCkge1xuICAgICAgICBhbmNlc3RvcnMucHVzaChyLl9fcGFyZW50KVxuICAgICAgICByID0gci5fX3BhcmVudFxuICAgICAgfVxuXG4gICAgICByZXR1cm4gYW5jZXN0b3JzXG4gICAgfVxuICB9LFxuICBfX2Rlc2NlbmRhbnRzOiB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgZGVzY2VuZGFudHMgPSBbXVxuXG4gICAgICBmdW5jdGlvbiBjaGVja0FuZEFkZERlc2NlbmRhbnRJZk1vZGVsIChvYmopIHtcbiAgICAgICAgdmFyIGtleXMgPSBvYmouX19rZXlzXG4gICAgICAgIHZhciBrZXksIHZhbHVlXG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAga2V5ID0ga2V5c1tpXVxuICAgICAgICAgIHZhbHVlID0gb2JqW2tleV1cblxuICAgICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5fX3N1cGVybW9kZWwpIHtcbiAgICAgICAgICAgIGRlc2NlbmRhbnRzLnB1c2godmFsdWUpXG4gICAgICAgICAgICBjaGVja0FuZEFkZERlc2NlbmRhbnRJZk1vZGVsKHZhbHVlKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjaGVja0FuZEFkZERlc2NlbmRhbnRJZk1vZGVsKHRoaXMpXG5cbiAgICAgIHJldHVybiBkZXNjZW5kYW50c1xuICAgIH1cbiAgfSxcbiAgX19oYXNBbmNlc3RvcnM6IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiAhIXRoaXMuX19hbmNlc3RvcnMubGVuZ3RoXG4gICAgfVxuICB9LFxuICBfX2hhc0Rlc2NlbmRhbnRzOiB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gISF0aGlzLl9fZGVzY2VuZGFudHMubGVuZ3RoXG4gICAgfVxuICB9LFxuICBlcnJvcnM6IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBlcnJvcnMgPSBbXVxuICAgICAgdmFyIGRlZiA9IHRoaXMuX19kZWZcbiAgICAgIHZhciB2YWxpZGF0b3IsIGVycm9yLCBpXG5cbiAgICAgIC8vIFJ1biBvd24gdmFsaWRhdG9yc1xuICAgICAgdmFyIG93biA9IGRlZi52YWxpZGF0b3JzLnNsaWNlKDApXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgb3duLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhbGlkYXRvciA9IG93bltpXVxuICAgICAgICBlcnJvciA9IHZhbGlkYXRvci5jYWxsKHRoaXMsIHRoaXMpXG5cbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcih0aGlzLCBlcnJvciwgdmFsaWRhdG9yKSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gUnVuIHRocm91Z2gga2V5cyBhbmQgZXZhbHVhdGUgdmFsaWRhdG9yc1xuICAgICAgdmFyIGtleXMgPSB0aGlzLl9fa2V5c1xuICAgICAgdmFyIHZhbHVlLCBrZXksIGl0ZW1EZWYsIGRpc3BsYXlOYW1lXG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGtleSA9IGtleXNbaV1cbiAgICAgICAgZGlzcGxheU5hbWUgPSB0aGlzLl9fZGVmLmRlZnMgJiYgdGhpcy5fX2RlZi5kZWZzW2tleV0uZGlzcGxheU5hbWVcbiAgICAgICAgLy8gSWYgd2UgYXJlIGFuIEFycmF5IHdpdGggYW4gaXRlbSBkZWZpbml0aW9uXG4gICAgICAgIC8vIHRoZW4gd2UgaGF2ZSB0byBsb29rIGludG8gdGhlIEFycmF5IGZvciBvdXIgdmFsdWVcbiAgICAgICAgLy8gYW5kIGFsc28gZ2V0IGhvbGQgb2YgdGhlIHdyYXBwZXIuIFdlIG9ubHkgbmVlZCB0b1xuICAgICAgICAvLyBkbyB0aGlzIGlmIHRoZSBrZXkgaXMgbm90IGEgcHJvcGVydHkgb2YgdGhlIGFycmF5LlxuICAgICAgICAvLyBXZSBjaGVjayB0aGUgZGVmcyB0byB3b3JrIHRoaXMgb3V0IChpLmUuIDAsIDEsIDIpLlxuICAgICAgICAvLyB0b2RvOiBUaGlzIGNvdWxkIGJlIGJldHRlciB0byBjaGVjayAhTmFOIG9uIHRoZSBrZXk/XG4gICAgICAgIGlmIChkZWYuaXNBcnJheSAmJiBkZWYuZGVmICYmICghZGVmLmRlZnMgfHwgIShrZXkgaW4gZGVmLmRlZnMpKSkge1xuICAgICAgICAgIC8vIElmIHdlIGFyZSBhbiBBcnJheSB3aXRoIGEgc2ltcGxlIGl0ZW0gZGVmaW5pdGlvblxuICAgICAgICAgIC8vIG9yIGEgcmVmZXJlbmNlIHRvIGEgc2ltcGxlIHR5cGUgZGVmaW5pdGlvblxuICAgICAgICAgIC8vIHN1YnN0aXR1dGUgdGhlIHZhbHVlIHdpdGggdGhlIHdyYXBwZXIgd2UgZ2V0IGZyb20gdGhlXG4gICAgICAgICAgLy8gY3JlYXRlIGZhY3RvcnkgZnVuY3Rpb24uIE90aGVyd2lzZSBzZXQgdGhlIHZhbHVlIHRvXG4gICAgICAgICAgLy8gdGhlIHJlYWwgdmFsdWUgb2YgdGhlIHByb3BlcnR5LlxuICAgICAgICAgIGl0ZW1EZWYgPSBkZWYuZGVmXG5cbiAgICAgICAgICBpZiAoaXRlbURlZi5pc1NpbXBsZSkge1xuICAgICAgICAgICAgdmFsdWUgPSBpdGVtRGVmLmNyZWF0ZS53cmFwcGVyXG4gICAgICAgICAgICB2YWx1ZS5fc2V0VmFsdWUodGhpc1trZXldKVxuICAgICAgICAgIH0gZWxzZSBpZiAoaXRlbURlZi5pc1JlZmVyZW5jZSAmJiBpdGVtRGVmLnR5cGUuZGVmLmlzU2ltcGxlKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGl0ZW1EZWYudHlwZS5kZWYuY3JlYXRlLndyYXBwZXJcbiAgICAgICAgICAgIHZhbHVlLl9zZXRWYWx1ZSh0aGlzW2tleV0pXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlID0gdGhpc1trZXldXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIFNldCB0aGUgdmFsdWUgdG8gdGhlIHdyYXBwZWQgdmFsdWUgb2YgdGhlIHByb3BlcnR5XG4gICAgICAgICAgdmFsdWUgPSB0aGlzLl9fW2tleV1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgIGlmICh2YWx1ZS5fX3N1cGVybW9kZWwpIHtcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGVycm9ycywgdmFsdWUuZXJyb3JzKVxuICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBXcmFwcGVyKSB7XG4gICAgICAgICAgICB2YXIgd3JhcHBlclZhbHVlID0gdmFsdWUuX2dldFZhbHVlKHRoaXMpXG5cbiAgICAgICAgICAgIGlmICh3cmFwcGVyVmFsdWUgJiYgd3JhcHBlclZhbHVlLl9fc3VwZXJtb2RlbCkge1xuICAgICAgICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShlcnJvcnMsIHdyYXBwZXJWYWx1ZS5lcnJvcnMpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShlcnJvcnMsIHZhbHVlLl9nZXRFcnJvcnModGhpcywga2V5LCBkaXNwbGF5TmFtZSB8fCBrZXkpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZXJyb3JzXG4gICAgfVxuICB9XG59XG5cbnZhciBwcm90byA9IHtcbiAgX19nZXQ6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5fX1trZXldLl9nZXRWYWx1ZSh0aGlzKVxuICB9LFxuICBfX3NldDogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICB0aGlzLl9fW2tleV0uX3NldFZhbHVlKHZhbHVlLCB0aGlzKVxuICB9LFxuICBfX3JlbGF0aXZlUGF0aDogZnVuY3Rpb24gKHRvLCBrZXkpIHtcbiAgICB2YXIgcmVsYXRpdmVQYXRoID0gdGhpcy5fX3BhdGhcbiAgICAgID8gdG8uc3Vic3RyKHRoaXMuX19wYXRoLmxlbmd0aCArIDEpXG4gICAgICA6IHRvXG5cbiAgICBpZiAocmVsYXRpdmVQYXRoKSB7XG4gICAgICByZXR1cm4ga2V5ID8gcmVsYXRpdmVQYXRoICsgJy4nICsga2V5IDogcmVsYXRpdmVQYXRoXG4gICAgfVxuICAgIHJldHVybiBrZXlcbiAgfSxcbiAgX19jaGFpbjogZnVuY3Rpb24gKGZuKSB7XG4gICAgcmV0dXJuIFt0aGlzXS5jb25jYXQodGhpcy5fX2FuY2VzdG9ycykuZm9yRWFjaChmbilcbiAgfSxcbiAgX19tZXJnZTogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICByZXR1cm4gbWVyZ2UodGhpcywgZGF0YSlcbiAgfSxcbiAgX19ub3RpZnlDaGFuZ2U6IGZ1bmN0aW9uIChrZXksIG5ld1ZhbHVlLCBvbGRWYWx1ZSkge1xuICAgIHZhciB0YXJnZXQgPSB0aGlzXG4gICAgdmFyIHRhcmdldFBhdGggPSB0aGlzLl9fcGF0aFxuICAgIHZhciBldmVudE5hbWUgPSAnc2V0J1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgb2xkVmFsdWU6IG9sZFZhbHVlLFxuICAgICAgbmV3VmFsdWU6IG5ld1ZhbHVlXG4gICAgfVxuXG4gICAgdGhpcy5lbWl0KGV2ZW50TmFtZSwgbmV3IEVtaXR0ZXJFdmVudChldmVudE5hbWUsIGtleSwgdGFyZ2V0LCBkYXRhKSlcbiAgICB0aGlzLmVtaXQoJ2NoYW5nZScsIG5ldyBFbWl0dGVyRXZlbnQoZXZlbnROYW1lLCBrZXksIHRhcmdldCwgZGF0YSkpXG4gICAgdGhpcy5lbWl0KCdjaGFuZ2U6JyArIGtleSwgbmV3IEVtaXR0ZXJFdmVudChldmVudE5hbWUsIGtleSwgdGFyZ2V0LCBkYXRhKSlcblxuICAgIHRoaXMuX19hbmNlc3RvcnMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgdmFyIHBhdGggPSBpdGVtLl9fcmVsYXRpdmVQYXRoKHRhcmdldFBhdGgsIGtleSlcbiAgICAgIGl0ZW0uZW1pdCgnY2hhbmdlJywgbmV3IEVtaXR0ZXJFdmVudChldmVudE5hbWUsIHBhdGgsIHRhcmdldCwgZGF0YSkpXG4gICAgfSlcbiAgfSxcbiAgX19zZXROb3RpZnlDaGFuZ2U6IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgdmFyIG9sZFZhbHVlID0gdGhpcy5fX2dldChrZXkpXG4gICAgdGhpcy5fX3NldChrZXksIHZhbHVlKVxuICAgIHZhciBuZXdWYWx1ZSA9IHRoaXMuX19nZXQoa2V5KVxuICAgIHRoaXMuX19ub3RpZnlDaGFuZ2Uoa2V5LCBuZXdWYWx1ZSwgb2xkVmFsdWUpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHByb3RvOiBwcm90byxcbiAgZGVzY3JpcHRvcnM6IGRlc2NyaXB0b3JzXG59XG4iLCIndXNlIHN0cmljdCdcblxuZnVuY3Rpb24gZmFjdG9yeSAoKSB7XG4gIGZ1bmN0aW9uIFByb3AgKHR5cGUpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUHJvcCkpIHtcbiAgICAgIHJldHVybiBuZXcgUHJvcCh0eXBlKVxuICAgIH1cblxuICAgIHRoaXMuX190eXBlID0gdHlwZVxuICAgIHRoaXMuX192YWxpZGF0b3JzID0gW11cbiAgfVxuICBQcm9wLnByb3RvdHlwZS50eXBlID0gZnVuY3Rpb24gKHR5cGUpIHtcbiAgICB0aGlzLl9fdHlwZSA9IHR5cGVcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIFByb3AucHJvdG90eXBlLmVudW1lcmFibGUgPSBmdW5jdGlvbiAoZW51bWVyYWJsZSkge1xuICAgIHRoaXMuX19lbnVtZXJhYmxlID0gZW51bWVyYWJsZVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgUHJvcC5wcm90b3R5cGUuY29uZmlndXJhYmxlID0gZnVuY3Rpb24gKGNvbmZpZ3VyYWJsZSkge1xuICAgIHRoaXMuX19jb25maWd1cmFibGUgPSBjb25maWd1cmFibGVcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIFByb3AucHJvdG90eXBlLndyaXRhYmxlID0gZnVuY3Rpb24gKHdyaXRhYmxlKSB7XG4gICAgdGhpcy5fX3dyaXRhYmxlID0gd3JpdGFibGVcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIFByb3AucHJvdG90eXBlLmtleXMgPSBmdW5jdGlvbiAoa2V5cykge1xuICAgIGlmICh0aGlzLl9fdHlwZSAhPT0gQXJyYXkpIHtcbiAgICAgIHRoaXMuX190eXBlID0gT2JqZWN0XG4gICAgfVxuICAgIGZvciAodmFyIGtleSBpbiBrZXlzKSB7XG4gICAgICB0aGlzW2tleV0gPSBrZXlzW2tleV1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBQcm9wLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uIChmbikge1xuICAgIHRoaXMuX192YWxpZGF0b3JzLnB1c2goZm4pXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBQcm9wLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICB0aGlzLl9fZ2V0ID0gZm5cbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIFByb3AucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChmbikge1xuICAgIHRoaXMuX19zZXQgPSBmblxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgUHJvcC5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB0aGlzLl9fdmFsdWUgPSB2YWx1ZVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgUHJvcC5wcm90b3R5cGUubmFtZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhpcy5fX2Rpc3BsYXlOYW1lID0gbmFtZVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgUHJvcC5yZWdpc3RlciA9IGZ1bmN0aW9uIChuYW1lLCBmbikge1xuICAgIHZhciB3cmFwcGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5fX3ZhbGlkYXRvcnMucHVzaChmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpKVxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFByb3AucHJvdG90eXBlLCBuYW1lLCB7XG4gICAgICB2YWx1ZTogd3JhcHBlclxuICAgIH0pXG4gIH1cbiAgcmV0dXJuIFByb3Bcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5XG4iLCIndXNlIHN0cmljdCdcblxudmFyIGVtaXR0ZXIgPSByZXF1aXJlKCcuL2VtaXR0ZXItb2JqZWN0JylcbnZhciBlbWl0dGVyQXJyYXkgPSByZXF1aXJlKCcuL2VtaXR0ZXItYXJyYXknKVxudmFyIEVtaXR0ZXJFdmVudCA9IHJlcXVpcmUoJy4vZW1pdHRlci1ldmVudCcpXG5cbnZhciBleHRlbmQgPSByZXF1aXJlKCcuL3V0aWwnKS5leHRlbmRcbnZhciBtb2RlbCA9IHJlcXVpcmUoJy4vbW9kZWwnKVxudmFyIG1vZGVsUHJvdG8gPSBtb2RlbC5wcm90b1xudmFyIG1vZGVsRGVzY3JpcHRvcnMgPSBtb2RlbC5kZXNjcmlwdG9yc1xuXG52YXIgbW9kZWxQcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKG1vZGVsUHJvdG8sIG1vZGVsRGVzY3JpcHRvcnMpXG52YXIgb2JqZWN0UHJvdG90eXBlID0gKGZ1bmN0aW9uICgpIHtcbiAgdmFyIHAgPSBPYmplY3QuY3JlYXRlKG1vZGVsUHJvdG90eXBlKVxuXG4gIGVtaXR0ZXIocClcblxuICByZXR1cm4gcFxufSkoKVxuXG5mdW5jdGlvbiBjcmVhdGVBcnJheVByb3RvdHlwZSAoKSB7XG4gIHZhciBwID0gZW1pdHRlckFycmF5KGZ1bmN0aW9uIChldmVudE5hbWUsIGFyciwgZSkge1xuICAgIGlmIChldmVudE5hbWUgPT09ICd1cGRhdGUnKSB7XG4gICAgICAvKipcbiAgICAgICAqIEZvcndhcmQgdGhlIHNwZWNpYWwgYXJyYXkgdXBkYXRlXG4gICAgICAgKiBldmVudHMgYXMgc3RhbmRhcmQgX19ub3RpZnlDaGFuZ2UgZXZlbnRzXG4gICAgICAgKi9cbiAgICAgIGFyci5fX25vdGlmeUNoYW5nZShlLmluZGV4LCBlLnZhbHVlLCBlLm9sZFZhbHVlKVxuICAgIH0gZWxzZSB7XG4gICAgICAvKipcbiAgICAgICAqIEFsbCBvdGhlciBldmVudHMgZS5nLiBwdXNoLCBzcGxpY2UgYXJlIHJlbGF5ZWRcbiAgICAgICAqL1xuICAgICAgdmFyIHRhcmdldCA9IGFyclxuICAgICAgdmFyIHBhdGggPSBhcnIuX19wYXRoXG4gICAgICB2YXIgZGF0YSA9IGVcbiAgICAgIHZhciBrZXkgPSBlLmluZGV4XG5cbiAgICAgIGFyci5lbWl0KGV2ZW50TmFtZSwgbmV3IEVtaXR0ZXJFdmVudChldmVudE5hbWUsICcnLCB0YXJnZXQsIGRhdGEpKVxuICAgICAgYXJyLmVtaXQoJ2NoYW5nZScsIG5ldyBFbWl0dGVyRXZlbnQoZXZlbnROYW1lLCAnJywgdGFyZ2V0LCBkYXRhKSlcbiAgICAgIGFyci5fX2FuY2VzdG9ycy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIHZhciBuYW1lID0gaXRlbS5fX3JlbGF0aXZlUGF0aChwYXRoLCBrZXkpXG4gICAgICAgIGl0ZW0uZW1pdCgnY2hhbmdlJywgbmV3IEVtaXR0ZXJFdmVudChldmVudE5hbWUsIG5hbWUsIHRhcmdldCwgZGF0YSkpXG4gICAgICB9KVxuICAgIH1cbiAgfSlcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhwLCBtb2RlbERlc2NyaXB0b3JzKVxuXG4gIGVtaXR0ZXIocClcblxuICBleHRlbmQocCwgbW9kZWxQcm90bylcblxuICByZXR1cm4gcFxufVxuXG5mdW5jdGlvbiBjcmVhdGVPYmplY3RNb2RlbFByb3RvdHlwZSAocHJvdG8pIHtcbiAgdmFyIHAgPSBPYmplY3QuY3JlYXRlKG9iamVjdFByb3RvdHlwZSlcblxuICBpZiAocHJvdG8pIHtcbiAgICBleHRlbmQocCwgcHJvdG8pXG4gIH1cblxuICByZXR1cm4gcFxufVxuXG5mdW5jdGlvbiBjcmVhdGVBcnJheU1vZGVsUHJvdG90eXBlIChwcm90bywgaXRlbURlZikge1xuICAvLyBXZSBkbyBub3QgdG8gYXR0ZW1wdCB0byBzdWJjbGFzcyBBcnJheSxcbiAgLy8gaW5zdGVhZCBjcmVhdGUgYSBuZXcgaW5zdGFuY2UgZWFjaCB0aW1lXG4gIC8vIGFuZCBtaXhpbiB0aGUgcHJvdG8gb2JqZWN0XG4gIHZhciBwID0gY3JlYXRlQXJyYXlQcm90b3R5cGUoKVxuXG4gIGlmIChwcm90bykge1xuICAgIGV4dGVuZChwLCBwcm90bylcbiAgfVxuXG4gIGlmIChpdGVtRGVmKSB7XG4gICAgLy8gV2UgaGF2ZSBhIGRlZmluaXRpb24gZm9yIHRoZSBpdGVtc1xuICAgIC8vIHRoYXQgYmVsb25nIGluIHRoaXMgYXJyYXkuXG5cbiAgICAvLyBVc2UgdGhlIGB3cmFwcGVyYCBwcm90b3R5cGUgcHJvcGVydHkgYXMgYVxuICAgIC8vIHZpcnR1YWwgV3JhcHBlciBvYmplY3Qgd2UgY2FuIHVzZVxuICAgIC8vIHZhbGlkYXRlIGFsbCB0aGUgaXRlbXMgaW4gdGhlIGFycmF5LlxuICAgIHZhciBhcnJJdGVtV3JhcHBlciA9IGl0ZW1EZWYuY3JlYXRlLndyYXBwZXJcblxuICAgIC8vIFZhbGlkYXRlIG5ldyBtb2RlbHMgYnkgb3ZlcnJpZGluZyB0aGUgZW1pdHRlciBhcnJheVxuICAgIC8vIG11dGF0b3JzIHRoYXQgY2FuIGNhdXNlIG5ldyBpdGVtcyB0byBlbnRlciB0aGUgYXJyYXkuXG4gICAgb3ZlcnJpZGVBcnJheUFkZGluZ011dGF0b3JzKHAsIGFyckl0ZW1XcmFwcGVyKVxuXG4gICAgLy8gUHJvdmlkZSBhIGNvbnZlbmllbnQgbW9kZWwgZmFjdG9yeVxuICAgIC8vIGZvciBjcmVhdGluZyBhcnJheSBpdGVtIGluc3RhbmNlc1xuICAgIHAuY3JlYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGl0ZW1EZWYuaXNSZWZlcmVuY2UgPyBpdGVtRGVmLnR5cGUoKSA6IGl0ZW1EZWYuY3JlYXRlKCkuX2dldFZhbHVlKHRoaXMpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBcbn1cblxuZnVuY3Rpb24gb3ZlcnJpZGVBcnJheUFkZGluZ011dGF0b3JzIChhcnIsIGl0ZW1XcmFwcGVyKSB7XG4gIGZ1bmN0aW9uIGdldEFycmF5QXJncyAoaXRlbXMpIHtcbiAgICB2YXIgYXJncyA9IFtdXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgaXRlbVdyYXBwZXIuX3NldFZhbHVlKGl0ZW1zW2ldLCBhcnIpXG4gICAgICBhcmdzLnB1c2goaXRlbVdyYXBwZXIuX2dldFZhbHVlKGFycikpXG4gICAgfVxuICAgIHJldHVybiBhcmdzXG4gIH1cblxuICB2YXIgcHVzaCA9IGFyci5wdXNoXG4gIHZhciB1bnNoaWZ0ID0gYXJyLnVuc2hpZnRcbiAgdmFyIHNwbGljZSA9IGFyci5zcGxpY2VcbiAgdmFyIHVwZGF0ZSA9IGFyci51cGRhdGVcblxuICBpZiAocHVzaCkge1xuICAgIGFyci5wdXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGFyZ3MgPSBnZXRBcnJheUFyZ3MoYXJndW1lbnRzKVxuICAgICAgcmV0dXJuIHB1c2guYXBwbHkoYXJyLCBhcmdzKVxuICAgIH1cbiAgfVxuXG4gIGlmICh1bnNoaWZ0KSB7XG4gICAgYXJyLnVuc2hpZnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgYXJncyA9IGdldEFycmF5QXJncyhhcmd1bWVudHMpXG4gICAgICByZXR1cm4gdW5zaGlmdC5hcHBseShhcnIsIGFyZ3MpXG4gICAgfVxuICB9XG5cbiAgaWYgKHNwbGljZSkge1xuICAgIGFyci5zcGxpY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgYXJncyA9IGdldEFycmF5QXJncyhBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpKVxuICAgICAgYXJncy51bnNoaWZ0KGFyZ3VtZW50c1sxXSlcbiAgICAgIGFyZ3MudW5zaGlmdChhcmd1bWVudHNbMF0pXG4gICAgICByZXR1cm4gc3BsaWNlLmFwcGx5KGFyciwgYXJncylcbiAgICB9XG4gIH1cblxuICBpZiAodXBkYXRlKSB7XG4gICAgYXJyLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBhcmdzID0gZ2V0QXJyYXlBcmdzKFthcmd1bWVudHNbMV1dKVxuICAgICAgYXJncy51bnNoaWZ0KGFyZ3VtZW50c1swXSlcbiAgICAgIHJldHVybiB1cGRhdGUuYXBwbHkoYXJyLCBhcmdzKVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVNb2RlbFByb3RvdHlwZSAoZGVmKSB7XG4gIHJldHVybiBkZWYuaXNBcnJheSA/IGNyZWF0ZUFycmF5TW9kZWxQcm90b3R5cGUoZGVmLnByb3RvLCBkZWYuZGVmKSA6IGNyZWF0ZU9iamVjdE1vZGVsUHJvdG90eXBlKGRlZi5wcm90bylcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVNb2RlbFByb3RvdHlwZVxuIiwiJ3VzZSBzdHJpY3QnXG5cbm1vZHVsZS5leHBvcnRzID0ge31cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgcHJvcCA9IHJlcXVpcmUoJy4vcHJvcCcpXG52YXIgbWVyZ2UgPSByZXF1aXJlKCcuL21lcmdlJylcbnZhciBjcmVhdGVEZWYgPSByZXF1aXJlKCcuL2RlZicpXG52YXIgU3VwZXJtb2RlbCA9IHJlcXVpcmUoJy4vc3VwZXJtb2RlbCcpXG5cbmZ1bmN0aW9uIHN1cGVybW9kZWxzIChzY2hlbWEpIHtcbiAgdmFyIGRlZiA9IGNyZWF0ZURlZihzY2hlbWEpXG5cbiAgZnVuY3Rpb24gU3VwZXJtb2RlbENvbnN0cnVjdG9yIChkYXRhKSB7XG4gICAgdmFyIG1vZGVsID0gZGVmLmlzU2ltcGxlID8gZGVmLmNyZWF0ZSgpIDogZGVmLmNyZWF0ZSgpLl9nZXRWYWx1ZSh7fSlcblxuICAgIGlmIChkYXRhKSB7XG4gICAgICAvLyBpZiB0d2UgaGF2ZSBiZWVuIHBhc3NlZCBzb21lXG4gICAgICAvLyBkYXRhLCBtZXJnZSBpdCBpbnRvIHRoZSBtb2RlbC5cbiAgICAgIG1vZGVsLl9fbWVyZ2UoZGF0YSlcbiAgICB9XG4gICAgcmV0dXJuIG1vZGVsXG4gIH1cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN1cGVybW9kZWxDb25zdHJ1Y3RvciwgJ2RlZicsIHtcbiAgICB2YWx1ZTogZGVmIC8vIHRoaXMgaXMgdXNlZCB0byB2YWxpZGF0ZSByZWZlcmVuY2VkIFN1cGVybW9kZWxDb25zdHJ1Y3RvcnNcbiAgfSlcbiAgU3VwZXJtb2RlbENvbnN0cnVjdG9yLnByb3RvdHlwZSA9IFN1cGVybW9kZWwgLy8gdGhpcyBzaGFyZWQgb2JqZWN0IGlzIHVzZWQsIGFzIGEgcHJvdG90eXBlLCB0byBpZGVudGlmeSBTdXBlcm1vZGVsQ29uc3RydWN0b3JzXG4gIFN1cGVybW9kZWxDb25zdHJ1Y3Rvci5jb25zdHJ1Y3RvciA9IFN1cGVybW9kZWxDb25zdHJ1Y3RvclxuICByZXR1cm4gU3VwZXJtb2RlbENvbnN0cnVjdG9yXG59XG5cbnN1cGVybW9kZWxzLnByb3AgPSBwcm9wXG5zdXBlcm1vZGVscy5tZXJnZSA9IG1lcmdlXG5cbm1vZHVsZS5leHBvcnRzID0gc3VwZXJtb2RlbHNcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgU3VwZXJtb2RlbCA9IHJlcXVpcmUoJy4vc3VwZXJtb2RlbCcpXG5cbmZ1bmN0aW9uIGV4dGVuZCAob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCB0eXBlb2YgYWRkICE9PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBvcmlnaW5cbiAgfVxuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKVxuICB2YXIgaSA9IGtleXMubGVuZ3RoXG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV1cbiAgfVxuICByZXR1cm4gb3JpZ2luXG59XG5cbnZhciB1dGlsID0ge1xuICBleHRlbmQ6IGV4dGVuZCxcbiAgdHlwZU9mOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopLm1hdGNoKC9cXHMoW2EtekEtWl0rKS8pWzFdLnRvTG93ZXJDYXNlKClcbiAgfSxcbiAgaXNPYmplY3Q6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLnR5cGVPZih2YWx1ZSkgPT09ICdvYmplY3QnXG4gIH0sXG4gIGlzQXJyYXk6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKVxuICB9LFxuICBpc1NpbXBsZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgLy8gJ1NpbXBsZScgaGVyZSBtZWFucyBhbnl0aGluZ1xuICAgIC8vIG90aGVyIHRoYW4gYW4gT2JqZWN0IG9yIGFuIEFycmF5XG4gICAgLy8gaS5lLiBudW1iZXIsIHN0cmluZywgZGF0ZSwgYm9vbCwgbnVsbCwgdW5kZWZpbmVkLCByZWdleC4uLlxuICAgIHJldHVybiAhdGhpcy5pc09iamVjdCh2YWx1ZSkgJiYgIXRoaXMuaXNBcnJheSh2YWx1ZSlcbiAgfSxcbiAgaXNGdW5jdGlvbjogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMudHlwZU9mKHZhbHVlKSA9PT0gJ2Z1bmN0aW9uJ1xuICB9LFxuICBpc0RhdGU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLnR5cGVPZih2YWx1ZSkgPT09ICdkYXRlJ1xuICB9LFxuICBpc051bGw6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gbnVsbFxuICB9LFxuICBpc1VuZGVmaW5lZDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiAodmFsdWUpID09PSAndW5kZWZpbmVkJ1xuICB9LFxuICBpc051bGxPclVuZGVmaW5lZDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNOdWxsKHZhbHVlKSB8fCB0aGlzLmlzVW5kZWZpbmVkKHZhbHVlKVxuICB9LFxuICBjYXN0OiBmdW5jdGlvbiAodmFsdWUsIHR5cGUpIHtcbiAgICBpZiAoIXR5cGUpIHtcbiAgICAgIHJldHVybiB2YWx1ZVxuICAgIH1cblxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBTdHJpbmc6XG4gICAgICAgIHJldHVybiB1dGlsLmNhc3RTdHJpbmcodmFsdWUpXG4gICAgICBjYXNlIE51bWJlcjpcbiAgICAgICAgcmV0dXJuIHV0aWwuY2FzdE51bWJlcih2YWx1ZSlcbiAgICAgIGNhc2UgQm9vbGVhbjpcbiAgICAgICAgcmV0dXJuIHV0aWwuY2FzdEJvb2xlYW4odmFsdWUpXG4gICAgICBjYXNlIERhdGU6XG4gICAgICAgIHJldHVybiB1dGlsLmNhc3REYXRlKHZhbHVlKVxuICAgICAgY2FzZSBPYmplY3Q6XG4gICAgICBjYXNlIEZ1bmN0aW9uOlxuICAgICAgICByZXR1cm4gdmFsdWVcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjYXN0JylcbiAgICB9XG4gIH0sXG4gIGNhc3RTdHJpbmc6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHV0aWwudHlwZU9mKHZhbHVlKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiB2YWx1ZVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcgJiYgdmFsdWUudG9TdHJpbmcoKVxuICB9LFxuICBjYXN0TnVtYmVyOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIE5hTlxuICAgIH1cbiAgICBpZiAodXRpbC50eXBlT2YodmFsdWUpID09PSAnbnVtYmVyJykge1xuICAgICAgcmV0dXJuIHZhbHVlXG4gICAgfVxuICAgIHJldHVybiBOdW1iZXIodmFsdWUpXG4gIH0sXG4gIGNhc3RCb29sZWFuOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAoIXZhbHVlKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgdmFyIGZhbHNleSA9IFsnMCcsICdmYWxzZScsICdvZmYnLCAnbm8nXVxuICAgIHJldHVybiBmYWxzZXkuaW5kZXhPZih2YWx1ZSkgPT09IC0xXG4gIH0sXG4gIGNhc3REYXRlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB1dGlsLnR5cGVPZih2YWx1ZSkgPT09ICdkYXRlJykge1xuICAgICAgcmV0dXJuIHZhbHVlXG4gICAgfVxuICAgIHJldHVybiBuZXcgRGF0ZSh2YWx1ZSlcbiAgfSxcbiAgaXNDb25zdHJ1Y3RvcjogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNTaW1wbGVDb25zdHJ1Y3Rvcih2YWx1ZSkgfHwgW0FycmF5LCBPYmplY3RdLmluZGV4T2YodmFsdWUpID4gLTFcbiAgfSxcbiAgaXNTaW1wbGVDb25zdHJ1Y3RvcjogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIFtTdHJpbmcsIE51bWJlciwgRGF0ZSwgQm9vbGVhbl0uaW5kZXhPZih2YWx1ZSkgPiAtMVxuICB9LFxuICBpc1N1cGVybW9kZWxDb25zdHJ1Y3RvcjogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNGdW5jdGlvbih2YWx1ZSkgJiYgdmFsdWUucHJvdG90eXBlID09PSBTdXBlcm1vZGVsXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsXG4iLCIndXNlIHN0cmljdCdcblxuZnVuY3Rpb24gVmFsaWRhdGlvbkVycm9yICh0YXJnZXQsIGVycm9yLCB2YWxpZGF0b3IsIGtleSkge1xuICB0aGlzLnRhcmdldCA9IHRhcmdldFxuICB0aGlzLmVycm9yID0gZXJyb3JcbiAgdGhpcy52YWxpZGF0b3IgPSB2YWxpZGF0b3JcblxuICBpZiAoa2V5KSB7XG4gICAgdGhpcy5rZXkgPSBrZXlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZhbGlkYXRpb25FcnJvclxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJylcbnZhciBWYWxpZGF0aW9uRXJyb3IgPSByZXF1aXJlKCcuL3ZhbGlkYXRpb24tZXJyb3InKVxuXG5mdW5jdGlvbiBXcmFwcGVyIChkZWZhdWx0VmFsdWUsIHdyaXRhYmxlLCB2YWxpZGF0b3JzLCBnZXR0ZXIsIHNldHRlciwgYmVmb3JlU2V0LCBhc3NlcnQpIHtcbiAgdGhpcy52YWxpZGF0b3JzID0gdmFsaWRhdG9yc1xuXG4gIHRoaXMuX2RlZmF1bHRWYWx1ZSA9IGRlZmF1bHRWYWx1ZVxuICB0aGlzLl93cml0YWJsZSA9IHdyaXRhYmxlXG4gIHRoaXMuX2dldHRlciA9IGdldHRlclxuICB0aGlzLl9zZXR0ZXIgPSBzZXR0ZXJcbiAgdGhpcy5fYmVmb3JlU2V0ID0gYmVmb3JlU2V0XG4gIHRoaXMuX2Fzc2VydCA9IGFzc2VydFxuICB0aGlzLmlzSW5pdGlhbGl6ZWQgPSBmYWxzZVxuXG4gIGlmICghdXRpbC5pc0Z1bmN0aW9uKGRlZmF1bHRWYWx1ZSkpIHtcbiAgICB0aGlzLmlzSW5pdGlhbGl6ZWQgPSB0cnVlXG5cbiAgICBpZiAoIXV0aWwuaXNVbmRlZmluZWQoZGVmYXVsdFZhbHVlKSkge1xuICAgICAgdGhpcy5fdmFsdWUgPSBkZWZhdWx0VmFsdWVcbiAgICB9XG4gIH1cbn1cbldyYXBwZXIucHJvdG90eXBlLl9pbml0aWFsaXplID0gZnVuY3Rpb24gKHBhcmVudCkge1xuICBpZiAodGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICB0aGlzLl9zZXRWYWx1ZSh0aGlzLl9kZWZhdWx0VmFsdWUocGFyZW50KSwgcGFyZW50KVxuICB0aGlzLmlzSW5pdGlhbGl6ZWQgPSB0cnVlXG59XG5XcmFwcGVyLnByb3RvdHlwZS5fZ2V0RXJyb3JzID0gZnVuY3Rpb24gKG1vZGVsLCBrZXksIGRpc3BsYXlOYW1lKSB7XG4gIG1vZGVsID0gbW9kZWwgfHwgdGhpc1xuICBrZXkgPSBrZXkgfHwgJydcbiAgZGlzcGxheU5hbWUgPSBkaXNwbGF5TmFtZSB8fCBrZXlcblxuICB2YXIgc2ltcGxlID0gdGhpcy52YWxpZGF0b3JzXG4gIHZhciBlcnJvcnMgPSBbXVxuICB2YXIgdmFsdWUgPSB0aGlzLl9nZXRWYWx1ZShtb2RlbClcbiAgdmFyIHZhbGlkYXRvciwgZXJyb3JcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHNpbXBsZS5sZW5ndGg7IGkrKykge1xuICAgIHZhbGlkYXRvciA9IHNpbXBsZVtpXVxuICAgIGVycm9yID0gdmFsaWRhdG9yLmNhbGwobW9kZWwsIHZhbHVlLCBkaXNwbGF5TmFtZSlcblxuICAgIGlmIChlcnJvcikge1xuICAgICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcihtb2RlbCwgZXJyb3IsIHZhbGlkYXRvciwga2V5KSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZXJyb3JzXG59XG5XcmFwcGVyLnByb3RvdHlwZS5fZ2V0VmFsdWUgPSBmdW5jdGlvbiAobW9kZWwpIHtcbiAgcmV0dXJuIHRoaXMuX2dldHRlciA/IHRoaXMuX2dldHRlci5jYWxsKG1vZGVsKSA6IHRoaXMuX3ZhbHVlXG59XG5XcmFwcGVyLnByb3RvdHlwZS5fc2V0VmFsdWUgPSBmdW5jdGlvbiAodmFsdWUsIG1vZGVsKSB7XG4gIGlmICghdGhpcy5fd3JpdGFibGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZhbHVlIGlzIHJlYWRvbmx5JylcbiAgfVxuXG4gIC8vIEhvb2sgdXAgdGhlIHBhcmVudCByZWYgaWYgbmVjZXNzYXJ5XG4gIGlmICh2YWx1ZSAmJiB2YWx1ZS5fX3N1cGVybW9kZWwgJiYgbW9kZWwpIHtcbiAgICBpZiAodmFsdWUuX19wYXJlbnQgIT09IG1vZGVsKSB7XG4gICAgICB2YWx1ZS5fX3BhcmVudCA9IG1vZGVsXG4gICAgfVxuICB9XG5cbiAgdmFyIHZhbFxuICBpZiAodGhpcy5fc2V0dGVyKSB7XG4gICAgdGhpcy5fc2V0dGVyLmNhbGwobW9kZWwsIHZhbHVlKVxuICAgIHZhbCA9IHRoaXMuX2dldFZhbHVlKG1vZGVsKVxuICB9IGVsc2Uge1xuICAgIHZhbCA9IHRoaXMuX2JlZm9yZVNldCA/IHRoaXMuX2JlZm9yZVNldCh2YWx1ZSkgOiB2YWx1ZVxuICB9XG5cbiAgaWYgKHRoaXMuX2Fzc2VydCkge1xuICAgIHRoaXMuX2Fzc2VydCh2YWwpXG4gIH1cblxuICB0aGlzLl92YWx1ZSA9IHZhbFxufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhXcmFwcGVyLnByb3RvdHlwZSwge1xuICB2YWx1ZToge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2dldFZhbHVlKClcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICB0aGlzLl9zZXRWYWx1ZSh2YWx1ZSlcbiAgICB9XG4gIH0sXG4gIGVycm9yczoge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2dldEVycm9ycygpXG4gICAgfVxuICB9XG59KVxubW9kdWxlLmV4cG9ydHMgPSBXcmFwcGVyXG4iXX0=
