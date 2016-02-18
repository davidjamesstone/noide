var Slideout = require('slideout')
var noide = require('./noide')
var Tree = require('./tree')

window.onbeforeunload = function () {
  if (noide.sessions.dirty) {
    return 'There are unsaved changes - are you sure?'
  }
}

var menuEl = document.getElementById('menu')

noide.client.connect(function (err) {
  if (err) {
    return noide.handleError(err)
  }

  var tree = new Tree(menuEl, noide.files)
  noide.files.on('change', function () { tree.render() })
})

var slideout = new Slideout({
  panel: document.getElementById('panel'),
  menu: menuEl,
  padding: 256,
  tolerance: 70
})
slideout.open()

document.querySelector('.js-slideout-toggle').addEventListener('click', function () {
  slideout.toggle()
})
