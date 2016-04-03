var Boom = require('boom')
var standardize = require('standard-format')

module.exports = {
  method: 'POST',
  path: '/standard-format',
  config: {
    handler: function (request, reply) {
      try {
        var standardized = standardize.transform(request.payload.value)
        return reply(standardized)
      } catch (e) {
        return reply(Boom.badRequest('standard-format threw an error', e))
      }
    }
  }
}
