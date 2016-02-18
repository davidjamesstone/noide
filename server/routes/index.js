module.exports = {
  method: 'GET',
  path: '/',
  config: {
    handler: function (request, reply) {
      return reply.view('index')
    }
  }
}
