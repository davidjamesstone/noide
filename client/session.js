var config = require('../config/client')
var modes = require('./modes')
var EditSession = window.ace.require('ace/edit_session').EditSession
var UndoManager = window.ace.require('ace/undomanager').UndoManager

function Session (file, contents) {
  var editSession = new EditSession(contents, modes(file))
  editSession.setMode(modes(file))
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
