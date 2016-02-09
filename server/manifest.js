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
  registrations: [
    {
      plugin: {
        register: 'inert'
      }
    },
    {
      plugin: {
        register: 'vision'
      }
    }]
}

module.exports = manifest
