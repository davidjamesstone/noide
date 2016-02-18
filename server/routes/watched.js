var fsw = require('../services/file-system-watcher')

module.exports = {
  method: 'GET',
  path: '/watched',
  config: {
    handler: function (request, reply) {
      return reply(fsw.watched)
    }
  }
}
