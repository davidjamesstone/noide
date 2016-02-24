var Slideout = require('slideout')
var noide = require('./noide')
var Tree = require('./tree')
var Recent = require('./recent')

window.onbeforeunload = function () {
  if (noide.sessions.dirty.length) {
    return 'Unsaved changes will be lost - are you sure you want to leave?'
  }
}

var menuEl = document.getElementById('menu')
var recentEl = document.getElementById('recent')
var treeEl = document.getElementById('tree')

noide.client.connect(function (err) {
  if (err) {
    return noide.handleError(err)
  }

  var tree = new Tree(treeEl, noide.files, noide.state)
  var recent = new Recent(recentEl, noide.state)

  noide.files.on('change', function () { tree.render() })
  noide.state.on('change', function () { recent.render() })
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
