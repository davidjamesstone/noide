var Joi = require('joi')

var serverSchema = Joi.object().required().keys({
  host: Joi.string().hostname().required(),
  port: Joi.number().required()
})

module.exports = {
  server: serverSchema,
  logging: Joi.object(),
  cacheViews: Joi.boolean().required(),
  analyticsAccount: Joi.string().required().default('')
}
