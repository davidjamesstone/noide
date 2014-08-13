var Response = function(err, data) {
  this.err = (err instanceof Error) ? err.toString() : err;
  this.data = data;
};

module.exports = Response;