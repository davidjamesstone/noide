(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var config = require('../../../config/client')

function Editor () {
  var editor = window.ace.edit('editor')

  // enable autocompletion and snippets
  editor.setOptions({
    enableSnippets: true,
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: false
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
  this.setReadOnly = function (value) {
    editor.setReadOnly(value)
  }
  this.addCommands = function () {
    editor.commands.addCommands.apply(editor.commands, arguments)
  }
  this.setSession = function (editSession) {
    editor.setSession(editSession)
  }
  this.resize = function () {
    editor.resize()
  }
}

module.exports = Editor

},{"../../../config/client":23}],2:[function(require,module,exports){
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

},{"supermodels.js":34}],3:[function(require,module,exports){
var supermodels = require('supermodels.js')
var Fso = require('./fso')

var schema = {
  __type: [Fso],
  findByPath: function (path) {
    return this.find(function (item) {
      return item.path === path
    })
  }
}

module.exports = supermodels(schema)

},{"./fso":2,"supermodels.js":34}],4:[function(require,module,exports){
var page = require('page')
var qs = require('querystring')
var noide = require('./noide')
var Tree = require('./tree')
var Recent = require('./recent')
var splitter = require('./splitter')

window.onbeforeunload = function () {
  if (noide.sessions.dirty.length) {
    return 'Unsaved changes will be lost - are you sure you want to leave?'
  }
}

var mainEl = document.getElementById('main')
var recentEl = document.getElementById('recent')
var treeEl = document.getElementById('tree')
var workspacesEl = document.getElementById('workspaces')

splitter(document.getElementById('sidebar-workspaces'))
splitter(document.getElementById('workspaces-info'))
splitter(document.getElementById('main-footer'))

noide.client.connect(function (err) {
  if (err) {
    return noide.handleError(err)
  }

  var tree = new Tree(treeEl, noide.files, noide.state)
  var recent = new Recent(recentEl, noide.state)
  var processes = require('./processes')

  page('/', function (ctx) {
    workspacesEl.className = 'welcome'
  })

  page('/file', function (ctx, next) {
    var path = qs.parse(ctx.querystring).path
    var file = noide.files.find(function (item) {
      return item.relativePath === path
    })

    if (!file) {
      return next()
    }

    noide.openFile(file)
    workspacesEl.className = 'editor'
  })

  page('*', function (ctx) {
    workspacesEl.className = 'not-found'
  })

  noide.files.on('change', function () { tree.render() })
  noide.state.on('change', function () { recent.render() })
  processes.render()
})

document.querySelector('.sidebar-toggle').addEventListener('click', function () {
  mainEl.classList.toggle('no-sidebar')
})

},{"./noide":6,"./processes":7,"./recent":15,"./splitter":18,"./tree":21,"page":31,"querystring":27}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
var page = require('page')
var Nes = require('nes/client')
var supermodels = require('supermodels.js')
var Sessions = require('./sessions')
var Editor = require('./editor')
var Fso = require('./fso')
var Fsos = require('./fsos')
var prop = supermodels.prop()
var editor = new Editor()
var storageKey = 'noide'
var sessions = new Sessions()
var host = window.location.host
var client = new Nes.Client('ws://' + host)
var files = new Fsos()
var stateLoaded = false

var stateSchema = {
  recent: Fsos,
  current: Fso
}

var State = supermodels(stateSchema)
var state = new State({
  recent: new Fsos()
})

client.onDisconnect = function (willReconnect, log) {
  noide.connected = willReconnect ? null : false
  console.log(log)
}

client.onConnect = function () {
  noide.connected = true
  client.request('/watched', function (err, payload) {
    if (err) {
      return handleError(err)
    }

    var watched = payload.watched
    var files = noide.files
    files.splice.apply(files, [0, files.length].concat(new Fsos(watched)))

    if (!stateLoaded) {
      loadState()
      stateLoaded = true

      noide.client.subscribe('/change', function (payload) {
        sessions.items.forEach(function (session) {
          var file = session.file
          if (payload.path === file.path) {
            if (payload.stat.mtime !== file.stat.mtime) {
              readFile(file.path, function (err, payload) {
                if (err) {
                  return handleError(err)
                }
                file.stat = payload.stat
                session.editSession.setValue(payload.contents)
              })
            }
          }
        })
      }, function (err) {
        if (err) {
          return handleError(err)
        }
      })
      //
      // client.subscribe('/unlink', function (payload) {
      //   var data = payload
      //   if (data.path === state.path) {
      //     if (window.confirm('File has been removed - close this tab?')) {
      //       window.close()
      //     }
      //   }
      // }, function (err) {
      //   if (err) {
      //     return handleError(err)
      //   }
      // })
      //

      page({
        hashbang: true
      })
    }
  })
}

function handleError (err) {
  console.error(err)
}

function saveState () {
  var state = noide.state
  var storage = {
    current: state.current ? state.current.path : null,
    recent: state.recent.map(function (item) {
      return item.path
    }),
    expanded: files.filter(function (item) {
      return item.expanded
    }).map(function (item) {
      return item.path
    })
  }
  window.localStorage.setItem(storageKey, JSON.stringify(storage))
}

function loadState () {
  var storage = window.localStorage.getItem(storageKey)
  storage = storage ? JSON.parse(storage) : {}

  var dir, file, i, current
  var recent = []

  if (storage.recent) {
    for (i = 0; i < storage.recent.length; i++) {
      file = files.findByPath(storage.recent[i])
      if (file) {
        recent.push(file)
      }
    }
    if (recent.length) {
      state.recent.splice.apply(state.recent, [0, 0].concat(recent))
    }
  }

  if (storage.current) {
    file = files.findByPath(storage.current)
    if (file) {
      current = file
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

  if (current) {
    openFile(current)
  }
}

function readFile (path, callback) {
  client.request({
    path: '/readfile',
    payload: {
      path: path
    },
    method: 'POST'
  }, callback)
}

function openFile (file) {
  var session = sessions.find(file)
  if (session) {
    state.current = file
    editor.setSession(session.editSession)
  } else {
    readFile(file.path, function (err, payload) {
      if (err) {
        return handleError(err)
      }

      if (!state.recent.findByPath(file.path)) {
        state.recent.unshift(file)
      }

      session = sessions.add(file, payload.contents)
      state.current = file
      editor.setSession(session.editSession)
    })
  }
}

function closeFile (file) {
  var close = false
  var session = sessions.find(file)

  if (session && session.isDirty) {
    if (window.confirm('There are unsaved changes to this file. Are you sure?')) {
      close = true
    }
  } else {
    close = true
  }

  if (close) {
    // Remove from recent files
    state.recent.splice(state.recent.indexOf(file), 1)

    if (session) {
      // Remove session
      sessions.items.splice(sessions.items.indexOf(session), 1)

      if (state.current === file) {
        if (sessions.items.length) {
          // Open the next session
          openFile(sessions.items[0].file)
        } else if (state.recent.length) {
          // Open the next file
          openFile(state.recent[0])
        } else {
          state.current = null
          editor.setSession(null)
        }
      }
    }
  }
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

function saveAll () {
  sessions.dirty.forEach(function (item) {
    var file = item.file
    var editSession = item.editSession
    writeFile(file.path, editSession.getValue(), function (err, payload) {
      if (err) {
        return handleError(err)
      }
      file.stat = payload.stat
      editSession.getUndoManager().markClean()
    })
  })
}

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
      handleError(err)
    }
    callback && callback(err, payload)
  })
}

var schema = {
  connected: prop(Boolean).value(false),
  get files () { return files },
  get state () { return state },
  get client () { return client },
  get editor () { return editor },
  get sessions () { return sessions },
  run: run,
  openFile: openFile,
  closeFile: closeFile,
  readFile: readFile,
  writeFile: writeFile,
  handleError: handleError
}

var Noide = supermodels(schema)
var noide = new Noide()

state.on('change', saveState)

editor.addCommands([{
  name: 'save',
  bindKey: {
    win: 'Ctrl-S',
    mac: 'Command-S'
  },
  exec: function (editor) {
    var file = state.current
    var editSession = sessions.find(file).editSession
    writeFile(file.path, editSession.getValue(), function (err, payload) {
      if (err) {
        return handleError(err)
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
    saveAll()
  },
  readOnly: false
}])

var linter = require('./standard')
linter(noide)

window.noide = noide
module.exports = noide

},{"./editor":1,"./fso":2,"./fsos":3,"./sessions":17,"./standard":19,"nes/client":29,"page":31,"supermodels.js":34}],7:[function(require,module,exports){
var noide = require('./noide')
var Processes = require('./processes/index')
var processesEl = document.getElementById('processes')
var processes = new Processes(processesEl, noide)

module.exports = processes

},{"./noide":6,"./processes/index":9}],8:[function(require,module,exports){
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
var hoisted11 = ["hidden", "true", "class", "nav nav-tabs"]
var hoisted12 = ["role", "presentation", "class", "active"]
var hoisted13 = ["href", "#"]
var hoisted14 = ["role", "presentation"]
var hoisted15 = ["href", "#"]
var hoisted16 = ["role", "presentation"]
var hoisted17 = ["href", "#"]
var hoisted18 = ["class", "processes"]
var hoisted19 = ["class", "list"]
var hoisted20 = ["class", "nav nav-tabs"]
var hoisted21 = ["class", "btn btn-default"]
var hoisted22 = ["class", "fa fa-stop"]
var hoisted23 = ["class", "btn btn-default"]
var hoisted24 = ["class", "fa fa-refresh"]
var hoisted25 = ["class", "btn btn-default"]
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
      elementOpen("li", null, hoisted12)
        elementOpen("a", null, hoisted13)
          text("Home")
        elementClose("a")
      elementClose("li")
      elementOpen("li", null, hoisted14)
        elementOpen("a", null, hoisted15)
          text("Profile")
        elementClose("a")
      elementClose("li")
      elementOpen("li", null, hoisted16)
        elementOpen("a", null, hoisted17)
          text("Messages")
        elementClose("a")
      elementClose("li")
    elementClose("ul")
  elementClose("div")
  elementOpen("div", null, hoisted18)
    elementOpen("div", null, hoisted19)
      if (model.processes.length) {
        elementOpen("ul", null, hoisted20)
          ;(Array.isArray(model.processes) ? model.processes : Object.keys(model.processes)).forEach(function(process, $index) {
            elementOpen("li", process.pid)
              elementOpen("a", null, null, "href", "http://www.google.co.uk?q=" + (process.pid) + "")
                text("[" + (process.pid) + "]")
              elementClose("a")
              elementOpen("a", null, null, "onclick", function ($event) {
                $event.preventDefault();
                var $element = this;
              showOutput(process)})
                text("" + (process.name || process.command) + "")
                elementOpen("span")
                  text("[" + (process.pid) + "]")
                elementClose("span")
                elementOpen("span", null, null, "class", 'circle ' + (!process.isAlive ? 'dead' : (process.isActive ? 'alive active' : 'alive')))
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

},{"incremental-dom":28}],9:[function(require,module,exports){
var patch = require('incremental-dom').patch
var view = require('./index.html')
var Model = require('./model')
var Task = require('./task')
var Process = require('./process')
var splitter = require('../splitter')

function Processes (el, noide) {
  var client = noide.client
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
      return noide.handleError(err)
    }
  })

  function showOutput (process) {
    editor.setSession(process.session)
  }

  client.subscribe('/io/pids', loadPids, function (err) {
    if (err) {
      return noide.handleError(err)
    }
  })

  client.request({
    path: '/io/pids'
  }, function (err, payload) {
    if (err) {
      noide.handleError(err)
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
    noide.readFile('package.json', function (err, payload) {
      if (err) {
        noide.handleError(err)
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
      editor.setShowPrintMargin(false)
      splitter(document.getElementById('list-output'))
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

},{"../splitter":18,"./index.html":8,"./model":10,"./process":11,"./task":12,"incremental-dom":28}],10:[function(require,module,exports){
var supermodels = require('supermodels.js')
var noide = require('../noide')
var Task = require('./task')
var Process = require('./process')

var schema = {
  tasks: [Task],
  command: String,
  processes: [Process],
  get dead () {
    return this.processes.filter(function (item) {
      return !item.isAlive
    })
  },
  run: function (command, name) {
    noide.run(command, name, function (err, payload) {
      if (err) {
        return noide.handleError(err)
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
    noide.client.request({
      method: 'POST',
      path: '/io/kill',
      payload: {
        pid: process.pid
      }
    }, function (err, payload) {
      if (err) {
        noide.handleError(err)
      }
    })
  }
}

module.exports = supermodels(schema)

},{"../noide":6,"./process":11,"./task":12,"supermodels.js":34}],11:[function(require,module,exports){
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

},{"../prop":13,"supermodels.js":34}],12:[function(require,module,exports){
var supermodels = require('supermodels.js')
var prop = require('../prop')

var schema = {
  name: prop(String).required(),
  command: prop(String).required()
}

module.exports = supermodels(schema)

},{"../prop":13,"supermodels.js":34}],13:[function(require,module,exports){
var supermodels = require('supermodels.js')
var validators = require('./validators')
var prop = supermodels.prop()

// Registering validators makes them part
// of the fluent interface when using `prop`.
prop.register('required', validators.required)

module.exports = prop

},{"./validators":22,"supermodels.js":34}],14:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementVoid = IncrementalDOM.elementVoid
var elementClose = IncrementalDOM.elementClose
var elementPlaceholder = IncrementalDOM.elementPlaceholder
var text = IncrementalDOM.text

module.exports = (function () {
var hoisted1 = ["class", "list-group"]
var hoisted2 = ["data-toggle", "tooltip", "data-placement", "left"]
var hoisted3 = ["class", "close"]
var hoisted4 = ["class", "name icon icon-file-text"]
var hoisted5 = ["class", "list-group-item-text"]

return function recent (files, current, onClick, onClickClose) {
  elementOpen("div", null, hoisted1, "style", {display: files.length ? '' : 'none'})
    ;(Array.isArray(files) ? files : Object.keys(files)).forEach(function(file, $index) {
      elementOpen("a", file.relativePath, hoisted2, "title", file.relativePath, "href", '/file?path=' + file.relativePath, "class", 'list-group-item ' + (file === current ? 'active' : ''))
        elementOpen("span", null, hoisted3, "onclick", function ($event) {
          $event.preventDefault();
          var $element = this;
        onClickClose(file)})
          text("×")
        elementClose("span")
        elementOpen("span", null, hoisted4, "data-name", file.name, "data-path", file.relativePath)
          text("" + (file.name) + "")
        elementClose("span")
        if (false) {
          elementOpen("p", null, hoisted5)
            text("" + ('./' + (file.relativePath !== file.name ? file.relativeDir : '')) + "")
          elementClose("p")
        }
      elementClose("a")
    }, files)
  elementClose("div")
}
})();

},{"incremental-dom":28}],15:[function(require,module,exports){
var patch = require('incremental-dom').patch
var view = require('./index.html')
var noide = require('../noide')

function Recent (el, state) {
  state.on('change', render)

  function onClick (file) {
    noide.openFile(file)
  }

  function onClickClose (file) {
    noide.closeFile(file)
  }

  function update (state) {
    view(state.recent, state.current, onClick, onClickClose)
  }

  function render () {
    patch(el, update, state)
  }

  this.render = render
}

module.exports = Recent

},{"../noide":6,"./index.html":14,"incremental-dom":28}],16:[function(require,module,exports){
var supermodels = require('supermodels.js')
var Fso = require('./fso')
var prop = supermodels.prop()

module.exports = supermodels({
  file: Fso,
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

},{"./fso":2,"supermodels.js":34}],17:[function(require,module,exports){
// var ace = require('brace')
var supermodels = require('supermodels.js')
var config = require('../../config/client')
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

module.exports = supermodels(schema)

},{"../../config/client":23,"./modes":5,"./session":16,"supermodels.js":34}],18:[function(require,module,exports){
var w = window
var d = document

function splitter (handle) {
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
    noide.editor.resize()
    var processes = require('./processes')
    processes.editor.resize()
  }
  handle.addEventListener('mousedown', function (e) {
    e.preventDefault()

    last = horizontal ? e.clientY : e.clientX

    w.addEventListener('mousemove', onDrag)
    w.addEventListener('mouseup', onEndDrag)
  })
}

module.exports = splitter

},{"./processes":7}],19:[function(require,module,exports){
function linter (noide) {
  function lint () {
    var file = noide.state.current
    if (file && file.ext === '.js') {
      var editSession = noide.sessions.find(file).editSession
      noide.client.request({
        path: '/standard',
        payload: {
          value: editSession.getValue()
        },
        method: 'POST'
      }, function (err, payload) {
        if (err) {
          return noide.handleError(err)
        }
        editSession.setAnnotations(payload)
        setTimeout(lint, 3000)
      })
    } else {
      setTimeout(lint, 3000)
    }
  }
  lint()
}

module.exports = linter

},{}],20:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementVoid = IncrementalDOM.elementVoid
var elementClose = IncrementalDOM.elementClose
var elementPlaceholder = IncrementalDOM.elementPlaceholder
var text = IncrementalDOM.text

module.exports = (function () {
var hoisted1 = ["class", "name icon icon-file-text"]
var hoisted2 = ["class", "expanded"]
var hoisted3 = ["class", "collapsed"]
var hoisted4 = ["class", "name icon icon-file-directory"]
var hoisted5 = ["class", "triangle-left"]

return function tree (data, tree, isRoot, current, onClick) {
  elementOpen("ul", null, null, "class", isRoot ? 'tree' : '')
    ;(Array.isArray(data) ? data : Object.keys(data)).forEach(function(fso, $index) {
      elementOpen("li", fso.path)
        if (fso.isFile) {
          elementOpen("a", null, null, "href", '/file?path=' + fso.relativePath)
            elementOpen("span", null, hoisted1, "data-name", fso.name, "data-path", fso.relativePath)
              text(" \
                          " + (fso.name) + " \
                        ")
            elementClose("span")
          elementClose("a")
        }
        if (fso.isDirectory) {
          elementOpen("a", null, null, "onclick", function ($event) {
            $event.preventDefault();
            var $element = this;
          onClick(fso)})
            if (fso.expanded) {
              elementOpen("small", null, hoisted2)
                text("▼")
              elementClose("small")
            }
            if (!fso.expanded) {
              elementOpen("small", null, hoisted3)
                text("▶")
              elementClose("small")
            }
            elementOpen("span", null, hoisted4, "data-name", fso.name, "data-path", fso.relativePath)
              text(" \
                          " + (fso.name) + " \
                        ")
            elementClose("span")
          elementClose("a")
        }
        if (fso.isFile && fso === current) {
          elementOpen("span", null, hoisted5)
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
                    tree(fso.children, tree, false, current, onClick)
        }
      elementClose("li")
    }, data)
  elementClose("ul")
}
})();

},{"incremental-dom":28}],21:[function(require,module,exports){
var page = require('page')
var patch = require('incremental-dom').patch
var view = require('./index.html')
var noide = require('../noide')

function Tree (el, fsos, state) {
  fsos.on('change', render)
  state.on('change:current', render)

  function onClick (fso) {
    if (!fso.isDirectory) {
      // page.show('/file?path=' + fso.path, fso)
      // noide.openFile(fso)
    } else {
      fso.expanded = !fso.expanded
      render()
    }
    return false
  }

  function update (tree) {
    view(tree, view, true, state.current, onClick)
  }

  function render () {
    var tree = makeTree(fsos)
    patch(el, update, tree)
  }

  function makeTree (data) {
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
    return treeify(data, 'path', 'dir', 'children')
  }

  this.render = render
}

module.exports = Tree

},{"../noide":6,"./index.html":20,"incremental-dom":28,"page":31}],22:[function(require,module,exports){
function required (val, name) {
  if (!val) {
    return name + ' is required'
  }
}

module.exports = {
  required: required
}

},{}],23:[function(require,module,exports){
module.exports = {
  ace: {
    tabSize: 2,
    theme: 'monokai',
    useSoftTabs: true
  }
}

},{}],24:[function(require,module,exports){
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

},{}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
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

},{}],27:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":25,"./encode":26}],28:[function(require,module,exports){

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

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) : typeof define === 'function' && define.amd ? define(['exports'], factory) : factory(global.IncrementalDOM = {});
})(this, function (exports) {
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
   * Similar to the built-in Treewalker class, but simplified and allows direct
   * access to modify the currentNode property.
   * @param {!Element|!DocumentFragment} node The root Node of the subtree the
   *     walker should start traversing.
   * @constructor
   */
  function TreeWalker(node) {
    /**
     * Keeps track of the current parent node. This is necessary as the traversal
     * methods may traverse past the last child and we still need a way to get
     * back to the parent.
     * @const @private {!Array<!Node>}
     */
    this.stack_ = [];

    /**
     * @const {!Element|!DocumentFragment}
     */
    this.root = node;

    /**
     * @type {?Node}
     */
    this.currentNode = node;
  }

  /**
   * @return {!Node} The current parent of the current location in the subtree.
   */
  TreeWalker.prototype.getCurrentParent = function () {
    return this.stack_[this.stack_.length - 1];
  };

  /**
   * Changes the current location the firstChild of the current location.
   */
  TreeWalker.prototype.firstChild = function () {
    this.stack_.push(this.currentNode);
    this.currentNode = this.currentNode.firstChild;
  };

  /**
   * Changes the current location the nextSibling of the current location.
   */
  TreeWalker.prototype.nextSibling = function () {
    this.currentNode = this.currentNode.nextSibling;
  };

  /**
   * Changes the current location the parentNode of the current location.
   */
  TreeWalker.prototype.parentNode = function () {
    this.currentNode = this.stack_.pop();
  };

  /**
   * Keeps track of the state of a patch.
   * @param {!Element|!DocumentFragment} node The root Node of the subtree the
   *     is for.
   * @param {?Context} prevContext The previous context.
   * @constructor
   */
  function Context(node, prevContext) {
    /**
     * @const {TreeWalker}
     */
    this.walker = new TreeWalker(node);

    /**
     * @const {Document}
     */
    this.doc = node.ownerDocument;

    /**
     * Keeps track of what namespace to create new Elements in.
     * @private
     * @const {!Array<(string|undefined)>}
     */
    this.nsStack_ = [undefined];

    /**
     * @const {?Context}
     */
    this.prevContext = prevContext;

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
   * @return {(string|undefined)} The current namespace to create Elements in.
   */
  Context.prototype.getCurrentNamespace = function () {
    return this.nsStack_[this.nsStack_.length - 1];
  };

  /**
   * @param {string=} namespace The namespace to enter.
   */
  Context.prototype.enterNamespace = function (namespace) {
    this.nsStack_.push(namespace);
  };

  /**
   * Exits the current namespace
   */
  Context.prototype.exitNamespace = function () {
    this.nsStack_.pop();
  };

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
   * The current context.
   * @type {?Context}
   */
  var context;

  /**
   * Enters a new patch context.
   * @param {!Element|!DocumentFragment} node
   */
  var enterContext = function (node) {
    context = new Context(node, context);
  };

  /**
   * Restores the previous patch context.
   */
  var restoreContext = function () {
    context = context.prevContext;
  };

  /**
   * Gets the current patch context.
   * @return {?Context}
   */
  var getContext = function () {
    return context;
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
     * @const
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
     * The last child to have been visited within the current pass.
     * @type {?Node}
     */
    this.lastVisitedChild = null;

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

    // If, after changing the attribute,
    // the corresponding property is not updated,
    // also update it.
    if (el[name] !== value) {
      el[name] = value;
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
   * @param {string|Object<string,string>} style The style to set. Either a
   *     string of css or an object containing property-value pairs.
   */
  var applyStyle = function (el, name, style) {
    if (typeof style === 'string') {
      el.style.cssText = style;
    } else {
      el.style.cssText = '';
      var elStyle = el.style;

      for (var prop in style) {
        if (has(style, prop)) {
          elStyle[prop] = style[prop];
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

  var SVG_NS = 'http://www.w3.org/2000/svg';

  /**
   * Enters a tag, checking to see if it is a namespace boundary, and if so,
   * updates the current namespace.
   * @param {string} tag The tag to enter.
   */
  var enterTag = function (tag) {
    if (tag === 'svg') {
      getContext().enterNamespace(SVG_NS);
    } else if (tag === 'foreignObject') {
      getContext().enterNamespace(undefined);
    }
  };

  /**
   * Exits a tag, checking to see if it is a namespace boundary, and if so,
   * updates the current namespace.
   * @param {string} tag The tag to enter.
   */
  var exitTag = function (tag) {
    if (tag === 'svg' || tag === 'foreignObject') {
      getContext().exitNamespace();
    }
  };

  /**
   * Gets the namespace to create an element (of a given tag) in.
   * @param {string} tag The tag to get the namespace for.
   * @return {(string|undefined)} The namespace to create the tag in.
   */
  var getNamespaceForTag = function (tag) {
    if (tag === 'svg') {
      return SVG_NS;
    }

    return getContext().getCurrentNamespace();
  };

  /**
   * Creates an Element.
   * @param {Document} doc The document with which to create the Element.
   * @param {string} tag The tag for the Element.
   * @param {?string=} key A key to identify the Element.
   * @param {?Array<*>=} statics An array of attribute name/value pairs of
   *     the static attributes for the Element.
   * @return {!Element}
   */
  var createElement = function (doc, tag, key, statics) {
    var namespace = getNamespaceForTag(tag);
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
   * Creates a Node, either a Text or an Element depending on the node name
   * provided.
   * @param {Document} doc The document with which to create the Node.
   * @param {string} nodeName The tag if creating an element or #text to create
   *     a Text.
   * @param {?string=} key A key to identify the Element.
   * @param {?Array<*>=} statics The static data to initialize the Node
   *     with. For an Element, an array of attribute name/value pairs of
   *     the static attributes for the Element.
   * @return {!Node}
   */
  var createNode = function (doc, nodeName, key, statics) {
    if (nodeName === '#text') {
      return doc.createTextNode('');
    }

    return createElement(doc, nodeName, key, statics);
  };

  /**
   * Creates a mapping that can be used to look up children using a key.
   * @param {!Node} el
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
   * @param {!Node} el
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
   * @param {!Node} parent
   * @param {?string=} key
   * @return {?Element} The child corresponding to the key.
   */
  var getChild = function (parent, key) {
    return (/** @type {?Element} */key && getKeyMap(parent)[key]
    );
  };

  /**
   * Registers an element as being a child. The parent will keep track of the
   * child using the key. The child can be retrieved using the same key using
   * getKeyMap. The provided key should be unique within the parent Element.
   * @param {!Node} parent The parent of child.
   * @param {string} key A key to identify the child with.
   * @param {!Node} child The child to register.
   */
  var registerChild = function (parent, key, child) {
    getKeyMap(parent)[key] = child;
  };

  if ('development' !== 'production') {
    /**
    * Makes sure that keyed Element matches the tag name provided.
    * @param {!Element} node The node that is being matched.
    * @param {string=} tag The tag name of the Element.
    * @param {?string=} key The key of the Element.
    */
    var assertKeyedTagMatches = function (node, tag, key) {
      var nodeName = getData(node).nodeName;
      if (nodeName !== tag) {
        throw new Error('Was expecting node with key "' + key + '" to be a ' + tag + ', not a ' + nodeName + '.');
      }
    };
  }

  /**
   * Checks whether or not a given node matches the specified nodeName and key.
   *
   * @param {!Node} node An HTML node, typically an HTMLElement or Text.
   * @param {?string} nodeName The nodeName for this node.
   * @param {?string=} key An optional key that identifies a node.
   * @return {boolean} True if the node matches, false otherwise.
   */
  var matches = function (node, nodeName, key) {
    var data = getData(node);

    // Key check is done using double equals as we want to treat a null key the
    // same as undefined. This should be okay as the only values allowed are
    // strings, null and undefined so the == semantics are not too weird.
    return key == data.key && nodeName === data.nodeName;
  };

  /**
   * Aligns the virtual Element definition with the actual DOM, moving the
   * corresponding DOM node to the correct location or creating it if necessary.
   * @param {string} nodeName For an Element, this should be a valid tag string.
   *     For a Text, this should be #text.
   * @param {?string=} key The key used to identify this element.
   * @param {?Array<*>=} statics For an Element, this should be an array of
   *     name-value pairs.
   * @return {!Node} The matching node.
   */
  var alignWithDOM = function (nodeName, key, statics) {
    var context = getContext();
    var walker = context.walker;
    var currentNode = walker.currentNode;
    var parent = walker.getCurrentParent();
    var matchingNode;

    // Check to see if we have a node to reuse
    if (currentNode && matches(currentNode, nodeName, key)) {
      matchingNode = currentNode;
    } else {
      var existingNode = getChild(parent, key);

      // Check to see if the node has moved within the parent or if a new one
      // should be created
      if (existingNode) {
        if ('development' !== 'production') {
          assertKeyedTagMatches(existingNode, nodeName, key);
        }

        matchingNode = existingNode;
      } else {
        matchingNode = createNode(context.doc, nodeName, key, statics);

        if (key) {
          registerChild(parent, key, matchingNode);
        }

        context.markCreated(matchingNode);
      }

      // If the node has a key, remove it from the DOM to prevent a large number
      // of re-orders in the case that it moved far or was completely removed.
      // Since we hold on to a reference through the keyMap, we can always add it
      // back.
      if (currentNode && getData(currentNode).key) {
        parent.replaceChild(matchingNode, currentNode);
        getData(parent).keyMapValid = false;
      } else {
        parent.insertBefore(matchingNode, currentNode);
      }

      walker.currentNode = matchingNode;
    }

    return matchingNode;
  };

  /**
   * Clears out any unvisited Nodes, as the corresponding virtual element
   * functions were never called for them.
   * @param {Node} node
   */
  var clearUnvisitedDOM = function (node) {
    var context = getContext();
    var walker = context.walker;
    var data = getData(node);
    var keyMap = data.keyMap;
    var keyMapValid = data.keyMapValid;
    var lastVisitedChild = data.lastVisitedChild;
    var child = node.lastChild;
    var key;

    data.lastVisitedChild = null;

    if (child === lastVisitedChild && keyMapValid) {
      return;
    }

    if (data.attrs[exports.symbols.placeholder] && walker.currentNode !== walker.root) {
      return;
    }

    while (child !== lastVisitedChild) {
      node.removeChild(child);
      context.markDeleted( /** @type {!Node}*/child);

      key = getData(child).key;
      if (key) {
        delete keyMap[key];
      }
      child = node.lastChild;
    }

    // Clean the keyMap, removing any unusued keys.
    for (key in keyMap) {
      child = keyMap[key];
      if (!child.parentNode) {
        context.markDeleted(child);
        delete keyMap[key];
      }
    }

    data.keyMapValid = true;
  };

  /**
   * Enters an Element, setting the current namespace for nested elements.
   * @param {Node} node
   */
  var enterNode = function (node) {
    var data = getData(node);
    enterTag(data.nodeName);
  };

  /**
   * Exits an Element, unwinding the current namespace to the previous value.
   * @param {Node} node
   */
  var exitNode = function (node) {
    var data = getData(node);
    exitTag(data.nodeName);
  };

  /**
   * Marks node's parent as having visited node.
   * @param {Node} node
   */
  var markVisited = function (node) {
    var context = getContext();
    var walker = context.walker;
    var parent = walker.getCurrentParent();
    var data = getData(parent);
    data.lastVisitedChild = node;
  };

  /**
   * Changes to the first child of the current node.
   */
  var firstChild = function () {
    var context = getContext();
    var walker = context.walker;
    enterNode(walker.currentNode);
    walker.firstChild();
  };

  /**
   * Changes to the next sibling of the current node.
   */
  var nextSibling = function () {
    var context = getContext();
    var walker = context.walker;
    markVisited(walker.currentNode);
    walker.nextSibling();
  };

  /**
   * Changes to the parent of the current node, removing any unvisited children.
   */
  var parentNode = function () {
    var context = getContext();
    var walker = context.walker;
    walker.parentNode();
    exitNode(walker.currentNode);
  };

  if ('development' !== 'production') {
    var assertNoUnclosedTags = function (root) {
      var openElement = getContext().walker.getCurrentParent();
      if (!openElement) {
        return;
      }

      var openTags = [];
      while (openElement && openElement !== root) {
        openTags.push(openElement.nodeName.toLowerCase());
        openElement = openElement.parentNode;
      }

      throw new Error('One or more tags were not closed:\n' + openTags.join('\n'));
    };
  }

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
    enterContext(node);

    firstChild();
    fn(data);
    parentNode();
    clearUnvisitedDOM(node);

    if ('development' !== 'production') {
      assertNoUnclosedTags(node);
    }

    getContext().notifyChanges();
    restoreContext();
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

  if ('development' !== 'production') {
    /**
     * Keeps track whether or not we are in an attributes declaration (after
     * elementOpenStart, but before elementOpenEnd).
     * @type {boolean}
     */
    var inAttributes = false;

    /** Makes sure that the caller is not where attributes are expected. */
    var assertNotInAttributes = function () {
      if (inAttributes) {
        throw new Error('Was not expecting a call to attr or elementOpenEnd, ' + 'they must follow a call to elementOpenStart.');
      }
    };

    /** Makes sure that the caller is where attributes are expected. */
    var assertInAttributes = function () {
      if (!inAttributes) {
        throw new Error('Was expecting a call to attr or elementOpenEnd. ' + 'elementOpenStart must be followed by zero or more calls to attr, ' + 'then one call to elementOpenEnd.');
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
     * @param {string} tag
     */
    var assertCloseMatchesOpenTag = function (tag) {
      var context = getContext();
      var walker = context.walker;
      var closingNode = walker.getCurrentParent();
      var data = getData(closingNode);

      if (tag !== data.nodeName) {
        throw new Error('Received a call to close ' + tag + ' but ' + data.nodeName + ' was open.');
      }
    };

    /** Updates the state to being in an attribute declaration. */
    var setInAttributes = function () {
      inAttributes = true;
    };

    /** Updates the state to not being in an attribute declaration. */
    var setNotInAttributes = function () {
      inAttributes = false;
    };
  }

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
    if ('development' !== 'production') {
      assertNotInAttributes();
    }

    var node = /** @type {!Element}*/alignWithDOM(tag, key, statics);
    var data = getData(node);

    /*
     * Checks to see if one or more attributes have changed for a given Element.
     * When no attributes have changed, this is much faster than checking each
     * individual argument. When attributes have changed, the overhead of this is
     * minimal.
     */
    var attrsArr = data.attrsArr;
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
      var attr,
          newAttrs = data.newAttrs;

      for (attr in newAttrs) {
        newAttrs[attr] = undefined;
      }

      for (i = ATTRIBUTES_OFFSET; i < arguments.length; i += 2) {
        newAttrs[arguments[i]] = arguments[i + 1];
      }

      for (attr in newAttrs) {
        updateAttribute(node, attr, newAttrs[attr]);
      }
    }

    firstChild();
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
    if ('development' !== 'production') {
      assertNotInAttributes();
      setInAttributes();
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
    if ('development' !== 'production') {
      assertInAttributes();
    }

    argsBuilder.push(name, value);
  };

  /**
   * Closes an open tag started with elementOpenStart.
   * @return {!Element} The corresponding Element.
   */
  exports.elementOpenEnd = function () {
    if ('development' !== 'production') {
      assertInAttributes();
      setNotInAttributes();
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
    if ('development' !== 'production') {
      assertNotInAttributes();
      assertCloseMatchesOpenTag(tag);
    }

    parentNode();

    var node = /** @type {!Element} */getContext().walker.currentNode;

    clearUnvisitedDOM(node);

    nextSibling();
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
    if ('development' !== 'production') {
      assertPlaceholderKeySpecified(key);
    }

    var node = exports.elementOpen.apply(null, arguments);
    updateAttribute(node, exports.symbols.placeholder, true);
    exports.elementClose.apply(null, arguments);
    return node;
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
    if ('development' !== 'production') {
      assertNotInAttributes();
    }

    var node = /** @type {!Text}*/alignWithDOM('#text', null);
    var data = getData(node);

    if (data.text !== value) {
      data.text = /** @type {string} */value;

      var formatted = value;
      for (var i = 1; i < arguments.length; i += 1) {
        formatted = arguments[i](formatted);
      }

      node.data = formatted;
    }

    nextSibling();
    return node;
  };
});

},{}],29:[function(require,module,exports){
'use strict';

module.exports = require('./dist/client');

},{"./dist/client":30}],30:[function(require,module,exports){
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

},{}],31:[function(require,module,exports){
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

},{"_process":24,"path-to-regexp":32}],32:[function(require,module,exports){
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

},{"isarray":33}],33:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],34:[function(require,module,exports){
module.exports = require('./lib/supermodels');

},{"./lib/supermodels":45}],35:[function(require,module,exports){
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

},{"./factory":39,"./util":46}],36:[function(require,module,exports){
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

},{}],37:[function(require,module,exports){
'use strict'

module.exports = function EmitterEvent (name, path, target, detail) {
  this.name = name
  this.path = path
  this.target = target

  if (detail) {
    this.detail = detail
  }
}

},{}],38:[function(require,module,exports){
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

},{}],39:[function(require,module,exports){
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

},{"./proto":43,"./util":46,"./wrapper":48}],40:[function(require,module,exports){
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
      var item = model.create()
      model.push(item && item.__supermodel ? merge(item, obj[i]) : obj[i])
    }
  }

  return model
}

module.exports = merge

},{}],41:[function(require,module,exports){
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

},{"./emitter-event":37,"./merge":40,"./validation-error":47,"./wrapper":48}],42:[function(require,module,exports){
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

},{}],43:[function(require,module,exports){
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

},{"./emitter-array":36,"./emitter-event":37,"./emitter-object":38,"./model":41,"./util":46}],44:[function(require,module,exports){
'use strict'

module.exports = {}

},{}],45:[function(require,module,exports){
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

},{"./def":35,"./merge":40,"./prop":42,"./supermodel":44}],46:[function(require,module,exports){
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

},{"./supermodel":44}],47:[function(require,module,exports){
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

},{}],48:[function(require,module,exports){
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

},{"./util":46,"./validation-error":47}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvanMvZWRpdG9yL2luZGV4LmpzIiwiY2xpZW50L2pzL2Zzby5qcyIsImNsaWVudC9qcy9mc29zLmpzIiwiY2xpZW50L2pzL2luZGV4LmpzIiwiY2xpZW50L2pzL21vZGVzLmpzIiwiY2xpZW50L2pzL25vaWRlLmpzIiwiY2xpZW50L2pzL3Byb2Nlc3Nlcy5qcyIsImNsaWVudC9qcy9wcm9jZXNzZXMvaW5kZXguaHRtbCIsImNsaWVudC9qcy9wcm9jZXNzZXMvaW5kZXguanMiLCJjbGllbnQvanMvcHJvY2Vzc2VzL21vZGVsLmpzIiwiY2xpZW50L2pzL3Byb2Nlc3Nlcy9wcm9jZXNzLmpzIiwiY2xpZW50L2pzL3Byb2Nlc3Nlcy90YXNrLmpzIiwiY2xpZW50L2pzL3Byb3AuanMiLCJjbGllbnQvanMvcmVjZW50L2luZGV4Lmh0bWwiLCJjbGllbnQvanMvcmVjZW50L2luZGV4LmpzIiwiY2xpZW50L2pzL3Nlc3Npb24uanMiLCJjbGllbnQvanMvc2Vzc2lvbnMuanMiLCJjbGllbnQvanMvc3BsaXR0ZXIuanMiLCJjbGllbnQvanMvc3RhbmRhcmQuanMiLCJjbGllbnQvanMvdHJlZS9pbmRleC5odG1sIiwiY2xpZW50L2pzL3RyZWUvaW5kZXguanMiLCJjbGllbnQvanMvdmFsaWRhdG9ycy5qcyIsImNvbmZpZy9jbGllbnQuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3F1ZXJ5c3RyaW5nLWVzMy9kZWNvZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcXVlcnlzdHJpbmctZXMzL2VuY29kZS5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9xdWVyeXN0cmluZy1lczMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaW5jcmVtZW50YWwtZG9tL2Rpc3QvaW5jcmVtZW50YWwtZG9tLmpzIiwibm9kZV9tb2R1bGVzL25lcy9jbGllbnQuanMiLCJub2RlX21vZHVsZXMvbmVzL2Rpc3QvY2xpZW50LmpzIiwibm9kZV9tb2R1bGVzL3BhZ2UvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcGFnZS9ub2RlX21vZHVsZXMvcGF0aC10by1yZWdleHAvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcGFnZS9ub2RlX21vZHVsZXMvcGF0aC10by1yZWdleHAvbm9kZV9tb2R1bGVzL2lzYXJyYXkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL2RlZi5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcm1vZGVscy5qcy9saWIvZW1pdHRlci1hcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcm1vZGVscy5qcy9saWIvZW1pdHRlci1ldmVudC5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcm1vZGVscy5qcy9saWIvZW1pdHRlci1vYmplY3QuanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL2ZhY3RvcnkuanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL21lcmdlLmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybW9kZWxzLmpzL2xpYi9tb2RlbC5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcm1vZGVscy5qcy9saWIvcHJvcC5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcm1vZGVscy5qcy9saWIvcHJvdG8uanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL3N1cGVybW9kZWwuanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL3N1cGVybW9kZWxzLmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybW9kZWxzLmpzL2xpYi91dGlsLmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybW9kZWxzLmpzL2xpYi92YWxpZGF0aW9uLWVycm9yLmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybW9kZWxzLmpzL2xpYi93cmFwcGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcHNDQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzVtQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzNtQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFlBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBjb25maWcgPSByZXF1aXJlKCcuLi8uLi8uLi9jb25maWcvY2xpZW50JylcblxuZnVuY3Rpb24gRWRpdG9yICgpIHtcbiAgdmFyIGVkaXRvciA9IHdpbmRvdy5hY2UuZWRpdCgnZWRpdG9yJylcblxuICAvLyBlbmFibGUgYXV0b2NvbXBsZXRpb24gYW5kIHNuaXBwZXRzXG4gIGVkaXRvci5zZXRPcHRpb25zKHtcbiAgICBlbmFibGVTbmlwcGV0czogdHJ1ZSxcbiAgICBlbmFibGVCYXNpY0F1dG9jb21wbGV0aW9uOiB0cnVlLFxuICAgIGVuYWJsZUxpdmVBdXRvY29tcGxldGlvbjogZmFsc2VcbiAgfSlcblxuICBlZGl0b3IuY29tbWFuZHMuYWRkQ29tbWFuZHMoW3tcbiAgICBuYW1lOiAnaGVscCcsXG4gICAgYmluZEtleToge1xuICAgICAgd2luOiAnQ3RybC1IJyxcbiAgICAgIG1hYzogJ0NvbW1hbmQtSCdcbiAgICB9LFxuICAgIGV4ZWM6IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vICRtb2RhbC5vcGVuKHtcbiAgICAgIC8vICAgdGVtcGxhdGVVcmw6ICcvY2xpZW50L2ZzL3ZpZXdzL2tleWJvYXJkLXNob3J0Y3V0cy5odG1sJyxcbiAgICAgIC8vICAgc2l6ZTogJ2xnJ1xuICAgICAgLy8gfSlcbiAgICB9LFxuICAgIHJlYWRPbmx5OiBmYWxzZSAvLyB0aGlzIGNvbW1hbmQgc2hvdWxkIGFwcGx5IGluIHJlYWRPbmx5IG1vZGVcbiAgfV0pXG5cbiAgZWRpdG9yLnNldFRoZW1lKCdhY2UvdGhlbWUvJyArIGNvbmZpZy5hY2UudGhlbWUpXG4gIHRoaXMuc2V0UmVhZE9ubHkgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBlZGl0b3Iuc2V0UmVhZE9ubHkodmFsdWUpXG4gIH1cbiAgdGhpcy5hZGRDb21tYW5kcyA9IGZ1bmN0aW9uICgpIHtcbiAgICBlZGl0b3IuY29tbWFuZHMuYWRkQ29tbWFuZHMuYXBwbHkoZWRpdG9yLmNvbW1hbmRzLCBhcmd1bWVudHMpXG4gIH1cbiAgdGhpcy5zZXRTZXNzaW9uID0gZnVuY3Rpb24gKGVkaXRTZXNzaW9uKSB7XG4gICAgZWRpdG9yLnNldFNlc3Npb24oZWRpdFNlc3Npb24pXG4gIH1cbiAgdGhpcy5yZXNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgZWRpdG9yLnJlc2l6ZSgpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3JcbiIsInZhciBzdXBlcm1vZGVscyA9IHJlcXVpcmUoJ3N1cGVybW9kZWxzLmpzJylcblxudmFyIHNjaGVtYSA9IHtcbiAgbmFtZTogU3RyaW5nLFxuICBwYXRoOiBTdHJpbmcsXG4gIHJlbGF0aXZlRGlyOiBTdHJpbmcsXG4gIHJlbGF0aXZlUGF0aDogU3RyaW5nLFxuICBkaXI6IFN0cmluZyxcbiAgaXNEaXJlY3Rvcnk6IEJvb2xlYW4sXG4gIGV4dDogU3RyaW5nLFxuICBzdGF0OiBPYmplY3QsXG4gIGdldCBpc0ZpbGUgKCkge1xuICAgIHJldHVybiAhdGhpcy5pc0RpcmVjdG9yeVxuICB9LFxuICBleHBhbmRlZDogQm9vbGVhblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN1cGVybW9kZWxzKHNjaGVtYSlcbiIsInZhciBzdXBlcm1vZGVscyA9IHJlcXVpcmUoJ3N1cGVybW9kZWxzLmpzJylcbnZhciBGc28gPSByZXF1aXJlKCcuL2ZzbycpXG5cbnZhciBzY2hlbWEgPSB7XG4gIF9fdHlwZTogW0Zzb10sXG4gIGZpbmRCeVBhdGg6IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMuZmluZChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0ucGF0aCA9PT0gcGF0aFxuICAgIH0pXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdXBlcm1vZGVscyhzY2hlbWEpXG4iLCJ2YXIgcGFnZSA9IHJlcXVpcmUoJ3BhZ2UnKVxudmFyIHFzID0gcmVxdWlyZSgncXVlcnlzdHJpbmcnKVxudmFyIG5vaWRlID0gcmVxdWlyZSgnLi9ub2lkZScpXG52YXIgVHJlZSA9IHJlcXVpcmUoJy4vdHJlZScpXG52YXIgUmVjZW50ID0gcmVxdWlyZSgnLi9yZWNlbnQnKVxudmFyIHNwbGl0dGVyID0gcmVxdWlyZSgnLi9zcGxpdHRlcicpXG5cbndpbmRvdy5vbmJlZm9yZXVubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKG5vaWRlLnNlc3Npb25zLmRpcnR5Lmxlbmd0aCkge1xuICAgIHJldHVybiAnVW5zYXZlZCBjaGFuZ2VzIHdpbGwgYmUgbG9zdCAtIGFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBsZWF2ZT8nXG4gIH1cbn1cblxudmFyIG1haW5FbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYWluJylcbnZhciByZWNlbnRFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWNlbnQnKVxudmFyIHRyZWVFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0cmVlJylcbnZhciB3b3Jrc3BhY2VzRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd29ya3NwYWNlcycpXG5cbnNwbGl0dGVyKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaWRlYmFyLXdvcmtzcGFjZXMnKSlcbnNwbGl0dGVyKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3b3Jrc3BhY2VzLWluZm8nKSlcbnNwbGl0dGVyKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYWluLWZvb3RlcicpKVxuXG5ub2lkZS5jbGllbnQuY29ubmVjdChmdW5jdGlvbiAoZXJyKSB7XG4gIGlmIChlcnIpIHtcbiAgICByZXR1cm4gbm9pZGUuaGFuZGxlRXJyb3IoZXJyKVxuICB9XG5cbiAgdmFyIHRyZWUgPSBuZXcgVHJlZSh0cmVlRWwsIG5vaWRlLmZpbGVzLCBub2lkZS5zdGF0ZSlcbiAgdmFyIHJlY2VudCA9IG5ldyBSZWNlbnQocmVjZW50RWwsIG5vaWRlLnN0YXRlKVxuICB2YXIgcHJvY2Vzc2VzID0gcmVxdWlyZSgnLi9wcm9jZXNzZXMnKVxuXG4gIHBhZ2UoJy8nLCBmdW5jdGlvbiAoY3R4KSB7XG4gICAgd29ya3NwYWNlc0VsLmNsYXNzTmFtZSA9ICd3ZWxjb21lJ1xuICB9KVxuXG4gIHBhZ2UoJy9maWxlJywgZnVuY3Rpb24gKGN0eCwgbmV4dCkge1xuICAgIHZhciBwYXRoID0gcXMucGFyc2UoY3R4LnF1ZXJ5c3RyaW5nKS5wYXRoXG4gICAgdmFyIGZpbGUgPSBub2lkZS5maWxlcy5maW5kKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5yZWxhdGl2ZVBhdGggPT09IHBhdGhcbiAgICB9KVxuXG4gICAgaWYgKCFmaWxlKSB7XG4gICAgICByZXR1cm4gbmV4dCgpXG4gICAgfVxuXG4gICAgbm9pZGUub3BlbkZpbGUoZmlsZSlcbiAgICB3b3Jrc3BhY2VzRWwuY2xhc3NOYW1lID0gJ2VkaXRvcidcbiAgfSlcblxuICBwYWdlKCcqJywgZnVuY3Rpb24gKGN0eCkge1xuICAgIHdvcmtzcGFjZXNFbC5jbGFzc05hbWUgPSAnbm90LWZvdW5kJ1xuICB9KVxuXG4gIG5vaWRlLmZpbGVzLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7IHRyZWUucmVuZGVyKCkgfSlcbiAgbm9pZGUuc3RhdGUub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHsgcmVjZW50LnJlbmRlcigpIH0pXG4gIHByb2Nlc3Nlcy5yZW5kZXIoKVxufSlcblxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNpZGViYXItdG9nZ2xlJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gIG1haW5FbC5jbGFzc0xpc3QudG9nZ2xlKCduby1zaWRlYmFyJylcbn0pXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gIHZhciBtb2RlcyA9IHtcbiAgICAnLmpzJzogJ2FjZS9tb2RlL2phdmFzY3JpcHQnLFxuICAgICcuY3NzJzogJ2FjZS9tb2RlL2NzcycsXG4gICAgJy5zY3NzJzogJ2FjZS9tb2RlL3Njc3MnLFxuICAgICcubGVzcyc6ICdhY2UvbW9kZS9sZXNzJyxcbiAgICAnLmh0bWwnOiAnYWNlL21vZGUvaHRtbCcsXG4gICAgJy5odG0nOiAnYWNlL21vZGUvaHRtbCcsXG4gICAgJy5lanMnOiAnYWNlL21vZGUvaHRtbCcsXG4gICAgJy5qc29uJzogJ2FjZS9tb2RlL2pzb24nLFxuICAgICcubWQnOiAnYWNlL21vZGUvbWFya2Rvd24nLFxuICAgICcuY29mZmVlJzogJ2FjZS9tb2RlL2NvZmZlZScsXG4gICAgJy5qYWRlJzogJ2FjZS9tb2RlL2phZGUnLFxuICAgICcucGhwJzogJ2FjZS9tb2RlL3BocCcsXG4gICAgJy5weSc6ICdhY2UvbW9kZS9weXRob24nLFxuICAgICcuc2Fzcyc6ICdhY2UvbW9kZS9zYXNzJyxcbiAgICAnLnR4dCc6ICdhY2UvbW9kZS90ZXh0JyxcbiAgICAnLnR5cGVzY3JpcHQnOiAnYWNlL21vZGUvdHlwZXNjcmlwdCcsXG4gICAgJy5naXRpZ25vcmUnOiAnYWNlL21vZGUvZ2l0aWdub3JlJyxcbiAgICAnLnhtbCc6ICdhY2UvbW9kZS94bWwnXG4gIH1cblxuICByZXR1cm4gbW9kZXNbZmlsZS5leHRdXG59XG4iLCJ2YXIgcGFnZSA9IHJlcXVpcmUoJ3BhZ2UnKVxudmFyIE5lcyA9IHJlcXVpcmUoJ25lcy9jbGllbnQnKVxudmFyIHN1cGVybW9kZWxzID0gcmVxdWlyZSgnc3VwZXJtb2RlbHMuanMnKVxudmFyIFNlc3Npb25zID0gcmVxdWlyZSgnLi9zZXNzaW9ucycpXG52YXIgRWRpdG9yID0gcmVxdWlyZSgnLi9lZGl0b3InKVxudmFyIEZzbyA9IHJlcXVpcmUoJy4vZnNvJylcbnZhciBGc29zID0gcmVxdWlyZSgnLi9mc29zJylcbnZhciBwcm9wID0gc3VwZXJtb2RlbHMucHJvcCgpXG52YXIgZWRpdG9yID0gbmV3IEVkaXRvcigpXG52YXIgc3RvcmFnZUtleSA9ICdub2lkZSdcbnZhciBzZXNzaW9ucyA9IG5ldyBTZXNzaW9ucygpXG52YXIgaG9zdCA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0XG52YXIgY2xpZW50ID0gbmV3IE5lcy5DbGllbnQoJ3dzOi8vJyArIGhvc3QpXG52YXIgZmlsZXMgPSBuZXcgRnNvcygpXG52YXIgc3RhdGVMb2FkZWQgPSBmYWxzZVxuXG52YXIgc3RhdGVTY2hlbWEgPSB7XG4gIHJlY2VudDogRnNvcyxcbiAgY3VycmVudDogRnNvXG59XG5cbnZhciBTdGF0ZSA9IHN1cGVybW9kZWxzKHN0YXRlU2NoZW1hKVxudmFyIHN0YXRlID0gbmV3IFN0YXRlKHtcbiAgcmVjZW50OiBuZXcgRnNvcygpXG59KVxuXG5jbGllbnQub25EaXNjb25uZWN0ID0gZnVuY3Rpb24gKHdpbGxSZWNvbm5lY3QsIGxvZykge1xuICBub2lkZS5jb25uZWN0ZWQgPSB3aWxsUmVjb25uZWN0ID8gbnVsbCA6IGZhbHNlXG4gIGNvbnNvbGUubG9nKGxvZylcbn1cblxuY2xpZW50Lm9uQ29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgbm9pZGUuY29ubmVjdGVkID0gdHJ1ZVxuICBjbGllbnQucmVxdWVzdCgnL3dhdGNoZWQnLCBmdW5jdGlvbiAoZXJyLCBwYXlsb2FkKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgcmV0dXJuIGhhbmRsZUVycm9yKGVycilcbiAgICB9XG5cbiAgICB2YXIgd2F0Y2hlZCA9IHBheWxvYWQud2F0Y2hlZFxuICAgIHZhciBmaWxlcyA9IG5vaWRlLmZpbGVzXG4gICAgZmlsZXMuc3BsaWNlLmFwcGx5KGZpbGVzLCBbMCwgZmlsZXMubGVuZ3RoXS5jb25jYXQobmV3IEZzb3Mod2F0Y2hlZCkpKVxuXG4gICAgaWYgKCFzdGF0ZUxvYWRlZCkge1xuICAgICAgbG9hZFN0YXRlKClcbiAgICAgIHN0YXRlTG9hZGVkID0gdHJ1ZVxuXG4gICAgICBub2lkZS5jbGllbnQuc3Vic2NyaWJlKCcvY2hhbmdlJywgZnVuY3Rpb24gKHBheWxvYWQpIHtcbiAgICAgICAgc2Vzc2lvbnMuaXRlbXMuZm9yRWFjaChmdW5jdGlvbiAoc2Vzc2lvbikge1xuICAgICAgICAgIHZhciBmaWxlID0gc2Vzc2lvbi5maWxlXG4gICAgICAgICAgaWYgKHBheWxvYWQucGF0aCA9PT0gZmlsZS5wYXRoKSB7XG4gICAgICAgICAgICBpZiAocGF5bG9hZC5zdGF0Lm10aW1lICE9PSBmaWxlLnN0YXQubXRpbWUpIHtcbiAgICAgICAgICAgICAgcmVhZEZpbGUoZmlsZS5wYXRoLCBmdW5jdGlvbiAoZXJyLCBwYXlsb2FkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGhhbmRsZUVycm9yKGVycilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmlsZS5zdGF0ID0gcGF5bG9hZC5zdGF0XG4gICAgICAgICAgICAgICAgc2Vzc2lvbi5lZGl0U2Vzc2lvbi5zZXRWYWx1ZShwYXlsb2FkLmNvbnRlbnRzKVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJldHVybiBoYW5kbGVFcnJvcihlcnIpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAvL1xuICAgICAgLy8gY2xpZW50LnN1YnNjcmliZSgnL3VubGluaycsIGZ1bmN0aW9uIChwYXlsb2FkKSB7XG4gICAgICAvLyAgIHZhciBkYXRhID0gcGF5bG9hZFxuICAgICAgLy8gICBpZiAoZGF0YS5wYXRoID09PSBzdGF0ZS5wYXRoKSB7XG4gICAgICAvLyAgICAgaWYgKHdpbmRvdy5jb25maXJtKCdGaWxlIGhhcyBiZWVuIHJlbW92ZWQgLSBjbG9zZSB0aGlzIHRhYj8nKSkge1xuICAgICAgLy8gICAgICAgd2luZG93LmNsb3NlKClcbiAgICAgIC8vICAgICB9XG4gICAgICAvLyAgIH1cbiAgICAgIC8vIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIC8vICAgaWYgKGVycikge1xuICAgICAgLy8gICAgIHJldHVybiBoYW5kbGVFcnJvcihlcnIpXG4gICAgICAvLyAgIH1cbiAgICAgIC8vIH0pXG4gICAgICAvL1xuXG4gICAgICBwYWdlKHtcbiAgICAgICAgaGFzaGJhbmc6IHRydWVcbiAgICAgIH0pXG4gICAgfVxuICB9KVxufVxuXG5mdW5jdGlvbiBoYW5kbGVFcnJvciAoZXJyKSB7XG4gIGNvbnNvbGUuZXJyb3IoZXJyKVxufVxuXG5mdW5jdGlvbiBzYXZlU3RhdGUgKCkge1xuICB2YXIgc3RhdGUgPSBub2lkZS5zdGF0ZVxuICB2YXIgc3RvcmFnZSA9IHtcbiAgICBjdXJyZW50OiBzdGF0ZS5jdXJyZW50ID8gc3RhdGUuY3VycmVudC5wYXRoIDogbnVsbCxcbiAgICByZWNlbnQ6IHN0YXRlLnJlY2VudC5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHJldHVybiBpdGVtLnBhdGhcbiAgICB9KSxcbiAgICBleHBhbmRlZDogZmlsZXMuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5leHBhbmRlZFxuICAgIH0pLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0ucGF0aFxuICAgIH0pXG4gIH1cbiAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKHN0b3JhZ2VLZXksIEpTT04uc3RyaW5naWZ5KHN0b3JhZ2UpKVxufVxuXG5mdW5jdGlvbiBsb2FkU3RhdGUgKCkge1xuICB2YXIgc3RvcmFnZSA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShzdG9yYWdlS2V5KVxuICBzdG9yYWdlID0gc3RvcmFnZSA/IEpTT04ucGFyc2Uoc3RvcmFnZSkgOiB7fVxuXG4gIHZhciBkaXIsIGZpbGUsIGksIGN1cnJlbnRcbiAgdmFyIHJlY2VudCA9IFtdXG5cbiAgaWYgKHN0b3JhZ2UucmVjZW50KSB7XG4gICAgZm9yIChpID0gMDsgaSA8IHN0b3JhZ2UucmVjZW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBmaWxlID0gZmlsZXMuZmluZEJ5UGF0aChzdG9yYWdlLnJlY2VudFtpXSlcbiAgICAgIGlmIChmaWxlKSB7XG4gICAgICAgIHJlY2VudC5wdXNoKGZpbGUpXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChyZWNlbnQubGVuZ3RoKSB7XG4gICAgICBzdGF0ZS5yZWNlbnQuc3BsaWNlLmFwcGx5KHN0YXRlLnJlY2VudCwgWzAsIDBdLmNvbmNhdChyZWNlbnQpKVxuICAgIH1cbiAgfVxuXG4gIGlmIChzdG9yYWdlLmN1cnJlbnQpIHtcbiAgICBmaWxlID0gZmlsZXMuZmluZEJ5UGF0aChzdG9yYWdlLmN1cnJlbnQpXG4gICAgaWYgKGZpbGUpIHtcbiAgICAgIGN1cnJlbnQgPSBmaWxlXG4gICAgfVxuICB9XG5cbiAgaWYgKHN0b3JhZ2UuZXhwYW5kZWQpIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgc3RvcmFnZS5leHBhbmRlZC5sZW5ndGg7IGkrKykge1xuICAgICAgZGlyID0gZmlsZXMuZmluZEJ5UGF0aChzdG9yYWdlLmV4cGFuZGVkW2ldKVxuICAgICAgaWYgKGRpcikge1xuICAgICAgICBkaXIuZXhwYW5kZWQgPSB0cnVlXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGN1cnJlbnQpIHtcbiAgICBvcGVuRmlsZShjdXJyZW50KVxuICB9XG59XG5cbmZ1bmN0aW9uIHJlYWRGaWxlIChwYXRoLCBjYWxsYmFjaykge1xuICBjbGllbnQucmVxdWVzdCh7XG4gICAgcGF0aDogJy9yZWFkZmlsZScsXG4gICAgcGF5bG9hZDoge1xuICAgICAgcGF0aDogcGF0aFxuICAgIH0sXG4gICAgbWV0aG9kOiAnUE9TVCdcbiAgfSwgY2FsbGJhY2spXG59XG5cbmZ1bmN0aW9uIG9wZW5GaWxlIChmaWxlKSB7XG4gIHZhciBzZXNzaW9uID0gc2Vzc2lvbnMuZmluZChmaWxlKVxuICBpZiAoc2Vzc2lvbikge1xuICAgIHN0YXRlLmN1cnJlbnQgPSBmaWxlXG4gICAgZWRpdG9yLnNldFNlc3Npb24oc2Vzc2lvbi5lZGl0U2Vzc2lvbilcbiAgfSBlbHNlIHtcbiAgICByZWFkRmlsZShmaWxlLnBhdGgsIGZ1bmN0aW9uIChlcnIsIHBheWxvYWQpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIGhhbmRsZUVycm9yKGVycilcbiAgICAgIH1cblxuICAgICAgaWYgKCFzdGF0ZS5yZWNlbnQuZmluZEJ5UGF0aChmaWxlLnBhdGgpKSB7XG4gICAgICAgIHN0YXRlLnJlY2VudC51bnNoaWZ0KGZpbGUpXG4gICAgICB9XG5cbiAgICAgIHNlc3Npb24gPSBzZXNzaW9ucy5hZGQoZmlsZSwgcGF5bG9hZC5jb250ZW50cylcbiAgICAgIHN0YXRlLmN1cnJlbnQgPSBmaWxlXG4gICAgICBlZGl0b3Iuc2V0U2Vzc2lvbihzZXNzaW9uLmVkaXRTZXNzaW9uKVxuICAgIH0pXG4gIH1cbn1cblxuZnVuY3Rpb24gY2xvc2VGaWxlIChmaWxlKSB7XG4gIHZhciBjbG9zZSA9IGZhbHNlXG4gIHZhciBzZXNzaW9uID0gc2Vzc2lvbnMuZmluZChmaWxlKVxuXG4gIGlmIChzZXNzaW9uICYmIHNlc3Npb24uaXNEaXJ0eSkge1xuICAgIGlmICh3aW5kb3cuY29uZmlybSgnVGhlcmUgYXJlIHVuc2F2ZWQgY2hhbmdlcyB0byB0aGlzIGZpbGUuIEFyZSB5b3Ugc3VyZT8nKSkge1xuICAgICAgY2xvc2UgPSB0cnVlXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNsb3NlID0gdHJ1ZVxuICB9XG5cbiAgaWYgKGNsb3NlKSB7XG4gICAgLy8gUmVtb3ZlIGZyb20gcmVjZW50IGZpbGVzXG4gICAgc3RhdGUucmVjZW50LnNwbGljZShzdGF0ZS5yZWNlbnQuaW5kZXhPZihmaWxlKSwgMSlcblxuICAgIGlmIChzZXNzaW9uKSB7XG4gICAgICAvLyBSZW1vdmUgc2Vzc2lvblxuICAgICAgc2Vzc2lvbnMuaXRlbXMuc3BsaWNlKHNlc3Npb25zLml0ZW1zLmluZGV4T2Yoc2Vzc2lvbiksIDEpXG5cbiAgICAgIGlmIChzdGF0ZS5jdXJyZW50ID09PSBmaWxlKSB7XG4gICAgICAgIGlmIChzZXNzaW9ucy5pdGVtcy5sZW5ndGgpIHtcbiAgICAgICAgICAvLyBPcGVuIHRoZSBuZXh0IHNlc3Npb25cbiAgICAgICAgICBvcGVuRmlsZShzZXNzaW9ucy5pdGVtc1swXS5maWxlKVxuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlLnJlY2VudC5sZW5ndGgpIHtcbiAgICAgICAgICAvLyBPcGVuIHRoZSBuZXh0IGZpbGVcbiAgICAgICAgICBvcGVuRmlsZShzdGF0ZS5yZWNlbnRbMF0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RhdGUuY3VycmVudCA9IG51bGxcbiAgICAgICAgICBlZGl0b3Iuc2V0U2Vzc2lvbihudWxsKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHdyaXRlRmlsZSAocGF0aCwgY29udGVudHMsIGNhbGxiYWNrKSB7XG4gIGNsaWVudC5yZXF1ZXN0KHtcbiAgICBwYXRoOiAnL3dyaXRlZmlsZScsXG4gICAgcGF5bG9hZDoge1xuICAgICAgcGF0aDogcGF0aCxcbiAgICAgIGNvbnRlbnRzOiBjb250ZW50c1xuICAgIH0sXG4gICAgbWV0aG9kOiAnUFVUJ1xuICB9LCBjYWxsYmFjaylcbn1cblxuZnVuY3Rpb24gc2F2ZUFsbCAoKSB7XG4gIHNlc3Npb25zLmRpcnR5LmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICB2YXIgZmlsZSA9IGl0ZW0uZmlsZVxuICAgIHZhciBlZGl0U2Vzc2lvbiA9IGl0ZW0uZWRpdFNlc3Npb25cbiAgICB3cml0ZUZpbGUoZmlsZS5wYXRoLCBlZGl0U2Vzc2lvbi5nZXRWYWx1ZSgpLCBmdW5jdGlvbiAoZXJyLCBwYXlsb2FkKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBoYW5kbGVFcnJvcihlcnIpXG4gICAgICB9XG4gICAgICBmaWxlLnN0YXQgPSBwYXlsb2FkLnN0YXRcbiAgICAgIGVkaXRTZXNzaW9uLmdldFVuZG9NYW5hZ2VyKCkubWFya0NsZWFuKClcbiAgICB9KVxuICB9KVxufVxuXG5mdW5jdGlvbiBydW4gKGNvbW1hbmQsIG5hbWUsIGNhbGxiYWNrKSB7XG4gIGlmICh0eXBlb2YgbmFtZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNhbGxiYWNrID0gbmFtZVxuICAgIG5hbWUgPSBjb21tYW5kXG4gIH1cbiAgaWYgKCFuYW1lKSB7XG4gICAgbmFtZSA9IGNvbW1hbmRcbiAgfVxuXG4gIGNsaWVudC5yZXF1ZXN0KHtcbiAgICBwYXRoOiAnL2lvJyxcbiAgICBwYXlsb2FkOiB7XG4gICAgICBuYW1lOiBuYW1lLFxuICAgICAgY29tbWFuZDogY29tbWFuZFxuICAgIH0sXG4gICAgbWV0aG9kOiAnUE9TVCdcbiAgfSwgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGhhbmRsZUVycm9yKGVycilcbiAgICB9XG4gICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soZXJyLCBwYXlsb2FkKVxuICB9KVxufVxuXG52YXIgc2NoZW1hID0ge1xuICBjb25uZWN0ZWQ6IHByb3AoQm9vbGVhbikudmFsdWUoZmFsc2UpLFxuICBnZXQgZmlsZXMgKCkgeyByZXR1cm4gZmlsZXMgfSxcbiAgZ2V0IHN0YXRlICgpIHsgcmV0dXJuIHN0YXRlIH0sXG4gIGdldCBjbGllbnQgKCkgeyByZXR1cm4gY2xpZW50IH0sXG4gIGdldCBlZGl0b3IgKCkgeyByZXR1cm4gZWRpdG9yIH0sXG4gIGdldCBzZXNzaW9ucyAoKSB7IHJldHVybiBzZXNzaW9ucyB9LFxuICBydW46IHJ1bixcbiAgb3BlbkZpbGU6IG9wZW5GaWxlLFxuICBjbG9zZUZpbGU6IGNsb3NlRmlsZSxcbiAgcmVhZEZpbGU6IHJlYWRGaWxlLFxuICB3cml0ZUZpbGU6IHdyaXRlRmlsZSxcbiAgaGFuZGxlRXJyb3I6IGhhbmRsZUVycm9yXG59XG5cbnZhciBOb2lkZSA9IHN1cGVybW9kZWxzKHNjaGVtYSlcbnZhciBub2lkZSA9IG5ldyBOb2lkZSgpXG5cbnN0YXRlLm9uKCdjaGFuZ2UnLCBzYXZlU3RhdGUpXG5cbmVkaXRvci5hZGRDb21tYW5kcyhbe1xuICBuYW1lOiAnc2F2ZScsXG4gIGJpbmRLZXk6IHtcbiAgICB3aW46ICdDdHJsLVMnLFxuICAgIG1hYzogJ0NvbW1hbmQtUydcbiAgfSxcbiAgZXhlYzogZnVuY3Rpb24gKGVkaXRvcikge1xuICAgIHZhciBmaWxlID0gc3RhdGUuY3VycmVudFxuICAgIHZhciBlZGl0U2Vzc2lvbiA9IHNlc3Npb25zLmZpbmQoZmlsZSkuZWRpdFNlc3Npb25cbiAgICB3cml0ZUZpbGUoZmlsZS5wYXRoLCBlZGl0U2Vzc2lvbi5nZXRWYWx1ZSgpLCBmdW5jdGlvbiAoZXJyLCBwYXlsb2FkKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBoYW5kbGVFcnJvcihlcnIpXG4gICAgICB9XG4gICAgICBmaWxlLnN0YXQgPSBwYXlsb2FkLnN0YXRcbiAgICAgIGVkaXRTZXNzaW9uLmdldFVuZG9NYW5hZ2VyKCkubWFya0NsZWFuKClcbiAgICB9KVxuICB9LFxuICByZWFkT25seTogZmFsc2Vcbn0sIHtcbiAgbmFtZTogJ3NhdmVhbGwnLFxuICBiaW5kS2V5OiB7XG4gICAgd2luOiAnQ3RybC1TaGlmdC1TJyxcbiAgICBtYWM6ICdDb21tYW5kLU9wdGlvbi1TJ1xuICB9LFxuICBleGVjOiBmdW5jdGlvbiAoZWRpdG9yKSB7XG4gICAgc2F2ZUFsbCgpXG4gIH0sXG4gIHJlYWRPbmx5OiBmYWxzZVxufV0pXG5cbnZhciBsaW50ZXIgPSByZXF1aXJlKCcuL3N0YW5kYXJkJylcbmxpbnRlcihub2lkZSlcblxud2luZG93Lm5vaWRlID0gbm9pZGVcbm1vZHVsZS5leHBvcnRzID0gbm9pZGVcbiIsInZhciBub2lkZSA9IHJlcXVpcmUoJy4vbm9pZGUnKVxudmFyIFByb2Nlc3NlcyA9IHJlcXVpcmUoJy4vcHJvY2Vzc2VzL2luZGV4JylcbnZhciBwcm9jZXNzZXNFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcm9jZXNzZXMnKVxudmFyIHByb2Nlc3NlcyA9IG5ldyBQcm9jZXNzZXMocHJvY2Vzc2VzRWwsIG5vaWRlKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHByb2Nlc3Nlc1xuIiwidmFyIEluY3JlbWVudGFsRE9NID0gcmVxdWlyZSgnaW5jcmVtZW50YWwtZG9tJylcbnZhciBwYXRjaCA9IEluY3JlbWVudGFsRE9NLnBhdGNoXG52YXIgZWxlbWVudE9wZW4gPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50T3BlblxudmFyIGVsZW1lbnRWb2lkID0gSW5jcmVtZW50YWxET00uZWxlbWVudFZvaWRcbnZhciBlbGVtZW50Q2xvc2UgPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50Q2xvc2VcbnZhciBlbGVtZW50UGxhY2Vob2xkZXIgPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50UGxhY2Vob2xkZXJcbnZhciB0ZXh0ID0gSW5jcmVtZW50YWxET00udGV4dFxuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XG52YXIgaG9pc3RlZDEgPSBbXCJjbGFzc1wiLCBcImNvbnRyb2xcIl1cbnZhciBob2lzdGVkMiA9IFtcImNsYXNzXCIsIFwiaW5wdXQtZ3JvdXBcIl1cbnZhciBob2lzdGVkMyA9IFtcImNsYXNzXCIsIFwiaW5wdXQtZ3JvdXAtYnRuIGRyb3B1cFwiXVxudmFyIGhvaXN0ZWQ0ID0gW1widHlwZVwiLCBcImJ1dHRvblwiLCBcImNsYXNzXCIsIFwiYnRuIGJ0bi1kZWZhdWx0IGJ0bi1zbSBkcm9wZG93bi10b2dnbGVcIiwgXCJkYXRhLXRvZ2dsZVwiLCBcImRyb3Bkb3duXCJdXG52YXIgaG9pc3RlZDUgPSBbXCJjbGFzc1wiLCBcImNhcmV0XCJdXG52YXIgaG9pc3RlZDYgPSBbXCJjbGFzc1wiLCBcImRyb3Bkb3duLW1lbnVcIl1cbnZhciBob2lzdGVkNyA9IFtcImhyZWZcIiwgXCIjXCJdXG52YXIgaG9pc3RlZDggPSBbXCJ0eXBlXCIsIFwidGV4dFwiLCBcImNsYXNzXCIsIFwiZm9ybS1jb250cm9sIGlucHV0LXNtXCIsIFwibmFtZVwiLCBcImNvbW1hbmRcIiwgXCJpZFwiLCBcImNvbW1hbmRcIiwgXCJyZXF1aXJlZFwiLCBcIlwiLCBcImF1dG9jb21wbGV0ZVwiLCBcIm9mZlwiXVxudmFyIGhvaXN0ZWQ5ID0gW1wiY2xhc3NcIiwgXCJpbnB1dC1ncm91cC1idG5cIl1cbnZhciBob2lzdGVkMTAgPSBbXCJjbGFzc1wiLCBcImJ0biBidG4tZGVmYXVsdCBidG4tc21cIiwgXCJ0eXBlXCIsIFwic3VibWl0XCJdXG52YXIgaG9pc3RlZDExID0gW1wiaGlkZGVuXCIsIFwidHJ1ZVwiLCBcImNsYXNzXCIsIFwibmF2IG5hdi10YWJzXCJdXG52YXIgaG9pc3RlZDEyID0gW1wicm9sZVwiLCBcInByZXNlbnRhdGlvblwiLCBcImNsYXNzXCIsIFwiYWN0aXZlXCJdXG52YXIgaG9pc3RlZDEzID0gW1wiaHJlZlwiLCBcIiNcIl1cbnZhciBob2lzdGVkMTQgPSBbXCJyb2xlXCIsIFwicHJlc2VudGF0aW9uXCJdXG52YXIgaG9pc3RlZDE1ID0gW1wiaHJlZlwiLCBcIiNcIl1cbnZhciBob2lzdGVkMTYgPSBbXCJyb2xlXCIsIFwicHJlc2VudGF0aW9uXCJdXG52YXIgaG9pc3RlZDE3ID0gW1wiaHJlZlwiLCBcIiNcIl1cbnZhciBob2lzdGVkMTggPSBbXCJjbGFzc1wiLCBcInByb2Nlc3Nlc1wiXVxudmFyIGhvaXN0ZWQxOSA9IFtcImNsYXNzXCIsIFwibGlzdFwiXVxudmFyIGhvaXN0ZWQyMCA9IFtcImNsYXNzXCIsIFwibmF2IG5hdi10YWJzXCJdXG52YXIgaG9pc3RlZDIxID0gW1wiY2xhc3NcIiwgXCJidG4gYnRuLWRlZmF1bHRcIl1cbnZhciBob2lzdGVkMjIgPSBbXCJjbGFzc1wiLCBcImZhIGZhLXN0b3BcIl1cbnZhciBob2lzdGVkMjMgPSBbXCJjbGFzc1wiLCBcImJ0biBidG4tZGVmYXVsdFwiXVxudmFyIGhvaXN0ZWQyNCA9IFtcImNsYXNzXCIsIFwiZmEgZmEtcmVmcmVzaFwiXVxudmFyIGhvaXN0ZWQyNSA9IFtcImNsYXNzXCIsIFwiYnRuIGJ0bi1kZWZhdWx0XCJdXG52YXIgaG9pc3RlZDI2ID0gW1wiY2xhc3NcIiwgXCJmYSBmYS1jbG9zZVwiXVxudmFyIGhvaXN0ZWQyNyA9IFtcImlkXCIsIFwibGlzdC1vdXRwdXRcIiwgXCJjbGFzc1wiLCBcInNwbGl0dGVyXCJdXG52YXIgaG9pc3RlZDI4ID0gW1wiY2xhc3NcIiwgXCJvdXRwdXRcIl1cblxucmV0dXJuIGZ1bmN0aW9uIGRlc2NyaXB0aW9uIChtb2RlbCwgc2hvd091dHB1dCkge1xuICBlbGVtZW50T3BlbihcImRpdlwiLCBudWxsLCBob2lzdGVkMSlcbiAgICBlbGVtZW50T3BlbihcImZvcm1cIiwgbnVsbCwgbnVsbCwgXCJvbnN1Ym1pdFwiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgbW9kZWwucnVuKHRoaXMuY29tbWFuZC52YWx1ZSl9KVxuICAgICAgZWxlbWVudE9wZW4oXCJkaXZcIiwgbnVsbCwgaG9pc3RlZDIpXG4gICAgICAgIGVsZW1lbnRPcGVuKFwiZGl2XCIsIG51bGwsIGhvaXN0ZWQzKVxuICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYnV0dG9uXCIsIG51bGwsIGhvaXN0ZWQ0KVxuICAgICAgICAgICAgdGV4dChcIlRhc2sgXCIpXG4gICAgICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgaG9pc3RlZDUpXG4gICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJzcGFuXCIpXG4gICAgICAgICAgZWxlbWVudENsb3NlKFwiYnV0dG9uXCIpXG4gICAgICAgICAgZWxlbWVudE9wZW4oXCJ1bFwiLCBudWxsLCBob2lzdGVkNilcbiAgICAgICAgICAgIDsoQXJyYXkuaXNBcnJheShtb2RlbC50YXNrcykgPyBtb2RlbC50YXNrcyA6IE9iamVjdC5rZXlzKG1vZGVsLnRhc2tzKSkuZm9yRWFjaChmdW5jdGlvbih0YXNrLCAkaW5kZXgpIHtcbiAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJsaVwiLCB0YXNrLm5hbWUpXG4gICAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJhXCIsIG51bGwsIGhvaXN0ZWQ3LCBcIm9uY2xpY2tcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgICAgICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIG1vZGVsLmNvbW1hbmQgPSAnbnBtIHJ1biAnICsgdGFzay5uYW1lOyBqUXVlcnkoJyNjb21tYW5kJykuZm9jdXMoKX0pXG4gICAgICAgICAgICAgICAgICB0ZXh0KFwiXCIgKyAodGFzay5uYW1lKSArIFwiXCIpXG4gICAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwiYVwiKVxuICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJsaVwiKVxuICAgICAgICAgICAgfSwgbW9kZWwudGFza3MpXG4gICAgICAgICAgZWxlbWVudENsb3NlKFwidWxcIilcbiAgICAgICAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gICAgICAgIGVsZW1lbnRPcGVuKFwiaW5wdXRcIiwgbnVsbCwgaG9pc3RlZDgsIFwidmFsdWVcIiwgbW9kZWwuY29tbWFuZClcbiAgICAgICAgZWxlbWVudENsb3NlKFwiaW5wdXRcIilcbiAgICAgICAgZWxlbWVudE9wZW4oXCJzcGFuXCIsIG51bGwsIGhvaXN0ZWQ5KVxuICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYnV0dG9uXCIsIG51bGwsIGhvaXN0ZWQxMClcbiAgICAgICAgICAgIHRleHQoXCJSdW5cIilcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJidXR0b25cIilcbiAgICAgICAgZWxlbWVudENsb3NlKFwic3BhblwiKVxuICAgICAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG4gICAgZWxlbWVudENsb3NlKFwiZm9ybVwiKVxuICAgIGVsZW1lbnRPcGVuKFwidWxcIiwgbnVsbCwgaG9pc3RlZDExKVxuICAgICAgZWxlbWVudE9wZW4oXCJsaVwiLCBudWxsLCBob2lzdGVkMTIpXG4gICAgICAgIGVsZW1lbnRPcGVuKFwiYVwiLCBudWxsLCBob2lzdGVkMTMpXG4gICAgICAgICAgdGV4dChcIkhvbWVcIilcbiAgICAgICAgZWxlbWVudENsb3NlKFwiYVwiKVxuICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICAgIGVsZW1lbnRPcGVuKFwibGlcIiwgbnVsbCwgaG9pc3RlZDE0KVxuICAgICAgICBlbGVtZW50T3BlbihcImFcIiwgbnVsbCwgaG9pc3RlZDE1KVxuICAgICAgICAgIHRleHQoXCJQcm9maWxlXCIpXG4gICAgICAgIGVsZW1lbnRDbG9zZShcImFcIilcbiAgICAgIGVsZW1lbnRDbG9zZShcImxpXCIpXG4gICAgICBlbGVtZW50T3BlbihcImxpXCIsIG51bGwsIGhvaXN0ZWQxNilcbiAgICAgICAgZWxlbWVudE9wZW4oXCJhXCIsIG51bGwsIGhvaXN0ZWQxNylcbiAgICAgICAgICB0ZXh0KFwiTWVzc2FnZXNcIilcbiAgICAgICAgZWxlbWVudENsb3NlKFwiYVwiKVxuICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICBlbGVtZW50Q2xvc2UoXCJ1bFwiKVxuICBlbGVtZW50Q2xvc2UoXCJkaXZcIilcbiAgZWxlbWVudE9wZW4oXCJkaXZcIiwgbnVsbCwgaG9pc3RlZDE4KVxuICAgIGVsZW1lbnRPcGVuKFwiZGl2XCIsIG51bGwsIGhvaXN0ZWQxOSlcbiAgICAgIGlmIChtb2RlbC5wcm9jZXNzZXMubGVuZ3RoKSB7XG4gICAgICAgIGVsZW1lbnRPcGVuKFwidWxcIiwgbnVsbCwgaG9pc3RlZDIwKVxuICAgICAgICAgIDsoQXJyYXkuaXNBcnJheShtb2RlbC5wcm9jZXNzZXMpID8gbW9kZWwucHJvY2Vzc2VzIDogT2JqZWN0LmtleXMobW9kZWwucHJvY2Vzc2VzKSkuZm9yRWFjaChmdW5jdGlvbihwcm9jZXNzLCAkaW5kZXgpIHtcbiAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwibGlcIiwgcHJvY2Vzcy5waWQpXG4gICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYVwiLCBudWxsLCBudWxsLCBcImhyZWZcIiwgXCJodHRwOi8vd3d3Lmdvb2dsZS5jby51az9xPVwiICsgKHByb2Nlc3MucGlkKSArIFwiXCIpXG4gICAgICAgICAgICAgICAgdGV4dChcIltcIiArIChwcm9jZXNzLnBpZCkgKyBcIl1cIilcbiAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwiYVwiKVxuICAgICAgICAgICAgICBlbGVtZW50T3BlbihcImFcIiwgbnVsbCwgbnVsbCwgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICAgICAgICBzaG93T3V0cHV0KHByb2Nlc3MpfSlcbiAgICAgICAgICAgICAgICB0ZXh0KFwiXCIgKyAocHJvY2Vzcy5uYW1lIHx8IHByb2Nlc3MuY29tbWFuZCkgKyBcIlwiKVxuICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwic3BhblwiKVxuICAgICAgICAgICAgICAgICAgdGV4dChcIltcIiArIChwcm9jZXNzLnBpZCkgKyBcIl1cIilcbiAgICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJzcGFuXCIpXG4gICAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJzcGFuXCIsIG51bGwsIG51bGwsIFwiY2xhc3NcIiwgJ2NpcmNsZSAnICsgKCFwcm9jZXNzLmlzQWxpdmUgPyAnZGVhZCcgOiAocHJvY2Vzcy5pc0FjdGl2ZSA/ICdhbGl2ZSBhY3RpdmUnIDogJ2FsaXZlJykpKVxuICAgICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgICAgICAgICBpZiAocHJvY2Vzcy5pc0FsaXZlKSB7XG4gICAgICAgICAgICAgICAgICBlbGVtZW50T3BlbihcImJ1dHRvblwiLCBcImtpbGxcIiwgaG9pc3RlZDIxLCBcIm9uY2xpY2tcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgIG1vZGVsLmtpbGwocHJvY2Vzcyl9KVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50T3BlbihcImlcIiwgbnVsbCwgaG9pc3RlZDIyKVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJpXCIpXG4gICAgICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJidXR0b25cIilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFwcm9jZXNzLmlzQWxpdmUpIHtcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYnV0dG9uXCIsIFwicmVzdXJyZWN0XCIsIGhvaXN0ZWQyMywgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICBtb2RlbC5yZXN1cnJlY3QocHJvY2Vzcyl9KVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50T3BlbihcImlcIiwgbnVsbCwgaG9pc3RlZDI0KVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJpXCIpXG4gICAgICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJidXR0b25cIilcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYnV0dG9uXCIsIFwicmVtb3ZlXCIsIGhvaXN0ZWQyNSwgXCJvbmNsaWNrXCIsIGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICBtb2RlbC5yZW1vdmUocHJvY2Vzcyl9KVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50T3BlbihcImlcIiwgbnVsbCwgaG9pc3RlZDI2KVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJpXCIpXG4gICAgICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJidXR0b25cIilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImFcIilcbiAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcImxpXCIpXG4gICAgICAgICAgfSwgbW9kZWwucHJvY2Vzc2VzKVxuICAgICAgICBlbGVtZW50Q2xvc2UoXCJ1bFwiKVxuICAgICAgfVxuICAgIGVsZW1lbnRDbG9zZShcImRpdlwiKVxuICAgIGVsZW1lbnRQbGFjZWhvbGRlcihcInBsYWNlaG9sZGVyXCIsIFwibGlzdC1vdXRwdXRcIiwgaG9pc3RlZDI3KVxuICAgIGVsZW1lbnRQbGFjZWhvbGRlcihcInBsYWNlaG9sZGVyXCIsIFwib3V0cHV0XCIsIGhvaXN0ZWQyOClcbiAgZWxlbWVudENsb3NlKFwiZGl2XCIpXG59XG59KSgpO1xuIiwidmFyIHBhdGNoID0gcmVxdWlyZSgnaW5jcmVtZW50YWwtZG9tJykucGF0Y2hcbnZhciB2aWV3ID0gcmVxdWlyZSgnLi9pbmRleC5odG1sJylcbnZhciBNb2RlbCA9IHJlcXVpcmUoJy4vbW9kZWwnKVxudmFyIFRhc2sgPSByZXF1aXJlKCcuL3Rhc2snKVxudmFyIFByb2Nlc3MgPSByZXF1aXJlKCcuL3Byb2Nlc3MnKVxudmFyIHNwbGl0dGVyID0gcmVxdWlyZSgnLi4vc3BsaXR0ZXInKVxuXG5mdW5jdGlvbiBQcm9jZXNzZXMgKGVsLCBub2lkZSkge1xuICB2YXIgY2xpZW50ID0gbm9pZGUuY2xpZW50XG4gIHZhciBlZGl0b3JcblxuICBjbGllbnQuc3Vic2NyaWJlKCcvaW8nLCBmdW5jdGlvbiAocGF5bG9hZCkge1xuICAgIHZhciBwcm9jZXNzID0gbW9kZWwucHJvY2Vzc2VzLmZpbmQoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHJldHVybiBpdGVtLnBpZCA9PT0gcGF5bG9hZC5waWRcbiAgICB9KVxuXG4gICAgaWYgKHByb2Nlc3MpIHtcbiAgICAgIHZhciBzZXNzaW9uID0gcHJvY2Vzcy5zZXNzaW9uXG4gICAgICBzZXNzaW9uLmluc2VydCh7XG4gICAgICAgIHJvdzogc2Vzc2lvbi5nZXRMZW5ndGgoKSxcbiAgICAgICAgY29sdW1uOiAwXG4gICAgICB9LCBwYXlsb2FkLmRhdGEpXG4gICAgICBzZXNzaW9uLmdldFNlbGVjdGlvbigpLm1vdmVDdXJzb3JGaWxlRW5kKClcbiAgICAgIHByb2Nlc3MuaXNBY3RpdmUgPSB0cnVlXG4gICAgfVxuICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgcmV0dXJuIG5vaWRlLmhhbmRsZUVycm9yKGVycilcbiAgICB9XG4gIH0pXG5cbiAgZnVuY3Rpb24gc2hvd091dHB1dCAocHJvY2Vzcykge1xuICAgIGVkaXRvci5zZXRTZXNzaW9uKHByb2Nlc3Muc2Vzc2lvbilcbiAgfVxuXG4gIGNsaWVudC5zdWJzY3JpYmUoJy9pby9waWRzJywgbG9hZFBpZHMsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICByZXR1cm4gbm9pZGUuaGFuZGxlRXJyb3IoZXJyKVxuICAgIH1cbiAgfSlcblxuICBjbGllbnQucmVxdWVzdCh7XG4gICAgcGF0aDogJy9pby9waWRzJ1xuICB9LCBmdW5jdGlvbiAoZXJyLCBwYXlsb2FkKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgbm9pZGUuaGFuZGxlRXJyb3IoZXJyKVxuICAgIH1cbiAgICBsb2FkUGlkcyhwYXlsb2FkKVxuICB9KVxuXG4gIGZ1bmN0aW9uIGxvYWRQaWRzIChwcm9jcykge1xuICAgIGNvbnNvbGUubG9nKCdwcm9jcycsIHByb2NzKVxuICAgIHZhciBwcm9jXG4gICAgdmFyIGJvcm4gPSBbXVxuXG4gICAgLy8gZmluZCBhbnkgbmV3IHByb2Nlc3Nlc1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvY3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIHByb2MgPSBwcm9jc1tpXVxuXG4gICAgICB2YXIgcHJvY2VzcyA9IG1vZGVsLnByb2Nlc3Nlcy5maW5kKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIHJldHVybiBpdGVtLnBpZCA9PT0gcHJvYy5waWRcbiAgICAgIH0pXG5cbiAgICAgIGlmICghcHJvY2Vzcykge1xuICAgICAgICAvLyBuZXcgY2hpbGQgcHJvY2VzcyBmb3VuZC4gQWRkIGl0XG4gICAgICAgIC8vIGFuZCBzZXQgaXQncyBjYWNoZWQgYnVmZmVyIGludG8gc2Vzc2lvblxuICAgICAgICBwcm9jZXNzID0gbmV3IFByb2Nlc3MocHJvYylcbiAgICAgICAgcHJvY2Vzcy5zZXNzaW9uLnNldFZhbHVlKHByb2MuYnVmZmVyKVxuICAgICAgICBib3JuLnB1c2gocHJvY2VzcylcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBzaHV0IGRvd24gcHJvY2Vzc2VzIHRoYXQgaGF2ZSBkaWVkXG4gICAgbW9kZWwucHJvY2Vzc2VzLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHZhciBtYXRjaCA9IHByb2NzLmZpbmQoZnVuY3Rpb24gKGNoZWNrKSB7XG4gICAgICAgIHJldHVybiBpdGVtLnBpZCA9PT0gY2hlY2sucGlkXG4gICAgICB9KVxuICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICAvLyBpdGVtLnBpZCA9IDBcbiAgICAgICAgaXRlbS5pc0FsaXZlID0gZmFsc2VcbiAgICAgICAgaXRlbS5pc0FjdGl2ZSA9IGZhbHNlXG4gICAgICB9XG4gICAgfSlcblxuICAgIC8vIGluc2VydCBhbnkgbmV3IGNoaWxkIHByb2Nlc3Nlc1xuICAgIGlmIChib3JuLmxlbmd0aCkge1xuICAgICAgbW9kZWwucHJvY2Vzc2VzLnNwbGljZS5hcHBseShtb2RlbC5wcm9jZXNzZXMsIFswLCAwXS5jb25jYXQoYm9ybikpXG4gICAgICBzaG93T3V0cHV0KGJvcm5bMF0pXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFRhc2tzICgpIHtcbiAgICBub2lkZS5yZWFkRmlsZSgncGFja2FnZS5qc29uJywgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBub2lkZS5oYW5kbGVFcnJvcihlcnIpXG4gICAgICB9XG5cbiAgICAgIHZhciBwa2cgPSB7fVxuICAgICAgdHJ5IHtcbiAgICAgICAgcGtnID0gSlNPTi5wYXJzZShwYXlsb2FkLmNvbnRlbnRzKVxuICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgY29uc29sZS5sb2cocGtnKVxuICAgICAgaWYgKHBrZy5zY3JpcHRzKSB7XG4gICAgICAgIHZhciB0YXNrcyA9IFtdXG4gICAgICAgIGZvciAodmFyIHNjcmlwdCBpbiBwa2cuc2NyaXB0cykge1xuICAgICAgICAgIGlmIChzY3JpcHQuc3Vic3RyKDAsIDMpID09PSAncHJlJyB8fCBzY3JpcHQuc3Vic3RyKDAsIDQpID09PSAncG9zdCcpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGFza3MucHVzaChuZXcgVGFzayh7XG4gICAgICAgICAgICBuYW1lOiBzY3JpcHQsXG4gICAgICAgICAgICBjb21tYW5kOiBwa2cuc2NyaXB0c1tzY3JpcHRdXG4gICAgICAgICAgfSkpXG4gICAgICAgIH1cbiAgICAgICAgbW9kZWwudGFza3MgPSB0YXNrc1xuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICByZWFkVGFza3MoKVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZSAobW9kZWwpIHtcbiAgICB2aWV3KG1vZGVsLCBzaG93T3V0cHV0KVxuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyICgpIHtcbiAgICBwYXRjaChlbCwgdXBkYXRlLCBtb2RlbClcblxuICAgIGlmICghZWRpdG9yKSB7XG4gICAgICB2YXIgb3V0cHV0RWwgPSBlbC5xdWVyeVNlbGVjdG9yKCcub3V0cHV0JylcbiAgICAgIGVkaXRvciA9IHdpbmRvdy5hY2UuZWRpdChvdXRwdXRFbClcblxuICAgICAgZWRpdG9yLnNldFRoZW1lKCdhY2UvdGhlbWUvdGVybWluYWwnKVxuICAgICAgZWRpdG9yLnNldFJlYWRPbmx5KHRydWUpXG4gICAgICBlZGl0b3IucmVuZGVyZXIuc2V0U2hvd0d1dHRlcihmYWxzZSlcbiAgICAgIGVkaXRvci5zZXRTaG93UHJpbnRNYXJnaW4oZmFsc2UpXG4gICAgICBzcGxpdHRlcihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGlzdC1vdXRwdXQnKSlcbiAgICB9XG4gIH1cblxuICB2YXIgbW9kZWwgPSBuZXcgTW9kZWwoKVxuXG4gIG1vZGVsLm9uKCdjaGFuZ2UnLCByZW5kZXIpXG5cbiAgdGhpcy5tb2RlbCA9IG1vZGVsXG4gIHRoaXMucmVuZGVyID0gcmVuZGVyXG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgIGVkaXRvcjoge1xuICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBlZGl0b3JcbiAgICAgIH1cbiAgICB9XG4gIH0pXG59XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvY2Vzc2VzXG4iLCJ2YXIgc3VwZXJtb2RlbHMgPSByZXF1aXJlKCdzdXBlcm1vZGVscy5qcycpXG52YXIgbm9pZGUgPSByZXF1aXJlKCcuLi9ub2lkZScpXG52YXIgVGFzayA9IHJlcXVpcmUoJy4vdGFzaycpXG52YXIgUHJvY2VzcyA9IHJlcXVpcmUoJy4vcHJvY2VzcycpXG5cbnZhciBzY2hlbWEgPSB7XG4gIHRhc2tzOiBbVGFza10sXG4gIGNvbW1hbmQ6IFN0cmluZyxcbiAgcHJvY2Vzc2VzOiBbUHJvY2Vzc10sXG4gIGdldCBkZWFkICgpIHtcbiAgICByZXR1cm4gdGhpcy5wcm9jZXNzZXMuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gIWl0ZW0uaXNBbGl2ZVxuICAgIH0pXG4gIH0sXG4gIHJ1bjogZnVuY3Rpb24gKGNvbW1hbmQsIG5hbWUpIHtcbiAgICBub2lkZS5ydW4oY29tbWFuZCwgbmFtZSwgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gbm9pZGUuaGFuZGxlRXJyb3IoZXJyKVxuICAgICAgfVxuICAgIH0pXG4gIH0sXG4gIHJlbW92ZTogZnVuY3Rpb24gKHByb2Nlc3MpIHtcbiAgICB2YXIgcHJvY2Vzc2VzID0gdGhpcy5wcm9jZXNzZXNcbiAgICBwcm9jZXNzZXMuc3BsaWNlKHByb2Nlc3Nlcy5pbmRleE9mKHByb2Nlc3MpLCAxKVxuICB9LFxuICByZW1vdmVBbGxEZWFkOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGRlYWQgPSB0aGlzLmRlYWRcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlYWQubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMucmVtb3ZlKGRlYWRbaV0pXG4gICAgfVxuICB9LFxuICByZXN1cnJlY3Q6IGZ1bmN0aW9uIChwcm9jZXNzKSB7XG4gICAgdGhpcy5yZW1vdmUocHJvY2VzcylcbiAgICB0aGlzLnJ1bihwcm9jZXNzLmNvbW1hbmQsIHByb2Nlc3MubmFtZSlcbiAgfSxcbiAga2lsbDogZnVuY3Rpb24gKHByb2Nlc3MpIHtcbiAgICBub2lkZS5jbGllbnQucmVxdWVzdCh7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIHBhdGg6ICcvaW8va2lsbCcsXG4gICAgICBwYXlsb2FkOiB7XG4gICAgICAgIHBpZDogcHJvY2Vzcy5waWRcbiAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiAoZXJyLCBwYXlsb2FkKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIG5vaWRlLmhhbmRsZUVycm9yKGVycilcbiAgICAgIH1cbiAgICB9KVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc3VwZXJtb2RlbHMoc2NoZW1hKVxuIiwidmFyIHN1cGVybW9kZWxzID0gcmVxdWlyZSgnc3VwZXJtb2RlbHMuanMnKVxudmFyIHByb3AgPSByZXF1aXJlKCcuLi9wcm9wJylcbnZhciBFZGl0U2Vzc2lvbiA9IHdpbmRvdy5hY2UucmVxdWlyZSgnYWNlL2VkaXRfc2Vzc2lvbicpLkVkaXRTZXNzaW9uXG5cbmZ1bmN0aW9uIGNyZWF0ZVNlc3Npb24gKCkge1xuICB2YXIgZWRpdFNlc3Npb24gPSBuZXcgRWRpdFNlc3Npb24oJycsICdhY2UvbW9kZS9zaCcpXG4gIGVkaXRTZXNzaW9uLnNldFVzZVdvcmtlcihmYWxzZSlcbiAgcmV0dXJuIGVkaXRTZXNzaW9uXG59XG52YXIgc2NoZW1hID0ge1xuICBwaWQ6IHByb3AoTnVtYmVyKSxcbiAgbmFtZTogcHJvcChTdHJpbmcpLnJlcXVpcmVkKCksXG4gIGNvbW1hbmQ6IHByb3AoU3RyaW5nKS5yZXF1aXJlZCgpLFxuICBpc0FsaXZlOiBwcm9wKEJvb2xlYW4pLnJlcXVpcmVkKCkudmFsdWUodHJ1ZSksXG4gIHNlc3Npb246IHByb3AoT2JqZWN0KS52YWx1ZShjcmVhdGVTZXNzaW9uKSxcbiAgZ2V0IGlzQWN0aXZlICgpIHtcbiAgICByZXR1cm4gISF0aGlzLl9pc0FjdGl2ZVxuICB9LFxuICBzZXQgaXNBY3RpdmUgKHZhbHVlKSB7XG4gICAgaWYgKHRoaXMuX2lzQWN0aXZlICE9PSB2YWx1ZSkge1xuICAgICAgdmFyIHRpbWVvdXQgPSB0aGlzLl90aW1lb3V0XG4gICAgICBpZiAodGltZW91dCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dClcbiAgICAgIH1cblxuICAgICAgdmFyIG9sZFZhbHVlID0gdGhpcy5faXNBY3RpdmVcbiAgICAgIHRoaXMuX2lzQWN0aXZlID0gdmFsdWVcbiAgICAgIGNvbnNvbGUubG9nKCdpc0FjdGl2ZScsIHZhbHVlLCBvbGRWYWx1ZSlcbiAgICAgIHRoaXMuX19ub3RpZnlDaGFuZ2UoJ2lzQWN0aXZlJywgdmFsdWUsIG9sZFZhbHVlKVxuICAgICAgaWYgKHRoaXMuX2lzQWN0aXZlKSB7XG4gICAgICAgIHRoaXMuX3RpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygndG9tZW91dCcpXG4gICAgICAgICAgdGhpcy5pc0FjdGl2ZSA9IGZhbHNlXG4gICAgICAgIH0uYmluZCh0aGlzKSwgMTUwMClcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdXBlcm1vZGVscyhzY2hlbWEpXG4iLCJ2YXIgc3VwZXJtb2RlbHMgPSByZXF1aXJlKCdzdXBlcm1vZGVscy5qcycpXG52YXIgcHJvcCA9IHJlcXVpcmUoJy4uL3Byb3AnKVxuXG52YXIgc2NoZW1hID0ge1xuICBuYW1lOiBwcm9wKFN0cmluZykucmVxdWlyZWQoKSxcbiAgY29tbWFuZDogcHJvcChTdHJpbmcpLnJlcXVpcmVkKClcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdXBlcm1vZGVscyhzY2hlbWEpXG4iLCJ2YXIgc3VwZXJtb2RlbHMgPSByZXF1aXJlKCdzdXBlcm1vZGVscy5qcycpXG52YXIgdmFsaWRhdG9ycyA9IHJlcXVpcmUoJy4vdmFsaWRhdG9ycycpXG52YXIgcHJvcCA9IHN1cGVybW9kZWxzLnByb3AoKVxuXG4vLyBSZWdpc3RlcmluZyB2YWxpZGF0b3JzIG1ha2VzIHRoZW0gcGFydFxuLy8gb2YgdGhlIGZsdWVudCBpbnRlcmZhY2Ugd2hlbiB1c2luZyBgcHJvcGAuXG5wcm9wLnJlZ2lzdGVyKCdyZXF1aXJlZCcsIHZhbGlkYXRvcnMucmVxdWlyZWQpXG5cbm1vZHVsZS5leHBvcnRzID0gcHJvcFxuIiwidmFyIEluY3JlbWVudGFsRE9NID0gcmVxdWlyZSgnaW5jcmVtZW50YWwtZG9tJylcbnZhciBwYXRjaCA9IEluY3JlbWVudGFsRE9NLnBhdGNoXG52YXIgZWxlbWVudE9wZW4gPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50T3BlblxudmFyIGVsZW1lbnRWb2lkID0gSW5jcmVtZW50YWxET00uZWxlbWVudFZvaWRcbnZhciBlbGVtZW50Q2xvc2UgPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50Q2xvc2VcbnZhciBlbGVtZW50UGxhY2Vob2xkZXIgPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50UGxhY2Vob2xkZXJcbnZhciB0ZXh0ID0gSW5jcmVtZW50YWxET00udGV4dFxuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XG52YXIgaG9pc3RlZDEgPSBbXCJjbGFzc1wiLCBcImxpc3QtZ3JvdXBcIl1cbnZhciBob2lzdGVkMiA9IFtcImRhdGEtdG9nZ2xlXCIsIFwidG9vbHRpcFwiLCBcImRhdGEtcGxhY2VtZW50XCIsIFwibGVmdFwiXVxudmFyIGhvaXN0ZWQzID0gW1wiY2xhc3NcIiwgXCJjbG9zZVwiXVxudmFyIGhvaXN0ZWQ0ID0gW1wiY2xhc3NcIiwgXCJuYW1lIGljb24gaWNvbi1maWxlLXRleHRcIl1cbnZhciBob2lzdGVkNSA9IFtcImNsYXNzXCIsIFwibGlzdC1ncm91cC1pdGVtLXRleHRcIl1cblxucmV0dXJuIGZ1bmN0aW9uIHJlY2VudCAoZmlsZXMsIGN1cnJlbnQsIG9uQ2xpY2ssIG9uQ2xpY2tDbG9zZSkge1xuICBlbGVtZW50T3BlbihcImRpdlwiLCBudWxsLCBob2lzdGVkMSwgXCJzdHlsZVwiLCB7ZGlzcGxheTogZmlsZXMubGVuZ3RoID8gJycgOiAnbm9uZSd9KVxuICAgIDsoQXJyYXkuaXNBcnJheShmaWxlcykgPyBmaWxlcyA6IE9iamVjdC5rZXlzKGZpbGVzKSkuZm9yRWFjaChmdW5jdGlvbihmaWxlLCAkaW5kZXgpIHtcbiAgICAgIGVsZW1lbnRPcGVuKFwiYVwiLCBmaWxlLnJlbGF0aXZlUGF0aCwgaG9pc3RlZDIsIFwidGl0bGVcIiwgZmlsZS5yZWxhdGl2ZVBhdGgsIFwiaHJlZlwiLCAnL2ZpbGU/cGF0aD0nICsgZmlsZS5yZWxhdGl2ZVBhdGgsIFwiY2xhc3NcIiwgJ2xpc3QtZ3JvdXAtaXRlbSAnICsgKGZpbGUgPT09IGN1cnJlbnQgPyAnYWN0aXZlJyA6ICcnKSlcbiAgICAgICAgZWxlbWVudE9wZW4oXCJzcGFuXCIsIG51bGwsIGhvaXN0ZWQzLCBcIm9uY2xpY2tcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgICAgICRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgICAgIG9uQ2xpY2tDbG9zZShmaWxlKX0pXG4gICAgICAgICAgdGV4dChcIsOXXCIpXG4gICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgZWxlbWVudE9wZW4oXCJzcGFuXCIsIG51bGwsIGhvaXN0ZWQ0LCBcImRhdGEtbmFtZVwiLCBmaWxlLm5hbWUsIFwiZGF0YS1wYXRoXCIsIGZpbGUucmVsYXRpdmVQYXRoKVxuICAgICAgICAgIHRleHQoXCJcIiArIChmaWxlLm5hbWUpICsgXCJcIilcbiAgICAgICAgZWxlbWVudENsb3NlKFwic3BhblwiKVxuICAgICAgICBpZiAoZmFsc2UpIHtcbiAgICAgICAgICBlbGVtZW50T3BlbihcInBcIiwgbnVsbCwgaG9pc3RlZDUpXG4gICAgICAgICAgICB0ZXh0KFwiXCIgKyAoJy4vJyArIChmaWxlLnJlbGF0aXZlUGF0aCAhPT0gZmlsZS5uYW1lID8gZmlsZS5yZWxhdGl2ZURpciA6ICcnKSkgKyBcIlwiKVxuICAgICAgICAgIGVsZW1lbnRDbG9zZShcInBcIilcbiAgICAgICAgfVxuICAgICAgZWxlbWVudENsb3NlKFwiYVwiKVxuICAgIH0sIGZpbGVzKVxuICBlbGVtZW50Q2xvc2UoXCJkaXZcIilcbn1cbn0pKCk7XG4iLCJ2YXIgcGF0Y2ggPSByZXF1aXJlKCdpbmNyZW1lbnRhbC1kb20nKS5wYXRjaFxudmFyIHZpZXcgPSByZXF1aXJlKCcuL2luZGV4Lmh0bWwnKVxudmFyIG5vaWRlID0gcmVxdWlyZSgnLi4vbm9pZGUnKVxuXG5mdW5jdGlvbiBSZWNlbnQgKGVsLCBzdGF0ZSkge1xuICBzdGF0ZS5vbignY2hhbmdlJywgcmVuZGVyKVxuXG4gIGZ1bmN0aW9uIG9uQ2xpY2sgKGZpbGUpIHtcbiAgICBub2lkZS5vcGVuRmlsZShmaWxlKVxuICB9XG5cbiAgZnVuY3Rpb24gb25DbGlja0Nsb3NlIChmaWxlKSB7XG4gICAgbm9pZGUuY2xvc2VGaWxlKGZpbGUpXG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGUgKHN0YXRlKSB7XG4gICAgdmlldyhzdGF0ZS5yZWNlbnQsIHN0YXRlLmN1cnJlbnQsIG9uQ2xpY2ssIG9uQ2xpY2tDbG9zZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlciAoKSB7XG4gICAgcGF0Y2goZWwsIHVwZGF0ZSwgc3RhdGUpXG4gIH1cblxuICB0aGlzLnJlbmRlciA9IHJlbmRlclxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlY2VudFxuIiwidmFyIHN1cGVybW9kZWxzID0gcmVxdWlyZSgnc3VwZXJtb2RlbHMuanMnKVxudmFyIEZzbyA9IHJlcXVpcmUoJy4vZnNvJylcbnZhciBwcm9wID0gc3VwZXJtb2RlbHMucHJvcCgpXG5cbm1vZHVsZS5leHBvcnRzID0gc3VwZXJtb2RlbHMoe1xuICBmaWxlOiBGc28sXG4gIGVkaXRTZXNzaW9uOiBPYmplY3QsXG4gIGNyZWF0ZWQ6IHByb3AoRGF0ZSkudmFsdWUoRGF0ZS5ub3cpLFxuICBtb2RpZmllZDogcHJvcChEYXRlKS52YWx1ZShEYXRlLm5vdyksXG4gIGdldCBpc0NsZWFuICgpIHtcbiAgICByZXR1cm4gdGhpcy5lZGl0U2Vzc2lvbi5nZXRVbmRvTWFuYWdlcigpLmlzQ2xlYW4oKVxuICB9LFxuICBnZXQgaXNEaXJ0eSAoKSB7XG4gICAgcmV0dXJuICF0aGlzLmlzQ2xlYW5cbiAgfVxufSlcbiIsIi8vIHZhciBhY2UgPSByZXF1aXJlKCdicmFjZScpXG52YXIgc3VwZXJtb2RlbHMgPSByZXF1aXJlKCdzdXBlcm1vZGVscy5qcycpXG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vLi4vY29uZmlnL2NsaWVudCcpXG52YXIgbW9kZXMgPSByZXF1aXJlKCcuL21vZGVzJylcbnZhciBTZXNzaW9uID0gcmVxdWlyZSgnLi9zZXNzaW9uJylcbnZhciBFZGl0U2Vzc2lvbiA9IHdpbmRvdy5hY2UucmVxdWlyZSgnYWNlL2VkaXRfc2Vzc2lvbicpLkVkaXRTZXNzaW9uXG52YXIgVW5kb01hbmFnZXIgPSB3aW5kb3cuYWNlLnJlcXVpcmUoJ2FjZS91bmRvbWFuYWdlcicpLlVuZG9NYW5hZ2VyXG5cbnZhciBzY2hlbWEgPSB7XG4gIGl0ZW1zOiBbU2Vzc2lvbl0sXG4gIGdldCBkaXJ0eSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXRlbXMuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gIWl0ZW0uaXNDbGVhblxuICAgIH0pXG4gIH0sXG4gIGZpbmQ6IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgcmV0dXJuIHRoaXMuaXRlbXMuZmluZChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0uZmlsZSA9PT0gZmlsZVxuICAgIH0pXG4gIH0sXG4gIGFkZDogZnVuY3Rpb24gKGZpbGUsIGNvbnRlbnRzKSB7XG4gICAgdmFyIGVkaXRTZXNzaW9uID0gbmV3IEVkaXRTZXNzaW9uKGNvbnRlbnRzLCBtb2RlcyhmaWxlKSlcbiAgICBlZGl0U2Vzc2lvbi5zZXRNb2RlKG1vZGVzKGZpbGUpKVxuICAgIGVkaXRTZXNzaW9uLnNldFVzZVdvcmtlcihmYWxzZSlcbiAgICBlZGl0U2Vzc2lvbi5zZXRUYWJTaXplKGNvbmZpZy5hY2UudGFiU2l6ZSlcbiAgICBlZGl0U2Vzc2lvbi5zZXRVc2VTb2Z0VGFicyhjb25maWcuYWNlLnVzZVNvZnRUYWJzKVxuICAgIGVkaXRTZXNzaW9uLnNldFVuZG9NYW5hZ2VyKG5ldyBVbmRvTWFuYWdlcigpKVxuXG4gICAgdmFyIHNlc3Npb24gPSBuZXcgU2Vzc2lvbih7XG4gICAgICBmaWxlOiBmaWxlLFxuICAgICAgZWRpdFNlc3Npb246IGVkaXRTZXNzaW9uXG4gICAgfSlcbiAgICB0aGlzLml0ZW1zLnB1c2goc2Vzc2lvbilcbiAgICByZXR1cm4gc2Vzc2lvblxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc3VwZXJtb2RlbHMoc2NoZW1hKVxuIiwidmFyIHcgPSB3aW5kb3dcbnZhciBkID0gZG9jdW1lbnRcblxuZnVuY3Rpb24gc3BsaXR0ZXIgKGhhbmRsZSkge1xuICB2YXIgbGFzdFxuICB2YXIgaG9yaXpvbnRhbCA9IGhhbmRsZS5jbGFzc0xpc3QuY29udGFpbnMoJ2hvcml6b250YWwnKVxuICB2YXIgZWwxID0gaGFuZGxlLnByZXZpb3VzRWxlbWVudFNpYmxpbmdcbiAgdmFyIGVsMiA9IGhhbmRsZS5uZXh0RWxlbWVudFNpYmxpbmdcbiAgZnVuY3Rpb24gb25EcmFnIChlKSB7XG4gICAgaWYgKGhvcml6b250YWwpIHtcbiAgICAgIHZhciBoVCwgaEJcbiAgICAgIHZhciBoRGlmZiA9IGUuY2xpZW50WSAtIGxhc3RcblxuICAgICAgaFQgPSBkLmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwxLCAnJykuZ2V0UHJvcGVydHlWYWx1ZSgnaGVpZ2h0JylcbiAgICAgIGhCID0gZC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGVsMiwgJycpLmdldFByb3BlcnR5VmFsdWUoJ2hlaWdodCcpXG4gICAgICBoVCA9IHBhcnNlSW50KGhULCAxMCkgKyBoRGlmZlxuICAgICAgaEIgPSBwYXJzZUludChoQiwgMTApIC0gaERpZmZcbiAgICAgIGVsMS5zdHlsZS5oZWlnaHQgPSBoVCArICdweCdcbiAgICAgIGVsMi5zdHlsZS5oZWlnaHQgPSBoQiArICdweCdcbiAgICAgIGxhc3QgPSBlLmNsaWVudFlcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHdMLCB3UlxuICAgICAgdmFyIHdEaWZmID0gZS5jbGllbnRYIC0gbGFzdFxuXG4gICAgICB3TCA9IGQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbDEsICcnKS5nZXRQcm9wZXJ0eVZhbHVlKCd3aWR0aCcpXG4gICAgICB3UiA9IGQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbDIsICcnKS5nZXRQcm9wZXJ0eVZhbHVlKCd3aWR0aCcpXG4gICAgICB3TCA9IHBhcnNlSW50KHdMLCAxMCkgKyB3RGlmZlxuICAgICAgd1IgPSBwYXJzZUludCh3UiwgMTApIC0gd0RpZmZcbiAgICAgIGVsMS5zdHlsZS53aWR0aCA9IHdMICsgJ3B4J1xuICAgICAgZWwyLnN0eWxlLndpZHRoID0gd1IgKyAncHgnXG4gICAgICBsYXN0ID0gZS5jbGllbnRYXG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIG9uRW5kRHJhZyAoZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHcucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgb25EcmFnKVxuICAgIHcucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIG9uRW5kRHJhZylcbiAgICBub2lkZS5lZGl0b3IucmVzaXplKClcbiAgICB2YXIgcHJvY2Vzc2VzID0gcmVxdWlyZSgnLi9wcm9jZXNzZXMnKVxuICAgIHByb2Nlc3Nlcy5lZGl0b3IucmVzaXplKClcbiAgfVxuICBoYW5kbGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZnVuY3Rpb24gKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGxhc3QgPSBob3Jpem9udGFsID8gZS5jbGllbnRZIDogZS5jbGllbnRYXG5cbiAgICB3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG9uRHJhZylcbiAgICB3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBvbkVuZERyYWcpXG4gIH0pXG59XG5cbm1vZHVsZS5leHBvcnRzID0gc3BsaXR0ZXJcbiIsImZ1bmN0aW9uIGxpbnRlciAobm9pZGUpIHtcbiAgZnVuY3Rpb24gbGludCAoKSB7XG4gICAgdmFyIGZpbGUgPSBub2lkZS5zdGF0ZS5jdXJyZW50XG4gICAgaWYgKGZpbGUgJiYgZmlsZS5leHQgPT09ICcuanMnKSB7XG4gICAgICB2YXIgZWRpdFNlc3Npb24gPSBub2lkZS5zZXNzaW9ucy5maW5kKGZpbGUpLmVkaXRTZXNzaW9uXG4gICAgICBub2lkZS5jbGllbnQucmVxdWVzdCh7XG4gICAgICAgIHBhdGg6ICcvc3RhbmRhcmQnLFxuICAgICAgICBwYXlsb2FkOiB7XG4gICAgICAgICAgdmFsdWU6IGVkaXRTZXNzaW9uLmdldFZhbHVlKClcbiAgICAgICAgfSxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCdcbiAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIHBheWxvYWQpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJldHVybiBub2lkZS5oYW5kbGVFcnJvcihlcnIpXG4gICAgICAgIH1cbiAgICAgICAgZWRpdFNlc3Npb24uc2V0QW5ub3RhdGlvbnMocGF5bG9hZClcbiAgICAgICAgc2V0VGltZW91dChsaW50LCAzMDAwKVxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0VGltZW91dChsaW50LCAzMDAwKVxuICAgIH1cbiAgfVxuICBsaW50KClcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBsaW50ZXJcbiIsInZhciBJbmNyZW1lbnRhbERPTSA9IHJlcXVpcmUoJ2luY3JlbWVudGFsLWRvbScpXG52YXIgcGF0Y2ggPSBJbmNyZW1lbnRhbERPTS5wYXRjaFxudmFyIGVsZW1lbnRPcGVuID0gSW5jcmVtZW50YWxET00uZWxlbWVudE9wZW5cbnZhciBlbGVtZW50Vm9pZCA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRWb2lkXG52YXIgZWxlbWVudENsb3NlID0gSW5jcmVtZW50YWxET00uZWxlbWVudENsb3NlXG52YXIgZWxlbWVudFBsYWNlaG9sZGVyID0gSW5jcmVtZW50YWxET00uZWxlbWVudFBsYWNlaG9sZGVyXG52YXIgdGV4dCA9IEluY3JlbWVudGFsRE9NLnRleHRcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xudmFyIGhvaXN0ZWQxID0gW1wiY2xhc3NcIiwgXCJuYW1lIGljb24gaWNvbi1maWxlLXRleHRcIl1cbnZhciBob2lzdGVkMiA9IFtcImNsYXNzXCIsIFwiZXhwYW5kZWRcIl1cbnZhciBob2lzdGVkMyA9IFtcImNsYXNzXCIsIFwiY29sbGFwc2VkXCJdXG52YXIgaG9pc3RlZDQgPSBbXCJjbGFzc1wiLCBcIm5hbWUgaWNvbiBpY29uLWZpbGUtZGlyZWN0b3J5XCJdXG52YXIgaG9pc3RlZDUgPSBbXCJjbGFzc1wiLCBcInRyaWFuZ2xlLWxlZnRcIl1cblxucmV0dXJuIGZ1bmN0aW9uIHRyZWUgKGRhdGEsIHRyZWUsIGlzUm9vdCwgY3VycmVudCwgb25DbGljaykge1xuICBlbGVtZW50T3BlbihcInVsXCIsIG51bGwsIG51bGwsIFwiY2xhc3NcIiwgaXNSb290ID8gJ3RyZWUnIDogJycpXG4gICAgOyhBcnJheS5pc0FycmF5KGRhdGEpID8gZGF0YSA6IE9iamVjdC5rZXlzKGRhdGEpKS5mb3JFYWNoKGZ1bmN0aW9uKGZzbywgJGluZGV4KSB7XG4gICAgICBlbGVtZW50T3BlbihcImxpXCIsIGZzby5wYXRoKVxuICAgICAgICBpZiAoZnNvLmlzRmlsZSkge1xuICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYVwiLCBudWxsLCBudWxsLCBcImhyZWZcIiwgJy9maWxlP3BhdGg9JyArIGZzby5yZWxhdGl2ZVBhdGgpXG4gICAgICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgaG9pc3RlZDEsIFwiZGF0YS1uYW1lXCIsIGZzby5uYW1lLCBcImRhdGEtcGF0aFwiLCBmc28ucmVsYXRpdmVQYXRoKVxuICAgICAgICAgICAgICB0ZXh0KFwiIFxcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFwiICsgKGZzby5uYW1lKSArIFwiIFxcXG4gICAgICAgICAgICAgICAgICAgICAgICBcIilcbiAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJhXCIpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZzby5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgIGVsZW1lbnRPcGVuKFwiYVwiLCBudWxsLCBudWxsLCBcIm9uY2xpY2tcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICAgIG9uQ2xpY2soZnNvKX0pXG4gICAgICAgICAgICBpZiAoZnNvLmV4cGFuZGVkKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwic21hbGxcIiwgbnVsbCwgaG9pc3RlZDIpXG4gICAgICAgICAgICAgICAgdGV4dChcIuKWvFwiKVxuICAgICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJzbWFsbFwiKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFmc28uZXhwYW5kZWQpIHtcbiAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJzbWFsbFwiLCBudWxsLCBob2lzdGVkMylcbiAgICAgICAgICAgICAgICB0ZXh0KFwi4pa2XCIpXG4gICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNtYWxsXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgaG9pc3RlZDQsIFwiZGF0YS1uYW1lXCIsIGZzby5uYW1lLCBcImRhdGEtcGF0aFwiLCBmc28ucmVsYXRpdmVQYXRoKVxuICAgICAgICAgICAgICB0ZXh0KFwiIFxcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFwiICsgKGZzby5uYW1lKSArIFwiIFxcXG4gICAgICAgICAgICAgICAgICAgICAgICBcIilcbiAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJhXCIpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZzby5pc0ZpbGUgJiYgZnNvID09PSBjdXJyZW50KSB7XG4gICAgICAgICAgZWxlbWVudE9wZW4oXCJzcGFuXCIsIG51bGwsIGhvaXN0ZWQ1KVxuICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgfVxuICAgICAgICBpZiAoZnNvLmlzRGlyZWN0b3J5ICYmIGZzby5leHBhbmRlZCkge1xuICAgICAgICAgIGZzby5jaGlsZHJlbi5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoYS5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGIuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEubmFtZS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgPCBiLm5hbWUudG9Mb3dlckNhc2UoKSA/IC0xIDogMVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChiLmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAxXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS5uYW1lLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICA8IGIubmFtZS50b0xvd2VyQ2FzZSgpID8gLTEgOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB0cmVlKGZzby5jaGlsZHJlbiwgdHJlZSwgZmFsc2UsIGN1cnJlbnQsIG9uQ2xpY2spXG4gICAgICAgIH1cbiAgICAgIGVsZW1lbnRDbG9zZShcImxpXCIpXG4gICAgfSwgZGF0YSlcbiAgZWxlbWVudENsb3NlKFwidWxcIilcbn1cbn0pKCk7XG4iLCJ2YXIgcGFnZSA9IHJlcXVpcmUoJ3BhZ2UnKVxudmFyIHBhdGNoID0gcmVxdWlyZSgnaW5jcmVtZW50YWwtZG9tJykucGF0Y2hcbnZhciB2aWV3ID0gcmVxdWlyZSgnLi9pbmRleC5odG1sJylcbnZhciBub2lkZSA9IHJlcXVpcmUoJy4uL25vaWRlJylcblxuZnVuY3Rpb24gVHJlZSAoZWwsIGZzb3MsIHN0YXRlKSB7XG4gIGZzb3Mub24oJ2NoYW5nZScsIHJlbmRlcilcbiAgc3RhdGUub24oJ2NoYW5nZTpjdXJyZW50JywgcmVuZGVyKVxuXG4gIGZ1bmN0aW9uIG9uQ2xpY2sgKGZzbykge1xuICAgIGlmICghZnNvLmlzRGlyZWN0b3J5KSB7XG4gICAgICAvLyBwYWdlLnNob3coJy9maWxlP3BhdGg9JyArIGZzby5wYXRoLCBmc28pXG4gICAgICAvLyBub2lkZS5vcGVuRmlsZShmc28pXG4gICAgfSBlbHNlIHtcbiAgICAgIGZzby5leHBhbmRlZCA9ICFmc28uZXhwYW5kZWRcbiAgICAgIHJlbmRlcigpXG4gICAgfVxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlICh0cmVlKSB7XG4gICAgdmlldyh0cmVlLCB2aWV3LCB0cnVlLCBzdGF0ZS5jdXJyZW50LCBvbkNsaWNrKVxuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyICgpIHtcbiAgICB2YXIgdHJlZSA9IG1ha2VUcmVlKGZzb3MpXG4gICAgcGF0Y2goZWwsIHVwZGF0ZSwgdHJlZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIG1ha2VUcmVlIChkYXRhKSB7XG4gICAgZnVuY3Rpb24gdHJlZWlmeSAobGlzdCwgaWRBdHRyLCBwYXJlbnRBdHRyLCBjaGlsZHJlbkF0dHIpIHtcbiAgICAgIHZhciB0cmVlTGlzdCA9IFtdXG4gICAgICB2YXIgbG9va3VwID0ge31cbiAgICAgIHZhciBpLCBvYmpcblxuICAgICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgb2JqID0gbGlzdFtpXVxuICAgICAgICBsb29rdXBbb2JqW2lkQXR0cl1dID0gb2JqXG4gICAgICAgIG9ialtjaGlsZHJlbkF0dHJdID0gW11cbiAgICAgIH1cblxuICAgICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgb2JqID0gbGlzdFtpXVxuICAgICAgICB2YXIgcGFyZW50ID0gbG9va3VwW29ialtwYXJlbnRBdHRyXV1cbiAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgIG9iai5wYXJlbnQgPSBwYXJlbnRcbiAgICAgICAgICBsb29rdXBbb2JqW3BhcmVudEF0dHJdXVtjaGlsZHJlbkF0dHJdLnB1c2gob2JqKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRyZWVMaXN0LnB1c2gob2JqKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cmVlTGlzdFxuICAgIH1cbiAgICByZXR1cm4gdHJlZWlmeShkYXRhLCAncGF0aCcsICdkaXInLCAnY2hpbGRyZW4nKVxuICB9XG5cbiAgdGhpcy5yZW5kZXIgPSByZW5kZXJcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBUcmVlXG4iLCJmdW5jdGlvbiByZXF1aXJlZCAodmFsLCBuYW1lKSB7XG4gIGlmICghdmFsKSB7XG4gICAgcmV0dXJuIG5hbWUgKyAnIGlzIHJlcXVpcmVkJ1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICByZXF1aXJlZDogcmVxdWlyZWRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBhY2U6IHtcbiAgICB0YWJTaXplOiAyLFxuICAgIHRoZW1lOiAnbW9ub2thaScsXG4gICAgdXNlU29mdFRhYnM6IHRydWVcbiAgfVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBJZiBvYmouaGFzT3duUHJvcGVydHkgaGFzIGJlZW4gb3ZlcnJpZGRlbiwgdGhlbiBjYWxsaW5nXG4vLyBvYmouaGFzT3duUHJvcGVydHkocHJvcCkgd2lsbCBicmVhay5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2pveWVudC9ub2RlL2lzc3Vlcy8xNzA3XG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHFzLCBzZXAsIGVxLCBvcHRpb25zKSB7XG4gIHNlcCA9IHNlcCB8fCAnJic7XG4gIGVxID0gZXEgfHwgJz0nO1xuICB2YXIgb2JqID0ge307XG5cbiAgaWYgKHR5cGVvZiBxcyAhPT0gJ3N0cmluZycgfHwgcXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG9iajtcbiAgfVxuXG4gIHZhciByZWdleHAgPSAvXFwrL2c7XG4gIHFzID0gcXMuc3BsaXQoc2VwKTtcblxuICB2YXIgbWF4S2V5cyA9IDEwMDA7XG4gIGlmIChvcHRpb25zICYmIHR5cGVvZiBvcHRpb25zLm1heEtleXMgPT09ICdudW1iZXInKSB7XG4gICAgbWF4S2V5cyA9IG9wdGlvbnMubWF4S2V5cztcbiAgfVxuXG4gIHZhciBsZW4gPSBxcy5sZW5ndGg7XG4gIC8vIG1heEtleXMgPD0gMCBtZWFucyB0aGF0IHdlIHNob3VsZCBub3QgbGltaXQga2V5cyBjb3VudFxuICBpZiAobWF4S2V5cyA+IDAgJiYgbGVuID4gbWF4S2V5cykge1xuICAgIGxlbiA9IG1heEtleXM7XG4gIH1cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgdmFyIHggPSBxc1tpXS5yZXBsYWNlKHJlZ2V4cCwgJyUyMCcpLFxuICAgICAgICBpZHggPSB4LmluZGV4T2YoZXEpLFxuICAgICAgICBrc3RyLCB2c3RyLCBrLCB2O1xuXG4gICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICBrc3RyID0geC5zdWJzdHIoMCwgaWR4KTtcbiAgICAgIHZzdHIgPSB4LnN1YnN0cihpZHggKyAxKTtcbiAgICB9IGVsc2Uge1xuICAgICAga3N0ciA9IHg7XG4gICAgICB2c3RyID0gJyc7XG4gICAgfVxuXG4gICAgayA9IGRlY29kZVVSSUNvbXBvbmVudChrc3RyKTtcbiAgICB2ID0gZGVjb2RlVVJJQ29tcG9uZW50KHZzdHIpO1xuXG4gICAgaWYgKCFoYXNPd25Qcm9wZXJ0eShvYmosIGspKSB7XG4gICAgICBvYmpba10gPSB2O1xuICAgIH0gZWxzZSBpZiAoaXNBcnJheShvYmpba10pKSB7XG4gICAgICBvYmpba10ucHVzaCh2KTtcbiAgICB9IGVsc2Uge1xuICAgICAgb2JqW2tdID0gW29ialtrXSwgdl07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG9iajtcbn07XG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoeHMpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4cykgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHN0cmluZ2lmeVByaW1pdGl2ZSA9IGZ1bmN0aW9uKHYpIHtcbiAgc3dpdGNoICh0eXBlb2Ygdikge1xuICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICByZXR1cm4gdjtcblxuICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgcmV0dXJuIHYgPyAndHJ1ZScgOiAnZmFsc2UnO1xuXG4gICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgIHJldHVybiBpc0Zpbml0ZSh2KSA/IHYgOiAnJztcblxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJyc7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob2JqLCBzZXAsIGVxLCBuYW1lKSB7XG4gIHNlcCA9IHNlcCB8fCAnJic7XG4gIGVxID0gZXEgfHwgJz0nO1xuICBpZiAob2JqID09PSBudWxsKSB7XG4gICAgb2JqID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIG1hcChvYmplY3RLZXlzKG9iaiksIGZ1bmN0aW9uKGspIHtcbiAgICAgIHZhciBrcyA9IGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUoaykpICsgZXE7XG4gICAgICBpZiAoaXNBcnJheShvYmpba10pKSB7XG4gICAgICAgIHJldHVybiBtYXAob2JqW2tdLCBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgcmV0dXJuIGtzICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZSh2KSk7XG4gICAgICAgIH0pLmpvaW4oc2VwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBrcyArIGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUob2JqW2tdKSk7XG4gICAgICB9XG4gICAgfSkuam9pbihzZXApO1xuXG4gIH1cblxuICBpZiAoIW5hbWUpIHJldHVybiAnJztcbiAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUobmFtZSkpICsgZXEgK1xuICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShvYmopKTtcbn07XG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoeHMpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4cykgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuXG5mdW5jdGlvbiBtYXAgKHhzLCBmKSB7XG4gIGlmICh4cy5tYXApIHJldHVybiB4cy5tYXAoZik7XG4gIHZhciByZXMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgIHJlcy5wdXNoKGYoeHNbaV0sIGkpKTtcbiAgfVxuICByZXR1cm4gcmVzO1xufVxuXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIHJlcyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHJlcy5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIHJlcztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuZGVjb2RlID0gZXhwb3J0cy5wYXJzZSA9IHJlcXVpcmUoJy4vZGVjb2RlJyk7XG5leHBvcnRzLmVuY29kZSA9IGV4cG9ydHMuc3RyaW5naWZ5ID0gcmVxdWlyZSgnLi9lbmNvZGUnKTtcbiIsIlxuLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gZmFjdG9yeShleHBvcnRzKSA6IHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShbJ2V4cG9ydHMnXSwgZmFjdG9yeSkgOiBmYWN0b3J5KGdsb2JhbC5JbmNyZW1lbnRhbERPTSA9IHt9KTtcbn0pKHRoaXMsIGZ1bmN0aW9uIChleHBvcnRzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvKipcbiAgICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICAgKlxuICAgKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICAgKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gICAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICAgKlxuICAgKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICAgKlxuICAgKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gICAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAgICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gICAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAgICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gICAqL1xuXG4gIC8qKiAqL1xuICBleHBvcnRzLm5vdGlmaWNhdGlvbnMgPSB7XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIGFmdGVyIHBhdGNoIGhhcyBjb21wbGVhdGVkIHdpdGggYW55IE5vZGVzIHRoYXQgaGF2ZSBiZWVuIGNyZWF0ZWRcbiAgICAgKiBhbmQgYWRkZWQgdG8gdGhlIERPTS5cbiAgICAgKiBAdHlwZSB7P2Z1bmN0aW9uKEFycmF5PCFOb2RlPil9XG4gICAgICovXG4gICAgbm9kZXNDcmVhdGVkOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIGFmdGVyIHBhdGNoIGhhcyBjb21wbGVhdGVkIHdpdGggYW55IE5vZGVzIHRoYXQgaGF2ZSBiZWVuIHJlbW92ZWRcbiAgICAgKiBmcm9tIHRoZSBET00uXG4gICAgICogTm90ZSBpdCdzIGFuIGFwcGxpY2F0aW9ucyByZXNwb25zaWJpbGl0eSB0byBoYW5kbGUgYW55IGNoaWxkTm9kZXMuXG4gICAgICogQHR5cGUgez9mdW5jdGlvbihBcnJheTwhTm9kZT4pfVxuICAgICAqL1xuICAgIG5vZGVzRGVsZXRlZDogbnVsbFxuICB9O1xuXG4gIC8qKlxuICAgKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gICAqXG4gICAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gICAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAgICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gICAqXG4gICAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gICAqXG4gICAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAgICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICAgKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAgICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICAgKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIFNpbWlsYXIgdG8gdGhlIGJ1aWx0LWluIFRyZWV3YWxrZXIgY2xhc3MsIGJ1dCBzaW1wbGlmaWVkIGFuZCBhbGxvd3MgZGlyZWN0XG4gICAqIGFjY2VzcyB0byBtb2RpZnkgdGhlIGN1cnJlbnROb2RlIHByb3BlcnR5LlxuICAgKiBAcGFyYW0geyFFbGVtZW50fCFEb2N1bWVudEZyYWdtZW50fSBub2RlIFRoZSByb290IE5vZGUgb2YgdGhlIHN1YnRyZWUgdGhlXG4gICAqICAgICB3YWxrZXIgc2hvdWxkIHN0YXJ0IHRyYXZlcnNpbmcuXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKi9cbiAgZnVuY3Rpb24gVHJlZVdhbGtlcihub2RlKSB7XG4gICAgLyoqXG4gICAgICogS2VlcHMgdHJhY2sgb2YgdGhlIGN1cnJlbnQgcGFyZW50IG5vZGUuIFRoaXMgaXMgbmVjZXNzYXJ5IGFzIHRoZSB0cmF2ZXJzYWxcbiAgICAgKiBtZXRob2RzIG1heSB0cmF2ZXJzZSBwYXN0IHRoZSBsYXN0IGNoaWxkIGFuZCB3ZSBzdGlsbCBuZWVkIGEgd2F5IHRvIGdldFxuICAgICAqIGJhY2sgdG8gdGhlIHBhcmVudC5cbiAgICAgKiBAY29uc3QgQHByaXZhdGUgeyFBcnJheTwhTm9kZT59XG4gICAgICovXG4gICAgdGhpcy5zdGFja18gPSBbXTtcblxuICAgIC8qKlxuICAgICAqIEBjb25zdCB7IUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnR9XG4gICAgICovXG4gICAgdGhpcy5yb290ID0gbm9kZTtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHs/Tm9kZX1cbiAgICAgKi9cbiAgICB0aGlzLmN1cnJlbnROb2RlID0gbm9kZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHshTm9kZX0gVGhlIGN1cnJlbnQgcGFyZW50IG9mIHRoZSBjdXJyZW50IGxvY2F0aW9uIGluIHRoZSBzdWJ0cmVlLlxuICAgKi9cbiAgVHJlZVdhbGtlci5wcm90b3R5cGUuZ2V0Q3VycmVudFBhcmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5zdGFja19bdGhpcy5zdGFja18ubGVuZ3RoIC0gMV07XG4gIH07XG5cbiAgLyoqXG4gICAqIENoYW5nZXMgdGhlIGN1cnJlbnQgbG9jYXRpb24gdGhlIGZpcnN0Q2hpbGQgb2YgdGhlIGN1cnJlbnQgbG9jYXRpb24uXG4gICAqL1xuICBUcmVlV2Fsa2VyLnByb3RvdHlwZS5maXJzdENoaWxkID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc3RhY2tfLnB1c2godGhpcy5jdXJyZW50Tm9kZSk7XG4gICAgdGhpcy5jdXJyZW50Tm9kZSA9IHRoaXMuY3VycmVudE5vZGUuZmlyc3RDaGlsZDtcbiAgfTtcblxuICAvKipcbiAgICogQ2hhbmdlcyB0aGUgY3VycmVudCBsb2NhdGlvbiB0aGUgbmV4dFNpYmxpbmcgb2YgdGhlIGN1cnJlbnQgbG9jYXRpb24uXG4gICAqL1xuICBUcmVlV2Fsa2VyLnByb3RvdHlwZS5uZXh0U2libGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmN1cnJlbnROb2RlID0gdGhpcy5jdXJyZW50Tm9kZS5uZXh0U2libGluZztcbiAgfTtcblxuICAvKipcbiAgICogQ2hhbmdlcyB0aGUgY3VycmVudCBsb2NhdGlvbiB0aGUgcGFyZW50Tm9kZSBvZiB0aGUgY3VycmVudCBsb2NhdGlvbi5cbiAgICovXG4gIFRyZWVXYWxrZXIucHJvdG90eXBlLnBhcmVudE5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5jdXJyZW50Tm9kZSA9IHRoaXMuc3RhY2tfLnBvcCgpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBLZWVwcyB0cmFjayBvZiB0aGUgc3RhdGUgb2YgYSBwYXRjaC5cbiAgICogQHBhcmFtIHshRWxlbWVudHwhRG9jdW1lbnRGcmFnbWVudH0gbm9kZSBUaGUgcm9vdCBOb2RlIG9mIHRoZSBzdWJ0cmVlIHRoZVxuICAgKiAgICAgaXMgZm9yLlxuICAgKiBAcGFyYW0gez9Db250ZXh0fSBwcmV2Q29udGV4dCBUaGUgcHJldmlvdXMgY29udGV4dC5cbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuICBmdW5jdGlvbiBDb250ZXh0KG5vZGUsIHByZXZDb250ZXh0KSB7XG4gICAgLyoqXG4gICAgICogQGNvbnN0IHtUcmVlV2Fsa2VyfVxuICAgICAqL1xuICAgIHRoaXMud2Fsa2VyID0gbmV3IFRyZWVXYWxrZXIobm9kZSk7XG5cbiAgICAvKipcbiAgICAgKiBAY29uc3Qge0RvY3VtZW50fVxuICAgICAqL1xuICAgIHRoaXMuZG9jID0gbm9kZS5vd25lckRvY3VtZW50O1xuXG4gICAgLyoqXG4gICAgICogS2VlcHMgdHJhY2sgb2Ygd2hhdCBuYW1lc3BhY2UgdG8gY3JlYXRlIG5ldyBFbGVtZW50cyBpbi5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBjb25zdCB7IUFycmF5PChzdHJpbmd8dW5kZWZpbmVkKT59XG4gICAgICovXG4gICAgdGhpcy5uc1N0YWNrXyA9IFt1bmRlZmluZWRdO1xuXG4gICAgLyoqXG4gICAgICogQGNvbnN0IHs/Q29udGV4dH1cbiAgICAgKi9cbiAgICB0aGlzLnByZXZDb250ZXh0ID0gcHJldkNvbnRleHQ7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7KEFycmF5PCFOb2RlPnx1bmRlZmluZWQpfVxuICAgICAqL1xuICAgIHRoaXMuY3JlYXRlZCA9IGV4cG9ydHMubm90aWZpY2F0aW9ucy5ub2Rlc0NyZWF0ZWQgJiYgW107XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7KEFycmF5PCFOb2RlPnx1bmRlZmluZWQpfVxuICAgICAqL1xuICAgIHRoaXMuZGVsZXRlZCA9IGV4cG9ydHMubm90aWZpY2F0aW9ucy5ub2Rlc0RlbGV0ZWQgJiYgW107XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7KHN0cmluZ3x1bmRlZmluZWQpfSBUaGUgY3VycmVudCBuYW1lc3BhY2UgdG8gY3JlYXRlIEVsZW1lbnRzIGluLlxuICAgKi9cbiAgQ29udGV4dC5wcm90b3R5cGUuZ2V0Q3VycmVudE5hbWVzcGFjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5uc1N0YWNrX1t0aGlzLm5zU3RhY2tfLmxlbmd0aCAtIDFdO1xuICB9O1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZz19IG5hbWVzcGFjZSBUaGUgbmFtZXNwYWNlIHRvIGVudGVyLlxuICAgKi9cbiAgQ29udGV4dC5wcm90b3R5cGUuZW50ZXJOYW1lc3BhY2UgPSBmdW5jdGlvbiAobmFtZXNwYWNlKSB7XG4gICAgdGhpcy5uc1N0YWNrXy5wdXNoKG5hbWVzcGFjZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEV4aXRzIHRoZSBjdXJyZW50IG5hbWVzcGFjZVxuICAgKi9cbiAgQ29udGV4dC5wcm90b3R5cGUuZXhpdE5hbWVzcGFjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLm5zU3RhY2tfLnBvcCgpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gICAqL1xuICBDb250ZXh0LnByb3RvdHlwZS5tYXJrQ3JlYXRlZCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgaWYgKHRoaXMuY3JlYXRlZCkge1xuICAgICAgdGhpcy5jcmVhdGVkLnB1c2gobm9kZSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gICAqL1xuICBDb250ZXh0LnByb3RvdHlwZS5tYXJrRGVsZXRlZCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgaWYgKHRoaXMuZGVsZXRlZCkge1xuICAgICAgdGhpcy5kZWxldGVkLnB1c2gobm9kZSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBOb3RpZmllcyBhYm91dCBub2RlcyB0aGF0IHdlcmUgY3JlYXRlZCBkdXJpbmcgdGhlIHBhdGNoIG9wZWFyYXRpb24uXG4gICAqL1xuICBDb250ZXh0LnByb3RvdHlwZS5ub3RpZnlDaGFuZ2VzID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmNyZWF0ZWQgJiYgdGhpcy5jcmVhdGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGV4cG9ydHMubm90aWZpY2F0aW9ucy5ub2Rlc0NyZWF0ZWQodGhpcy5jcmVhdGVkKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5kZWxldGVkICYmIHRoaXMuZGVsZXRlZC5sZW5ndGggPiAwKSB7XG4gICAgICBleHBvcnRzLm5vdGlmaWNhdGlvbnMubm9kZXNEZWxldGVkKHRoaXMuZGVsZXRlZCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBUaGUgY3VycmVudCBjb250ZXh0LlxuICAgKiBAdHlwZSB7P0NvbnRleHR9XG4gICAqL1xuICB2YXIgY29udGV4dDtcblxuICAvKipcbiAgICogRW50ZXJzIGEgbmV3IHBhdGNoIGNvbnRleHQuXG4gICAqIEBwYXJhbSB7IUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnR9IG5vZGVcbiAgICovXG4gIHZhciBlbnRlckNvbnRleHQgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIGNvbnRleHQgPSBuZXcgQ29udGV4dChub2RlLCBjb250ZXh0KTtcbiAgfTtcblxuICAvKipcbiAgICogUmVzdG9yZXMgdGhlIHByZXZpb3VzIHBhdGNoIGNvbnRleHQuXG4gICAqL1xuICB2YXIgcmVzdG9yZUNvbnRleHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgY29udGV4dCA9IGNvbnRleHQucHJldkNvbnRleHQ7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgcGF0Y2ggY29udGV4dC5cbiAgICogQHJldHVybiB7P0NvbnRleHR9XG4gICAqL1xuICB2YXIgZ2V0Q29udGV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gY29udGV4dDtcbiAgfTtcblxuICAvKipcbiAgICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICAgKlxuICAgKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICAgKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gICAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICAgKlxuICAgKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICAgKlxuICAgKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gICAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAgICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gICAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAgICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBBIGNhY2hlZCByZWZlcmVuY2UgdG8gdGhlIGhhc093blByb3BlcnR5IGZ1bmN0aW9uLlxuICAgKi9cbiAgdmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuICAvKipcbiAgICogQSBjYWNoZWQgcmVmZXJlbmNlIHRvIHRoZSBjcmVhdGUgZnVuY3Rpb24uXG4gICAqL1xuICB2YXIgY3JlYXRlID0gT2JqZWN0LmNyZWF0ZTtcblxuICAvKipcbiAgICogVXNlZCB0byBwcmV2ZW50IHByb3BlcnR5IGNvbGxpc2lvbnMgYmV0d2VlbiBvdXIgXCJtYXBcIiBhbmQgaXRzIHByb3RvdHlwZS5cbiAgICogQHBhcmFtIHshT2JqZWN0PHN0cmluZywgKj59IG1hcCBUaGUgbWFwIHRvIGNoZWNrLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHkgVGhlIHByb3BlcnR5IHRvIGNoZWNrLlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIG1hcCBoYXMgcHJvcGVydHkuXG4gICAqL1xuICB2YXIgaGFzID0gZnVuY3Rpb24gKG1hcCwgcHJvcGVydHkpIHtcbiAgICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChtYXAsIHByb3BlcnR5KTtcbiAgfTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBtYXAgb2JqZWN0IHdpdGhvdXQgYSBwcm90b3R5cGUuXG4gICAqIEByZXR1cm4geyFPYmplY3R9XG4gICAqL1xuICB2YXIgY3JlYXRlTWFwID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBjcmVhdGUobnVsbCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEtlZXBzIHRyYWNrIG9mIGluZm9ybWF0aW9uIG5lZWRlZCB0byBwZXJmb3JtIGRpZmZzIGZvciBhIGdpdmVuIERPTSBub2RlLlxuICAgKiBAcGFyYW0geyFzdHJpbmd9IG5vZGVOYW1lXG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleVxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGZ1bmN0aW9uIE5vZGVEYXRhKG5vZGVOYW1lLCBrZXkpIHtcbiAgICAvKipcbiAgICAgKiBUaGUgYXR0cmlidXRlcyBhbmQgdGhlaXIgdmFsdWVzLlxuICAgICAqIEBjb25zdFxuICAgICAqL1xuICAgIHRoaXMuYXR0cnMgPSBjcmVhdGVNYXAoKTtcblxuICAgIC8qKlxuICAgICAqIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzLCB1c2VkIGZvciBxdWlja2x5IGRpZmZpbmcgdGhlXG4gICAgICogaW5jb21taW5nIGF0dHJpYnV0ZXMgdG8gc2VlIGlmIHRoZSBET00gbm9kZSdzIGF0dHJpYnV0ZXMgbmVlZCB0byBiZVxuICAgICAqIHVwZGF0ZWQuXG4gICAgICogQGNvbnN0IHtBcnJheTwqPn1cbiAgICAgKi9cbiAgICB0aGlzLmF0dHJzQXJyID0gW107XG5cbiAgICAvKipcbiAgICAgKiBUaGUgaW5jb21pbmcgYXR0cmlidXRlcyBmb3IgdGhpcyBOb2RlLCBiZWZvcmUgdGhleSBhcmUgdXBkYXRlZC5cbiAgICAgKiBAY29uc3QgeyFPYmplY3Q8c3RyaW5nLCAqPn1cbiAgICAgKi9cbiAgICB0aGlzLm5ld0F0dHJzID0gY3JlYXRlTWFwKCk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBub2RlLCB1c2VkIHRvIHByZXNlcnZlIERPTSBub2RlcyB3aGVuIHRoZXlcbiAgICAgKiBtb3ZlIHdpdGhpbiB0aGVpciBwYXJlbnQuXG4gICAgICogQGNvbnN0XG4gICAgICovXG4gICAgdGhpcy5rZXkgPSBrZXk7XG5cbiAgICAvKipcbiAgICAgKiBLZWVwcyB0cmFjayBvZiBjaGlsZHJlbiB3aXRoaW4gdGhpcyBub2RlIGJ5IHRoZWlyIGtleS5cbiAgICAgKiB7P09iamVjdDxzdHJpbmcsICFFbGVtZW50Pn1cbiAgICAgKi9cbiAgICB0aGlzLmtleU1hcCA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUga2V5TWFwIGlzIGN1cnJlbnRseSB2YWxpZC5cbiAgICAgKiB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICB0aGlzLmtleU1hcFZhbGlkID0gdHJ1ZTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBsYXN0IGNoaWxkIHRvIGhhdmUgYmVlbiB2aXNpdGVkIHdpdGhpbiB0aGUgY3VycmVudCBwYXNzLlxuICAgICAqIEB0eXBlIHs/Tm9kZX1cbiAgICAgKi9cbiAgICB0aGlzLmxhc3RWaXNpdGVkQ2hpbGQgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogVGhlIG5vZGUgbmFtZSBmb3IgdGhpcyBub2RlLlxuICAgICAqIEBjb25zdCB7c3RyaW5nfVxuICAgICAqL1xuICAgIHRoaXMubm9kZU5hbWUgPSBub2RlTmFtZTtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHs/c3RyaW5nfVxuICAgICAqL1xuICAgIHRoaXMudGV4dCA9IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSBOb2RlRGF0YSBvYmplY3QgZm9yIGEgTm9kZS5cbiAgICpcbiAgICogQHBhcmFtIHtOb2RlfSBub2RlIFRoZSBub2RlIHRvIGluaXRpYWxpemUgZGF0YSBmb3IuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlTmFtZSBUaGUgbm9kZSBuYW1lIG9mIG5vZGUuXG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHRoYXQgaWRlbnRpZmllcyB0aGUgbm9kZS5cbiAgICogQHJldHVybiB7IU5vZGVEYXRhfSBUaGUgbmV3bHkgaW5pdGlhbGl6ZWQgZGF0YSBvYmplY3RcbiAgICovXG4gIHZhciBpbml0RGF0YSA9IGZ1bmN0aW9uIChub2RlLCBub2RlTmFtZSwga2V5KSB7XG4gICAgdmFyIGRhdGEgPSBuZXcgTm9kZURhdGEobm9kZU5hbWUsIGtleSk7XG4gICAgbm9kZVsnX19pbmNyZW1lbnRhbERPTURhdGEnXSA9IGRhdGE7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgTm9kZURhdGEgb2JqZWN0IGZvciBhIE5vZGUsIGNyZWF0aW5nIGl0IGlmIG5lY2Vzc2FyeS5cbiAgICpcbiAgICogQHBhcmFtIHtOb2RlfSBub2RlIFRoZSBub2RlIHRvIHJldHJpZXZlIHRoZSBkYXRhIGZvci5cbiAgICogQHJldHVybiB7IU5vZGVEYXRhfSBUaGUgTm9kZURhdGEgZm9yIHRoaXMgTm9kZS5cbiAgICovXG4gIHZhciBnZXREYXRhID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICB2YXIgZGF0YSA9IG5vZGVbJ19faW5jcmVtZW50YWxET01EYXRhJ107XG5cbiAgICBpZiAoIWRhdGEpIHtcbiAgICAgIHZhciBub2RlTmFtZSA9IG5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgIHZhciBrZXkgPSBudWxsO1xuXG4gICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgICAga2V5ID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ2tleScpO1xuICAgICAgfVxuXG4gICAgICBkYXRhID0gaW5pdERhdGEobm9kZSwgbm9kZU5hbWUsIGtleSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH07XG5cbiAgLyoqXG4gICAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAgICpcbiAgICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAgICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICAgKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAgICpcbiAgICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAgICpcbiAgICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICAgKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gICAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICAgKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gICAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICAgKi9cblxuICBleHBvcnRzLnN5bWJvbHMgPSB7XG4gICAgZGVmYXVsdDogJ19fZGVmYXVsdCcsXG5cbiAgICBwbGFjZWhvbGRlcjogJ19fcGxhY2Vob2xkZXInXG4gIH07XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgYW4gYXR0cmlidXRlIG9yIHByb3BlcnR5IHRvIGEgZ2l2ZW4gRWxlbWVudC4gSWYgdGhlIHZhbHVlIGlzIG51bGxcbiAgICogb3IgdW5kZWZpbmVkLCBpdCBpcyByZW1vdmVkIGZyb20gdGhlIEVsZW1lbnQuIE90aGVyd2lzZSwgdGhlIHZhbHVlIGlzIHNldFxuICAgKiBhcyBhbiBhdHRyaWJ1dGUuXG4gICAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBhdHRyaWJ1dGUncyBuYW1lLlxuICAgKiBAcGFyYW0gez8oYm9vbGVhbnxudW1iZXJ8c3RyaW5nKT19IHZhbHVlIFRoZSBhdHRyaWJ1dGUncyB2YWx1ZS5cbiAgICovXG4gIGV4cG9ydHMuYXBwbHlBdHRyID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gICAgfVxuXG4gICAgLy8gSWYsIGFmdGVyIGNoYW5naW5nIHRoZSBhdHRyaWJ1dGUsXG4gICAgLy8gdGhlIGNvcnJlc3BvbmRpbmcgcHJvcGVydHkgaXMgbm90IHVwZGF0ZWQsXG4gICAgLy8gYWxzbyB1cGRhdGUgaXQuXG4gICAgaWYgKGVsW25hbWVdICE9PSB2YWx1ZSkge1xuICAgICAgZWxbbmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgYSBwcm9wZXJ0eSB0byBhIGdpdmVuIEVsZW1lbnQuXG4gICAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBwcm9wZXJ0eSdzIG5hbWUuXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHByb3BlcnR5J3MgdmFsdWUuXG4gICAqL1xuICBleHBvcnRzLmFwcGx5UHJvcCA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgICBlbFtuYW1lXSA9IHZhbHVlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGEgc3R5bGUgdG8gYW4gRWxlbWVudC4gTm8gdmVuZG9yIHByZWZpeCBleHBhbnNpb24gaXMgZG9uZSBmb3JcbiAgICogcHJvcGVydHkgbmFtZXMvdmFsdWVzLlxuICAgKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAgICogQHBhcmFtIHtzdHJpbmd8T2JqZWN0PHN0cmluZyxzdHJpbmc+fSBzdHlsZSBUaGUgc3R5bGUgdG8gc2V0LiBFaXRoZXIgYVxuICAgKiAgICAgc3RyaW5nIG9mIGNzcyBvciBhbiBvYmplY3QgY29udGFpbmluZyBwcm9wZXJ0eS12YWx1ZSBwYWlycy5cbiAgICovXG4gIHZhciBhcHBseVN0eWxlID0gZnVuY3Rpb24gKGVsLCBuYW1lLCBzdHlsZSkge1xuICAgIGlmICh0eXBlb2Ygc3R5bGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbC5zdHlsZS5jc3NUZXh0ID0gc3R5bGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsLnN0eWxlLmNzc1RleHQgPSAnJztcbiAgICAgIHZhciBlbFN0eWxlID0gZWwuc3R5bGU7XG5cbiAgICAgIGZvciAodmFyIHByb3AgaW4gc3R5bGUpIHtcbiAgICAgICAgaWYgKGhhcyhzdHlsZSwgcHJvcCkpIHtcbiAgICAgICAgICBlbFN0eWxlW3Byb3BdID0gc3R5bGVbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgYSBzaW5nbGUgYXR0cmlidXRlIG9uIGFuIEVsZW1lbnQuXG4gICAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBhdHRyaWJ1dGUncyBuYW1lLlxuICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBhdHRyaWJ1dGUncyB2YWx1ZS4gSWYgdGhlIHZhbHVlIGlzIGFuIG9iamVjdCBvclxuICAgKiAgICAgZnVuY3Rpb24gaXQgaXMgc2V0IG9uIHRoZSBFbGVtZW50LCBvdGhlcndpc2UsIGl0IGlzIHNldCBhcyBhbiBIVE1MXG4gICAqICAgICBhdHRyaWJ1dGUuXG4gICAqL1xuICB2YXIgYXBwbHlBdHRyaWJ1dGVUeXBlZCA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcblxuICAgIGlmICh0eXBlID09PSAnb2JqZWN0JyB8fCB0eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBleHBvcnRzLmFwcGx5UHJvcChlbCwgbmFtZSwgdmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHBvcnRzLmFwcGx5QXR0cihlbCwgbmFtZSwgLyoqIEB0eXBlIHs/KGJvb2xlYW58bnVtYmVyfHN0cmluZyl9ICovdmFsdWUpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogQ2FsbHMgdGhlIGFwcHJvcHJpYXRlIGF0dHJpYnV0ZSBtdXRhdG9yIGZvciB0aGlzIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIGF0dHJpYnV0ZSdzIHZhbHVlLlxuICAgKi9cbiAgdmFyIHVwZGF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgICB2YXIgZGF0YSA9IGdldERhdGEoZWwpO1xuICAgIHZhciBhdHRycyA9IGRhdGEuYXR0cnM7XG5cbiAgICBpZiAoYXR0cnNbbmFtZV0gPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIG11dGF0b3IgPSBleHBvcnRzLmF0dHJpYnV0ZXNbbmFtZV0gfHwgZXhwb3J0cy5hdHRyaWJ1dGVzW2V4cG9ydHMuc3ltYm9scy5kZWZhdWx0XTtcbiAgICBtdXRhdG9yKGVsLCBuYW1lLCB2YWx1ZSk7XG5cbiAgICBhdHRyc1tuYW1lXSA9IHZhbHVlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBIHB1YmxpY2x5IG11dGFibGUgb2JqZWN0IHRvIHByb3ZpZGUgY3VzdG9tIG11dGF0b3JzIGZvciBhdHRyaWJ1dGVzLlxuICAgKiBAY29uc3QgeyFPYmplY3Q8c3RyaW5nLCBmdW5jdGlvbighRWxlbWVudCwgc3RyaW5nLCAqKT59XG4gICAqL1xuICBleHBvcnRzLmF0dHJpYnV0ZXMgPSBjcmVhdGVNYXAoKTtcblxuICAvLyBTcGVjaWFsIGdlbmVyaWMgbXV0YXRvciB0aGF0J3MgY2FsbGVkIGZvciBhbnkgYXR0cmlidXRlIHRoYXQgZG9lcyBub3RcbiAgLy8gaGF2ZSBhIHNwZWNpZmljIG11dGF0b3IuXG4gIGV4cG9ydHMuYXR0cmlidXRlc1tleHBvcnRzLnN5bWJvbHMuZGVmYXVsdF0gPSBhcHBseUF0dHJpYnV0ZVR5cGVkO1xuXG4gIGV4cG9ydHMuYXR0cmlidXRlc1tleHBvcnRzLnN5bWJvbHMucGxhY2Vob2xkZXJdID0gZnVuY3Rpb24gKCkge307XG5cbiAgZXhwb3J0cy5hdHRyaWJ1dGVzWydzdHlsZSddID0gYXBwbHlTdHlsZTtcblxuICB2YXIgU1ZHX05TID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcblxuICAvKipcbiAgICogRW50ZXJzIGEgdGFnLCBjaGVja2luZyB0byBzZWUgaWYgaXQgaXMgYSBuYW1lc3BhY2UgYm91bmRhcnksIGFuZCBpZiBzbyxcbiAgICogdXBkYXRlcyB0aGUgY3VycmVudCBuYW1lc3BhY2UuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIHRhZyB0byBlbnRlci5cbiAgICovXG4gIHZhciBlbnRlclRhZyA9IGZ1bmN0aW9uICh0YWcpIHtcbiAgICBpZiAodGFnID09PSAnc3ZnJykge1xuICAgICAgZ2V0Q29udGV4dCgpLmVudGVyTmFtZXNwYWNlKFNWR19OUyk7XG4gICAgfSBlbHNlIGlmICh0YWcgPT09ICdmb3JlaWduT2JqZWN0Jykge1xuICAgICAgZ2V0Q29udGV4dCgpLmVudGVyTmFtZXNwYWNlKHVuZGVmaW5lZCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBFeGl0cyBhIHRhZywgY2hlY2tpbmcgdG8gc2VlIGlmIGl0IGlzIGEgbmFtZXNwYWNlIGJvdW5kYXJ5LCBhbmQgaWYgc28sXG4gICAqIHVwZGF0ZXMgdGhlIGN1cnJlbnQgbmFtZXNwYWNlLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSB0YWcgdG8gZW50ZXIuXG4gICAqL1xuICB2YXIgZXhpdFRhZyA9IGZ1bmN0aW9uICh0YWcpIHtcbiAgICBpZiAodGFnID09PSAnc3ZnJyB8fCB0YWcgPT09ICdmb3JlaWduT2JqZWN0Jykge1xuICAgICAgZ2V0Q29udGV4dCgpLmV4aXROYW1lc3BhY2UoKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG5hbWVzcGFjZSB0byBjcmVhdGUgYW4gZWxlbWVudCAob2YgYSBnaXZlbiB0YWcpIGluLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSB0YWcgdG8gZ2V0IHRoZSBuYW1lc3BhY2UgZm9yLlxuICAgKiBAcmV0dXJuIHsoc3RyaW5nfHVuZGVmaW5lZCl9IFRoZSBuYW1lc3BhY2UgdG8gY3JlYXRlIHRoZSB0YWcgaW4uXG4gICAqL1xuICB2YXIgZ2V0TmFtZXNwYWNlRm9yVGFnID0gZnVuY3Rpb24gKHRhZykge1xuICAgIGlmICh0YWcgPT09ICdzdmcnKSB7XG4gICAgICByZXR1cm4gU1ZHX05TO1xuICAgIH1cblxuICAgIHJldHVybiBnZXRDb250ZXh0KCkuZ2V0Q3VycmVudE5hbWVzcGFjZSgpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIEVsZW1lbnQuXG4gICAqIEBwYXJhbSB7RG9jdW1lbnR9IGRvYyBUaGUgZG9jdW1lbnQgd2l0aCB3aGljaCB0byBjcmVhdGUgdGhlIEVsZW1lbnQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIHRhZyBmb3IgdGhlIEVsZW1lbnQuXG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBBIGtleSB0byBpZGVudGlmeSB0aGUgRWxlbWVudC5cbiAgICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mXG4gICAqICAgICB0aGUgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LlxuICAgKiBAcmV0dXJuIHshRWxlbWVudH1cbiAgICovXG4gIHZhciBjcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24gKGRvYywgdGFnLCBrZXksIHN0YXRpY3MpIHtcbiAgICB2YXIgbmFtZXNwYWNlID0gZ2V0TmFtZXNwYWNlRm9yVGFnKHRhZyk7XG4gICAgdmFyIGVsO1xuXG4gICAgaWYgKG5hbWVzcGFjZSkge1xuICAgICAgZWwgPSBkb2MuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgdGFnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWwgPSBkb2MuY3JlYXRlRWxlbWVudCh0YWcpO1xuICAgIH1cblxuICAgIGluaXREYXRhKGVsLCB0YWcsIGtleSk7XG5cbiAgICBpZiAoc3RhdGljcykge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGF0aWNzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgIHVwZGF0ZUF0dHJpYnV0ZShlbCwgLyoqIEB0eXBlIHshc3RyaW5nfSovc3RhdGljc1tpXSwgc3RhdGljc1tpICsgMV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBlbDtcbiAgfTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIE5vZGUsIGVpdGhlciBhIFRleHQgb3IgYW4gRWxlbWVudCBkZXBlbmRpbmcgb24gdGhlIG5vZGUgbmFtZVxuICAgKiBwcm92aWRlZC5cbiAgICogQHBhcmFtIHtEb2N1bWVudH0gZG9jIFRoZSBkb2N1bWVudCB3aXRoIHdoaWNoIHRvIGNyZWF0ZSB0aGUgTm9kZS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVOYW1lIFRoZSB0YWcgaWYgY3JlYXRpbmcgYW4gZWxlbWVudCBvciAjdGV4dCB0byBjcmVhdGVcbiAgICogICAgIGEgVGV4dC5cbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IEEga2V5IHRvIGlkZW50aWZ5IHRoZSBFbGVtZW50LlxuICAgKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgVGhlIHN0YXRpYyBkYXRhIHRvIGluaXRpYWxpemUgdGhlIE5vZGVcbiAgICogICAgIHdpdGguIEZvciBhbiBFbGVtZW50LCBhbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZlxuICAgKiAgICAgdGhlIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC5cbiAgICogQHJldHVybiB7IU5vZGV9XG4gICAqL1xuICB2YXIgY3JlYXRlTm9kZSA9IGZ1bmN0aW9uIChkb2MsIG5vZGVOYW1lLCBrZXksIHN0YXRpY3MpIHtcbiAgICBpZiAobm9kZU5hbWUgPT09ICcjdGV4dCcpIHtcbiAgICAgIHJldHVybiBkb2MuY3JlYXRlVGV4dE5vZGUoJycpO1xuICAgIH1cblxuICAgIHJldHVybiBjcmVhdGVFbGVtZW50KGRvYywgbm9kZU5hbWUsIGtleSwgc3RhdGljcyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBtYXBwaW5nIHRoYXQgY2FuIGJlIHVzZWQgdG8gbG9vayB1cCBjaGlsZHJlbiB1c2luZyBhIGtleS5cbiAgICogQHBhcmFtIHshTm9kZX0gZWxcbiAgICogQHJldHVybiB7IU9iamVjdDxzdHJpbmcsICFFbGVtZW50Pn0gQSBtYXBwaW5nIG9mIGtleXMgdG8gdGhlIGNoaWxkcmVuIG9mIHRoZVxuICAgKiAgICAgRWxlbWVudC5cbiAgICovXG4gIHZhciBjcmVhdGVLZXlNYXAgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICB2YXIgbWFwID0gY3JlYXRlTWFwKCk7XG4gICAgdmFyIGNoaWxkcmVuID0gZWwuY2hpbGRyZW47XG4gICAgdmFyIGNvdW50ID0gY2hpbGRyZW4ubGVuZ3RoO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSArPSAxKSB7XG4gICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICAgIHZhciBrZXkgPSBnZXREYXRhKGNoaWxkKS5rZXk7XG5cbiAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgbWFwW2tleV0gPSBjaGlsZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbWFwO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIG1hcHBpbmcgb2Yga2V5IHRvIGNoaWxkIG5vZGUgZm9yIGEgZ2l2ZW4gRWxlbWVudCwgY3JlYXRpbmcgaXRcbiAgICogaWYgbmVjZXNzYXJ5LlxuICAgKiBAcGFyYW0geyFOb2RlfSBlbFxuICAgKiBAcmV0dXJuIHshT2JqZWN0PHN0cmluZywgIU5vZGU+fSBBIG1hcHBpbmcgb2Yga2V5cyB0byBjaGlsZCBFbGVtZW50c1xuICAgKi9cbiAgdmFyIGdldEtleU1hcCA9IGZ1bmN0aW9uIChlbCkge1xuICAgIHZhciBkYXRhID0gZ2V0RGF0YShlbCk7XG5cbiAgICBpZiAoIWRhdGEua2V5TWFwKSB7XG4gICAgICBkYXRhLmtleU1hcCA9IGNyZWF0ZUtleU1hcChlbCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGEua2V5TWFwO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYSBjaGlsZCBmcm9tIHRoZSBwYXJlbnQgd2l0aCB0aGUgZ2l2ZW4ga2V5LlxuICAgKiBAcGFyYW0geyFOb2RlfSBwYXJlbnRcbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5XG4gICAqIEByZXR1cm4gez9FbGVtZW50fSBUaGUgY2hpbGQgY29ycmVzcG9uZGluZyB0byB0aGUga2V5LlxuICAgKi9cbiAgdmFyIGdldENoaWxkID0gZnVuY3Rpb24gKHBhcmVudCwga2V5KSB7XG4gICAgcmV0dXJuICgvKiogQHR5cGUgez9FbGVtZW50fSAqL2tleSAmJiBnZXRLZXlNYXAocGFyZW50KVtrZXldXG4gICAgKTtcbiAgfTtcblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGFuIGVsZW1lbnQgYXMgYmVpbmcgYSBjaGlsZC4gVGhlIHBhcmVudCB3aWxsIGtlZXAgdHJhY2sgb2YgdGhlXG4gICAqIGNoaWxkIHVzaW5nIHRoZSBrZXkuIFRoZSBjaGlsZCBjYW4gYmUgcmV0cmlldmVkIHVzaW5nIHRoZSBzYW1lIGtleSB1c2luZ1xuICAgKiBnZXRLZXlNYXAuIFRoZSBwcm92aWRlZCBrZXkgc2hvdWxkIGJlIHVuaXF1ZSB3aXRoaW4gdGhlIHBhcmVudCBFbGVtZW50LlxuICAgKiBAcGFyYW0geyFOb2RlfSBwYXJlbnQgVGhlIHBhcmVudCBvZiBjaGlsZC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBBIGtleSB0byBpZGVudGlmeSB0aGUgY2hpbGQgd2l0aC5cbiAgICogQHBhcmFtIHshTm9kZX0gY2hpbGQgVGhlIGNoaWxkIHRvIHJlZ2lzdGVyLlxuICAgKi9cbiAgdmFyIHJlZ2lzdGVyQ2hpbGQgPSBmdW5jdGlvbiAocGFyZW50LCBrZXksIGNoaWxkKSB7XG4gICAgZ2V0S2V5TWFwKHBhcmVudClba2V5XSA9IGNoaWxkO1xuICB9O1xuXG4gIGlmICgnZGV2ZWxvcG1lbnQnICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAvKipcbiAgICAqIE1ha2VzIHN1cmUgdGhhdCBrZXllZCBFbGVtZW50IG1hdGNoZXMgdGhlIHRhZyBuYW1lIHByb3ZpZGVkLlxuICAgICogQHBhcmFtIHshRWxlbWVudH0gbm9kZSBUaGUgbm9kZSB0aGF0IGlzIGJlaW5nIG1hdGNoZWQuXG4gICAgKiBAcGFyYW0ge3N0cmluZz19IHRhZyBUaGUgdGFnIG5hbWUgb2YgdGhlIEVsZW1lbnQuXG4gICAgKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSBvZiB0aGUgRWxlbWVudC5cbiAgICAqL1xuICAgIHZhciBhc3NlcnRLZXllZFRhZ01hdGNoZXMgPSBmdW5jdGlvbiAobm9kZSwgdGFnLCBrZXkpIHtcbiAgICAgIHZhciBub2RlTmFtZSA9IGdldERhdGEobm9kZSkubm9kZU5hbWU7XG4gICAgICBpZiAobm9kZU5hbWUgIT09IHRhZykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dhcyBleHBlY3Rpbmcgbm9kZSB3aXRoIGtleSBcIicgKyBrZXkgKyAnXCIgdG8gYmUgYSAnICsgdGFnICsgJywgbm90IGEgJyArIG5vZGVOYW1lICsgJy4nKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIG9yIG5vdCBhIGdpdmVuIG5vZGUgbWF0Y2hlcyB0aGUgc3BlY2lmaWVkIG5vZGVOYW1lIGFuZCBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSB7IU5vZGV9IG5vZGUgQW4gSFRNTCBub2RlLCB0eXBpY2FsbHkgYW4gSFRNTEVsZW1lbnQgb3IgVGV4dC5cbiAgICogQHBhcmFtIHs/c3RyaW5nfSBub2RlTmFtZSBUaGUgbm9kZU5hbWUgZm9yIHRoaXMgbm9kZS5cbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IEFuIG9wdGlvbmFsIGtleSB0aGF0IGlkZW50aWZpZXMgYSBub2RlLlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSBub2RlIG1hdGNoZXMsIGZhbHNlIG90aGVyd2lzZS5cbiAgICovXG4gIHZhciBtYXRjaGVzID0gZnVuY3Rpb24gKG5vZGUsIG5vZGVOYW1lLCBrZXkpIHtcbiAgICB2YXIgZGF0YSA9IGdldERhdGEobm9kZSk7XG5cbiAgICAvLyBLZXkgY2hlY2sgaXMgZG9uZSB1c2luZyBkb3VibGUgZXF1YWxzIGFzIHdlIHdhbnQgdG8gdHJlYXQgYSBudWxsIGtleSB0aGVcbiAgICAvLyBzYW1lIGFzIHVuZGVmaW5lZC4gVGhpcyBzaG91bGQgYmUgb2theSBhcyB0aGUgb25seSB2YWx1ZXMgYWxsb3dlZCBhcmVcbiAgICAvLyBzdHJpbmdzLCBudWxsIGFuZCB1bmRlZmluZWQgc28gdGhlID09IHNlbWFudGljcyBhcmUgbm90IHRvbyB3ZWlyZC5cbiAgICByZXR1cm4ga2V5ID09IGRhdGEua2V5ICYmIG5vZGVOYW1lID09PSBkYXRhLm5vZGVOYW1lO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBbGlnbnMgdGhlIHZpcnR1YWwgRWxlbWVudCBkZWZpbml0aW9uIHdpdGggdGhlIGFjdHVhbCBET00sIG1vdmluZyB0aGVcbiAgICogY29ycmVzcG9uZGluZyBET00gbm9kZSB0byB0aGUgY29ycmVjdCBsb2NhdGlvbiBvciBjcmVhdGluZyBpdCBpZiBuZWNlc3NhcnkuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlTmFtZSBGb3IgYW4gRWxlbWVudCwgdGhpcyBzaG91bGQgYmUgYSB2YWxpZCB0YWcgc3RyaW5nLlxuICAgKiAgICAgRm9yIGEgVGV4dCwgdGhpcyBzaG91bGQgYmUgI3RleHQuXG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LlxuICAgKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgRm9yIGFuIEVsZW1lbnQsIHRoaXMgc2hvdWxkIGJlIGFuIGFycmF5IG9mXG4gICAqICAgICBuYW1lLXZhbHVlIHBhaXJzLlxuICAgKiBAcmV0dXJuIHshTm9kZX0gVGhlIG1hdGNoaW5nIG5vZGUuXG4gICAqL1xuICB2YXIgYWxpZ25XaXRoRE9NID0gZnVuY3Rpb24gKG5vZGVOYW1lLCBrZXksIHN0YXRpY3MpIHtcbiAgICB2YXIgY29udGV4dCA9IGdldENvbnRleHQoKTtcbiAgICB2YXIgd2Fsa2VyID0gY29udGV4dC53YWxrZXI7XG4gICAgdmFyIGN1cnJlbnROb2RlID0gd2Fsa2VyLmN1cnJlbnROb2RlO1xuICAgIHZhciBwYXJlbnQgPSB3YWxrZXIuZ2V0Q3VycmVudFBhcmVudCgpO1xuICAgIHZhciBtYXRjaGluZ05vZGU7XG5cbiAgICAvLyBDaGVjayB0byBzZWUgaWYgd2UgaGF2ZSBhIG5vZGUgdG8gcmV1c2VcbiAgICBpZiAoY3VycmVudE5vZGUgJiYgbWF0Y2hlcyhjdXJyZW50Tm9kZSwgbm9kZU5hbWUsIGtleSkpIHtcbiAgICAgIG1hdGNoaW5nTm9kZSA9IGN1cnJlbnROb2RlO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZXhpc3RpbmdOb2RlID0gZ2V0Q2hpbGQocGFyZW50LCBrZXkpO1xuXG4gICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIG5vZGUgaGFzIG1vdmVkIHdpdGhpbiB0aGUgcGFyZW50IG9yIGlmIGEgbmV3IG9uZVxuICAgICAgLy8gc2hvdWxkIGJlIGNyZWF0ZWRcbiAgICAgIGlmIChleGlzdGluZ05vZGUpIHtcbiAgICAgICAgaWYgKCdkZXZlbG9wbWVudCcgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICAgIGFzc2VydEtleWVkVGFnTWF0Y2hlcyhleGlzdGluZ05vZGUsIG5vZGVOYW1lLCBrZXkpO1xuICAgICAgICB9XG5cbiAgICAgICAgbWF0Y2hpbmdOb2RlID0gZXhpc3RpbmdOb2RlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWF0Y2hpbmdOb2RlID0gY3JlYXRlTm9kZShjb250ZXh0LmRvYywgbm9kZU5hbWUsIGtleSwgc3RhdGljcyk7XG5cbiAgICAgICAgaWYgKGtleSkge1xuICAgICAgICAgIHJlZ2lzdGVyQ2hpbGQocGFyZW50LCBrZXksIG1hdGNoaW5nTm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb250ZXh0Lm1hcmtDcmVhdGVkKG1hdGNoaW5nTm9kZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoZSBub2RlIGhhcyBhIGtleSwgcmVtb3ZlIGl0IGZyb20gdGhlIERPTSB0byBwcmV2ZW50IGEgbGFyZ2UgbnVtYmVyXG4gICAgICAvLyBvZiByZS1vcmRlcnMgaW4gdGhlIGNhc2UgdGhhdCBpdCBtb3ZlZCBmYXIgb3Igd2FzIGNvbXBsZXRlbHkgcmVtb3ZlZC5cbiAgICAgIC8vIFNpbmNlIHdlIGhvbGQgb24gdG8gYSByZWZlcmVuY2UgdGhyb3VnaCB0aGUga2V5TWFwLCB3ZSBjYW4gYWx3YXlzIGFkZCBpdFxuICAgICAgLy8gYmFjay5cbiAgICAgIGlmIChjdXJyZW50Tm9kZSAmJiBnZXREYXRhKGN1cnJlbnROb2RlKS5rZXkpIHtcbiAgICAgICAgcGFyZW50LnJlcGxhY2VDaGlsZChtYXRjaGluZ05vZGUsIGN1cnJlbnROb2RlKTtcbiAgICAgICAgZ2V0RGF0YShwYXJlbnQpLmtleU1hcFZhbGlkID0gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKG1hdGNoaW5nTm9kZSwgY3VycmVudE5vZGUpO1xuICAgICAgfVxuXG4gICAgICB3YWxrZXIuY3VycmVudE5vZGUgPSBtYXRjaGluZ05vZGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGNoaW5nTm9kZTtcbiAgfTtcblxuICAvKipcbiAgICogQ2xlYXJzIG91dCBhbnkgdW52aXNpdGVkIE5vZGVzLCBhcyB0aGUgY29ycmVzcG9uZGluZyB2aXJ0dWFsIGVsZW1lbnRcbiAgICogZnVuY3Rpb25zIHdlcmUgbmV2ZXIgY2FsbGVkIGZvciB0aGVtLlxuICAgKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAgICovXG4gIHZhciBjbGVhclVudmlzaXRlZERPTSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgdmFyIGNvbnRleHQgPSBnZXRDb250ZXh0KCk7XG4gICAgdmFyIHdhbGtlciA9IGNvbnRleHQud2Fsa2VyO1xuICAgIHZhciBkYXRhID0gZ2V0RGF0YShub2RlKTtcbiAgICB2YXIga2V5TWFwID0gZGF0YS5rZXlNYXA7XG4gICAgdmFyIGtleU1hcFZhbGlkID0gZGF0YS5rZXlNYXBWYWxpZDtcbiAgICB2YXIgbGFzdFZpc2l0ZWRDaGlsZCA9IGRhdGEubGFzdFZpc2l0ZWRDaGlsZDtcbiAgICB2YXIgY2hpbGQgPSBub2RlLmxhc3RDaGlsZDtcbiAgICB2YXIga2V5O1xuXG4gICAgZGF0YS5sYXN0VmlzaXRlZENoaWxkID0gbnVsbDtcblxuICAgIGlmIChjaGlsZCA9PT0gbGFzdFZpc2l0ZWRDaGlsZCAmJiBrZXlNYXBWYWxpZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChkYXRhLmF0dHJzW2V4cG9ydHMuc3ltYm9scy5wbGFjZWhvbGRlcl0gJiYgd2Fsa2VyLmN1cnJlbnROb2RlICE9PSB3YWxrZXIucm9vdCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHdoaWxlIChjaGlsZCAhPT0gbGFzdFZpc2l0ZWRDaGlsZCkge1xuICAgICAgbm9kZS5yZW1vdmVDaGlsZChjaGlsZCk7XG4gICAgICBjb250ZXh0Lm1hcmtEZWxldGVkKCAvKiogQHR5cGUgeyFOb2RlfSovY2hpbGQpO1xuXG4gICAgICBrZXkgPSBnZXREYXRhKGNoaWxkKS5rZXk7XG4gICAgICBpZiAoa2V5KSB7XG4gICAgICAgIGRlbGV0ZSBrZXlNYXBba2V5XTtcbiAgICAgIH1cbiAgICAgIGNoaWxkID0gbm9kZS5sYXN0Q2hpbGQ7XG4gICAgfVxuXG4gICAgLy8gQ2xlYW4gdGhlIGtleU1hcCwgcmVtb3ZpbmcgYW55IHVudXN1ZWQga2V5cy5cbiAgICBmb3IgKGtleSBpbiBrZXlNYXApIHtcbiAgICAgIGNoaWxkID0ga2V5TWFwW2tleV07XG4gICAgICBpZiAoIWNoaWxkLnBhcmVudE5vZGUpIHtcbiAgICAgICAgY29udGV4dC5tYXJrRGVsZXRlZChjaGlsZCk7XG4gICAgICAgIGRlbGV0ZSBrZXlNYXBba2V5XTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBkYXRhLmtleU1hcFZhbGlkID0gdHJ1ZTtcbiAgfTtcblxuICAvKipcbiAgICogRW50ZXJzIGFuIEVsZW1lbnQsIHNldHRpbmcgdGhlIGN1cnJlbnQgbmFtZXNwYWNlIGZvciBuZXN0ZWQgZWxlbWVudHMuXG4gICAqIEBwYXJhbSB7Tm9kZX0gbm9kZVxuICAgKi9cbiAgdmFyIGVudGVyTm9kZSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgdmFyIGRhdGEgPSBnZXREYXRhKG5vZGUpO1xuICAgIGVudGVyVGFnKGRhdGEubm9kZU5hbWUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBFeGl0cyBhbiBFbGVtZW50LCB1bndpbmRpbmcgdGhlIGN1cnJlbnQgbmFtZXNwYWNlIHRvIHRoZSBwcmV2aW91cyB2YWx1ZS5cbiAgICogQHBhcmFtIHtOb2RlfSBub2RlXG4gICAqL1xuICB2YXIgZXhpdE5vZGUgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIHZhciBkYXRhID0gZ2V0RGF0YShub2RlKTtcbiAgICBleGl0VGFnKGRhdGEubm9kZU5hbWUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBNYXJrcyBub2RlJ3MgcGFyZW50IGFzIGhhdmluZyB2aXNpdGVkIG5vZGUuXG4gICAqIEBwYXJhbSB7Tm9kZX0gbm9kZVxuICAgKi9cbiAgdmFyIG1hcmtWaXNpdGVkID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICB2YXIgY29udGV4dCA9IGdldENvbnRleHQoKTtcbiAgICB2YXIgd2Fsa2VyID0gY29udGV4dC53YWxrZXI7XG4gICAgdmFyIHBhcmVudCA9IHdhbGtlci5nZXRDdXJyZW50UGFyZW50KCk7XG4gICAgdmFyIGRhdGEgPSBnZXREYXRhKHBhcmVudCk7XG4gICAgZGF0YS5sYXN0VmlzaXRlZENoaWxkID0gbm9kZTtcbiAgfTtcblxuICAvKipcbiAgICogQ2hhbmdlcyB0byB0aGUgZmlyc3QgY2hpbGQgb2YgdGhlIGN1cnJlbnQgbm9kZS5cbiAgICovXG4gIHZhciBmaXJzdENoaWxkID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBjb250ZXh0ID0gZ2V0Q29udGV4dCgpO1xuICAgIHZhciB3YWxrZXIgPSBjb250ZXh0LndhbGtlcjtcbiAgICBlbnRlck5vZGUod2Fsa2VyLmN1cnJlbnROb2RlKTtcbiAgICB3YWxrZXIuZmlyc3RDaGlsZCgpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDaGFuZ2VzIHRvIHRoZSBuZXh0IHNpYmxpbmcgb2YgdGhlIGN1cnJlbnQgbm9kZS5cbiAgICovXG4gIHZhciBuZXh0U2libGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY29udGV4dCA9IGdldENvbnRleHQoKTtcbiAgICB2YXIgd2Fsa2VyID0gY29udGV4dC53YWxrZXI7XG4gICAgbWFya1Zpc2l0ZWQod2Fsa2VyLmN1cnJlbnROb2RlKTtcbiAgICB3YWxrZXIubmV4dFNpYmxpbmcoKTtcbiAgfTtcblxuICAvKipcbiAgICogQ2hhbmdlcyB0byB0aGUgcGFyZW50IG9mIHRoZSBjdXJyZW50IG5vZGUsIHJlbW92aW5nIGFueSB1bnZpc2l0ZWQgY2hpbGRyZW4uXG4gICAqL1xuICB2YXIgcGFyZW50Tm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY29udGV4dCA9IGdldENvbnRleHQoKTtcbiAgICB2YXIgd2Fsa2VyID0gY29udGV4dC53YWxrZXI7XG4gICAgd2Fsa2VyLnBhcmVudE5vZGUoKTtcbiAgICBleGl0Tm9kZSh3YWxrZXIuY3VycmVudE5vZGUpO1xuICB9O1xuXG4gIGlmICgnZGV2ZWxvcG1lbnQnICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICB2YXIgYXNzZXJ0Tm9VbmNsb3NlZFRhZ3MgPSBmdW5jdGlvbiAocm9vdCkge1xuICAgICAgdmFyIG9wZW5FbGVtZW50ID0gZ2V0Q29udGV4dCgpLndhbGtlci5nZXRDdXJyZW50UGFyZW50KCk7XG4gICAgICBpZiAoIW9wZW5FbGVtZW50KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIG9wZW5UYWdzID0gW107XG4gICAgICB3aGlsZSAob3BlbkVsZW1lbnQgJiYgb3BlbkVsZW1lbnQgIT09IHJvb3QpIHtcbiAgICAgICAgb3BlblRhZ3MucHVzaChvcGVuRWxlbWVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgb3BlbkVsZW1lbnQgPSBvcGVuRWxlbWVudC5wYXJlbnROb2RlO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ09uZSBvciBtb3JlIHRhZ3Mgd2VyZSBub3QgY2xvc2VkOlxcbicgKyBvcGVuVGFncy5qb2luKCdcXG4nKSk7XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQYXRjaGVzIHRoZSBkb2N1bWVudCBzdGFydGluZyBhdCBlbCB3aXRoIHRoZSBwcm92aWRlZCBmdW5jdGlvbi4gVGhpcyBmdW5jdGlvblxuICAgKiBtYXkgYmUgY2FsbGVkIGR1cmluZyBhbiBleGlzdGluZyBwYXRjaCBvcGVyYXRpb24uXG4gICAqIEBwYXJhbSB7IUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnR9IG5vZGUgVGhlIEVsZW1lbnQgb3IgRG9jdW1lbnRcbiAgICogICAgIHRvIHBhdGNoLlxuICAgKiBAcGFyYW0geyFmdW5jdGlvbihUKX0gZm4gQSBmdW5jdGlvbiBjb250YWluaW5nIGVsZW1lbnRPcGVuL2VsZW1lbnRDbG9zZS9ldGMuXG4gICAqICAgICBjYWxscyB0aGF0IGRlc2NyaWJlIHRoZSBET00uXG4gICAqIEBwYXJhbSB7VD19IGRhdGEgQW4gYXJndW1lbnQgcGFzc2VkIHRvIGZuIHRvIHJlcHJlc2VudCBET00gc3RhdGUuXG4gICAqIEB0ZW1wbGF0ZSBUXG4gICAqL1xuICBleHBvcnRzLnBhdGNoID0gZnVuY3Rpb24gKG5vZGUsIGZuLCBkYXRhKSB7XG4gICAgZW50ZXJDb250ZXh0KG5vZGUpO1xuXG4gICAgZmlyc3RDaGlsZCgpO1xuICAgIGZuKGRhdGEpO1xuICAgIHBhcmVudE5vZGUoKTtcbiAgICBjbGVhclVudmlzaXRlZERPTShub2RlKTtcblxuICAgIGlmICgnZGV2ZWxvcG1lbnQnICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIGFzc2VydE5vVW5jbG9zZWRUYWdzKG5vZGUpO1xuICAgIH1cblxuICAgIGdldENvbnRleHQoKS5ub3RpZnlDaGFuZ2VzKCk7XG4gICAgcmVzdG9yZUNvbnRleHQoKTtcbiAgfTtcblxuICAvKipcbiAgICogVGhlIG9mZnNldCBpbiB0aGUgdmlydHVhbCBlbGVtZW50IGRlY2xhcmF0aW9uIHdoZXJlIHRoZSBhdHRyaWJ1dGVzIGFyZVxuICAgKiBzcGVjaWZpZWQuXG4gICAqIEBjb25zdFxuICAgKi9cbiAgdmFyIEFUVFJJQlVURVNfT0ZGU0VUID0gMztcblxuICAvKipcbiAgICogQnVpbGRzIGFuIGFycmF5IG9mIGFyZ3VtZW50cyBmb3IgdXNlIHdpdGggZWxlbWVudE9wZW5TdGFydCwgYXR0ciBhbmRcbiAgICogZWxlbWVudE9wZW5FbmQuXG4gICAqIEBjb25zdCB7QXJyYXk8Kj59XG4gICAqL1xuICB2YXIgYXJnc0J1aWxkZXIgPSBbXTtcblxuICBpZiAoJ2RldmVsb3BtZW50JyAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgLyoqXG4gICAgICogS2VlcHMgdHJhY2sgd2hldGhlciBvciBub3Qgd2UgYXJlIGluIGFuIGF0dHJpYnV0ZXMgZGVjbGFyYXRpb24gKGFmdGVyXG4gICAgICogZWxlbWVudE9wZW5TdGFydCwgYnV0IGJlZm9yZSBlbGVtZW50T3BlbkVuZCkuXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAgdmFyIGluQXR0cmlidXRlcyA9IGZhbHNlO1xuXG4gICAgLyoqIE1ha2VzIHN1cmUgdGhhdCB0aGUgY2FsbGVyIGlzIG5vdCB3aGVyZSBhdHRyaWJ1dGVzIGFyZSBleHBlY3RlZC4gKi9cbiAgICB2YXIgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKGluQXR0cmlidXRlcykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dhcyBub3QgZXhwZWN0aW5nIGEgY2FsbCB0byBhdHRyIG9yIGVsZW1lbnRPcGVuRW5kLCAnICsgJ3RoZXkgbXVzdCBmb2xsb3cgYSBjYWxsIHRvIGVsZW1lbnRPcGVuU3RhcnQuJyk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8qKiBNYWtlcyBzdXJlIHRoYXQgdGhlIGNhbGxlciBpcyB3aGVyZSBhdHRyaWJ1dGVzIGFyZSBleHBlY3RlZC4gKi9cbiAgICB2YXIgYXNzZXJ0SW5BdHRyaWJ1dGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCFpbkF0dHJpYnV0ZXMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdXYXMgZXhwZWN0aW5nIGEgY2FsbCB0byBhdHRyIG9yIGVsZW1lbnRPcGVuRW5kLiAnICsgJ2VsZW1lbnRPcGVuU3RhcnQgbXVzdCBiZSBmb2xsb3dlZCBieSB6ZXJvIG9yIG1vcmUgY2FsbHMgdG8gYXR0ciwgJyArICd0aGVuIG9uZSBjYWxsIHRvIGVsZW1lbnRPcGVuRW5kLicpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBNYWtlcyBzdXJlIHRoYXQgcGxhY2Vob2xkZXJzIGhhdmUgYSBrZXkgc3BlY2lmaWVkLiBPdGhlcndpc2UsIGNvbmRpdGlvbmFsXG4gICAgICogcGxhY2Vob2xkZXJzIGFuZCBjb25kaXRpb25hbCBlbGVtZW50cyBuZXh0IHRvIHBsYWNlaG9sZGVycyB3aWxsIGNhdXNlXG4gICAgICogcGxhY2Vob2xkZXIgZWxlbWVudHMgdG8gYmUgcmUtdXNlZCBhcyBub24tcGxhY2Vob2xkZXJzIGFuZCB2aWNlIHZlcnNhLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAgICAgKi9cbiAgICB2YXIgYXNzZXJ0UGxhY2Vob2xkZXJLZXlTcGVjaWZpZWQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICBpZiAoIWtleSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsYWNlaG9sZGVyIGVsZW1lbnRzIG11c3QgaGF2ZSBhIGtleSBzcGVjaWZpZWQuJyk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE1ha2VzIHN1cmUgdGhhdCB0YWdzIGFyZSBjb3JyZWN0bHkgbmVzdGVkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0YWdcbiAgICAgKi9cbiAgICB2YXIgYXNzZXJ0Q2xvc2VNYXRjaGVzT3BlblRhZyA9IGZ1bmN0aW9uICh0YWcpIHtcbiAgICAgIHZhciBjb250ZXh0ID0gZ2V0Q29udGV4dCgpO1xuICAgICAgdmFyIHdhbGtlciA9IGNvbnRleHQud2Fsa2VyO1xuICAgICAgdmFyIGNsb3NpbmdOb2RlID0gd2Fsa2VyLmdldEN1cnJlbnRQYXJlbnQoKTtcbiAgICAgIHZhciBkYXRhID0gZ2V0RGF0YShjbG9zaW5nTm9kZSk7XG5cbiAgICAgIGlmICh0YWcgIT09IGRhdGEubm9kZU5hbWUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZWNlaXZlZCBhIGNhbGwgdG8gY2xvc2UgJyArIHRhZyArICcgYnV0ICcgKyBkYXRhLm5vZGVOYW1lICsgJyB3YXMgb3Blbi4nKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqIFVwZGF0ZXMgdGhlIHN0YXRlIHRvIGJlaW5nIGluIGFuIGF0dHJpYnV0ZSBkZWNsYXJhdGlvbi4gKi9cbiAgICB2YXIgc2V0SW5BdHRyaWJ1dGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgaW5BdHRyaWJ1dGVzID0gdHJ1ZTtcbiAgICB9O1xuXG4gICAgLyoqIFVwZGF0ZXMgdGhlIHN0YXRlIHRvIG5vdCBiZWluZyBpbiBhbiBhdHRyaWJ1dGUgZGVjbGFyYXRpb24uICovXG4gICAgdmFyIHNldE5vdEluQXR0cmlidXRlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGluQXR0cmlidXRlcyA9IGZhbHNlO1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gICAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAgICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gICAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAgICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gICAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gICAqIEBwYXJhbSB7Li4uKn0gdmFyX2FyZ3MgQXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlIGR5bmFtaWMgYXR0cmlidXRlc1xuICAgKiAgICAgZm9yIHRoZSBFbGVtZW50LlxuICAgKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAgICovXG4gIGV4cG9ydHMuZWxlbWVudE9wZW4gPSBmdW5jdGlvbiAodGFnLCBrZXksIHN0YXRpY3MsIHZhcl9hcmdzKSB7XG4gICAgaWYgKCdkZXZlbG9wbWVudCcgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzKCk7XG4gICAgfVxuXG4gICAgdmFyIG5vZGUgPSAvKiogQHR5cGUgeyFFbGVtZW50fSovYWxpZ25XaXRoRE9NKHRhZywga2V5LCBzdGF0aWNzKTtcbiAgICB2YXIgZGF0YSA9IGdldERhdGEobm9kZSk7XG5cbiAgICAvKlxuICAgICAqIENoZWNrcyB0byBzZWUgaWYgb25lIG9yIG1vcmUgYXR0cmlidXRlcyBoYXZlIGNoYW5nZWQgZm9yIGEgZ2l2ZW4gRWxlbWVudC5cbiAgICAgKiBXaGVuIG5vIGF0dHJpYnV0ZXMgaGF2ZSBjaGFuZ2VkLCB0aGlzIGlzIG11Y2ggZmFzdGVyIHRoYW4gY2hlY2tpbmcgZWFjaFxuICAgICAqIGluZGl2aWR1YWwgYXJndW1lbnQuIFdoZW4gYXR0cmlidXRlcyBoYXZlIGNoYW5nZWQsIHRoZSBvdmVyaGVhZCBvZiB0aGlzIGlzXG4gICAgICogbWluaW1hbC5cbiAgICAgKi9cbiAgICB2YXIgYXR0cnNBcnIgPSBkYXRhLmF0dHJzQXJyO1xuICAgIHZhciBhdHRyc0NoYW5nZWQgPSBmYWxzZTtcbiAgICB2YXIgaSA9IEFUVFJJQlVURVNfT0ZGU0VUO1xuICAgIHZhciBqID0gMDtcblxuICAgIGZvciAoOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAxLCBqICs9IDEpIHtcbiAgICAgIGlmIChhdHRyc0FycltqXSAhPT0gYXJndW1lbnRzW2ldKSB7XG4gICAgICAgIGF0dHJzQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAxLCBqICs9IDEpIHtcbiAgICAgIGF0dHJzQXJyW2pdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGlmIChqIDwgYXR0cnNBcnIubGVuZ3RoKSB7XG4gICAgICBhdHRyc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgYXR0cnNBcnIubGVuZ3RoID0gajtcbiAgICB9XG5cbiAgICAvKlxuICAgICAqIEFjdHVhbGx5IHBlcmZvcm0gdGhlIGF0dHJpYnV0ZSB1cGRhdGUuXG4gICAgICovXG4gICAgaWYgKGF0dHJzQ2hhbmdlZCkge1xuICAgICAgdmFyIGF0dHIsXG4gICAgICAgICAgbmV3QXR0cnMgPSBkYXRhLm5ld0F0dHJzO1xuXG4gICAgICBmb3IgKGF0dHIgaW4gbmV3QXR0cnMpIHtcbiAgICAgICAgbmV3QXR0cnNbYXR0cl0gPSB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIGZvciAoaSA9IEFUVFJJQlVURVNfT0ZGU0VUOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgIG5ld0F0dHJzW2FyZ3VtZW50c1tpXV0gPSBhcmd1bWVudHNbaSArIDFdO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGF0dHIgaW4gbmV3QXR0cnMpIHtcbiAgICAgICAgdXBkYXRlQXR0cmlidXRlKG5vZGUsIGF0dHIsIG5ld0F0dHJzW2F0dHJdKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmaXJzdENoaWxkKCk7XG4gICAgcmV0dXJuIG5vZGU7XG4gIH07XG5cbiAgLyoqXG4gICAqIERlY2xhcmVzIGEgdmlydHVhbCBFbGVtZW50IGF0IHRoZSBjdXJyZW50IGxvY2F0aW9uIGluIHRoZSBkb2N1bWVudC4gVGhpc1xuICAgKiBjb3JyZXNwb25kcyB0byBhbiBvcGVuaW5nIHRhZyBhbmQgYSBlbGVtZW50Q2xvc2UgdGFnIGlzIHJlcXVpcmVkLiBUaGlzIGlzXG4gICAqIGxpa2UgZWxlbWVudE9wZW4sIGJ1dCB0aGUgYXR0cmlidXRlcyBhcmUgZGVmaW5lZCB1c2luZyB0aGUgYXR0ciBmdW5jdGlvblxuICAgKiByYXRoZXIgdGhhbiBiZWluZyBwYXNzZWQgYXMgYXJndW1lbnRzLiBNdXN0IGJlIGZvbGxsb3dlZCBieSAwIG9yIG1vcmUgY2FsbHNcbiAgICogdG8gYXR0ciwgdGhlbiBhIGNhbGwgdG8gZWxlbWVudE9wZW5FbmQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICAgKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gICAqICAgICB3aGVuIGl0ZXJhdGluZyBvdmVyIGFuIGFycmF5IG9mIGl0ZW1zLlxuICAgKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gICAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICAgKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICAgKi9cbiAgZXhwb3J0cy5lbGVtZW50T3BlblN0YXJ0ID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzKSB7XG4gICAgaWYgKCdkZXZlbG9wbWVudCcgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzKCk7XG4gICAgICBzZXRJbkF0dHJpYnV0ZXMoKTtcbiAgICB9XG5cbiAgICBhcmdzQnVpbGRlclswXSA9IHRhZztcbiAgICBhcmdzQnVpbGRlclsxXSA9IGtleTtcbiAgICBhcmdzQnVpbGRlclsyXSA9IHN0YXRpY3M7XG4gIH07XG5cbiAgLyoqKlxuICAgKiBEZWZpbmVzIGEgdmlydHVhbCBhdHRyaWJ1dGUgYXQgdGhpcyBwb2ludCBvZiB0aGUgRE9NLiBUaGlzIGlzIG9ubHkgdmFsaWRcbiAgICogd2hlbiBjYWxsZWQgYmV0d2VlbiBlbGVtZW50T3BlblN0YXJ0IGFuZCBlbGVtZW50T3BlbkVuZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICogQHBhcmFtIHsqfSB2YWx1ZVxuICAgKi9cbiAgZXhwb3J0cy5hdHRyID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gICAgaWYgKCdkZXZlbG9wbWVudCcgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgYXNzZXJ0SW5BdHRyaWJ1dGVzKCk7XG4gICAgfVxuXG4gICAgYXJnc0J1aWxkZXIucHVzaChuYW1lLCB2YWx1ZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENsb3NlcyBhbiBvcGVuIHRhZyBzdGFydGVkIHdpdGggZWxlbWVudE9wZW5TdGFydC5cbiAgICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gICAqL1xuICBleHBvcnRzLmVsZW1lbnRPcGVuRW5kID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICgnZGV2ZWxvcG1lbnQnICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIGFzc2VydEluQXR0cmlidXRlcygpO1xuICAgICAgc2V0Tm90SW5BdHRyaWJ1dGVzKCk7XG4gICAgfVxuXG4gICAgdmFyIG5vZGUgPSBleHBvcnRzLmVsZW1lbnRPcGVuLmFwcGx5KG51bGwsIGFyZ3NCdWlsZGVyKTtcbiAgICBhcmdzQnVpbGRlci5sZW5ndGggPSAwO1xuICAgIHJldHVybiBub2RlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDbG9zZXMgYW4gb3BlbiB2aXJ0dWFsIEVsZW1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gICAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICAgKi9cbiAgZXhwb3J0cy5lbGVtZW50Q2xvc2UgPSBmdW5jdGlvbiAodGFnKSB7XG4gICAgaWYgKCdkZXZlbG9wbWVudCcgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzKCk7XG4gICAgICBhc3NlcnRDbG9zZU1hdGNoZXNPcGVuVGFnKHRhZyk7XG4gICAgfVxuXG4gICAgcGFyZW50Tm9kZSgpO1xuXG4gICAgdmFyIG5vZGUgPSAvKiogQHR5cGUgeyFFbGVtZW50fSAqL2dldENvbnRleHQoKS53YWxrZXIuY3VycmVudE5vZGU7XG5cbiAgICBjbGVhclVudmlzaXRlZERPTShub2RlKTtcblxuICAgIG5leHRTaWJsaW5nKCk7XG4gICAgcmV0dXJuIG5vZGU7XG4gIH07XG5cbiAgLyoqXG4gICAqIERlY2xhcmVzIGEgdmlydHVhbCBFbGVtZW50IGF0IHRoZSBjdXJyZW50IGxvY2F0aW9uIGluIHRoZSBkb2N1bWVudCB0aGF0IGhhc1xuICAgKiBubyBjaGlsZHJlbi5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gICAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAgICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gICAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAgICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gICAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gICAqIEBwYXJhbSB7Li4uKn0gdmFyX2FyZ3MgQXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlIGR5bmFtaWMgYXR0cmlidXRlc1xuICAgKiAgICAgZm9yIHRoZSBFbGVtZW50LlxuICAgKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAgICovXG4gIGV4cG9ydHMuZWxlbWVudFZvaWQgPSBmdW5jdGlvbiAodGFnLCBrZXksIHN0YXRpY3MsIHZhcl9hcmdzKSB7XG4gICAgdmFyIG5vZGUgPSBleHBvcnRzLmVsZW1lbnRPcGVuLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgZXhwb3J0cy5lbGVtZW50Q2xvc2UuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfTtcblxuICAvKipcbiAgICogRGVjbGFyZXMgYSB2aXJ0dWFsIEVsZW1lbnQgYXQgdGhlIGN1cnJlbnQgbG9jYXRpb24gaW4gdGhlIGRvY3VtZW50IHRoYXQgaXMgYVxuICAgKiBwbGFjZWhvbGRlciBlbGVtZW50LiBDaGlsZHJlbiBvZiB0aGlzIEVsZW1lbnQgY2FuIGJlIG1hbnVhbGx5IG1hbmFnZWQgYW5kXG4gICAqIHdpbGwgbm90IGJlIGNsZWFyZWQgYnkgdGhlIGxpYnJhcnkuXG4gICAqXG4gICAqIEEga2V5IG11c3QgYmUgc3BlY2lmaWVkIHRvIG1ha2Ugc3VyZSB0aGF0IHRoaXMgbm9kZSBpcyBjb3JyZWN0bHkgcHJlc2VydmVkXG4gICAqIGFjcm9zcyBhbGwgY29uZGl0aW9uYWxzLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuXG4gICAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAgICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gICAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gICAqIEBwYXJhbSB7Li4uKn0gdmFyX2FyZ3MgQXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlIGR5bmFtaWMgYXR0cmlidXRlc1xuICAgKiAgICAgZm9yIHRoZSBFbGVtZW50LlxuICAgKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAgICovXG4gIGV4cG9ydHMuZWxlbWVudFBsYWNlaG9sZGVyID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzLCB2YXJfYXJncykge1xuICAgIGlmICgnZGV2ZWxvcG1lbnQnICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIGFzc2VydFBsYWNlaG9sZGVyS2V5U3BlY2lmaWVkKGtleSk7XG4gICAgfVxuXG4gICAgdmFyIG5vZGUgPSBleHBvcnRzLmVsZW1lbnRPcGVuLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgdXBkYXRlQXR0cmlidXRlKG5vZGUsIGV4cG9ydHMuc3ltYm9scy5wbGFjZWhvbGRlciwgdHJ1ZSk7XG4gICAgZXhwb3J0cy5lbGVtZW50Q2xvc2UuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfTtcblxuICAvKipcbiAgICogRGVjbGFyZXMgYSB2aXJ0dWFsIFRleHQgYXQgdGhpcyBwb2ludCBpbiB0aGUgZG9jdW1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcnxib29sZWFufSB2YWx1ZSBUaGUgdmFsdWUgb2YgdGhlIFRleHQuXG4gICAqIEBwYXJhbSB7Li4uKGZ1bmN0aW9uKChzdHJpbmd8bnVtYmVyfGJvb2xlYW4pKTpzdHJpbmcpfSB2YXJfYXJnc1xuICAgKiAgICAgRnVuY3Rpb25zIHRvIGZvcm1hdCB0aGUgdmFsdWUgd2hpY2ggYXJlIGNhbGxlZCBvbmx5IHdoZW4gdGhlIHZhbHVlIGhhc1xuICAgKiAgICAgY2hhbmdlZC5cbiAgICogQHJldHVybiB7IVRleHR9IFRoZSBjb3JyZXNwb25kaW5nIHRleHQgbm9kZS5cbiAgICovXG4gIGV4cG9ydHMudGV4dCA9IGZ1bmN0aW9uICh2YWx1ZSwgdmFyX2FyZ3MpIHtcbiAgICBpZiAoJ2RldmVsb3BtZW50JyAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICBhc3NlcnROb3RJbkF0dHJpYnV0ZXMoKTtcbiAgICB9XG5cbiAgICB2YXIgbm9kZSA9IC8qKiBAdHlwZSB7IVRleHR9Ki9hbGlnbldpdGhET00oJyN0ZXh0JywgbnVsbCk7XG4gICAgdmFyIGRhdGEgPSBnZXREYXRhKG5vZGUpO1xuXG4gICAgaWYgKGRhdGEudGV4dCAhPT0gdmFsdWUpIHtcbiAgICAgIGRhdGEudGV4dCA9IC8qKiBAdHlwZSB7c3RyaW5nfSAqL3ZhbHVlO1xuXG4gICAgICB2YXIgZm9ybWF0dGVkID0gdmFsdWU7XG4gICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBmb3JtYXR0ZWQgPSBhcmd1bWVudHNbaV0oZm9ybWF0dGVkKTtcbiAgICAgIH1cblxuICAgICAgbm9kZS5kYXRhID0gZm9ybWF0dGVkO1xuICAgIH1cblxuICAgIG5leHRTaWJsaW5nKCk7XG4gICAgcmV0dXJuIG5vZGU7XG4gIH07XG59KTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluY3JlbWVudGFsLWRvbS5qcy5tYXAiLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kaXN0L2NsaWVudCcpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKlxuICAgIChoYXBpKW5lcyBXZWJTb2NrZXQgQ2xpZW50IChodHRwczovL2dpdGh1Yi5jb20vaGFwaWpzL25lcylcbiAgICBDb3B5cmlnaHQgKGMpIDIwMTUsIEVyYW4gSGFtbWVyIDxlcmFuQGhhbW1lci5pbz4gYW5kIG90aGVyIGNvbnRyaWJ1dG9yc1xuICAgIEJTRCBMaWNlbnNlZFxuKi9cblxudmFyIF90eXBlb2YgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIiA/IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH0gOiBmdW5jdGlvbiAob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07XG5cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXG4gICAgLy8gJGxhYjpjb3ZlcmFnZTpvZmYkXG5cbiAgICBpZiAoKHR5cGVvZiBleHBvcnRzID09PSAndW5kZWZpbmVkJyA/ICd1bmRlZmluZWQnIDogX3R5cGVvZihleHBvcnRzKSkgPT09ICdvYmplY3QnICYmICh0eXBlb2YgbW9kdWxlID09PSAndW5kZWZpbmVkJyA/ICd1bmRlZmluZWQnIDogX3R5cGVvZihtb2R1bGUpKSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7IC8vIEV4cG9ydCBpZiB1c2VkIGFzIGEgbW9kdWxlXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgICAgIGRlZmluZShmYWN0b3J5KTtcbiAgICAgICAgfSBlbHNlIGlmICgodHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnID8gJ3VuZGVmaW5lZCcgOiBfdHlwZW9mKGV4cG9ydHMpKSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGV4cG9ydHMubmVzID0gZmFjdG9yeSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcm9vdC5uZXMgPSBmYWN0b3J5KCk7XG4gICAgICAgIH1cblxuICAgIC8vICRsYWI6Y292ZXJhZ2U6b24kXG59KSh1bmRlZmluZWQsIGZ1bmN0aW9uICgpIHtcblxuICAgIC8vIFV0aWxpdGllc1xuXG4gICAgdmFyIHZlcnNpb24gPSAnMic7XG4gICAgdmFyIGlnbm9yZSA9IGZ1bmN0aW9uIGlnbm9yZSgpIHt9O1xuXG4gICAgdmFyIHBhcnNlID0gZnVuY3Rpb24gcGFyc2UobWVzc2FnZSwgbmV4dCkge1xuXG4gICAgICAgIHZhciBvYmogPSBudWxsO1xuICAgICAgICB2YXIgZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBvYmogPSBKU09OLnBhcnNlKG1lc3NhZ2UpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGVycm9yID0gbmV3IE5lc0Vycm9yKGVyciwgJ3Byb3RvY29sJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV4dChlcnJvciwgb2JqKTtcbiAgICB9O1xuXG4gICAgdmFyIHN0cmluZ2lmeSA9IGZ1bmN0aW9uIHN0cmluZ2lmeShtZXNzYWdlLCBuZXh0KSB7XG5cbiAgICAgICAgdmFyIHN0cmluZyA9IG51bGw7XG4gICAgICAgIHZhciBlcnJvciA9IG51bGw7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN0cmluZyA9IEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGVycm9yID0gbmV3IE5lc0Vycm9yKGVyciwgJ3VzZXInKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXh0KGVycm9yLCBzdHJpbmcpO1xuICAgIH07XG5cbiAgICB2YXIgTmVzRXJyb3IgPSBmdW5jdGlvbiBOZXNFcnJvcihlcnIsIHR5cGUpIHtcblxuICAgICAgICBpZiAodHlwZW9mIGVyciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGVyciA9IG5ldyBFcnJvcihlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgZXJyLnR5cGUgPSB0eXBlO1xuICAgICAgICByZXR1cm4gZXJyO1xuICAgIH07XG5cbiAgICAvLyBFcnJvciBjb2Rlc1xuXG4gICAgdmFyIGVycm9yQ29kZXMgPSB7XG4gICAgICAgIDEwMDA6ICdOb3JtYWwgY2xvc3VyZScsXG4gICAgICAgIDEwMDE6ICdHb2luZyBhd2F5JyxcbiAgICAgICAgMTAwMjogJ1Byb3RvY29sIGVycm9yJyxcbiAgICAgICAgMTAwMzogJ1Vuc3VwcG9ydGVkIGRhdGEnLFxuICAgICAgICAxMDA0OiAnUmVzZXJ2ZWQnLFxuICAgICAgICAxMDA1OiAnTm8gc3RhdHVzIHJlY2VpdmVkJyxcbiAgICAgICAgMTAwNjogJ0Fibm9ybWFsIGNsb3N1cmUnLFxuICAgICAgICAxMDA3OiAnSW52YWxpZCBmcmFtZSBwYXlsb2FkIGRhdGEnLFxuICAgICAgICAxMDA4OiAnUG9saWN5IHZpb2xhdGlvbicsXG4gICAgICAgIDEwMDk6ICdNZXNzYWdlIHRvbyBiaWcnLFxuICAgICAgICAxMDEwOiAnTWFuZGF0b3J5IGV4dGVuc2lvbicsXG4gICAgICAgIDEwMTE6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InLFxuICAgICAgICAxMDE1OiAnVExTIGhhbmRzaGFrZSdcbiAgICB9O1xuXG4gICAgLy8gQ2xpZW50XG5cbiAgICB2YXIgQ2xpZW50ID0gZnVuY3Rpb24gQ2xpZW50KHVybCwgb3B0aW9ucykge1xuXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgIC8vIENvbmZpZ3VyYXRpb25cblxuICAgICAgICB0aGlzLl91cmwgPSB1cmw7XG4gICAgICAgIHRoaXMuX3NldHRpbmdzID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5faGVhcnRiZWF0VGltZW91dCA9IGZhbHNlOyAvLyBTZXJ2ZXIgaGVhcnRiZWF0IGNvbmZpZ3VyYXRpb25cblxuICAgICAgICAvLyBTdGF0ZVxuXG4gICAgICAgIHRoaXMuX3dzID0gbnVsbDtcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5faWRzID0gMDsgLy8gSWQgY291bnRlclxuICAgICAgICB0aGlzLl9yZXF1ZXN0cyA9IHt9OyAvLyBpZCAtPiB7IGNhbGxiYWNrLCB0aW1lb3V0IH1cbiAgICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IHt9OyAvLyBwYXRoIC0+IFtjYWxsYmFja3NdXG4gICAgICAgIHRoaXMuX2hlYXJ0YmVhdCA9IG51bGw7XG5cbiAgICAgICAgLy8gRXZlbnRzXG5cbiAgICAgICAgdGhpcy5vbkVycm9yID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgfTsgLy8gR2VuZXJhbCBlcnJvciBjYWxsYmFjayAob25seSB3aGVuIGFuIGVycm9yIGNhbm5vdCBiZSBhc3NvY2lhdGVkIHdpdGggYSByZXF1ZXN0KVxuICAgICAgICB0aGlzLm9uQ29ubmVjdCA9IGlnbm9yZTsgLy8gQ2FsbGVkIHdoZW5ldmVyIGEgY29ubmVjdGlvbiBpcyBlc3RhYmxpc2hlZFxuICAgICAgICB0aGlzLm9uRGlzY29ubmVjdCA9IGlnbm9yZTsgLy8gQ2FsbGVkIHdoZW5ldmVyIGEgY29ubmVjdGlvbiBpcyBsb3N0OiBmdW5jdGlvbih3aWxsUmVjb25uZWN0KVxuICAgICAgICB0aGlzLm9uVXBkYXRlID0gaWdub3JlO1xuXG4gICAgICAgIC8vIFB1YmxpYyBwcm9wZXJ0aWVzXG5cbiAgICAgICAgdGhpcy5pZCA9IG51bGw7IC8vIEFzc2lnbmVkIHdoZW4gaGVsbG8gcmVzcG9uc2UgaXMgcmVjZWl2ZWRcbiAgICB9O1xuXG4gICAgQ2xpZW50LldlYlNvY2tldCA9IC8qICRsYWI6Y292ZXJhZ2U6b2ZmJCAqL3R5cGVvZiBXZWJTb2NrZXQgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IFdlYlNvY2tldDsgLyogJGxhYjpjb3ZlcmFnZTpvbiQgKi9cblxuICAgIENsaWVudC5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYWxsYmFjaykge1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBhcmd1bWVudHNbMF07XG4gICAgICAgICAgICBvcHRpb25zID0ge307XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy5yZWNvbm5lY3QgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAvLyBEZWZhdWx0cyB0byB0cnVlXG4gICAgICAgICAgICB0aGlzLl9yZWNvbm5lY3Rpb24gPSB7IC8vIE9wdGlvbnM6IHJlY29ubmVjdCwgZGVsYXksIG1heERlbGF5XG4gICAgICAgICAgICAgICAgd2FpdDogMCxcbiAgICAgICAgICAgICAgICBkZWxheTogb3B0aW9ucy5kZWxheSB8fCAxMDAwLCAvLyAxIHNlY29uZFxuICAgICAgICAgICAgICAgIG1heERlbGF5OiBvcHRpb25zLm1heERlbGF5IHx8IDUwMDAsIC8vIDUgc2Vjb25kc1xuICAgICAgICAgICAgICAgIHJldHJpZXM6IG9wdGlvbnMucmV0cmllcyB8fCBJbmZpbml0eSwgLy8gVW5saW1pdGVkXG4gICAgICAgICAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICAgICAgICAgICAgYXV0aDogb3B0aW9ucy5hdXRoLFxuICAgICAgICAgICAgICAgICAgICB0aW1lb3V0OiBvcHRpb25zLnRpbWVvdXRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2Nvbm5lY3Qob3B0aW9ucywgdHJ1ZSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLl9jb25uZWN0ID0gZnVuY3Rpb24gKG9wdGlvbnMsIGluaXRpYWwsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgdmFyIHNlbnRDYWxsYmFjayA9IGZhbHNlO1xuICAgICAgICB2YXIgdGltZW91dEhhbmRsZXIgPSBmdW5jdGlvbiB0aW1lb3V0SGFuZGxlcigpIHtcblxuICAgICAgICAgICAgc2VudENhbGxiYWNrID0gdHJ1ZTtcbiAgICAgICAgICAgIF90aGlzLl93cy5jbG9zZSgpO1xuICAgICAgICAgICAgY2FsbGJhY2sobmV3IE5lc0Vycm9yKCdDb25uZWN0aW9uIHRpbWVkIG91dCcsICd0aW1lb3V0JykpO1xuICAgICAgICAgICAgX3RoaXMuX2NsZWFudXAoKTtcbiAgICAgICAgICAgIGlmIChpbml0aWFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLl9yZWNvbm5lY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgdGltZW91dCA9IG9wdGlvbnMudGltZW91dCA/IHNldFRpbWVvdXQodGltZW91dEhhbmRsZXIsIG9wdGlvbnMudGltZW91dCkgOiBudWxsO1xuXG4gICAgICAgIHZhciB3cyA9IG5ldyBDbGllbnQuV2ViU29ja2V0KHRoaXMuX3VybCwgdGhpcy5fc2V0dGluZ3Mud3MpOyAvLyBTZXR0aW5ncyB1c2VkIGJ5IG5vZGUuanMgb25seVxuICAgICAgICB0aGlzLl93cyA9IHdzO1xuXG4gICAgICAgIHdzLm9ub3BlbiA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXG4gICAgICAgICAgICBpZiAoIXNlbnRDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHNlbnRDYWxsYmFjayA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLl9oZWxsbyhvcHRpb25zLmF1dGgsIGZ1bmN0aW9uIChlcnIpIHtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLnBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgX3RoaXMuX3N1YnNjcmlwdGlvbnNbZXJyLnBhdGhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5kaXNjb25uZWN0KCk7IC8vIFN0b3AgcmVjb25uZWN0aW9uIHdoZW4gdGhlIGhlbGxvIG1lc3NhZ2UgcmV0dXJucyBlcnJvclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5vbkNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgd3Mub25lcnJvciA9IGZ1bmN0aW9uIChldmVudCkge1xuXG4gICAgICAgICAgICB2YXIgZXJyID0gbmV3IE5lc0Vycm9yKCdTb2NrZXQgZXJyb3InLCAnd3MnKTtcblxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXG4gICAgICAgICAgICBpZiAoIXNlbnRDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHNlbnRDYWxsYmFjayA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5vbkVycm9yKGVycik7XG4gICAgICAgIH07XG5cbiAgICAgICAgd3Mub25jbG9zZSA9IGZ1bmN0aW9uIChldmVudCkge1xuXG4gICAgICAgICAgICB2YXIgbG9nID0ge1xuICAgICAgICAgICAgICAgIGNvZGU6IGV2ZW50LmNvZGUsXG4gICAgICAgICAgICAgICAgZXhwbGFuYXRpb246IGVycm9yQ29kZXNbZXZlbnQuY29kZV0gfHwgJ1Vua25vd24nLFxuICAgICAgICAgICAgICAgIHJlYXNvbjogZXZlbnQucmVhc29uLFxuICAgICAgICAgICAgICAgIHdhc0NsZWFuOiBldmVudC53YXNDbGVhblxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgX3RoaXMuX2NsZWFudXAoKTtcbiAgICAgICAgICAgIF90aGlzLm9uRGlzY29ubmVjdCghIShfdGhpcy5fcmVjb25uZWN0aW9uICYmIF90aGlzLl9yZWNvbm5lY3Rpb24ucmV0cmllcyA+PSAxKSwgbG9nKTtcbiAgICAgICAgICAgIF90aGlzLl9yZWNvbm5lY3QoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB3cy5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuXG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuX29uTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5kaXNjb25uZWN0ID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHRoaXMuX3JlY29ubmVjdGlvbiA9IG51bGw7XG5cbiAgICAgICAgaWYgKCF0aGlzLl93cykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX3dzLnJlYWR5U3RhdGUgPT09IENsaWVudC5XZWJTb2NrZXQuT1BFTiB8fCB0aGlzLl93cy5yZWFkeVN0YXRlID09PSBDbGllbnQuV2ViU29ja2V0LkNPTk5FQ1RJTkcpIHtcblxuICAgICAgICAgICAgdGhpcy5fd3MuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLl9jbGVhbnVwID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHZhciB3cyA9IHRoaXMuX3dzO1xuICAgICAgICBpZiAoIXdzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl93cyA9IG51bGw7XG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB3cy5vbm9wZW4gPSBudWxsO1xuICAgICAgICB3cy5vbmNsb3NlID0gbnVsbDtcbiAgICAgICAgd3Mub25lcnJvciA9IGlnbm9yZTtcbiAgICAgICAgd3Mub25tZXNzYWdlID0gbnVsbDtcblxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5faGVhcnRiZWF0KTtcblxuICAgICAgICAvLyBGbHVzaCBwZW5kaW5nIHJlcXVlc3RzXG5cbiAgICAgICAgdmFyIGVycm9yID0gbmV3IE5lc0Vycm9yKCdSZXF1ZXN0IGZhaWxlZCAtIHNlcnZlciBkaXNjb25uZWN0ZWQnLCAnZGlzY29ubmVjdCcpO1xuXG4gICAgICAgIHZhciBpZHMgPSBPYmplY3Qua2V5cyh0aGlzLl9yZXF1ZXN0cyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaWRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgaWQgPSBpZHNbaV07XG4gICAgICAgICAgICB2YXIgcmVxdWVzdCA9IHRoaXMuX3JlcXVlc3RzW2lkXTtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IHJlcXVlc3QuY2FsbGJhY2s7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQocmVxdWVzdC50aW1lb3V0KTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9yZXF1ZXN0c1tpZF07XG4gICAgICAgICAgICBjYWxsYmFjayhlcnJvcik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5fcmVjb25uZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgICAvLyBSZWNvbm5lY3RcblxuICAgICAgICBpZiAodGhpcy5fcmVjb25uZWN0aW9uKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fcmVjb25uZWN0aW9uLnJldHJpZXMgPCAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7IC8vIENsZWFyIF9yZWNvbm5lY3Rpb24gc3RhdGVcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC0tdGhpcy5fcmVjb25uZWN0aW9uLnJldHJpZXM7XG4gICAgICAgICAgICB0aGlzLl9yZWNvbm5lY3Rpb24ud2FpdCA9IHRoaXMuX3JlY29ubmVjdGlvbi53YWl0ICsgdGhpcy5fcmVjb25uZWN0aW9uLmRlbGF5O1xuXG4gICAgICAgICAgICB2YXIgdGltZW91dCA9IE1hdGgubWluKHRoaXMuX3JlY29ubmVjdGlvbi53YWl0LCB0aGlzLl9yZWNvbm5lY3Rpb24ubWF4RGVsYXkpO1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoIV90aGlzMi5fcmVjb25uZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBfdGhpczIuX2Nvbm5lY3QoX3RoaXMyLl9yZWNvbm5lY3Rpb24uc2V0dGluZ3MsIGZhbHNlLCBmdW5jdGlvbiAoZXJyKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMyLm9uRXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzMi5fY2xlYW51cCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzMi5fcmVjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIHRpbWVvdXQpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUucmVxdWVzdCA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYWxsYmFjaykge1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICBwYXRoOiBvcHRpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XG4gICAgICAgICAgICB0eXBlOiAncmVxdWVzdCcsXG4gICAgICAgICAgICBtZXRob2Q6IG9wdGlvbnMubWV0aG9kIHx8ICdHRVQnLFxuICAgICAgICAgICAgcGF0aDogb3B0aW9ucy5wYXRoLFxuICAgICAgICAgICAgaGVhZGVyczogb3B0aW9ucy5oZWFkZXJzLFxuICAgICAgICAgICAgcGF5bG9hZDogb3B0aW9ucy5wYXlsb2FkXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbmQocmVxdWVzdCwgdHJ1ZSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLm1lc3NhZ2UgPSBmdW5jdGlvbiAobWVzc2FnZSwgY2FsbGJhY2spIHtcblxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcbiAgICAgICAgICAgIHR5cGU6ICdtZXNzYWdlJyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fc2VuZChyZXF1ZXN0LCB0cnVlLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUuX3NlbmQgPSBmdW5jdGlvbiAocmVxdWVzdCwgdHJhY2ssIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBfdGhpczMgPSB0aGlzO1xuXG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgaWdub3JlO1xuXG4gICAgICAgIGlmICghdGhpcy5fd3MgfHwgdGhpcy5fd3MucmVhZHlTdGF0ZSAhPT0gQ2xpZW50LldlYlNvY2tldC5PUEVOKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgTmVzRXJyb3IoJ0ZhaWxlZCB0byBzZW5kIG1lc3NhZ2UgLSBzZXJ2ZXIgZGlzY29ubmVjdGVkJywgJ2Rpc2Nvbm5lY3QnKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXF1ZXN0LmlkID0gKyt0aGlzLl9pZHM7XG5cbiAgICAgICAgc3RyaW5naWZ5KHJlcXVlc3QsIGZ1bmN0aW9uIChlcnIsIGVuY29kZWQpIHtcblxuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJZ25vcmUgZXJyb3JzXG5cbiAgICAgICAgICAgIGlmICghdHJhY2spIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMzLl93cy5zZW5kKGVuY29kZWQpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IE5lc0Vycm9yKGVyciwgJ3dzJykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVHJhY2sgZXJyb3JzXG5cbiAgICAgICAgICAgIHZhciByZWNvcmQgPSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrLFxuICAgICAgICAgICAgICAgIHRpbWVvdXQ6IG51bGxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChfdGhpczMuX3NldHRpbmdzLnRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICByZWNvcmQudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAgICAgICAgIHJlY29yZC5jYWxsYmFjayA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHJlY29yZC50aW1lb3V0ID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IE5lc0Vycm9yKCdSZXF1ZXN0IHRpbWVkIG91dCcsICd0aW1lb3V0JykpO1xuICAgICAgICAgICAgICAgIH0sIF90aGlzMy5fc2V0dGluZ3MudGltZW91dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIF90aGlzMy5fcmVxdWVzdHNbcmVxdWVzdC5pZF0gPSByZWNvcmQ7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgX3RoaXMzLl93cy5zZW5kKGVuY29kZWQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzMy5fcmVxdWVzdHNbcmVxdWVzdC5pZF0udGltZW91dCk7XG4gICAgICAgICAgICAgICAgZGVsZXRlIF90aGlzMy5fcmVxdWVzdHNbcmVxdWVzdC5pZF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBOZXNFcnJvcihlcnIsICd3cycpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUuX2hlbGxvID0gZnVuY3Rpb24gKGF1dGgsIGNhbGxiYWNrKSB7XG5cbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XG4gICAgICAgICAgICB0eXBlOiAnaGVsbG8nLFxuICAgICAgICAgICAgdmVyc2lvbjogdmVyc2lvblxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChhdXRoKSB7XG4gICAgICAgICAgICByZXF1ZXN0LmF1dGggPSBhdXRoO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN1YnMgPSB0aGlzLnN1YnNjcmlwdGlvbnMoKTtcbiAgICAgICAgaWYgKHN1YnMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXF1ZXN0LnN1YnMgPSBzdWJzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbmQocmVxdWVzdCwgdHJ1ZSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLnN1YnNjcmlwdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuX3N1YnNjcmlwdGlvbnMpO1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uIChwYXRoLCBoYW5kbGVyLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgX3RoaXM0ID0gdGhpcztcblxuICAgICAgICBpZiAoIXBhdGggfHwgcGF0aFswXSAhPT0gJy8nKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgTmVzRXJyb3IoJ0ludmFsaWQgcGF0aCcsICd1c2VyJykpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN1YnMgPSB0aGlzLl9zdWJzY3JpcHRpb25zW3BhdGhdO1xuICAgICAgICBpZiAoc3Vicykge1xuXG4gICAgICAgICAgICAvLyBBbHJlYWR5IHN1YnNjcmliZWRcblxuICAgICAgICAgICAgaWYgKHN1YnMuaW5kZXhPZihoYW5kbGVyKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBzdWJzLnB1c2goaGFuZGxlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc3Vic2NyaXB0aW9uc1twYXRoXSA9IFtoYW5kbGVyXTtcblxuICAgICAgICBpZiAoIXRoaXMuX3dzIHx8IHRoaXMuX3dzLnJlYWR5U3RhdGUgIT09IENsaWVudC5XZWJTb2NrZXQuT1BFTikge1xuXG4gICAgICAgICAgICAvLyBRdWV1ZWQgc3Vic2NyaXB0aW9uXG5cbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XG4gICAgICAgICAgICB0eXBlOiAnc3ViJyxcbiAgICAgICAgICAgIHBhdGg6IHBhdGhcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fc2VuZChyZXF1ZXN0LCB0cnVlLCBmdW5jdGlvbiAoZXJyKSB7XG5cbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgX3RoaXM0Ll9zdWJzY3JpcHRpb25zW3BhdGhdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiAocGF0aCwgaGFuZGxlcikge1xuXG4gICAgICAgIGlmICghcGF0aCB8fCBwYXRoWzBdICE9PSAnLycpIHtcblxuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIobmV3IE5lc0Vycm9yKCdJbnZhbGlkIHBhdGgnLCAndXNlcicpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdWJzID0gdGhpcy5fc3Vic2NyaXB0aW9uc1twYXRoXTtcbiAgICAgICAgaWYgKCFzdWJzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3luYyA9IGZhbHNlO1xuICAgICAgICBpZiAoIWhhbmRsZXIpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9zdWJzY3JpcHRpb25zW3BhdGhdO1xuICAgICAgICAgICAgc3luYyA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgcG9zID0gc3Vicy5pbmRleE9mKGhhbmRsZXIpO1xuICAgICAgICAgICAgaWYgKHBvcyA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN1YnMuc3BsaWNlKHBvcywgMSk7XG4gICAgICAgICAgICBpZiAoIXN1YnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3N1YnNjcmlwdGlvbnNbcGF0aF07XG4gICAgICAgICAgICAgICAgc3luYyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXN5bmMgfHwgIXRoaXMuX3dzIHx8IHRoaXMuX3dzLnJlYWR5U3RhdGUgIT09IENsaWVudC5XZWJTb2NrZXQuT1BFTikge1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcbiAgICAgICAgICAgIHR5cGU6ICd1bnN1YicsXG4gICAgICAgICAgICBwYXRoOiBwYXRoXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbmQocmVxdWVzdCwgZmFsc2UpOyAvLyBJZ25vcmluZyBlcnJvcnMgYXMgdGhlIHN1YnNjcmlwdGlvbiBoYW5kbGVycyBhcmUgYWxyZWFkeSByZW1vdmVkXG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUuX29uTWVzc2FnZSA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgIHZhciBfdGhpczUgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuX2JlYXQoKTtcblxuICAgICAgICBwYXJzZShtZXNzYWdlLmRhdGEsIGZ1bmN0aW9uIChlcnIsIHVwZGF0ZSkge1xuXG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzNS5vbkVycm9yKGVycik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFJlY3JlYXRlIGVycm9yXG5cbiAgICAgICAgICAgIHZhciBlcnJvciA9IG51bGw7XG4gICAgICAgICAgICBpZiAodXBkYXRlLnN0YXR1c0NvZGUgJiYgdXBkYXRlLnN0YXR1c0NvZGUgPj0gNDAwICYmIHVwZGF0ZS5zdGF0dXNDb2RlIDw9IDU5OSkge1xuXG4gICAgICAgICAgICAgICAgZXJyb3IgPSBuZXcgTmVzRXJyb3IodXBkYXRlLnBheWxvYWQubWVzc2FnZSB8fCB1cGRhdGUucGF5bG9hZC5lcnJvciwgJ3NlcnZlcicpO1xuICAgICAgICAgICAgICAgIGVycm9yLnN0YXR1c0NvZGUgPSB1cGRhdGUuc3RhdHVzQ29kZTtcbiAgICAgICAgICAgICAgICBlcnJvci5kYXRhID0gdXBkYXRlLnBheWxvYWQ7XG4gICAgICAgICAgICAgICAgZXJyb3IuaGVhZGVycyA9IHVwZGF0ZS5oZWFkZXJzO1xuICAgICAgICAgICAgICAgIGVycm9yLnBhdGggPSB1cGRhdGUucGF0aDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gUGluZ1xuXG4gICAgICAgICAgICBpZiAodXBkYXRlLnR5cGUgPT09ICdwaW5nJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdGhpczUuX3NlbmQoeyB0eXBlOiAncGluZycgfSwgZmFsc2UpOyAvLyBJZ25vcmUgZXJyb3JzXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEJyb2FkY2FzdCBhbmQgdXBkYXRlXG5cbiAgICAgICAgICAgIGlmICh1cGRhdGUudHlwZSA9PT0gJ3VwZGF0ZScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXM1Lm9uVXBkYXRlKHVwZGF0ZS5tZXNzYWdlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gUHVibGlzaFxuXG4gICAgICAgICAgICBpZiAodXBkYXRlLnR5cGUgPT09ICdwdWInKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhhbmRsZXJzID0gX3RoaXM1Ll9zdWJzY3JpcHRpb25zW3VwZGF0ZS5wYXRoXTtcbiAgICAgICAgICAgICAgICBpZiAoaGFuZGxlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoYW5kbGVycy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlcnNbaV0odXBkYXRlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBMb29rdXAgY2FsbGJhY2sgKG1lc3NhZ2UgbXVzdCBpbmNsdWRlIGFuIGlkIGZyb20gdGhpcyBwb2ludClcblxuICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSBfdGhpczUuX3JlcXVlc3RzW3VwZGF0ZS5pZF07XG4gICAgICAgICAgICBpZiAoIXJlcXVlc3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXM1Lm9uRXJyb3IobmV3IE5lc0Vycm9yKCdSZWNlaXZlZCByZXNwb25zZSBmb3IgdW5rbm93biByZXF1ZXN0JywgJ3Byb3RvY29sJykpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSByZXF1ZXN0LmNhbGxiYWNrO1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHJlcXVlc3QudGltZW91dCk7XG4gICAgICAgICAgICBkZWxldGUgX3RoaXM1Ll9yZXF1ZXN0c1t1cGRhdGUuaWRdO1xuXG4gICAgICAgICAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuOyAvLyBSZXNwb25zZSByZWNlaXZlZCBhZnRlciB0aW1lb3V0XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFJlc3BvbnNlXG5cbiAgICAgICAgICAgIGlmICh1cGRhdGUudHlwZSA9PT0gJ3JlcXVlc3QnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yLCB1cGRhdGUucGF5bG9hZCwgdXBkYXRlLnN0YXR1c0NvZGUsIHVwZGF0ZS5oZWFkZXJzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ3VzdG9tIG1lc3NhZ2VcblxuICAgICAgICAgICAgaWYgKHVwZGF0ZS50eXBlID09PSAnbWVzc2FnZScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyb3IsIHVwZGF0ZS5tZXNzYWdlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQXV0aGVudGljYXRpb25cblxuICAgICAgICAgICAgaWYgKHVwZGF0ZS50eXBlID09PSAnaGVsbG8nKSB7XG4gICAgICAgICAgICAgICAgX3RoaXM1LmlkID0gdXBkYXRlLnNvY2tldDtcbiAgICAgICAgICAgICAgICBpZiAodXBkYXRlLmhlYXJ0YmVhdCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpczUuX2hlYXJ0YmVhdFRpbWVvdXQgPSB1cGRhdGUuaGVhcnRiZWF0LmludGVydmFsICsgdXBkYXRlLmhlYXJ0YmVhdC50aW1lb3V0O1xuICAgICAgICAgICAgICAgICAgICBfdGhpczUuX2JlYXQoKTsgLy8gQ2FsbCBhZ2FpbiBvbmNlIHRpbWVvdXQgaXMgc2V0XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU3Vic2NyaXB0aW9uc1xuXG4gICAgICAgICAgICBpZiAodXBkYXRlLnR5cGUgPT09ICdzdWInKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIF90aGlzNS5vbkVycm9yKG5ldyBOZXNFcnJvcignUmVjZWl2ZWQgdW5rbm93biByZXNwb25zZSB0eXBlOiAnICsgdXBkYXRlLnR5cGUsICdwcm90b2NvbCcpKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUuX2JlYXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpczYgPSB0aGlzO1xuXG4gICAgICAgIGlmICghdGhpcy5faGVhcnRiZWF0VGltZW91dCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2hlYXJ0YmVhdCk7XG5cbiAgICAgICAgdGhpcy5faGVhcnRiZWF0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIF90aGlzNi5vbkVycm9yKG5ldyBOZXNFcnJvcignRGlzY29ubmVjdGluZyBkdWUgdG8gaGVhcnRiZWF0IHRpbWVvdXQnLCAndGltZW91dCcpKTtcbiAgICAgICAgICAgIF90aGlzNi5fd3MuY2xvc2UoKTtcbiAgICAgICAgfSwgdGhpcy5faGVhcnRiZWF0VGltZW91dCk7XG4gICAgfTtcblxuICAgIC8vIEV4cG9zZSBpbnRlcmZhY2VcblxuICAgIHJldHVybiB7IENsaWVudDogQ2xpZW50IH07XG59KTtcbiIsIiAgLyogZ2xvYmFscyByZXF1aXJlLCBtb2R1bGUgKi9cblxuICAndXNlIHN0cmljdCc7XG5cbiAgLyoqXG4gICAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gICAqL1xuXG4gIHZhciBwYXRodG9SZWdleHAgPSByZXF1aXJlKCdwYXRoLXRvLXJlZ2V4cCcpO1xuXG4gIC8qKlxuICAgKiBNb2R1bGUgZXhwb3J0cy5cbiAgICovXG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBwYWdlO1xuXG4gIC8qKlxuICAgKiBEZXRlY3QgY2xpY2sgZXZlbnRcbiAgICovXG4gIHZhciBjbGlja0V2ZW50ID0gKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgZG9jdW1lbnQpICYmIGRvY3VtZW50Lm9udG91Y2hzdGFydCA/ICd0b3VjaHN0YXJ0JyA6ICdjbGljayc7XG5cbiAgLyoqXG4gICAqIFRvIHdvcmsgcHJvcGVybHkgd2l0aCB0aGUgVVJMXG4gICAqIGhpc3RvcnkubG9jYXRpb24gZ2VuZXJhdGVkIHBvbHlmaWxsIGluIGh0dHBzOi8vZ2l0aHViLmNvbS9kZXZvdGUvSFRNTDUtSGlzdG9yeS1BUElcbiAgICovXG5cbiAgdmFyIGxvY2F0aW9uID0gKCd1bmRlZmluZWQnICE9PSB0eXBlb2Ygd2luZG93KSAmJiAod2luZG93Lmhpc3RvcnkubG9jYXRpb24gfHwgd2luZG93LmxvY2F0aW9uKTtcblxuICAvKipcbiAgICogUGVyZm9ybSBpbml0aWFsIGRpc3BhdGNoLlxuICAgKi9cblxuICB2YXIgZGlzcGF0Y2ggPSB0cnVlO1xuXG5cbiAgLyoqXG4gICAqIERlY29kZSBVUkwgY29tcG9uZW50cyAocXVlcnkgc3RyaW5nLCBwYXRobmFtZSwgaGFzaCkuXG4gICAqIEFjY29tbW9kYXRlcyBib3RoIHJlZ3VsYXIgcGVyY2VudCBlbmNvZGluZyBhbmQgeC13d3ctZm9ybS11cmxlbmNvZGVkIGZvcm1hdC5cbiAgICovXG4gIHZhciBkZWNvZGVVUkxDb21wb25lbnRzID0gdHJ1ZTtcblxuICAvKipcbiAgICogQmFzZSBwYXRoLlxuICAgKi9cblxuICB2YXIgYmFzZSA9ICcnO1xuXG4gIC8qKlxuICAgKiBSdW5uaW5nIGZsYWcuXG4gICAqL1xuXG4gIHZhciBydW5uaW5nO1xuXG4gIC8qKlxuICAgKiBIYXNoQmFuZyBvcHRpb25cbiAgICovXG5cbiAgdmFyIGhhc2hiYW5nID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFByZXZpb3VzIGNvbnRleHQsIGZvciBjYXB0dXJpbmdcbiAgICogcGFnZSBleGl0IGV2ZW50cy5cbiAgICovXG5cbiAgdmFyIHByZXZDb250ZXh0O1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBgcGF0aGAgd2l0aCBjYWxsYmFjayBgZm4oKWAsXG4gICAqIG9yIHJvdXRlIGBwYXRoYCwgb3IgcmVkaXJlY3Rpb24sXG4gICAqIG9yIGBwYWdlLnN0YXJ0KClgLlxuICAgKlxuICAgKiAgIHBhZ2UoZm4pO1xuICAgKiAgIHBhZ2UoJyonLCBmbik7XG4gICAqICAgcGFnZSgnL3VzZXIvOmlkJywgbG9hZCwgdXNlcik7XG4gICAqICAgcGFnZSgnL3VzZXIvJyArIHVzZXIuaWQsIHsgc29tZTogJ3RoaW5nJyB9KTtcbiAgICogICBwYWdlKCcvdXNlci8nICsgdXNlci5pZCk7XG4gICAqICAgcGFnZSgnL2Zyb20nLCAnL3RvJylcbiAgICogICBwYWdlKCk7XG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfEZ1bmN0aW9ufSBwYXRoXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuLi4uXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHBhZ2UocGF0aCwgZm4pIHtcbiAgICAvLyA8Y2FsbGJhY2s+XG4gICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBwYXRoKSB7XG4gICAgICByZXR1cm4gcGFnZSgnKicsIHBhdGgpO1xuICAgIH1cblxuICAgIC8vIHJvdXRlIDxwYXRoPiB0byA8Y2FsbGJhY2sgLi4uPlxuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZm4pIHtcbiAgICAgIHZhciByb3V0ZSA9IG5ldyBSb3V0ZShwYXRoKTtcbiAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHBhZ2UuY2FsbGJhY2tzLnB1c2gocm91dGUubWlkZGxld2FyZShhcmd1bWVudHNbaV0pKTtcbiAgICAgIH1cbiAgICAgIC8vIHNob3cgPHBhdGg+IHdpdGggW3N0YXRlXVxuICAgIH0gZWxzZSBpZiAoJ3N0cmluZycgPT09IHR5cGVvZiBwYXRoKSB7XG4gICAgICBwYWdlWydzdHJpbmcnID09PSB0eXBlb2YgZm4gPyAncmVkaXJlY3QnIDogJ3Nob3cnXShwYXRoLCBmbik7XG4gICAgICAvLyBzdGFydCBbb3B0aW9uc11cbiAgICB9IGVsc2Uge1xuICAgICAgcGFnZS5zdGFydChwYXRoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGJhY2sgZnVuY3Rpb25zLlxuICAgKi9cblxuICBwYWdlLmNhbGxiYWNrcyA9IFtdO1xuICBwYWdlLmV4aXRzID0gW107XG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgcGF0aCBiZWluZyBwcm9jZXNzZWRcbiAgICogQHR5cGUge1N0cmluZ31cbiAgICovXG4gIHBhZ2UuY3VycmVudCA9ICcnO1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgcGFnZXMgbmF2aWdhdGVkIHRvLlxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKlxuICAgKiAgICAgcGFnZS5sZW4gPT0gMDtcbiAgICogICAgIHBhZ2UoJy9sb2dpbicpO1xuICAgKiAgICAgcGFnZS5sZW4gPT0gMTtcbiAgICovXG5cbiAgcGFnZS5sZW4gPSAwO1xuXG4gIC8qKlxuICAgKiBHZXQgb3Igc2V0IGJhc2VwYXRoIHRvIGBwYXRoYC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgcGFnZS5iYXNlID0gZnVuY3Rpb24ocGF0aCkge1xuICAgIGlmICgwID09PSBhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gYmFzZTtcbiAgICBiYXNlID0gcGF0aDtcbiAgfTtcblxuICAvKipcbiAgICogQmluZCB3aXRoIHRoZSBnaXZlbiBgb3B0aW9uc2AuXG4gICAqXG4gICAqIE9wdGlvbnM6XG4gICAqXG4gICAqICAgIC0gYGNsaWNrYCBiaW5kIHRvIGNsaWNrIGV2ZW50cyBbdHJ1ZV1cbiAgICogICAgLSBgcG9wc3RhdGVgIGJpbmQgdG8gcG9wc3RhdGUgW3RydWVdXG4gICAqICAgIC0gYGRpc3BhdGNoYCBwZXJmb3JtIGluaXRpYWwgZGlzcGF0Y2ggW3RydWVdXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIHBhZ2Uuc3RhcnQgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgaWYgKHJ1bm5pbmcpIHJldHVybjtcbiAgICBydW5uaW5nID0gdHJ1ZTtcbiAgICBpZiAoZmFsc2UgPT09IG9wdGlvbnMuZGlzcGF0Y2gpIGRpc3BhdGNoID0gZmFsc2U7XG4gICAgaWYgKGZhbHNlID09PSBvcHRpb25zLmRlY29kZVVSTENvbXBvbmVudHMpIGRlY29kZVVSTENvbXBvbmVudHMgPSBmYWxzZTtcbiAgICBpZiAoZmFsc2UgIT09IG9wdGlvbnMucG9wc3RhdGUpIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIG9ucG9wc3RhdGUsIGZhbHNlKTtcbiAgICBpZiAoZmFsc2UgIT09IG9wdGlvbnMuY2xpY2spIHtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoY2xpY2tFdmVudCwgb25jbGljaywgZmFsc2UpO1xuICAgIH1cbiAgICBpZiAodHJ1ZSA9PT0gb3B0aW9ucy5oYXNoYmFuZykgaGFzaGJhbmcgPSB0cnVlO1xuICAgIGlmICghZGlzcGF0Y2gpIHJldHVybjtcbiAgICB2YXIgdXJsID0gKGhhc2hiYW5nICYmIH5sb2NhdGlvbi5oYXNoLmluZGV4T2YoJyMhJykpID8gbG9jYXRpb24uaGFzaC5zdWJzdHIoMikgKyBsb2NhdGlvbi5zZWFyY2ggOiBsb2NhdGlvbi5wYXRobmFtZSArIGxvY2F0aW9uLnNlYXJjaCArIGxvY2F0aW9uLmhhc2g7XG4gICAgcGFnZS5yZXBsYWNlKHVybCwgbnVsbCwgdHJ1ZSwgZGlzcGF0Y2gpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBVbmJpbmQgY2xpY2sgYW5kIHBvcHN0YXRlIGV2ZW50IGhhbmRsZXJzLlxuICAgKlxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBwYWdlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXJ1bm5pbmcpIHJldHVybjtcbiAgICBwYWdlLmN1cnJlbnQgPSAnJztcbiAgICBwYWdlLmxlbiA9IDA7XG4gICAgcnVubmluZyA9IGZhbHNlO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoY2xpY2tFdmVudCwgb25jbGljaywgZmFsc2UpO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIG9ucG9wc3RhdGUsIGZhbHNlKTtcbiAgfTtcblxuICAvKipcbiAgICogU2hvdyBgcGF0aGAgd2l0aCBvcHRpb25hbCBgc3RhdGVgIG9iamVjdC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IHN0YXRlXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gZGlzcGF0Y2hcbiAgICogQHJldHVybiB7Q29udGV4dH1cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgcGFnZS5zaG93ID0gZnVuY3Rpb24ocGF0aCwgc3RhdGUsIGRpc3BhdGNoLCBwdXNoKSB7XG4gICAgdmFyIGN0eCA9IG5ldyBDb250ZXh0KHBhdGgsIHN0YXRlKTtcbiAgICBwYWdlLmN1cnJlbnQgPSBjdHgucGF0aDtcbiAgICBpZiAoZmFsc2UgIT09IGRpc3BhdGNoKSBwYWdlLmRpc3BhdGNoKGN0eCk7XG4gICAgaWYgKGZhbHNlICE9PSBjdHguaGFuZGxlZCAmJiBmYWxzZSAhPT0gcHVzaCkgY3R4LnB1c2hTdGF0ZSgpO1xuICAgIHJldHVybiBjdHg7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdvZXMgYmFjayBpbiB0aGUgaGlzdG9yeVxuICAgKiBCYWNrIHNob3VsZCBhbHdheXMgbGV0IHRoZSBjdXJyZW50IHJvdXRlIHB1c2ggc3RhdGUgYW5kIHRoZW4gZ28gYmFjay5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggLSBmYWxsYmFjayBwYXRoIHRvIGdvIGJhY2sgaWYgbm8gbW9yZSBoaXN0b3J5IGV4aXN0cywgaWYgdW5kZWZpbmVkIGRlZmF1bHRzIHRvIHBhZ2UuYmFzZVxuICAgKiBAcGFyYW0ge09iamVjdH0gW3N0YXRlXVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBwYWdlLmJhY2sgPSBmdW5jdGlvbihwYXRoLCBzdGF0ZSkge1xuICAgIGlmIChwYWdlLmxlbiA+IDApIHtcbiAgICAgIC8vIHRoaXMgbWF5IG5lZWQgbW9yZSB0ZXN0aW5nIHRvIHNlZSBpZiBhbGwgYnJvd3NlcnNcbiAgICAgIC8vIHdhaXQgZm9yIHRoZSBuZXh0IHRpY2sgdG8gZ28gYmFjayBpbiBoaXN0b3J5XG4gICAgICBoaXN0b3J5LmJhY2soKTtcbiAgICAgIHBhZ2UubGVuLS07XG4gICAgfSBlbHNlIGlmIChwYXRoKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBwYWdlLnNob3cocGF0aCwgc3RhdGUpO1xuICAgICAgfSk7XG4gICAgfWVsc2V7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBwYWdlLnNob3coYmFzZSwgc3RhdGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIHJvdXRlIHRvIHJlZGlyZWN0IGZyb20gb25lIHBhdGggdG8gb3RoZXJcbiAgICogb3IganVzdCByZWRpcmVjdCB0byBhbm90aGVyIHJvdXRlXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBmcm9tIC0gaWYgcGFyYW0gJ3RvJyBpcyB1bmRlZmluZWQgcmVkaXJlY3RzIHRvICdmcm9tJ1xuICAgKiBAcGFyYW0ge1N0cmluZ30gW3RvXVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cbiAgcGFnZS5yZWRpcmVjdCA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gICAgLy8gRGVmaW5lIHJvdXRlIGZyb20gYSBwYXRoIHRvIGFub3RoZXJcbiAgICBpZiAoJ3N0cmluZycgPT09IHR5cGVvZiBmcm9tICYmICdzdHJpbmcnID09PSB0eXBlb2YgdG8pIHtcbiAgICAgIHBhZ2UoZnJvbSwgZnVuY3Rpb24oZSkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHBhZ2UucmVwbGFjZSh0byk7XG4gICAgICAgIH0sIDApO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gV2FpdCBmb3IgdGhlIHB1c2ggc3RhdGUgYW5kIHJlcGxhY2UgaXQgd2l0aCBhbm90aGVyXG4gICAgaWYgKCdzdHJpbmcnID09PSB0eXBlb2YgZnJvbSAmJiAndW5kZWZpbmVkJyA9PT0gdHlwZW9mIHRvKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBwYWdlLnJlcGxhY2UoZnJvbSk7XG4gICAgICB9LCAwKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlcGxhY2UgYHBhdGhgIHdpdGggb3B0aW9uYWwgYHN0YXRlYCBvYmplY3QuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzdGF0ZVxuICAgKiBAcmV0dXJuIHtDb250ZXh0fVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuXG4gIHBhZ2UucmVwbGFjZSA9IGZ1bmN0aW9uKHBhdGgsIHN0YXRlLCBpbml0LCBkaXNwYXRjaCkge1xuICAgIHZhciBjdHggPSBuZXcgQ29udGV4dChwYXRoLCBzdGF0ZSk7XG4gICAgcGFnZS5jdXJyZW50ID0gY3R4LnBhdGg7XG4gICAgY3R4LmluaXQgPSBpbml0O1xuICAgIGN0eC5zYXZlKCk7IC8vIHNhdmUgYmVmb3JlIGRpc3BhdGNoaW5nLCB3aGljaCBtYXkgcmVkaXJlY3RcbiAgICBpZiAoZmFsc2UgIT09IGRpc3BhdGNoKSBwYWdlLmRpc3BhdGNoKGN0eCk7XG4gICAgcmV0dXJuIGN0eDtcbiAgfTtcblxuICAvKipcbiAgICogRGlzcGF0Y2ggdGhlIGdpdmVuIGBjdHhgLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gY3R4XG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBwYWdlLmRpc3BhdGNoID0gZnVuY3Rpb24oY3R4KSB7XG4gICAgdmFyIHByZXYgPSBwcmV2Q29udGV4dCxcbiAgICAgIGkgPSAwLFxuICAgICAgaiA9IDA7XG5cbiAgICBwcmV2Q29udGV4dCA9IGN0eDtcblxuICAgIGZ1bmN0aW9uIG5leHRFeGl0KCkge1xuICAgICAgdmFyIGZuID0gcGFnZS5leGl0c1tqKytdO1xuICAgICAgaWYgKCFmbikgcmV0dXJuIG5leHRFbnRlcigpO1xuICAgICAgZm4ocHJldiwgbmV4dEV4aXQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5leHRFbnRlcigpIHtcbiAgICAgIHZhciBmbiA9IHBhZ2UuY2FsbGJhY2tzW2krK107XG5cbiAgICAgIGlmIChjdHgucGF0aCAhPT0gcGFnZS5jdXJyZW50KSB7XG4gICAgICAgIGN0eC5oYW5kbGVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICghZm4pIHJldHVybiB1bmhhbmRsZWQoY3R4KTtcbiAgICAgIGZuKGN0eCwgbmV4dEVudGVyKTtcbiAgICB9XG5cbiAgICBpZiAocHJldikge1xuICAgICAgbmV4dEV4aXQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV4dEVudGVyKCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBVbmhhbmRsZWQgYGN0eGAuIFdoZW4gaXQncyBub3QgdGhlIGluaXRpYWxcbiAgICogcG9wc3RhdGUgdGhlbiByZWRpcmVjdC4gSWYgeW91IHdpc2ggdG8gaGFuZGxlXG4gICAqIDQwNHMgb24geW91ciBvd24gdXNlIGBwYWdlKCcqJywgY2FsbGJhY2spYC5cbiAgICpcbiAgICogQHBhcmFtIHtDb250ZXh0fSBjdHhcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHVuaGFuZGxlZChjdHgpIHtcbiAgICBpZiAoY3R4LmhhbmRsZWQpIHJldHVybjtcbiAgICB2YXIgY3VycmVudDtcblxuICAgIGlmIChoYXNoYmFuZykge1xuICAgICAgY3VycmVudCA9IGJhc2UgKyBsb2NhdGlvbi5oYXNoLnJlcGxhY2UoJyMhJywgJycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjdXJyZW50ID0gbG9jYXRpb24ucGF0aG5hbWUgKyBsb2NhdGlvbi5zZWFyY2g7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnQgPT09IGN0eC5jYW5vbmljYWxQYXRoKSByZXR1cm47XG4gICAgcGFnZS5zdG9wKCk7XG4gICAgY3R4LmhhbmRsZWQgPSBmYWxzZTtcbiAgICBsb2NhdGlvbi5ocmVmID0gY3R4LmNhbm9uaWNhbFBhdGg7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYW4gZXhpdCByb3V0ZSBvbiBgcGF0aGAgd2l0aFxuICAgKiBjYWxsYmFjayBgZm4oKWAsIHdoaWNoIHdpbGwgYmUgY2FsbGVkXG4gICAqIG9uIHRoZSBwcmV2aW91cyBjb250ZXh0IHdoZW4gYSBuZXdcbiAgICogcGFnZSBpcyB2aXNpdGVkLlxuICAgKi9cbiAgcGFnZS5leGl0ID0gZnVuY3Rpb24ocGF0aCwgZm4pIHtcbiAgICBpZiAodHlwZW9mIHBhdGggPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBwYWdlLmV4aXQoJyonLCBwYXRoKTtcbiAgICB9XG5cbiAgICB2YXIgcm91dGUgPSBuZXcgUm91dGUocGF0aCk7XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHBhZ2UuZXhpdHMucHVzaChyb3V0ZS5taWRkbGV3YXJlKGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogUmVtb3ZlIFVSTCBlbmNvZGluZyBmcm9tIHRoZSBnaXZlbiBgc3RyYC5cbiAgICogQWNjb21tb2RhdGVzIHdoaXRlc3BhY2UgaW4gYm90aCB4LXd3dy1mb3JtLXVybGVuY29kZWRcbiAgICogYW5kIHJlZ3VsYXIgcGVyY2VudC1lbmNvZGVkIGZvcm0uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyfSBVUkwgY29tcG9uZW50IHRvIGRlY29kZVxuICAgKi9cbiAgZnVuY3Rpb24gZGVjb2RlVVJMRW5jb2RlZFVSSUNvbXBvbmVudCh2YWwpIHtcbiAgICBpZiAodHlwZW9mIHZhbCAhPT0gJ3N0cmluZycpIHsgcmV0dXJuIHZhbDsgfVxuICAgIHJldHVybiBkZWNvZGVVUkxDb21wb25lbnRzID8gZGVjb2RlVVJJQ29tcG9uZW50KHZhbC5yZXBsYWNlKC9cXCsvZywgJyAnKSkgOiB2YWw7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBhIG5ldyBcInJlcXVlc3RcIiBgQ29udGV4dGBcbiAgICogd2l0aCB0aGUgZ2l2ZW4gYHBhdGhgIGFuZCBvcHRpb25hbCBpbml0aWFsIGBzdGF0ZWAuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzdGF0ZVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBmdW5jdGlvbiBDb250ZXh0KHBhdGgsIHN0YXRlKSB7XG4gICAgaWYgKCcvJyA9PT0gcGF0aFswXSAmJiAwICE9PSBwYXRoLmluZGV4T2YoYmFzZSkpIHBhdGggPSBiYXNlICsgKGhhc2hiYW5nID8gJyMhJyA6ICcnKSArIHBhdGg7XG4gICAgdmFyIGkgPSBwYXRoLmluZGV4T2YoJz8nKTtcblxuICAgIHRoaXMuY2Fub25pY2FsUGF0aCA9IHBhdGg7XG4gICAgdGhpcy5wYXRoID0gcGF0aC5yZXBsYWNlKGJhc2UsICcnKSB8fCAnLyc7XG4gICAgaWYgKGhhc2hiYW5nKSB0aGlzLnBhdGggPSB0aGlzLnBhdGgucmVwbGFjZSgnIyEnLCAnJykgfHwgJy8nO1xuXG4gICAgdGhpcy50aXRsZSA9IGRvY3VtZW50LnRpdGxlO1xuICAgIHRoaXMuc3RhdGUgPSBzdGF0ZSB8fCB7fTtcbiAgICB0aGlzLnN0YXRlLnBhdGggPSBwYXRoO1xuICAgIHRoaXMucXVlcnlzdHJpbmcgPSB+aSA/IGRlY29kZVVSTEVuY29kZWRVUklDb21wb25lbnQocGF0aC5zbGljZShpICsgMSkpIDogJyc7XG4gICAgdGhpcy5wYXRobmFtZSA9IGRlY29kZVVSTEVuY29kZWRVUklDb21wb25lbnQofmkgPyBwYXRoLnNsaWNlKDAsIGkpIDogcGF0aCk7XG4gICAgdGhpcy5wYXJhbXMgPSB7fTtcblxuICAgIC8vIGZyYWdtZW50XG4gICAgdGhpcy5oYXNoID0gJyc7XG4gICAgaWYgKCFoYXNoYmFuZykge1xuICAgICAgaWYgKCF+dGhpcy5wYXRoLmluZGV4T2YoJyMnKSkgcmV0dXJuO1xuICAgICAgdmFyIHBhcnRzID0gdGhpcy5wYXRoLnNwbGl0KCcjJyk7XG4gICAgICB0aGlzLnBhdGggPSBwYXJ0c1swXTtcbiAgICAgIHRoaXMuaGFzaCA9IGRlY29kZVVSTEVuY29kZWRVUklDb21wb25lbnQocGFydHNbMV0pIHx8ICcnO1xuICAgICAgdGhpcy5xdWVyeXN0cmluZyA9IHRoaXMucXVlcnlzdHJpbmcuc3BsaXQoJyMnKVswXTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXhwb3NlIGBDb250ZXh0YC5cbiAgICovXG5cbiAgcGFnZS5Db250ZXh0ID0gQ29udGV4dDtcblxuICAvKipcbiAgICogUHVzaCBzdGF0ZS5cbiAgICpcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIENvbnRleHQucHJvdG90eXBlLnB1c2hTdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHBhZ2UubGVuKys7XG4gICAgaGlzdG9yeS5wdXNoU3RhdGUodGhpcy5zdGF0ZSwgdGhpcy50aXRsZSwgaGFzaGJhbmcgJiYgdGhpcy5wYXRoICE9PSAnLycgPyAnIyEnICsgdGhpcy5wYXRoIDogdGhpcy5jYW5vbmljYWxQYXRoKTtcbiAgfTtcblxuICAvKipcbiAgICogU2F2ZSB0aGUgY29udGV4dCBzdGF0ZS5cbiAgICpcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgQ29udGV4dC5wcm90b3R5cGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGhpc3RvcnkucmVwbGFjZVN0YXRlKHRoaXMuc3RhdGUsIHRoaXMudGl0bGUsIGhhc2hiYW5nICYmIHRoaXMucGF0aCAhPT0gJy8nID8gJyMhJyArIHRoaXMucGF0aCA6IHRoaXMuY2Fub25pY2FsUGF0aCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgYFJvdXRlYCB3aXRoIHRoZSBnaXZlbiBIVFRQIGBwYXRoYCxcbiAgICogYW5kIGFuIGFycmF5IG9mIGBjYWxsYmFja3NgIGFuZCBgb3B0aW9uc2AuXG4gICAqXG4gICAqIE9wdGlvbnM6XG4gICAqXG4gICAqICAgLSBgc2Vuc2l0aXZlYCAgICBlbmFibGUgY2FzZS1zZW5zaXRpdmUgcm91dGVzXG4gICAqICAgLSBgc3RyaWN0YCAgICAgICBlbmFibGUgc3RyaWN0IG1hdGNoaW5nIGZvciB0cmFpbGluZyBzbGFzaGVzXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLlxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgZnVuY3Rpb24gUm91dGUocGF0aCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMucGF0aCA9IChwYXRoID09PSAnKicpID8gJyguKiknIDogcGF0aDtcbiAgICB0aGlzLm1ldGhvZCA9ICdHRVQnO1xuICAgIHRoaXMucmVnZXhwID0gcGF0aHRvUmVnZXhwKHRoaXMucGF0aCxcbiAgICAgIHRoaXMua2V5cyA9IFtdLFxuICAgICAgb3B0aW9ucy5zZW5zaXRpdmUsXG4gICAgICBvcHRpb25zLnN0cmljdCk7XG4gIH1cblxuICAvKipcbiAgICogRXhwb3NlIGBSb3V0ZWAuXG4gICAqL1xuXG4gIHBhZ2UuUm91dGUgPSBSb3V0ZTtcblxuICAvKipcbiAgICogUmV0dXJuIHJvdXRlIG1pZGRsZXdhcmUgd2l0aFxuICAgKiB0aGUgZ2l2ZW4gY2FsbGJhY2sgYGZuKClgLlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgUm91dGUucHJvdG90eXBlLm1pZGRsZXdhcmUgPSBmdW5jdGlvbihmbikge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICByZXR1cm4gZnVuY3Rpb24oY3R4LCBuZXh0KSB7XG4gICAgICBpZiAoc2VsZi5tYXRjaChjdHgucGF0aCwgY3R4LnBhcmFtcykpIHJldHVybiBmbihjdHgsIG5leHQpO1xuICAgICAgbmV4dCgpO1xuICAgIH07XG4gIH07XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRoaXMgcm91dGUgbWF0Y2hlcyBgcGF0aGAsIGlmIHNvXG4gICAqIHBvcHVsYXRlIGBwYXJhbXNgLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBSb3V0ZS5wcm90b3R5cGUubWF0Y2ggPSBmdW5jdGlvbihwYXRoLCBwYXJhbXMpIHtcbiAgICB2YXIga2V5cyA9IHRoaXMua2V5cyxcbiAgICAgIHFzSW5kZXggPSBwYXRoLmluZGV4T2YoJz8nKSxcbiAgICAgIHBhdGhuYW1lID0gfnFzSW5kZXggPyBwYXRoLnNsaWNlKDAsIHFzSW5kZXgpIDogcGF0aCxcbiAgICAgIG0gPSB0aGlzLnJlZ2V4cC5leGVjKGRlY29kZVVSSUNvbXBvbmVudChwYXRobmFtZSkpO1xuXG4gICAgaWYgKCFtKSByZXR1cm4gZmFsc2U7XG5cbiAgICBmb3IgKHZhciBpID0gMSwgbGVuID0gbS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgdmFyIGtleSA9IGtleXNbaSAtIDFdO1xuICAgICAgdmFyIHZhbCA9IGRlY29kZVVSTEVuY29kZWRVUklDb21wb25lbnQobVtpXSk7XG4gICAgICBpZiAodmFsICE9PSB1bmRlZmluZWQgfHwgIShoYXNPd25Qcm9wZXJ0eS5jYWxsKHBhcmFtcywga2V5Lm5hbWUpKSkge1xuICAgICAgICBwYXJhbXNba2V5Lm5hbWVdID0gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIEhhbmRsZSBcInBvcHVsYXRlXCIgZXZlbnRzLlxuICAgKi9cblxuICB2YXIgb25wb3BzdGF0ZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxvYWRlZCA9IGZhbHNlO1xuICAgIGlmICgndW5kZWZpbmVkJyA9PT0gdHlwZW9mIHdpbmRvdykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuICAgICAgbG9hZGVkID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBsb2FkZWQgPSB0cnVlO1xuICAgICAgICB9LCAwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gb25wb3BzdGF0ZShlKSB7XG4gICAgICBpZiAoIWxvYWRlZCkgcmV0dXJuO1xuICAgICAgaWYgKGUuc3RhdGUpIHtcbiAgICAgICAgdmFyIHBhdGggPSBlLnN0YXRlLnBhdGg7XG4gICAgICAgIHBhZ2UucmVwbGFjZShwYXRoLCBlLnN0YXRlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhZ2Uuc2hvdyhsb2NhdGlvbi5wYXRobmFtZSArIGxvY2F0aW9uLmhhc2gsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfTtcbiAgfSkoKTtcbiAgLyoqXG4gICAqIEhhbmRsZSBcImNsaWNrXCIgZXZlbnRzLlxuICAgKi9cblxuICBmdW5jdGlvbiBvbmNsaWNrKGUpIHtcblxuICAgIGlmICgxICE9PSB3aGljaChlKSkgcmV0dXJuO1xuXG4gICAgaWYgKGUubWV0YUtleSB8fCBlLmN0cmxLZXkgfHwgZS5zaGlmdEtleSkgcmV0dXJuO1xuICAgIGlmIChlLmRlZmF1bHRQcmV2ZW50ZWQpIHJldHVybjtcblxuXG5cbiAgICAvLyBlbnN1cmUgbGlua1xuICAgIHZhciBlbCA9IGUudGFyZ2V0O1xuICAgIHdoaWxlIChlbCAmJiAnQScgIT09IGVsLm5vZGVOYW1lKSBlbCA9IGVsLnBhcmVudE5vZGU7XG4gICAgaWYgKCFlbCB8fCAnQScgIT09IGVsLm5vZGVOYW1lKSByZXR1cm47XG5cblxuXG4gICAgLy8gSWdub3JlIGlmIHRhZyBoYXNcbiAgICAvLyAxLiBcImRvd25sb2FkXCIgYXR0cmlidXRlXG4gICAgLy8gMi4gcmVsPVwiZXh0ZXJuYWxcIiBhdHRyaWJ1dGVcbiAgICBpZiAoZWwuaGFzQXR0cmlidXRlKCdkb3dubG9hZCcpIHx8IGVsLmdldEF0dHJpYnV0ZSgncmVsJykgPT09ICdleHRlcm5hbCcpIHJldHVybjtcblxuICAgIC8vIGVuc3VyZSBub24taGFzaCBmb3IgdGhlIHNhbWUgcGF0aFxuICAgIHZhciBsaW5rID0gZWwuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG4gICAgaWYgKCFoYXNoYmFuZyAmJiBlbC5wYXRobmFtZSA9PT0gbG9jYXRpb24ucGF0aG5hbWUgJiYgKGVsLmhhc2ggfHwgJyMnID09PSBsaW5rKSkgcmV0dXJuO1xuXG5cblxuICAgIC8vIENoZWNrIGZvciBtYWlsdG86IGluIHRoZSBocmVmXG4gICAgaWYgKGxpbmsgJiYgbGluay5pbmRleE9mKCdtYWlsdG86JykgPiAtMSkgcmV0dXJuO1xuXG4gICAgLy8gY2hlY2sgdGFyZ2V0XG4gICAgaWYgKGVsLnRhcmdldCkgcmV0dXJuO1xuXG4gICAgLy8geC1vcmlnaW5cbiAgICBpZiAoIXNhbWVPcmlnaW4oZWwuaHJlZikpIHJldHVybjtcblxuXG5cbiAgICAvLyByZWJ1aWxkIHBhdGhcbiAgICB2YXIgcGF0aCA9IGVsLnBhdGhuYW1lICsgZWwuc2VhcmNoICsgKGVsLmhhc2ggfHwgJycpO1xuXG4gICAgLy8gc3RyaXAgbGVhZGluZyBcIi9bZHJpdmUgbGV0dGVyXTpcIiBvbiBOVy5qcyBvbiBXaW5kb3dzXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiBwYXRoLm1hdGNoKC9eXFwvW2EtekEtWl06XFwvLykpIHtcbiAgICAgIHBhdGggPSBwYXRoLnJlcGxhY2UoL15cXC9bYS16QS1aXTpcXC8vLCAnLycpO1xuICAgIH1cblxuICAgIC8vIHNhbWUgcGFnZVxuICAgIHZhciBvcmlnID0gcGF0aDtcblxuICAgIGlmIChwYXRoLmluZGV4T2YoYmFzZSkgPT09IDApIHtcbiAgICAgIHBhdGggPSBwYXRoLnN1YnN0cihiYXNlLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgaWYgKGhhc2hiYW5nKSBwYXRoID0gcGF0aC5yZXBsYWNlKCcjIScsICcnKTtcblxuICAgIGlmIChiYXNlICYmIG9yaWcgPT09IHBhdGgpIHJldHVybjtcblxuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBwYWdlLnNob3cob3JpZyk7XG4gIH1cblxuICAvKipcbiAgICogRXZlbnQgYnV0dG9uLlxuICAgKi9cblxuICBmdW5jdGlvbiB3aGljaChlKSB7XG4gICAgZSA9IGUgfHwgd2luZG93LmV2ZW50O1xuICAgIHJldHVybiBudWxsID09PSBlLndoaWNoID8gZS5idXR0b24gOiBlLndoaWNoO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGBocmVmYCBpcyB0aGUgc2FtZSBvcmlnaW4uXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHNhbWVPcmlnaW4oaHJlZikge1xuICAgIHZhciBvcmlnaW4gPSBsb2NhdGlvbi5wcm90b2NvbCArICcvLycgKyBsb2NhdGlvbi5ob3N0bmFtZTtcbiAgICBpZiAobG9jYXRpb24ucG9ydCkgb3JpZ2luICs9ICc6JyArIGxvY2F0aW9uLnBvcnQ7XG4gICAgcmV0dXJuIChocmVmICYmICgwID09PSBocmVmLmluZGV4T2Yob3JpZ2luKSkpO1xuICB9XG5cbiAgcGFnZS5zYW1lT3JpZ2luID0gc2FtZU9yaWdpbjtcbiIsInZhciBpc2FycmF5ID0gcmVxdWlyZSgnaXNhcnJheScpXG5cbi8qKlxuICogRXhwb3NlIGBwYXRoVG9SZWdleHBgLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHBhdGhUb1JlZ2V4cFxubW9kdWxlLmV4cG9ydHMucGFyc2UgPSBwYXJzZVxubW9kdWxlLmV4cG9ydHMuY29tcGlsZSA9IGNvbXBpbGVcbm1vZHVsZS5leHBvcnRzLnRva2Vuc1RvRnVuY3Rpb24gPSB0b2tlbnNUb0Z1bmN0aW9uXG5tb2R1bGUuZXhwb3J0cy50b2tlbnNUb1JlZ0V4cCA9IHRva2Vuc1RvUmVnRXhwXG5cbi8qKlxuICogVGhlIG1haW4gcGF0aCBtYXRjaGluZyByZWdleHAgdXRpbGl0eS5cbiAqXG4gKiBAdHlwZSB7UmVnRXhwfVxuICovXG52YXIgUEFUSF9SRUdFWFAgPSBuZXcgUmVnRXhwKFtcbiAgLy8gTWF0Y2ggZXNjYXBlZCBjaGFyYWN0ZXJzIHRoYXQgd291bGQgb3RoZXJ3aXNlIGFwcGVhciBpbiBmdXR1cmUgbWF0Y2hlcy5cbiAgLy8gVGhpcyBhbGxvd3MgdGhlIHVzZXIgdG8gZXNjYXBlIHNwZWNpYWwgY2hhcmFjdGVycyB0aGF0IHdvbid0IHRyYW5zZm9ybS5cbiAgJyhcXFxcXFxcXC4pJyxcbiAgLy8gTWF0Y2ggRXhwcmVzcy1zdHlsZSBwYXJhbWV0ZXJzIGFuZCB1bi1uYW1lZCBwYXJhbWV0ZXJzIHdpdGggYSBwcmVmaXhcbiAgLy8gYW5kIG9wdGlvbmFsIHN1ZmZpeGVzLiBNYXRjaGVzIGFwcGVhciBhczpcbiAgLy9cbiAgLy8gXCIvOnRlc3QoXFxcXGQrKT9cIiA9PiBbXCIvXCIsIFwidGVzdFwiLCBcIlxcZCtcIiwgdW5kZWZpbmVkLCBcIj9cIiwgdW5kZWZpbmVkXVxuICAvLyBcIi9yb3V0ZShcXFxcZCspXCIgID0+IFt1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBcIlxcZCtcIiwgdW5kZWZpbmVkLCB1bmRlZmluZWRdXG4gIC8vIFwiLypcIiAgICAgICAgICAgID0+IFtcIi9cIiwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBcIipcIl1cbiAgJyhbXFxcXC8uXSk/KD86KD86XFxcXDooXFxcXHcrKSg/OlxcXFwoKCg/OlxcXFxcXFxcLnxbXigpXSkrKVxcXFwpKT98XFxcXCgoKD86XFxcXFxcXFwufFteKCldKSspXFxcXCkpKFsrKj9dKT98KFxcXFwqKSknXG5dLmpvaW4oJ3wnKSwgJ2cnKVxuXG4vKipcbiAqIFBhcnNlIGEgc3RyaW5nIGZvciB0aGUgcmF3IHRva2Vucy5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7QXJyYXl9XG4gKi9cbmZ1bmN0aW9uIHBhcnNlIChzdHIpIHtcbiAgdmFyIHRva2VucyA9IFtdXG4gIHZhciBrZXkgPSAwXG4gIHZhciBpbmRleCA9IDBcbiAgdmFyIHBhdGggPSAnJ1xuICB2YXIgcmVzXG5cbiAgd2hpbGUgKChyZXMgPSBQQVRIX1JFR0VYUC5leGVjKHN0cikpICE9IG51bGwpIHtcbiAgICB2YXIgbSA9IHJlc1swXVxuICAgIHZhciBlc2NhcGVkID0gcmVzWzFdXG4gICAgdmFyIG9mZnNldCA9IHJlcy5pbmRleFxuICAgIHBhdGggKz0gc3RyLnNsaWNlKGluZGV4LCBvZmZzZXQpXG4gICAgaW5kZXggPSBvZmZzZXQgKyBtLmxlbmd0aFxuXG4gICAgLy8gSWdub3JlIGFscmVhZHkgZXNjYXBlZCBzZXF1ZW5jZXMuXG4gICAgaWYgKGVzY2FwZWQpIHtcbiAgICAgIHBhdGggKz0gZXNjYXBlZFsxXVxuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICAvLyBQdXNoIHRoZSBjdXJyZW50IHBhdGggb250byB0aGUgdG9rZW5zLlxuICAgIGlmIChwYXRoKSB7XG4gICAgICB0b2tlbnMucHVzaChwYXRoKVxuICAgICAgcGF0aCA9ICcnXG4gICAgfVxuXG4gICAgdmFyIHByZWZpeCA9IHJlc1syXVxuICAgIHZhciBuYW1lID0gcmVzWzNdXG4gICAgdmFyIGNhcHR1cmUgPSByZXNbNF1cbiAgICB2YXIgZ3JvdXAgPSByZXNbNV1cbiAgICB2YXIgc3VmZml4ID0gcmVzWzZdXG4gICAgdmFyIGFzdGVyaXNrID0gcmVzWzddXG5cbiAgICB2YXIgcmVwZWF0ID0gc3VmZml4ID09PSAnKycgfHwgc3VmZml4ID09PSAnKidcbiAgICB2YXIgb3B0aW9uYWwgPSBzdWZmaXggPT09ICc/JyB8fCBzdWZmaXggPT09ICcqJ1xuICAgIHZhciBkZWxpbWl0ZXIgPSBwcmVmaXggfHwgJy8nXG4gICAgdmFyIHBhdHRlcm4gPSBjYXB0dXJlIHx8IGdyb3VwIHx8IChhc3RlcmlzayA/ICcuKicgOiAnW14nICsgZGVsaW1pdGVyICsgJ10rPycpXG5cbiAgICB0b2tlbnMucHVzaCh7XG4gICAgICBuYW1lOiBuYW1lIHx8IGtleSsrLFxuICAgICAgcHJlZml4OiBwcmVmaXggfHwgJycsXG4gICAgICBkZWxpbWl0ZXI6IGRlbGltaXRlcixcbiAgICAgIG9wdGlvbmFsOiBvcHRpb25hbCxcbiAgICAgIHJlcGVhdDogcmVwZWF0LFxuICAgICAgcGF0dGVybjogZXNjYXBlR3JvdXAocGF0dGVybilcbiAgICB9KVxuICB9XG5cbiAgLy8gTWF0Y2ggYW55IGNoYXJhY3RlcnMgc3RpbGwgcmVtYWluaW5nLlxuICBpZiAoaW5kZXggPCBzdHIubGVuZ3RoKSB7XG4gICAgcGF0aCArPSBzdHIuc3Vic3RyKGluZGV4KVxuICB9XG5cbiAgLy8gSWYgdGhlIHBhdGggZXhpc3RzLCBwdXNoIGl0IG9udG8gdGhlIGVuZC5cbiAgaWYgKHBhdGgpIHtcbiAgICB0b2tlbnMucHVzaChwYXRoKVxuICB9XG5cbiAgcmV0dXJuIHRva2Vuc1xufVxuXG4vKipcbiAqIENvbXBpbGUgYSBzdHJpbmcgdG8gYSB0ZW1wbGF0ZSBmdW5jdGlvbiBmb3IgdGhlIHBhdGguXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSAgIHN0clxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGUgKHN0cikge1xuICByZXR1cm4gdG9rZW5zVG9GdW5jdGlvbihwYXJzZShzdHIpKVxufVxuXG4vKipcbiAqIEV4cG9zZSBhIG1ldGhvZCBmb3IgdHJhbnNmb3JtaW5nIHRva2VucyBpbnRvIHRoZSBwYXRoIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiB0b2tlbnNUb0Z1bmN0aW9uICh0b2tlbnMpIHtcbiAgLy8gQ29tcGlsZSBhbGwgdGhlIHRva2VucyBpbnRvIHJlZ2V4cHMuXG4gIHZhciBtYXRjaGVzID0gbmV3IEFycmF5KHRva2Vucy5sZW5ndGgpXG5cbiAgLy8gQ29tcGlsZSBhbGwgdGhlIHBhdHRlcm5zIGJlZm9yZSBjb21waWxhdGlvbi5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodHlwZW9mIHRva2Vuc1tpXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIG1hdGNoZXNbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRva2Vuc1tpXS5wYXR0ZXJuICsgJyQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHBhdGggPSAnJ1xuICAgIHZhciBkYXRhID0gb2JqIHx8IHt9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHRva2VuID0gdG9rZW5zW2ldXG5cbiAgICAgIGlmICh0eXBlb2YgdG9rZW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHBhdGggKz0gdG9rZW5cblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICB2YXIgdmFsdWUgPSBkYXRhW3Rva2VuLm5hbWVdXG4gICAgICB2YXIgc2VnbWVudFxuXG4gICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICBpZiAodG9rZW4ub3B0aW9uYWwpIHtcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gYmUgZGVmaW5lZCcpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGlzYXJyYXkodmFsdWUpKSB7XG4gICAgICAgIGlmICghdG9rZW4ucmVwZWF0KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBub3QgcmVwZWF0LCBidXQgcmVjZWl2ZWQgXCInICsgdmFsdWUgKyAnXCInKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGlmICh0b2tlbi5vcHRpb25hbCkge1xuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBub3QgYmUgZW1wdHknKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsdWUubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBzZWdtZW50ID0gZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlW2pdKVxuXG4gICAgICAgICAgaWYgKCFtYXRjaGVzW2ldLnRlc3Qoc2VnbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIGFsbCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG1hdGNoIFwiJyArIHRva2VuLnBhdHRlcm4gKyAnXCIsIGJ1dCByZWNlaXZlZCBcIicgKyBzZWdtZW50ICsgJ1wiJylcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwYXRoICs9IChqID09PSAwID8gdG9rZW4ucHJlZml4IDogdG9rZW4uZGVsaW1pdGVyKSArIHNlZ21lbnRcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIHNlZ21lbnQgPSBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpXG5cbiAgICAgIGlmICghbWF0Y2hlc1tpXS50ZXN0KHNlZ21lbnQpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gbWF0Y2ggXCInICsgdG9rZW4ucGF0dGVybiArICdcIiwgYnV0IHJlY2VpdmVkIFwiJyArIHNlZ21lbnQgKyAnXCInKVxuICAgICAgfVxuXG4gICAgICBwYXRoICs9IHRva2VuLnByZWZpeCArIHNlZ21lbnRcbiAgICB9XG5cbiAgICByZXR1cm4gcGF0aFxuICB9XG59XG5cbi8qKlxuICogRXNjYXBlIGEgcmVndWxhciBleHByZXNzaW9uIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBlc2NhcGVTdHJpbmcgKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbLisqPz1eIToke30oKVtcXF18XFwvXSkvZywgJ1xcXFwkMScpXG59XG5cbi8qKlxuICogRXNjYXBlIHRoZSBjYXB0dXJpbmcgZ3JvdXAgYnkgZXNjYXBpbmcgc3BlY2lhbCBjaGFyYWN0ZXJzIGFuZCBtZWFuaW5nLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gZ3JvdXBcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZXNjYXBlR3JvdXAgKGdyb3VwKSB7XG4gIHJldHVybiBncm91cC5yZXBsYWNlKC8oWz0hOiRcXC8oKV0pL2csICdcXFxcJDEnKVxufVxuXG4vKipcbiAqIEF0dGFjaCB0aGUga2V5cyBhcyBhIHByb3BlcnR5IG9mIHRoZSByZWdleHAuXG4gKlxuICogQHBhcmFtICB7UmVnRXhwfSByZVxuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIGF0dGFjaEtleXMgKHJlLCBrZXlzKSB7XG4gIHJlLmtleXMgPSBrZXlzXG4gIHJldHVybiByZVxufVxuXG4vKipcbiAqIEdldCB0aGUgZmxhZ3MgZm9yIGEgcmVnZXhwIGZyb20gdGhlIG9wdGlvbnMuXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZsYWdzIChvcHRpb25zKSB7XG4gIHJldHVybiBvcHRpb25zLnNlbnNpdGl2ZSA/ICcnIDogJ2knXG59XG5cbi8qKlxuICogUHVsbCBvdXQga2V5cyBmcm9tIGEgcmVnZXhwLlxuICpcbiAqIEBwYXJhbSAge1JlZ0V4cH0gcGF0aFxuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIHJlZ2V4cFRvUmVnZXhwIChwYXRoLCBrZXlzKSB7XG4gIC8vIFVzZSBhIG5lZ2F0aXZlIGxvb2thaGVhZCB0byBtYXRjaCBvbmx5IGNhcHR1cmluZyBncm91cHMuXG4gIHZhciBncm91cHMgPSBwYXRoLnNvdXJjZS5tYXRjaCgvXFwoKD8hXFw/KS9nKVxuXG4gIGlmIChncm91cHMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdyb3Vwcy5sZW5ndGg7IGkrKykge1xuICAgICAga2V5cy5wdXNoKHtcbiAgICAgICAgbmFtZTogaSxcbiAgICAgICAgcHJlZml4OiBudWxsLFxuICAgICAgICBkZWxpbWl0ZXI6IG51bGwsXG4gICAgICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICAgICAgcmVwZWF0OiBmYWxzZSxcbiAgICAgICAgcGF0dGVybjogbnVsbFxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXR0YWNoS2V5cyhwYXRoLCBrZXlzKVxufVxuXG4vKipcbiAqIFRyYW5zZm9ybSBhbiBhcnJheSBpbnRvIGEgcmVnZXhwLlxuICpcbiAqIEBwYXJhbSAge0FycmF5fSAgcGF0aFxuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gYXJyYXlUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICB2YXIgcGFydHMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgIHBhcnRzLnB1c2gocGF0aFRvUmVnZXhwKHBhdGhbaV0sIGtleXMsIG9wdGlvbnMpLnNvdXJjZSlcbiAgfVxuXG4gIHZhciByZWdleHAgPSBuZXcgUmVnRXhwKCcoPzonICsgcGFydHMuam9pbignfCcpICsgJyknLCBmbGFncyhvcHRpb25zKSlcblxuICByZXR1cm4gYXR0YWNoS2V5cyhyZWdleHAsIGtleXMpXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgcGF0aCByZWdleHAgZnJvbSBzdHJpbmcgaW5wdXQuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gIGtleXNcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7UmVnRXhwfVxuICovXG5mdW5jdGlvbiBzdHJpbmdUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICB2YXIgdG9rZW5zID0gcGFyc2UocGF0aClcbiAgdmFyIHJlID0gdG9rZW5zVG9SZWdFeHAodG9rZW5zLCBvcHRpb25zKVxuXG4gIC8vIEF0dGFjaCBrZXlzIGJhY2sgdG8gdGhlIHJlZ2V4cC5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodHlwZW9mIHRva2Vuc1tpXSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGtleXMucHVzaCh0b2tlbnNbaV0pXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dGFjaEtleXMocmUsIGtleXMpXG59XG5cbi8qKlxuICogRXhwb3NlIGEgZnVuY3Rpb24gZm9yIHRha2luZyB0b2tlbnMgYW5kIHJldHVybmluZyBhIFJlZ0V4cC5cbiAqXG4gKiBAcGFyYW0gIHtBcnJheX0gIHRva2Vuc1xuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gdG9rZW5zVG9SZWdFeHAgKHRva2Vucywgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuXG4gIHZhciBzdHJpY3QgPSBvcHRpb25zLnN0cmljdFxuICB2YXIgZW5kID0gb3B0aW9ucy5lbmQgIT09IGZhbHNlXG4gIHZhciByb3V0ZSA9ICcnXG4gIHZhciBsYXN0VG9rZW4gPSB0b2tlbnNbdG9rZW5zLmxlbmd0aCAtIDFdXG4gIHZhciBlbmRzV2l0aFNsYXNoID0gdHlwZW9mIGxhc3RUb2tlbiA9PT0gJ3N0cmluZycgJiYgL1xcLyQvLnRlc3QobGFzdFRva2VuKVxuXG4gIC8vIEl0ZXJhdGUgb3ZlciB0aGUgdG9rZW5zIGFuZCBjcmVhdGUgb3VyIHJlZ2V4cCBzdHJpbmcuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHRva2VuID0gdG9rZW5zW2ldXG5cbiAgICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgICAgcm91dGUgKz0gZXNjYXBlU3RyaW5nKHRva2VuKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgcHJlZml4ID0gZXNjYXBlU3RyaW5nKHRva2VuLnByZWZpeClcbiAgICAgIHZhciBjYXB0dXJlID0gdG9rZW4ucGF0dGVyblxuXG4gICAgICBpZiAodG9rZW4ucmVwZWF0KSB7XG4gICAgICAgIGNhcHR1cmUgKz0gJyg/OicgKyBwcmVmaXggKyBjYXB0dXJlICsgJykqJ1xuICAgICAgfVxuXG4gICAgICBpZiAodG9rZW4ub3B0aW9uYWwpIHtcbiAgICAgICAgaWYgKHByZWZpeCkge1xuICAgICAgICAgIGNhcHR1cmUgPSAnKD86JyArIHByZWZpeCArICcoJyArIGNhcHR1cmUgKyAnKSk/J1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhcHR1cmUgPSAnKCcgKyBjYXB0dXJlICsgJyk/J1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYXB0dXJlID0gcHJlZml4ICsgJygnICsgY2FwdHVyZSArICcpJ1xuICAgICAgfVxuXG4gICAgICByb3V0ZSArPSBjYXB0dXJlXG4gICAgfVxuICB9XG5cbiAgLy8gSW4gbm9uLXN0cmljdCBtb2RlIHdlIGFsbG93IGEgc2xhc2ggYXQgdGhlIGVuZCBvZiBtYXRjaC4gSWYgdGhlIHBhdGggdG9cbiAgLy8gbWF0Y2ggYWxyZWFkeSBlbmRzIHdpdGggYSBzbGFzaCwgd2UgcmVtb3ZlIGl0IGZvciBjb25zaXN0ZW5jeS4gVGhlIHNsYXNoXG4gIC8vIGlzIHZhbGlkIGF0IHRoZSBlbmQgb2YgYSBwYXRoIG1hdGNoLCBub3QgaW4gdGhlIG1pZGRsZS4gVGhpcyBpcyBpbXBvcnRhbnRcbiAgLy8gaW4gbm9uLWVuZGluZyBtb2RlLCB3aGVyZSBcIi90ZXN0L1wiIHNob3VsZG4ndCBtYXRjaCBcIi90ZXN0Ly9yb3V0ZVwiLlxuICBpZiAoIXN0cmljdCkge1xuICAgIHJvdXRlID0gKGVuZHNXaXRoU2xhc2ggPyByb3V0ZS5zbGljZSgwLCAtMikgOiByb3V0ZSkgKyAnKD86XFxcXC8oPz0kKSk/J1xuICB9XG5cbiAgaWYgKGVuZCkge1xuICAgIHJvdXRlICs9ICckJ1xuICB9IGVsc2Uge1xuICAgIC8vIEluIG5vbi1lbmRpbmcgbW9kZSwgd2UgbmVlZCB0aGUgY2FwdHVyaW5nIGdyb3VwcyB0byBtYXRjaCBhcyBtdWNoIGFzXG4gICAgLy8gcG9zc2libGUgYnkgdXNpbmcgYSBwb3NpdGl2ZSBsb29rYWhlYWQgdG8gdGhlIGVuZCBvciBuZXh0IHBhdGggc2VnbWVudC5cbiAgICByb3V0ZSArPSBzdHJpY3QgJiYgZW5kc1dpdGhTbGFzaCA/ICcnIDogJyg/PVxcXFwvfCQpJ1xuICB9XG5cbiAgcmV0dXJuIG5ldyBSZWdFeHAoJ14nICsgcm91dGUsIGZsYWdzKG9wdGlvbnMpKVxufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgZ2l2ZW4gcGF0aCBzdHJpbmcsIHJldHVybmluZyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAqXG4gKiBBbiBlbXB0eSBhcnJheSBjYW4gYmUgcGFzc2VkIGluIGZvciB0aGUga2V5cywgd2hpY2ggd2lsbCBob2xkIHRoZVxuICogcGxhY2Vob2xkZXIga2V5IGRlc2NyaXB0aW9ucy4gRm9yIGV4YW1wbGUsIHVzaW5nIGAvdXNlci86aWRgLCBga2V5c2Agd2lsbFxuICogY29udGFpbiBgW3sgbmFtZTogJ2lkJywgZGVsaW1pdGVyOiAnLycsIG9wdGlvbmFsOiBmYWxzZSwgcmVwZWF0OiBmYWxzZSB9XWAuXG4gKlxuICogQHBhcmFtICB7KFN0cmluZ3xSZWdFeHB8QXJyYXkpfSBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgICAgICAgICAgIFtrZXlzXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgICAgICAgICBbb3B0aW9uc11cbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gcGF0aFRvUmVnZXhwIChwYXRoLCBrZXlzLCBvcHRpb25zKSB7XG4gIGtleXMgPSBrZXlzIHx8IFtdXG5cbiAgaWYgKCFpc2FycmF5KGtleXMpKSB7XG4gICAgb3B0aW9ucyA9IGtleXNcbiAgICBrZXlzID0gW11cbiAgfSBlbHNlIGlmICghb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSB7fVxuICB9XG5cbiAgaWYgKHBhdGggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICByZXR1cm4gcmVnZXhwVG9SZWdleHAocGF0aCwga2V5cywgb3B0aW9ucylcbiAgfVxuXG4gIGlmIChpc2FycmF5KHBhdGgpKSB7XG4gICAgcmV0dXJuIGFycmF5VG9SZWdleHAocGF0aCwga2V5cywgb3B0aW9ucylcbiAgfVxuXG4gIHJldHVybiBzdHJpbmdUb1JlZ2V4cChwYXRoLCBrZXlzLCBvcHRpb25zKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChhcnIpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2xpYi9zdXBlcm1vZGVscycpO1xuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJylcbnZhciBjcmVhdGVXcmFwcGVyRmFjdG9yeSA9IHJlcXVpcmUoJy4vZmFjdG9yeScpXG5cbmZ1bmN0aW9uIHJlc29sdmUgKGZyb20pIHtcbiAgdmFyIGlzQ3RvciA9IHV0aWwuaXNDb25zdHJ1Y3Rvcihmcm9tKVxuICB2YXIgaXNTdXBlcm1vZGVsQ3RvciA9IHV0aWwuaXNTdXBlcm1vZGVsQ29uc3RydWN0b3IoZnJvbSlcbiAgdmFyIGlzQXJyYXkgPSB1dGlsLmlzQXJyYXkoZnJvbSlcblxuICBpZiAoaXNDdG9yIHx8IGlzU3VwZXJtb2RlbEN0b3IgfHwgaXNBcnJheSkge1xuICAgIHJldHVybiB7XG4gICAgICBfX3R5cGU6IGZyb21cbiAgICB9XG4gIH1cblxuICB2YXIgaXNWYWx1ZSA9ICF1dGlsLmlzT2JqZWN0KGZyb20pXG4gIGlmIChpc1ZhbHVlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIF9fdmFsdWU6IGZyb21cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZnJvbVxufVxuXG5mdW5jdGlvbiBjcmVhdGVEZWYgKGZyb20pIHtcbiAgZnJvbSA9IHJlc29sdmUoZnJvbSlcblxuICB2YXIgX19WQUxJREFUT1JTID0gJ19fdmFsaWRhdG9ycydcbiAgdmFyIF9fVkFMVUUgPSAnX192YWx1ZSdcbiAgdmFyIF9fVFlQRSA9ICdfX3R5cGUnXG4gIHZhciBfX0RJU1BMQVlOQU1FID0gJ19fZGlzcGxheU5hbWUnXG4gIHZhciBfX0dFVCA9ICdfX2dldCdcbiAgdmFyIF9fU0VUID0gJ19fc2V0J1xuICB2YXIgX19FTlVNRVJBQkxFID0gJ19fZW51bWVyYWJsZSdcbiAgdmFyIF9fQ09ORklHVVJBQkxFID0gJ19fY29uZmlndXJhYmxlJ1xuICB2YXIgX19XUklUQUJMRSA9ICdfX3dyaXRhYmxlJ1xuICB2YXIgX19TUEVDSUFMX1BST1BTID0gW1xuICAgIF9fVkFMSURBVE9SUywgX19WQUxVRSwgX19UWVBFLCBfX0RJU1BMQVlOQU1FLFxuICAgIF9fR0VULCBfX1NFVCwgX19FTlVNRVJBQkxFLCBfX0NPTkZJR1VSQUJMRSwgX19XUklUQUJMRVxuICBdXG5cbiAgdmFyIGRlZiA9IHtcbiAgICBmcm9tOiBmcm9tLFxuICAgIHR5cGU6IGZyb21bX19UWVBFXSxcbiAgICB2YWx1ZTogZnJvbVtfX1ZBTFVFXSxcbiAgICB2YWxpZGF0b3JzOiBmcm9tW19fVkFMSURBVE9SU10gfHwgW10sXG4gICAgZW51bWVyYWJsZTogZnJvbVtfX0VOVU1FUkFCTEVdICE9PSBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6ICEhZnJvbVtfX0NPTkZJR1VSQUJMRV0sXG4gICAgd3JpdGFibGU6IGZyb21bX19XUklUQUJMRV0gIT09IGZhbHNlLFxuICAgIGRpc3BsYXlOYW1lOiBmcm9tW19fRElTUExBWU5BTUVdLFxuICAgIGdldHRlcjogZnJvbVtfX0dFVF0sXG4gICAgc2V0dGVyOiBmcm9tW19fU0VUXVxuICB9XG5cbiAgdmFyIHR5cGUgPSBkZWYudHlwZVxuXG4gIC8vIFNpbXBsZSAnQ29uc3RydWN0b3InIFR5cGVcbiAgaWYgKHV0aWwuaXNTaW1wbGVDb25zdHJ1Y3Rvcih0eXBlKSkge1xuICAgIGRlZi5pc1NpbXBsZSA9IHRydWVcblxuICAgIGRlZi5jYXN0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdXRpbC5jYXN0KHZhbHVlLCB0eXBlKVxuICAgIH1cbiAgfSBlbHNlIGlmICh1dGlsLmlzU3VwZXJtb2RlbENvbnN0cnVjdG9yKHR5cGUpKSB7XG4gICAgZGVmLmlzUmVmZXJlbmNlID0gdHJ1ZVxuICB9IGVsc2UgaWYgKGRlZi52YWx1ZSkge1xuICAgIC8vIElmIGEgdmFsdWUgaXMgcHJlc2VudCwgdXNlXG4gICAgLy8gdGhhdCBhbmQgc2hvcnQtY2lyY3VpdCB0aGUgcmVzdFxuICAgIGRlZi5pc1NpbXBsZSA9IHRydWVcbiAgfSBlbHNlIHtcbiAgICAvLyBPdGhlcndpc2UgbG9vayBmb3Igb3RoZXIgbm9uLXNwZWNpYWxcbiAgICAvLyBrZXlzIGFuZCBhbHNvIGFueSBpdGVtIGRlZmluaXRpb25cbiAgICAvLyBpbiB0aGUgY2FzZSBvZiBBcnJheXNcblxuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoZnJvbSlcbiAgICB2YXIgY2hpbGRLZXlzID0ga2V5cy5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHJldHVybiBfX1NQRUNJQUxfUFJPUFMuaW5kZXhPZihpdGVtKSA9PT0gLTFcbiAgICB9KVxuXG4gICAgaWYgKGNoaWxkS2V5cy5sZW5ndGgpIHtcbiAgICAgIHZhciBkZWZzID0ge31cbiAgICAgIHZhciBwcm90b1xuXG4gICAgICBjaGlsZEtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHZhciBkZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihmcm9tLCBrZXkpXG4gICAgICAgIHZhciB2YWx1ZVxuXG4gICAgICAgIGlmIChkZXNjcmlwdG9yLmdldCB8fCBkZXNjcmlwdG9yLnNldCkge1xuICAgICAgICAgIHZhbHVlID0ge1xuICAgICAgICAgICAgX19nZXQ6IGRlc2NyaXB0b3IuZ2V0LFxuICAgICAgICAgICAgX19zZXQ6IGRlc2NyaXB0b3Iuc2V0XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlID0gZnJvbVtrZXldXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXV0aWwuaXNDb25zdHJ1Y3Rvcih2YWx1ZSkgJiYgIXV0aWwuaXNTdXBlcm1vZGVsQ29uc3RydWN0b3IodmFsdWUpICYmIHV0aWwuaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgICAgICBpZiAoIXByb3RvKSB7XG4gICAgICAgICAgICBwcm90byA9IHt9XG4gICAgICAgICAgfVxuICAgICAgICAgIHByb3RvW2tleV0gPSB2YWx1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlZnNba2V5XSA9IGNyZWF0ZURlZih2YWx1ZSlcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgZGVmLmRlZnMgPSBkZWZzXG4gICAgICBkZWYucHJvdG8gPSBwcm90b1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBBcnJheVxuICAgIGlmICh0eXBlID09PSBBcnJheSB8fCB1dGlsLmlzQXJyYXkodHlwZSkpIHtcbiAgICAgIGRlZi5pc0FycmF5ID0gdHJ1ZVxuXG4gICAgICBpZiAodHlwZS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGRlZi5kZWYgPSBjcmVhdGVEZWYodHlwZVswXSlcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNoaWxkS2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgIGRlZi5pc1NpbXBsZSA9IHRydWVcbiAgICB9XG4gIH1cblxuICBkZWYuY3JlYXRlID0gY3JlYXRlV3JhcHBlckZhY3RvcnkoZGVmKVxuXG4gIHJldHVybiBkZWZcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVEZWZcbiIsIid1c2Ugc3RyaWN0J1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICB2YXIgYXJyID0gW11cblxuICAvKipcbiAgICogUHJveGllZCBhcnJheSBtdXRhdG9ycyBtZXRob2RzXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAgICogQHJldHVybiB7T2JqZWN0fVxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG4gIHZhciBwb3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlc3VsdCA9IEFycmF5LnByb3RvdHlwZS5wb3AuYXBwbHkoYXJyKVxuXG4gICAgY2FsbGJhY2soJ3BvcCcsIGFyciwge1xuICAgICAgdmFsdWU6IHJlc3VsdFxuICAgIH0pXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbiAgdmFyIHB1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlc3VsdCA9IEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGFyciwgYXJndW1lbnRzKVxuXG4gICAgY2FsbGJhY2soJ3B1c2gnLCBhcnIsIHtcbiAgICAgIHZhbHVlOiByZXN1bHRcbiAgICB9KVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG4gIHZhciBzaGlmdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVzdWx0ID0gQXJyYXkucHJvdG90eXBlLnNoaWZ0LmFwcGx5KGFycilcblxuICAgIGNhbGxiYWNrKCdzaGlmdCcsIGFyciwge1xuICAgICAgdmFsdWU6IHJlc3VsdFxuICAgIH0pXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbiAgdmFyIHNvcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlc3VsdCA9IEFycmF5LnByb3RvdHlwZS5zb3J0LmFwcGx5KGFyciwgYXJndW1lbnRzKVxuXG4gICAgY2FsbGJhY2soJ3NvcnQnLCBhcnIsIHtcbiAgICAgIHZhbHVlOiByZXN1bHRcbiAgICB9KVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG4gIHZhciB1bnNoaWZ0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZXN1bHQgPSBBcnJheS5wcm90b3R5cGUudW5zaGlmdC5hcHBseShhcnIsIGFyZ3VtZW50cylcblxuICAgIGNhbGxiYWNrKCd1bnNoaWZ0JywgYXJyLCB7XG4gICAgICB2YWx1ZTogcmVzdWx0XG4gICAgfSlcblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICB2YXIgcmV2ZXJzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVzdWx0ID0gQXJyYXkucHJvdG90eXBlLnJldmVyc2UuYXBwbHkoYXJyKVxuXG4gICAgY2FsbGJhY2soJ3JldmVyc2UnLCBhcnIsIHtcbiAgICAgIHZhbHVlOiByZXN1bHRcbiAgICB9KVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG4gIHZhciBzcGxpY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB2YXIgcmVzdWx0ID0gQXJyYXkucHJvdG90eXBlLnNwbGljZS5hcHBseShhcnIsIGFyZ3VtZW50cylcblxuICAgIGNhbGxiYWNrKCdzcGxpY2UnLCBhcnIsIHtcbiAgICAgIHZhbHVlOiByZXN1bHQsXG4gICAgICByZW1vdmVkOiByZXN1bHQsXG4gICAgICBhZGRlZDogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogUHJveHkgYWxsIEFycmF5LnByb3RvdHlwZSBtdXRhdG9yIG1ldGhvZHMgb24gdGhpcyBhcnJheSBpbnN0YW5jZVxuICAgKi9cbiAgYXJyLnBvcCA9IGFyci5wb3AgJiYgcG9wXG4gIGFyci5wdXNoID0gYXJyLnB1c2ggJiYgcHVzaFxuICBhcnIuc2hpZnQgPSBhcnIuc2hpZnQgJiYgc2hpZnRcbiAgYXJyLnVuc2hpZnQgPSBhcnIudW5zaGlmdCAmJiB1bnNoaWZ0XG4gIGFyci5zb3J0ID0gYXJyLnNvcnQgJiYgc29ydFxuICBhcnIucmV2ZXJzZSA9IGFyci5yZXZlcnNlICYmIHJldmVyc2VcbiAgYXJyLnNwbGljZSA9IGFyci5zcGxpY2UgJiYgc3BsaWNlXG5cbiAgLyoqXG4gICAqIFNwZWNpYWwgdXBkYXRlIGZ1bmN0aW9uIHNpbmNlIHdlIGNhbid0IGRldGVjdFxuICAgKiBhc3NpZ25tZW50IGJ5IGluZGV4IGUuZy4gYXJyWzBdID0gJ3NvbWV0aGluZydcbiAgICovXG4gIGFyci51cGRhdGUgPSBmdW5jdGlvbiAoaW5kZXgsIHZhbHVlKSB7XG4gICAgdmFyIG9sZFZhbHVlID0gYXJyW2luZGV4XVxuICAgIHZhciBuZXdWYWx1ZSA9IGFycltpbmRleF0gPSB2YWx1ZVxuXG4gICAgY2FsbGJhY2soJ3VwZGF0ZScsIGFyciwge1xuICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgdmFsdWU6IG5ld1ZhbHVlLFxuICAgICAgb2xkVmFsdWU6IG9sZFZhbHVlXG4gICAgfSlcblxuICAgIHJldHVybiBuZXdWYWx1ZVxuICB9XG5cbiAgcmV0dXJuIGFyclxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gRW1pdHRlckV2ZW50IChuYW1lLCBwYXRoLCB0YXJnZXQsIGRldGFpbCkge1xuICB0aGlzLm5hbWUgPSBuYW1lXG4gIHRoaXMucGF0aCA9IHBhdGhcbiAgdGhpcy50YXJnZXQgPSB0YXJnZXRcblxuICBpZiAoZGV0YWlsKSB7XG4gICAgdGhpcy5kZXRhaWwgPSBkZXRhaWxcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbi8qKlxuICogRXhwb3NlIGBFbWl0dGVyYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVtaXR0ZXJcblxuLyoqXG4gKiBJbml0aWFsaXplIGEgbmV3IGBFbWl0dGVyYC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIEVtaXR0ZXIgKG9iaikge1xuICB2YXIgY3R4ID0gb2JqIHx8IHRoaXNcblxuICBpZiAob2JqKSB7XG4gICAgY3R4ID0gbWl4aW4ob2JqKVxuICAgIHJldHVybiBjdHhcbiAgfVxufVxuXG4vKipcbiAqIE1peGluIHRoZSBlbWl0dGVyIHByb3BlcnRpZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7T2JqZWN0fVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbWl4aW4gKG9iaikge1xuICBmb3IgKHZhciBrZXkgaW4gRW1pdHRlci5wcm90b3R5cGUpIHtcbiAgICBvYmpba2V5XSA9IEVtaXR0ZXIucHJvdG90eXBlW2tleV1cbiAgfVxuICByZXR1cm4gb2JqXG59XG5cbi8qKlxuICogTGlzdGVuIG9uIHRoZSBnaXZlbiBgZXZlbnRgIHdpdGggYGZuYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5vbiA9IEVtaXR0ZXIucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAoZXZlbnQsIGZuKSB7XG4gICh0aGlzLl9fY2FsbGJhY2tzW2V2ZW50XSA9IHRoaXMuX19jYWxsYmFja3NbZXZlbnRdIHx8IFtdKVxuICAgIC5wdXNoKGZuKVxuICByZXR1cm4gdGhpc1xufVxuXG4vKipcbiAqIEFkZHMgYW4gYGV2ZW50YCBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgaW52b2tlZCBhIHNpbmdsZVxuICogdGltZSB0aGVuIGF1dG9tYXRpY2FsbHkgcmVtb3ZlZC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gKGV2ZW50LCBmbikge1xuICBmdW5jdGlvbiBvbiAoKSB7XG4gICAgdGhpcy5vZmYoZXZlbnQsIG9uKVxuICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgfVxuXG4gIG9uLmZuID0gZm5cbiAgdGhpcy5vbihldmVudCwgb24pXG4gIHJldHVybiB0aGlzXG59XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBnaXZlbiBjYWxsYmFjayBmb3IgYGV2ZW50YCBvciBhbGxcbiAqIHJlZ2lzdGVyZWQgY2FsbGJhY2tzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbiAoZXZlbnQsIGZuKSB7XG4gIC8vIGFsbFxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHRoaXMuX19jYWxsYmFja3MgPSB7fVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvLyBzcGVjaWZpYyBldmVudFxuICB2YXIgY2FsbGJhY2tzID0gdGhpcy5fX2NhbGxiYWNrc1tldmVudF1cbiAgaWYgKCFjYWxsYmFja3MpIHtcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLy8gcmVtb3ZlIGFsbCBoYW5kbGVyc1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIGRlbGV0ZSB0aGlzLl9fY2FsbGJhY2tzW2V2ZW50XVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvLyByZW1vdmUgc3BlY2lmaWMgaGFuZGxlclxuICB2YXIgY2JcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICBjYiA9IGNhbGxiYWNrc1tpXVxuICAgIGlmIChjYiA9PT0gZm4gfHwgY2IuZm4gPT09IGZuKSB7XG4gICAgICBjYWxsYmFja3Muc3BsaWNlKGksIDEpXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG4vKipcbiAqIEVtaXQgYGV2ZW50YCB3aXRoIHRoZSBnaXZlbiBhcmdzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtNaXhlZH0gLi4uXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSlcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuX19jYWxsYmFja3NbZXZlbnRdXG5cbiAgaWYgKGNhbGxiYWNrcykge1xuICAgIGNhbGxiYWNrcyA9IGNhbGxiYWNrcy5zbGljZSgwKVxuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjYWxsYmFja3MubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgIGNhbGxiYWNrc1tpXS5hcHBseSh0aGlzLCBhcmdzKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8qKlxuICogUmV0dXJuIGFycmF5IG9mIGNhbGxiYWNrcyBmb3IgYGV2ZW50YC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEByZXR1cm4ge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgcmV0dXJuIHRoaXMuX19jYWxsYmFja3NbZXZlbnRdIHx8IFtdXG59XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhpcyBlbWl0dGVyIGhhcyBgZXZlbnRgIGhhbmRsZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUuaGFzTGlzdGVuZXJzID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gIHJldHVybiAhIXRoaXMubGlzdGVuZXJzKGV2ZW50KS5sZW5ndGhcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpXG52YXIgY3JlYXRlTW9kZWxQcm90b3R5cGUgPSByZXF1aXJlKCcuL3Byb3RvJylcbnZhciBXcmFwcGVyID0gcmVxdWlyZSgnLi93cmFwcGVyJylcblxuZnVuY3Rpb24gY3JlYXRlTW9kZWxEZXNjcmlwdG9ycyAoZGVmLCBwYXJlbnQpIHtcbiAgdmFyIF9fID0ge31cblxuICB2YXIgZGVzYyA9IHtcbiAgICBfXzoge1xuICAgICAgdmFsdWU6IF9fXG4gICAgfSxcbiAgICBfX2RlZjoge1xuICAgICAgdmFsdWU6IGRlZlxuICAgIH0sXG4gICAgX19wYXJlbnQ6IHtcbiAgICAgIHZhbHVlOiBwYXJlbnQsXG4gICAgICB3cml0YWJsZTogdHJ1ZVxuICAgIH0sXG4gICAgX19jYWxsYmFja3M6IHtcbiAgICAgIHZhbHVlOiB7fSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGRlc2Ncbn1cblxuZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyAobW9kZWwpIHtcbiAgdmFyIGRlZnMgPSBtb2RlbC5fX2RlZi5kZWZzXG4gIGZvciAodmFyIGtleSBpbiBkZWZzKSB7XG4gICAgZGVmaW5lUHJvcGVydHkobW9kZWwsIGtleSwgZGVmc1trZXldKVxuICB9XG59XG5cbmZ1bmN0aW9uIGRlZmluZVByb3BlcnR5IChtb2RlbCwga2V5LCBkZWYpIHtcbiAgdmFyIGRlc2MgPSB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2dldChrZXkpXG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiBkZWYuZW51bWVyYWJsZSxcbiAgICBjb25maWd1cmFibGU6IGRlZi5jb25maWd1cmFibGVcbiAgfVxuXG4gIGlmIChkZWYud3JpdGFibGUpIHtcbiAgICBkZXNjLnNldCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgdGhpcy5fX3NldE5vdGlmeUNoYW5nZShrZXksIHZhbHVlKVxuICAgIH1cbiAgfVxuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShtb2RlbCwga2V5LCBkZXNjKVxuXG4gIC8vIFNpbGVudGx5IGluaXRpYWxpemUgdGhlIHByb3BlcnR5IHdyYXBwZXJcbiAgbW9kZWwuX19ba2V5XSA9IGRlZi5jcmVhdGUobW9kZWwpXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVdyYXBwZXJGYWN0b3J5IChkZWYpIHtcbiAgdmFyIHdyYXBwZXIsIGRlZmF1bHRWYWx1ZSwgYXNzZXJ0XG5cbiAgaWYgKGRlZi5pc1NpbXBsZSkge1xuICAgIHdyYXBwZXIgPSBuZXcgV3JhcHBlcihkZWYudmFsdWUsIGRlZi53cml0YWJsZSwgZGVmLnZhbGlkYXRvcnMsIGRlZi5nZXR0ZXIsIGRlZi5zZXR0ZXIsIGRlZi5jYXN0LCBudWxsKVxuICB9IGVsc2UgaWYgKGRlZi5pc1JlZmVyZW5jZSkge1xuICAgIC8vIEhvbGQgYSByZWZlcmVuY2UgdG8gdGhlXG4gICAgLy8gcmVmZXJlcmVuY2VkIHR5cGVzJyBkZWZpbml0aW9uXG4gICAgdmFyIHJlZkRlZiA9IGRlZi50eXBlLmRlZlxuXG4gICAgaWYgKHJlZkRlZi5pc1NpbXBsZSkge1xuICAgICAgLy8gSWYgdGhlIHJlZmVyZW5jZWQgdHlwZSBpcyBpdHNlbGYgc2ltcGxlLFxuICAgICAgLy8gd2UgY2FuIHNldCBqdXN0IHJldHVybiBhIHdyYXBwZXIgYW5kXG4gICAgICAvLyB0aGUgcHJvcGVydHkgd2lsbCBnZXQgaW5pdGlhbGl6ZWQuXG4gICAgICB3cmFwcGVyID0gbmV3IFdyYXBwZXIocmVmRGVmLnZhbHVlLCByZWZEZWYud3JpdGFibGUsIHJlZkRlZi52YWxpZGF0b3JzLCBkZWYuZ2V0dGVyLCBkZWYuc2V0dGVyLCByZWZEZWYuY2FzdCwgbnVsbClcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgd2UncmUgbm90IGRlYWxpbmcgd2l0aCBhIHNpbXBsZSByZWZlcmVuY2UgbW9kZWxcbiAgICAgIC8vIHdlIG5lZWQgdG8gZGVmaW5lIGFuIGFzc2VydGlvbiB0aGF0IHRoZSBpbnN0YW5jZVxuICAgICAgLy8gYmVpbmcgc2V0IGlzIG9mIHRoZSBjb3JyZWN0IHR5cGUuIFdlIGRvIHRoaXMgYmVcbiAgICAgIC8vIGNvbXBhcmluZyB0aGUgZGVmcy5cblxuICAgICAgYXNzZXJ0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIGNvbXBhcmUgdGhlIGRlZmludGlvbnMgb2YgdGhlIHZhbHVlIGluc3RhbmNlXG4gICAgICAgIC8vIGJlaW5nIHBhc3NlZCBhbmQgdGhlIGRlZiBwcm9wZXJ0eSBhdHRhY2hlZFxuICAgICAgICAvLyB0byB0aGUgdHlwZSBTdXBlcm1vZGVsQ29uc3RydWN0b3IuIEFsbG93IHRoZVxuICAgICAgICAvLyB2YWx1ZSB0byBiZSB1bmRlZmluZWQgb3IgbnVsbCBhbHNvLlxuICAgICAgICB2YXIgaXNDb3JyZWN0VHlwZSA9IGZhbHNlXG5cbiAgICAgICAgaWYgKHV0aWwuaXNOdWxsT3JVbmRlZmluZWQodmFsdWUpKSB7XG4gICAgICAgICAgaXNDb3JyZWN0VHlwZSA9IHRydWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpc0NvcnJlY3RUeXBlID0gcmVmRGVmID09PSB2YWx1ZS5fX2RlZlxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFpc0NvcnJlY3RUeXBlKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdWYWx1ZSBzaG91bGQgYmUgYW4gaW5zdGFuY2Ugb2YgdGhlIHJlZmVyZW5jZWQgbW9kZWwsIG51bGwgb3IgdW5kZWZpbmVkJylcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB3cmFwcGVyID0gbmV3IFdyYXBwZXIoZGVmLnZhbHVlLCBkZWYud3JpdGFibGUsIGRlZi52YWxpZGF0b3JzLCBkZWYuZ2V0dGVyLCBkZWYuc2V0dGVyLCBudWxsLCBhc3NlcnQpXG4gICAgfVxuICB9IGVsc2UgaWYgKGRlZi5pc0FycmF5KSB7XG4gICAgZGVmYXVsdFZhbHVlID0gZnVuY3Rpb24gKHBhcmVudCkge1xuICAgICAgLy8gZm9yIEFycmF5cywgd2UgY3JlYXRlIGEgbmV3IEFycmF5IGFuZCBlYWNoXG4gICAgICAvLyB0aW1lLCBtaXggdGhlIG1vZGVsIHByb3BlcnRpZXMgaW50byBpdFxuICAgICAgdmFyIG1vZGVsID0gY3JlYXRlTW9kZWxQcm90b3R5cGUoZGVmKVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMobW9kZWwsIGNyZWF0ZU1vZGVsRGVzY3JpcHRvcnMoZGVmLCBwYXJlbnQpKVxuICAgICAgZGVmaW5lUHJvcGVydGllcyhtb2RlbClcbiAgICAgIHJldHVybiBtb2RlbFxuICAgIH1cblxuICAgIGFzc2VydCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gdG9kbzogZnVydGhlciBhcnJheSB0eXBlIHZhbGlkYXRpb25cbiAgICAgIGlmICghdXRpbC5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZhbHVlIHNob3VsZCBiZSBhbiBhcnJheScpXG4gICAgICB9XG4gICAgfVxuXG4gICAgd3JhcHBlciA9IG5ldyBXcmFwcGVyKGRlZmF1bHRWYWx1ZSwgZGVmLndyaXRhYmxlLCBkZWYudmFsaWRhdG9ycywgZGVmLmdldHRlciwgZGVmLnNldHRlciwgbnVsbCwgYXNzZXJ0KVxuICB9IGVsc2Uge1xuICAgIC8vIGZvciBPYmplY3RzLCB3ZSBjYW4gY3JlYXRlIGFuZCByZXVzZVxuICAgIC8vIGEgcHJvdG90eXBlIG9iamVjdC4gV2UgdGhlbiBuZWVkIHRvIG9ubHlcbiAgICAvLyBkZWZpbmUgdGhlIGRlZnMgYW5kIHRoZSAnaW5zdGFuY2UnIHByb3BlcnRpZXNcbiAgICAvLyBlLmcuIF9fLCBwYXJlbnQgZXRjLlxuICAgIHZhciBwcm90byA9IGNyZWF0ZU1vZGVsUHJvdG90eXBlKGRlZilcblxuICAgIGRlZmF1bHRWYWx1ZSA9IGZ1bmN0aW9uIChwYXJlbnQpIHtcbiAgICAgIHZhciBtb2RlbCA9IE9iamVjdC5jcmVhdGUocHJvdG8sIGNyZWF0ZU1vZGVsRGVzY3JpcHRvcnMoZGVmLCBwYXJlbnQpKVxuICAgICAgZGVmaW5lUHJvcGVydGllcyhtb2RlbClcbiAgICAgIHJldHVybiBtb2RlbFxuICAgIH1cblxuICAgIGFzc2VydCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKCFwcm90by5pc1Byb3RvdHlwZU9mKHZhbHVlKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcHJvdG90eXBlJylcbiAgICAgIH1cbiAgICB9XG5cbiAgICB3cmFwcGVyID0gbmV3IFdyYXBwZXIoZGVmYXVsdFZhbHVlLCBkZWYud3JpdGFibGUsIGRlZi52YWxpZGF0b3JzLCBkZWYuZ2V0dGVyLCBkZWYuc2V0dGVyLCBudWxsLCBhc3NlcnQpXG4gIH1cblxuICB2YXIgZmFjdG9yeSA9IGZ1bmN0aW9uIChwYXJlbnQpIHtcbiAgICB2YXIgd3JhcCA9IE9iamVjdC5jcmVhdGUod3JhcHBlcilcbiAgICAvLyBpZiAoIXdyYXAuaXNJbml0aWFsaXplZCkge1xuICAgIHdyYXAuX2luaXRpYWxpemUocGFyZW50KVxuICAgIC8vIH1cbiAgICByZXR1cm4gd3JhcFxuICB9XG5cbiAgLy8gZXhwb3NlIHRoZSB3cmFwcGVyLCB0aGlzIGlzIHVzZWRcbiAgLy8gZm9yIHZhbGlkYXRpbmcgYXJyYXkgaXRlbXMgbGF0ZXJcbiAgZmFjdG9yeS53cmFwcGVyID0gd3JhcHBlclxuXG4gIHJldHVybiBmYWN0b3J5XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlV3JhcHBlckZhY3RvcnlcbiIsIid1c2Ugc3RyaWN0J1xuXG5mdW5jdGlvbiBtZXJnZSAobW9kZWwsIG9iaikge1xuICB2YXIgaXNBcnJheSA9IG1vZGVsLl9fZGVmLmlzQXJyYXlcbiAgdmFyIGRlZnMgPSBtb2RlbC5fX2RlZi5kZWZzXG4gIHZhciBkZWZLZXlzLCBkZWYsIGtleSwgaSwgaXNTaW1wbGUsXG4gICAgaXNTaW1wbGVSZWZlcmVuY2UsIGlzSW5pdGlhbGl6ZWRSZWZlcmVuY2VcblxuICBpZiAoZGVmcykge1xuICAgIGRlZktleXMgPSBPYmplY3Qua2V5cyhkZWZzKVxuICAgIGZvciAoaSA9IDA7IGkgPCBkZWZLZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBrZXkgPSBkZWZLZXlzW2ldXG4gICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgZGVmID0gZGVmc1trZXldXG5cbiAgICAgICAgaXNTaW1wbGUgPSBkZWYuaXNTaW1wbGVcbiAgICAgICAgaXNTaW1wbGVSZWZlcmVuY2UgPSBkZWYuaXNSZWZlcmVuY2UgJiYgZGVmLnR5cGUuZGVmLmlzU2ltcGxlXG4gICAgICAgIGlzSW5pdGlhbGl6ZWRSZWZlcmVuY2UgPSBkZWYuaXNSZWZlcmVuY2UgJiYgb2JqW2tleV0gJiYgb2JqW2tleV0uX19zdXBlcm1vZGVsXG5cbiAgICAgICAgaWYgKGlzU2ltcGxlIHx8IGlzU2ltcGxlUmVmZXJlbmNlIHx8IGlzSW5pdGlhbGl6ZWRSZWZlcmVuY2UpIHtcbiAgICAgICAgICBtb2RlbFtrZXldID0gb2JqW2tleV1cbiAgICAgICAgfSBlbHNlIGlmIChvYmpba2V5XSkge1xuICAgICAgICAgIGlmIChkZWYuaXNSZWZlcmVuY2UpIHtcbiAgICAgICAgICAgIG1vZGVsW2tleV0gPSBkZWYudHlwZSgpXG4gICAgICAgICAgfVxuICAgICAgICAgIG1lcmdlKG1vZGVsW2tleV0sIG9ialtrZXldKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGlzQXJyYXkgJiYgQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IG9iai5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGl0ZW0gPSBtb2RlbC5jcmVhdGUoKVxuICAgICAgbW9kZWwucHVzaChpdGVtICYmIGl0ZW0uX19zdXBlcm1vZGVsID8gbWVyZ2UoaXRlbSwgb2JqW2ldKSA6IG9ialtpXSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbW9kZWxcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBtZXJnZVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBFbWl0dGVyRXZlbnQgPSByZXF1aXJlKCcuL2VtaXR0ZXItZXZlbnQnKVxudmFyIFZhbGlkYXRpb25FcnJvciA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbi1lcnJvcicpXG52YXIgV3JhcHBlciA9IHJlcXVpcmUoJy4vd3JhcHBlcicpXG52YXIgbWVyZ2UgPSByZXF1aXJlKCcuL21lcmdlJylcblxudmFyIGRlc2NyaXB0b3JzID0ge1xuICBfX3N1cGVybW9kZWw6IHtcbiAgICB2YWx1ZTogdHJ1ZVxuICB9LFxuICBfX2tleXM6IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXModGhpcylcblxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcykpIHtcbiAgICAgICAgdmFyIG9taXQgPSBbXG4gICAgICAgICAgJ2FkZEV2ZW50TGlzdGVuZXInLCAnb24nLCAnb25jZScsICdyZW1vdmVFdmVudExpc3RlbmVyJywgJ3JlbW92ZUFsbExpc3RlbmVycycsXG4gICAgICAgICAgJ3JlbW92ZUxpc3RlbmVyJywgJ29mZicsICdlbWl0JywgJ2xpc3RlbmVycycsICdoYXNMaXN0ZW5lcnMnLCAncG9wJywgJ3B1c2gnLFxuICAgICAgICAgICdyZXZlcnNlJywgJ3NoaWZ0JywgJ3NvcnQnLCAnc3BsaWNlJywgJ3VwZGF0ZScsICd1bnNoaWZ0JywgJ2NyZWF0ZScsICdfX21lcmdlJyxcbiAgICAgICAgICAnX19zZXROb3RpZnlDaGFuZ2UnLCAnX19ub3RpZnlDaGFuZ2UnLCAnX19zZXQnLCAnX19nZXQnLCAnX19jaGFpbicsICdfX3JlbGF0aXZlUGF0aCdcbiAgICAgICAgXVxuXG4gICAgICAgIGtleXMgPSBrZXlzLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgIHJldHVybiBvbWl0LmluZGV4T2YoaXRlbSkgPCAwXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBrZXlzXG4gICAgfVxuICB9LFxuICBfX25hbWU6IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLl9faXNSb290KSB7XG4gICAgICAgIHJldHVybiAnJ1xuICAgICAgfVxuXG4gICAgICAvLyBXb3JrIG91dCB0aGUgJ25hbWUnIG9mIHRoZSBtb2RlbFxuICAgICAgLy8gTG9vayB1cCB0byB0aGUgcGFyZW50IGFuZCBsb29wIHRocm91Z2ggaXQncyBrZXlzLFxuICAgICAgLy8gQW55IHZhbHVlIG9yIGFycmF5IGZvdW5kIHRvIGNvbnRhaW4gdGhlIHZhbHVlIG9mIHRoaXMgKHRoaXMgbW9kZWwpXG4gICAgICAvLyB0aGVuIHdlIHJldHVybiB0aGUga2V5IGFuZCBpbmRleCBpbiB0aGUgY2FzZSB3ZSBmb3VuZCB0aGUgbW9kZWwgaW4gYW4gYXJyYXkuXG4gICAgICB2YXIgcGFyZW50S2V5cyA9IHRoaXMuX19wYXJlbnQuX19rZXlzXG4gICAgICB2YXIgcGFyZW50S2V5LCBwYXJlbnRWYWx1ZVxuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcmVudEtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcGFyZW50S2V5ID0gcGFyZW50S2V5c1tpXVxuICAgICAgICBwYXJlbnRWYWx1ZSA9IHRoaXMuX19wYXJlbnRbcGFyZW50S2V5XVxuXG4gICAgICAgIGlmIChwYXJlbnRWYWx1ZSA9PT0gdGhpcykge1xuICAgICAgICAgIHJldHVybiBwYXJlbnRLZXlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgX19wYXRoOiB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5fX2hhc0FuY2VzdG9ycyAmJiAhdGhpcy5fX3BhcmVudC5fX2lzUm9vdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX3BhcmVudC5fX3BhdGggKyAnLicgKyB0aGlzLl9fbmFtZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19uYW1lXG4gICAgICB9XG4gICAgfVxuICB9LFxuICBfX2lzUm9vdDoge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuICF0aGlzLl9faGFzQW5jZXN0b3JzXG4gICAgfVxuICB9LFxuICBfX2NoaWxkcmVuOiB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY2hpbGRyZW4gPSBbXVxuXG4gICAgICB2YXIga2V5cyA9IHRoaXMuX19rZXlzXG4gICAgICB2YXIga2V5LCB2YWx1ZVxuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAga2V5ID0ga2V5c1tpXVxuICAgICAgICB2YWx1ZSA9IHRoaXNba2V5XVxuXG4gICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5fX3N1cGVybW9kZWwpIHtcbiAgICAgICAgICBjaGlsZHJlbi5wdXNoKHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjaGlsZHJlblxuICAgIH1cbiAgfSxcbiAgX19hbmNlc3RvcnM6IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBhbmNlc3RvcnMgPSBbXVxuICAgICAgdmFyIHIgPSB0aGlzXG5cbiAgICAgIHdoaWxlIChyLl9fcGFyZW50KSB7XG4gICAgICAgIGFuY2VzdG9ycy5wdXNoKHIuX19wYXJlbnQpXG4gICAgICAgIHIgPSByLl9fcGFyZW50XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhbmNlc3RvcnNcbiAgICB9XG4gIH0sXG4gIF9fZGVzY2VuZGFudHM6IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBkZXNjZW5kYW50cyA9IFtdXG5cbiAgICAgIGZ1bmN0aW9uIGNoZWNrQW5kQWRkRGVzY2VuZGFudElmTW9kZWwgKG9iaikge1xuICAgICAgICB2YXIga2V5cyA9IG9iai5fX2tleXNcbiAgICAgICAgdmFyIGtleSwgdmFsdWVcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBrZXkgPSBrZXlzW2ldXG4gICAgICAgICAgdmFsdWUgPSBvYmpba2V5XVxuXG4gICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLl9fc3VwZXJtb2RlbCkge1xuICAgICAgICAgICAgZGVzY2VuZGFudHMucHVzaCh2YWx1ZSlcbiAgICAgICAgICAgIGNoZWNrQW5kQWRkRGVzY2VuZGFudElmTW9kZWwodmFsdWUpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNoZWNrQW5kQWRkRGVzY2VuZGFudElmTW9kZWwodGhpcylcblxuICAgICAgcmV0dXJuIGRlc2NlbmRhbnRzXG4gICAgfVxuICB9LFxuICBfX2hhc0FuY2VzdG9yczoge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuICEhdGhpcy5fX2FuY2VzdG9ycy5sZW5ndGhcbiAgICB9XG4gIH0sXG4gIF9faGFzRGVzY2VuZGFudHM6IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiAhIXRoaXMuX19kZXNjZW5kYW50cy5sZW5ndGhcbiAgICB9XG4gIH0sXG4gIGVycm9yczoge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGVycm9ycyA9IFtdXG4gICAgICB2YXIgZGVmID0gdGhpcy5fX2RlZlxuICAgICAgdmFyIHZhbGlkYXRvciwgZXJyb3IsIGlcblxuICAgICAgLy8gUnVuIG93biB2YWxpZGF0b3JzXG4gICAgICB2YXIgb3duID0gZGVmLnZhbGlkYXRvcnMuc2xpY2UoMClcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBvd24ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFsaWRhdG9yID0gb3duW2ldXG4gICAgICAgIGVycm9yID0gdmFsaWRhdG9yLmNhbGwodGhpcywgdGhpcylcblxuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKHRoaXMsIGVycm9yLCB2YWxpZGF0b3IpKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBSdW4gdGhyb3VnaCBrZXlzIGFuZCBldmFsdWF0ZSB2YWxpZGF0b3JzXG4gICAgICB2YXIga2V5cyA9IHRoaXMuX19rZXlzXG4gICAgICB2YXIgdmFsdWUsIGtleSwgaXRlbURlZiwgZGlzcGxheU5hbWVcblxuICAgICAgZm9yIChpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAga2V5ID0ga2V5c1tpXVxuICAgICAgICBkaXNwbGF5TmFtZSA9IHRoaXMuX19kZWYuZGVmcyAmJiB0aGlzLl9fZGVmLmRlZnNba2V5XS5kaXNwbGF5TmFtZVxuICAgICAgICAvLyBJZiB3ZSBhcmUgYW4gQXJyYXkgd2l0aCBhbiBpdGVtIGRlZmluaXRpb25cbiAgICAgICAgLy8gdGhlbiB3ZSBoYXZlIHRvIGxvb2sgaW50byB0aGUgQXJyYXkgZm9yIG91ciB2YWx1ZVxuICAgICAgICAvLyBhbmQgYWxzbyBnZXQgaG9sZCBvZiB0aGUgd3JhcHBlci4gV2Ugb25seSBuZWVkIHRvXG4gICAgICAgIC8vIGRvIHRoaXMgaWYgdGhlIGtleSBpcyBub3QgYSBwcm9wZXJ0eSBvZiB0aGUgYXJyYXkuXG4gICAgICAgIC8vIFdlIGNoZWNrIHRoZSBkZWZzIHRvIHdvcmsgdGhpcyBvdXQgKGkuZS4gMCwgMSwgMikuXG4gICAgICAgIC8vIHRvZG86IFRoaXMgY291bGQgYmUgYmV0dGVyIHRvIGNoZWNrICFOYU4gb24gdGhlIGtleT9cbiAgICAgICAgaWYgKGRlZi5pc0FycmF5ICYmIGRlZi5kZWYgJiYgKCFkZWYuZGVmcyB8fCAhKGtleSBpbiBkZWYuZGVmcykpKSB7XG4gICAgICAgICAgLy8gSWYgd2UgYXJlIGFuIEFycmF5IHdpdGggYSBzaW1wbGUgaXRlbSBkZWZpbml0aW9uXG4gICAgICAgICAgLy8gb3IgYSByZWZlcmVuY2UgdG8gYSBzaW1wbGUgdHlwZSBkZWZpbml0aW9uXG4gICAgICAgICAgLy8gc3Vic3RpdHV0ZSB0aGUgdmFsdWUgd2l0aCB0aGUgd3JhcHBlciB3ZSBnZXQgZnJvbSB0aGVcbiAgICAgICAgICAvLyBjcmVhdGUgZmFjdG9yeSBmdW5jdGlvbi4gT3RoZXJ3aXNlIHNldCB0aGUgdmFsdWUgdG9cbiAgICAgICAgICAvLyB0aGUgcmVhbCB2YWx1ZSBvZiB0aGUgcHJvcGVydHkuXG4gICAgICAgICAgaXRlbURlZiA9IGRlZi5kZWZcblxuICAgICAgICAgIGlmIChpdGVtRGVmLmlzU2ltcGxlKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGl0ZW1EZWYuY3JlYXRlLndyYXBwZXJcbiAgICAgICAgICAgIHZhbHVlLl9zZXRWYWx1ZSh0aGlzW2tleV0pXG4gICAgICAgICAgfSBlbHNlIGlmIChpdGVtRGVmLmlzUmVmZXJlbmNlICYmIGl0ZW1EZWYudHlwZS5kZWYuaXNTaW1wbGUpIHtcbiAgICAgICAgICAgIHZhbHVlID0gaXRlbURlZi50eXBlLmRlZi5jcmVhdGUud3JhcHBlclxuICAgICAgICAgICAgdmFsdWUuX3NldFZhbHVlKHRoaXNba2V5XSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFsdWUgPSB0aGlzW2tleV1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gU2V0IHRoZSB2YWx1ZSB0byB0aGUgd3JhcHBlZCB2YWx1ZSBvZiB0aGUgcHJvcGVydHlcbiAgICAgICAgICB2YWx1ZSA9IHRoaXMuX19ba2V5XVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKHZhbHVlLl9fc3VwZXJtb2RlbCkge1xuICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoZXJyb3JzLCB2YWx1ZS5lcnJvcnMpXG4gICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFdyYXBwZXIpIHtcbiAgICAgICAgICAgIHZhciB3cmFwcGVyVmFsdWUgPSB2YWx1ZS5fZ2V0VmFsdWUodGhpcylcblxuICAgICAgICAgICAgaWYgKHdyYXBwZXJWYWx1ZSAmJiB3cmFwcGVyVmFsdWUuX19zdXBlcm1vZGVsKSB7XG4gICAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGVycm9ycywgd3JhcHBlclZhbHVlLmVycm9ycylcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGVycm9ycywgdmFsdWUuX2dldEVycm9ycyh0aGlzLCBrZXksIGRpc3BsYXlOYW1lIHx8IGtleSkpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBlcnJvcnNcbiAgICB9XG4gIH1cbn1cblxudmFyIHByb3RvID0ge1xuICBfX2dldDogZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiB0aGlzLl9fW2tleV0uX2dldFZhbHVlKHRoaXMpXG4gIH0sXG4gIF9fc2V0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgIHRoaXMuX19ba2V5XS5fc2V0VmFsdWUodmFsdWUsIHRoaXMpXG4gIH0sXG4gIF9fcmVsYXRpdmVQYXRoOiBmdW5jdGlvbiAodG8sIGtleSkge1xuICAgIHZhciByZWxhdGl2ZVBhdGggPSB0aGlzLl9fcGF0aFxuICAgICAgPyB0by5zdWJzdHIodGhpcy5fX3BhdGgubGVuZ3RoICsgMSlcbiAgICAgIDogdG9cblxuICAgIGlmIChyZWxhdGl2ZVBhdGgpIHtcbiAgICAgIHJldHVybiBrZXkgPyByZWxhdGl2ZVBhdGggKyAnLicgKyBrZXkgOiByZWxhdGl2ZVBhdGhcbiAgICB9XG4gICAgcmV0dXJuIGtleVxuICB9LFxuICBfX2NoYWluOiBmdW5jdGlvbiAoZm4pIHtcbiAgICByZXR1cm4gW3RoaXNdLmNvbmNhdCh0aGlzLl9fYW5jZXN0b3JzKS5mb3JFYWNoKGZuKVxuICB9LFxuICBfX21lcmdlOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHJldHVybiBtZXJnZSh0aGlzLCBkYXRhKVxuICB9LFxuICBfX25vdGlmeUNoYW5nZTogZnVuY3Rpb24gKGtleSwgbmV3VmFsdWUsIG9sZFZhbHVlKSB7XG4gICAgdmFyIHRhcmdldCA9IHRoaXNcbiAgICB2YXIgdGFyZ2V0UGF0aCA9IHRoaXMuX19wYXRoXG4gICAgdmFyIGV2ZW50TmFtZSA9ICdzZXQnXG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICBvbGRWYWx1ZTogb2xkVmFsdWUsXG4gICAgICBuZXdWYWx1ZTogbmV3VmFsdWVcbiAgICB9XG5cbiAgICB0aGlzLmVtaXQoZXZlbnROYW1lLCBuZXcgRW1pdHRlckV2ZW50KGV2ZW50TmFtZSwga2V5LCB0YXJnZXQsIGRhdGEpKVxuICAgIHRoaXMuZW1pdCgnY2hhbmdlJywgbmV3IEVtaXR0ZXJFdmVudChldmVudE5hbWUsIGtleSwgdGFyZ2V0LCBkYXRhKSlcbiAgICB0aGlzLmVtaXQoJ2NoYW5nZTonICsga2V5LCBuZXcgRW1pdHRlckV2ZW50KGV2ZW50TmFtZSwga2V5LCB0YXJnZXQsIGRhdGEpKVxuXG4gICAgdGhpcy5fX2FuY2VzdG9ycy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICB2YXIgcGF0aCA9IGl0ZW0uX19yZWxhdGl2ZVBhdGgodGFyZ2V0UGF0aCwga2V5KVxuICAgICAgaXRlbS5lbWl0KCdjaGFuZ2UnLCBuZXcgRW1pdHRlckV2ZW50KGV2ZW50TmFtZSwgcGF0aCwgdGFyZ2V0LCBkYXRhKSlcbiAgICB9KVxuICB9LFxuICBfX3NldE5vdGlmeUNoYW5nZTogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICB2YXIgb2xkVmFsdWUgPSB0aGlzLl9fZ2V0KGtleSlcbiAgICB0aGlzLl9fc2V0KGtleSwgdmFsdWUpXG4gICAgdmFyIG5ld1ZhbHVlID0gdGhpcy5fX2dldChrZXkpXG4gICAgdGhpcy5fX25vdGlmeUNoYW5nZShrZXksIG5ld1ZhbHVlLCBvbGRWYWx1ZSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgcHJvdG86IHByb3RvLFxuICBkZXNjcmlwdG9yczogZGVzY3JpcHRvcnNcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5mdW5jdGlvbiBmYWN0b3J5ICgpIHtcbiAgZnVuY3Rpb24gUHJvcCAodHlwZSkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBQcm9wKSkge1xuICAgICAgcmV0dXJuIG5ldyBQcm9wKHR5cGUpXG4gICAgfVxuXG4gICAgdGhpcy5fX3R5cGUgPSB0eXBlXG4gICAgdGhpcy5fX3ZhbGlkYXRvcnMgPSBbXVxuICB9XG4gIFByb3AucHJvdG90eXBlLnR5cGUgPSBmdW5jdGlvbiAodHlwZSkge1xuICAgIHRoaXMuX190eXBlID0gdHlwZVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgUHJvcC5wcm90b3R5cGUuZW51bWVyYWJsZSA9IGZ1bmN0aW9uIChlbnVtZXJhYmxlKSB7XG4gICAgdGhpcy5fX2VudW1lcmFibGUgPSBlbnVtZXJhYmxlXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBQcm9wLnByb3RvdHlwZS5jb25maWd1cmFibGUgPSBmdW5jdGlvbiAoY29uZmlndXJhYmxlKSB7XG4gICAgdGhpcy5fX2NvbmZpZ3VyYWJsZSA9IGNvbmZpZ3VyYWJsZVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgUHJvcC5wcm90b3R5cGUud3JpdGFibGUgPSBmdW5jdGlvbiAod3JpdGFibGUpIHtcbiAgICB0aGlzLl9fd3JpdGFibGUgPSB3cml0YWJsZVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgUHJvcC5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uIChrZXlzKSB7XG4gICAgaWYgKHRoaXMuX190eXBlICE9PSBBcnJheSkge1xuICAgICAgdGhpcy5fX3R5cGUgPSBPYmplY3RcbiAgICB9XG4gICAgZm9yICh2YXIga2V5IGluIGtleXMpIHtcbiAgICAgIHRoaXNba2V5XSA9IGtleXNba2V5XVxuICAgIH1cbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIFByb3AucHJvdG90eXBlLnZhbGlkYXRlID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgdGhpcy5fX3ZhbGlkYXRvcnMucHVzaChmbilcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIFByb3AucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChmbikge1xuICAgIHRoaXMuX19nZXQgPSBmblxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgUHJvcC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgdGhpcy5fX3NldCA9IGZuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBQcm9wLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHRoaXMuX192YWx1ZSA9IHZhbHVlXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBQcm9wLnByb3RvdHlwZS5uYW1lID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aGlzLl9fZGlzcGxheU5hbWUgPSBuYW1lXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBQcm9wLnJlZ2lzdGVyID0gZnVuY3Rpb24gKG5hbWUsIGZuKSB7XG4gICAgdmFyIHdyYXBwZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLl9fdmFsaWRhdG9ycy5wdXNoKGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpXG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUHJvcC5wcm90b3R5cGUsIG5hbWUsIHtcbiAgICAgIHZhbHVlOiB3cmFwcGVyXG4gICAgfSlcbiAgfVxuICByZXR1cm4gUHJvcFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnlcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgZW1pdHRlciA9IHJlcXVpcmUoJy4vZW1pdHRlci1vYmplY3QnKVxudmFyIGVtaXR0ZXJBcnJheSA9IHJlcXVpcmUoJy4vZW1pdHRlci1hcnJheScpXG52YXIgRW1pdHRlckV2ZW50ID0gcmVxdWlyZSgnLi9lbWl0dGVyLWV2ZW50JylcblxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJy4vdXRpbCcpLmV4dGVuZFxudmFyIG1vZGVsID0gcmVxdWlyZSgnLi9tb2RlbCcpXG52YXIgbW9kZWxQcm90byA9IG1vZGVsLnByb3RvXG52YXIgbW9kZWxEZXNjcmlwdG9ycyA9IG1vZGVsLmRlc2NyaXB0b3JzXG5cbnZhciBtb2RlbFByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobW9kZWxQcm90bywgbW9kZWxEZXNjcmlwdG9ycylcbnZhciBvYmplY3RQcm90b3R5cGUgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgcCA9IE9iamVjdC5jcmVhdGUobW9kZWxQcm90b3R5cGUpXG5cbiAgZW1pdHRlcihwKVxuXG4gIHJldHVybiBwXG59KSgpXG5cbmZ1bmN0aW9uIGNyZWF0ZUFycmF5UHJvdG90eXBlICgpIHtcbiAgdmFyIHAgPSBlbWl0dGVyQXJyYXkoZnVuY3Rpb24gKGV2ZW50TmFtZSwgYXJyLCBlKSB7XG4gICAgaWYgKGV2ZW50TmFtZSA9PT0gJ3VwZGF0ZScpIHtcbiAgICAgIC8qKlxuICAgICAgICogRm9yd2FyZCB0aGUgc3BlY2lhbCBhcnJheSB1cGRhdGVcbiAgICAgICAqIGV2ZW50cyBhcyBzdGFuZGFyZCBfX25vdGlmeUNoYW5nZSBldmVudHNcbiAgICAgICAqL1xuICAgICAgYXJyLl9fbm90aWZ5Q2hhbmdlKGUuaW5kZXgsIGUudmFsdWUsIGUub2xkVmFsdWUpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8qKlxuICAgICAgICogQWxsIG90aGVyIGV2ZW50cyBlLmcuIHB1c2gsIHNwbGljZSBhcmUgcmVsYXllZFxuICAgICAgICovXG4gICAgICB2YXIgdGFyZ2V0ID0gYXJyXG4gICAgICB2YXIgcGF0aCA9IGFyci5fX3BhdGhcbiAgICAgIHZhciBkYXRhID0gZVxuICAgICAgdmFyIGtleSA9IGUuaW5kZXhcblxuICAgICAgYXJyLmVtaXQoZXZlbnROYW1lLCBuZXcgRW1pdHRlckV2ZW50KGV2ZW50TmFtZSwgJycsIHRhcmdldCwgZGF0YSkpXG4gICAgICBhcnIuZW1pdCgnY2hhbmdlJywgbmV3IEVtaXR0ZXJFdmVudChldmVudE5hbWUsICcnLCB0YXJnZXQsIGRhdGEpKVxuICAgICAgYXJyLl9fYW5jZXN0b3JzLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgdmFyIG5hbWUgPSBpdGVtLl9fcmVsYXRpdmVQYXRoKHBhdGgsIGtleSlcbiAgICAgICAgaXRlbS5lbWl0KCdjaGFuZ2UnLCBuZXcgRW1pdHRlckV2ZW50KGV2ZW50TmFtZSwgbmFtZSwgdGFyZ2V0LCBkYXRhKSlcbiAgICAgIH0pXG4gICAgfVxuICB9KVxuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHAsIG1vZGVsRGVzY3JpcHRvcnMpXG5cbiAgZW1pdHRlcihwKVxuXG4gIGV4dGVuZChwLCBtb2RlbFByb3RvKVxuXG4gIHJldHVybiBwXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU9iamVjdE1vZGVsUHJvdG90eXBlIChwcm90bykge1xuICB2YXIgcCA9IE9iamVjdC5jcmVhdGUob2JqZWN0UHJvdG90eXBlKVxuXG4gIGlmIChwcm90bykge1xuICAgIGV4dGVuZChwLCBwcm90bylcbiAgfVxuXG4gIHJldHVybiBwXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUFycmF5TW9kZWxQcm90b3R5cGUgKHByb3RvLCBpdGVtRGVmKSB7XG4gIC8vIFdlIGRvIG5vdCB0byBhdHRlbXB0IHRvIHN1YmNsYXNzIEFycmF5LFxuICAvLyBpbnN0ZWFkIGNyZWF0ZSBhIG5ldyBpbnN0YW5jZSBlYWNoIHRpbWVcbiAgLy8gYW5kIG1peGluIHRoZSBwcm90byBvYmplY3RcbiAgdmFyIHAgPSBjcmVhdGVBcnJheVByb3RvdHlwZSgpXG5cbiAgaWYgKHByb3RvKSB7XG4gICAgZXh0ZW5kKHAsIHByb3RvKVxuICB9XG5cbiAgaWYgKGl0ZW1EZWYpIHtcbiAgICAvLyBXZSBoYXZlIGEgZGVmaW5pdGlvbiBmb3IgdGhlIGl0ZW1zXG4gICAgLy8gdGhhdCBiZWxvbmcgaW4gdGhpcyBhcnJheS5cblxuICAgIC8vIFVzZSB0aGUgYHdyYXBwZXJgIHByb3RvdHlwZSBwcm9wZXJ0eSBhcyBhXG4gICAgLy8gdmlydHVhbCBXcmFwcGVyIG9iamVjdCB3ZSBjYW4gdXNlXG4gICAgLy8gdmFsaWRhdGUgYWxsIHRoZSBpdGVtcyBpbiB0aGUgYXJyYXkuXG4gICAgdmFyIGFyckl0ZW1XcmFwcGVyID0gaXRlbURlZi5jcmVhdGUud3JhcHBlclxuXG4gICAgLy8gVmFsaWRhdGUgbmV3IG1vZGVscyBieSBvdmVycmlkaW5nIHRoZSBlbWl0dGVyIGFycmF5XG4gICAgLy8gbXV0YXRvcnMgdGhhdCBjYW4gY2F1c2UgbmV3IGl0ZW1zIHRvIGVudGVyIHRoZSBhcnJheS5cbiAgICBvdmVycmlkZUFycmF5QWRkaW5nTXV0YXRvcnMocCwgYXJySXRlbVdyYXBwZXIpXG5cbiAgICAvLyBQcm92aWRlIGEgY29udmVuaWVudCBtb2RlbCBmYWN0b3J5XG4gICAgLy8gZm9yIGNyZWF0aW5nIGFycmF5IGl0ZW0gaW5zdGFuY2VzXG4gICAgcC5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gaXRlbURlZi5pc1JlZmVyZW5jZSA/IGl0ZW1EZWYudHlwZSgpIDogaXRlbURlZi5jcmVhdGUoKS5fZ2V0VmFsdWUodGhpcylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcFxufVxuXG5mdW5jdGlvbiBvdmVycmlkZUFycmF5QWRkaW5nTXV0YXRvcnMgKGFyciwgaXRlbVdyYXBwZXIpIHtcbiAgZnVuY3Rpb24gZ2V0QXJyYXlBcmdzIChpdGVtcykge1xuICAgIHZhciBhcmdzID0gW11cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpdGVtV3JhcHBlci5fc2V0VmFsdWUoaXRlbXNbaV0sIGFycilcbiAgICAgIGFyZ3MucHVzaChpdGVtV3JhcHBlci5fZ2V0VmFsdWUoYXJyKSlcbiAgICB9XG4gICAgcmV0dXJuIGFyZ3NcbiAgfVxuXG4gIHZhciBwdXNoID0gYXJyLnB1c2hcbiAgdmFyIHVuc2hpZnQgPSBhcnIudW5zaGlmdFxuICB2YXIgc3BsaWNlID0gYXJyLnNwbGljZVxuICB2YXIgdXBkYXRlID0gYXJyLnVwZGF0ZVxuXG4gIGlmIChwdXNoKSB7XG4gICAgYXJyLnB1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgYXJncyA9IGdldEFycmF5QXJncyhhcmd1bWVudHMpXG4gICAgICByZXR1cm4gcHVzaC5hcHBseShhcnIsIGFyZ3MpXG4gICAgfVxuICB9XG5cbiAgaWYgKHVuc2hpZnQpIHtcbiAgICBhcnIudW5zaGlmdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBhcmdzID0gZ2V0QXJyYXlBcmdzKGFyZ3VtZW50cylcbiAgICAgIHJldHVybiB1bnNoaWZ0LmFwcGx5KGFyciwgYXJncylcbiAgICB9XG4gIH1cblxuICBpZiAoc3BsaWNlKSB7XG4gICAgYXJyLnNwbGljZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBhcmdzID0gZ2V0QXJyYXlBcmdzKEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMikpXG4gICAgICBhcmdzLnVuc2hpZnQoYXJndW1lbnRzWzFdKVxuICAgICAgYXJncy51bnNoaWZ0KGFyZ3VtZW50c1swXSlcbiAgICAgIHJldHVybiBzcGxpY2UuYXBwbHkoYXJyLCBhcmdzKVxuICAgIH1cbiAgfVxuXG4gIGlmICh1cGRhdGUpIHtcbiAgICBhcnIudXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGFyZ3MgPSBnZXRBcnJheUFyZ3MoW2FyZ3VtZW50c1sxXV0pXG4gICAgICBhcmdzLnVuc2hpZnQoYXJndW1lbnRzWzBdKVxuICAgICAgcmV0dXJuIHVwZGF0ZS5hcHBseShhcnIsIGFyZ3MpXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU1vZGVsUHJvdG90eXBlIChkZWYpIHtcbiAgcmV0dXJuIGRlZi5pc0FycmF5ID8gY3JlYXRlQXJyYXlNb2RlbFByb3RvdHlwZShkZWYucHJvdG8sIGRlZi5kZWYpIDogY3JlYXRlT2JqZWN0TW9kZWxQcm90b3R5cGUoZGVmLnByb3RvKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZU1vZGVsUHJvdG90eXBlXG4iLCIndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSB7fVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBwcm9wID0gcmVxdWlyZSgnLi9wcm9wJylcbnZhciBtZXJnZSA9IHJlcXVpcmUoJy4vbWVyZ2UnKVxudmFyIGNyZWF0ZURlZiA9IHJlcXVpcmUoJy4vZGVmJylcbnZhciBTdXBlcm1vZGVsID0gcmVxdWlyZSgnLi9zdXBlcm1vZGVsJylcblxuZnVuY3Rpb24gc3VwZXJtb2RlbHMgKHNjaGVtYSkge1xuICB2YXIgZGVmID0gY3JlYXRlRGVmKHNjaGVtYSlcblxuICBmdW5jdGlvbiBTdXBlcm1vZGVsQ29uc3RydWN0b3IgKGRhdGEpIHtcbiAgICB2YXIgbW9kZWwgPSBkZWYuaXNTaW1wbGUgPyBkZWYuY3JlYXRlKCkgOiBkZWYuY3JlYXRlKCkuX2dldFZhbHVlKHt9KVxuXG4gICAgaWYgKGRhdGEpIHtcbiAgICAgIC8vIGlmIHR3ZSBoYXZlIGJlZW4gcGFzc2VkIHNvbWVcbiAgICAgIC8vIGRhdGEsIG1lcmdlIGl0IGludG8gdGhlIG1vZGVsLlxuICAgICAgbW9kZWwuX19tZXJnZShkYXRhKVxuICAgIH1cbiAgICByZXR1cm4gbW9kZWxcbiAgfVxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3VwZXJtb2RlbENvbnN0cnVjdG9yLCAnZGVmJywge1xuICAgIHZhbHVlOiBkZWYgLy8gdGhpcyBpcyB1c2VkIHRvIHZhbGlkYXRlIHJlZmVyZW5jZWQgU3VwZXJtb2RlbENvbnN0cnVjdG9yc1xuICB9KVxuICBTdXBlcm1vZGVsQ29uc3RydWN0b3IucHJvdG90eXBlID0gU3VwZXJtb2RlbCAvLyB0aGlzIHNoYXJlZCBvYmplY3QgaXMgdXNlZCwgYXMgYSBwcm90b3R5cGUsIHRvIGlkZW50aWZ5IFN1cGVybW9kZWxDb25zdHJ1Y3RvcnNcbiAgU3VwZXJtb2RlbENvbnN0cnVjdG9yLmNvbnN0cnVjdG9yID0gU3VwZXJtb2RlbENvbnN0cnVjdG9yXG4gIHJldHVybiBTdXBlcm1vZGVsQ29uc3RydWN0b3Jcbn1cblxuc3VwZXJtb2RlbHMucHJvcCA9IHByb3BcbnN1cGVybW9kZWxzLm1lcmdlID0gbWVyZ2VcblxubW9kdWxlLmV4cG9ydHMgPSBzdXBlcm1vZGVsc1xuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBTdXBlcm1vZGVsID0gcmVxdWlyZSgnLi9zdXBlcm1vZGVsJylcblxuZnVuY3Rpb24gZXh0ZW5kIChvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8IHR5cGVvZiBhZGQgIT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIG9yaWdpblxuICB9XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpXG4gIHZhciBpID0ga2V5cy5sZW5ndGhcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXVxuICB9XG4gIHJldHVybiBvcmlnaW5cbn1cblxudmFyIHV0aWwgPSB7XG4gIGV4dGVuZDogZXh0ZW5kLFxuICB0eXBlT2Y6IGZ1bmN0aW9uIChvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikubWF0Y2goL1xccyhbYS16QS1aXSspLylbMV0udG9Mb3dlckNhc2UoKVxuICB9LFxuICBpc09iamVjdDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMudHlwZU9mKHZhbHVlKSA9PT0gJ29iamVjdCdcbiAgfSxcbiAgaXNBcnJheTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpXG4gIH0sXG4gIGlzU2ltcGxlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAvLyAnU2ltcGxlJyBoZXJlIG1lYW5zIGFueXRoaW5nXG4gICAgLy8gb3RoZXIgdGhhbiBhbiBPYmplY3Qgb3IgYW4gQXJyYXlcbiAgICAvLyBpLmUuIG51bWJlciwgc3RyaW5nLCBkYXRlLCBib29sLCBudWxsLCB1bmRlZmluZWQsIHJlZ2V4Li4uXG4gICAgcmV0dXJuICF0aGlzLmlzT2JqZWN0KHZhbHVlKSAmJiAhdGhpcy5pc0FycmF5KHZhbHVlKVxuICB9LFxuICBpc0Z1bmN0aW9uOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy50eXBlT2YodmFsdWUpID09PSAnZnVuY3Rpb24nXG4gIH0sXG4gIGlzRGF0ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMudHlwZU9mKHZhbHVlKSA9PT0gJ2RhdGUnXG4gIH0sXG4gIGlzTnVsbDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSBudWxsXG4gIH0sXG4gIGlzVW5kZWZpbmVkOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mICh2YWx1ZSkgPT09ICd1bmRlZmluZWQnXG4gIH0sXG4gIGlzTnVsbE9yVW5kZWZpbmVkOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5pc051bGwodmFsdWUpIHx8IHRoaXMuaXNVbmRlZmluZWQodmFsdWUpXG4gIH0sXG4gIGNhc3Q6IGZ1bmN0aW9uICh2YWx1ZSwgdHlwZSkge1xuICAgIGlmICghdHlwZSkge1xuICAgICAgcmV0dXJuIHZhbHVlXG4gICAgfVxuXG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlIFN0cmluZzpcbiAgICAgICAgcmV0dXJuIHV0aWwuY2FzdFN0cmluZyh2YWx1ZSlcbiAgICAgIGNhc2UgTnVtYmVyOlxuICAgICAgICByZXR1cm4gdXRpbC5jYXN0TnVtYmVyKHZhbHVlKVxuICAgICAgY2FzZSBCb29sZWFuOlxuICAgICAgICByZXR1cm4gdXRpbC5jYXN0Qm9vbGVhbih2YWx1ZSlcbiAgICAgIGNhc2UgRGF0ZTpcbiAgICAgICAgcmV0dXJuIHV0aWwuY2FzdERhdGUodmFsdWUpXG4gICAgICBjYXNlIE9iamVjdDpcbiAgICAgIGNhc2UgRnVuY3Rpb246XG4gICAgICAgIHJldHVybiB2YWx1ZVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNhc3QnKVxuICAgIH1cbiAgfSxcbiAgY2FzdFN0cmluZzogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdXRpbC50eXBlT2YodmFsdWUpID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHZhbHVlXG4gICAgfVxuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZyAmJiB2YWx1ZS50b1N0cmluZygpXG4gIH0sXG4gIGNhc3ROdW1iZXI6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gTmFOXG4gICAgfVxuICAgIGlmICh1dGlsLnR5cGVPZih2YWx1ZSkgPT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gdmFsdWVcbiAgICB9XG4gICAgcmV0dXJuIE51bWJlcih2YWx1ZSlcbiAgfSxcbiAgY2FzdEJvb2xlYW46IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGlmICghdmFsdWUpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICB2YXIgZmFsc2V5ID0gWycwJywgJ2ZhbHNlJywgJ29mZicsICdubyddXG4gICAgcmV0dXJuIGZhbHNleS5pbmRleE9mKHZhbHVlKSA9PT0gLTFcbiAgfSxcbiAgY2FzdERhdGU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHV0aWwudHlwZU9mKHZhbHVlKSA9PT0gJ2RhdGUnKSB7XG4gICAgICByZXR1cm4gdmFsdWVcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBEYXRlKHZhbHVlKVxuICB9LFxuICBpc0NvbnN0cnVjdG9yOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5pc1NpbXBsZUNvbnN0cnVjdG9yKHZhbHVlKSB8fCBbQXJyYXksIE9iamVjdF0uaW5kZXhPZih2YWx1ZSkgPiAtMVxuICB9LFxuICBpc1NpbXBsZUNvbnN0cnVjdG9yOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gW1N0cmluZywgTnVtYmVyLCBEYXRlLCBCb29sZWFuXS5pbmRleE9mKHZhbHVlKSA+IC0xXG4gIH0sXG4gIGlzU3VwZXJtb2RlbENvbnN0cnVjdG9yOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5pc0Z1bmN0aW9uKHZhbHVlKSAmJiB2YWx1ZS5wcm90b3R5cGUgPT09IFN1cGVybW9kZWxcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxcbiIsIid1c2Ugc3RyaWN0J1xuXG5mdW5jdGlvbiBWYWxpZGF0aW9uRXJyb3IgKHRhcmdldCwgZXJyb3IsIHZhbGlkYXRvciwga2V5KSB7XG4gIHRoaXMudGFyZ2V0ID0gdGFyZ2V0XG4gIHRoaXMuZXJyb3IgPSBlcnJvclxuICB0aGlzLnZhbGlkYXRvciA9IHZhbGlkYXRvclxuXG4gIGlmIChrZXkpIHtcbiAgICB0aGlzLmtleSA9IGtleVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmFsaWRhdGlvbkVycm9yXG4iLCIndXNlIHN0cmljdCdcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKVxudmFyIFZhbGlkYXRpb25FcnJvciA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbi1lcnJvcicpXG5cbmZ1bmN0aW9uIFdyYXBwZXIgKGRlZmF1bHRWYWx1ZSwgd3JpdGFibGUsIHZhbGlkYXRvcnMsIGdldHRlciwgc2V0dGVyLCBiZWZvcmVTZXQsIGFzc2VydCkge1xuICB0aGlzLnZhbGlkYXRvcnMgPSB2YWxpZGF0b3JzXG5cbiAgdGhpcy5fZGVmYXVsdFZhbHVlID0gZGVmYXVsdFZhbHVlXG4gIHRoaXMuX3dyaXRhYmxlID0gd3JpdGFibGVcbiAgdGhpcy5fZ2V0dGVyID0gZ2V0dGVyXG4gIHRoaXMuX3NldHRlciA9IHNldHRlclxuICB0aGlzLl9iZWZvcmVTZXQgPSBiZWZvcmVTZXRcbiAgdGhpcy5fYXNzZXJ0ID0gYXNzZXJ0XG4gIHRoaXMuaXNJbml0aWFsaXplZCA9IGZhbHNlXG5cbiAgaWYgKCF1dGlsLmlzRnVuY3Rpb24oZGVmYXVsdFZhbHVlKSkge1xuICAgIHRoaXMuaXNJbml0aWFsaXplZCA9IHRydWVcblxuICAgIGlmICghdXRpbC5pc1VuZGVmaW5lZChkZWZhdWx0VmFsdWUpKSB7XG4gICAgICB0aGlzLl92YWx1ZSA9IGRlZmF1bHRWYWx1ZVxuICAgIH1cbiAgfVxufVxuV3JhcHBlci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbiAocGFyZW50KSB7XG4gIGlmICh0aGlzLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIHRoaXMuX3NldFZhbHVlKHRoaXMuX2RlZmF1bHRWYWx1ZShwYXJlbnQpLCBwYXJlbnQpXG4gIHRoaXMuaXNJbml0aWFsaXplZCA9IHRydWVcbn1cbldyYXBwZXIucHJvdG90eXBlLl9nZXRFcnJvcnMgPSBmdW5jdGlvbiAobW9kZWwsIGtleSwgZGlzcGxheU5hbWUpIHtcbiAgbW9kZWwgPSBtb2RlbCB8fCB0aGlzXG4gIGtleSA9IGtleSB8fCAnJ1xuICBkaXNwbGF5TmFtZSA9IGRpc3BsYXlOYW1lIHx8IGtleVxuXG4gIHZhciBzaW1wbGUgPSB0aGlzLnZhbGlkYXRvcnNcbiAgdmFyIGVycm9ycyA9IFtdXG4gIHZhciB2YWx1ZSA9IHRoaXMuX2dldFZhbHVlKG1vZGVsKVxuICB2YXIgdmFsaWRhdG9yLCBlcnJvclxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2ltcGxlLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFsaWRhdG9yID0gc2ltcGxlW2ldXG4gICAgZXJyb3IgPSB2YWxpZGF0b3IuY2FsbChtb2RlbCwgdmFsdWUsIGRpc3BsYXlOYW1lKVxuXG4gICAgaWYgKGVycm9yKSB7XG4gICAgICBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKG1vZGVsLCBlcnJvciwgdmFsaWRhdG9yLCBrZXkpKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBlcnJvcnNcbn1cbldyYXBwZXIucHJvdG90eXBlLl9nZXRWYWx1ZSA9IGZ1bmN0aW9uIChtb2RlbCkge1xuICByZXR1cm4gdGhpcy5fZ2V0dGVyID8gdGhpcy5fZ2V0dGVyLmNhbGwobW9kZWwpIDogdGhpcy5fdmFsdWVcbn1cbldyYXBwZXIucHJvdG90eXBlLl9zZXRWYWx1ZSA9IGZ1bmN0aW9uICh2YWx1ZSwgbW9kZWwpIHtcbiAgaWYgKCF0aGlzLl93cml0YWJsZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignVmFsdWUgaXMgcmVhZG9ubHknKVxuICB9XG5cbiAgLy8gSG9vayB1cCB0aGUgcGFyZW50IHJlZiBpZiBuZWNlc3NhcnlcbiAgaWYgKHZhbHVlICYmIHZhbHVlLl9fc3VwZXJtb2RlbCAmJiBtb2RlbCkge1xuICAgIGlmICh2YWx1ZS5fX3BhcmVudCAhPT0gbW9kZWwpIHtcbiAgICAgIHZhbHVlLl9fcGFyZW50ID0gbW9kZWxcbiAgICB9XG4gIH1cblxuICB2YXIgdmFsXG4gIGlmICh0aGlzLl9zZXR0ZXIpIHtcbiAgICB0aGlzLl9zZXR0ZXIuY2FsbChtb2RlbCwgdmFsdWUpXG4gICAgdmFsID0gdGhpcy5fZ2V0VmFsdWUobW9kZWwpXG4gIH0gZWxzZSB7XG4gICAgdmFsID0gdGhpcy5fYmVmb3JlU2V0ID8gdGhpcy5fYmVmb3JlU2V0KHZhbHVlKSA6IHZhbHVlXG4gIH1cblxuICBpZiAodGhpcy5fYXNzZXJ0KSB7XG4gICAgdGhpcy5fYXNzZXJ0KHZhbClcbiAgfVxuXG4gIHRoaXMuX3ZhbHVlID0gdmFsXG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKFdyYXBwZXIucHJvdG90eXBlLCB7XG4gIHZhbHVlOiB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ2V0VmFsdWUoKVxuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHRoaXMuX3NldFZhbHVlKHZhbHVlKVxuICAgIH1cbiAgfSxcbiAgZXJyb3JzOiB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ2V0RXJyb3JzKClcbiAgICB9XG4gIH1cbn0pXG5tb2R1bGUuZXhwb3J0cyA9IFdyYXBwZXJcbiJdfQ==
