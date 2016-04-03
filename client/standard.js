var util = require('./util')
var state = require('./state')
var client = require('./client')
var sessions = require('./sessions')
// var standardize = require('standard-format')

function linter () {
  function lint () {
    var file = state.current
    if (file && file.ext === '.js') {
      var session = sessions.find(file)
      if (session) {
        var editSession = session.editSession
        client.request({
          path: '/standard',
          payload: {
            value: editSession.getValue()
          },
          method: 'POST'
        }, function (err, payload) {
          if (err) {
            return util.handleError(err)
          }
          editSession.setAnnotations(payload)
          setTimeout(lint, 1500)
        })
      }
    } else {
      setTimeout(lint, 1500)
    }
  }
  lint()
}

module.exports = linter
