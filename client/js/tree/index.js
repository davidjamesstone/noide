var page = require('page')
var patch = require('incremental-dom').patch
var view = require('./index.html')
var noide = require('../noide')

function Tree (el, fsos, state) {
  fsos.on('change', render)
  state.on('change:current', render)

  function onClick (fso) {
    if (!fso.isDirectory) {
      // page.show('/file?path=' + fso.path, fso)
      // noide.openFile(fso)
    } else {
      fso.expanded = !fso.expanded
      render()
    }
    return false
  }

  function update (tree) {
    view(tree, view, true, state.current, onClick)
  }

  function render () {
    var tree = makeTree(fsos)
    patch(el, update, tree)
  }

  function makeTree (data) {
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
    return treeify(data, 'path', 'dir', 'children')
  }

  this.render = render
}

module.exports = Tree
