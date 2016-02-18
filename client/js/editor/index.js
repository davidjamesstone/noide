var ace = require('brace')

require('brace/mode/javascript')
require('brace/theme/monokai')

function Editor (noide) {
  var editor = ace.edit('editor')

  editor.commands.addCommands([{
    name: 'save',
    bindKey: {
      win: 'Ctrl-S',
      mac: 'Command-S'
    },
    exec: function (editor) {
      var editorSession = editor.getSession()
      console.log(editorSession)
      noide.writeFile(editor.getValue())
    // var session = model.sessions.dirty.find(function (item) {
    //   return item.data === editorSession
    // })
    // if (session) {
    //   $scope.saveSession(session)
    // }
    },
    readOnly: false // this command should not apply in readOnly mode
  }, {
    name: 'saveall',
    bindKey: {
      win: 'Ctrl-Shift-S',
      mac: 'Command-Option-S'
    },
    // exec: $scope.saveAllSessions,
    readOnly: false // this command should not apply in readOnly mode
  }, {
    name: 'help',
    bindKey: {
      win: 'Ctrl-H',
      mac: 'Command-H'
    },
    exec: function () {
      // $modal.open({
      //   templateUrl: '/client/fs/views/keyboard-shortcuts.html',
      //   size: 'lg'
      // })
    },
    readOnly: false // this command should apply in readOnly mode
  }])

  editor.getSession().setMode('ace/mode/javascript')
  editor.setTheme('ace/theme/monokai')

  this.editor = editor
}

module.exports = Editor
