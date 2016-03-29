var fs = require('fs')
var Boom = require('boom')
var fileutils = require('../file-system-utils')

module.exports = {
  method: 'POST',
  path: '/mkdir',
  config: {
    handler: function (request, reply) {
      var path = request.payload.path

      fileutils.mkdir(path, function (err, data) {
        if (err) {
          return reply(Boom.badRequest('Make directory failed', err))
        }

        fs.stat(path, function (err, stat) {
          if (err) {
            return reply(Boom.badRequest('Make directory failed', err))
          }
          data.stat = stat
          return reply(data)
        })
      })
    }
  }
}
