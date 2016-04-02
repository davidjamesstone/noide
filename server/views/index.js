const config = require('../../config')

module.exports = {
  engines: {
    html: require('handlebars')
  },
  relativeTo: __dirname,
  partialsPath: 'partials',
  isCached: config.views.isCached,
  context: {
    siteName: 'noide',
    copyrightName: 'noide',
    copyrightYear: (new Date()).getFullYear()
  }
}
