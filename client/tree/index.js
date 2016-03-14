var patch = require('../patch')
var view = require('./view.html')

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

function Tree (el, files, state) {
  function onClick (file) {
    if (file.isDirectory) {
      file.expanded = !file.expanded
      render()
    }
  }

  function render () {
    patch(el, view, makeTree(files), true, state.current, onClick)
  }

  files.on('change', render)
  state.on('change:current', render)

  this.render = render
}

module.exports = Tree
