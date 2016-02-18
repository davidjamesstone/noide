var supermodels = require('supermodels.js')
var Fso = require('./fso')

var schema = [Fso]

module.exports = supermodels(schema)
