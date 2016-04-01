var Joi = require('joi')
var path = require('path')
var argv = require('./argv')
var schema = require('./schema')
var config = require(argv.server ? path.resolve(process.cwd(), argv.server) : './server.json')

if (process.env.PORT) {
  config.server.port = process.env.PORT
}

Joi.validate(config, schema, function (err, value) {
  if (err) {
    throw new Error('The server config is invalid. ' + err.message)
  }

  // Update config with validated object
  config = value
})

module.exports = config
