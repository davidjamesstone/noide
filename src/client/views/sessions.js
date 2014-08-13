var p = require('path');
var utils = require('../utils');
var emitter = require('emitter-component');
var FileSystemObject = require('../../shared/file-system-object');

var encode = utils.encodeString;
var decode = utils.decodeString;

function SessionsView(el, sessions) {

  this._sessions = sessions;

  this.$el = $(el).addClass('sessions');
  this.$buttons = this.$el.children('button');
  this.$list = this.$el.find('.dropdown-menu');
  this.$el.on('click', '.file > a', this._onFileClick.bind(this));
  this.$el.on('click', '.save-all', this._onSaveAllClick.bind(this));
  this.$el.on('click', '.dropdown-toggle', this._onDropDownClick.bind(this));

  setInterval(function() {

    for (var path in sessions) {
      if (!sessions[path].getUndoManager().isClean()) {
        this.setIsDirty(true);
        return;
      }
    }
    this.setIsDirty(false);

  }.bind(this), 1000);

}
SessionsView.prototype = {

  _template: _.template($('#sessions-tpl').text()),

  setIsDirty: function(value) {
    this._isDirty = value;

    var cleanCss = 'btn-inverse';
    var dirtyCss = 'btn-danger';

    this.$buttons.eq(0)[value ? 'removeAttr' : 'attr']('disabled', 'disabled');
    //this.$buttons.removeClass(!value ? dirtyCss : cleanCss);
    //this.$buttons.addClass(value ? dirtyCss : cleanCss);
  },

  _onFileClick: function(e) {
    e.preventDefault();
    e.stopPropagation();

    var path = $(e.currentTarget).data('path');

    var fso = new FileSystemObject(decode(path), false);

    this.emit('fileclick', fso);
    return false;
  },

  _onSaveAllClick: function(e) {
    this.emit('saveallclick', {
      sessions: this._sessions
    });
  },

  _onDropDownClick: function(e) {

    var data = {
      sessions: {}
    };

    for (var path in this._sessions) {
      data.sessions[path] = {
        path: path,
        pathid: utils.encodeString(path)
      };
    }
    this.$list.html(this._template(data));
  }

};

emitter(SessionsView.prototype);

module.exports = SessionsView;
