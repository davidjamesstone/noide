var client = require('./client')

function readFile (path, callback) {
  client.request({
    path: '/readfile?path=' + path,
    method: 'GET'
  }, callback)
}

function writeFile (path, contents, callback) {
  client.request({
    path: '/writefile',
    payload: {
      path: path,
      contents: contents
    },
    method: 'PUT'
  }, callback)
}

function mkdir (path, callback) {
  // this._socket.emit('mkdir', path, callback)
  client.request({
    path: '/mkdir',
    payload: {
      path: path
    },
    method: 'POST'
  }, callback)
}

function mkfile (path, callback) {
  // this._socket.emit('mkfile', path, callback)
  client.request({ path: '/mkfile',
    payload: {
      path: path
    },
    method: 'POST'
  }, callback)
}

function copy (source, destination, callback) {
  // this._socket.emit('copy', source, destination, callback)
  client.request({
    path: '/copy',
    payload: {
      source: source,
      destination: destination
    },
    method: 'POST'
  }, callback)
}

function rename (oldPath, newPath, callback) {
  // this._socket.emit('rename', oldPath, newPath, callback)
  client.request({
    path: '/rename',
    payload: {
      oldPath: oldPath,
      newPath: newPath
    },
    method: 'PUT'
  }, callback)
}

function remove (path, callback) {
  // this._socket.emit('remove', path, callback)
  client.request({
    path: '/remove',
    payload: {
      path: path
    },
    method: 'DELETE'
  }, callback)
}

module.exports = {
  mkdir: mkdir,
  mkfile: mkfile,
  copy: copy,
  readFile: readFile,
  writeFile: writeFile,
  rename: rename,
  remove: remove
}
