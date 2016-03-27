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
  remove: function (session) {
    var idx = this.items.indexOf(session)
    if (idx > -1) {
      this.items.splice(idx, 1)
    }
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
