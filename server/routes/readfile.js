var Boom = require('boom')
var fileutils = require('../file-system-utils')

module.exports = {
  method: 'POST',
  path: '/readfile',
  config: {
    id: 'readfile',
    handler: function (request, reply) {
      fileutils.readFile(request.payload.path, function (err, data) {
        if (err) {
          return reply(Boom.badRequest('Read file failed', err))
        }
        return reply(data)
      })
    }
  }
}
