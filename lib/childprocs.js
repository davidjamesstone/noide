var spawn = require('child_process').spawn
  , which = require('./which')
  , utils = require('./utils')
	, children = {};

exports.children = children;

exports.connect = function(io, sessionStore) {
	
	io
	.set('authorization', function(handshakeData, callback) {
		console.log("authorization");
		if (!handshakeData.headers.cookie) return callback('socket.io: no found cookie.', false);
		var signedCookies = require('express/node_modules/cookie').parse(handshakeData.headers.cookie);
		handshakeData.cookies = require('express/node_modules/connect/lib/utils').parseSignedCookies(signedCookies, '5up3453c43t');
		handshakeData.sid = handshakeData.cookies['sid'];
		callback(null, true);
	})	
	.on('connection', function(socket) {	
		socket.on('kill', onkill);
		socket.on('spawn', onspawn);
		socket.on('bind', onbind);
	});
	
	function onkill(options, callback) {
		var pid = options.pid;
		children[pid].p.kill();
		callback(pid);
	}
	
	function onbind(options, callback) {
		var pid = options.pid;
		var cid = options.cid;
		var clientId = this.id;
  	var child = children[pid];
		var p = child.p;
		if (child.sid != this.handshake.sid) callback(null) // validate session ownership of proc
		p.removeAllListeners();
		p.stdout.removeAllListeners();
		p.stderr.removeAllListeners();
		bindchildexit(p, clientId, cid);
		//bindchildclose(p, clientId, cid);
		bindstdoutdata(p, clientId, cid);
		bindstderrdata(p, clientId, cid);
		//bindstderrclose(p, clientId, cid);
		callback(pid);
	}
	
	function onspawn(options, callback) {
			
		var clientId = this.id;
		console.log(clientId);
		var cid = options.cid; // backbone model id - used as the message handle
		var command = options.command;
		var paths = options.paths; paths.pop();
		var opts = command.split(new RegExp('\\s+'));
		var cmd = which.sync(opts.shift());// todo - required for windows only
		var cwd = utils.getPath(paths);
		var child = spawn(cmd, opts, { cwd: cwd });
		var pid = child.pid;

		children[pid] = { p: child, sid: this.handshake.sid, cmd: command, paths: options.paths };
		
		bindchildexit(child, clientId, cid);
		//bindchildclose(child, clientId, cid);
		callback(pid);
		bindstdoutdata(child, clientId, cid);
		bindstderrdata(child, clientId, cid);
		//bindstderrclose(child, clientId, cid);
	}
	
	function bindchildexit(child, clientId, cid) {
		child.on('exit', function (code, signal) {
			delete children[this.pid];
			io.sockets.socket(clientId).emit(cid+'_childexit', code);
		});
	}
	
//	function bindchildclose(child, clientId, cid) {
//		child.on('close', function (code, signal) {
//			io.sockets.socket(clientId).emit(cid+'_childclose', code);
//		});
//	}
	
	function bindstdoutdata(child, clientId, cid) {
		child.stdout.on('data', function (data) {
			io.sockets.socket(clientId).emit(cid+'_stdoutdata', data.toString());
		});
	}
	
	function bindstderrdata(child, clientId, cid) {
		child.stderr.on('data', function (data) {
			io.sockets.socket(clientId).emit(cid+'_stderrdata', data.toString());
		});
	}
//
//	function bindstderrclose(child, clientId, cid) {
//		child.stderr.on('close', function (data) {
//			io.sockets.socket(clientId).emit(cid+'_stderrclose', data.toString());
//		});
//	}
		
}