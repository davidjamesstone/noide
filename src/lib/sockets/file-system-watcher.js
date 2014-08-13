var fsw = require('../services/file-system-watcher');
var Response = require('../../shared/response');
var FileSystemObject = require('../../shared/file-system-object');

var watcher = fsw.watcher;
var namespace = '/fswatch';

module.exports = function(io) {

  watcher.on('all', function(event, path, stat) {
    var isDirectory = stat ? stat.isDirectory() : (event === 'unlinkDir');
    var fso = new FileSystemObject(path, isDirectory);

    io.of(namespace).emit(event, new Response(null, fso));
    console.log('Watcher event happened', event, fso);
  });

  watcher.on('error', function(err) {
    io.of(namespace).emit('error', new Response(err));
    console.error('Watcher error happened', err);
  });

  io.of(namespace).on('connection', function(socket) {
    socket.emit('connection', new Response(null, fsw.watched));
  });

};
