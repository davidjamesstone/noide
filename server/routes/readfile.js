var Joi = require('joi')
var Boom = require('boom')
var fileutils = require('../file-system-utils')

module.exports = {
  method: 'GET',
  path: '/readfile',
  config: {
    handler: function (request, reply) {
      fileutils.readFile(request.query.path, function (err, data) {
        if (err) {
          return reply(Boom.badRequest('Read file failed', err))
        }
        return reply(data)
      })
    },
    validate: {
      query: {
        path: Joi.string().required()
      }
    }
  }
}
