var utils = require('./utils');
var emitter = require('emitter-component');
var EditSession = ace.require('ace/edit_session').EditSession;
var UndoManager = ace.require('ace/undomanager').UndoManager;

/*
 * SessionManager constructor
 */
function SessionManager() {

  this.isDirty = false;
  this.sessions = {};

  setInterval(function() {

    var sessions = this.sessions;
    for (var path in sessions) {
      if (sessions[path].isDirty()) {
        this._setIsDirty(true);
        return;
      }
    }
    this._setIsDirty(false);

  }.bind(this), 300);

}
SessionManager.prototype = {
  add: function(path, session) {
    this.sessions[path] = session;
    this.emit('sessionadd', session);
    this.emit('change');
  },
  remove: function(path) {
    var removed = this.sessions[path];
    if (removed) {
      delete this.sessions[path];
      this.emit('sessionremove', removed);
      this.emit('change');
    }
  },
  getSession: function(path) {
    return this.sessions[path];
  },
  _setIsDirty: function(value) {
    //if (this.isDirty !== value) {
      this.isDirty = value;
      this.emit('dirtychanged', value);
      this.emit('change');
    //}
  }
};

emitter(SessionManager.prototype);

var sessionManager = new SessionManager();

module.exports = sessionManager;
