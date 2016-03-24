function Session (data) {
  this.file = data.file
  this.editSession = data.editSession
}
Object.defineProperties(Session.prototype, {
  isClean: {
    get: function () {
      return !this.editSession.getUndoManager().isClean()
    }
  },
  isDirty: {
    get: function () {
      return !this.isClean
    }
  }
})

module.exports = Session
