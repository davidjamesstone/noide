if (window.name !== window.location.href) {
  window.name = window.location.href
}

var Nes = require('nes/client')
var ace = require('brace')
var Slideout = require('slideout')
var treeView = require('../views/tree.html')
var initial = window._noide.file
var state = initial

var slideout = new Slideout({
  panel: document.getElementById('panel'),
  menu: document.getElementById('menu'),
  padding: 256,
  tolerance: 70
})
slideout.open()

document.querySelector('.js-slideout-toggle').addEventListener('click', function () {
  slideout.toggle()
})

require('brace/mode/javascript')
require('brace/theme/monokai')

var editor = ace.edit('editor')
window.onbeforeunload = function () {
  if (!editor.getSession().getUndoManager().isClean()) {
    return 'Unsaved changes - are you sure?'
  }
}
window.onerror = function (err) {
  editor.setValue(err)
}
// WebSocketTest()
function WebSocketTest () {
  if ('WebSocket' in window) {
    // Google example code
    //  var ws = new WebSocket("ws://example.com/service")
    //  ws.onopen = function()
    //  {
    //    // WebSocket is connected. You can send data by send() method
    //    ws.send("message to send"); ....
    //  }
    //  ws.onmessage = function (evt) { var received_msg = evt.data; ... }
    //  ws.onclose = function() { // websocket is closed. }
    alert('WebSockets supported here!\r\n\r\nBrowser: ' + navigator.userAgent + '\r\n\r\ntest by jimbergman.net (based on Google sample code)')
  } else {
    // the browser doesn't support WebSockets
    alert('WebSockets NOT supported here!\r\n\r\nBrowser: ' + navigator.userAgent + '\r\n\r\ntest by jimbergman.net (based on Google sample code)')
  }
}

function writeFile (contents) {
  client.request({
    path: '/writefile',
    payload: {
      path: initial.path,
      contents: contents
    },
    method: 'PUT'
  }, function (err, payload) {
    if (err) {
      throw err
    }
    editor.getSession().getUndoManager().markClean()
    state = payload
    console.log(payload)
  })
}

var noide = {
  editor: editor,
  open: function (href) {
    var win = window.open('', href)
    if (win.location.href === 'about:blank') {
      win = window.open(href, href)
    } else {
      win.focus()
    }
  }
}

editor.getSession().setMode('ace/mode/javascript')
editor.setTheme('ace/theme/monokai')

var client = new Nes.Client('ws://mbp.home:3000')

client.connect(function (err) {
  if (err) {
    throw err
  }

  client.request('hello', function (err, payload) {
    if (err) {
      throw err
    }
    console.log(payload)

    client.subscribe('/change', function (payload) {
      if (err) {
        throw err
      }

      var data = payload
      if (data.path === state.path) {
        if (data.stat.mtime !== state.stat.mtime) {
          if (window.confirm('File has been changed - reload?')) {
            window.location.reload()
          }
        }
      }
      console.log(payload)
    }, function (err) {
      if (err) {
        throw err
      }
    })

    client.subscribe('/unlink', function (payload) {
      if (err) {
        throw err
      }

      var data = payload
      if (data.path === state.path) {
        if (window.confirm('File has been removed - close this tab?')) {
          window.close()
        }
      }
      console.log(payload)
    }, function (err) {
      if (err) {
        throw err
      }
    })

    var lastConsolePid
    client.subscribe('/io', function (payload) {
      if (err) {
        throw err
      }
      if (lastConsolePid !== payload.pid) {
        lastConsolePid = payload.pid
        console.log(lastConsolePid)
      }
      console.log(payload.data)
    }, function (err) {
      if (err) {
        throw err
      }
    })

    client.subscribe('/io/pids', function (payload) {
      if (err) {
        throw err
      }
      console.log(payload)
    }, function (err) {
      console.error(err)
    })
    //
    // client.subscribe('/io/error', function (payload) {
    //   if (err) {
    //     throw err
    //   }
    //   console.log(payload)
    // }, function (err) {
    //   console.error(err)
    // })
    //
    // client.subscribe('/io/exit', function (payload) {
    //   if (err) {
    //     throw err
    //   }
    //   console.log(payload)
    // }, function (err) {
    //   console.error(err)
    // })

    client.onUpdate = function (message) {
      // console.log(message)
    }

    // client.request({
    //   path: '/io',
    //   payload: {
    //     task: {
    //       command: 'npm',
    //       args: ['run', 'test'],
    //       options: {}
    //     }
    //   },
    //   method: 'POST'
    // }, function (err, payload) {
    //   if (err) {
    //     throw err
    //   }
    //   console.log(payload)
    // })

  // client.request({
  //   path: '/readfile',
  //   payload: {
  //     path: initial.path
  //   },
  //   method: 'POST'
  // }, function (err, payload) {
  //   if (err) {
  //     editor.setValue(err)
  //     throw err
  //   }
  //   console.log(payload)
  //   editor.setValue(payload.contents)
  // })
  })
})

editor.commands.addCommands([{
  name: 'save',
  bindKey: {
    win: 'Ctrl-S',
    mac: 'Command-S'
  },
  exec: function (editor) {
    var editorSession = editor.getSession()
    console.log(editorSession)
    writeFile(editor.getValue())
  // var session = model.sessions.dirty.find(function (item) {
  //   return item.data === editorSession
  // })
  // if (session) {
  //   $scope.saveSession(session)
  // }
  },
  readOnly: false // this command should not apply in readOnly mode
}, {
  name: 'saveall',
  bindKey: {
    win: 'Ctrl-Shift-S',
    mac: 'Command-Option-S'
  },
  // exec: $scope.saveAllSessions,
  readOnly: false // this command should not apply in readOnly mode
}, {
  name: 'help',
  bindKey: {
    win: 'Ctrl-H',
    mac: 'Command-H'
  },
  exec: function () {
    // $modal.open({
    //   templateUrl: '/client/fs/views/keyboard-shortcuts.html',
    //   size: 'lg'
    // })
  },
  readOnly: false // this command should apply in readOnly mode
}])

window.noide = noide

function tree (data) {
  function treeify (list, idAttr, parentAttr, childrenAttr) {
    var treeList = []
    var lookup = {}
    var path, obj

    for (path in list) {
      obj = list[path]
      obj.label = obj.name
      lookup[obj[idAttr]] = obj
      obj[childrenAttr] = []
    }

    for (path in list) {
      obj = list[path]
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
//
// if (!this._tree) {
//   this._tree = treeify(this._watched, 'path', 'dir', 'children')
// }
//
// return this._tree
}

var patch = require('incremental-dom').patch
var t = tree(window._noide.watched)
var menuEl = document.getElementById('menu')

t[0].expanded = true

function onclick (fso) {
  if (!fso.isDirectory) {
    noide.open(this.href)
  } else {
    fso.expanded = !fso.expanded
    render()
  }
  return false
}

function update () {
  treeView(t, treeView, true, onclick)
}

function render () {
  patch(menuEl, update, t)
}
render()
