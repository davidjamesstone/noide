var supermodels = require('supermodels.js')
var Session = require('./session')

var prop = supermodels.prop()

prop.register('required', function () {
  return function (val, name) {
    if (!val) {
      return name + ' is required'
    }
  }
})

var schema = {
  items: [Session],
  current: Session,
  get dirty () {
    return false
  }
}

module.exports = supermodels(schema)
