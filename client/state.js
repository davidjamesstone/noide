var Fsos = require('./fsos')
var storageKey = 'noide'

function saveState (files) {
  var storage = {
    recent: this.recent.items.map(function (item) {
      return item.relativePath
    }),
    expanded: files.items.filter(function (item) {
      return item.expanded
    }).map(function (item) {
      return item.relativePath
    })
  }
  window.localStorage.setItem(storageKey, JSON.stringify(storage))
}

function loadState (files) {
  var storage = window.localStorage.getItem(storageKey)
  storage = storage ? JSON.parse(storage) : {}

  var file, i
  this.recent = new Fsos()

  if (storage.recent) {
    for (i = 0; i < storage.recent.length; i++) {
      file = files.findByPath(storage.recent[i])
      if (file) {
        this.recent.add(file)
      }
    }
  }

  if (storage.expanded) {
    for (i = 0; i < storage.expanded.length; i++) {
      file = files.findByPath(storage.expanded[i])
      if (file && file.isDirectory) {
        file.expanded = true
      }
    }
  }
}

var state = {
  recent: null,
  current: null,
  save: saveState,
  load: loadState
}

module.exports = state
