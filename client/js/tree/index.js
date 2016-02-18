var patch = require('incremental-dom').patch
var view = require('./index.html')

function Tree (el, fsos) {
  function onclick (fso) {
    if (!fso.isDirectory) {
      // noide.open(this.href)
    } else {
      fso.expanded = !fso.expanded
      render()
    }
    return false
  }

  var tree
  function update () {
    view(tree, view, true, onclick)
  }

  function render () {
    tree = makeTree(fsos)
    patch(el, update, tree)
  }
  // render()

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

      list = list.sort('isDirectory')
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
  // tree[0].expanded = true

  this.render = render
}

module.exports = Tree
