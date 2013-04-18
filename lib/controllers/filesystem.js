var fs = require('fs');
var path = require('path');
var utils = require('../utils');

exports.getDir = function(req, res) {
	var fname = 'Get directory';
  var dirPath = utils.getPath(req.query.path);
	utils.readDir(dirPath, function(err, items) {
    if (err) {
			res.send({
				name: fname,
				msg: 'Cannot get [' + dirPath + ']',
				err: true
			});
    }
		res.send(items);
	});
};

exports.getFile = function(req, res) {
	var fname = 'Get file';
  var filePath = utils.getPath(req.query.path);
  fs.stat(filePath, function(err, stats) {
    if (err) {
			res.send({
				name: fname,
				msg: 'Cannot get [' + filePath + ']',
				err: true
			});
    } else if (stats.size > 1024 * 1024) {
			res.send({
				name: fname,
				msg: 'File larger than the maximum supported size.',
				err: true
			});
    } else {
      fs.readFile(filePath, 'utf8', function(err, data) {
        if (err) {
          console.log(err);
					res.send({
						name: fname,
						msg: 'Cannot get [' + filePath + ']',
						err: true
					});
        } else {
          res.send(data);
        }
      });
    }
  });
};

exports.saveFile = function(req, res) {
	var fname = 'Save file';
  var filePath = utils.getPath(req.body.path);
  var content = req.body.content;
  fs.writeFile(filePath, content, function(err) {
    if (err) {
			res.send({
				name: fname,
				msg: 'Cannot save [' + filePath + ']',
				err: true
			});
    }
    var msg = 'Saved file [' + filePath + ']';
    console.log(msg);
    res.send({
			name: fname,
      msg: msg
    });
  });
}

exports.rename = function (req, res) {
	var fname = 'Rename file';
  var oldPath = utils.getPath(req.body.path);
  var newPath = path.join(path.dirname(oldPath), req.body.newName);
  fs.rename(oldPath, newPath, function(err) {
    if (err) {
			res.send({
				name: fname,
				msg: 'Cannot rename [' + oldPath + ']',
				err: true
			});
    }
    var msg = 'Renamed file [' + oldPath + ']';
    console.log(msg);
    res.send({
			name: fname,
      msg: msg
    });
  });
};


exports.delete = function (req, res) {
	var fname = 'Delete file';
  var itemPath = utils.getPath(req.body.path);
  fs.stat(itemPath, function(err, item) {
    if (err) {
			res.send({
				name: fname,
				msg: 'Cannot delete [' + itemPath + ']',
				err: true
			});
    }
		if (item.isDirectory()) {
			require('rimraf')(itemPath, function(err) {
				var msg = (err ? 'Cannot remove directory ' : 'Directory removed ') + '[' + itemPath + ']';
				console.log(msg);
				res.send({
					name: fname,
					msg: msg,
					err: !!err
				});
			});
		} else {
			fs.unlink(itemPath, function(err) {
				var msg = (err ? 'Cannot remove file ' : 'File removed ') + '[' + itemPath + ']';
				console.log(msg);
				res.send({
					name: fname,
					msg: msg,
					err: !!err
				});
			});
		}
  });
};

exports.addFile = function (req, res) {
	var fname = 'Add file';
  var filePath = utils.getPath(req.body.path);
	fs.exists(filePath, function(exists) {
		if (exists) {
			res.send({
				name: fname,
				msg: 'File already exists',
				err: true
			});
		} else {
			fs.writeFile(filePath, '', 'utf8', function(err) {
				var msg = (err ? 'Cannot create file ' : 'File created ') + '[' + filePath + ']';
				console.log(msg);
				res.send({
					name: fname,
					msg: msg,
					err: !!err,
					data: err ? null : {
						name: path.basename(filePath),
						isDirectory: false,
						ext: path.extname(filePath)
					}
				});
			});
		}
	});
};

exports.addDir = function (req, res) {
	var fname = 'Add directory';
  var dirPath = utils.getPath(req.body.path);
	fs.exists(dirPath, function(exists) {
		if (exists) {
			res.send({
				name: fname,
				msg: 'Directory already exists',
				err: true
			});
		} else {
			fs.mkdir(dirPath, '0777', function(err) {
				var msg = (err ? 'Cannot create directory ' : 'Directory created ') + '[' + dirPath + ']';
				console.log(msg);
				res.send({
					name: fname,
					msg: msg,
					err: !!err,
					data: err ? null : {
						name: path.basename(dirPath),
						isDirectory: true
					}
				});
			});
		}
	});
};