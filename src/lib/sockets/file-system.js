var fileutils = require('../file-system-utils');
var Response = require('../../shared/response');

module.exports = function(io) {

  io.of('/fs').on('connection', function(socket) {

    socket.emit('connection', new Date());

    function responder(event, err, data, callback) {
      var response = new Response(err, data);
      if (typeof callback === 'function') {
        callback(response);
      }
      socket.emit(event, response);
    }

    socket.on('rename', function(oldPath, newPath, callback) {
      fileutils.rename(oldPath, newPath, function(err, data) {
        responder('rename', err, data, callback);
      });
    });

    socket.on('remove', function(path, callback) {
      fileutils.remove(path, function(err, data) {
        responder('remove', err, data, callback);
      });
    });

    socket.on('copy', function(source, destination, callback) {
      fileutils.copy(source, destination, function(err, data) {
        responder('copy', err, data, callback);
      });
    });

    socket.on('mkfile', function(path, callback) {
      fileutils.writeFile(path, '', function(err, data) {
        responder('mkfile', err, data, callback);
      });
    });

    socket.on('mkdir', function(path, callback) {
      fileutils.mkdir(path, function(err, data) {
        responder('mkdir', err, data, callback);
      });
    });

    socket.on('readfile', function(path, callback) {
      fileutils.readFile(path, function(err, data) {
        responder('readfile', err, data, callback);
      });
    });

    socket.on('writefile', function(path, contents, callback) {
      fileutils.writeFile(path, contents, function(err, data) {
        responder('writefile', err, data, callback);
      });
    });

  });
};
