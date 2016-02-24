var supermodels = require('supermodels.js')
var Fso = require('./fso')
var prop = supermodels.prop()

module.exports = supermodels({
  file: Fso,
  editSession: Object,
  created: prop(Date).value(Date.now),
  modified: prop(Date).value(Date.now),
  get isClean () {
    return this.editSession.getUndoManager().isClean()
  },
  get isDirty () {
    return !this.isClean
  }
})
