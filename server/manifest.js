const config = require('../config')

const manifest = {
  server: {
    // cache: {
    //   engine: 'catbox-mongodb',
    //   host: '127.0.0.1'
    // }
  },
  connections: [
    {
      port: config.server.port,
      host: config.server.home,
      labels: 'web'
    }
  ],
  registrations: [
    // {
    //   plugin: {
    //     register: 'inert'
    //   }
    // },
    // {
    //   plugin: {
    //     register: 'vision'
    //   }
    // },
    // {
    //   plugin: {
    //     register: 'hapi-auth-cookie'
    //   }
    // },
    // {
    //   plugin: {
    //     register: 'lout'
    //   }
    // }
  ]
}

module.exports = manifest
