var noide = require('../noide')
var client = require('../client')
var fs = require('../fs')
var util = require('../util')
var config = require('../../config/client')
var editor = window.ace.edit('editor')
var $shortcuts = window.jQuery('#keyboard-shortcuts').modal({ show: false })

// Set editor options
editor.setOptions({
  enableSnippets: true,
  enableBasicAutocompletion: true,
  enableLiveAutocompletion: false,
  fontSize: config.ace.fontSize
})

function save (file, session) {
  fs.writeFile(file.path, session.getValue(), function (err, payload) {
    if (err) {
      return util.handleError(err)
    }
    file.stat = payload.stat
    noide.markSessionClean(session)
  })
}

editor.commands.addCommands([{
  name: 'help',
  bindKey: {
    win: 'Ctrl-H',
    mac: 'Command-H'
  },
  exec: function () {
    $shortcuts.modal('show')
  },
  readOnly: true
}])

editor.setTheme('ace/theme/' + config.ace.theme)

editor.commands.addCommands([{
  name: 'save',
  bindKey: {
    win: 'Ctrl-S',
    mac: 'Command-S'
  },
  exec: function (editor) {
    var file = noide.current
    var session = noide.getSession(file)
    save(file, session)
  },
  readOnly: false
}, {
  name: 'saveall',
  bindKey: {
    win: 'Ctrl-Shift-S',
    mac: 'Command-Option-S'
  },
  exec: function (editor) {
    noide.dirty.forEach(function (session) {
      var file = session.file
      save(file, session)
    })
  },
  readOnly: false
}, {
  name: 'beautify',
  bindKey: {
    win: 'Ctrl-B',
    mac: 'Command-B'
  },
  exec: function (editor) {
    var file = noide.current
    var path

    if (file) {
      switch (file.ext) {
        case '.js':
          path = '/standard-format'
          break
        default:
      }

      if (path) {
        client.request({
          path: path,
          payload: {
            value: editor.getValue()
          },
          method: 'POST'
        }, function (err, payload) {
          if (err) {
            return util.handleError(err)
          }
          editor.setValue(payload)
        })
      }
    }
  },
  readOnly: false
}])

module.exports = editor
