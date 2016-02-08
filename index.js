const Glupe = require('glupe')
const config = require('./config')

Glupe.compose(__dirname + '/server', config, function (err, server) {
  if (err) {
    throw err
  }

  server.start(function () {
    server.log('info', 'Server started')
    console.info('Server running at:', server.info)
  })
})
