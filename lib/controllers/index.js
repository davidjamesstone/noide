var fs = require('fs');
var path = require('path');
var utils = require('../utils');

exports.filesystem = require('./filesystem');

exports.index = function(req, res) {
	
	var pathquery = req.query.path;
	var noideConfig = app.get('noideConfig');
	
	if (pathquery) {
		
		var dirPath = utils.getPath(pathquery);
		
		// read dir
		utils.readDir(dirPath, function(err, items) {
			if (err) {
				console.log(err);
				throw err;
			}
			
			var procs = app.get('childprocs').children;
			var pids = [];
			for (var p in procs) {
				if (procs[p].sid == req.session.id) {
					pids.push({
						pid: p,
						cmd: procs[p].cmd,
						paths: procs[p].paths
					});
				}
			}
			
			res.render('ide', {
				initData: {
					dir: items,
					path: dirPath,
					name: path.basename(dirPath),
					config: noideConfig,
					procs: pids
				}
			});
			
		});
		
	} else {
		
		var prjdir = noideConfig.projectsDir;
		
		// read dir
		utils.readDir(prjdir, function(err, items) {
			if (err) {
				console.log(err);
				throw err;
			}
			
			var dirs = items.filter(function(item) {
				return item.isDirectory;
			});
			
			var pending = dirs.length;
			if (!pending) res.render('index', { items: [] });
			dirs.forEach(function(dir, index) {
				dir.path = path.join(prjdir, dir.name);
				var pkg = path.join(dir.path, 'package.json'); 
				
				fs.readFile(pkg, function (err, data) {
					if (!err) {
						dir.package = JSON.parse(data);
					}
					if (!--pending) {
						res.render('index', { 
							items: dirs.filter(function(item) {
								return item.package;
							})
						});
					}
				});
				
			});
			
		});
		
	}
};