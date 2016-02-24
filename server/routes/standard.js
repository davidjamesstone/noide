var Boom = require('boom')
var standard = require('standard')

module.exports = {
  method: 'POST',
  path: '/standard',
  config: {
    handler: function (request, reply) {
      standard.lintText(request.payload.value, function (err, data) {
        if (err) {
          return reply(Boom.badRequest('An error occurred standardizing the code', err))
        }

        var annotations = []
        if (data.errorCount) {
          var messages = data.results[0].messages
          messages.forEach(function (message) {
            annotations.push(
              {
                row: message.line - 1, // must be 0 based
                column: message.column - 1,  // must be 0 based
                text: message.message,  // text to show in tooltip
                type: 'error'
              }
            )
          })
        }

        return reply(annotations)
      })
    }
  }
}
