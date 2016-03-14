var Nes = require('nes/client')
var host = window.location.host
var client = new Nes.Client('ws://' + host)

module.exports = client
