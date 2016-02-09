const config = require('../../config')

module.exports = {
  engines: {
    html: require('handlebars')
  },
  relativeTo: __dirname,
  layout: true,
  isCached: config.views.isCached,
  partialsPath: 'partials',
  helpersPath: 'helpers',
  context: {
    siteName: 'name.co',
    copyrightName: 'co.co',
    copyrightYear: (new Date()).getFullYear()
  }
}
