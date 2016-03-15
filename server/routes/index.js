var path = require('path')

module.exports = {
  method: 'GET',
  path: '/',
  config: {
    handler: function (request, reply) {
      var cwd = process.cwd()
      var lastSep = cwd.lastIndexOf(path.sep)
      var title = lastSep > -1 ? cwd.substring(lastSep + 1) : cwd
      return reply.view('index', {
        meta: {
          title: title
        }
      })
    }
  }
}
