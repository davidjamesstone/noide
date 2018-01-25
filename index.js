const Glupe = require('glupe')
const config = require('./config')
const sock = require('./server/file-system-watcher')
const appName = require('./package.json').name

for (let i = 2; i<=process.argv.length; i+=2) {
  switch(process.argv[i]) {
    case "--port":
      config.server.port = +process.argv[i+1];
      break;
    case "--host":
      config.server.host = process.argv[i+1];
      break;
  }
}

Glupe.compose(__dirname, config, function (err, server) {
  if (err) {
    throw err
  }

  const meta = {
    title: 'Noide',
    description: 'Web based code editor',
    keywords: 'code,nodejs,editor,browser',
    author: 'davidjamesstone@github.com',
    favicon: '/public/favicon.ico'
  }

  const onPostHandler = function (request, reply) {
    const response = request.response
    if (response.variety === 'view') {
      if (!response.source.context) {
        response.source.context = {}
      }

      /*
       * Apply page meta data
       * to the view context data
       */
      var context = response.source.context
      context.meta = context.meta || {}

      for (var key in meta) {
        if (!context.meta[key]) {
          context.meta[key] = meta[key]
        }
      }
    }
    return reply.continue()
  }

  const preResponse = function (request, reply) {
    var response = request.response

    if (response.isBoom) {
      // An error was raised during
      // processing the request
      var statusCode = response.output.statusCode

      // In the event of 404
      // return the `404` view
      // if (statusCode === 404) {
      //   return reply.view('404').code(statusCode)
      // }

      request.log('error', {
        statusCode: statusCode,
        data: response.data,
        message: response.message
      })

      // The return the `500` view
      // return reply.view('500').code(statusCode)
    }
    return reply.continue()
  }

  server.ext('onPostHandler', onPostHandler)
  server.ext('onPreResponse', preResponse)

  /*
   * Start the server
   */
  server.start(function (err) {
    var details = {
      name: appName,
      uri: server.info.uri
    }

    if (err) {
      details.error = err
      details.message = 'Failed to start ' + details.name
      server.log('error', details)
      throw err
    } else {
      details.config = config
      details.message = 'Started ' + details.name
      server.log('info', details)
      console.info(details.message)

      sock(server)
      server.subscription('/io')
      server.subscription('/io/pids')
    }
  })
})
