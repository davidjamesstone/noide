var Boom = require('boom')
var fileutils = require('../file-system-utils')

module.exports = {
  method: 'POST',
  path: '/copy',
  config: {
    handler: function (request, reply) {
      var source = request.payload.source
      var destination = request.payload.destination

      fileutils.copy(source, destination, function (err, data) {
        if (err) {
          return reply(Boom.badRequest('Copy failed', err))
        }
        reply(data)
      })
    }
  }
}
