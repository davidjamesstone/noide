const config = require('../config')

const manifest = {
  server: {},
  connections: [
    {
      port: config.server.port,
      host: config.server.home,
      labels: config.server.labels
    }
  ],
  registrations: []
}

module.exports = manifest
