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
