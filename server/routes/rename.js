var Boom = require('boom')
var fileutils = require('../file-system-utils')

module.exports = {
  method: 'PUT',
  path: '/rename',
  config: {
    handler: function (request, reply) {
      var oldPath = request.payload.oldPath
      var newPath = request.payload.newPath

      fileutils.rename(oldPath, newPath, function (err, data) {
        if (err) {
          return reply(Boom.badRequest('Rename failed', err))
        }
        reply(data)
      })
    }
  }
}
