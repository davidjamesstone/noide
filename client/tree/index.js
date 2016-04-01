var patch = require('../patch')
var view = require('./view.html')
var fileMenu = require('../file-menu')
var state = require('../state')
var files = require('../files')

function makeTree (files) {
  function treeify (list, idAttr, parentAttr, childrenAttr) {
    var treeList = []
    var lookup = {}
    var i, obj

    for (i = 0; i < list.length; i++) {
      obj = list[i]
      lookup[obj[idAttr]] = obj
      obj[childrenAttr] = []
    }

    for (i = 0; i < list.length; i++) {
      obj = list[i]
      var parent = lookup[obj[parentAttr]]
      if (parent) {
        obj.parent = parent
        lookup[obj[parentAttr]][childrenAttr].push(obj)
      } else {
        treeList.push(obj)
      }
    }

    return treeList
  }
  return treeify(files.items, 'path', 'dir', 'children')
}

function Tree (el) {
  function onClick (file) {
    if (file.isDirectory) {
      file.expanded = !file.expanded
      render()
    }
    return false
  }

  function showMenu (e, file) {
    e.stopPropagation()
    fileMenu.show(e.pageX + 'px', e.pageY + 'px', file)
  }

  function render () {
    patch(el, view, makeTree(files)[0].children, true, state.current, showMenu, onClick)
  }

  this.render = render

  render()
}

var treeEl = document.getElementById('tree')

var treeView = new Tree(treeEl)

module.exports = treeView
