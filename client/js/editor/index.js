var ace = require('brace')
require('brace/ext/language_tools')
require('brace/mode/css')
require('brace/mode/html')
require('brace/mode/javascript')
require('brace/mode/markdown')
require('brace/mode/json')
require('brace/mode/xml')
require('brace/theme/monokai')

var config = require('../../../config/client')

function Editor () {
  var editor = ace.edit('editor')

  // enable autocompletion and snippets
  editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: false
  })

  editor.commands.addCommands([{
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

  editor.setTheme('ace/theme/' + config.ace.theme)

  this.addCommands = function () {
    editor.commands.addCommands.apply(editor.commands, arguments)
  }
  this.setSession = function (editSession) {
    editor.setSession(editSession)
  }
}

module.exports = Editor
