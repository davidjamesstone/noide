var controllers = require('../controllers');

exports.configure = function() {
	app.get('/', controllers.index);
	app.get('/fs/dir', controllers.filesystem.getDir);
	app.post('/fs/dir', controllers.filesystem.addDir);
	app.get('/fs/file', controllers.filesystem.getFile);
	app.put('/fs/file', controllers.filesystem.saveFile);
	app.post('/fs/file', controllers.filesystem.addFile);
	app.put('/fs', controllers.filesystem.rename);
	app.delete('/fs', controllers.filesystem.delete);

  app.get('/procs', function(req, res) {
    var o = {
      sid: req.session.id
    };
    var childprocs = require('../childprocs').children;
    for (var el in childprocs) {
      o[el] = childprocs[el].sid;
    }
    res.send(o);
  });

}