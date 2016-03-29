var Joi = require('joi')
var Boom = require('boom')
var fileutils = require('../file-system-utils')

module.exports = {
  method: 'DELETE',
  path: '/remove',
  config: {
    handler: function (request, reply) {
      var path = request.payload.path

      fileutils.remove(path, function (err, data) {
        if (err) {
          return reply(Boom.badRequest('Remove failed', err))
        }
        reply(data)
      })
    },
    validate: {
      payload: {
        path: Joi.string().required()
      }
    }
  }
}
