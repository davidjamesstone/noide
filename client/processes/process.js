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
