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
