module.exports = {
  name: 'example',
  method: function (a, b, next) { next(null, a + b) },
  options: {
    cache: {
      // cache: 'mongoCache',
      expiresIn: 30 * 1000,
      generateTimeout: 100
    }
  }
}
