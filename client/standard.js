var util = require('./util')
var noide = require('./noide')
var client = require('./client')

function linter () {
  function lint () {
    var file = noide.current
    if (file && file.ext === '.js') {
      var session = noide.getSession(file)
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
