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
  var recent = []

  if (storage.recent) {
    for (i = 0; i < storage.recent.length; i++) {
      file = files.findByPath(storage.recent[i])
      if (file) {
        recent.push(file)
      }
    }
    this.recent = new Files({
      items: recent
    })
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
