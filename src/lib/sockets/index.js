var socketio = require('socket.io');
var fileSystemSocket = require('./file-system');
var fileSystemWatcherSocket = require('./file-system-watcher');

module.exports = function(app) {
  var io = socketio.listen(app);

  fileSystemSocket(io);
  fileSystemWatcherSocket(io);

};
