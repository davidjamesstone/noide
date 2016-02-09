module.exports = {
  method: 'GET',
  path: '/public/{path*}',
  config: {
    handler: {
      directory: {
        path: 'server/public',
        listing: true,
        index: true
      }
    },
    cache: {
      privacy: 'private',
      expiresIn: 60 * 1000 * 2880
    }
  }
}
