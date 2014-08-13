var utils = require('../utils');
var emitter = require('emitter-component');
var config = require('./config').editor;
var EditSession = ace.require('ace/edit_session').EditSession;
var UndoManager = ace.require('ace/undomanager').UndoManager;

/*
 * Session constructor
 */
function Session(fso) {
  this.fso = fso;

  var path = fso.path;
  var contents = fso.contents;
  var session = new EditSession(contents);
  var mode = config.modes[fso.ext.toLowerCase()] || 'ace/mode/asciidoc';

  session.fso = fso; // to give ace editor access to the fso;
  session.setMode(mode);
  session.setUndoManager(new UndoManager());

  if (typeof config.tabSize === 'number') {
    session.setTabSize(config.tabSize);
  }
  if (typeof config.useSoftTabs === 'boolean') {
    session.setUseSoftTabs(config.useSoftTabs);
  }

  this._session = session;
  this._undoManager = session.getUndoManager();
}
Session.prototype.getValue = function() {
  return this._session.getValue();
};
Session.prototype.isDirty = function() {
  return !this._undoManager.isClean();
};
Session.prototype.markClean = function() {
  this._undoManager.markClean();
};

emitter(Session.prototype);

module.exports = Session;
