var ace = require('brace')
var supermodels = require('supermodels.js')
var config = require('../../config/client')
var modes = require('./modes')
var Session = require('./session')
var EditSession = ace.EditSession
var UndoManager = ace.UndoManager

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
