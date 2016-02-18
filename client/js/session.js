var supermodels = require('supermodels.js')
var prop = supermodels.prop()

module.exports = supermodels({
  editSession: Object,
  created: prop(Date).value(Date.now),
  modified: prop(Date).value(Date.now)
})
