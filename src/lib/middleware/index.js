exports.cacheHeader = function(req, res, next) {
  res.header('Cache-Control', 'public, max-age=300');
  next();
};

exports._404 = function(req, res, next) {
  res.send(404, 'File Not found :(');
};

exports._500 = function(err, req, res, next) {
  res.send(500, err.stack);
};