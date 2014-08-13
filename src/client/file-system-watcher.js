var utils = require('./utils');
var emitter = require('emitter-component');

/*
 * FileSystemWatcher constructor
 */
function FileSystemWatcher() {

  var socket = io.connect(utils.urlRoot() + '/fswatch');

  this._watched = {};

  socket.on('connection', function(res) {

    var data = res.data;

    utils.extend(this._watched, data);

    this.emit('connection', this._watched);
    this.emit('change');

  }.bind(this));

  socket.on('add', function(res) {

    var data = res.data;
    this._watched[data.path] = data;

    this.emit('add', data);
    this.emit('change');

  }.bind(this));

  socket.on('addDir', function(res) {

    var data = res.data;
    this._watched[data.path] = data;

    this.emit('addDir', res.data);
    this.emit('change');

  }.bind(this));

  socket.on('change', function(res) {

    var data = res.data;

    this.emit('modified', data);

  }.bind(this));

  socket.on('unlink', function(res) {

    var data = res.data;
    var fso = this._watched[data.path];

    if (fso) {
      delete this._watched[data.path];
      this.emit('unlink', fso);
      this.emit('change');
    }

  }.bind(this));

  socket.on('unlinkDir', function(res) {

    var data = res.data;
    var fso = this._watched[data.path];

    if (fso) {
      delete this._watched[data.path];
      this.emit('unlinkDir', fso);
      this.emit('change');
    }

  }.bind(this));

  socket.on('error', function(res) {

    this.emit('error', res.err);

  }.bind(this));

  function treeify(list, idAttr, parentAttr, childrenAttr) {

    var treeList = [];
    var lookup = {};
    var path, obj;

    for (path in list) {

      obj = list[path];
      obj.label = obj.name;
      lookup[obj[idAttr]] = obj;
      obj[childrenAttr] = [];
    }

    for (path in list) {
      obj = list[path];
      if (lookup[obj[parentAttr]]) {
        lookup[obj[parentAttr]][childrenAttr].push(obj);
      } else {
        treeList.push(obj);
      }
    }

    return treeList;

  }

  Object.defineProperties(this, {
    list: {
      get: function() {
        return this._watched;
      }
    },
    tree: {
      get: function() {
        return treeify(this._watched, 'path', 'dir', 'children');
      }
    }
  });

  this._socket = socket;
}
emitter(FileSystemWatcher.prototype);

var FileSystemWatcher = new FileSystemWatcher();

module.exports = FileSystemWatcher;
