const config = require('../config')

const manifest = {
  server: {},
  connections: [
    {
      port: config.server.port,
      host: config.server.host,
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
    },
    {
      plugin: {
        register: 'nes'
      }
    },
    {
      plugin: {
        register: 'good',
        options: config.logging
      }
    }]
}

module.exports = manifest
