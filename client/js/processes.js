var noide = require('./noide')
var Processes = require('./processes/index')
var processesEl = document.getElementById('processes')
var processes = new Processes(processesEl, noide)

module.exports = processes
