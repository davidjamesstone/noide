var emitter = require('emitter-component');
var config = require('./config').editor;

function Editor(el) {
  this._editor = require('./ace')(el);
  this._editor.commands.addCommands([{
    name: 'save',
    bindKey: {
      win: 'Ctrl-S',
      mac: 'Command-S'
    },
    exec: this._onSave.bind(this),
    readOnly: false // this command should not apply in readOnly mode
  }, {
    name: 'saveall',
    bindKey: {
      win: 'Ctrl-Shift-S',
      mac: 'Command-Option-S'
    },
    exec: this._onSaveAll.bind(this),
    readOnly: false // this command should not apply in readOnly mode
  }, {
    name: 'help',
    bindKey: {
      win: 'Ctrl-H',
      mac: 'Command-H'
    },
    exec: this._onHelp.bind(this),
    readOnly: true // this command should apply in readOnly mode
  }]);
  this._session = null;
}
Editor.prototype = {
  getSession: function() {
    return this._session;
  },
  setSession: function(session) {
    this._session = session;
    this._editor.setSession(session._session);
  },
  clearSession: function() {
    this._session = null;
  },
  getValue: function() {
    return this._editor.getValue();
  },
  _onSave: function(editor, line) {
    this.emit('save', this._session);
  },
  _onSaveAll: function(editor, line) {
    this.emit('saveall');
  },
  _onHelp: function(editor, line) {
    this.emit('help');
  }
};

emitter(Editor.prototype);

module.exports = Editor;
