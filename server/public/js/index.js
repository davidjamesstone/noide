(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Nes = require('nes/client')
var host = window.location.host
var client = new Nes.Client('ws://' + host)

module.exports = client

},{"nes/client":24}],2:[function(require,module,exports){
var config = require('../../config/client')

var editor = window.ace.edit('editor')

// Set editor options
editor.setOptions({
  enableSnippets: true,
  enableBasicAutocompletion: true,
  enableLiveAutocompletion: false,
  fontSize: config.ace.fontSize
})

editor.commands.addCommands([{
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

editor.setTheme('ace/theme/' + config.ace.theme)

module.exports = editor

},{"../../config/client":18}],3:[function(require,module,exports){
var supermodels = require('supermodels.js')

var schema = {
  name: String,
  path: String,
  relativeDir: String,
  relativePath: String,
  dir: String,
  isDirectory: Boolean,
  ext: String,
  stat: Object,
  get isFile () {
    return !this.isDirectory
  },
  expanded: Boolean
}

module.exports = supermodels(schema)

},{"supermodels.js":29}],4:[function(require,module,exports){
var supermodels = require('supermodels.js')
var File = require('./file')

var schema = {
  items: [File],
  find: function (relativePath) {
    return this.items.find(function (item) {
      return item.relativePath === relativePath
    })
  },
  findByPath: function (path) {
    return this.items.find(function (item) {
      return item.path === path
    })
  }
}

module.exports = supermodels(schema)

},{"./file":3,"supermodels.js":29}],5:[function(require,module,exports){
var client = require('./client')

// var supermodels = require('supermodels.js')
// var Files = require('./files')
// var State = require('./state')
//
// var schema = {
//   files: Files,
//   state: State
// }
//
// module.exports = supermodels(schema)

function readFile (path, callback) {
  client.request({
    path: '/readfile?path=' + path,
    // payload: {
    //   path: path
    // },
    method: 'GET'
  }, callback)
}

// function openFile (file) {
//   var session = sessions.find(file)
//   if (session) {
//     state.current = file
//     editor.setSession(session.editSession)
//   } else {
//     readFile(file.path, function (err, payload) {
//       if (err) {
//         return handleError(err)
//       }
//
//       if (!state.recent.findByPath(file.path)) {
//         state.recent.unshift(file)
//       }
//
//       session = sessions.add(file, payload.contents)
//       state.current = file
//       editor.setSession(session.editSession)
//     })
//   }
// }

// function closeFile (file) {
//   var close = false
//   var session = sessions.find(file)
//
//   if (session && session.isDirty) {
//     if (window.confirm('There are unsaved changes to this file. Are you sure?')) {
//       close = true
//     }
//   } else {
//     close = true
//   }
//
//   if (close) {
//     // Remove from recent files
//     state.recent.splice(state.recent.indexOf(file), 1)
//
//     if (session) {
//       // Remove session
//       sessions.items.splice(sessions.items.indexOf(session), 1)
//
//       if (state.current === file) {
//         if (sessions.items.length) {
//           // Open the next session
//           openFile(sessions.items[0].file)
//         } else if (state.recent.length) {
//           // Open the next file
//           openFile(state.recent[0])
//         } else {
//           state.current = null
//           editor.setSession(null)
//         }
//       }
//     }
//   }
// }

function writeFile (path, contents, callback) {
  client.request({
    path: '/writefile',
    payload: {
      path: path,
      contents: contents
    },
    method: 'PUT'
  }, callback)
}

module.exports = {
  // run: run,
  // openFile: openFile,
  // closeFile: closeFile,
  readFile: readFile,
  writeFile: writeFile// ,
  // handleError: handleError
}

},{"./client":1}],6:[function(require,module,exports){
var page = require('page')
var qs = require('querystring')
var fs = require('./fs')
var state = require('./state')
var sessions = require('./sessions')
var Files = require('./files')
var Tree = require('./tree')
var Recent = require('./recent')
var util = require('./util')
var splitter = require('./splitter')
var editor = require('./editor')
var client = require('./client')

var mainEl = document.getElementById('main')
var recentEl = document.getElementById('recent')
var treeEl = document.getElementById('tree')
var workspacesEl = document.getElementById('workspaces')

window.onbeforeunload = function () {
  if (sessions.dirty.length) {
    return 'Unsaved changes will be lost - are you sure you want to leave?'
  }
}

splitter(document.getElementById('sidebar-workspaces'))
splitter(document.getElementById('workspaces-info'))
splitter(document.getElementById('main-footer'))

client.connect(function (err) {
  if (err) {
    return util.handleError(err)
  }

  client.request('/watched', function (err, payload) {
    if (err) {
      return util.handleError(err)
    }

    // Initialize the files
    var files = new Files({
      items: payload.watched
    })

    // Load the state from localStorage
    state.load(files)

    // Save state on page unload
    window.onunload = function () {
      console.log('log')
      state.save(files)
    }

    // Create a new noide instance
    // var noide = new Noide({
    //   state: state,
    //   files: files
    // })

    // Build the tree
    var treeView = new Tree(treeEl, files, state)
    treeView.render()

    // Build the recent list
    var recentView = new Recent(recentEl, state)
    recentView.render()

    page('/', function (ctx) {
      workspacesEl.className = 'welcome'
    })

    page('/file', function (ctx, next) {
      var path = qs.parse(ctx.querystring).path
      var file = files.find(path)

      if (!file) {
        return next()
      }

      var session = sessions.find(file)

      function setSession () {
        workspacesEl.className = 'editor'

        // Update state
        state.current = file

        var items = state.recent.items
        if (items.indexOf(file) < 0) {
          items.unshift(file)
        }

        // Set the editor session
        editor.setSession(session.editSession)
        editor.resize()
      }

      if (session) {
        setSession()
      } else {
        fs.readFile(path, function (err, payload) {
          if (err) {
            return util.handleError(err)
          }

          session = sessions.add(file, payload.contents)
          setSession()
        })
      }
    })

    page('*', function (ctx) {
      workspacesEl.className = 'not-found'
    })

    page({
      hashbang: true
    })
  })
})

},{"./client":1,"./editor":2,"./files":4,"./fs":5,"./recent":10,"./sessions":12,"./splitter":13,"./state":14,"./tree":15,"./util":17,"page":26,"querystring":22}],7:[function(require,module,exports){
module.exports = function (file) {
  var modes = {
    '.js': 'ace/mode/javascript',
    '.css': 'ace/mode/css',
    '.scss': 'ace/mode/scss',
    '.less': 'ace/mode/less',
    '.html': 'ace/mode/html',
    '.htm': 'ace/mode/html',
    '.ejs': 'ace/mode/html',
    '.json': 'ace/mode/json',
    '.md': 'ace/mode/markdown',
    '.coffee': 'ace/mode/coffee',
    '.jade': 'ace/mode/jade',
    '.php': 'ace/mode/php',
    '.py': 'ace/mode/python',
    '.sass': 'ace/mode/sass',
    '.txt': 'ace/mode/text',
    '.typescript': 'ace/mode/typescript',
    '.gitignore': 'ace/mode/gitignore',
    '.xml': 'ace/mode/xml'
  }

  return modes[file.ext]
}

},{}],8:[function(require,module,exports){
var patch = require('incremental-dom').patch

module.exports = function (el, view, data) {
  var args = Array.prototype.slice.call(arguments)
  if (args.length <= 3) {
    patch(el, view, data)
  } else {
    patch(el, function () {
      view.apply(this, args.slice(2))
    })
  }
}

},{"incremental-dom":23}],9:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementVoid = IncrementalDOM.elementVoid
var elementClose = IncrementalDOM.elementClose
var elementPlaceholder = IncrementalDOM.elementPlaceholder
var text = IncrementalDOM.text

module.exports = (function () {
var hoisted1 = ["class", "list-group"]
var hoisted2 = ["class", "close"]
var hoisted3 = ["class", "name icon icon-file-text"]
var hoisted4 = ["class", "list-group-item-text"]

return function recent (files, current, onClickClose) {
  elementOpen("div", null, hoisted1, "style", {display: files.length ? '' : 'none'})
    ;(Array.isArray(files) ? files : Object.keys(files)).forEach(function(file, $index) {
      elementOpen("a", file.relativePath, null, "title", file.relativePath, "href", '/file?path=' + file.relativePath, "class", 'list-group-item' + (file === current ? ' active' : ''))
        elementOpen("span", null, hoisted2, "onclick", function ($event) {
          $event.preventDefault();
          var $element = this;
        onClickClose(file)})
          text("×")
        elementClose("span")
        elementOpen("span", null, hoisted3, "data-name", file.name, "data-path", file.relativePath)
          text("" + (file.name) + "")
        elementClose("span")
        if (false) {
          elementOpen("p", null, hoisted4)
            text("" + ('./' + (file.relativePath !== file.name ? file.relativeDir : '')) + "")
          elementClose("p")
        }
      elementClose("a")
    }, files)
  elementClose("div")
}
})();

},{"incremental-dom":23}],10:[function(require,module,exports){
var page = require('page')
var patch = require('../patch')
var state = require('../state')
var view = require('./index.html')
var sessions = require('../sessions')

function closeFile (file) {
  var session = sessions.find(file)

  var close = session && session.isDirty
    ? window.confirm('There are unsaved changes to this file. Are you sure?')
    : true

  if (close) {
    // Remove from recent files
    state.recent.items.splice(state.recent.items.indexOf(file), 1)

    if (session) {
      // Remove session
      sessions.items.splice(sessions.items.indexOf(session), 1)

      if (state.current === file) {
        if (sessions.items.length) {
          // Open the first session
          page('/file?path=' + sessions.items[0].file.relativePath)
          // openFile(sessions.items[0].file)
        } else if (state.recent.items.length) {
          // Open the next file
          // openFile(state.recent[0])
          page('/file?path=' + state.recent.items[0].relativePath)
        } else {
          state.current = null
          // editor.setSession(null)
        }
      }
    }
  }
}

function Recent (el) {
  function onClickClose (file) {
    closeFile(file)
  }

  function render () {
    patch(el, view, state.recent.items, state.current, onClickClose)
  }

  state.on('change', render)

  this.render = render
}

module.exports = Recent

},{"../patch":8,"../sessions":12,"../state":14,"./index.html":9,"page":26}],11:[function(require,module,exports){
var supermodels = require('supermodels.js')
var File = require('./file')
var prop = supermodels.prop()

module.exports = supermodels({
  file: File,
  editSession: Object,
  created: prop(Date).value(Date.now),
  modified: prop(Date).value(Date.now),
  get isClean () {
    return this.editSession.getUndoManager().isClean()
  },
  get isDirty () {
    return !this.isClean
  }
})

},{"./file":3,"supermodels.js":29}],12:[function(require,module,exports){
var supermodels = require('supermodels.js')
var config = require('../config/client')
var modes = require('./modes')
var Session = require('./session')
var EditSession = window.ace.require('ace/edit_session').EditSession
var UndoManager = window.ace.require('ace/undomanager').UndoManager

var schema = {
  items: [Session],
  get dirty () {
    return this.items.filter(function (item) {
      return !item.isClean
    })
  },
  find: function (file) {
    return this.items.find(function (item) {
      return item.file === file
    })
  },
  add: function (file, contents) {
    var editSession = new EditSession(contents, modes(file))
    editSession.setMode(modes(file))
    editSession.setUseWorker(false)
    editSession.setTabSize(config.ace.tabSize)
    editSession.setUseSoftTabs(config.ace.useSoftTabs)
    editSession.setUndoManager(new UndoManager())

    var session = new Session({
      file: file,
      editSession: editSession
    })

    this.items.push(session)

    return session
  }
}

var Sessions = supermodels(schema)

var sessions = new Sessions()

module.exports = sessions

},{"../config/client":18,"./modes":7,"./session":11,"supermodels.js":29}],13:[function(require,module,exports){
var w = window
var d = document

function splitter (handle, onEndCallback) {
  var last
  var horizontal = handle.classList.contains('horizontal')
  var el1 = handle.previousElementSibling
  var el2 = handle.nextElementSibling

  function onDrag (e) {
    if (horizontal) {
      var hT, hB
      var hDiff = e.clientY - last

      hT = d.defaultView.getComputedStyle(el1, '').getPropertyValue('height')
      hB = d.defaultView.getComputedStyle(el2, '').getPropertyValue('height')
      hT = parseInt(hT, 10) + hDiff
      hB = parseInt(hB, 10) - hDiff
      el1.style.height = hT + 'px'
      el2.style.height = hB + 'px'
      last = e.clientY
    } else {
      var wL, wR
      var wDiff = e.clientX - last

      wL = d.defaultView.getComputedStyle(el1, '').getPropertyValue('width')
      wR = d.defaultView.getComputedStyle(el2, '').getPropertyValue('width')
      wL = parseInt(wL, 10) + wDiff
      wR = parseInt(wR, 10) - wDiff
      el1.style.width = wL + 'px'
      el2.style.width = wR + 'px'
      last = e.clientX
    }
  }

  function onEndDrag (e) {
    e.preventDefault()
    w.removeEventListener('mousemove', onDrag)
    w.removeEventListener('mouseup', onEndDrag)
    if (onEndCallback) {
      onEndCallback()
    }
    // noide.editor.resize()
    // var processes = require('./processes')
    // processes.editor.resize()
  }

  handle.addEventListener('mousedown', function (e) {
    e.preventDefault()

    last = horizontal ? e.clientY : e.clientX

    w.addEventListener('mousemove', onDrag)
    w.addEventListener('mouseup', onEndDrag)
  })
}

module.exports = splitter

},{}],14:[function(require,module,exports){
var supermodels = require('supermodels.js')
var File = require('./file')
var Files = require('./files')
var storageKey = 'noide'

function saveState (files) {
  var storage = {
    recent: this.recent.items.map(function (item) {
      return item.path
    }),
    expanded: files.items.filter(function (item) {
      return item.expanded
    }).map(function (item) {
      return item.path
    })
  }
  window.localStorage.setItem(storageKey, JSON.stringify(storage))
}

function loadState (files) {
  var storage = window.localStorage.getItem(storageKey)
  storage = storage ? JSON.parse(storage) : {}

  var dir, file, i
  this.recent = new Files()

  if (storage.recent) {
    for (i = 0; i < storage.recent.length; i++) {
      file = files.findByPath(storage.recent[i])
      if (file) {
        this.recent.items.push(file)
      }
    }
  }

  if (storage.expanded) {
    for (i = 0; i < storage.expanded.length; i++) {
      dir = files.findByPath(storage.expanded[i])
      if (dir) {
        dir.expanded = true
      }
    }
  }
}

var schema = {
  recent: Files,
  current: File,
  save: saveState,
  load: loadState
}

var State = supermodels(schema)

var state = new State()

module.exports = state

},{"./file":3,"./files":4,"supermodels.js":29}],15:[function(require,module,exports){
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

},{"../patch":8,"./view.html":16}],16:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementVoid = IncrementalDOM.elementVoid
var elementClose = IncrementalDOM.elementClose
var elementPlaceholder = IncrementalDOM.elementPlaceholder
var text = IncrementalDOM.text

module.exports = (function () {
var hoisted1 = ["class", "name icon icon-file-text"]
var hoisted2 = ["class", "file-name"]
var hoisted3 = ["class", "expanded"]
var hoisted4 = ["class", "collapsed"]
var hoisted5 = ["class", "name icon icon-file-directory"]
var hoisted6 = ["class", "dir-name"]
var hoisted7 = ["class", "triangle-left"]

return function tree (data, isRoot, current, onClick) {
  elementOpen("ul", null, null, "class", isRoot ? 'tree' : '')
    ;(Array.isArray(data) ? data : Object.keys(data)).forEach(function(fso, $index) {
      elementOpen("li", fso.path, null, "class", fso.isDirectory ? 'dir' : 'file' + (fso === current ? ' selected' : ''))
        if (fso.isFile) {
          elementOpen("a", null, null, "href", '/file?path=' + fso.relativePath)
            elementOpen("span", null, hoisted1, "data-name", fso.name, "data-path", fso.relativePath)
            elementClose("span")
            elementOpen("span", null, hoisted2)
              text("" + (fso.name) + "")
            elementClose("span")
          elementClose("a")
        }
        if (fso.isDirectory) {
          elementOpen("a", null, null, "onclick", function ($event) {
            $event.preventDefault();
            var $element = this;
          onClick(fso)})
            if (fso.expanded) {
              elementOpen("small", null, hoisted3)
                text("▼")
              elementClose("small")
            }
            if (!fso.expanded) {
              elementOpen("small", null, hoisted4)
                text("▶")
              elementClose("small")
            }
            elementOpen("span", null, hoisted5, "data-name", fso.name, "data-path", fso.relativePath)
            elementClose("span")
            elementOpen("span", null, hoisted6)
              text("" + (fso.name) + "")
            elementClose("span")
          elementClose("a")
        }
        if (fso.isFile && fso === current) {
          elementOpen("span", null, hoisted7)
          elementClose("span")
        }
        if (fso.isDirectory && fso.expanded) {
          fso.children.sort(function(a, b) {
                    if (a.isDirectory) {
                      if (b.isDirectory) {
                        return a.name.toLowerCase()
          < b.name.toLowerCase() ? -1 : 1
                      } else {
                        return -1
                      }
                    } else {
                      if (b.isDirectory) {
                        return 1
                      } else {
                        return a.name.toLowerCase()
          < b.name.toLowerCase() ? -1 : 1
                      }
                    }
                  })

                  // var viewModel = {
                  //   isRoot: false,
                  //   tree: fso.children,
                  //   current: data.current,
                  //   view: data.view,
                  //   onClick: data.onClick
                  // }

                  tree(fso.children, false, current, onClick)
        }
      elementClose("li")
    }, data)
  elementClose("ul")
}
})();

},{"incremental-dom":23}],17:[function(require,module,exports){
function handleError (err) {
  console.error(err)
}

module.exports = {
  handleError: handleError
}

},{}],18:[function(require,module,exports){
module.exports = {
  ace: {
    tabSize: 2,
    fontSize: 14,
    theme: 'monokai',
    useSoftTabs: true
  }
}

},{}],19:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],20:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],21:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],22:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":20,"./encode":21}],23:[function(require,module,exports){
(function (process){

/**
 * @license
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
  * Keeps track whether or not we are in an attributes declaration (after
  * elementOpenStart, but before elementOpenEnd).
  * @type {boolean}
  */
var inAttributes = false;

/**
  * Keeps track whether or not we are in an element that should not have its
  * children cleared.
  * @type {boolean}
  */
var inSkip = false;

/**
 * Makes sure that there is a current patch context.
 * @param {*} context
 */
var assertInPatch = function (context) {
  if (!context) {
    throw new Error('Cannot call currentElement() unless in patch');
  }
};

/**
* Makes sure that keyed Element matches the tag name provided.
* @param {!string} nodeName The nodeName of the node that is being matched.
* @param {string=} tag The tag name of the Element.
* @param {?string=} key The key of the Element.
*/
var assertKeyedTagMatches = function (nodeName, tag, key) {
  if (nodeName !== tag) {
    throw new Error('Was expecting node with key "' + key + '" to be a ' + tag + ', not a ' + nodeName + '.');
  }
};

/**
 * Makes sure that a patch closes every node that it opened.
 * @param {?Node} openElement
 * @param {!Node|!DocumentFragment} root
 */
var assertNoUnclosedTags = function (openElement, root) {
  if (openElement === root) {
    return;
  }

  var currentElement = openElement;
  var openTags = [];
  while (currentElement && currentElement !== root) {
    openTags.push(currentElement.nodeName.toLowerCase());
    currentElement = currentElement.parentNode;
  }

  throw new Error('One or more tags were not closed:\n' + openTags.join('\n'));
};

/**
 * Makes sure that the caller is not where attributes are expected.
 * @param {string} functionName
 */
var assertNotInAttributes = function (functionName) {
  if (inAttributes) {
    throw new Error(functionName + '() may not be called between ' + 'elementOpenStart() and elementOpenEnd().');
  }
};

/**
 * Makes sure that the caller is not inside an element that has declared skip.
 * @param {string} functionName
 */
var assertNotInSkip = function (functionName) {
  if (inSkip) {
    throw new Error(functionName + '() may not be called inside an element ' + 'that has called skip().');
  }
};

/**
 * Makes sure that the caller is where attributes are expected.
 * @param {string} functionName
 */
var assertInAttributes = function (functionName) {
  if (!inAttributes) {
    throw new Error(functionName + '() must be called after ' + 'elementOpenStart().');
  }
};

/**
 * Makes sure the patch closes virtual attributes call
 */
var assertVirtualAttributesClosed = function () {
  if (inAttributes) {
    throw new Error('elementOpenEnd() must be called after calling ' + 'elementOpenStart().');
  }
};

/**
  * Makes sure that placeholders have a key specified. Otherwise, conditional
  * placeholders and conditional elements next to placeholders will cause
  * placeholder elements to be re-used as non-placeholders and vice versa.
  * @param {string} key
  */
var assertPlaceholderKeySpecified = function (key) {
  if (!key) {
    throw new Error('Placeholder elements must have a key specified.');
  }
};

/**
  * Makes sure that tags are correctly nested.
  * @param {string} nodeName
  * @param {string} tag
  */
var assertCloseMatchesOpenTag = function (nodeName, tag) {
  if (nodeName !== tag) {
    throw new Error('Received a call to close ' + tag + ' but ' + nodeName + ' was open.');
  }
};

/**
 * Makes sure that no children elements have been declared yet in the current
 * element.
 * @param {string} functionName
 * @param {?Node} previousNode
 */
var assertNoChildrenDeclaredYet = function (functionName, previousNode) {
  if (previousNode !== null) {
    throw new Error(functionName + '() must come before any child ' + 'declarations inside the current element.');
  }
};

/**
 * Updates the state of being in an attribute declaration.
 * @param {boolean} value
 * @return {boolean} the previous value.
 */
var setInAttributes = function (value) {
  var previous = inAttributes;
  inAttributes = value;
  return previous;
};

/**
 * Updates the state of being in a skip element.
 * @param {boolean} value
 * @return {boolean} the previous value.
 */
var setInSkip = function (value) {
  var previous = inSkip;
  inSkip = value;
  return previous;
};

/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** */
exports.notifications = {
  /**
   * Called after patch has compleated with any Nodes that have been created
   * and added to the DOM.
   * @type {?function(Array<!Node>)}
   */
  nodesCreated: null,

  /**
   * Called after patch has compleated with any Nodes that have been removed
   * from the DOM.
   * Note it's an applications responsibility to handle any childNodes.
   * @type {?function(Array<!Node>)}
   */
  nodesDeleted: null
};

/**
 * Keeps track of the state of a patch.
 * @constructor
 */
function Context() {
  /**
   * @type {(Array<!Node>|undefined)}
   */
  this.created = exports.notifications.nodesCreated && [];

  /**
   * @type {(Array<!Node>|undefined)}
   */
  this.deleted = exports.notifications.nodesDeleted && [];
}

/**
 * @param {!Node} node
 */
Context.prototype.markCreated = function (node) {
  if (this.created) {
    this.created.push(node);
  }
};

/**
 * @param {!Node} node
 */
Context.prototype.markDeleted = function (node) {
  if (this.deleted) {
    this.deleted.push(node);
  }
};

/**
 * Notifies about nodes that were created during the patch opearation.
 */
Context.prototype.notifyChanges = function () {
  if (this.created && this.created.length > 0) {
    exports.notifications.nodesCreated(this.created);
  }

  if (this.deleted && this.deleted.length > 0) {
    exports.notifications.nodesDeleted(this.deleted);
  }
};

/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * A cached reference to the hasOwnProperty function.
 */
var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * A cached reference to the create function.
 */
var create = Object.create;

/**
 * Used to prevent property collisions between our "map" and its prototype.
 * @param {!Object<string, *>} map The map to check.
 * @param {string} property The property to check.
 * @return {boolean} Whether map has property.
 */
var has = function (map, property) {
  return hasOwnProperty.call(map, property);
};

/**
 * Creates an map object without a prototype.
 * @return {!Object}
 */
var createMap = function () {
  return create(null);
};

/**
 * Keeps track of information needed to perform diffs for a given DOM node.
 * @param {!string} nodeName
 * @param {?string=} key
 * @constructor
 */
function NodeData(nodeName, key) {
  /**
   * The attributes and their values.
   * @const {!Object<string, *>}
   */
  this.attrs = createMap();

  /**
   * An array of attribute name/value pairs, used for quickly diffing the
   * incomming attributes to see if the DOM node's attributes need to be
   * updated.
   * @const {Array<*>}
   */
  this.attrsArr = [];

  /**
   * The incoming attributes for this Node, before they are updated.
   * @const {!Object<string, *>}
   */
  this.newAttrs = createMap();

  /**
   * The key used to identify this node, used to preserve DOM nodes when they
   * move within their parent.
   * @const
   */
  this.key = key;

  /**
   * Keeps track of children within this node by their key.
   * {?Object<string, !Element>}
   */
  this.keyMap = null;

  /**
   * Whether or not the keyMap is currently valid.
   * {boolean}
   */
  this.keyMapValid = true;

  /**
   * The node name for this node.
   * @const {string}
   */
  this.nodeName = nodeName;

  /**
   * @type {?string}
   */
  this.text = null;
}

/**
 * Initializes a NodeData object for a Node.
 *
 * @param {Node} node The node to initialize data for.
 * @param {string} nodeName The node name of node.
 * @param {?string=} key The key that identifies the node.
 * @return {!NodeData} The newly initialized data object
 */
var initData = function (node, nodeName, key) {
  var data = new NodeData(nodeName, key);
  node['__incrementalDOMData'] = data;
  return data;
};

/**
 * Retrieves the NodeData object for a Node, creating it if necessary.
 *
 * @param {Node} node The node to retrieve the data for.
 * @return {!NodeData} The NodeData for this Node.
 */
var getData = function (node) {
  var data = node['__incrementalDOMData'];

  if (!data) {
    var nodeName = node.nodeName.toLowerCase();
    var key = null;

    if (node instanceof Element) {
      key = node.getAttribute('key');
    }

    data = initData(node, nodeName, key);
  }

  return data;
};

/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

exports.symbols = {
  default: '__default',

  placeholder: '__placeholder'
};

/**
 * Applies an attribute or property to a given Element. If the value is null
 * or undefined, it is removed from the Element. Otherwise, the value is set
 * as an attribute.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {?(boolean|number|string)=} value The attribute's value.
 */
exports.applyAttr = function (el, name, value) {
  if (value == null) {
    el.removeAttribute(name);
  } else {
    el.setAttribute(name, value);
  }
};

/**
 * Applies a property to a given Element.
 * @param {!Element} el
 * @param {string} name The property's name.
 * @param {*} value The property's value.
 */
exports.applyProp = function (el, name, value) {
  el[name] = value;
};

/**
 * Applies a style to an Element. No vendor prefix expansion is done for
 * property names/values.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {*} style The style to set. Either a string of css or an object
 *     containing property-value pairs.
 */
var applyStyle = function (el, name, style) {
  if (typeof style === 'string') {
    el.style.cssText = style;
  } else {
    el.style.cssText = '';
    var elStyle = el.style;
    var obj = /** @type {!Object<string,string>} */style;

    for (var prop in obj) {
      if (has(obj, prop)) {
        elStyle[prop] = obj[prop];
      }
    }
  }
};

/**
 * Updates a single attribute on an Element.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {*} value The attribute's value. If the value is an object or
 *     function it is set on the Element, otherwise, it is set as an HTML
 *     attribute.
 */
var applyAttributeTyped = function (el, name, value) {
  var type = typeof value;

  if (type === 'object' || type === 'function') {
    exports.applyProp(el, name, value);
  } else {
    exports.applyAttr(el, name, /** @type {?(boolean|number|string)} */value);
  }
};

/**
 * Calls the appropriate attribute mutator for this attribute.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {*} value The attribute's value.
 */
var updateAttribute = function (el, name, value) {
  var data = getData(el);
  var attrs = data.attrs;

  if (attrs[name] === value) {
    return;
  }

  var mutator = exports.attributes[name] || exports.attributes[exports.symbols.default];
  mutator(el, name, value);

  attrs[name] = value;
};

/**
 * A publicly mutable object to provide custom mutators for attributes.
 * @const {!Object<string, function(!Element, string, *)>}
 */
exports.attributes = createMap();

// Special generic mutator that's called for any attribute that does not
// have a specific mutator.
exports.attributes[exports.symbols.default] = applyAttributeTyped;

exports.attributes[exports.symbols.placeholder] = function () {};

exports.attributes['style'] = applyStyle;

/**
 * Gets the namespace to create an element (of a given tag) in.
 * @param {string} tag The tag to get the namespace for.
 * @param {?Node} parent
 * @return {?string} The namespace to create the tag in.
 */
var getNamespaceForTag = function (tag, parent) {
  if (tag === 'svg') {
    return 'http://www.w3.org/2000/svg';
  }

  if (getData(parent).nodeName === 'foreignObject') {
    return null;
  }

  return parent.namespaceURI;
};

/**
 * Creates an Element.
 * @param {Document} doc The document with which to create the Element.
 * @param {?Node} parent
 * @param {string} tag The tag for the Element.
 * @param {?string=} key A key to identify the Element.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element.
 * @return {!Element}
 */
var createElement = function (doc, parent, tag, key, statics) {
  var namespace = getNamespaceForTag(tag, parent);
  var el;

  if (namespace) {
    el = doc.createElementNS(namespace, tag);
  } else {
    el = doc.createElement(tag);
  }

  initData(el, tag, key);

  if (statics) {
    for (var i = 0; i < statics.length; i += 2) {
      updateAttribute(el, /** @type {!string}*/statics[i], statics[i + 1]);
    }
  }

  return el;
};

/**
 * Creates a Text Node.
 * @param {Document} doc The document with which to create the Element.
 * @return {!Text}
 */
var createText = function (doc) {
  var node = doc.createTextNode('');
  initData(node, '#text', null);
  return node;
};

/**
 * Creates a mapping that can be used to look up children using a key.
 * @param {?Node} el
 * @return {!Object<string, !Element>} A mapping of keys to the children of the
 *     Element.
 */
var createKeyMap = function (el) {
  var map = createMap();
  var children = el.children;
  var count = children.length;

  for (var i = 0; i < count; i += 1) {
    var child = children[i];
    var key = getData(child).key;

    if (key) {
      map[key] = child;
    }
  }

  return map;
};

/**
 * Retrieves the mapping of key to child node for a given Element, creating it
 * if necessary.
 * @param {?Node} el
 * @return {!Object<string, !Node>} A mapping of keys to child Elements
 */
var getKeyMap = function (el) {
  var data = getData(el);

  if (!data.keyMap) {
    data.keyMap = createKeyMap(el);
  }

  return data.keyMap;
};

/**
 * Retrieves a child from the parent with the given key.
 * @param {?Node} parent
 * @param {?string=} key
 * @return {?Node} The child corresponding to the key.
 */
var getChild = function (parent, key) {
  return key ? getKeyMap(parent)[key] : null;
};

/**
 * Registers an element as being a child. The parent will keep track of the
 * child using the key. The child can be retrieved using the same key using
 * getKeyMap. The provided key should be unique within the parent Element.
 * @param {?Node} parent The parent of child.
 * @param {string} key A key to identify the child with.
 * @param {!Node} child The child to register.
 */
var registerChild = function (parent, key, child) {
  getKeyMap(parent)[key] = child;
};

/** @type {?Context} */
var context = null;

/** @type {?Node} */
var currentNode;

/** @type {?Node} */
var currentParent;

/** @type {?Node} */
var previousNode;

/** @type {?Element|?DocumentFragment} */
var root;

/** @type {?Document} */
var doc;

/**
 * Patches the document starting at el with the provided function. This function
 * may be called during an existing patch operation.
 * @param {!Element|!DocumentFragment} node The Element or Document
 *     to patch.
 * @param {!function(T)} fn A function containing elementOpen/elementClose/etc.
 *     calls that describe the DOM.
 * @param {T=} data An argument passed to fn to represent DOM state.
 * @template T
 */
exports.patch = function (node, fn, data) {
  var prevContext = context;
  var prevRoot = root;
  var prevDoc = doc;
  var prevCurrentNode = currentNode;
  var prevCurrentParent = currentParent;
  var prevPreviousNode = previousNode;
  var previousInAttributes = false;
  var previousInSkip = false;

  context = new Context();
  root = node;
  doc = node.ownerDocument;
  currentNode = node;
  currentParent = null;
  previousNode = null;

  if (process.env.NODE_ENV !== 'production') {
    previousInAttributes = setInAttributes(false);
    previousInSkip = setInSkip(false);
  }

  enterNode();
  fn(data);
  exitNode();

  if (process.env.NODE_ENV !== 'production') {
    assertVirtualAttributesClosed();
    assertNoUnclosedTags(previousNode, node);
    setInAttributes(previousInAttributes);
    setInSkip(previousInSkip);
  }

  context.notifyChanges();

  context = prevContext;
  root = prevRoot;
  doc = prevDoc;
  currentNode = prevCurrentNode;
  currentParent = prevCurrentParent;
  previousNode = prevPreviousNode;
};

/**
 * Checks whether or not the current node matches the specified nodeName and
 * key.
 *
 * @param {?string} nodeName The nodeName for this node.
 * @param {?string=} key An optional key that identifies a node.
 * @return {boolean} True if the node matches, false otherwise.
 */
var matches = function (nodeName, key) {
  var data = getData(currentNode);

  // Key check is done using double equals as we want to treat a null key the
  // same as undefined. This should be okay as the only values allowed are
  // strings, null and undefined so the == semantics are not too weird.
  return nodeName === data.nodeName && key == data.key;
};

/**
 * Aligns the virtual Element definition with the actual DOM, moving the
 * corresponding DOM node to the correct location or creating it if necessary.
 * @param {string} nodeName For an Element, this should be a valid tag string.
 *     For a Text, this should be #text.
 * @param {?string=} key The key used to identify this element.
 * @param {?Array<*>=} statics For an Element, this should be an array of
 *     name-value pairs.
 */
var alignWithDOM = function (nodeName, key, statics) {
  if (currentNode && matches(nodeName, key)) {
    return;
  }

  var node;

  // Check to see if the node has moved within the parent.
  if (key) {
    node = getChild(currentParent, key);
    if (node && process.env.NODE_ENV !== 'production') {
      assertKeyedTagMatches(getData(node).nodeName, nodeName, key);
    }
  }

  // Create the node if it doesn't exist.
  if (!node) {
    if (nodeName === '#text') {
      node = createText(doc);
    } else {
      node = createElement(doc, currentParent, nodeName, key, statics);
    }

    if (key) {
      registerChild(currentParent, key, node);
    }

    context.markCreated(node);
  }

  // If the node has a key, remove it from the DOM to prevent a large number
  // of re-orders in the case that it moved far or was completely removed.
  // Since we hold on to a reference through the keyMap, we can always add it
  // back.
  if (currentNode && getData(currentNode).key) {
    currentParent.replaceChild(node, currentNode);
    getData(currentParent).keyMapValid = false;
  } else {
    currentParent.insertBefore(node, currentNode);
  }

  currentNode = node;
};

/**
 * Clears out any unvisited Nodes, as the corresponding virtual element
 * functions were never called for them.
 */
var clearUnvisitedDOM = function () {
  var node = currentParent;
  var data = getData(node);
  var keyMap = data.keyMap;
  var keyMapValid = data.keyMapValid;
  var child = node.lastChild;
  var key;

  if (child === previousNode && keyMapValid) {
    return;
  }

  if (data.attrs[exports.symbols.placeholder] && node !== root) {
    return;
  }

  while (child !== previousNode) {
    node.removeChild(child);
    context.markDeleted( /** @type {!Node}*/child);

    key = getData(child).key;
    if (key) {
      delete keyMap[key];
    }
    child = node.lastChild;
  }

  // Clean the keyMap, removing any unusued keys.
  if (!keyMapValid) {
    for (key in keyMap) {
      child = keyMap[key];
      if (child.parentNode !== node) {
        context.markDeleted(child);
        delete keyMap[key];
      }
    }

    data.keyMapValid = true;
  }
};

/**
 * Changes to the first child of the current node.
 */
var enterNode = function () {
  currentParent = currentNode;
  currentNode = currentNode.firstChild;
  previousNode = null;
};

/**
 * Changes to the next sibling of the current node.
 */
var nextNode = function () {
  previousNode = currentNode;
  currentNode = currentNode.nextSibling;
};

/**
 * Changes to the parent of the current node, removing any unvisited children.
 */
var exitNode = function () {
  clearUnvisitedDOM();

  previousNode = currentParent;
  currentNode = currentParent.nextSibling;
  currentParent = currentParent.parentNode;
};

/**
 * Makes sure that the current node is an Element with a matching tagName and
 * key.
 *
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 * @return {!Element} The corresponding Element.
 */
var _elementOpen = function (tag, key, statics) {
  alignWithDOM(tag, key, statics);
  enterNode();
  return (/** @type {!Element} */currentParent
  );
};

/**
 * Closes the currently open Element, removing any unvisited children if
 * necessary.
 *
 * @return {!Element} The corresponding Element.
 */
var _elementClose = function () {
  if (process.env.NODE_ENV !== 'production') {
    setInSkip(false);
  }

  exitNode();
  return (/** @type {!Element} */previousNode
  );
};

/**
 * Makes sure the current node is a Text node and creates a Text node if it is
 * not.
 *
 * @return {!Text} The corresponding Text Node.
 */
var _text = function () {
  alignWithDOM('#text', null, null);
  nextNode();
  return (/** @type {!Text} */previousNode
  );
};

/**
 * Gets the current Element being patched.
 * @return {!Element}
 */
exports.currentElement = function () {
  if (process.env.NODE_ENV !== 'production') {
    assertInPatch(context);
    assertNotInAttributes('currentElement');
  }
  return (/** @type {!Element} */currentParent
  );
};

/**
 * Skips the children in a subtree, allowing an Element to be closed without
 * clearing out the children.
 */
exports.skip = function () {
  if (process.env.NODE_ENV !== 'production') {
    assertNoChildrenDeclaredYet('skip', previousNode);
    setInSkip(true);
  }
  previousNode = currentParent.lastChild;
};

/**
 * The offset in the virtual element declaration where the attributes are
 * specified.
 * @const
 */
var ATTRIBUTES_OFFSET = 3;

/**
 * Builds an array of arguments for use with elementOpenStart, attr and
 * elementOpenEnd.
 * @const {Array<*>}
 */
var argsBuilder = [];

/**
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 * @param {...*} var_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {!Element} The corresponding Element.
 */
exports.elementOpen = function (tag, key, statics, var_args) {
  if (process.env.NODE_ENV !== 'production') {
    assertNotInAttributes('elementOpen');
    assertNotInSkip('elementOpen');
  }

  var node = _elementOpen(tag, key, statics);
  var data = getData(node);

  /*
   * Checks to see if one or more attributes have changed for a given Element.
   * When no attributes have changed, this is much faster than checking each
   * individual argument. When attributes have changed, the overhead of this is
   * minimal.
   */
  var attrsArr = data.attrsArr;
  var newAttrs = data.newAttrs;
  var attrsChanged = false;
  var i = ATTRIBUTES_OFFSET;
  var j = 0;

  for (; i < arguments.length; i += 1, j += 1) {
    if (attrsArr[j] !== arguments[i]) {
      attrsChanged = true;
      break;
    }
  }

  for (; i < arguments.length; i += 1, j += 1) {
    attrsArr[j] = arguments[i];
  }

  if (j < attrsArr.length) {
    attrsChanged = true;
    attrsArr.length = j;
  }

  /*
   * Actually perform the attribute update.
   */
  if (attrsChanged) {
    for (i = ATTRIBUTES_OFFSET; i < arguments.length; i += 2) {
      newAttrs[arguments[i]] = arguments[i + 1];
    }

    for (var attr in newAttrs) {
      updateAttribute(node, attr, newAttrs[attr]);
      newAttrs[attr] = undefined;
    }
  }

  return node;
};

/**
 * Declares a virtual Element at the current location in the document. This
 * corresponds to an opening tag and a elementClose tag is required. This is
 * like elementOpen, but the attributes are defined using the attr function
 * rather than being passed as arguments. Must be folllowed by 0 or more calls
 * to attr, then a call to elementOpenEnd.
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 */
exports.elementOpenStart = function (tag, key, statics) {
  if (process.env.NODE_ENV !== 'production') {
    assertNotInAttributes('elementOpenStart');
    setInAttributes(true);
  }

  argsBuilder[0] = tag;
  argsBuilder[1] = key;
  argsBuilder[2] = statics;
};

/***
 * Defines a virtual attribute at this point of the DOM. This is only valid
 * when called between elementOpenStart and elementOpenEnd.
 *
 * @param {string} name
 * @param {*} value
 */
exports.attr = function (name, value) {
  if (process.env.NODE_ENV !== 'production') {
    assertInAttributes('attr');
  }

  argsBuilder.push(name, value);
};

/**
 * Closes an open tag started with elementOpenStart.
 * @return {!Element} The corresponding Element.
 */
exports.elementOpenEnd = function () {
  if (process.env.NODE_ENV !== 'production') {
    assertInAttributes('elementOpenEnd');
    setInAttributes(false);
  }

  var node = exports.elementOpen.apply(null, argsBuilder);
  argsBuilder.length = 0;
  return node;
};

/**
 * Closes an open virtual Element.
 *
 * @param {string} tag The element's tag.
 * @return {!Element} The corresponding Element.
 */
exports.elementClose = function (tag) {
  if (process.env.NODE_ENV !== 'production') {
    assertNotInAttributes('elementClose');
  }

  var node = _elementClose();

  if (process.env.NODE_ENV !== 'production') {
    assertCloseMatchesOpenTag(getData(node).nodeName, tag);
  }

  return node;
};

/**
 * Declares a virtual Element at the current location in the document that has
 * no children.
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 * @param {...*} var_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {!Element} The corresponding Element.
 */
exports.elementVoid = function (tag, key, statics, var_args) {
  var node = exports.elementOpen.apply(null, arguments);
  exports.elementClose.apply(null, arguments);
  return node;
};

/**
 * Declares a virtual Element at the current location in the document that is a
 * placeholder element. Children of this Element can be manually managed and
 * will not be cleared by the library.
 *
 * A key must be specified to make sure that this node is correctly preserved
 * across all conditionals.
 *
 * @param {string} tag The element's tag.
 * @param {string} key The key used to identify this element.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 * @param {...*} var_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {!Element} The corresponding Element.
 */
exports.elementPlaceholder = function (tag, key, statics, var_args) {
  if (process.env.NODE_ENV !== 'production') {
    assertPlaceholderKeySpecified(key);
  }

  exports.elementOpen.apply(null, arguments);
  exports.skip();
  return exports.elementClose.apply(null, arguments);
};

/**
 * Declares a virtual Text at this point in the document.
 *
 * @param {string|number|boolean} value The value of the Text.
 * @param {...(function((string|number|boolean)):string)} var_args
 *     Functions to format the value which are called only when the value has
 *     changed.
 * @return {!Text} The corresponding text node.
 */
exports.text = function (value, var_args) {
  if (process.env.NODE_ENV !== 'production') {
    assertNotInAttributes('text');
    assertNotInSkip('text');
  }

  var node = _text();
  var data = getData(node);

  if (data.text !== value) {
    data.text = /** @type {string} */value;

    var formatted = value;
    for (var i = 1; i < arguments.length; i += 1) {
      formatted = arguments[i](formatted);
    }

    node.data = formatted;
  }

  return node;
};

}).call(this,require('_process'))

},{"_process":19}],24:[function(require,module,exports){
'use strict';

module.exports = require('./dist/client');

},{"./dist/client":25}],25:[function(require,module,exports){
'use strict';

/*
    (hapi)nes WebSocket Client (https://github.com/hapijs/nes)
    Copyright (c) 2015, Eran Hammer <eran@hammer.io> and other contributors
    BSD Licensed
*/

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function (root, factory) {

    // $lab:coverage:off$

    if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && (typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object') {
        module.exports = factory(); // Export if used as a module
    } else if (typeof define === 'function' && define.amd) {
            define(factory);
        } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
            exports.nes = factory();
        } else {
            root.nes = factory();
        }

    // $lab:coverage:on$
})(undefined, function () {

    // Utilities

    var version = '2';
    var ignore = function ignore() {};

    var parse = function parse(message, next) {

        var obj = null;
        var error = null;

        try {
            obj = JSON.parse(message);
        } catch (err) {
            error = new NesError(err, 'protocol');
        }

        return next(error, obj);
    };

    var stringify = function stringify(message, next) {

        var string = null;
        var error = null;

        try {
            string = JSON.stringify(message);
        } catch (err) {
            error = new NesError(err, 'user');
        }

        return next(error, string);
    };

    var NesError = function NesError(err, type) {

        if (typeof err === 'string') {
            err = new Error(err);
        }

        err.type = type;
        return err;
    };

    // Error codes

    var errorCodes = {
        1000: 'Normal closure',
        1001: 'Going away',
        1002: 'Protocol error',
        1003: 'Unsupported data',
        1004: 'Reserved',
        1005: 'No status received',
        1006: 'Abnormal closure',
        1007: 'Invalid frame payload data',
        1008: 'Policy violation',
        1009: 'Message too big',
        1010: 'Mandatory extension',
        1011: 'Internal server error',
        1015: 'TLS handshake'
    };

    // Client

    var Client = function Client(url, options) {

        options = options || {};

        // Configuration

        this._url = url;
        this._settings = options;
        this._heartbeatTimeout = false; // Server heartbeat configuration

        // State

        this._ws = null;
        this._reconnection = null;
        this._ids = 0; // Id counter
        this._requests = {}; // id -> { callback, timeout }
        this._subscriptions = {}; // path -> [callbacks]
        this._heartbeat = null;

        // Events

        this.onError = function (err) {
            return console.error(err);
        }; // General error callback (only when an error cannot be associated with a request)
        this.onConnect = ignore; // Called whenever a connection is established
        this.onDisconnect = ignore; // Called whenever a connection is lost: function(willReconnect)
        this.onUpdate = ignore;

        // Public properties

        this.id = null; // Assigned when hello response is received
    };

    Client.WebSocket = /* $lab:coverage:off$ */typeof WebSocket === 'undefined' ? null : WebSocket; /* $lab:coverage:on$ */

    Client.prototype.connect = function (options, callback) {

        if (typeof options === 'function') {
            callback = arguments[0];
            options = {};
        }

        if (options.reconnect !== false) {
            // Defaults to true
            this._reconnection = { // Options: reconnect, delay, maxDelay
                wait: 0,
                delay: options.delay || 1000, // 1 second
                maxDelay: options.maxDelay || 5000, // 5 seconds
                retries: options.retries || Infinity, // Unlimited
                settings: {
                    auth: options.auth,
                    timeout: options.timeout
                }
            };
        } else {
            this._reconnection = null;
        }

        this._connect(options, true, callback);
    };

    Client.prototype._connect = function (options, initial, callback) {
        var _this = this;

        var sentCallback = false;
        var timeoutHandler = function timeoutHandler() {

            sentCallback = true;
            _this._ws.close();
            callback(new NesError('Connection timed out', 'timeout'));
            _this._cleanup();
            if (initial) {
                return _this._reconnect();
            }
        };

        var timeout = options.timeout ? setTimeout(timeoutHandler, options.timeout) : null;

        var ws = new Client.WebSocket(this._url, this._settings.ws); // Settings used by node.js only
        this._ws = ws;

        ws.onopen = function () {

            clearTimeout(timeout);

            if (!sentCallback) {
                sentCallback = true;
                return _this._hello(options.auth, function (err) {

                    if (err) {
                        if (err.path) {
                            delete _this._subscriptions[err.path];
                        }

                        _this.disconnect(); // Stop reconnection when the hello message returns error
                        return callback(err);
                    }

                    _this.onConnect();
                    return callback();
                });
            }
        };

        ws.onerror = function (event) {

            var err = new NesError('Socket error', 'ws');

            clearTimeout(timeout);

            if (!sentCallback) {
                sentCallback = true;
                return callback(err);
            }

            return _this.onError(err);
        };

        ws.onclose = function (event) {

            var log = {
                code: event.code,
                explanation: errorCodes[event.code] || 'Unknown',
                reason: event.reason,
                wasClean: event.wasClean
            };

            _this._cleanup();
            _this.onDisconnect(!!(_this._reconnection && _this._reconnection.retries >= 1), log);
            _this._reconnect();
        };

        ws.onmessage = function (message) {

            return _this._onMessage(message);
        };
    };

    Client.prototype.disconnect = function () {

        this._reconnection = null;

        if (!this._ws) {
            return;
        }

        if (this._ws.readyState === Client.WebSocket.OPEN || this._ws.readyState === Client.WebSocket.CONNECTING) {

            this._ws.close();
        }
    };

    Client.prototype._cleanup = function () {

        var ws = this._ws;
        if (!ws) {
            return;
        }

        this._ws = null;
        this.id = null;
        ws.onopen = null;
        ws.onclose = null;
        ws.onerror = ignore;
        ws.onmessage = null;

        clearTimeout(this._heartbeat);

        // Flush pending requests

        var error = new NesError('Request failed - server disconnected', 'disconnect');

        var ids = Object.keys(this._requests);
        for (var i = 0; i < ids.length; ++i) {
            var id = ids[i];
            var request = this._requests[id];
            var callback = request.callback;
            clearTimeout(request.timeout);
            delete this._requests[id];
            callback(error);
        }
    };

    Client.prototype._reconnect = function () {
        var _this2 = this;

        // Reconnect

        if (this._reconnection) {
            if (this._reconnection.retries < 1) {
                this.disconnect(); // Clear _reconnection state
                return;
            }

            --this._reconnection.retries;
            this._reconnection.wait = this._reconnection.wait + this._reconnection.delay;

            var timeout = Math.min(this._reconnection.wait, this._reconnection.maxDelay);
            setTimeout(function () {

                if (!_this2._reconnection) {
                    return;
                }

                _this2._connect(_this2._reconnection.settings, false, function (err) {

                    if (err) {
                        _this2.onError(err);
                        _this2._cleanup();
                        return _this2._reconnect();
                    }
                });
            }, timeout);
        }
    };

    Client.prototype.request = function (options, callback) {

        if (typeof options === 'string') {
            options = {
                method: 'GET',
                path: options
            };
        }

        var request = {
            type: 'request',
            method: options.method || 'GET',
            path: options.path,
            headers: options.headers,
            payload: options.payload
        };

        return this._send(request, true, callback);
    };

    Client.prototype.message = function (message, callback) {

        var request = {
            type: 'message',
            message: message
        };

        return this._send(request, true, callback);
    };

    Client.prototype._send = function (request, track, callback) {
        var _this3 = this;

        callback = callback || ignore;

        if (!this._ws || this._ws.readyState !== Client.WebSocket.OPEN) {

            return callback(new NesError('Failed to send message - server disconnected', 'disconnect'));
        }

        request.id = ++this._ids;

        stringify(request, function (err, encoded) {

            if (err) {
                return callback(err);
            }

            // Ignore errors

            if (!track) {
                try {
                    return _this3._ws.send(encoded);
                } catch (err) {
                    return callback(new NesError(err, 'ws'));
                }
            }

            // Track errors

            var record = {
                callback: callback,
                timeout: null
            };

            if (_this3._settings.timeout) {
                record.timeout = setTimeout(function () {

                    record.callback = null;
                    record.timeout = null;

                    return callback(new NesError('Request timed out', 'timeout'));
                }, _this3._settings.timeout);
            }

            _this3._requests[request.id] = record;

            try {
                _this3._ws.send(encoded);
            } catch (err) {
                clearTimeout(_this3._requests[request.id].timeout);
                delete _this3._requests[request.id];
                return callback(new NesError(err, 'ws'));
            }
        });
    };

    Client.prototype._hello = function (auth, callback) {

        var request = {
            type: 'hello',
            version: version
        };

        if (auth) {
            request.auth = auth;
        }

        var subs = this.subscriptions();
        if (subs.length) {
            request.subs = subs;
        }

        return this._send(request, true, callback);
    };

    Client.prototype.subscriptions = function () {

        return Object.keys(this._subscriptions);
    };

    Client.prototype.subscribe = function (path, handler, callback) {
        var _this4 = this;

        if (!path || path[0] !== '/') {

            return callback(new NesError('Invalid path', 'user'));
        }

        var subs = this._subscriptions[path];
        if (subs) {

            // Already subscribed

            if (subs.indexOf(handler) === -1) {
                subs.push(handler);
            }

            return callback();
        }

        this._subscriptions[path] = [handler];

        if (!this._ws || this._ws.readyState !== Client.WebSocket.OPEN) {

            // Queued subscription

            return callback();
        }

        var request = {
            type: 'sub',
            path: path
        };

        return this._send(request, true, function (err) {

            if (err) {
                delete _this4._subscriptions[path];
            }

            return callback(err);
        });
    };

    Client.prototype.unsubscribe = function (path, handler) {

        if (!path || path[0] !== '/') {

            return handler(new NesError('Invalid path', 'user'));
        }

        var subs = this._subscriptions[path];
        if (!subs) {
            return;
        }

        var sync = false;
        if (!handler) {
            delete this._subscriptions[path];
            sync = true;
        } else {
            var pos = subs.indexOf(handler);
            if (pos === -1) {
                return;
            }

            subs.splice(pos, 1);
            if (!subs.length) {
                delete this._subscriptions[path];
                sync = true;
            }
        }

        if (!sync || !this._ws || this._ws.readyState !== Client.WebSocket.OPEN) {

            return;
        }

        var request = {
            type: 'unsub',
            path: path
        };

        return this._send(request, false); // Ignoring errors as the subscription handlers are already removed
    };

    Client.prototype._onMessage = function (message) {
        var _this5 = this;

        this._beat();

        parse(message.data, function (err, update) {

            if (err) {
                return _this5.onError(err);
            }

            // Recreate error

            var error = null;
            if (update.statusCode && update.statusCode >= 400 && update.statusCode <= 599) {

                error = new NesError(update.payload.message || update.payload.error, 'server');
                error.statusCode = update.statusCode;
                error.data = update.payload;
                error.headers = update.headers;
                error.path = update.path;
            }

            // Ping

            if (update.type === 'ping') {
                return _this5._send({ type: 'ping' }, false); // Ignore errors
            }

            // Broadcast and update

            if (update.type === 'update') {
                return _this5.onUpdate(update.message);
            }

            // Publish

            if (update.type === 'pub') {
                var handlers = _this5._subscriptions[update.path];
                if (handlers) {
                    for (var i = 0; i < handlers.length; ++i) {
                        handlers[i](update.message);
                    }
                }

                return;
            }

            // Lookup callback (message must include an id from this point)

            var request = _this5._requests[update.id];
            if (!request) {
                return _this5.onError(new NesError('Received response for unknown request', 'protocol'));
            }

            var callback = request.callback;
            clearTimeout(request.timeout);
            delete _this5._requests[update.id];

            if (!callback) {
                return; // Response received after timeout
            }

            // Response

            if (update.type === 'request') {
                return callback(error, update.payload, update.statusCode, update.headers);
            }

            // Custom message

            if (update.type === 'message') {
                return callback(error, update.message);
            }

            // Authentication

            if (update.type === 'hello') {
                _this5.id = update.socket;
                if (update.heartbeat) {
                    _this5._heartbeatTimeout = update.heartbeat.interval + update.heartbeat.timeout;
                    _this5._beat(); // Call again once timeout is set
                }

                return callback(error);
            }

            // Subscriptions

            if (update.type === 'sub') {
                return callback(error);
            }

            return _this5.onError(new NesError('Received unknown response type: ' + update.type, 'protocol'));
        });
    };

    Client.prototype._beat = function () {
        var _this6 = this;

        if (!this._heartbeatTimeout) {
            return;
        }

        clearTimeout(this._heartbeat);

        this._heartbeat = setTimeout(function () {

            _this6.onError(new NesError('Disconnecting due to heartbeat timeout', 'timeout'));
            _this6._ws.close();
        }, this._heartbeatTimeout);
    };

    // Expose interface

    return { Client: Client };
});

},{}],26:[function(require,module,exports){
(function (process){
  /* globals require, module */

  'use strict';

  /**
   * Module dependencies.
   */

  var pathtoRegexp = require('path-to-regexp');

  /**
   * Module exports.
   */

  module.exports = page;

  /**
   * Detect click event
   */
  var clickEvent = ('undefined' !== typeof document) && document.ontouchstart ? 'touchstart' : 'click';

  /**
   * To work properly with the URL
   * history.location generated polyfill in https://github.com/devote/HTML5-History-API
   */

  var location = ('undefined' !== typeof window) && (window.history.location || window.location);

  /**
   * Perform initial dispatch.
   */

  var dispatch = true;


  /**
   * Decode URL components (query string, pathname, hash).
   * Accommodates both regular percent encoding and x-www-form-urlencoded format.
   */
  var decodeURLComponents = true;

  /**
   * Base path.
   */

  var base = '';

  /**
   * Running flag.
   */

  var running;

  /**
   * HashBang option
   */

  var hashbang = false;

  /**
   * Previous context, for capturing
   * page exit events.
   */

  var prevContext;

  /**
   * Register `path` with callback `fn()`,
   * or route `path`, or redirection,
   * or `page.start()`.
   *
   *   page(fn);
   *   page('*', fn);
   *   page('/user/:id', load, user);
   *   page('/user/' + user.id, { some: 'thing' });
   *   page('/user/' + user.id);
   *   page('/from', '/to')
   *   page();
   *
   * @param {String|Function} path
   * @param {Function} fn...
   * @api public
   */

  function page(path, fn) {
    // <callback>
    if ('function' === typeof path) {
      return page('*', path);
    }

    // route <path> to <callback ...>
    if ('function' === typeof fn) {
      var route = new Route(path);
      for (var i = 1; i < arguments.length; ++i) {
        page.callbacks.push(route.middleware(arguments[i]));
      }
      // show <path> with [state]
    } else if ('string' === typeof path) {
      page['string' === typeof fn ? 'redirect' : 'show'](path, fn);
      // start [options]
    } else {
      page.start(path);
    }
  }

  /**
   * Callback functions.
   */

  page.callbacks = [];
  page.exits = [];

  /**
   * Current path being processed
   * @type {String}
   */
  page.current = '';

  /**
   * Number of pages navigated to.
   * @type {number}
   *
   *     page.len == 0;
   *     page('/login');
   *     page.len == 1;
   */

  page.len = 0;

  /**
   * Get or set basepath to `path`.
   *
   * @param {String} path
   * @api public
   */

  page.base = function(path) {
    if (0 === arguments.length) return base;
    base = path;
  };

  /**
   * Bind with the given `options`.
   *
   * Options:
   *
   *    - `click` bind to click events [true]
   *    - `popstate` bind to popstate [true]
   *    - `dispatch` perform initial dispatch [true]
   *
   * @param {Object} options
   * @api public
   */

  page.start = function(options) {
    options = options || {};
    if (running) return;
    running = true;
    if (false === options.dispatch) dispatch = false;
    if (false === options.decodeURLComponents) decodeURLComponents = false;
    if (false !== options.popstate) window.addEventListener('popstate', onpopstate, false);
    if (false !== options.click) {
      document.addEventListener(clickEvent, onclick, false);
    }
    if (true === options.hashbang) hashbang = true;
    if (!dispatch) return;
    var url = (hashbang && ~location.hash.indexOf('#!')) ? location.hash.substr(2) + location.search : location.pathname + location.search + location.hash;
    page.replace(url, null, true, dispatch);
  };

  /**
   * Unbind click and popstate event handlers.
   *
   * @api public
   */

  page.stop = function() {
    if (!running) return;
    page.current = '';
    page.len = 0;
    running = false;
    document.removeEventListener(clickEvent, onclick, false);
    window.removeEventListener('popstate', onpopstate, false);
  };

  /**
   * Show `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @param {Boolean} dispatch
   * @return {Context}
   * @api public
   */

  page.show = function(path, state, dispatch, push) {
    var ctx = new Context(path, state);
    page.current = ctx.path;
    if (false !== dispatch) page.dispatch(ctx);
    if (false !== ctx.handled && false !== push) ctx.pushState();
    return ctx;
  };

  /**
   * Goes back in the history
   * Back should always let the current route push state and then go back.
   *
   * @param {String} path - fallback path to go back if no more history exists, if undefined defaults to page.base
   * @param {Object} [state]
   * @api public
   */

  page.back = function(path, state) {
    if (page.len > 0) {
      // this may need more testing to see if all browsers
      // wait for the next tick to go back in history
      history.back();
      page.len--;
    } else if (path) {
      setTimeout(function() {
        page.show(path, state);
      });
    }else{
      setTimeout(function() {
        page.show(base, state);
      });
    }
  };


  /**
   * Register route to redirect from one path to other
   * or just redirect to another route
   *
   * @param {String} from - if param 'to' is undefined redirects to 'from'
   * @param {String} [to]
   * @api public
   */
  page.redirect = function(from, to) {
    // Define route from a path to another
    if ('string' === typeof from && 'string' === typeof to) {
      page(from, function(e) {
        setTimeout(function() {
          page.replace(to);
        }, 0);
      });
    }

    // Wait for the push state and replace it with another
    if ('string' === typeof from && 'undefined' === typeof to) {
      setTimeout(function() {
        page.replace(from);
      }, 0);
    }
  };

  /**
   * Replace `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @return {Context}
   * @api public
   */


  page.replace = function(path, state, init, dispatch) {
    var ctx = new Context(path, state);
    page.current = ctx.path;
    ctx.init = init;
    ctx.save(); // save before dispatching, which may redirect
    if (false !== dispatch) page.dispatch(ctx);
    return ctx;
  };

  /**
   * Dispatch the given `ctx`.
   *
   * @param {Object} ctx
   * @api private
   */

  page.dispatch = function(ctx) {
    var prev = prevContext,
      i = 0,
      j = 0;

    prevContext = ctx;

    function nextExit() {
      var fn = page.exits[j++];
      if (!fn) return nextEnter();
      fn(prev, nextExit);
    }

    function nextEnter() {
      var fn = page.callbacks[i++];

      if (ctx.path !== page.current) {
        ctx.handled = false;
        return;
      }
      if (!fn) return unhandled(ctx);
      fn(ctx, nextEnter);
    }

    if (prev) {
      nextExit();
    } else {
      nextEnter();
    }
  };

  /**
   * Unhandled `ctx`. When it's not the initial
   * popstate then redirect. If you wish to handle
   * 404s on your own use `page('*', callback)`.
   *
   * @param {Context} ctx
   * @api private
   */

  function unhandled(ctx) {
    if (ctx.handled) return;
    var current;

    if (hashbang) {
      current = base + location.hash.replace('#!', '');
    } else {
      current = location.pathname + location.search;
    }

    if (current === ctx.canonicalPath) return;
    page.stop();
    ctx.handled = false;
    location.href = ctx.canonicalPath;
  }

  /**
   * Register an exit route on `path` with
   * callback `fn()`, which will be called
   * on the previous context when a new
   * page is visited.
   */
  page.exit = function(path, fn) {
    if (typeof path === 'function') {
      return page.exit('*', path);
    }

    var route = new Route(path);
    for (var i = 1; i < arguments.length; ++i) {
      page.exits.push(route.middleware(arguments[i]));
    }
  };

  /**
   * Remove URL encoding from the given `str`.
   * Accommodates whitespace in both x-www-form-urlencoded
   * and regular percent-encoded form.
   *
   * @param {str} URL component to decode
   */
  function decodeURLEncodedURIComponent(val) {
    if (typeof val !== 'string') { return val; }
    return decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, ' ')) : val;
  }

  /**
   * Initialize a new "request" `Context`
   * with the given `path` and optional initial `state`.
   *
   * @param {String} path
   * @param {Object} state
   * @api public
   */

  function Context(path, state) {
    if ('/' === path[0] && 0 !== path.indexOf(base)) path = base + (hashbang ? '#!' : '') + path;
    var i = path.indexOf('?');

    this.canonicalPath = path;
    this.path = path.replace(base, '') || '/';
    if (hashbang) this.path = this.path.replace('#!', '') || '/';

    this.title = document.title;
    this.state = state || {};
    this.state.path = path;
    this.querystring = ~i ? decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
    this.pathname = decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
    this.params = {};

    // fragment
    this.hash = '';
    if (!hashbang) {
      if (!~this.path.indexOf('#')) return;
      var parts = this.path.split('#');
      this.path = parts[0];
      this.hash = decodeURLEncodedURIComponent(parts[1]) || '';
      this.querystring = this.querystring.split('#')[0];
    }
  }

  /**
   * Expose `Context`.
   */

  page.Context = Context;

  /**
   * Push state.
   *
   * @api private
   */

  Context.prototype.pushState = function() {
    page.len++;
    history.pushState(this.state, this.title, hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
  };

  /**
   * Save the context state.
   *
   * @api public
   */

  Context.prototype.save = function() {
    history.replaceState(this.state, this.title, hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
  };

  /**
   * Initialize `Route` with the given HTTP `path`,
   * and an array of `callbacks` and `options`.
   *
   * Options:
   *
   *   - `sensitive`    enable case-sensitive routes
   *   - `strict`       enable strict matching for trailing slashes
   *
   * @param {String} path
   * @param {Object} options.
   * @api private
   */

  function Route(path, options) {
    options = options || {};
    this.path = (path === '*') ? '(.*)' : path;
    this.method = 'GET';
    this.regexp = pathtoRegexp(this.path,
      this.keys = [],
      options.sensitive,
      options.strict);
  }

  /**
   * Expose `Route`.
   */

  page.Route = Route;

  /**
   * Return route middleware with
   * the given callback `fn()`.
   *
   * @param {Function} fn
   * @return {Function}
   * @api public
   */

  Route.prototype.middleware = function(fn) {
    var self = this;
    return function(ctx, next) {
      if (self.match(ctx.path, ctx.params)) return fn(ctx, next);
      next();
    };
  };

  /**
   * Check if this route matches `path`, if so
   * populate `params`.
   *
   * @param {String} path
   * @param {Object} params
   * @return {Boolean}
   * @api private
   */

  Route.prototype.match = function(path, params) {
    var keys = this.keys,
      qsIndex = path.indexOf('?'),
      pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
      m = this.regexp.exec(decodeURIComponent(pathname));

    if (!m) return false;

    for (var i = 1, len = m.length; i < len; ++i) {
      var key = keys[i - 1];
      var val = decodeURLEncodedURIComponent(m[i]);
      if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
        params[key.name] = val;
      }
    }

    return true;
  };


  /**
   * Handle "populate" events.
   */

  var onpopstate = (function () {
    var loaded = false;
    if ('undefined' === typeof window) {
      return;
    }
    if (document.readyState === 'complete') {
      loaded = true;
    } else {
      window.addEventListener('load', function() {
        setTimeout(function() {
          loaded = true;
        }, 0);
      });
    }
    return function onpopstate(e) {
      if (!loaded) return;
      if (e.state) {
        var path = e.state.path;
        page.replace(path, e.state);
      } else {
        page.show(location.pathname + location.hash, undefined, undefined, false);
      }
    };
  })();
  /**
   * Handle "click" events.
   */

  function onclick(e) {

    if (1 !== which(e)) return;

    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (e.defaultPrevented) return;



    // ensure link
    var el = e.target;
    while (el && 'A' !== el.nodeName) el = el.parentNode;
    if (!el || 'A' !== el.nodeName) return;



    // Ignore if tag has
    // 1. "download" attribute
    // 2. rel="external" attribute
    if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

    // ensure non-hash for the same path
    var link = el.getAttribute('href');
    if (!hashbang && el.pathname === location.pathname && (el.hash || '#' === link)) return;



    // Check for mailto: in the href
    if (link && link.indexOf('mailto:') > -1) return;

    // check target
    if (el.target) return;

    // x-origin
    if (!sameOrigin(el.href)) return;



    // rebuild path
    var path = el.pathname + el.search + (el.hash || '');

    // strip leading "/[drive letter]:" on NW.js on Windows
    if (typeof process !== 'undefined' && path.match(/^\/[a-zA-Z]:\//)) {
      path = path.replace(/^\/[a-zA-Z]:\//, '/');
    }

    // same page
    var orig = path;

    if (path.indexOf(base) === 0) {
      path = path.substr(base.length);
    }

    if (hashbang) path = path.replace('#!', '');

    if (base && orig === path) return;

    e.preventDefault();
    page.show(orig);
  }

  /**
   * Event button.
   */

  function which(e) {
    e = e || window.event;
    return null === e.which ? e.button : e.which;
  }

  /**
   * Check if `href` is the same origin.
   */

  function sameOrigin(href) {
    var origin = location.protocol + '//' + location.hostname;
    if (location.port) origin += ':' + location.port;
    return (href && (0 === href.indexOf(origin)));
  }

  page.sameOrigin = sameOrigin;

}).call(this,require('_process'))

},{"_process":19,"path-to-regexp":27}],27:[function(require,module,exports){
var isarray = require('isarray')

/**
 * Expose `pathToRegexp`.
 */
module.exports = pathToRegexp
module.exports.parse = parse
module.exports.compile = compile
module.exports.tokensToFunction = tokensToFunction
module.exports.tokensToRegExp = tokensToRegExp

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match escaped characters that would otherwise appear in future matches.
  // This allows the user to escape special characters that won't transform.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
  // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
  // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
  '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^()])+)\\))?|\\(((?:\\\\.|[^()])+)\\))([+*?])?|(\\*))'
].join('|'), 'g')

/**
 * Parse a string for the raw tokens.
 *
 * @param  {String} str
 * @return {Array}
 */
function parse (str) {
  var tokens = []
  var key = 0
  var index = 0
  var path = ''
  var res

  while ((res = PATH_REGEXP.exec(str)) != null) {
    var m = res[0]
    var escaped = res[1]
    var offset = res.index
    path += str.slice(index, offset)
    index = offset + m.length

    // Ignore already escaped sequences.
    if (escaped) {
      path += escaped[1]
      continue
    }

    // Push the current path onto the tokens.
    if (path) {
      tokens.push(path)
      path = ''
    }

    var prefix = res[2]
    var name = res[3]
    var capture = res[4]
    var group = res[5]
    var suffix = res[6]
    var asterisk = res[7]

    var repeat = suffix === '+' || suffix === '*'
    var optional = suffix === '?' || suffix === '*'
    var delimiter = prefix || '/'
    var pattern = capture || group || (asterisk ? '.*' : '[^' + delimiter + ']+?')

    tokens.push({
      name: name || key++,
      prefix: prefix || '',
      delimiter: delimiter,
      optional: optional,
      repeat: repeat,
      pattern: escapeGroup(pattern)
    })
  }

  // Match any characters still remaining.
  if (index < str.length) {
    path += str.substr(index)
  }

  // If the path exists, push it onto the end.
  if (path) {
    tokens.push(path)
  }

  return tokens
}

/**
 * Compile a string to a template function for the path.
 *
 * @param  {String}   str
 * @return {Function}
 */
function compile (str) {
  return tokensToFunction(parse(str))
}

/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction (tokens) {
  // Compile all the tokens into regexps.
  var matches = new Array(tokens.length)

  // Compile all the patterns before compilation.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] === 'object') {
      matches[i] = new RegExp('^' + tokens[i].pattern + '$')
    }
  }

  return function (obj) {
    var path = ''
    var data = obj || {}

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i]

      if (typeof token === 'string') {
        path += token

        continue
      }

      var value = data[token.name]
      var segment

      if (value == null) {
        if (token.optional) {
          continue
        } else {
          throw new TypeError('Expected "' + token.name + '" to be defined')
        }
      }

      if (isarray(value)) {
        if (!token.repeat) {
          throw new TypeError('Expected "' + token.name + '" to not repeat, but received "' + value + '"')
        }

        if (value.length === 0) {
          if (token.optional) {
            continue
          } else {
            throw new TypeError('Expected "' + token.name + '" to not be empty')
          }
        }

        for (var j = 0; j < value.length; j++) {
          segment = encodeURIComponent(value[j])

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
          }

          path += (j === 0 ? token.prefix : token.delimiter) + segment
        }

        continue
      }

      segment = encodeURIComponent(value)

      if (!matches[i].test(segment)) {
        throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
      }

      path += token.prefix + segment
    }

    return path
  }
}

/**
 * Escape a regular expression string.
 *
 * @param  {String} str
 * @return {String}
 */
function escapeString (str) {
  return str.replace(/([.+*?=^!:${}()[\]|\/])/g, '\\$1')
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {String} group
 * @return {String}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$\/()])/g, '\\$1')
}

/**
 * Attach the keys as a property of the regexp.
 *
 * @param  {RegExp} re
 * @param  {Array}  keys
 * @return {RegExp}
 */
function attachKeys (re, keys) {
  re.keys = keys
  return re
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {String}
 */
function flags (options) {
  return options.sensitive ? '' : 'i'
}

/**
 * Pull out keys from a regexp.
 *
 * @param  {RegExp} path
 * @param  {Array}  keys
 * @return {RegExp}
 */
function regexpToRegexp (path, keys) {
  // Use a negative lookahead to match only capturing groups.
  var groups = path.source.match(/\((?!\?)/g)

  if (groups) {
    for (var i = 0; i < groups.length; i++) {
      keys.push({
        name: i,
        prefix: null,
        delimiter: null,
        optional: false,
        repeat: false,
        pattern: null
      })
    }
  }

  return attachKeys(path, keys)
}

/**
 * Transform an array into a regexp.
 *
 * @param  {Array}  path
 * @param  {Array}  keys
 * @param  {Object} options
 * @return {RegExp}
 */
function arrayToRegexp (path, keys, options) {
  var parts = []

  for (var i = 0; i < path.length; i++) {
    parts.push(pathToRegexp(path[i], keys, options).source)
  }

  var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options))

  return attachKeys(regexp, keys)
}

/**
 * Create a path regexp from string input.
 *
 * @param  {String} path
 * @param  {Array}  keys
 * @param  {Object} options
 * @return {RegExp}
 */
function stringToRegexp (path, keys, options) {
  var tokens = parse(path)
  var re = tokensToRegExp(tokens, options)

  // Attach keys back to the regexp.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] !== 'string') {
      keys.push(tokens[i])
    }
  }

  return attachKeys(re, keys)
}

/**
 * Expose a function for taking tokens and returning a RegExp.
 *
 * @param  {Array}  tokens
 * @param  {Array}  keys
 * @param  {Object} options
 * @return {RegExp}
 */
function tokensToRegExp (tokens, options) {
  options = options || {}

  var strict = options.strict
  var end = options.end !== false
  var route = ''
  var lastToken = tokens[tokens.length - 1]
  var endsWithSlash = typeof lastToken === 'string' && /\/$/.test(lastToken)

  // Iterate over the tokens and create our regexp string.
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i]

    if (typeof token === 'string') {
      route += escapeString(token)
    } else {
      var prefix = escapeString(token.prefix)
      var capture = token.pattern

      if (token.repeat) {
        capture += '(?:' + prefix + capture + ')*'
      }

      if (token.optional) {
        if (prefix) {
          capture = '(?:' + prefix + '(' + capture + '))?'
        } else {
          capture = '(' + capture + ')?'
        }
      } else {
        capture = prefix + '(' + capture + ')'
      }

      route += capture
    }
  }

  // In non-strict mode we allow a slash at the end of match. If the path to
  // match already ends with a slash, we remove it for consistency. The slash
  // is valid at the end of a path match, not in the middle. This is important
  // in non-ending mode, where "/test/" shouldn't match "/test//route".
  if (!strict) {
    route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?'
  }

  if (end) {
    route += '$'
  } else {
    // In non-ending mode, we need the capturing groups to match as much as
    // possible by using a positive lookahead to the end or next path segment.
    route += strict && endsWithSlash ? '' : '(?=\\/|$)'
  }

  return new RegExp('^' + route, flags(options))
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(String|RegExp|Array)} path
 * @param  {Array}                 [keys]
 * @param  {Object}                [options]
 * @return {RegExp}
 */
function pathToRegexp (path, keys, options) {
  keys = keys || []

  if (!isarray(keys)) {
    options = keys
    keys = []
  } else if (!options) {
    options = {}
  }

  if (path instanceof RegExp) {
    return regexpToRegexp(path, keys, options)
  }

  if (isarray(path)) {
    return arrayToRegexp(path, keys, options)
  }

  return stringToRegexp(path, keys, options)
}

},{"isarray":28}],28:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],29:[function(require,module,exports){
module.exports = require('./lib/supermodels');

},{"./lib/supermodels":40}],30:[function(require,module,exports){
'use strict'

var util = require('./util')
var createWrapperFactory = require('./factory')

function resolve (from) {
  var isCtor = util.isConstructor(from)
  var isSupermodelCtor = util.isSupermodelConstructor(from)
  var isArray = util.isArray(from)

  if (isCtor || isSupermodelCtor || isArray) {
    return {
      __type: from
    }
  }

  var isValue = !util.isObject(from)
  if (isValue) {
    return {
      __value: from
    }
  }

  return from
}

function createDef (from) {
  from = resolve(from)

  var __VALIDATORS = '__validators'
  var __VALUE = '__value'
  var __TYPE = '__type'
  var __DISPLAYNAME = '__displayName'
  var __GET = '__get'
  var __SET = '__set'
  var __ENUMERABLE = '__enumerable'
  var __CONFIGURABLE = '__configurable'
  var __WRITABLE = '__writable'
  var __SPECIAL_PROPS = [
    __VALIDATORS, __VALUE, __TYPE, __DISPLAYNAME,
    __GET, __SET, __ENUMERABLE, __CONFIGURABLE, __WRITABLE
  ]

  var def = {
    from: from,
    type: from[__TYPE],
    value: from[__VALUE],
    validators: from[__VALIDATORS] || [],
    enumerable: from[__ENUMERABLE] !== false,
    configurable: !!from[__CONFIGURABLE],
    writable: from[__WRITABLE] !== false,
    displayName: from[__DISPLAYNAME],
    getter: from[__GET],
    setter: from[__SET]
  }

  var type = def.type

  // Simple 'Constructor' Type
  if (util.isSimpleConstructor(type)) {
    def.isSimple = true

    def.cast = function (value) {
      return util.cast(value, type)
    }
  } else if (util.isSupermodelConstructor(type)) {
    def.isReference = true
  } else if (def.value) {
    // If a value is present, use
    // that and short-circuit the rest
    def.isSimple = true
  } else {
    // Otherwise look for other non-special
    // keys and also any item definition
    // in the case of Arrays

    var keys = Object.keys(from)
    var childKeys = keys.filter(function (item) {
      return __SPECIAL_PROPS.indexOf(item) === -1
    })

    if (childKeys.length) {
      var defs = {}
      var proto

      childKeys.forEach(function (key) {
        var descriptor = Object.getOwnPropertyDescriptor(from, key)
        var value

        if (descriptor.get || descriptor.set) {
          value = {
            __get: descriptor.get,
            __set: descriptor.set
          }
        } else {
          value = from[key]
        }

        if (!util.isConstructor(value) && !util.isSupermodelConstructor(value) && util.isFunction(value)) {
          if (!proto) {
            proto = {}
          }
          proto[key] = value
        } else {
          defs[key] = createDef(value)
        }
      })

      def.defs = defs
      def.proto = proto
    }

    // Check for Array
    if (type === Array || util.isArray(type)) {
      def.isArray = true

      if (type.length > 0) {
        def.def = createDef(type[0])
      }
    } else if (childKeys.length === 0) {
      def.isSimple = true
    }
  }

  def.create = createWrapperFactory(def)

  return def
}

module.exports = createDef

},{"./factory":34,"./util":41}],31:[function(require,module,exports){
'use strict'

module.exports = function (callback) {
  var arr = []

  /**
   * Proxied array mutators methods
   *
   * @param {Object} obj
   * @return {Object}
   * @api private
   */
  var pop = function () {
    var result = Array.prototype.pop.apply(arr)

    callback('pop', arr, {
      value: result
    })

    return result
  }
  var push = function () {
    var result = Array.prototype.push.apply(arr, arguments)

    callback('push', arr, {
      value: result
    })

    return result
  }
  var shift = function () {
    var result = Array.prototype.shift.apply(arr)

    callback('shift', arr, {
      value: result
    })

    return result
  }
  var sort = function () {
    var result = Array.prototype.sort.apply(arr, arguments)

    callback('sort', arr, {
      value: result
    })

    return result
  }
  var unshift = function () {
    var result = Array.prototype.unshift.apply(arr, arguments)

    callback('unshift', arr, {
      value: result
    })

    return result
  }
  var reverse = function () {
    var result = Array.prototype.reverse.apply(arr)

    callback('reverse', arr, {
      value: result
    })

    return result
  }
  var splice = function () {
    if (!arguments.length) {
      return
    }

    var result = Array.prototype.splice.apply(arr, arguments)

    callback('splice', arr, {
      value: result,
      removed: result,
      added: Array.prototype.slice.call(arguments, 2)
    })

    return result
  }

  /**
   * Proxy all Array.prototype mutator methods on this array instance
   */
  arr.pop = arr.pop && pop
  arr.push = arr.push && push
  arr.shift = arr.shift && shift
  arr.unshift = arr.unshift && unshift
  arr.sort = arr.sort && sort
  arr.reverse = arr.reverse && reverse
  arr.splice = arr.splice && splice

  /**
   * Special update function since we can't detect
   * assignment by index e.g. arr[0] = 'something'
   */
  arr.update = function (index, value) {
    var oldValue = arr[index]
    var newValue = arr[index] = value

    callback('update', arr, {
      index: index,
      value: newValue,
      oldValue: oldValue
    })

    return newValue
  }

  return arr
}

},{}],32:[function(require,module,exports){
'use strict'

module.exports = function EmitterEvent (name, path, target, detail) {
  this.name = name
  this.path = path
  this.target = target

  if (detail) {
    this.detail = detail
  }
}

},{}],33:[function(require,module,exports){
'use strict'

/**
 * Expose `Emitter`.
 */

module.exports = Emitter

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter (obj) {
  var ctx = obj || this

  if (obj) {
    ctx = mixin(obj)
    return ctx
  }
}

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin (obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key]
  }
  return obj
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on = Emitter.prototype.addEventListener = function (event, fn) {
  (this.__callbacks[event] = this.__callbacks[event] || [])
    .push(fn)
  return this
}

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function (event, fn) {
  function on () {
    this.off(event, on)
    fn.apply(this, arguments)
  }

  on.fn = fn
  this.on(event, on)
  return this
}

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off = Emitter.prototype.removeEventListener = Emitter.prototype.removeAllListeners = function (event, fn) {
  // all
  if (arguments.length === 0) {
    this.__callbacks = {}
    return this
  }

  // specific event
  var callbacks = this.__callbacks[event]
  if (!callbacks) {
    return this
  }

  // remove all handlers
  if (arguments.length === 1) {
    delete this.__callbacks[event]
    return this
  }

  // remove specific handler
  var cb
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i]
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1)
      break
    }
  }
  return this
}

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function (event) {
  var args = [].slice.call(arguments, 1)
  var callbacks = this.__callbacks[event]

  if (callbacks) {
    callbacks = callbacks.slice(0)
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args)
    }
  }

  return this
}

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function (event) {
  return this.__callbacks[event] || []
}

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function (event) {
  return !!this.listeners(event).length
}

},{}],34:[function(require,module,exports){
'use strict'

var util = require('./util')
var createModelPrototype = require('./proto')
var Wrapper = require('./wrapper')

function createModelDescriptors (def, parent) {
  var __ = {}

  var desc = {
    __: {
      value: __
    },
    __def: {
      value: def
    },
    __parent: {
      value: parent,
      writable: true
    },
    __callbacks: {
      value: {},
      writable: true
    }
  }

  return desc
}

function defineProperties (model) {
  var defs = model.__def.defs
  for (var key in defs) {
    defineProperty(model, key, defs[key])
  }
}

function defineProperty (model, key, def) {
  var desc = {
    get: function () {
      return this.__get(key)
    },
    enumerable: def.enumerable,
    configurable: def.configurable
  }

  if (def.writable) {
    desc.set = function (value) {
      this.__setNotifyChange(key, value)
    }
  }

  Object.defineProperty(model, key, desc)

  // Silently initialize the property wrapper
  model.__[key] = def.create(model)
}

function createWrapperFactory (def) {
  var wrapper, defaultValue, assert

  if (def.isSimple) {
    wrapper = new Wrapper(def.value, def.writable, def.validators, def.getter, def.setter, def.cast, null)
  } else if (def.isReference) {
    // Hold a reference to the
    // refererenced types' definition
    var refDef = def.type.def

    if (refDef.isSimple) {
      // If the referenced type is itself simple,
      // we can set just return a wrapper and
      // the property will get initialized.
      wrapper = new Wrapper(refDef.value, refDef.writable, refDef.validators, def.getter, def.setter, refDef.cast, null)
    } else {
      // If we're not dealing with a simple reference model
      // we need to define an assertion that the instance
      // being set is of the correct type. We do this be
      // comparing the defs.

      assert = function (value) {
        // compare the defintions of the value instance
        // being passed and the def property attached
        // to the type SupermodelConstructor. Allow the
        // value to be undefined or null also.
        var isCorrectType = false

        if (util.isNullOrUndefined(value)) {
          isCorrectType = true
        } else {
          isCorrectType = refDef === value.__def
        }

        if (!isCorrectType) {
          throw new Error('Value should be an instance of the referenced model, null or undefined')
        }
      }

      wrapper = new Wrapper(def.value, def.writable, def.validators, def.getter, def.setter, null, assert)
    }
  } else if (def.isArray) {
    defaultValue = function (parent) {
      // for Arrays, we create a new Array and each
      // time, mix the model properties into it
      var model = createModelPrototype(def)
      Object.defineProperties(model, createModelDescriptors(def, parent))
      defineProperties(model)
      return model
    }

    assert = function (value) {
      // todo: further array type validation
      if (!util.isArray(value)) {
        throw new Error('Value should be an array')
      }
    }

    wrapper = new Wrapper(defaultValue, def.writable, def.validators, def.getter, def.setter, null, assert)
  } else {
    // for Objects, we can create and reuse
    // a prototype object. We then need to only
    // define the defs and the 'instance' properties
    // e.g. __, parent etc.
    var proto = createModelPrototype(def)

    defaultValue = function (parent) {
      var model = Object.create(proto, createModelDescriptors(def, parent))
      defineProperties(model)
      return model
    }

    assert = function (value) {
      if (!proto.isPrototypeOf(value)) {
        throw new Error('Invalid prototype')
      }
    }

    wrapper = new Wrapper(defaultValue, def.writable, def.validators, def.getter, def.setter, null, assert)
  }

  var factory = function (parent) {
    var wrap = Object.create(wrapper)
    // if (!wrap.isInitialized) {
    wrap._initialize(parent)
    // }
    return wrap
  }

  // expose the wrapper, this is used
  // for validating array items later
  factory.wrapper = wrapper

  return factory
}

module.exports = createWrapperFactory

},{"./proto":38,"./util":41,"./wrapper":43}],35:[function(require,module,exports){
'use strict'

function merge (model, obj) {
  var isArray = model.__def.isArray
  var defs = model.__def.defs
  var defKeys, def, key, i, isSimple,
    isSimpleReference, isInitializedReference

  if (defs) {
    defKeys = Object.keys(defs)
    for (i = 0; i < defKeys.length; i++) {
      key = defKeys[i]
      if (obj.hasOwnProperty(key)) {
        def = defs[key]

        isSimple = def.isSimple
        isSimpleReference = def.isReference && def.type.def.isSimple
        isInitializedReference = def.isReference && obj[key] && obj[key].__supermodel

        if (isSimple || isSimpleReference || isInitializedReference) {
          model[key] = obj[key]
        } else if (obj[key]) {
          if (def.isReference) {
            model[key] = def.type()
          }
          merge(model[key], obj[key])
        }
      }
    }
  }

  if (isArray && Array.isArray(obj)) {
    for (i = 0; i < obj.length; i++) {
      if (obj[i] && obj[i].__supermodel) {
        model.push(obj[i])
      } else {
        var item = model.create()
        model.push(item && item.__supermodel ? merge(item, obj[i]) : obj[i])
      }
    }
  }

  return model
}

module.exports = merge

},{}],36:[function(require,module,exports){
'use strict'

var EmitterEvent = require('./emitter-event')
var ValidationError = require('./validation-error')
var Wrapper = require('./wrapper')
var merge = require('./merge')

var descriptors = {
  __supermodel: {
    value: true
  },
  __keys: {
    get: function () {
      var keys = Object.keys(this)

      if (Array.isArray(this)) {
        var omit = [
          'addEventListener', 'on', 'once', 'removeEventListener', 'removeAllListeners',
          'removeListener', 'off', 'emit', 'listeners', 'hasListeners', 'pop', 'push',
          'reverse', 'shift', 'sort', 'splice', 'update', 'unshift', 'create', '__merge',
          '__setNotifyChange', '__notifyChange', '__set', '__get', '__chain', '__relativePath'
        ]

        keys = keys.filter(function (item) {
          return omit.indexOf(item) < 0
        })
      }

      return keys
    }
  },
  __name: {
    get: function () {
      if (this.__isRoot) {
        return ''
      }

      // Work out the 'name' of the model
      // Look up to the parent and loop through it's keys,
      // Any value or array found to contain the value of this (this model)
      // then we return the key and index in the case we found the model in an array.
      var parentKeys = this.__parent.__keys
      var parentKey, parentValue

      for (var i = 0; i < parentKeys.length; i++) {
        parentKey = parentKeys[i]
        parentValue = this.__parent[parentKey]

        if (parentValue === this) {
          return parentKey
        }
      }
    }
  },
  __path: {
    get: function () {
      if (this.__hasAncestors && !this.__parent.__isRoot) {
        return this.__parent.__path + '.' + this.__name
      } else {
        return this.__name
      }
    }
  },
  __isRoot: {
    get: function () {
      return !this.__hasAncestors
    }
  },
  __children: {
    get: function () {
      var children = []

      var keys = this.__keys
      var key, value

      for (var i = 0; i < keys.length; i++) {
        key = keys[i]
        value = this[key]

        if (value && value.__supermodel) {
          children.push(value)
        }
      }

      return children
    }
  },
  __ancestors: {
    get: function () {
      var ancestors = []
      var r = this

      while (r.__parent) {
        ancestors.push(r.__parent)
        r = r.__parent
      }

      return ancestors
    }
  },
  __descendants: {
    get: function () {
      var descendants = []

      function checkAndAddDescendantIfModel (obj) {
        var keys = obj.__keys
        var key, value

        for (var i = 0; i < keys.length; i++) {
          key = keys[i]
          value = obj[key]

          if (value && value.__supermodel) {
            descendants.push(value)
            checkAndAddDescendantIfModel(value)
          }
        }
      }

      checkAndAddDescendantIfModel(this)

      return descendants
    }
  },
  __hasAncestors: {
    get: function () {
      return !!this.__ancestors.length
    }
  },
  __hasDescendants: {
    get: function () {
      return !!this.__descendants.length
    }
  },
  errors: {
    get: function () {
      var errors = []
      var def = this.__def
      var validator, error, i

      // Run own validators
      var own = def.validators.slice(0)
      for (i = 0; i < own.length; i++) {
        validator = own[i]
        error = validator.call(this, this)

        if (error) {
          errors.push(new ValidationError(this, error, validator))
        }
      }
      // Run through keys and evaluate validators
      var keys = this.__keys
      var value, key, itemDef, displayName

      for (i = 0; i < keys.length; i++) {
        key = keys[i]
        displayName = this.__def.defs && this.__def.defs[key].displayName
        // If we are an Array with an item definition
        // then we have to look into the Array for our value
        // and also get hold of the wrapper. We only need to
        // do this if the key is not a property of the array.
        // We check the defs to work this out (i.e. 0, 1, 2).
        // todo: This could be better to check !NaN on the key?
        if (def.isArray && def.def && (!def.defs || !(key in def.defs))) {
          // If we are an Array with a simple item definition
          // or a reference to a simple type definition
          // substitute the value with the wrapper we get from the
          // create factory function. Otherwise set the value to
          // the real value of the property.
          itemDef = def.def

          if (itemDef.isSimple) {
            value = itemDef.create.wrapper
            value._setValue(this[key])
          } else if (itemDef.isReference && itemDef.type.def.isSimple) {
            value = itemDef.type.def.create.wrapper
            value._setValue(this[key])
          } else {
            value = this[key]
          }
        } else {
          // Set the value to the wrapped value of the property
          value = this.__[key]
        }

        if (value) {
          if (value.__supermodel) {
            Array.prototype.push.apply(errors, value.errors)
          } else if (value instanceof Wrapper) {
            var wrapperValue = value._getValue(this)

            if (wrapperValue && wrapperValue.__supermodel) {
              Array.prototype.push.apply(errors, wrapperValue.errors)
            } else {
              Array.prototype.push.apply(errors, value._getErrors(this, key, displayName || key))
            }
          }
        }
      }

      return errors
    }
  }
}

var proto = {
  __get: function (key) {
    return this.__[key]._getValue(this)
  },
  __set: function (key, value) {
    this.__[key]._setValue(value, this)
  },
  __relativePath: function (to, key) {
    var relativePath = this.__path
      ? to.substr(this.__path.length + 1)
      : to

    if (relativePath) {
      return key ? relativePath + '.' + key : relativePath
    }
    return key
  },
  __chain: function (fn) {
    return [this].concat(this.__ancestors).forEach(fn)
  },
  __merge: function (data) {
    return merge(this, data)
  },
  __notifyChange: function (key, newValue, oldValue) {
    var target = this
    var targetPath = this.__path
    var eventName = 'set'
    var data = {
      oldValue: oldValue,
      newValue: newValue
    }

    this.emit(eventName, new EmitterEvent(eventName, key, target, data))
    this.emit('change', new EmitterEvent(eventName, key, target, data))
    this.emit('change:' + key, new EmitterEvent(eventName, key, target, data))

    this.__ancestors.forEach(function (item) {
      var path = item.__relativePath(targetPath, key)
      item.emit('change', new EmitterEvent(eventName, path, target, data))
    })
  },
  __setNotifyChange: function (key, value) {
    var oldValue = this.__get(key)
    this.__set(key, value)
    var newValue = this.__get(key)
    this.__notifyChange(key, newValue, oldValue)
  }
}

module.exports = {
  proto: proto,
  descriptors: descriptors
}

},{"./emitter-event":32,"./merge":35,"./validation-error":42,"./wrapper":43}],37:[function(require,module,exports){
'use strict'

function factory () {
  function Prop (type) {
    if (!(this instanceof Prop)) {
      return new Prop(type)
    }

    this.__type = type
    this.__validators = []
  }
  Prop.prototype.type = function (type) {
    this.__type = type
    return this
  }
  Prop.prototype.enumerable = function (enumerable) {
    this.__enumerable = enumerable
    return this
  }
  Prop.prototype.configurable = function (configurable) {
    this.__configurable = configurable
    return this
  }
  Prop.prototype.writable = function (writable) {
    this.__writable = writable
    return this
  }
  Prop.prototype.keys = function (keys) {
    if (this.__type !== Array) {
      this.__type = Object
    }
    for (var key in keys) {
      this[key] = keys[key]
    }
    return this
  }
  Prop.prototype.validate = function (fn) {
    this.__validators.push(fn)
    return this
  }
  Prop.prototype.get = function (fn) {
    this.__get = fn
    return this
  }
  Prop.prototype.set = function (fn) {
    this.__set = fn
    return this
  }
  Prop.prototype.value = function (value) {
    this.__value = value
    return this
  }
  Prop.prototype.name = function (name) {
    this.__displayName = name
    return this
  }
  Prop.register = function (name, fn) {
    var wrapper = function () {
      this.__validators.push(fn.apply(this, arguments))
      return this
    }
    Object.defineProperty(Prop.prototype, name, {
      value: wrapper
    })
  }
  return Prop
}

module.exports = factory

},{}],38:[function(require,module,exports){
'use strict'

var emitter = require('./emitter-object')
var emitterArray = require('./emitter-array')
var EmitterEvent = require('./emitter-event')

var extend = require('./util').extend
var model = require('./model')
var modelProto = model.proto
var modelDescriptors = model.descriptors

var modelPrototype = Object.create(modelProto, modelDescriptors)
var objectPrototype = (function () {
  var p = Object.create(modelPrototype)

  emitter(p)

  return p
})()

function createArrayPrototype () {
  var p = emitterArray(function (eventName, arr, e) {
    if (eventName === 'update') {
      /**
       * Forward the special array update
       * events as standard __notifyChange events
       */
      arr.__notifyChange(e.index, e.value, e.oldValue)
    } else {
      /**
       * All other events e.g. push, splice are relayed
       */
      var target = arr
      var path = arr.__path
      var data = e
      var key = e.index

      arr.emit(eventName, new EmitterEvent(eventName, '', target, data))
      arr.emit('change', new EmitterEvent(eventName, '', target, data))
      arr.__ancestors.forEach(function (item) {
        var name = item.__relativePath(path, key)
        item.emit('change', new EmitterEvent(eventName, name, target, data))
      })
    }
  })

  Object.defineProperties(p, modelDescriptors)

  emitter(p)

  extend(p, modelProto)

  return p
}

function createObjectModelPrototype (proto) {
  var p = Object.create(objectPrototype)

  if (proto) {
    extend(p, proto)
  }

  return p
}

function createArrayModelPrototype (proto, itemDef) {
  // We do not to attempt to subclass Array,
  // instead create a new instance each time
  // and mixin the proto object
  var p = createArrayPrototype()

  if (proto) {
    extend(p, proto)
  }

  if (itemDef) {
    // We have a definition for the items
    // that belong in this array.

    // Use the `wrapper` prototype property as a
    // virtual Wrapper object we can use
    // validate all the items in the array.
    var arrItemWrapper = itemDef.create.wrapper

    // Validate new models by overriding the emitter array
    // mutators that can cause new items to enter the array.
    overrideArrayAddingMutators(p, arrItemWrapper)

    // Provide a convenient model factory
    // for creating array item instances
    p.create = function () {
      return itemDef.isReference ? itemDef.type() : itemDef.create()._getValue(this)
    }
  }

  return p
}

function overrideArrayAddingMutators (arr, itemWrapper) {
  function getArrayArgs (items) {
    var args = []
    for (var i = 0; i < items.length; i++) {
      itemWrapper._setValue(items[i], arr)
      args.push(itemWrapper._getValue(arr))
    }
    return args
  }

  var push = arr.push
  var unshift = arr.unshift
  var splice = arr.splice
  var update = arr.update

  if (push) {
    arr.push = function () {
      var args = getArrayArgs(arguments)
      return push.apply(arr, args)
    }
  }

  if (unshift) {
    arr.unshift = function () {
      var args = getArrayArgs(arguments)
      return unshift.apply(arr, args)
    }
  }

  if (splice) {
    arr.splice = function () {
      var args = getArrayArgs(Array.prototype.slice.call(arguments, 2))
      args.unshift(arguments[1])
      args.unshift(arguments[0])
      return splice.apply(arr, args)
    }
  }

  if (update) {
    arr.update = function () {
      var args = getArrayArgs([arguments[1]])
      args.unshift(arguments[0])
      return update.apply(arr, args)
    }
  }
}

function createModelPrototype (def) {
  return def.isArray ? createArrayModelPrototype(def.proto, def.def) : createObjectModelPrototype(def.proto)
}

module.exports = createModelPrototype

},{"./emitter-array":31,"./emitter-event":32,"./emitter-object":33,"./model":36,"./util":41}],39:[function(require,module,exports){
'use strict'

module.exports = {}

},{}],40:[function(require,module,exports){
'use strict'

var prop = require('./prop')
var merge = require('./merge')
var createDef = require('./def')
var Supermodel = require('./supermodel')

function supermodels (schema) {
  var def = createDef(schema)

  function SupermodelConstructor (data) {
    var model = def.isSimple ? def.create() : def.create()._getValue({})

    if (data) {
      // if twe have been passed some
      // data, merge it into the model.
      model.__merge(data)
    }
    return model
  }
  Object.defineProperty(SupermodelConstructor, 'def', {
    value: def // this is used to validate referenced SupermodelConstructors
  })
  SupermodelConstructor.prototype = Supermodel // this shared object is used, as a prototype, to identify SupermodelConstructors
  SupermodelConstructor.constructor = SupermodelConstructor
  return SupermodelConstructor
}

supermodels.prop = prop
supermodels.merge = merge

module.exports = supermodels

},{"./def":30,"./merge":35,"./prop":37,"./supermodel":39}],41:[function(require,module,exports){
'use strict'

var Supermodel = require('./supermodel')

function extend (origin, add) {
  // Don't do anything if add isn't an object
  if (!add || typeof add !== 'object') {
    return origin
  }

  var keys = Object.keys(add)
  var i = keys.length
  while (i--) {
    origin[keys[i]] = add[keys[i]]
  }
  return origin
}

var util = {
  extend: extend,
  typeOf: function (obj) {
    return Object.prototype.toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
  },
  isObject: function (value) {
    return this.typeOf(value) === 'object'
  },
  isArray: function (value) {
    return Array.isArray(value)
  },
  isSimple: function (value) {
    // 'Simple' here means anything
    // other than an Object or an Array
    // i.e. number, string, date, bool, null, undefined, regex...
    return !this.isObject(value) && !this.isArray(value)
  },
  isFunction: function (value) {
    return this.typeOf(value) === 'function'
  },
  isDate: function (value) {
    return this.typeOf(value) === 'date'
  },
  isNull: function (value) {
    return value === null
  },
  isUndefined: function (value) {
    return typeof (value) === 'undefined'
  },
  isNullOrUndefined: function (value) {
    return this.isNull(value) || this.isUndefined(value)
  },
  cast: function (value, type) {
    if (!type) {
      return value
    }

    switch (type) {
      case String:
        return util.castString(value)
      case Number:
        return util.castNumber(value)
      case Boolean:
        return util.castBoolean(value)
      case Date:
        return util.castDate(value)
      case Object:
      case Function:
        return value
      default:
        throw new Error('Invalid cast')
    }
  },
  castString: function (value) {
    if (value === undefined || value === null || util.typeOf(value) === 'string') {
      return value
    }
    return value.toString && value.toString()
  },
  castNumber: function (value) {
    if (value === undefined || value === null) {
      return NaN
    }
    if (util.typeOf(value) === 'number') {
      return value
    }
    return Number(value)
  },
  castBoolean: function (value) {
    if (!value) {
      return false
    }
    var falsey = ['0', 'false', 'off', 'no']
    return falsey.indexOf(value) === -1
  },
  castDate: function (value) {
    if (value === undefined || value === null || util.typeOf(value) === 'date') {
      return value
    }
    return new Date(value)
  },
  isConstructor: function (value) {
    return this.isSimpleConstructor(value) || [Array, Object].indexOf(value) > -1
  },
  isSimpleConstructor: function (value) {
    return [String, Number, Date, Boolean].indexOf(value) > -1
  },
  isSupermodelConstructor: function (value) {
    return this.isFunction(value) && value.prototype === Supermodel
  }
}

module.exports = util

},{"./supermodel":39}],42:[function(require,module,exports){
'use strict'

function ValidationError (target, error, validator, key) {
  this.target = target
  this.error = error
  this.validator = validator

  if (key) {
    this.key = key
  }
}

module.exports = ValidationError

},{}],43:[function(require,module,exports){
'use strict'

var util = require('./util')
var ValidationError = require('./validation-error')

function Wrapper (defaultValue, writable, validators, getter, setter, beforeSet, assert) {
  this.validators = validators

  this._defaultValue = defaultValue
  this._writable = writable
  this._getter = getter
  this._setter = setter
  this._beforeSet = beforeSet
  this._assert = assert
  this.isInitialized = false

  if (!util.isFunction(defaultValue)) {
    this.isInitialized = true

    if (!util.isUndefined(defaultValue)) {
      this._value = defaultValue
    }
  }
}
Wrapper.prototype._initialize = function (parent) {
  if (this.isInitialized) {
    return
  }

  this._setValue(this._defaultValue(parent), parent)
  this.isInitialized = true
}
Wrapper.prototype._getErrors = function (model, key, displayName) {
  model = model || this
  key = key || ''
  displayName = displayName || key

  var simple = this.validators
  var errors = []
  var value = this._getValue(model)
  var validator, error

  for (var i = 0; i < simple.length; i++) {
    validator = simple[i]
    error = validator.call(model, value, displayName)

    if (error) {
      errors.push(new ValidationError(model, error, validator, key))
    }
  }

  return errors
}
Wrapper.prototype._getValue = function (model) {
  return this._getter ? this._getter.call(model) : this._value
}
Wrapper.prototype._setValue = function (value, model) {
  if (!this._writable) {
    throw new Error('Value is readonly')
  }

  // Hook up the parent ref if necessary
  if (value && value.__supermodel && model) {
    if (value.__parent !== model) {
      value.__parent = model
    }
  }

  var val
  if (this._setter) {
    this._setter.call(model, value)
    val = this._getValue(model)
  } else {
    val = this._beforeSet ? this._beforeSet(value) : value
  }

  if (this._assert) {
    this._assert(val)
  }

  this._value = val
}

Object.defineProperties(Wrapper.prototype, {
  value: {
    get: function () {
      return this._getValue()
    },
    set: function (value) {
      this._setValue(value)
    }
  },
  errors: {
    get: function () {
      return this._getErrors()
    }
  }
})
module.exports = Wrapper

},{"./util":41,"./validation-error":42}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvY2xpZW50LmpzIiwiY2xpZW50L2VkaXRvci9pbmRleC5qcyIsImNsaWVudC9maWxlLmpzIiwiY2xpZW50L2ZpbGVzLmpzIiwiY2xpZW50L2ZzLmpzIiwiY2xpZW50L2luZGV4LmpzIiwiY2xpZW50L21vZGVzLmpzIiwiY2xpZW50L3BhdGNoLmpzIiwiY2xpZW50L3JlY2VudC9pbmRleC5odG1sIiwiY2xpZW50L3JlY2VudC9pbmRleC5qcyIsImNsaWVudC9zZXNzaW9uLmpzIiwiY2xpZW50L3Nlc3Npb25zLmpzIiwiY2xpZW50L3NwbGl0dGVyLmpzIiwiY2xpZW50L3N0YXRlLmpzIiwiY2xpZW50L3RyZWUvaW5kZXguanMiLCJjbGllbnQvdHJlZS92aWV3Lmh0bWwiLCJjbGllbnQvdXRpbC5qcyIsImNvbmZpZy9jbGllbnQuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3F1ZXJ5c3RyaW5nLWVzMy9kZWNvZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcXVlcnlzdHJpbmctZXMzL2VuY29kZS5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9xdWVyeXN0cmluZy1lczMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaW5jcmVtZW50YWwtZG9tL2Rpc3QvaW5jcmVtZW50YWwtZG9tLWNqcy5qcyIsIm5vZGVfbW9kdWxlcy9uZXMvY2xpZW50LmpzIiwibm9kZV9tb2R1bGVzL25lcy9kaXN0L2NsaWVudC5qcyIsIm5vZGVfbW9kdWxlcy9wYWdlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3BhZ2Uvbm9kZV9tb2R1bGVzL3BhdGgtdG8tcmVnZXhwL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3BhZ2Uvbm9kZV9tb2R1bGVzL3BhdGgtdG8tcmVnZXhwL25vZGVfbW9kdWxlcy9pc2FycmF5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybW9kZWxzLmpzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybW9kZWxzLmpzL2xpYi9kZWYuanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL2VtaXR0ZXItYXJyYXkuanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL2VtaXR0ZXItZXZlbnQuanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL2VtaXR0ZXItb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybW9kZWxzLmpzL2xpYi9mYWN0b3J5LmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybW9kZWxzLmpzL2xpYi9tZXJnZS5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcm1vZGVscy5qcy9saWIvbW9kZWwuanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL3Byb3AuanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL3Byb3RvLmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybW9kZWxzLmpzL2xpYi9zdXBlcm1vZGVsLmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybW9kZWxzLmpzL2xpYi9zdXBlcm1vZGVscy5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcm1vZGVscy5qcy9saWIvdXRpbC5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcm1vZGVscy5qcy9saWIvdmFsaWRhdGlvbi1lcnJvci5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcm1vZGVscy5qcy9saWIvd3JhcHBlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdHBDQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzVtQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzNtQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFlBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIE5lcyA9IHJlcXVpcmUoJ25lcy9jbGllbnQnKVxudmFyIGhvc3QgPSB3aW5kb3cubG9jYXRpb24uaG9zdFxudmFyIGNsaWVudCA9IG5ldyBOZXMuQ2xpZW50KCd3czovLycgKyBob3N0KVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsaWVudFxuIiwidmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4uLy4uL2NvbmZpZy9jbGllbnQnKVxuXG52YXIgZWRpdG9yID0gd2luZG93LmFjZS5lZGl0KCdlZGl0b3InKVxuXG4vLyBTZXQgZWRpdG9yIG9wdGlvbnNcbmVkaXRvci5zZXRPcHRpb25zKHtcbiAgZW5hYmxlU25pcHBldHM6IHRydWUsXG4gIGVuYWJsZUJhc2ljQXV0b2NvbXBsZXRpb246IHRydWUsXG4gIGVuYWJsZUxpdmVBdXRvY29tcGxldGlvbjogZmFsc2UsXG4gIGZvbnRTaXplOiBjb25maWcuYWNlLmZvbnRTaXplXG59KVxuXG5lZGl0b3IuY29tbWFuZHMuYWRkQ29tbWFuZHMoW3tcbiAgbmFtZTogJ2hlbHAnLFxuICBiaW5kS2V5OiB7XG4gICAgd2luOiAnQ3RybC1IJyxcbiAgICBtYWM6ICdDb21tYW5kLUgnXG4gIH0sXG4gIGV4ZWM6IGZ1bmN0aW9uICgpIHtcbiAgICAvLyAkbW9kYWwub3Blbih7XG4gICAgLy8gICB0ZW1wbGF0ZVVybDogJy9jbGllbnQvZnMvdmlld3Mva2V5Ym9hcmQtc2hvcnRjdXRzLmh0bWwnLFxuICAgIC8vICAgc2l6ZTogJ2xnJ1xuICAgIC8vIH0pXG4gIH0sXG4gIHJlYWRPbmx5OiBmYWxzZSAvLyB0aGlzIGNvbW1hbmQgc2hvdWxkIGFwcGx5IGluIHJlYWRPbmx5IG1vZGVcbn1dKVxuXG5lZGl0b3Iuc2V0VGhlbWUoJ2FjZS90aGVtZS8nICsgY29uZmlnLmFjZS50aGVtZSlcblxubW9kdWxlLmV4cG9ydHMgPSBlZGl0b3JcbiIsInZhciBzdXBlcm1vZGVscyA9IHJlcXVpcmUoJ3N1cGVybW9kZWxzLmpzJylcblxudmFyIHNjaGVtYSA9IHtcbiAgbmFtZTogU3RyaW5nLFxuICBwYXRoOiBTdHJpbmcsXG4gIHJlbGF0aXZlRGlyOiBTdHJpbmcsXG4gIHJlbGF0aXZlUGF0aDogU3RyaW5nLFxuICBkaXI6IFN0cmluZyxcbiAgaXNEaXJlY3Rvcnk6IEJvb2xlYW4sXG4gIGV4dDogU3RyaW5nLFxuICBzdGF0OiBPYmplY3QsXG4gIGdldCBpc0ZpbGUgKCkge1xuICAgIHJldHVybiAhdGhpcy5pc0RpcmVjdG9yeVxuICB9LFxuICBleHBhbmRlZDogQm9vbGVhblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN1cGVybW9kZWxzKHNjaGVtYSlcbiIsInZhciBzdXBlcm1vZGVscyA9IHJlcXVpcmUoJ3N1cGVybW9kZWxzLmpzJylcbnZhciBGaWxlID0gcmVxdWlyZSgnLi9maWxlJylcblxudmFyIHNjaGVtYSA9IHtcbiAgaXRlbXM6IFtGaWxlXSxcbiAgZmluZDogZnVuY3Rpb24gKHJlbGF0aXZlUGF0aCkge1xuICAgIHJldHVybiB0aGlzLml0ZW1zLmZpbmQoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHJldHVybiBpdGVtLnJlbGF0aXZlUGF0aCA9PT0gcmVsYXRpdmVQYXRoXG4gICAgfSlcbiAgfSxcbiAgZmluZEJ5UGF0aDogZnVuY3Rpb24gKHBhdGgpIHtcbiAgICByZXR1cm4gdGhpcy5pdGVtcy5maW5kKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5wYXRoID09PSBwYXRoXG4gICAgfSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN1cGVybW9kZWxzKHNjaGVtYSlcbiIsInZhciBjbGllbnQgPSByZXF1aXJlKCcuL2NsaWVudCcpXG5cbi8vIHZhciBzdXBlcm1vZGVscyA9IHJlcXVpcmUoJ3N1cGVybW9kZWxzLmpzJylcbi8vIHZhciBGaWxlcyA9IHJlcXVpcmUoJy4vZmlsZXMnKVxuLy8gdmFyIFN0YXRlID0gcmVxdWlyZSgnLi9zdGF0ZScpXG4vL1xuLy8gdmFyIHNjaGVtYSA9IHtcbi8vICAgZmlsZXM6IEZpbGVzLFxuLy8gICBzdGF0ZTogU3RhdGVcbi8vIH1cbi8vXG4vLyBtb2R1bGUuZXhwb3J0cyA9IHN1cGVybW9kZWxzKHNjaGVtYSlcblxuZnVuY3Rpb24gcmVhZEZpbGUgKHBhdGgsIGNhbGxiYWNrKSB7XG4gIGNsaWVudC5yZXF1ZXN0KHtcbiAgICBwYXRoOiAnL3JlYWRmaWxlP3BhdGg9JyArIHBhdGgsXG4gICAgLy8gcGF5bG9hZDoge1xuICAgIC8vICAgcGF0aDogcGF0aFxuICAgIC8vIH0sXG4gICAgbWV0aG9kOiAnR0VUJ1xuICB9LCBjYWxsYmFjaylcbn1cblxuLy8gZnVuY3Rpb24gb3BlbkZpbGUgKGZpbGUpIHtcbi8vICAgdmFyIHNlc3Npb24gPSBzZXNzaW9ucy5maW5kKGZpbGUpXG4vLyAgIGlmIChzZXNzaW9uKSB7XG4vLyAgICAgc3RhdGUuY3VycmVudCA9IGZpbGVcbi8vICAgICBlZGl0b3Iuc2V0U2Vzc2lvbihzZXNzaW9uLmVkaXRTZXNzaW9uKVxuLy8gICB9IGVsc2Uge1xuLy8gICAgIHJlYWRGaWxlKGZpbGUucGF0aCwgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuLy8gICAgICAgaWYgKGVycikge1xuLy8gICAgICAgICByZXR1cm4gaGFuZGxlRXJyb3IoZXJyKVxuLy8gICAgICAgfVxuLy9cbi8vICAgICAgIGlmICghc3RhdGUucmVjZW50LmZpbmRCeVBhdGgoZmlsZS5wYXRoKSkge1xuLy8gICAgICAgICBzdGF0ZS5yZWNlbnQudW5zaGlmdChmaWxlKVxuLy8gICAgICAgfVxuLy9cbi8vICAgICAgIHNlc3Npb24gPSBzZXNzaW9ucy5hZGQoZmlsZSwgcGF5bG9hZC5jb250ZW50cylcbi8vICAgICAgIHN0YXRlLmN1cnJlbnQgPSBmaWxlXG4vLyAgICAgICBlZGl0b3Iuc2V0U2Vzc2lvbihzZXNzaW9uLmVkaXRTZXNzaW9uKVxuLy8gICAgIH0pXG4vLyAgIH1cbi8vIH1cblxuLy8gZnVuY3Rpb24gY2xvc2VGaWxlIChmaWxlKSB7XG4vLyAgIHZhciBjbG9zZSA9IGZhbHNlXG4vLyAgIHZhciBzZXNzaW9uID0gc2Vzc2lvbnMuZmluZChmaWxlKVxuLy9cbi8vICAgaWYgKHNlc3Npb24gJiYgc2Vzc2lvbi5pc0RpcnR5KSB7XG4vLyAgICAgaWYgKHdpbmRvdy5jb25maXJtKCdUaGVyZSBhcmUgdW5zYXZlZCBjaGFuZ2VzIHRvIHRoaXMgZmlsZS4gQXJlIHlvdSBzdXJlPycpKSB7XG4vLyAgICAgICBjbG9zZSA9IHRydWVcbi8vICAgICB9XG4vLyAgIH0gZWxzZSB7XG4vLyAgICAgY2xvc2UgPSB0cnVlXG4vLyAgIH1cbi8vXG4vLyAgIGlmIChjbG9zZSkge1xuLy8gICAgIC8vIFJlbW92ZSBmcm9tIHJlY2VudCBmaWxlc1xuLy8gICAgIHN0YXRlLnJlY2VudC5zcGxpY2Uoc3RhdGUucmVjZW50LmluZGV4T2YoZmlsZSksIDEpXG4vL1xuLy8gICAgIGlmIChzZXNzaW9uKSB7XG4vLyAgICAgICAvLyBSZW1vdmUgc2Vzc2lvblxuLy8gICAgICAgc2Vzc2lvbnMuaXRlbXMuc3BsaWNlKHNlc3Npb25zLml0ZW1zLmluZGV4T2Yoc2Vzc2lvbiksIDEpXG4vL1xuLy8gICAgICAgaWYgKHN0YXRlLmN1cnJlbnQgPT09IGZpbGUpIHtcbi8vICAgICAgICAgaWYgKHNlc3Npb25zLml0ZW1zLmxlbmd0aCkge1xuLy8gICAgICAgICAgIC8vIE9wZW4gdGhlIG5leHQgc2Vzc2lvblxuLy8gICAgICAgICAgIG9wZW5GaWxlKHNlc3Npb25zLml0ZW1zWzBdLmZpbGUpXG4vLyAgICAgICAgIH0gZWxzZSBpZiAoc3RhdGUucmVjZW50Lmxlbmd0aCkge1xuLy8gICAgICAgICAgIC8vIE9wZW4gdGhlIG5leHQgZmlsZVxuLy8gICAgICAgICAgIG9wZW5GaWxlKHN0YXRlLnJlY2VudFswXSlcbi8vICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICBzdGF0ZS5jdXJyZW50ID0gbnVsbFxuLy8gICAgICAgICAgIGVkaXRvci5zZXRTZXNzaW9uKG51bGwpXG4vLyAgICAgICAgIH1cbi8vICAgICAgIH1cbi8vICAgICB9XG4vLyAgIH1cbi8vIH1cblxuZnVuY3Rpb24gd3JpdGVGaWxlIChwYXRoLCBjb250ZW50cywgY2FsbGJhY2spIHtcbiAgY2xpZW50LnJlcXVlc3Qoe1xuICAgIHBhdGg6ICcvd3JpdGVmaWxlJyxcbiAgICBwYXlsb2FkOiB7XG4gICAgICBwYXRoOiBwYXRoLFxuICAgICAgY29udGVudHM6IGNvbnRlbnRzXG4gICAgfSxcbiAgICBtZXRob2Q6ICdQVVQnXG4gIH0sIGNhbGxiYWNrKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgLy8gcnVuOiBydW4sXG4gIC8vIG9wZW5GaWxlOiBvcGVuRmlsZSxcbiAgLy8gY2xvc2VGaWxlOiBjbG9zZUZpbGUsXG4gIHJlYWRGaWxlOiByZWFkRmlsZSxcbiAgd3JpdGVGaWxlOiB3cml0ZUZpbGUvLyAsXG4gIC8vIGhhbmRsZUVycm9yOiBoYW5kbGVFcnJvclxufVxuIiwidmFyIHBhZ2UgPSByZXF1aXJlKCdwYWdlJylcbnZhciBxcyA9IHJlcXVpcmUoJ3F1ZXJ5c3RyaW5nJylcbnZhciBmcyA9IHJlcXVpcmUoJy4vZnMnKVxudmFyIHN0YXRlID0gcmVxdWlyZSgnLi9zdGF0ZScpXG52YXIgc2Vzc2lvbnMgPSByZXF1aXJlKCcuL3Nlc3Npb25zJylcbnZhciBGaWxlcyA9IHJlcXVpcmUoJy4vZmlsZXMnKVxudmFyIFRyZWUgPSByZXF1aXJlKCcuL3RyZWUnKVxudmFyIFJlY2VudCA9IHJlcXVpcmUoJy4vcmVjZW50JylcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJylcbnZhciBzcGxpdHRlciA9IHJlcXVpcmUoJy4vc3BsaXR0ZXInKVxudmFyIGVkaXRvciA9IHJlcXVpcmUoJy4vZWRpdG9yJylcbnZhciBjbGllbnQgPSByZXF1aXJlKCcuL2NsaWVudCcpXG5cbnZhciBtYWluRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFpbicpXG52YXIgcmVjZW50RWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVjZW50JylcbnZhciB0cmVlRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJlZScpXG52YXIgd29ya3NwYWNlc0VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dvcmtzcGFjZXMnKVxuXG53aW5kb3cub25iZWZvcmV1bmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChzZXNzaW9ucy5kaXJ0eS5sZW5ndGgpIHtcbiAgICByZXR1cm4gJ1Vuc2F2ZWQgY2hhbmdlcyB3aWxsIGJlIGxvc3QgLSBhcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gbGVhdmU/J1xuICB9XG59XG5cbnNwbGl0dGVyKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaWRlYmFyLXdvcmtzcGFjZXMnKSlcbnNwbGl0dGVyKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3b3Jrc3BhY2VzLWluZm8nKSlcbnNwbGl0dGVyKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYWluLWZvb3RlcicpKVxuXG5jbGllbnQuY29ubmVjdChmdW5jdGlvbiAoZXJyKSB7XG4gIGlmIChlcnIpIHtcbiAgICByZXR1cm4gdXRpbC5oYW5kbGVFcnJvcihlcnIpXG4gIH1cblxuICBjbGllbnQucmVxdWVzdCgnL3dhdGNoZWQnLCBmdW5jdGlvbiAoZXJyLCBwYXlsb2FkKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgcmV0dXJuIHV0aWwuaGFuZGxlRXJyb3IoZXJyKVxuICAgIH1cblxuICAgIC8vIEluaXRpYWxpemUgdGhlIGZpbGVzXG4gICAgdmFyIGZpbGVzID0gbmV3IEZpbGVzKHtcbiAgICAgIGl0ZW1zOiBwYXlsb2FkLndhdGNoZWRcbiAgICB9KVxuXG4gICAgLy8gTG9hZCB0aGUgc3RhdGUgZnJvbSBsb2NhbFN0b3JhZ2VcbiAgICBzdGF0ZS5sb2FkKGZpbGVzKVxuXG4gICAgLy8gU2F2ZSBzdGF0ZSBvbiBwYWdlIHVubG9hZFxuICAgIHdpbmRvdy5vbnVubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdsb2cnKVxuICAgICAgc3RhdGUuc2F2ZShmaWxlcylcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgYSBuZXcgbm9pZGUgaW5zdGFuY2VcbiAgICAvLyB2YXIgbm9pZGUgPSBuZXcgTm9pZGUoe1xuICAgIC8vICAgc3RhdGU6IHN0YXRlLFxuICAgIC8vICAgZmlsZXM6IGZpbGVzXG4gICAgLy8gfSlcblxuICAgIC8vIEJ1aWxkIHRoZSB0cmVlXG4gICAgdmFyIHRyZWVWaWV3ID0gbmV3IFRyZWUodHJlZUVsLCBmaWxlcywgc3RhdGUpXG4gICAgdHJlZVZpZXcucmVuZGVyKClcblxuICAgIC8vIEJ1aWxkIHRoZSByZWNlbnQgbGlzdFxuICAgIHZhciByZWNlbnRWaWV3ID0gbmV3IFJlY2VudChyZWNlbnRFbCwgc3RhdGUpXG4gICAgcmVjZW50Vmlldy5yZW5kZXIoKVxuXG4gICAgcGFnZSgnLycsIGZ1bmN0aW9uIChjdHgpIHtcbiAgICAgIHdvcmtzcGFjZXNFbC5jbGFzc05hbWUgPSAnd2VsY29tZSdcbiAgICB9KVxuXG4gICAgcGFnZSgnL2ZpbGUnLCBmdW5jdGlvbiAoY3R4LCBuZXh0KSB7XG4gICAgICB2YXIgcGF0aCA9IHFzLnBhcnNlKGN0eC5xdWVyeXN0cmluZykucGF0aFxuICAgICAgdmFyIGZpbGUgPSBmaWxlcy5maW5kKHBhdGgpXG5cbiAgICAgIGlmICghZmlsZSkge1xuICAgICAgICByZXR1cm4gbmV4dCgpXG4gICAgICB9XG5cbiAgICAgIHZhciBzZXNzaW9uID0gc2Vzc2lvbnMuZmluZChmaWxlKVxuXG4gICAgICBmdW5jdGlvbiBzZXRTZXNzaW9uICgpIHtcbiAgICAgICAgd29ya3NwYWNlc0VsLmNsYXNzTmFtZSA9ICdlZGl0b3InXG5cbiAgICAgICAgLy8gVXBkYXRlIHN0YXRlXG4gICAgICAgIHN0YXRlLmN1cnJlbnQgPSBmaWxlXG5cbiAgICAgICAgdmFyIGl0ZW1zID0gc3RhdGUucmVjZW50Lml0ZW1zXG4gICAgICAgIGlmIChpdGVtcy5pbmRleE9mKGZpbGUpIDwgMCkge1xuICAgICAgICAgIGl0ZW1zLnVuc2hpZnQoZmlsZSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldCB0aGUgZWRpdG9yIHNlc3Npb25cbiAgICAgICAgZWRpdG9yLnNldFNlc3Npb24oc2Vzc2lvbi5lZGl0U2Vzc2lvbilcbiAgICAgICAgZWRpdG9yLnJlc2l6ZSgpXG4gICAgICB9XG5cbiAgICAgIGlmIChzZXNzaW9uKSB7XG4gICAgICAgIHNldFNlc3Npb24oKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZnMucmVhZEZpbGUocGF0aCwgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiB1dGlsLmhhbmRsZUVycm9yKGVycilcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZXNzaW9uID0gc2Vzc2lvbnMuYWRkKGZpbGUsIHBheWxvYWQuY29udGVudHMpXG4gICAgICAgICAgc2V0U2Vzc2lvbigpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSlcblxuICAgIHBhZ2UoJyonLCBmdW5jdGlvbiAoY3R4KSB7XG4gICAgICB3b3Jrc3BhY2VzRWwuY2xhc3NOYW1lID0gJ25vdC1mb3VuZCdcbiAgICB9KVxuXG4gICAgcGFnZSh7XG4gICAgICBoYXNoYmFuZzogdHJ1ZVxuICAgIH0pXG4gIH0pXG59KVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZmlsZSkge1xuICB2YXIgbW9kZXMgPSB7XG4gICAgJy5qcyc6ICdhY2UvbW9kZS9qYXZhc2NyaXB0JyxcbiAgICAnLmNzcyc6ICdhY2UvbW9kZS9jc3MnLFxuICAgICcuc2Nzcyc6ICdhY2UvbW9kZS9zY3NzJyxcbiAgICAnLmxlc3MnOiAnYWNlL21vZGUvbGVzcycsXG4gICAgJy5odG1sJzogJ2FjZS9tb2RlL2h0bWwnLFxuICAgICcuaHRtJzogJ2FjZS9tb2RlL2h0bWwnLFxuICAgICcuZWpzJzogJ2FjZS9tb2RlL2h0bWwnLFxuICAgICcuanNvbic6ICdhY2UvbW9kZS9qc29uJyxcbiAgICAnLm1kJzogJ2FjZS9tb2RlL21hcmtkb3duJyxcbiAgICAnLmNvZmZlZSc6ICdhY2UvbW9kZS9jb2ZmZWUnLFxuICAgICcuamFkZSc6ICdhY2UvbW9kZS9qYWRlJyxcbiAgICAnLnBocCc6ICdhY2UvbW9kZS9waHAnLFxuICAgICcucHknOiAnYWNlL21vZGUvcHl0aG9uJyxcbiAgICAnLnNhc3MnOiAnYWNlL21vZGUvc2FzcycsXG4gICAgJy50eHQnOiAnYWNlL21vZGUvdGV4dCcsXG4gICAgJy50eXBlc2NyaXB0JzogJ2FjZS9tb2RlL3R5cGVzY3JpcHQnLFxuICAgICcuZ2l0aWdub3JlJzogJ2FjZS9tb2RlL2dpdGlnbm9yZScsXG4gICAgJy54bWwnOiAnYWNlL21vZGUveG1sJ1xuICB9XG5cbiAgcmV0dXJuIG1vZGVzW2ZpbGUuZXh0XVxufVxuIiwidmFyIHBhdGNoID0gcmVxdWlyZSgnaW5jcmVtZW50YWwtZG9tJykucGF0Y2hcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWwsIHZpZXcsIGRhdGEpIHtcbiAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gIGlmIChhcmdzLmxlbmd0aCA8PSAzKSB7XG4gICAgcGF0Y2goZWwsIHZpZXcsIGRhdGEpXG4gIH0gZWxzZSB7XG4gICAgcGF0Y2goZWwsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZpZXcuYXBwbHkodGhpcywgYXJncy5zbGljZSgyKSlcbiAgICB9KVxuICB9XG59XG4iLCJ2YXIgSW5jcmVtZW50YWxET00gPSByZXF1aXJlKCdpbmNyZW1lbnRhbC1kb20nKVxudmFyIHBhdGNoID0gSW5jcmVtZW50YWxET00ucGF0Y2hcbnZhciBlbGVtZW50T3BlbiA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRPcGVuXG52YXIgZWxlbWVudFZvaWQgPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50Vm9pZFxudmFyIGVsZW1lbnRDbG9zZSA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRDbG9zZVxudmFyIGVsZW1lbnRQbGFjZWhvbGRlciA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRQbGFjZWhvbGRlclxudmFyIHRleHQgPSBJbmNyZW1lbnRhbERPTS50ZXh0XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcbnZhciBob2lzdGVkMSA9IFtcImNsYXNzXCIsIFwibGlzdC1ncm91cFwiXVxudmFyIGhvaXN0ZWQyID0gW1wiY2xhc3NcIiwgXCJjbG9zZVwiXVxudmFyIGhvaXN0ZWQzID0gW1wiY2xhc3NcIiwgXCJuYW1lIGljb24gaWNvbi1maWxlLXRleHRcIl1cbnZhciBob2lzdGVkNCA9IFtcImNsYXNzXCIsIFwibGlzdC1ncm91cC1pdGVtLXRleHRcIl1cblxucmV0dXJuIGZ1bmN0aW9uIHJlY2VudCAoZmlsZXMsIGN1cnJlbnQsIG9uQ2xpY2tDbG9zZSkge1xuICBlbGVtZW50T3BlbihcImRpdlwiLCBudWxsLCBob2lzdGVkMSwgXCJzdHlsZVwiLCB7ZGlzcGxheTogZmlsZXMubGVuZ3RoID8gJycgOiAnbm9uZSd9KVxuICAgIDsoQXJyYXkuaXNBcnJheShmaWxlcykgPyBmaWxlcyA6IE9iamVjdC5rZXlzKGZpbGVzKSkuZm9yRWFjaChmdW5jdGlvbihmaWxlLCAkaW5kZXgpIHtcbiAgICAgIGVsZW1lbnRPcGVuKFwiYVwiLCBmaWxlLnJlbGF0aXZlUGF0aCwgbnVsbCwgXCJ0aXRsZVwiLCBmaWxlLnJlbGF0aXZlUGF0aCwgXCJocmVmXCIsICcvZmlsZT9wYXRoPScgKyBmaWxlLnJlbGF0aXZlUGF0aCwgXCJjbGFzc1wiLCAnbGlzdC1ncm91cC1pdGVtJyArIChmaWxlID09PSBjdXJyZW50ID8gJyBhY3RpdmUnIDogJycpKVxuICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgaG9pc3RlZDIsIFwib25jbGlja1wiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgICAgb25DbGlja0Nsb3NlKGZpbGUpfSlcbiAgICAgICAgICB0ZXh0KFwiw5dcIilcbiAgICAgICAgZWxlbWVudENsb3NlKFwic3BhblwiKVxuICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgaG9pc3RlZDMsIFwiZGF0YS1uYW1lXCIsIGZpbGUubmFtZSwgXCJkYXRhLXBhdGhcIiwgZmlsZS5yZWxhdGl2ZVBhdGgpXG4gICAgICAgICAgdGV4dChcIlwiICsgKGZpbGUubmFtZSkgKyBcIlwiKVxuICAgICAgICBlbGVtZW50Q2xvc2UoXCJzcGFuXCIpXG4gICAgICAgIGlmIChmYWxzZSkge1xuICAgICAgICAgIGVsZW1lbnRPcGVuKFwicFwiLCBudWxsLCBob2lzdGVkNClcbiAgICAgICAgICAgIHRleHQoXCJcIiArICgnLi8nICsgKGZpbGUucmVsYXRpdmVQYXRoICE9PSBmaWxlLm5hbWUgPyBmaWxlLnJlbGF0aXZlRGlyIDogJycpKSArIFwiXCIpXG4gICAgICAgICAgZWxlbWVudENsb3NlKFwicFwiKVxuICAgICAgICB9XG4gICAgICBlbGVtZW50Q2xvc2UoXCJhXCIpXG4gICAgfSwgZmlsZXMpXG4gIGVsZW1lbnRDbG9zZShcImRpdlwiKVxufVxufSkoKTtcbiIsInZhciBwYWdlID0gcmVxdWlyZSgncGFnZScpXG52YXIgcGF0Y2ggPSByZXF1aXJlKCcuLi9wYXRjaCcpXG52YXIgc3RhdGUgPSByZXF1aXJlKCcuLi9zdGF0ZScpXG52YXIgdmlldyA9IHJlcXVpcmUoJy4vaW5kZXguaHRtbCcpXG52YXIgc2Vzc2lvbnMgPSByZXF1aXJlKCcuLi9zZXNzaW9ucycpXG5cbmZ1bmN0aW9uIGNsb3NlRmlsZSAoZmlsZSkge1xuICB2YXIgc2Vzc2lvbiA9IHNlc3Npb25zLmZpbmQoZmlsZSlcblxuICB2YXIgY2xvc2UgPSBzZXNzaW9uICYmIHNlc3Npb24uaXNEaXJ0eVxuICAgID8gd2luZG93LmNvbmZpcm0oJ1RoZXJlIGFyZSB1bnNhdmVkIGNoYW5nZXMgdG8gdGhpcyBmaWxlLiBBcmUgeW91IHN1cmU/JylcbiAgICA6IHRydWVcblxuICBpZiAoY2xvc2UpIHtcbiAgICAvLyBSZW1vdmUgZnJvbSByZWNlbnQgZmlsZXNcbiAgICBzdGF0ZS5yZWNlbnQuaXRlbXMuc3BsaWNlKHN0YXRlLnJlY2VudC5pdGVtcy5pbmRleE9mKGZpbGUpLCAxKVxuXG4gICAgaWYgKHNlc3Npb24pIHtcbiAgICAgIC8vIFJlbW92ZSBzZXNzaW9uXG4gICAgICBzZXNzaW9ucy5pdGVtcy5zcGxpY2Uoc2Vzc2lvbnMuaXRlbXMuaW5kZXhPZihzZXNzaW9uKSwgMSlcblxuICAgICAgaWYgKHN0YXRlLmN1cnJlbnQgPT09IGZpbGUpIHtcbiAgICAgICAgaWYgKHNlc3Npb25zLml0ZW1zLmxlbmd0aCkge1xuICAgICAgICAgIC8vIE9wZW4gdGhlIGZpcnN0IHNlc3Npb25cbiAgICAgICAgICBwYWdlKCcvZmlsZT9wYXRoPScgKyBzZXNzaW9ucy5pdGVtc1swXS5maWxlLnJlbGF0aXZlUGF0aClcbiAgICAgICAgICAvLyBvcGVuRmlsZShzZXNzaW9ucy5pdGVtc1swXS5maWxlKVxuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlLnJlY2VudC5pdGVtcy5sZW5ndGgpIHtcbiAgICAgICAgICAvLyBPcGVuIHRoZSBuZXh0IGZpbGVcbiAgICAgICAgICAvLyBvcGVuRmlsZShzdGF0ZS5yZWNlbnRbMF0pXG4gICAgICAgICAgcGFnZSgnL2ZpbGU/cGF0aD0nICsgc3RhdGUucmVjZW50Lml0ZW1zWzBdLnJlbGF0aXZlUGF0aClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdGF0ZS5jdXJyZW50ID0gbnVsbFxuICAgICAgICAgIC8vIGVkaXRvci5zZXRTZXNzaW9uKG51bGwpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gUmVjZW50IChlbCkge1xuICBmdW5jdGlvbiBvbkNsaWNrQ2xvc2UgKGZpbGUpIHtcbiAgICBjbG9zZUZpbGUoZmlsZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlciAoKSB7XG4gICAgcGF0Y2goZWwsIHZpZXcsIHN0YXRlLnJlY2VudC5pdGVtcywgc3RhdGUuY3VycmVudCwgb25DbGlja0Nsb3NlKVxuICB9XG5cbiAgc3RhdGUub24oJ2NoYW5nZScsIHJlbmRlcilcblxuICB0aGlzLnJlbmRlciA9IHJlbmRlclxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlY2VudFxuIiwidmFyIHN1cGVybW9kZWxzID0gcmVxdWlyZSgnc3VwZXJtb2RlbHMuanMnKVxudmFyIEZpbGUgPSByZXF1aXJlKCcuL2ZpbGUnKVxudmFyIHByb3AgPSBzdXBlcm1vZGVscy5wcm9wKClcblxubW9kdWxlLmV4cG9ydHMgPSBzdXBlcm1vZGVscyh7XG4gIGZpbGU6IEZpbGUsXG4gIGVkaXRTZXNzaW9uOiBPYmplY3QsXG4gIGNyZWF0ZWQ6IHByb3AoRGF0ZSkudmFsdWUoRGF0ZS5ub3cpLFxuICBtb2RpZmllZDogcHJvcChEYXRlKS52YWx1ZShEYXRlLm5vdyksXG4gIGdldCBpc0NsZWFuICgpIHtcbiAgICByZXR1cm4gdGhpcy5lZGl0U2Vzc2lvbi5nZXRVbmRvTWFuYWdlcigpLmlzQ2xlYW4oKVxuICB9LFxuICBnZXQgaXNEaXJ0eSAoKSB7XG4gICAgcmV0dXJuICF0aGlzLmlzQ2xlYW5cbiAgfVxufSlcbiIsInZhciBzdXBlcm1vZGVscyA9IHJlcXVpcmUoJ3N1cGVybW9kZWxzLmpzJylcbnZhciBjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWcvY2xpZW50JylcbnZhciBtb2RlcyA9IHJlcXVpcmUoJy4vbW9kZXMnKVxudmFyIFNlc3Npb24gPSByZXF1aXJlKCcuL3Nlc3Npb24nKVxudmFyIEVkaXRTZXNzaW9uID0gd2luZG93LmFjZS5yZXF1aXJlKCdhY2UvZWRpdF9zZXNzaW9uJykuRWRpdFNlc3Npb25cbnZhciBVbmRvTWFuYWdlciA9IHdpbmRvdy5hY2UucmVxdWlyZSgnYWNlL3VuZG9tYW5hZ2VyJykuVW5kb01hbmFnZXJcblxudmFyIHNjaGVtYSA9IHtcbiAgaXRlbXM6IFtTZXNzaW9uXSxcbiAgZ2V0IGRpcnR5ICgpIHtcbiAgICByZXR1cm4gdGhpcy5pdGVtcy5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHJldHVybiAhaXRlbS5pc0NsZWFuXG4gICAgfSlcbiAgfSxcbiAgZmluZDogZnVuY3Rpb24gKGZpbGUpIHtcbiAgICByZXR1cm4gdGhpcy5pdGVtcy5maW5kKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5maWxlID09PSBmaWxlXG4gICAgfSlcbiAgfSxcbiAgYWRkOiBmdW5jdGlvbiAoZmlsZSwgY29udGVudHMpIHtcbiAgICB2YXIgZWRpdFNlc3Npb24gPSBuZXcgRWRpdFNlc3Npb24oY29udGVudHMsIG1vZGVzKGZpbGUpKVxuICAgIGVkaXRTZXNzaW9uLnNldE1vZGUobW9kZXMoZmlsZSkpXG4gICAgZWRpdFNlc3Npb24uc2V0VXNlV29ya2VyKGZhbHNlKVxuICAgIGVkaXRTZXNzaW9uLnNldFRhYlNpemUoY29uZmlnLmFjZS50YWJTaXplKVxuICAgIGVkaXRTZXNzaW9uLnNldFVzZVNvZnRUYWJzKGNvbmZpZy5hY2UudXNlU29mdFRhYnMpXG4gICAgZWRpdFNlc3Npb24uc2V0VW5kb01hbmFnZXIobmV3IFVuZG9NYW5hZ2VyKCkpXG5cbiAgICB2YXIgc2Vzc2lvbiA9IG5ldyBTZXNzaW9uKHtcbiAgICAgIGZpbGU6IGZpbGUsXG4gICAgICBlZGl0U2Vzc2lvbjogZWRpdFNlc3Npb25cbiAgICB9KVxuXG4gICAgdGhpcy5pdGVtcy5wdXNoKHNlc3Npb24pXG5cbiAgICByZXR1cm4gc2Vzc2lvblxuICB9XG59XG5cbnZhciBTZXNzaW9ucyA9IHN1cGVybW9kZWxzKHNjaGVtYSlcblxudmFyIHNlc3Npb25zID0gbmV3IFNlc3Npb25zKClcblxubW9kdWxlLmV4cG9ydHMgPSBzZXNzaW9uc1xuIiwidmFyIHcgPSB3aW5kb3dcbnZhciBkID0gZG9jdW1lbnRcblxuZnVuY3Rpb24gc3BsaXR0ZXIgKGhhbmRsZSwgb25FbmRDYWxsYmFjaykge1xuICB2YXIgbGFzdFxuICB2YXIgaG9yaXpvbnRhbCA9IGhhbmRsZS5jbGFzc0xpc3QuY29udGFpbnMoJ2hvcml6b250YWwnKVxuICB2YXIgZWwxID0gaGFuZGxlLnByZXZpb3VzRWxlbWVudFNpYmxpbmdcbiAgdmFyIGVsMiA9IGhhbmRsZS5uZXh0RWxlbWVudFNpYmxpbmdcblxuICBmdW5jdGlvbiBvbkRyYWcgKGUpIHtcbiAgICBpZiAoaG9yaXpvbnRhbCkge1xuICAgICAgdmFyIGhULCBoQlxuICAgICAgdmFyIGhEaWZmID0gZS5jbGllbnRZIC0gbGFzdFxuXG4gICAgICBoVCA9IGQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbDEsICcnKS5nZXRQcm9wZXJ0eVZhbHVlKCdoZWlnaHQnKVxuICAgICAgaEIgPSBkLmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwyLCAnJykuZ2V0UHJvcGVydHlWYWx1ZSgnaGVpZ2h0JylcbiAgICAgIGhUID0gcGFyc2VJbnQoaFQsIDEwKSArIGhEaWZmXG4gICAgICBoQiA9IHBhcnNlSW50KGhCLCAxMCkgLSBoRGlmZlxuICAgICAgZWwxLnN0eWxlLmhlaWdodCA9IGhUICsgJ3B4J1xuICAgICAgZWwyLnN0eWxlLmhlaWdodCA9IGhCICsgJ3B4J1xuICAgICAgbGFzdCA9IGUuY2xpZW50WVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgd0wsIHdSXG4gICAgICB2YXIgd0RpZmYgPSBlLmNsaWVudFggLSBsYXN0XG5cbiAgICAgIHdMID0gZC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGVsMSwgJycpLmdldFByb3BlcnR5VmFsdWUoJ3dpZHRoJylcbiAgICAgIHdSID0gZC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGVsMiwgJycpLmdldFByb3BlcnR5VmFsdWUoJ3dpZHRoJylcbiAgICAgIHdMID0gcGFyc2VJbnQod0wsIDEwKSArIHdEaWZmXG4gICAgICB3UiA9IHBhcnNlSW50KHdSLCAxMCkgLSB3RGlmZlxuICAgICAgZWwxLnN0eWxlLndpZHRoID0gd0wgKyAncHgnXG4gICAgICBlbDIuc3R5bGUud2lkdGggPSB3UiArICdweCdcbiAgICAgIGxhc3QgPSBlLmNsaWVudFhcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBvbkVuZERyYWcgKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICB3LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG9uRHJhZylcbiAgICB3LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBvbkVuZERyYWcpXG4gICAgaWYgKG9uRW5kQ2FsbGJhY2spIHtcbiAgICAgIG9uRW5kQ2FsbGJhY2soKVxuICAgIH1cbiAgICAvLyBub2lkZS5lZGl0b3IucmVzaXplKClcbiAgICAvLyB2YXIgcHJvY2Vzc2VzID0gcmVxdWlyZSgnLi9wcm9jZXNzZXMnKVxuICAgIC8vIHByb2Nlc3Nlcy5lZGl0b3IucmVzaXplKClcbiAgfVxuXG4gIGhhbmRsZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgbGFzdCA9IGhvcml6b250YWwgPyBlLmNsaWVudFkgOiBlLmNsaWVudFhcblxuICAgIHcuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgb25EcmFnKVxuICAgIHcuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIG9uRW5kRHJhZylcbiAgfSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzcGxpdHRlclxuIiwidmFyIHN1cGVybW9kZWxzID0gcmVxdWlyZSgnc3VwZXJtb2RlbHMuanMnKVxudmFyIEZpbGUgPSByZXF1aXJlKCcuL2ZpbGUnKVxudmFyIEZpbGVzID0gcmVxdWlyZSgnLi9maWxlcycpXG52YXIgc3RvcmFnZUtleSA9ICdub2lkZSdcblxuZnVuY3Rpb24gc2F2ZVN0YXRlIChmaWxlcykge1xuICB2YXIgc3RvcmFnZSA9IHtcbiAgICByZWNlbnQ6IHRoaXMucmVjZW50Lml0ZW1zLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0ucGF0aFxuICAgIH0pLFxuICAgIGV4cGFuZGVkOiBmaWxlcy5pdGVtcy5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHJldHVybiBpdGVtLmV4cGFuZGVkXG4gICAgfSkubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5wYXRoXG4gICAgfSlcbiAgfVxuICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oc3RvcmFnZUtleSwgSlNPTi5zdHJpbmdpZnkoc3RvcmFnZSkpXG59XG5cbmZ1bmN0aW9uIGxvYWRTdGF0ZSAoZmlsZXMpIHtcbiAgdmFyIHN0b3JhZ2UgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oc3RvcmFnZUtleSlcbiAgc3RvcmFnZSA9IHN0b3JhZ2UgPyBKU09OLnBhcnNlKHN0b3JhZ2UpIDoge31cblxuICB2YXIgZGlyLCBmaWxlLCBpXG4gIHRoaXMucmVjZW50ID0gbmV3IEZpbGVzKClcblxuICBpZiAoc3RvcmFnZS5yZWNlbnQpIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgc3RvcmFnZS5yZWNlbnQubGVuZ3RoOyBpKyspIHtcbiAgICAgIGZpbGUgPSBmaWxlcy5maW5kQnlQYXRoKHN0b3JhZ2UucmVjZW50W2ldKVxuICAgICAgaWYgKGZpbGUpIHtcbiAgICAgICAgdGhpcy5yZWNlbnQuaXRlbXMucHVzaChmaWxlKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChzdG9yYWdlLmV4cGFuZGVkKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IHN0b3JhZ2UuZXhwYW5kZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgIGRpciA9IGZpbGVzLmZpbmRCeVBhdGgoc3RvcmFnZS5leHBhbmRlZFtpXSlcbiAgICAgIGlmIChkaXIpIHtcbiAgICAgICAgZGlyLmV4cGFuZGVkID0gdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG52YXIgc2NoZW1hID0ge1xuICByZWNlbnQ6IEZpbGVzLFxuICBjdXJyZW50OiBGaWxlLFxuICBzYXZlOiBzYXZlU3RhdGUsXG4gIGxvYWQ6IGxvYWRTdGF0ZVxufVxuXG52YXIgU3RhdGUgPSBzdXBlcm1vZGVscyhzY2hlbWEpXG5cbnZhciBzdGF0ZSA9IG5ldyBTdGF0ZSgpXG5cbm1vZHVsZS5leHBvcnRzID0gc3RhdGVcbiIsInZhciBwYXRjaCA9IHJlcXVpcmUoJy4uL3BhdGNoJylcbnZhciB2aWV3ID0gcmVxdWlyZSgnLi92aWV3Lmh0bWwnKVxuXG5mdW5jdGlvbiBtYWtlVHJlZSAoZmlsZXMpIHtcbiAgZnVuY3Rpb24gdHJlZWlmeSAobGlzdCwgaWRBdHRyLCBwYXJlbnRBdHRyLCBjaGlsZHJlbkF0dHIpIHtcbiAgICB2YXIgdHJlZUxpc3QgPSBbXVxuICAgIHZhciBsb29rdXAgPSB7fVxuICAgIHZhciBpLCBvYmpcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmogPSBsaXN0W2ldXG4gICAgICBsb29rdXBbb2JqW2lkQXR0cl1dID0gb2JqXG4gICAgICBvYmpbY2hpbGRyZW5BdHRyXSA9IFtdXG4gICAgfVxuXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iaiA9IGxpc3RbaV1cbiAgICAgIHZhciBwYXJlbnQgPSBsb29rdXBbb2JqW3BhcmVudEF0dHJdXVxuICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICBvYmoucGFyZW50ID0gcGFyZW50XG4gICAgICAgIGxvb2t1cFtvYmpbcGFyZW50QXR0cl1dW2NoaWxkcmVuQXR0cl0ucHVzaChvYmopXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cmVlTGlzdC5wdXNoKG9iailcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJlZUxpc3RcbiAgfVxuICByZXR1cm4gdHJlZWlmeShmaWxlcy5pdGVtcywgJ3BhdGgnLCAnZGlyJywgJ2NoaWxkcmVuJylcbn1cblxuZnVuY3Rpb24gVHJlZSAoZWwsIGZpbGVzLCBzdGF0ZSkge1xuICBmdW5jdGlvbiBvbkNsaWNrIChmaWxlKSB7XG4gICAgaWYgKGZpbGUuaXNEaXJlY3RvcnkpIHtcbiAgICAgIGZpbGUuZXhwYW5kZWQgPSAhZmlsZS5leHBhbmRlZFxuICAgICAgcmVuZGVyKClcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXIgKCkge1xuICAgIHBhdGNoKGVsLCB2aWV3LCBtYWtlVHJlZShmaWxlcyksIHRydWUsIHN0YXRlLmN1cnJlbnQsIG9uQ2xpY2spXG4gIH1cblxuICBmaWxlcy5vbignY2hhbmdlJywgcmVuZGVyKVxuICBzdGF0ZS5vbignY2hhbmdlOmN1cnJlbnQnLCByZW5kZXIpXG5cbiAgdGhpcy5yZW5kZXIgPSByZW5kZXJcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBUcmVlXG4iLCJ2YXIgSW5jcmVtZW50YWxET00gPSByZXF1aXJlKCdpbmNyZW1lbnRhbC1kb20nKVxudmFyIHBhdGNoID0gSW5jcmVtZW50YWxET00ucGF0Y2hcbnZhciBlbGVtZW50T3BlbiA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRPcGVuXG52YXIgZWxlbWVudFZvaWQgPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50Vm9pZFxudmFyIGVsZW1lbnRDbG9zZSA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRDbG9zZVxudmFyIGVsZW1lbnRQbGFjZWhvbGRlciA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRQbGFjZWhvbGRlclxudmFyIHRleHQgPSBJbmNyZW1lbnRhbERPTS50ZXh0XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcbnZhciBob2lzdGVkMSA9IFtcImNsYXNzXCIsIFwibmFtZSBpY29uIGljb24tZmlsZS10ZXh0XCJdXG52YXIgaG9pc3RlZDIgPSBbXCJjbGFzc1wiLCBcImZpbGUtbmFtZVwiXVxudmFyIGhvaXN0ZWQzID0gW1wiY2xhc3NcIiwgXCJleHBhbmRlZFwiXVxudmFyIGhvaXN0ZWQ0ID0gW1wiY2xhc3NcIiwgXCJjb2xsYXBzZWRcIl1cbnZhciBob2lzdGVkNSA9IFtcImNsYXNzXCIsIFwibmFtZSBpY29uIGljb24tZmlsZS1kaXJlY3RvcnlcIl1cbnZhciBob2lzdGVkNiA9IFtcImNsYXNzXCIsIFwiZGlyLW5hbWVcIl1cbnZhciBob2lzdGVkNyA9IFtcImNsYXNzXCIsIFwidHJpYW5nbGUtbGVmdFwiXVxuXG5yZXR1cm4gZnVuY3Rpb24gdHJlZSAoZGF0YSwgaXNSb290LCBjdXJyZW50LCBvbkNsaWNrKSB7XG4gIGVsZW1lbnRPcGVuKFwidWxcIiwgbnVsbCwgbnVsbCwgXCJjbGFzc1wiLCBpc1Jvb3QgPyAndHJlZScgOiAnJylcbiAgICA7KEFycmF5LmlzQXJyYXkoZGF0YSkgPyBkYXRhIDogT2JqZWN0LmtleXMoZGF0YSkpLmZvckVhY2goZnVuY3Rpb24oZnNvLCAkaW5kZXgpIHtcbiAgICAgIGVsZW1lbnRPcGVuKFwibGlcIiwgZnNvLnBhdGgsIG51bGwsIFwiY2xhc3NcIiwgZnNvLmlzRGlyZWN0b3J5ID8gJ2RpcicgOiAnZmlsZScgKyAoZnNvID09PSBjdXJyZW50ID8gJyBzZWxlY3RlZCcgOiAnJykpXG4gICAgICAgIGlmIChmc28uaXNGaWxlKSB7XG4gICAgICAgICAgZWxlbWVudE9wZW4oXCJhXCIsIG51bGwsIG51bGwsIFwiaHJlZlwiLCAnL2ZpbGU/cGF0aD0nICsgZnNvLnJlbGF0aXZlUGF0aClcbiAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwic3BhblwiLCBudWxsLCBob2lzdGVkMSwgXCJkYXRhLW5hbWVcIiwgZnNvLm5hbWUsIFwiZGF0YS1wYXRoXCIsIGZzby5yZWxhdGl2ZVBhdGgpXG4gICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJzcGFuXCIpXG4gICAgICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgaG9pc3RlZDIpXG4gICAgICAgICAgICAgIHRleHQoXCJcIiArIChmc28ubmFtZSkgKyBcIlwiKVxuICAgICAgICAgICAgZWxlbWVudENsb3NlKFwic3BhblwiKVxuICAgICAgICAgIGVsZW1lbnRDbG9zZShcImFcIilcbiAgICAgICAgfVxuICAgICAgICBpZiAoZnNvLmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgZWxlbWVudE9wZW4oXCJhXCIsIG51bGwsIG51bGwsIFwib25jbGlja1wiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICAgICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgICAgICAgb25DbGljayhmc28pfSlcbiAgICAgICAgICAgIGlmIChmc28uZXhwYW5kZWQpIHtcbiAgICAgICAgICAgICAgZWxlbWVudE9wZW4oXCJzbWFsbFwiLCBudWxsLCBob2lzdGVkMylcbiAgICAgICAgICAgICAgICB0ZXh0KFwi4pa8XCIpXG4gICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNtYWxsXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWZzby5leHBhbmRlZCkge1xuICAgICAgICAgICAgICBlbGVtZW50T3BlbihcInNtYWxsXCIsIG51bGwsIGhvaXN0ZWQ0KVxuICAgICAgICAgICAgICAgIHRleHQoXCLilrZcIilcbiAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwic21hbGxcIilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwic3BhblwiLCBudWxsLCBob2lzdGVkNSwgXCJkYXRhLW5hbWVcIiwgZnNvLm5hbWUsIFwiZGF0YS1wYXRoXCIsIGZzby5yZWxhdGl2ZVBhdGgpXG4gICAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJzcGFuXCIpXG4gICAgICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgaG9pc3RlZDYpXG4gICAgICAgICAgICAgIHRleHQoXCJcIiArIChmc28ubmFtZSkgKyBcIlwiKVxuICAgICAgICAgICAgZWxlbWVudENsb3NlKFwic3BhblwiKVxuICAgICAgICAgIGVsZW1lbnRDbG9zZShcImFcIilcbiAgICAgICAgfVxuICAgICAgICBpZiAoZnNvLmlzRmlsZSAmJiBmc28gPT09IGN1cnJlbnQpIHtcbiAgICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgaG9pc3RlZDcpXG4gICAgICAgICAgZWxlbWVudENsb3NlKFwic3BhblwiKVxuICAgICAgICB9XG4gICAgICAgIGlmIChmc28uaXNEaXJlY3RvcnkgJiYgZnNvLmV4cGFuZGVkKSB7XG4gICAgICAgICAgZnNvLmNoaWxkcmVuLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYS5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChiLmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS5uYW1lLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICA8IGIubmFtZS50b0xvd2VyQ2FzZSgpID8gLTEgOiAxXG4gICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAtMVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoYi5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDFcbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEubmFtZS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgPCBiLm5hbWUudG9Mb3dlckNhc2UoKSA/IC0xIDogMVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgLy8gdmFyIHZpZXdNb2RlbCA9IHtcbiAgICAgICAgICAgICAgICAgIC8vICAgaXNSb290OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgIC8vICAgdHJlZTogZnNvLmNoaWxkcmVuLFxuICAgICAgICAgICAgICAgICAgLy8gICBjdXJyZW50OiBkYXRhLmN1cnJlbnQsXG4gICAgICAgICAgICAgICAgICAvLyAgIHZpZXc6IGRhdGEudmlldyxcbiAgICAgICAgICAgICAgICAgIC8vICAgb25DbGljazogZGF0YS5vbkNsaWNrXG4gICAgICAgICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgICAgICAgIHRyZWUoZnNvLmNoaWxkcmVuLCBmYWxzZSwgY3VycmVudCwgb25DbGljaylcbiAgICAgICAgfVxuICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICB9LCBkYXRhKVxuICBlbGVtZW50Q2xvc2UoXCJ1bFwiKVxufVxufSkoKTtcbiIsImZ1bmN0aW9uIGhhbmRsZUVycm9yIChlcnIpIHtcbiAgY29uc29sZS5lcnJvcihlcnIpXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBoYW5kbGVFcnJvcjogaGFuZGxlRXJyb3Jcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBhY2U6IHtcbiAgICB0YWJTaXplOiAyLFxuICAgIGZvbnRTaXplOiAxNCxcbiAgICB0aGVtZTogJ21vbm9rYWknLFxuICAgIHVzZVNvZnRUYWJzOiB0cnVlXG4gIH1cbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gSWYgb2JqLmhhc093blByb3BlcnR5IGhhcyBiZWVuIG92ZXJyaWRkZW4sIHRoZW4gY2FsbGluZ1xuLy8gb2JqLmhhc093blByb3BlcnR5KHByb3ApIHdpbGwgYnJlYWsuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9qb3llbnQvbm9kZS9pc3N1ZXMvMTcwN1xuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihxcywgc2VwLCBlcSwgb3B0aW9ucykge1xuICBzZXAgPSBzZXAgfHwgJyYnO1xuICBlcSA9IGVxIHx8ICc9JztcbiAgdmFyIG9iaiA9IHt9O1xuXG4gIGlmICh0eXBlb2YgcXMgIT09ICdzdHJpbmcnIHx8IHFzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBvYmo7XG4gIH1cblxuICB2YXIgcmVnZXhwID0gL1xcKy9nO1xuICBxcyA9IHFzLnNwbGl0KHNlcCk7XG5cbiAgdmFyIG1heEtleXMgPSAxMDAwO1xuICBpZiAob3B0aW9ucyAmJiB0eXBlb2Ygb3B0aW9ucy5tYXhLZXlzID09PSAnbnVtYmVyJykge1xuICAgIG1heEtleXMgPSBvcHRpb25zLm1heEtleXM7XG4gIH1cblxuICB2YXIgbGVuID0gcXMubGVuZ3RoO1xuICAvLyBtYXhLZXlzIDw9IDAgbWVhbnMgdGhhdCB3ZSBzaG91bGQgbm90IGxpbWl0IGtleXMgY291bnRcbiAgaWYgKG1heEtleXMgPiAwICYmIGxlbiA+IG1heEtleXMpIHtcbiAgICBsZW4gPSBtYXhLZXlzO1xuICB9XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgIHZhciB4ID0gcXNbaV0ucmVwbGFjZShyZWdleHAsICclMjAnKSxcbiAgICAgICAgaWR4ID0geC5pbmRleE9mKGVxKSxcbiAgICAgICAga3N0ciwgdnN0ciwgaywgdjtcblxuICAgIGlmIChpZHggPj0gMCkge1xuICAgICAga3N0ciA9IHguc3Vic3RyKDAsIGlkeCk7XG4gICAgICB2c3RyID0geC5zdWJzdHIoaWR4ICsgMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtzdHIgPSB4O1xuICAgICAgdnN0ciA9ICcnO1xuICAgIH1cblxuICAgIGsgPSBkZWNvZGVVUklDb21wb25lbnQoa3N0cik7XG4gICAgdiA9IGRlY29kZVVSSUNvbXBvbmVudCh2c3RyKTtcblxuICAgIGlmICghaGFzT3duUHJvcGVydHkob2JqLCBrKSkge1xuICAgICAgb2JqW2tdID0gdjtcbiAgICB9IGVsc2UgaWYgKGlzQXJyYXkob2JqW2tdKSkge1xuICAgICAgb2JqW2tdLnB1c2godik7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9ialtrXSA9IFtvYmpba10sIHZdO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvYmo7XG59O1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHhzKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeHMpID09PSAnW29iamVjdCBBcnJheV0nO1xufTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBzdHJpbmdpZnlQcmltaXRpdmUgPSBmdW5jdGlvbih2KSB7XG4gIHN3aXRjaCAodHlwZW9mIHYpIHtcbiAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgcmV0dXJuIHY7XG5cbiAgICBjYXNlICdib29sZWFuJzpcbiAgICAgIHJldHVybiB2ID8gJ3RydWUnIDogJ2ZhbHNlJztcblxuICAgIGNhc2UgJ251bWJlcic6XG4gICAgICByZXR1cm4gaXNGaW5pdGUodikgPyB2IDogJyc7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuICcnO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaiwgc2VwLCBlcSwgbmFtZSkge1xuICBzZXAgPSBzZXAgfHwgJyYnO1xuICBlcSA9IGVxIHx8ICc9JztcbiAgaWYgKG9iaiA9PT0gbnVsbCkge1xuICAgIG9iaiA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBtYXAob2JqZWN0S2V5cyhvYmopLCBmdW5jdGlvbihrKSB7XG4gICAgICB2YXIga3MgPSBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKGspKSArIGVxO1xuICAgICAgaWYgKGlzQXJyYXkob2JqW2tdKSkge1xuICAgICAgICByZXR1cm4gbWFwKG9ialtrXSwgZnVuY3Rpb24odikge1xuICAgICAgICAgIHJldHVybiBrcyArIGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUodikpO1xuICAgICAgICB9KS5qb2luKHNlcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ga3MgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKG9ialtrXSkpO1xuICAgICAgfVxuICAgIH0pLmpvaW4oc2VwKTtcblxuICB9XG5cbiAgaWYgKCFuYW1lKSByZXR1cm4gJyc7XG4gIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKG5hbWUpKSArIGVxICtcbiAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUob2JqKSk7XG59O1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHhzKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeHMpID09PSAnW29iamVjdCBBcnJheV0nO1xufTtcblxuZnVuY3Rpb24gbWFwICh4cywgZikge1xuICBpZiAoeHMubWFwKSByZXR1cm4geHMubWFwKGYpO1xuICB2YXIgcmVzID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICByZXMucHVzaChmKHhzW2ldLCBpKSk7XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciByZXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSByZXMucHVzaChrZXkpO1xuICB9XG4gIHJldHVybiByZXM7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLmRlY29kZSA9IGV4cG9ydHMucGFyc2UgPSByZXF1aXJlKCcuL2RlY29kZScpO1xuZXhwb3J0cy5lbmNvZGUgPSBleHBvcnRzLnN0cmluZ2lmeSA9IHJlcXVpcmUoJy4vZW5jb2RlJyk7XG4iLCJcbi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAgKiBLZWVwcyB0cmFjayB3aGV0aGVyIG9yIG5vdCB3ZSBhcmUgaW4gYW4gYXR0cmlidXRlcyBkZWNsYXJhdGlvbiAoYWZ0ZXJcbiAgKiBlbGVtZW50T3BlblN0YXJ0LCBidXQgYmVmb3JlIGVsZW1lbnRPcGVuRW5kKS5cbiAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgKi9cbnZhciBpbkF0dHJpYnV0ZXMgPSBmYWxzZTtcblxuLyoqXG4gICogS2VlcHMgdHJhY2sgd2hldGhlciBvciBub3Qgd2UgYXJlIGluIGFuIGVsZW1lbnQgdGhhdCBzaG91bGQgbm90IGhhdmUgaXRzXG4gICogY2hpbGRyZW4gY2xlYXJlZC5cbiAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgKi9cbnZhciBpblNraXAgPSBmYWxzZTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoYXQgdGhlcmUgaXMgYSBjdXJyZW50IHBhdGNoIGNvbnRleHQuXG4gKiBAcGFyYW0geyp9IGNvbnRleHRcbiAqL1xudmFyIGFzc2VydEluUGF0Y2ggPSBmdW5jdGlvbiAoY29udGV4dCkge1xuICBpZiAoIWNvbnRleHQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjYWxsIGN1cnJlbnRFbGVtZW50KCkgdW5sZXNzIGluIHBhdGNoJyk7XG4gIH1cbn07XG5cbi8qKlxuKiBNYWtlcyBzdXJlIHRoYXQga2V5ZWQgRWxlbWVudCBtYXRjaGVzIHRoZSB0YWcgbmFtZSBwcm92aWRlZC5cbiogQHBhcmFtIHshc3RyaW5nfSBub2RlTmFtZSBUaGUgbm9kZU5hbWUgb2YgdGhlIG5vZGUgdGhhdCBpcyBiZWluZyBtYXRjaGVkLlxuKiBAcGFyYW0ge3N0cmluZz19IHRhZyBUaGUgdGFnIG5hbWUgb2YgdGhlIEVsZW1lbnQuXG4qIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IG9mIHRoZSBFbGVtZW50LlxuKi9cbnZhciBhc3NlcnRLZXllZFRhZ01hdGNoZXMgPSBmdW5jdGlvbiAobm9kZU5hbWUsIHRhZywga2V5KSB7XG4gIGlmIChub2RlTmFtZSAhPT0gdGFnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdXYXMgZXhwZWN0aW5nIG5vZGUgd2l0aCBrZXkgXCInICsga2V5ICsgJ1wiIHRvIGJlIGEgJyArIHRhZyArICcsIG5vdCBhICcgKyBub2RlTmFtZSArICcuJyk7XG4gIH1cbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGF0IGEgcGF0Y2ggY2xvc2VzIGV2ZXJ5IG5vZGUgdGhhdCBpdCBvcGVuZWQuXG4gKiBAcGFyYW0gez9Ob2RlfSBvcGVuRWxlbWVudFxuICogQHBhcmFtIHshTm9kZXwhRG9jdW1lbnRGcmFnbWVudH0gcm9vdFxuICovXG52YXIgYXNzZXJ0Tm9VbmNsb3NlZFRhZ3MgPSBmdW5jdGlvbiAob3BlbkVsZW1lbnQsIHJvb3QpIHtcbiAgaWYgKG9wZW5FbGVtZW50ID09PSByb290KSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGN1cnJlbnRFbGVtZW50ID0gb3BlbkVsZW1lbnQ7XG4gIHZhciBvcGVuVGFncyA9IFtdO1xuICB3aGlsZSAoY3VycmVudEVsZW1lbnQgJiYgY3VycmVudEVsZW1lbnQgIT09IHJvb3QpIHtcbiAgICBvcGVuVGFncy5wdXNoKGN1cnJlbnRFbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpO1xuICAgIGN1cnJlbnRFbGVtZW50ID0gY3VycmVudEVsZW1lbnQucGFyZW50Tm9kZTtcbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcignT25lIG9yIG1vcmUgdGFncyB3ZXJlIG5vdCBjbG9zZWQ6XFxuJyArIG9wZW5UYWdzLmpvaW4oJ1xcbicpKTtcbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGF0IHRoZSBjYWxsZXIgaXMgbm90IHdoZXJlIGF0dHJpYnV0ZXMgYXJlIGV4cGVjdGVkLlxuICogQHBhcmFtIHtzdHJpbmd9IGZ1bmN0aW9uTmFtZVxuICovXG52YXIgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzID0gZnVuY3Rpb24gKGZ1bmN0aW9uTmFtZSkge1xuICBpZiAoaW5BdHRyaWJ1dGVzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGZ1bmN0aW9uTmFtZSArICcoKSBtYXkgbm90IGJlIGNhbGxlZCBiZXR3ZWVuICcgKyAnZWxlbWVudE9wZW5TdGFydCgpIGFuZCBlbGVtZW50T3BlbkVuZCgpLicpO1xuICB9XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCB0aGUgY2FsbGVyIGlzIG5vdCBpbnNpZGUgYW4gZWxlbWVudCB0aGF0IGhhcyBkZWNsYXJlZCBza2lwLlxuICogQHBhcmFtIHtzdHJpbmd9IGZ1bmN0aW9uTmFtZVxuICovXG52YXIgYXNzZXJ0Tm90SW5Ta2lwID0gZnVuY3Rpb24gKGZ1bmN0aW9uTmFtZSkge1xuICBpZiAoaW5Ta2lwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGZ1bmN0aW9uTmFtZSArICcoKSBtYXkgbm90IGJlIGNhbGxlZCBpbnNpZGUgYW4gZWxlbWVudCAnICsgJ3RoYXQgaGFzIGNhbGxlZCBza2lwKCkuJyk7XG4gIH1cbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGF0IHRoZSBjYWxsZXIgaXMgd2hlcmUgYXR0cmlidXRlcyBhcmUgZXhwZWN0ZWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gZnVuY3Rpb25OYW1lXG4gKi9cbnZhciBhc3NlcnRJbkF0dHJpYnV0ZXMgPSBmdW5jdGlvbiAoZnVuY3Rpb25OYW1lKSB7XG4gIGlmICghaW5BdHRyaWJ1dGVzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGZ1bmN0aW9uTmFtZSArICcoKSBtdXN0IGJlIGNhbGxlZCBhZnRlciAnICsgJ2VsZW1lbnRPcGVuU3RhcnQoKS4nKTtcbiAgfVxufTtcblxuLyoqXG4gKiBNYWtlcyBzdXJlIHRoZSBwYXRjaCBjbG9zZXMgdmlydHVhbCBhdHRyaWJ1dGVzIGNhbGxcbiAqL1xudmFyIGFzc2VydFZpcnR1YWxBdHRyaWJ1dGVzQ2xvc2VkID0gZnVuY3Rpb24gKCkge1xuICBpZiAoaW5BdHRyaWJ1dGVzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdlbGVtZW50T3BlbkVuZCgpIG11c3QgYmUgY2FsbGVkIGFmdGVyIGNhbGxpbmcgJyArICdlbGVtZW50T3BlblN0YXJ0KCkuJyk7XG4gIH1cbn07XG5cbi8qKlxuICAqIE1ha2VzIHN1cmUgdGhhdCBwbGFjZWhvbGRlcnMgaGF2ZSBhIGtleSBzcGVjaWZpZWQuIE90aGVyd2lzZSwgY29uZGl0aW9uYWxcbiAgKiBwbGFjZWhvbGRlcnMgYW5kIGNvbmRpdGlvbmFsIGVsZW1lbnRzIG5leHQgdG8gcGxhY2Vob2xkZXJzIHdpbGwgY2F1c2VcbiAgKiBwbGFjZWhvbGRlciBlbGVtZW50cyB0byBiZSByZS11c2VkIGFzIG5vbi1wbGFjZWhvbGRlcnMgYW5kIHZpY2UgdmVyc2EuXG4gICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICAqL1xudmFyIGFzc2VydFBsYWNlaG9sZGVyS2V5U3BlY2lmaWVkID0gZnVuY3Rpb24gKGtleSkge1xuICBpZiAoIWtleSkge1xuICAgIHRocm93IG5ldyBFcnJvcignUGxhY2Vob2xkZXIgZWxlbWVudHMgbXVzdCBoYXZlIGEga2V5IHNwZWNpZmllZC4nKTtcbiAgfVxufTtcblxuLyoqXG4gICogTWFrZXMgc3VyZSB0aGF0IHRhZ3MgYXJlIGNvcnJlY3RseSBuZXN0ZWQuXG4gICogQHBhcmFtIHtzdHJpbmd9IG5vZGVOYW1lXG4gICogQHBhcmFtIHtzdHJpbmd9IHRhZ1xuICAqL1xudmFyIGFzc2VydENsb3NlTWF0Y2hlc09wZW5UYWcgPSBmdW5jdGlvbiAobm9kZU5hbWUsIHRhZykge1xuICBpZiAobm9kZU5hbWUgIT09IHRhZykge1xuICAgIHRocm93IG5ldyBFcnJvcignUmVjZWl2ZWQgYSBjYWxsIHRvIGNsb3NlICcgKyB0YWcgKyAnIGJ1dCAnICsgbm9kZU5hbWUgKyAnIHdhcyBvcGVuLicpO1xuICB9XG59O1xuXG4vKipcbiAqIE1ha2VzIHN1cmUgdGhhdCBubyBjaGlsZHJlbiBlbGVtZW50cyBoYXZlIGJlZW4gZGVjbGFyZWQgeWV0IGluIHRoZSBjdXJyZW50XG4gKiBlbGVtZW50LlxuICogQHBhcmFtIHtzdHJpbmd9IGZ1bmN0aW9uTmFtZVxuICogQHBhcmFtIHs/Tm9kZX0gcHJldmlvdXNOb2RlXG4gKi9cbnZhciBhc3NlcnROb0NoaWxkcmVuRGVjbGFyZWRZZXQgPSBmdW5jdGlvbiAoZnVuY3Rpb25OYW1lLCBwcmV2aW91c05vZGUpIHtcbiAgaWYgKHByZXZpb3VzTm9kZSAhPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihmdW5jdGlvbk5hbWUgKyAnKCkgbXVzdCBjb21lIGJlZm9yZSBhbnkgY2hpbGQgJyArICdkZWNsYXJhdGlvbnMgaW5zaWRlIHRoZSBjdXJyZW50IGVsZW1lbnQuJyk7XG4gIH1cbn07XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgc3RhdGUgb2YgYmVpbmcgaW4gYW4gYXR0cmlidXRlIGRlY2xhcmF0aW9uLlxuICogQHBhcmFtIHtib29sZWFufSB2YWx1ZVxuICogQHJldHVybiB7Ym9vbGVhbn0gdGhlIHByZXZpb3VzIHZhbHVlLlxuICovXG52YXIgc2V0SW5BdHRyaWJ1dGVzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHZhciBwcmV2aW91cyA9IGluQXR0cmlidXRlcztcbiAgaW5BdHRyaWJ1dGVzID0gdmFsdWU7XG4gIHJldHVybiBwcmV2aW91cztcbn07XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgc3RhdGUgb2YgYmVpbmcgaW4gYSBza2lwIGVsZW1lbnQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHZhbHVlXG4gKiBAcmV0dXJuIHtib29sZWFufSB0aGUgcHJldmlvdXMgdmFsdWUuXG4gKi9cbnZhciBzZXRJblNraXAgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgdmFyIHByZXZpb3VzID0gaW5Ta2lwO1xuICBpblNraXAgPSB2YWx1ZTtcbiAgcmV0dXJuIHByZXZpb3VzO1xufTtcblxuLyoqXG4gKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKiogKi9cbmV4cG9ydHMubm90aWZpY2F0aW9ucyA9IHtcbiAgLyoqXG4gICAqIENhbGxlZCBhZnRlciBwYXRjaCBoYXMgY29tcGxlYXRlZCB3aXRoIGFueSBOb2RlcyB0aGF0IGhhdmUgYmVlbiBjcmVhdGVkXG4gICAqIGFuZCBhZGRlZCB0byB0aGUgRE9NLlxuICAgKiBAdHlwZSB7P2Z1bmN0aW9uKEFycmF5PCFOb2RlPil9XG4gICAqL1xuICBub2Rlc0NyZWF0ZWQ6IG51bGwsXG5cbiAgLyoqXG4gICAqIENhbGxlZCBhZnRlciBwYXRjaCBoYXMgY29tcGxlYXRlZCB3aXRoIGFueSBOb2RlcyB0aGF0IGhhdmUgYmVlbiByZW1vdmVkXG4gICAqIGZyb20gdGhlIERPTS5cbiAgICogTm90ZSBpdCdzIGFuIGFwcGxpY2F0aW9ucyByZXNwb25zaWJpbGl0eSB0byBoYW5kbGUgYW55IGNoaWxkTm9kZXMuXG4gICAqIEB0eXBlIHs/ZnVuY3Rpb24oQXJyYXk8IU5vZGU+KX1cbiAgICovXG4gIG5vZGVzRGVsZXRlZDogbnVsbFxufTtcblxuLyoqXG4gKiBLZWVwcyB0cmFjayBvZiB0aGUgc3RhdGUgb2YgYSBwYXRjaC5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBDb250ZXh0KCkge1xuICAvKipcbiAgICogQHR5cGUgeyhBcnJheTwhTm9kZT58dW5kZWZpbmVkKX1cbiAgICovXG4gIHRoaXMuY3JlYXRlZCA9IGV4cG9ydHMubm90aWZpY2F0aW9ucy5ub2Rlc0NyZWF0ZWQgJiYgW107XG5cbiAgLyoqXG4gICAqIEB0eXBlIHsoQXJyYXk8IU5vZGU+fHVuZGVmaW5lZCl9XG4gICAqL1xuICB0aGlzLmRlbGV0ZWQgPSBleHBvcnRzLm5vdGlmaWNhdGlvbnMubm9kZXNEZWxldGVkICYmIFtdO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAqL1xuQ29udGV4dC5wcm90b3R5cGUubWFya0NyZWF0ZWQgPSBmdW5jdGlvbiAobm9kZSkge1xuICBpZiAodGhpcy5jcmVhdGVkKSB7XG4gICAgdGhpcy5jcmVhdGVkLnB1c2gobm9kZSk7XG4gIH1cbn07XG5cbi8qKlxuICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICovXG5Db250ZXh0LnByb3RvdHlwZS5tYXJrRGVsZXRlZCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gIGlmICh0aGlzLmRlbGV0ZWQpIHtcbiAgICB0aGlzLmRlbGV0ZWQucHVzaChub2RlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBOb3RpZmllcyBhYm91dCBub2RlcyB0aGF0IHdlcmUgY3JlYXRlZCBkdXJpbmcgdGhlIHBhdGNoIG9wZWFyYXRpb24uXG4gKi9cbkNvbnRleHQucHJvdG90eXBlLm5vdGlmeUNoYW5nZXMgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLmNyZWF0ZWQgJiYgdGhpcy5jcmVhdGVkLmxlbmd0aCA+IDApIHtcbiAgICBleHBvcnRzLm5vdGlmaWNhdGlvbnMubm9kZXNDcmVhdGVkKHRoaXMuY3JlYXRlZCk7XG4gIH1cblxuICBpZiAodGhpcy5kZWxldGVkICYmIHRoaXMuZGVsZXRlZC5sZW5ndGggPiAwKSB7XG4gICAgZXhwb3J0cy5ub3RpZmljYXRpb25zLm5vZGVzRGVsZXRlZCh0aGlzLmRlbGV0ZWQpO1xuICB9XG59O1xuXG4vKipcbiAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuICogQSBjYWNoZWQgcmVmZXJlbmNlIHRvIHRoZSBoYXNPd25Qcm9wZXJ0eSBmdW5jdGlvbi5cbiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBBIGNhY2hlZCByZWZlcmVuY2UgdG8gdGhlIGNyZWF0ZSBmdW5jdGlvbi5cbiAqL1xudmFyIGNyZWF0ZSA9IE9iamVjdC5jcmVhdGU7XG5cbi8qKlxuICogVXNlZCB0byBwcmV2ZW50IHByb3BlcnR5IGNvbGxpc2lvbnMgYmV0d2VlbiBvdXIgXCJtYXBcIiBhbmQgaXRzIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7IU9iamVjdDxzdHJpbmcsICo+fSBtYXAgVGhlIG1hcCB0byBjaGVjay5cbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eSBUaGUgcHJvcGVydHkgdG8gY2hlY2suXG4gKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIG1hcCBoYXMgcHJvcGVydHkuXG4gKi9cbnZhciBoYXMgPSBmdW5jdGlvbiAobWFwLCBwcm9wZXJ0eSkge1xuICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChtYXAsIHByb3BlcnR5KTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBtYXAgb2JqZWN0IHdpdGhvdXQgYSBwcm90b3R5cGUuXG4gKiBAcmV0dXJuIHshT2JqZWN0fVxuICovXG52YXIgY3JlYXRlTWFwID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gY3JlYXRlKG51bGwpO1xufTtcblxuLyoqXG4gKiBLZWVwcyB0cmFjayBvZiBpbmZvcm1hdGlvbiBuZWVkZWQgdG8gcGVyZm9ybSBkaWZmcyBmb3IgYSBnaXZlbiBET00gbm9kZS5cbiAqIEBwYXJhbSB7IXN0cmluZ30gbm9kZU5hbWVcbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIE5vZGVEYXRhKG5vZGVOYW1lLCBrZXkpIHtcbiAgLyoqXG4gICAqIFRoZSBhdHRyaWJ1dGVzIGFuZCB0aGVpciB2YWx1ZXMuXG4gICAqIEBjb25zdCB7IU9iamVjdDxzdHJpbmcsICo+fVxuICAgKi9cbiAgdGhpcy5hdHRycyA9IGNyZWF0ZU1hcCgpO1xuXG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycywgdXNlZCBmb3IgcXVpY2tseSBkaWZmaW5nIHRoZVxuICAgKiBpbmNvbW1pbmcgYXR0cmlidXRlcyB0byBzZWUgaWYgdGhlIERPTSBub2RlJ3MgYXR0cmlidXRlcyBuZWVkIHRvIGJlXG4gICAqIHVwZGF0ZWQuXG4gICAqIEBjb25zdCB7QXJyYXk8Kj59XG4gICAqL1xuICB0aGlzLmF0dHJzQXJyID0gW107XG5cbiAgLyoqXG4gICAqIFRoZSBpbmNvbWluZyBhdHRyaWJ1dGVzIGZvciB0aGlzIE5vZGUsIGJlZm9yZSB0aGV5IGFyZSB1cGRhdGVkLlxuICAgKiBAY29uc3QgeyFPYmplY3Q8c3RyaW5nLCAqPn1cbiAgICovXG4gIHRoaXMubmV3QXR0cnMgPSBjcmVhdGVNYXAoKTtcblxuICAvKipcbiAgICogVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgbm9kZSwgdXNlZCB0byBwcmVzZXJ2ZSBET00gbm9kZXMgd2hlbiB0aGV5XG4gICAqIG1vdmUgd2l0aGluIHRoZWlyIHBhcmVudC5cbiAgICogQGNvbnN0XG4gICAqL1xuICB0aGlzLmtleSA9IGtleTtcblxuICAvKipcbiAgICogS2VlcHMgdHJhY2sgb2YgY2hpbGRyZW4gd2l0aGluIHRoaXMgbm9kZSBieSB0aGVpciBrZXkuXG4gICAqIHs/T2JqZWN0PHN0cmluZywgIUVsZW1lbnQ+fVxuICAgKi9cbiAgdGhpcy5rZXlNYXAgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUga2V5TWFwIGlzIGN1cnJlbnRseSB2YWxpZC5cbiAgICoge2Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmtleU1hcFZhbGlkID0gdHJ1ZTtcblxuICAvKipcbiAgICogVGhlIG5vZGUgbmFtZSBmb3IgdGhpcyBub2RlLlxuICAgKiBAY29uc3Qge3N0cmluZ31cbiAgICovXG4gIHRoaXMubm9kZU5hbWUgPSBub2RlTmFtZTtcblxuICAvKipcbiAgICogQHR5cGUgez9zdHJpbmd9XG4gICAqL1xuICB0aGlzLnRleHQgPSBudWxsO1xufVxuXG4vKipcbiAqIEluaXRpYWxpemVzIGEgTm9kZURhdGEgb2JqZWN0IGZvciBhIE5vZGUuXG4gKlxuICogQHBhcmFtIHtOb2RlfSBub2RlIFRoZSBub2RlIHRvIGluaXRpYWxpemUgZGF0YSBmb3IuXG4gKiBAcGFyYW0ge3N0cmluZ30gbm9kZU5hbWUgVGhlIG5vZGUgbmFtZSBvZiBub2RlLlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdGhhdCBpZGVudGlmaWVzIHRoZSBub2RlLlxuICogQHJldHVybiB7IU5vZGVEYXRhfSBUaGUgbmV3bHkgaW5pdGlhbGl6ZWQgZGF0YSBvYmplY3RcbiAqL1xudmFyIGluaXREYXRhID0gZnVuY3Rpb24gKG5vZGUsIG5vZGVOYW1lLCBrZXkpIHtcbiAgdmFyIGRhdGEgPSBuZXcgTm9kZURhdGEobm9kZU5hbWUsIGtleSk7XG4gIG5vZGVbJ19faW5jcmVtZW50YWxET01EYXRhJ10gPSBkYXRhO1xuICByZXR1cm4gZGF0YTtcbn07XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBOb2RlRGF0YSBvYmplY3QgZm9yIGEgTm9kZSwgY3JlYXRpbmcgaXQgaWYgbmVjZXNzYXJ5LlxuICpcbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgbm9kZSB0byByZXRyaWV2ZSB0aGUgZGF0YSBmb3IuXG4gKiBAcmV0dXJuIHshTm9kZURhdGF9IFRoZSBOb2RlRGF0YSBmb3IgdGhpcyBOb2RlLlxuICovXG52YXIgZ2V0RGF0YSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gIHZhciBkYXRhID0gbm9kZVsnX19pbmNyZW1lbnRhbERPTURhdGEnXTtcblxuICBpZiAoIWRhdGEpIHtcbiAgICB2YXIgbm9kZU5hbWUgPSBub2RlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyIGtleSA9IG51bGw7XG5cbiAgICBpZiAobm9kZSBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgIGtleSA9IG5vZGUuZ2V0QXR0cmlidXRlKCdrZXknKTtcbiAgICB9XG5cbiAgICBkYXRhID0gaW5pdERhdGEobm9kZSwgbm9kZU5hbWUsIGtleSk7XG4gIH1cblxuICByZXR1cm4gZGF0YTtcbn07XG5cbi8qKlxuICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuZXhwb3J0cy5zeW1ib2xzID0ge1xuICBkZWZhdWx0OiAnX19kZWZhdWx0JyxcblxuICBwbGFjZWhvbGRlcjogJ19fcGxhY2Vob2xkZXInXG59O1xuXG4vKipcbiAqIEFwcGxpZXMgYW4gYXR0cmlidXRlIG9yIHByb3BlcnR5IHRvIGEgZ2l2ZW4gRWxlbWVudC4gSWYgdGhlIHZhbHVlIGlzIG51bGxcbiAqIG9yIHVuZGVmaW5lZCwgaXQgaXMgcmVtb3ZlZCBmcm9tIHRoZSBFbGVtZW50LiBPdGhlcndpc2UsIHRoZSB2YWx1ZSBpcyBzZXRcbiAqIGFzIGFuIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAqIEBwYXJhbSB7Pyhib29sZWFufG51bWJlcnxzdHJpbmcpPX0gdmFsdWUgVGhlIGF0dHJpYnV0ZSdzIHZhbHVlLlxuICovXG5leHBvcnRzLmFwcGx5QXR0ciA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICBlbC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gIH0gZWxzZSB7XG4gICAgZWwuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBBcHBsaWVzIGEgcHJvcGVydHkgdG8gYSBnaXZlbiBFbGVtZW50LlxuICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBwcm9wZXJ0eSdzIG5hbWUuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBwcm9wZXJ0eSdzIHZhbHVlLlxuICovXG5leHBvcnRzLmFwcGx5UHJvcCA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgZWxbbmFtZV0gPSB2YWx1ZTtcbn07XG5cbi8qKlxuICogQXBwbGllcyBhIHN0eWxlIHRvIGFuIEVsZW1lbnQuIE5vIHZlbmRvciBwcmVmaXggZXhwYW5zaW9uIGlzIGRvbmUgZm9yXG4gKiBwcm9wZXJ0eSBuYW1lcy92YWx1ZXMuXG4gKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gKiBAcGFyYW0geyp9IHN0eWxlIFRoZSBzdHlsZSB0byBzZXQuIEVpdGhlciBhIHN0cmluZyBvZiBjc3Mgb3IgYW4gb2JqZWN0XG4gKiAgICAgY29udGFpbmluZyBwcm9wZXJ0eS12YWx1ZSBwYWlycy5cbiAqL1xudmFyIGFwcGx5U3R5bGUgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHN0eWxlKSB7XG4gIGlmICh0eXBlb2Ygc3R5bGUgPT09ICdzdHJpbmcnKSB7XG4gICAgZWwuc3R5bGUuY3NzVGV4dCA9IHN0eWxlO1xuICB9IGVsc2Uge1xuICAgIGVsLnN0eWxlLmNzc1RleHQgPSAnJztcbiAgICB2YXIgZWxTdHlsZSA9IGVsLnN0eWxlO1xuICAgIHZhciBvYmogPSAvKiogQHR5cGUgeyFPYmplY3Q8c3RyaW5nLHN0cmluZz59ICovc3R5bGU7XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xuICAgICAgaWYgKGhhcyhvYmosIHByb3ApKSB7XG4gICAgICAgIGVsU3R5bGVbcHJvcF0gPSBvYmpbcHJvcF07XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgYSBzaW5nbGUgYXR0cmlidXRlIG9uIGFuIEVsZW1lbnQuXG4gKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBhdHRyaWJ1dGUncyB2YWx1ZS4gSWYgdGhlIHZhbHVlIGlzIGFuIG9iamVjdCBvclxuICogICAgIGZ1bmN0aW9uIGl0IGlzIHNldCBvbiB0aGUgRWxlbWVudCwgb3RoZXJ3aXNlLCBpdCBpcyBzZXQgYXMgYW4gSFRNTFxuICogICAgIGF0dHJpYnV0ZS5cbiAqL1xudmFyIGFwcGx5QXR0cmlidXRlVHlwZWQgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuXG4gIGlmICh0eXBlID09PSAnb2JqZWN0JyB8fCB0eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZXhwb3J0cy5hcHBseVByb3AoZWwsIG5hbWUsIHZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICBleHBvcnRzLmFwcGx5QXR0cihlbCwgbmFtZSwgLyoqIEB0eXBlIHs/KGJvb2xlYW58bnVtYmVyfHN0cmluZyl9ICovdmFsdWUpO1xuICB9XG59O1xuXG4vKipcbiAqIENhbGxzIHRoZSBhcHByb3ByaWF0ZSBhdHRyaWJ1dGUgbXV0YXRvciBmb3IgdGhpcyBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBhdHRyaWJ1dGUncyB2YWx1ZS5cbiAqL1xudmFyIHVwZGF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgdmFyIGRhdGEgPSBnZXREYXRhKGVsKTtcbiAgdmFyIGF0dHJzID0gZGF0YS5hdHRycztcblxuICBpZiAoYXR0cnNbbmFtZV0gPT09IHZhbHVlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIG11dGF0b3IgPSBleHBvcnRzLmF0dHJpYnV0ZXNbbmFtZV0gfHwgZXhwb3J0cy5hdHRyaWJ1dGVzW2V4cG9ydHMuc3ltYm9scy5kZWZhdWx0XTtcbiAgbXV0YXRvcihlbCwgbmFtZSwgdmFsdWUpO1xuXG4gIGF0dHJzW25hbWVdID0gdmFsdWU7XG59O1xuXG4vKipcbiAqIEEgcHVibGljbHkgbXV0YWJsZSBvYmplY3QgdG8gcHJvdmlkZSBjdXN0b20gbXV0YXRvcnMgZm9yIGF0dHJpYnV0ZXMuXG4gKiBAY29uc3QgeyFPYmplY3Q8c3RyaW5nLCBmdW5jdGlvbighRWxlbWVudCwgc3RyaW5nLCAqKT59XG4gKi9cbmV4cG9ydHMuYXR0cmlidXRlcyA9IGNyZWF0ZU1hcCgpO1xuXG4vLyBTcGVjaWFsIGdlbmVyaWMgbXV0YXRvciB0aGF0J3MgY2FsbGVkIGZvciBhbnkgYXR0cmlidXRlIHRoYXQgZG9lcyBub3Rcbi8vIGhhdmUgYSBzcGVjaWZpYyBtdXRhdG9yLlxuZXhwb3J0cy5hdHRyaWJ1dGVzW2V4cG9ydHMuc3ltYm9scy5kZWZhdWx0XSA9IGFwcGx5QXR0cmlidXRlVHlwZWQ7XG5cbmV4cG9ydHMuYXR0cmlidXRlc1tleHBvcnRzLnN5bWJvbHMucGxhY2Vob2xkZXJdID0gZnVuY3Rpb24gKCkge307XG5cbmV4cG9ydHMuYXR0cmlidXRlc1snc3R5bGUnXSA9IGFwcGx5U3R5bGU7XG5cbi8qKlxuICogR2V0cyB0aGUgbmFtZXNwYWNlIHRvIGNyZWF0ZSBhbiBlbGVtZW50IChvZiBhIGdpdmVuIHRhZykgaW4uXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSB0YWcgdG8gZ2V0IHRoZSBuYW1lc3BhY2UgZm9yLlxuICogQHBhcmFtIHs/Tm9kZX0gcGFyZW50XG4gKiBAcmV0dXJuIHs/c3RyaW5nfSBUaGUgbmFtZXNwYWNlIHRvIGNyZWF0ZSB0aGUgdGFnIGluLlxuICovXG52YXIgZ2V0TmFtZXNwYWNlRm9yVGFnID0gZnVuY3Rpb24gKHRhZywgcGFyZW50KSB7XG4gIGlmICh0YWcgPT09ICdzdmcnKSB7XG4gICAgcmV0dXJuICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG4gIH1cblxuICBpZiAoZ2V0RGF0YShwYXJlbnQpLm5vZGVOYW1lID09PSAnZm9yZWlnbk9iamVjdCcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiBwYXJlbnQubmFtZXNwYWNlVVJJO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIEVsZW1lbnQuXG4gKiBAcGFyYW0ge0RvY3VtZW50fSBkb2MgVGhlIGRvY3VtZW50IHdpdGggd2hpY2ggdG8gY3JlYXRlIHRoZSBFbGVtZW50LlxuICogQHBhcmFtIHs/Tm9kZX0gcGFyZW50XG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSB0YWcgZm9yIHRoZSBFbGVtZW50LlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IEEga2V5IHRvIGlkZW50aWZ5IHRoZSBFbGVtZW50LlxuICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC5cbiAqIEByZXR1cm4geyFFbGVtZW50fVxuICovXG52YXIgY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uIChkb2MsIHBhcmVudCwgdGFnLCBrZXksIHN0YXRpY3MpIHtcbiAgdmFyIG5hbWVzcGFjZSA9IGdldE5hbWVzcGFjZUZvclRhZyh0YWcsIHBhcmVudCk7XG4gIHZhciBlbDtcblxuICBpZiAobmFtZXNwYWNlKSB7XG4gICAgZWwgPSBkb2MuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgdGFnKTtcbiAgfSBlbHNlIHtcbiAgICBlbCA9IGRvYy5jcmVhdGVFbGVtZW50KHRhZyk7XG4gIH1cblxuICBpbml0RGF0YShlbCwgdGFnLCBrZXkpO1xuXG4gIGlmIChzdGF0aWNzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGF0aWNzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICB1cGRhdGVBdHRyaWJ1dGUoZWwsIC8qKiBAdHlwZSB7IXN0cmluZ30qL3N0YXRpY3NbaV0sIHN0YXRpY3NbaSArIDFdKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZWw7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBUZXh0IE5vZGUuXG4gKiBAcGFyYW0ge0RvY3VtZW50fSBkb2MgVGhlIGRvY3VtZW50IHdpdGggd2hpY2ggdG8gY3JlYXRlIHRoZSBFbGVtZW50LlxuICogQHJldHVybiB7IVRleHR9XG4gKi9cbnZhciBjcmVhdGVUZXh0ID0gZnVuY3Rpb24gKGRvYykge1xuICB2YXIgbm9kZSA9IGRvYy5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gIGluaXREYXRhKG5vZGUsICcjdGV4dCcsIG51bGwpO1xuICByZXR1cm4gbm9kZTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hcHBpbmcgdGhhdCBjYW4gYmUgdXNlZCB0byBsb29rIHVwIGNoaWxkcmVuIHVzaW5nIGEga2V5LlxuICogQHBhcmFtIHs/Tm9kZX0gZWxcbiAqIEByZXR1cm4geyFPYmplY3Q8c3RyaW5nLCAhRWxlbWVudD59IEEgbWFwcGluZyBvZiBrZXlzIHRvIHRoZSBjaGlsZHJlbiBvZiB0aGVcbiAqICAgICBFbGVtZW50LlxuICovXG52YXIgY3JlYXRlS2V5TWFwID0gZnVuY3Rpb24gKGVsKSB7XG4gIHZhciBtYXAgPSBjcmVhdGVNYXAoKTtcbiAgdmFyIGNoaWxkcmVuID0gZWwuY2hpbGRyZW47XG4gIHZhciBjb3VudCA9IGNoaWxkcmVuLmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpICs9IDEpIHtcbiAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICB2YXIga2V5ID0gZ2V0RGF0YShjaGlsZCkua2V5O1xuXG4gICAgaWYgKGtleSkge1xuICAgICAgbWFwW2tleV0gPSBjaGlsZDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbWFwO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIG1hcHBpbmcgb2Yga2V5IHRvIGNoaWxkIG5vZGUgZm9yIGEgZ2l2ZW4gRWxlbWVudCwgY3JlYXRpbmcgaXRcbiAqIGlmIG5lY2Vzc2FyeS5cbiAqIEBwYXJhbSB7P05vZGV9IGVsXG4gKiBAcmV0dXJuIHshT2JqZWN0PHN0cmluZywgIU5vZGU+fSBBIG1hcHBpbmcgb2Yga2V5cyB0byBjaGlsZCBFbGVtZW50c1xuICovXG52YXIgZ2V0S2V5TWFwID0gZnVuY3Rpb24gKGVsKSB7XG4gIHZhciBkYXRhID0gZ2V0RGF0YShlbCk7XG5cbiAgaWYgKCFkYXRhLmtleU1hcCkge1xuICAgIGRhdGEua2V5TWFwID0gY3JlYXRlS2V5TWFwKGVsKTtcbiAgfVxuXG4gIHJldHVybiBkYXRhLmtleU1hcDtcbn07XG5cbi8qKlxuICogUmV0cmlldmVzIGEgY2hpbGQgZnJvbSB0aGUgcGFyZW50IHdpdGggdGhlIGdpdmVuIGtleS5cbiAqIEBwYXJhbSB7P05vZGV9IHBhcmVudFxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5XG4gKiBAcmV0dXJuIHs/Tm9kZX0gVGhlIGNoaWxkIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGtleS5cbiAqL1xudmFyIGdldENoaWxkID0gZnVuY3Rpb24gKHBhcmVudCwga2V5KSB7XG4gIHJldHVybiBrZXkgPyBnZXRLZXlNYXAocGFyZW50KVtrZXldIDogbnVsbDtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXJzIGFuIGVsZW1lbnQgYXMgYmVpbmcgYSBjaGlsZC4gVGhlIHBhcmVudCB3aWxsIGtlZXAgdHJhY2sgb2YgdGhlXG4gKiBjaGlsZCB1c2luZyB0aGUga2V5LiBUaGUgY2hpbGQgY2FuIGJlIHJldHJpZXZlZCB1c2luZyB0aGUgc2FtZSBrZXkgdXNpbmdcbiAqIGdldEtleU1hcC4gVGhlIHByb3ZpZGVkIGtleSBzaG91bGQgYmUgdW5pcXVlIHdpdGhpbiB0aGUgcGFyZW50IEVsZW1lbnQuXG4gKiBAcGFyYW0gez9Ob2RlfSBwYXJlbnQgVGhlIHBhcmVudCBvZiBjaGlsZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgQSBrZXkgdG8gaWRlbnRpZnkgdGhlIGNoaWxkIHdpdGguXG4gKiBAcGFyYW0geyFOb2RlfSBjaGlsZCBUaGUgY2hpbGQgdG8gcmVnaXN0ZXIuXG4gKi9cbnZhciByZWdpc3RlckNoaWxkID0gZnVuY3Rpb24gKHBhcmVudCwga2V5LCBjaGlsZCkge1xuICBnZXRLZXlNYXAocGFyZW50KVtrZXldID0gY2hpbGQ7XG59O1xuXG4vKiogQHR5cGUgez9Db250ZXh0fSAqL1xudmFyIGNvbnRleHQgPSBudWxsO1xuXG4vKiogQHR5cGUgez9Ob2RlfSAqL1xudmFyIGN1cnJlbnROb2RlO1xuXG4vKiogQHR5cGUgez9Ob2RlfSAqL1xudmFyIGN1cnJlbnRQYXJlbnQ7XG5cbi8qKiBAdHlwZSB7P05vZGV9ICovXG52YXIgcHJldmlvdXNOb2RlO1xuXG4vKiogQHR5cGUgez9FbGVtZW50fD9Eb2N1bWVudEZyYWdtZW50fSAqL1xudmFyIHJvb3Q7XG5cbi8qKiBAdHlwZSB7P0RvY3VtZW50fSAqL1xudmFyIGRvYztcblxuLyoqXG4gKiBQYXRjaGVzIHRoZSBkb2N1bWVudCBzdGFydGluZyBhdCBlbCB3aXRoIHRoZSBwcm92aWRlZCBmdW5jdGlvbi4gVGhpcyBmdW5jdGlvblxuICogbWF5IGJlIGNhbGxlZCBkdXJpbmcgYW4gZXhpc3RpbmcgcGF0Y2ggb3BlcmF0aW9uLlxuICogQHBhcmFtIHshRWxlbWVudHwhRG9jdW1lbnRGcmFnbWVudH0gbm9kZSBUaGUgRWxlbWVudCBvciBEb2N1bWVudFxuICogICAgIHRvIHBhdGNoLlxuICogQHBhcmFtIHshZnVuY3Rpb24oVCl9IGZuIEEgZnVuY3Rpb24gY29udGFpbmluZyBlbGVtZW50T3Blbi9lbGVtZW50Q2xvc2UvZXRjLlxuICogICAgIGNhbGxzIHRoYXQgZGVzY3JpYmUgdGhlIERPTS5cbiAqIEBwYXJhbSB7VD19IGRhdGEgQW4gYXJndW1lbnQgcGFzc2VkIHRvIGZuIHRvIHJlcHJlc2VudCBET00gc3RhdGUuXG4gKiBAdGVtcGxhdGUgVFxuICovXG5leHBvcnRzLnBhdGNoID0gZnVuY3Rpb24gKG5vZGUsIGZuLCBkYXRhKSB7XG4gIHZhciBwcmV2Q29udGV4dCA9IGNvbnRleHQ7XG4gIHZhciBwcmV2Um9vdCA9IHJvb3Q7XG4gIHZhciBwcmV2RG9jID0gZG9jO1xuICB2YXIgcHJldkN1cnJlbnROb2RlID0gY3VycmVudE5vZGU7XG4gIHZhciBwcmV2Q3VycmVudFBhcmVudCA9IGN1cnJlbnRQYXJlbnQ7XG4gIHZhciBwcmV2UHJldmlvdXNOb2RlID0gcHJldmlvdXNOb2RlO1xuICB2YXIgcHJldmlvdXNJbkF0dHJpYnV0ZXMgPSBmYWxzZTtcbiAgdmFyIHByZXZpb3VzSW5Ta2lwID0gZmFsc2U7XG5cbiAgY29udGV4dCA9IG5ldyBDb250ZXh0KCk7XG4gIHJvb3QgPSBub2RlO1xuICBkb2MgPSBub2RlLm93bmVyRG9jdW1lbnQ7XG4gIGN1cnJlbnROb2RlID0gbm9kZTtcbiAgY3VycmVudFBhcmVudCA9IG51bGw7XG4gIHByZXZpb3VzTm9kZSA9IG51bGw7XG5cbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBwcmV2aW91c0luQXR0cmlidXRlcyA9IHNldEluQXR0cmlidXRlcyhmYWxzZSk7XG4gICAgcHJldmlvdXNJblNraXAgPSBzZXRJblNraXAoZmFsc2UpO1xuICB9XG5cbiAgZW50ZXJOb2RlKCk7XG4gIGZuKGRhdGEpO1xuICBleGl0Tm9kZSgpO1xuXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0VmlydHVhbEF0dHJpYnV0ZXNDbG9zZWQoKTtcbiAgICBhc3NlcnROb1VuY2xvc2VkVGFncyhwcmV2aW91c05vZGUsIG5vZGUpO1xuICAgIHNldEluQXR0cmlidXRlcyhwcmV2aW91c0luQXR0cmlidXRlcyk7XG4gICAgc2V0SW5Ta2lwKHByZXZpb3VzSW5Ta2lwKTtcbiAgfVxuXG4gIGNvbnRleHQubm90aWZ5Q2hhbmdlcygpO1xuXG4gIGNvbnRleHQgPSBwcmV2Q29udGV4dDtcbiAgcm9vdCA9IHByZXZSb290O1xuICBkb2MgPSBwcmV2RG9jO1xuICBjdXJyZW50Tm9kZSA9IHByZXZDdXJyZW50Tm9kZTtcbiAgY3VycmVudFBhcmVudCA9IHByZXZDdXJyZW50UGFyZW50O1xuICBwcmV2aW91c05vZGUgPSBwcmV2UHJldmlvdXNOb2RlO1xufTtcblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciBvciBub3QgdGhlIGN1cnJlbnQgbm9kZSBtYXRjaGVzIHRoZSBzcGVjaWZpZWQgbm9kZU5hbWUgYW5kXG4gKiBrZXkuXG4gKlxuICogQHBhcmFtIHs/c3RyaW5nfSBub2RlTmFtZSBUaGUgbm9kZU5hbWUgZm9yIHRoaXMgbm9kZS5cbiAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBBbiBvcHRpb25hbCBrZXkgdGhhdCBpZGVudGlmaWVzIGEgbm9kZS5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIG5vZGUgbWF0Y2hlcywgZmFsc2Ugb3RoZXJ3aXNlLlxuICovXG52YXIgbWF0Y2hlcyA9IGZ1bmN0aW9uIChub2RlTmFtZSwga2V5KSB7XG4gIHZhciBkYXRhID0gZ2V0RGF0YShjdXJyZW50Tm9kZSk7XG5cbiAgLy8gS2V5IGNoZWNrIGlzIGRvbmUgdXNpbmcgZG91YmxlIGVxdWFscyBhcyB3ZSB3YW50IHRvIHRyZWF0IGEgbnVsbCBrZXkgdGhlXG4gIC8vIHNhbWUgYXMgdW5kZWZpbmVkLiBUaGlzIHNob3VsZCBiZSBva2F5IGFzIHRoZSBvbmx5IHZhbHVlcyBhbGxvd2VkIGFyZVxuICAvLyBzdHJpbmdzLCBudWxsIGFuZCB1bmRlZmluZWQgc28gdGhlID09IHNlbWFudGljcyBhcmUgbm90IHRvbyB3ZWlyZC5cbiAgcmV0dXJuIG5vZGVOYW1lID09PSBkYXRhLm5vZGVOYW1lICYmIGtleSA9PSBkYXRhLmtleTtcbn07XG5cbi8qKlxuICogQWxpZ25zIHRoZSB2aXJ0dWFsIEVsZW1lbnQgZGVmaW5pdGlvbiB3aXRoIHRoZSBhY3R1YWwgRE9NLCBtb3ZpbmcgdGhlXG4gKiBjb3JyZXNwb25kaW5nIERPTSBub2RlIHRvIHRoZSBjb3JyZWN0IGxvY2F0aW9uIG9yIGNyZWF0aW5nIGl0IGlmIG5lY2Vzc2FyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBub2RlTmFtZSBGb3IgYW4gRWxlbWVudCwgdGhpcyBzaG91bGQgYmUgYSB2YWxpZCB0YWcgc3RyaW5nLlxuICogICAgIEZvciBhIFRleHQsIHRoaXMgc2hvdWxkIGJlICN0ZXh0LlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuXG4gKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgRm9yIGFuIEVsZW1lbnQsIHRoaXMgc2hvdWxkIGJlIGFuIGFycmF5IG9mXG4gKiAgICAgbmFtZS12YWx1ZSBwYWlycy5cbiAqL1xudmFyIGFsaWduV2l0aERPTSA9IGZ1bmN0aW9uIChub2RlTmFtZSwga2V5LCBzdGF0aWNzKSB7XG4gIGlmIChjdXJyZW50Tm9kZSAmJiBtYXRjaGVzKG5vZGVOYW1lLCBrZXkpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIG5vZGU7XG5cbiAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSBub2RlIGhhcyBtb3ZlZCB3aXRoaW4gdGhlIHBhcmVudC5cbiAgaWYgKGtleSkge1xuICAgIG5vZGUgPSBnZXRDaGlsZChjdXJyZW50UGFyZW50LCBrZXkpO1xuICAgIGlmIChub2RlICYmIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIGFzc2VydEtleWVkVGFnTWF0Y2hlcyhnZXREYXRhKG5vZGUpLm5vZGVOYW1lLCBub2RlTmFtZSwga2V5KTtcbiAgICB9XG4gIH1cblxuICAvLyBDcmVhdGUgdGhlIG5vZGUgaWYgaXQgZG9lc24ndCBleGlzdC5cbiAgaWYgKCFub2RlKSB7XG4gICAgaWYgKG5vZGVOYW1lID09PSAnI3RleHQnKSB7XG4gICAgICBub2RlID0gY3JlYXRlVGV4dChkb2MpO1xuICAgIH0gZWxzZSB7XG4gICAgICBub2RlID0gY3JlYXRlRWxlbWVudChkb2MsIGN1cnJlbnRQYXJlbnQsIG5vZGVOYW1lLCBrZXksIHN0YXRpY3MpO1xuICAgIH1cblxuICAgIGlmIChrZXkpIHtcbiAgICAgIHJlZ2lzdGVyQ2hpbGQoY3VycmVudFBhcmVudCwga2V5LCBub2RlKTtcbiAgICB9XG5cbiAgICBjb250ZXh0Lm1hcmtDcmVhdGVkKG5vZGUpO1xuICB9XG5cbiAgLy8gSWYgdGhlIG5vZGUgaGFzIGEga2V5LCByZW1vdmUgaXQgZnJvbSB0aGUgRE9NIHRvIHByZXZlbnQgYSBsYXJnZSBudW1iZXJcbiAgLy8gb2YgcmUtb3JkZXJzIGluIHRoZSBjYXNlIHRoYXQgaXQgbW92ZWQgZmFyIG9yIHdhcyBjb21wbGV0ZWx5IHJlbW92ZWQuXG4gIC8vIFNpbmNlIHdlIGhvbGQgb24gdG8gYSByZWZlcmVuY2UgdGhyb3VnaCB0aGUga2V5TWFwLCB3ZSBjYW4gYWx3YXlzIGFkZCBpdFxuICAvLyBiYWNrLlxuICBpZiAoY3VycmVudE5vZGUgJiYgZ2V0RGF0YShjdXJyZW50Tm9kZSkua2V5KSB7XG4gICAgY3VycmVudFBhcmVudC5yZXBsYWNlQ2hpbGQobm9kZSwgY3VycmVudE5vZGUpO1xuICAgIGdldERhdGEoY3VycmVudFBhcmVudCkua2V5TWFwVmFsaWQgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBjdXJyZW50UGFyZW50Lmluc2VydEJlZm9yZShub2RlLCBjdXJyZW50Tm9kZSk7XG4gIH1cblxuICBjdXJyZW50Tm9kZSA9IG5vZGU7XG59O1xuXG4vKipcbiAqIENsZWFycyBvdXQgYW55IHVudmlzaXRlZCBOb2RlcywgYXMgdGhlIGNvcnJlc3BvbmRpbmcgdmlydHVhbCBlbGVtZW50XG4gKiBmdW5jdGlvbnMgd2VyZSBuZXZlciBjYWxsZWQgZm9yIHRoZW0uXG4gKi9cbnZhciBjbGVhclVudmlzaXRlZERPTSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG5vZGUgPSBjdXJyZW50UGFyZW50O1xuICB2YXIgZGF0YSA9IGdldERhdGEobm9kZSk7XG4gIHZhciBrZXlNYXAgPSBkYXRhLmtleU1hcDtcbiAgdmFyIGtleU1hcFZhbGlkID0gZGF0YS5rZXlNYXBWYWxpZDtcbiAgdmFyIGNoaWxkID0gbm9kZS5sYXN0Q2hpbGQ7XG4gIHZhciBrZXk7XG5cbiAgaWYgKGNoaWxkID09PSBwcmV2aW91c05vZGUgJiYga2V5TWFwVmFsaWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoZGF0YS5hdHRyc1tleHBvcnRzLnN5bWJvbHMucGxhY2Vob2xkZXJdICYmIG5vZGUgIT09IHJvb3QpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB3aGlsZSAoY2hpbGQgIT09IHByZXZpb3VzTm9kZSkge1xuICAgIG5vZGUucmVtb3ZlQ2hpbGQoY2hpbGQpO1xuICAgIGNvbnRleHQubWFya0RlbGV0ZWQoIC8qKiBAdHlwZSB7IU5vZGV9Ki9jaGlsZCk7XG5cbiAgICBrZXkgPSBnZXREYXRhKGNoaWxkKS5rZXk7XG4gICAgaWYgKGtleSkge1xuICAgICAgZGVsZXRlIGtleU1hcFtrZXldO1xuICAgIH1cbiAgICBjaGlsZCA9IG5vZGUubGFzdENoaWxkO1xuICB9XG5cbiAgLy8gQ2xlYW4gdGhlIGtleU1hcCwgcmVtb3ZpbmcgYW55IHVudXN1ZWQga2V5cy5cbiAgaWYgKCFrZXlNYXBWYWxpZCkge1xuICAgIGZvciAoa2V5IGluIGtleU1hcCkge1xuICAgICAgY2hpbGQgPSBrZXlNYXBba2V5XTtcbiAgICAgIGlmIChjaGlsZC5wYXJlbnROb2RlICE9PSBub2RlKSB7XG4gICAgICAgIGNvbnRleHQubWFya0RlbGV0ZWQoY2hpbGQpO1xuICAgICAgICBkZWxldGUga2V5TWFwW2tleV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgZGF0YS5rZXlNYXBWYWxpZCA9IHRydWU7XG4gIH1cbn07XG5cbi8qKlxuICogQ2hhbmdlcyB0byB0aGUgZmlyc3QgY2hpbGQgb2YgdGhlIGN1cnJlbnQgbm9kZS5cbiAqL1xudmFyIGVudGVyTm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgY3VycmVudFBhcmVudCA9IGN1cnJlbnROb2RlO1xuICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlLmZpcnN0Q2hpbGQ7XG4gIHByZXZpb3VzTm9kZSA9IG51bGw7XG59O1xuXG4vKipcbiAqIENoYW5nZXMgdG8gdGhlIG5leHQgc2libGluZyBvZiB0aGUgY3VycmVudCBub2RlLlxuICovXG52YXIgbmV4dE5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gIHByZXZpb3VzTm9kZSA9IGN1cnJlbnROb2RlO1xuICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlLm5leHRTaWJsaW5nO1xufTtcblxuLyoqXG4gKiBDaGFuZ2VzIHRvIHRoZSBwYXJlbnQgb2YgdGhlIGN1cnJlbnQgbm9kZSwgcmVtb3ZpbmcgYW55IHVudmlzaXRlZCBjaGlsZHJlbi5cbiAqL1xudmFyIGV4aXROb2RlID0gZnVuY3Rpb24gKCkge1xuICBjbGVhclVudmlzaXRlZERPTSgpO1xuXG4gIHByZXZpb3VzTm9kZSA9IGN1cnJlbnRQYXJlbnQ7XG4gIGN1cnJlbnROb2RlID0gY3VycmVudFBhcmVudC5uZXh0U2libGluZztcbiAgY3VycmVudFBhcmVudCA9IGN1cnJlbnRQYXJlbnQucGFyZW50Tm9kZTtcbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGF0IHRoZSBjdXJyZW50IG5vZGUgaXMgYW4gRWxlbWVudCB3aXRoIGEgbWF0Y2hpbmcgdGFnTmFtZSBhbmRcbiAqIGtleS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gKiAgICAgd2hlbiBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBvZiBpdGVtcy5cbiAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICogICAgIEVsZW1lbnQgaXMgY3JlYXRlZC5cbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG52YXIgX2VsZW1lbnRPcGVuID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzKSB7XG4gIGFsaWduV2l0aERPTSh0YWcsIGtleSwgc3RhdGljcyk7XG4gIGVudGVyTm9kZSgpO1xuICByZXR1cm4gKC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovY3VycmVudFBhcmVudFxuICApO1xufTtcblxuLyoqXG4gKiBDbG9zZXMgdGhlIGN1cnJlbnRseSBvcGVuIEVsZW1lbnQsIHJlbW92aW5nIGFueSB1bnZpc2l0ZWQgY2hpbGRyZW4gaWZcbiAqIG5lY2Vzc2FyeS5cbiAqXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xudmFyIF9lbGVtZW50Q2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgc2V0SW5Ta2lwKGZhbHNlKTtcbiAgfVxuXG4gIGV4aXROb2RlKCk7XG4gIHJldHVybiAoLyoqIEB0eXBlIHshRWxlbWVudH0gKi9wcmV2aW91c05vZGVcbiAgKTtcbn07XG5cbi8qKlxuICogTWFrZXMgc3VyZSB0aGUgY3VycmVudCBub2RlIGlzIGEgVGV4dCBub2RlIGFuZCBjcmVhdGVzIGEgVGV4dCBub2RlIGlmIGl0IGlzXG4gKiBub3QuXG4gKlxuICogQHJldHVybiB7IVRleHR9IFRoZSBjb3JyZXNwb25kaW5nIFRleHQgTm9kZS5cbiAqL1xudmFyIF90ZXh0ID0gZnVuY3Rpb24gKCkge1xuICBhbGlnbldpdGhET00oJyN0ZXh0JywgbnVsbCwgbnVsbCk7XG4gIG5leHROb2RlKCk7XG4gIHJldHVybiAoLyoqIEB0eXBlIHshVGV4dH0gKi9wcmV2aW91c05vZGVcbiAgKTtcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgY3VycmVudCBFbGVtZW50IGJlaW5nIHBhdGNoZWQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH1cbiAqL1xuZXhwb3J0cy5jdXJyZW50RWxlbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnRJblBhdGNoKGNvbnRleHQpO1xuICAgIGFzc2VydE5vdEluQXR0cmlidXRlcygnY3VycmVudEVsZW1lbnQnKTtcbiAgfVxuICByZXR1cm4gKC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovY3VycmVudFBhcmVudFxuICApO1xufTtcblxuLyoqXG4gKiBTa2lwcyB0aGUgY2hpbGRyZW4gaW4gYSBzdWJ0cmVlLCBhbGxvd2luZyBhbiBFbGVtZW50IHRvIGJlIGNsb3NlZCB3aXRob3V0XG4gKiBjbGVhcmluZyBvdXQgdGhlIGNoaWxkcmVuLlxuICovXG5leHBvcnRzLnNraXAgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0Tm9DaGlsZHJlbkRlY2xhcmVkWWV0KCdza2lwJywgcHJldmlvdXNOb2RlKTtcbiAgICBzZXRJblNraXAodHJ1ZSk7XG4gIH1cbiAgcHJldmlvdXNOb2RlID0gY3VycmVudFBhcmVudC5sYXN0Q2hpbGQ7XG59O1xuXG4vKipcbiAqIFRoZSBvZmZzZXQgaW4gdGhlIHZpcnR1YWwgZWxlbWVudCBkZWNsYXJhdGlvbiB3aGVyZSB0aGUgYXR0cmlidXRlcyBhcmVcbiAqIHNwZWNpZmllZC5cbiAqIEBjb25zdFxuICovXG52YXIgQVRUUklCVVRFU19PRkZTRVQgPSAzO1xuXG4vKipcbiAqIEJ1aWxkcyBhbiBhcnJheSBvZiBhcmd1bWVudHMgZm9yIHVzZSB3aXRoIGVsZW1lbnRPcGVuU3RhcnQsIGF0dHIgYW5kXG4gKiBlbGVtZW50T3BlbkVuZC5cbiAqIEBjb25zdCB7QXJyYXk8Kj59XG4gKi9cbnZhciBhcmdzQnVpbGRlciA9IFtdO1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC4gVGhpcyBjYW4gYmUgYW5cbiAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAqICAgICB3aGVuIGl0ZXJhdGluZyBvdmVyIGFuIGFycmF5IG9mIGl0ZW1zLlxuICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICogQHBhcmFtIHsuLi4qfSB2YXJfYXJncyBBdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGUgZHluYW1pYyBhdHRyaWJ1dGVzXG4gKiAgICAgZm9yIHRoZSBFbGVtZW50LlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbmV4cG9ydHMuZWxlbWVudE9wZW4gPSBmdW5jdGlvbiAodGFnLCBrZXksIHN0YXRpY3MsIHZhcl9hcmdzKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzKCdlbGVtZW50T3BlbicpO1xuICAgIGFzc2VydE5vdEluU2tpcCgnZWxlbWVudE9wZW4nKTtcbiAgfVxuXG4gIHZhciBub2RlID0gX2VsZW1lbnRPcGVuKHRhZywga2V5LCBzdGF0aWNzKTtcbiAgdmFyIGRhdGEgPSBnZXREYXRhKG5vZGUpO1xuXG4gIC8qXG4gICAqIENoZWNrcyB0byBzZWUgaWYgb25lIG9yIG1vcmUgYXR0cmlidXRlcyBoYXZlIGNoYW5nZWQgZm9yIGEgZ2l2ZW4gRWxlbWVudC5cbiAgICogV2hlbiBubyBhdHRyaWJ1dGVzIGhhdmUgY2hhbmdlZCwgdGhpcyBpcyBtdWNoIGZhc3RlciB0aGFuIGNoZWNraW5nIGVhY2hcbiAgICogaW5kaXZpZHVhbCBhcmd1bWVudC4gV2hlbiBhdHRyaWJ1dGVzIGhhdmUgY2hhbmdlZCwgdGhlIG92ZXJoZWFkIG9mIHRoaXMgaXNcbiAgICogbWluaW1hbC5cbiAgICovXG4gIHZhciBhdHRyc0FyciA9IGRhdGEuYXR0cnNBcnI7XG4gIHZhciBuZXdBdHRycyA9IGRhdGEubmV3QXR0cnM7XG4gIHZhciBhdHRyc0NoYW5nZWQgPSBmYWxzZTtcbiAgdmFyIGkgPSBBVFRSSUJVVEVTX09GRlNFVDtcbiAgdmFyIGogPSAwO1xuXG4gIGZvciAoOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAxLCBqICs9IDEpIHtcbiAgICBpZiAoYXR0cnNBcnJbal0gIT09IGFyZ3VtZW50c1tpXSkge1xuICAgICAgYXR0cnNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAxLCBqICs9IDEpIHtcbiAgICBhdHRyc0FycltqXSA9IGFyZ3VtZW50c1tpXTtcbiAgfVxuXG4gIGlmIChqIDwgYXR0cnNBcnIubGVuZ3RoKSB7XG4gICAgYXR0cnNDaGFuZ2VkID0gdHJ1ZTtcbiAgICBhdHRyc0Fyci5sZW5ndGggPSBqO1xuICB9XG5cbiAgLypcbiAgICogQWN0dWFsbHkgcGVyZm9ybSB0aGUgYXR0cmlidXRlIHVwZGF0ZS5cbiAgICovXG4gIGlmIChhdHRyc0NoYW5nZWQpIHtcbiAgICBmb3IgKGkgPSBBVFRSSUJVVEVTX09GRlNFVDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgbmV3QXR0cnNbYXJndW1lbnRzW2ldXSA9IGFyZ3VtZW50c1tpICsgMV07XG4gICAgfVxuXG4gICAgZm9yICh2YXIgYXR0ciBpbiBuZXdBdHRycykge1xuICAgICAgdXBkYXRlQXR0cmlidXRlKG5vZGUsIGF0dHIsIG5ld0F0dHJzW2F0dHJdKTtcbiAgICAgIG5ld0F0dHJzW2F0dHJdID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBub2RlO1xufTtcblxuLyoqXG4gKiBEZWNsYXJlcyBhIHZpcnR1YWwgRWxlbWVudCBhdCB0aGUgY3VycmVudCBsb2NhdGlvbiBpbiB0aGUgZG9jdW1lbnQuIFRoaXNcbiAqIGNvcnJlc3BvbmRzIHRvIGFuIG9wZW5pbmcgdGFnIGFuZCBhIGVsZW1lbnRDbG9zZSB0YWcgaXMgcmVxdWlyZWQuIFRoaXMgaXNcbiAqIGxpa2UgZWxlbWVudE9wZW4sIGJ1dCB0aGUgYXR0cmlidXRlcyBhcmUgZGVmaW5lZCB1c2luZyB0aGUgYXR0ciBmdW5jdGlvblxuICogcmF0aGVyIHRoYW4gYmVpbmcgcGFzc2VkIGFzIGFyZ3VtZW50cy4gTXVzdCBiZSBmb2xsbG93ZWQgYnkgMCBvciBtb3JlIGNhbGxzXG4gKiB0byBhdHRyLCB0aGVuIGEgY2FsbCB0byBlbGVtZW50T3BlbkVuZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC4gVGhpcyBjYW4gYmUgYW5cbiAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAqICAgICB3aGVuIGl0ZXJhdGluZyBvdmVyIGFuIGFycmF5IG9mIGl0ZW1zLlxuICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICovXG5leHBvcnRzLmVsZW1lbnRPcGVuU3RhcnQgPSBmdW5jdGlvbiAodGFnLCBrZXksIHN0YXRpY3MpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnROb3RJbkF0dHJpYnV0ZXMoJ2VsZW1lbnRPcGVuU3RhcnQnKTtcbiAgICBzZXRJbkF0dHJpYnV0ZXModHJ1ZSk7XG4gIH1cblxuICBhcmdzQnVpbGRlclswXSA9IHRhZztcbiAgYXJnc0J1aWxkZXJbMV0gPSBrZXk7XG4gIGFyZ3NCdWlsZGVyWzJdID0gc3RhdGljcztcbn07XG5cbi8qKipcbiAqIERlZmluZXMgYSB2aXJ0dWFsIGF0dHJpYnV0ZSBhdCB0aGlzIHBvaW50IG9mIHRoZSBET00uIFRoaXMgaXMgb25seSB2YWxpZFxuICogd2hlbiBjYWxsZWQgYmV0d2VlbiBlbGVtZW50T3BlblN0YXJ0IGFuZCBlbGVtZW50T3BlbkVuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHBhcmFtIHsqfSB2YWx1ZVxuICovXG5leHBvcnRzLmF0dHIgPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnRJbkF0dHJpYnV0ZXMoJ2F0dHInKTtcbiAgfVxuXG4gIGFyZ3NCdWlsZGVyLnB1c2gobmFtZSwgdmFsdWUpO1xufTtcblxuLyoqXG4gKiBDbG9zZXMgYW4gb3BlbiB0YWcgc3RhcnRlZCB3aXRoIGVsZW1lbnRPcGVuU3RhcnQuXG4gKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAqL1xuZXhwb3J0cy5lbGVtZW50T3BlbkVuZCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnRJbkF0dHJpYnV0ZXMoJ2VsZW1lbnRPcGVuRW5kJyk7XG4gICAgc2V0SW5BdHRyaWJ1dGVzKGZhbHNlKTtcbiAgfVxuXG4gIHZhciBub2RlID0gZXhwb3J0cy5lbGVtZW50T3Blbi5hcHBseShudWxsLCBhcmdzQnVpbGRlcik7XG4gIGFyZ3NCdWlsZGVyLmxlbmd0aCA9IDA7XG4gIHJldHVybiBub2RlO1xufTtcblxuLyoqXG4gKiBDbG9zZXMgYW4gb3BlbiB2aXJ0dWFsIEVsZW1lbnQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG5leHBvcnRzLmVsZW1lbnRDbG9zZSA9IGZ1bmN0aW9uICh0YWcpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnROb3RJbkF0dHJpYnV0ZXMoJ2VsZW1lbnRDbG9zZScpO1xuICB9XG5cbiAgdmFyIG5vZGUgPSBfZWxlbWVudENsb3NlKCk7XG5cbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnRDbG9zZU1hdGNoZXNPcGVuVGFnKGdldERhdGEobm9kZSkubm9kZU5hbWUsIHRhZyk7XG4gIH1cblxuICByZXR1cm4gbm9kZTtcbn07XG5cbi8qKlxuICogRGVjbGFyZXMgYSB2aXJ0dWFsIEVsZW1lbnQgYXQgdGhlIGN1cnJlbnQgbG9jYXRpb24gaW4gdGhlIGRvY3VtZW50IHRoYXQgaGFzXG4gKiBubyBjaGlsZHJlbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC4gVGhpcyBjYW4gYmUgYW5cbiAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAqICAgICB3aGVuIGl0ZXJhdGluZyBvdmVyIGFuIGFycmF5IG9mIGl0ZW1zLlxuICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICogQHBhcmFtIHsuLi4qfSB2YXJfYXJncyBBdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGUgZHluYW1pYyBhdHRyaWJ1dGVzXG4gKiAgICAgZm9yIHRoZSBFbGVtZW50LlxuICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gKi9cbmV4cG9ydHMuZWxlbWVudFZvaWQgPSBmdW5jdGlvbiAodGFnLCBrZXksIHN0YXRpY3MsIHZhcl9hcmdzKSB7XG4gIHZhciBub2RlID0gZXhwb3J0cy5lbGVtZW50T3Blbi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICBleHBvcnRzLmVsZW1lbnRDbG9zZS5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICByZXR1cm4gbm9kZTtcbn07XG5cbi8qKlxuICogRGVjbGFyZXMgYSB2aXJ0dWFsIEVsZW1lbnQgYXQgdGhlIGN1cnJlbnQgbG9jYXRpb24gaW4gdGhlIGRvY3VtZW50IHRoYXQgaXMgYVxuICogcGxhY2Vob2xkZXIgZWxlbWVudC4gQ2hpbGRyZW4gb2YgdGhpcyBFbGVtZW50IGNhbiBiZSBtYW51YWxseSBtYW5hZ2VkIGFuZFxuICogd2lsbCBub3QgYmUgY2xlYXJlZCBieSB0aGUgbGlicmFyeS5cbiAqXG4gKiBBIGtleSBtdXN0IGJlIHNwZWNpZmllZCB0byBtYWtlIHN1cmUgdGhhdCB0aGlzIG5vZGUgaXMgY29ycmVjdGx5IHByZXNlcnZlZFxuICogYWNyb3NzIGFsbCBjb25kaXRpb25hbHMuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC5cbiAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICogICAgIEVsZW1lbnQgaXMgY3JlYXRlZC5cbiAqIEBwYXJhbSB7Li4uKn0gdmFyX2FyZ3MgQXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlIGR5bmFtaWMgYXR0cmlidXRlc1xuICogICAgIGZvciB0aGUgRWxlbWVudC5cbiAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICovXG5leHBvcnRzLmVsZW1lbnRQbGFjZWhvbGRlciA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcywgdmFyX2FyZ3MpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnRQbGFjZWhvbGRlcktleVNwZWNpZmllZChrZXkpO1xuICB9XG5cbiAgZXhwb3J0cy5lbGVtZW50T3Blbi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICBleHBvcnRzLnNraXAoKTtcbiAgcmV0dXJuIGV4cG9ydHMuZWxlbWVudENsb3NlLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG59O1xuXG4vKipcbiAqIERlY2xhcmVzIGEgdmlydHVhbCBUZXh0IGF0IHRoaXMgcG9pbnQgaW4gdGhlIGRvY3VtZW50LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcnxib29sZWFufSB2YWx1ZSBUaGUgdmFsdWUgb2YgdGhlIFRleHQuXG4gKiBAcGFyYW0gey4uLihmdW5jdGlvbigoc3RyaW5nfG51bWJlcnxib29sZWFuKSk6c3RyaW5nKX0gdmFyX2FyZ3NcbiAqICAgICBGdW5jdGlvbnMgdG8gZm9ybWF0IHRoZSB2YWx1ZSB3aGljaCBhcmUgY2FsbGVkIG9ubHkgd2hlbiB0aGUgdmFsdWUgaGFzXG4gKiAgICAgY2hhbmdlZC5cbiAqIEByZXR1cm4geyFUZXh0fSBUaGUgY29ycmVzcG9uZGluZyB0ZXh0IG5vZGUuXG4gKi9cbmV4cG9ydHMudGV4dCA9IGZ1bmN0aW9uICh2YWx1ZSwgdmFyX2FyZ3MpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnROb3RJbkF0dHJpYnV0ZXMoJ3RleHQnKTtcbiAgICBhc3NlcnROb3RJblNraXAoJ3RleHQnKTtcbiAgfVxuXG4gIHZhciBub2RlID0gX3RleHQoKTtcbiAgdmFyIGRhdGEgPSBnZXREYXRhKG5vZGUpO1xuXG4gIGlmIChkYXRhLnRleHQgIT09IHZhbHVlKSB7XG4gICAgZGF0YS50ZXh0ID0gLyoqIEB0eXBlIHtzdHJpbmd9ICovdmFsdWU7XG5cbiAgICB2YXIgZm9ybWF0dGVkID0gdmFsdWU7XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIGZvcm1hdHRlZCA9IGFyZ3VtZW50c1tpXShmb3JtYXR0ZWQpO1xuICAgIH1cblxuICAgIG5vZGUuZGF0YSA9IGZvcm1hdHRlZDtcbiAgfVxuXG4gIHJldHVybiBub2RlO1xufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluY3JlbWVudGFsLWRvbS1janMuanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZGlzdC9jbGllbnQnKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLypcbiAgICAoaGFwaSluZXMgV2ViU29ja2V0IENsaWVudCAoaHR0cHM6Ly9naXRodWIuY29tL2hhcGlqcy9uZXMpXG4gICAgQ29weXJpZ2h0IChjKSAyMDE1LCBFcmFuIEhhbW1lciA8ZXJhbkBoYW1tZXIuaW8+IGFuZCBvdGhlciBjb250cmlidXRvcnNcbiAgICBCU0QgTGljZW5zZWRcbiovXG5cbnZhciBfdHlwZW9mID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIgPyBmdW5jdGlvbiAob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9IDogZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9O1xuXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblxuICAgIC8vICRsYWI6Y292ZXJhZ2U6b2ZmJFxuXG4gICAgaWYgKCh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcgPyAndW5kZWZpbmVkJyA6IF90eXBlb2YoZXhwb3J0cykpID09PSAnb2JqZWN0JyAmJiAodHlwZW9mIG1vZHVsZSA9PT0gJ3VuZGVmaW5lZCcgPyAndW5kZWZpbmVkJyA6IF90eXBlb2YobW9kdWxlKSkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpOyAvLyBFeHBvcnQgaWYgdXNlZCBhcyBhIG1vZHVsZVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgICAgICBkZWZpbmUoZmFjdG9yeSk7XG4gICAgICAgIH0gZWxzZSBpZiAoKHR5cGVvZiBleHBvcnRzID09PSAndW5kZWZpbmVkJyA/ICd1bmRlZmluZWQnIDogX3R5cGVvZihleHBvcnRzKSkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBleHBvcnRzLm5lcyA9IGZhY3RvcnkoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJvb3QubmVzID0gZmFjdG9yeSgpO1xuICAgICAgICB9XG5cbiAgICAvLyAkbGFiOmNvdmVyYWdlOm9uJFxufSkodW5kZWZpbmVkLCBmdW5jdGlvbiAoKSB7XG5cbiAgICAvLyBVdGlsaXRpZXNcblxuICAgIHZhciB2ZXJzaW9uID0gJzInO1xuICAgIHZhciBpZ25vcmUgPSBmdW5jdGlvbiBpZ25vcmUoKSB7fTtcblxuICAgIHZhciBwYXJzZSA9IGZ1bmN0aW9uIHBhcnNlKG1lc3NhZ2UsIG5leHQpIHtcblxuICAgICAgICB2YXIgb2JqID0gbnVsbDtcbiAgICAgICAgdmFyIGVycm9yID0gbnVsbDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgb2JqID0gSlNPTi5wYXJzZShtZXNzYWdlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBlcnJvciA9IG5ldyBOZXNFcnJvcihlcnIsICdwcm90b2NvbCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5leHQoZXJyb3IsIG9iaik7XG4gICAgfTtcblxuICAgIHZhciBzdHJpbmdpZnkgPSBmdW5jdGlvbiBzdHJpbmdpZnkobWVzc2FnZSwgbmV4dCkge1xuXG4gICAgICAgIHZhciBzdHJpbmcgPSBudWxsO1xuICAgICAgICB2YXIgZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzdHJpbmcgPSBKU09OLnN0cmluZ2lmeShtZXNzYWdlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBlcnJvciA9IG5ldyBOZXNFcnJvcihlcnIsICd1c2VyJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV4dChlcnJvciwgc3RyaW5nKTtcbiAgICB9O1xuXG4gICAgdmFyIE5lc0Vycm9yID0gZnVuY3Rpb24gTmVzRXJyb3IoZXJyLCB0eXBlKSB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBlcnIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBlcnIgPSBuZXcgRXJyb3IoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVyci50eXBlID0gdHlwZTtcbiAgICAgICAgcmV0dXJuIGVycjtcbiAgICB9O1xuXG4gICAgLy8gRXJyb3IgY29kZXNcblxuICAgIHZhciBlcnJvckNvZGVzID0ge1xuICAgICAgICAxMDAwOiAnTm9ybWFsIGNsb3N1cmUnLFxuICAgICAgICAxMDAxOiAnR29pbmcgYXdheScsXG4gICAgICAgIDEwMDI6ICdQcm90b2NvbCBlcnJvcicsXG4gICAgICAgIDEwMDM6ICdVbnN1cHBvcnRlZCBkYXRhJyxcbiAgICAgICAgMTAwNDogJ1Jlc2VydmVkJyxcbiAgICAgICAgMTAwNTogJ05vIHN0YXR1cyByZWNlaXZlZCcsXG4gICAgICAgIDEwMDY6ICdBYm5vcm1hbCBjbG9zdXJlJyxcbiAgICAgICAgMTAwNzogJ0ludmFsaWQgZnJhbWUgcGF5bG9hZCBkYXRhJyxcbiAgICAgICAgMTAwODogJ1BvbGljeSB2aW9sYXRpb24nLFxuICAgICAgICAxMDA5OiAnTWVzc2FnZSB0b28gYmlnJyxcbiAgICAgICAgMTAxMDogJ01hbmRhdG9yeSBleHRlbnNpb24nLFxuICAgICAgICAxMDExOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyxcbiAgICAgICAgMTAxNTogJ1RMUyBoYW5kc2hha2UnXG4gICAgfTtcblxuICAgIC8vIENsaWVudFxuXG4gICAgdmFyIENsaWVudCA9IGZ1bmN0aW9uIENsaWVudCh1cmwsIG9wdGlvbnMpIHtcblxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAvLyBDb25maWd1cmF0aW9uXG5cbiAgICAgICAgdGhpcy5fdXJsID0gdXJsO1xuICAgICAgICB0aGlzLl9zZXR0aW5ncyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMuX2hlYXJ0YmVhdFRpbWVvdXQgPSBmYWxzZTsgLy8gU2VydmVyIGhlYXJ0YmVhdCBjb25maWd1cmF0aW9uXG5cbiAgICAgICAgLy8gU3RhdGVcblxuICAgICAgICB0aGlzLl93cyA9IG51bGw7XG4gICAgICAgIHRoaXMuX3JlY29ubmVjdGlvbiA9IG51bGw7XG4gICAgICAgIHRoaXMuX2lkcyA9IDA7IC8vIElkIGNvdW50ZXJcbiAgICAgICAgdGhpcy5fcmVxdWVzdHMgPSB7fTsgLy8gaWQgLT4geyBjYWxsYmFjaywgdGltZW91dCB9XG4gICAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSB7fTsgLy8gcGF0aCAtPiBbY2FsbGJhY2tzXVxuICAgICAgICB0aGlzLl9oZWFydGJlYXQgPSBudWxsO1xuXG4gICAgICAgIC8vIEV2ZW50c1xuXG4gICAgICAgIHRoaXMub25FcnJvciA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIH07IC8vIEdlbmVyYWwgZXJyb3IgY2FsbGJhY2sgKG9ubHkgd2hlbiBhbiBlcnJvciBjYW5ub3QgYmUgYXNzb2NpYXRlZCB3aXRoIGEgcmVxdWVzdClcbiAgICAgICAgdGhpcy5vbkNvbm5lY3QgPSBpZ25vcmU7IC8vIENhbGxlZCB3aGVuZXZlciBhIGNvbm5lY3Rpb24gaXMgZXN0YWJsaXNoZWRcbiAgICAgICAgdGhpcy5vbkRpc2Nvbm5lY3QgPSBpZ25vcmU7IC8vIENhbGxlZCB3aGVuZXZlciBhIGNvbm5lY3Rpb24gaXMgbG9zdDogZnVuY3Rpb24od2lsbFJlY29ubmVjdClcbiAgICAgICAgdGhpcy5vblVwZGF0ZSA9IGlnbm9yZTtcblxuICAgICAgICAvLyBQdWJsaWMgcHJvcGVydGllc1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsOyAvLyBBc3NpZ25lZCB3aGVuIGhlbGxvIHJlc3BvbnNlIGlzIHJlY2VpdmVkXG4gICAgfTtcblxuICAgIENsaWVudC5XZWJTb2NrZXQgPSAvKiAkbGFiOmNvdmVyYWdlOm9mZiQgKi90eXBlb2YgV2ViU29ja2V0ID09PSAndW5kZWZpbmVkJyA/IG51bGwgOiBXZWJTb2NrZXQ7IC8qICRsYWI6Y292ZXJhZ2U6b24kICovXG5cbiAgICBDbGllbnQucHJvdG90eXBlLmNvbm5lY3QgPSBmdW5jdGlvbiAob3B0aW9ucywgY2FsbGJhY2spIHtcblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gYXJndW1lbnRzWzBdO1xuICAgICAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMucmVjb25uZWN0ICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgLy8gRGVmYXVsdHMgdG8gdHJ1ZVxuICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uID0geyAvLyBPcHRpb25zOiByZWNvbm5lY3QsIGRlbGF5LCBtYXhEZWxheVxuICAgICAgICAgICAgICAgIHdhaXQ6IDAsXG4gICAgICAgICAgICAgICAgZGVsYXk6IG9wdGlvbnMuZGVsYXkgfHwgMTAwMCwgLy8gMSBzZWNvbmRcbiAgICAgICAgICAgICAgICBtYXhEZWxheTogb3B0aW9ucy5tYXhEZWxheSB8fCA1MDAwLCAvLyA1IHNlY29uZHNcbiAgICAgICAgICAgICAgICByZXRyaWVzOiBvcHRpb25zLnJldHJpZXMgfHwgSW5maW5pdHksIC8vIFVubGltaXRlZFxuICAgICAgICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICAgICAgICAgIGF1dGg6IG9wdGlvbnMuYXV0aCxcbiAgICAgICAgICAgICAgICAgICAgdGltZW91dDogb3B0aW9ucy50aW1lb3V0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3JlY29ubmVjdGlvbiA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jb25uZWN0KG9wdGlvbnMsIHRydWUsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5fY29ubmVjdCA9IGZ1bmN0aW9uIChvcHRpb25zLCBpbml0aWFsLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIHZhciBzZW50Q2FsbGJhY2sgPSBmYWxzZTtcbiAgICAgICAgdmFyIHRpbWVvdXRIYW5kbGVyID0gZnVuY3Rpb24gdGltZW91dEhhbmRsZXIoKSB7XG5cbiAgICAgICAgICAgIHNlbnRDYWxsYmFjayA9IHRydWU7XG4gICAgICAgICAgICBfdGhpcy5fd3MuY2xvc2UoKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBOZXNFcnJvcignQ29ubmVjdGlvbiB0aW1lZCBvdXQnLCAndGltZW91dCcpKTtcbiAgICAgICAgICAgIF90aGlzLl9jbGVhbnVwKCk7XG4gICAgICAgICAgICBpZiAoaW5pdGlhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5fcmVjb25uZWN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHRpbWVvdXQgPSBvcHRpb25zLnRpbWVvdXQgPyBzZXRUaW1lb3V0KHRpbWVvdXRIYW5kbGVyLCBvcHRpb25zLnRpbWVvdXQpIDogbnVsbDtcblxuICAgICAgICB2YXIgd3MgPSBuZXcgQ2xpZW50LldlYlNvY2tldCh0aGlzLl91cmwsIHRoaXMuX3NldHRpbmdzLndzKTsgLy8gU2V0dGluZ3MgdXNlZCBieSBub2RlLmpzIG9ubHlcbiAgICAgICAgdGhpcy5fd3MgPSB3cztcblxuICAgICAgICB3cy5vbm9wZW4gPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblxuICAgICAgICAgICAgaWYgKCFzZW50Q2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBzZW50Q2FsbGJhY2sgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5faGVsbG8ob3B0aW9ucy5hdXRoLCBmdW5jdGlvbiAoZXJyKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5wYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIF90aGlzLl9zdWJzY3JpcHRpb25zW2Vyci5wYXRoXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGlzY29ubmVjdCgpOyAvLyBTdG9wIHJlY29ubmVjdGlvbiB3aGVuIHRoZSBoZWxsbyBtZXNzYWdlIHJldHVybnMgZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgX3RoaXMub25Db25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHdzLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICAgICAgICAgICAgdmFyIGVyciA9IG5ldyBOZXNFcnJvcignU29ja2V0IGVycm9yJywgJ3dzJyk7XG5cbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblxuICAgICAgICAgICAgaWYgKCFzZW50Q2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBzZW50Q2FsbGJhY2sgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gX3RoaXMub25FcnJvcihlcnIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHdzLm9uY2xvc2UgPSBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICAgICAgICAgICAgdmFyIGxvZyA9IHtcbiAgICAgICAgICAgICAgICBjb2RlOiBldmVudC5jb2RlLFxuICAgICAgICAgICAgICAgIGV4cGxhbmF0aW9uOiBlcnJvckNvZGVzW2V2ZW50LmNvZGVdIHx8ICdVbmtub3duJyxcbiAgICAgICAgICAgICAgICByZWFzb246IGV2ZW50LnJlYXNvbixcbiAgICAgICAgICAgICAgICB3YXNDbGVhbjogZXZlbnQud2FzQ2xlYW5cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIF90aGlzLl9jbGVhbnVwKCk7XG4gICAgICAgICAgICBfdGhpcy5vbkRpc2Nvbm5lY3QoISEoX3RoaXMuX3JlY29ubmVjdGlvbiAmJiBfdGhpcy5fcmVjb25uZWN0aW9uLnJldHJpZXMgPj0gMSksIGxvZyk7XG4gICAgICAgICAgICBfdGhpcy5fcmVjb25uZWN0KCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgd3Mub25tZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcblxuICAgICAgICAgICAgcmV0dXJuIF90aGlzLl9vbk1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUuZGlzY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB0aGlzLl9yZWNvbm5lY3Rpb24gPSBudWxsO1xuXG4gICAgICAgIGlmICghdGhpcy5fd3MpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl93cy5yZWFkeVN0YXRlID09PSBDbGllbnQuV2ViU29ja2V0Lk9QRU4gfHwgdGhpcy5fd3MucmVhZHlTdGF0ZSA9PT0gQ2xpZW50LldlYlNvY2tldC5DT05ORUNUSU5HKSB7XG5cbiAgICAgICAgICAgIHRoaXMuX3dzLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5fY2xlYW51cCA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB2YXIgd3MgPSB0aGlzLl93cztcbiAgICAgICAgaWYgKCF3cykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fd3MgPSBudWxsO1xuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgd3Mub25vcGVuID0gbnVsbDtcbiAgICAgICAgd3Mub25jbG9zZSA9IG51bGw7XG4gICAgICAgIHdzLm9uZXJyb3IgPSBpZ25vcmU7XG4gICAgICAgIHdzLm9ubWVzc2FnZSA9IG51bGw7XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2hlYXJ0YmVhdCk7XG5cbiAgICAgICAgLy8gRmx1c2ggcGVuZGluZyByZXF1ZXN0c1xuXG4gICAgICAgIHZhciBlcnJvciA9IG5ldyBOZXNFcnJvcignUmVxdWVzdCBmYWlsZWQgLSBzZXJ2ZXIgZGlzY29ubmVjdGVkJywgJ2Rpc2Nvbm5lY3QnKTtcblxuICAgICAgICB2YXIgaWRzID0gT2JqZWN0LmtleXModGhpcy5fcmVxdWVzdHMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGlkcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdmFyIGlkID0gaWRzW2ldO1xuICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSB0aGlzLl9yZXF1ZXN0c1tpZF07XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSByZXF1ZXN0LmNhbGxiYWNrO1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHJlcXVlc3QudGltZW91dCk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fcmVxdWVzdHNbaWRdO1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyb3IpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUuX3JlY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgICAgLy8gUmVjb25uZWN0XG5cbiAgICAgICAgaWYgKHRoaXMuX3JlY29ubmVjdGlvbikge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3JlY29ubmVjdGlvbi5yZXRyaWVzIDwgMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdCgpOyAvLyBDbGVhciBfcmVjb25uZWN0aW9uIHN0YXRlXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAtLXRoaXMuX3JlY29ubmVjdGlvbi5yZXRyaWVzO1xuICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uLndhaXQgPSB0aGlzLl9yZWNvbm5lY3Rpb24ud2FpdCArIHRoaXMuX3JlY29ubmVjdGlvbi5kZWxheTtcblxuICAgICAgICAgICAgdmFyIHRpbWVvdXQgPSBNYXRoLm1pbih0aGlzLl9yZWNvbm5lY3Rpb24ud2FpdCwgdGhpcy5fcmVjb25uZWN0aW9uLm1heERlbGF5KTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAgICAgaWYgKCFfdGhpczIuX3JlY29ubmVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgX3RoaXMyLl9jb25uZWN0KF90aGlzMi5fcmVjb25uZWN0aW9uLnNldHRpbmdzLCBmYWxzZSwgZnVuY3Rpb24gKGVycikge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzMi5vbkVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpczIuX2NsZWFudXAoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfdGhpczIuX3JlY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLnJlcXVlc3QgPSBmdW5jdGlvbiAob3B0aW9ucywgY2FsbGJhY2spIHtcblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBvcHRpb25zID0ge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgcGF0aDogb3B0aW9uc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgdHlwZTogJ3JlcXVlc3QnLFxuICAgICAgICAgICAgbWV0aG9kOiBvcHRpb25zLm1ldGhvZCB8fCAnR0VUJyxcbiAgICAgICAgICAgIHBhdGg6IG9wdGlvbnMucGF0aCxcbiAgICAgICAgICAgIGhlYWRlcnM6IG9wdGlvbnMuaGVhZGVycyxcbiAgICAgICAgICAgIHBheWxvYWQ6IG9wdGlvbnMucGF5bG9hZFxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9zZW5kKHJlcXVlc3QsIHRydWUsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5tZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UsIGNhbGxiYWNrKSB7XG5cbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XG4gICAgICAgICAgICB0eXBlOiAnbWVzc2FnZScsXG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbmQocmVxdWVzdCwgdHJ1ZSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLl9zZW5kID0gZnVuY3Rpb24gKHJlcXVlc3QsIHRyYWNrLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGlnbm9yZTtcblxuICAgICAgICBpZiAoIXRoaXMuX3dzIHx8IHRoaXMuX3dzLnJlYWR5U3RhdGUgIT09IENsaWVudC5XZWJTb2NrZXQuT1BFTikge1xuXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IE5lc0Vycm9yKCdGYWlsZWQgdG8gc2VuZCBtZXNzYWdlIC0gc2VydmVyIGRpc2Nvbm5lY3RlZCcsICdkaXNjb25uZWN0JykpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVxdWVzdC5pZCA9ICsrdGhpcy5faWRzO1xuXG4gICAgICAgIHN0cmluZ2lmeShyZXF1ZXN0LCBmdW5jdGlvbiAoZXJyLCBlbmNvZGVkKSB7XG5cbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSWdub3JlIGVycm9yc1xuXG4gICAgICAgICAgICBpZiAoIXRyYWNrKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzMy5fd3Muc2VuZChlbmNvZGVkKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBOZXNFcnJvcihlcnIsICd3cycpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRyYWNrIGVycm9yc1xuXG4gICAgICAgICAgICB2YXIgcmVjb3JkID0ge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBjYWxsYmFjayxcbiAgICAgICAgICAgICAgICB0aW1lb3V0OiBudWxsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoX3RoaXMzLl9zZXR0aW5ncy50aW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgcmVjb3JkLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgICAgICAgICByZWNvcmQuY2FsbGJhY2sgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICByZWNvcmQudGltZW91dCA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBOZXNFcnJvcignUmVxdWVzdCB0aW1lZCBvdXQnLCAndGltZW91dCcpKTtcbiAgICAgICAgICAgICAgICB9LCBfdGhpczMuX3NldHRpbmdzLnRpbWVvdXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBfdGhpczMuX3JlcXVlc3RzW3JlcXVlc3QuaWRdID0gcmVjb3JkO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIF90aGlzMy5fd3Muc2VuZChlbmNvZGVkKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpczMuX3JlcXVlc3RzW3JlcXVlc3QuaWRdLnRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBfdGhpczMuX3JlcXVlc3RzW3JlcXVlc3QuaWRdO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgTmVzRXJyb3IoZXJyLCAnd3MnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLl9oZWxsbyA9IGZ1bmN0aW9uIChhdXRoLCBjYWxsYmFjaykge1xuXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgdHlwZTogJ2hlbGxvJyxcbiAgICAgICAgICAgIHZlcnNpb246IHZlcnNpb25cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoYXV0aCkge1xuICAgICAgICAgICAgcmVxdWVzdC5hdXRoID0gYXV0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdWJzID0gdGhpcy5zdWJzY3JpcHRpb25zKCk7XG4gICAgICAgIGlmIChzdWJzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmVxdWVzdC5zdWJzID0gc3VicztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl9zZW5kKHJlcXVlc3QsIHRydWUsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5zdWJzY3JpcHRpb25zID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLl9zdWJzY3JpcHRpb25zKTtcbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbiAocGF0aCwgaGFuZGxlciwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIF90aGlzNCA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCFwYXRoIHx8IHBhdGhbMF0gIT09ICcvJykge1xuXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IE5lc0Vycm9yKCdJbnZhbGlkIHBhdGgnLCAndXNlcicpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdWJzID0gdGhpcy5fc3Vic2NyaXB0aW9uc1twYXRoXTtcbiAgICAgICAgaWYgKHN1YnMpIHtcblxuICAgICAgICAgICAgLy8gQWxyZWFkeSBzdWJzY3JpYmVkXG5cbiAgICAgICAgICAgIGlmIChzdWJzLmluZGV4T2YoaGFuZGxlcikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgc3Vicy5wdXNoKGhhbmRsZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnNbcGF0aF0gPSBbaGFuZGxlcl07XG5cbiAgICAgICAgaWYgKCF0aGlzLl93cyB8fCB0aGlzLl93cy5yZWFkeVN0YXRlICE9PSBDbGllbnQuV2ViU29ja2V0Lk9QRU4pIHtcblxuICAgICAgICAgICAgLy8gUXVldWVkIHN1YnNjcmlwdGlvblxuXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgdHlwZTogJ3N1YicsXG4gICAgICAgICAgICBwYXRoOiBwYXRoXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbmQocmVxdWVzdCwgdHJ1ZSwgZnVuY3Rpb24gKGVycikge1xuXG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIF90aGlzNC5fc3Vic2NyaXB0aW9uc1twYXRoXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24gKHBhdGgsIGhhbmRsZXIpIHtcblxuICAgICAgICBpZiAoIXBhdGggfHwgcGF0aFswXSAhPT0gJy8nKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBoYW5kbGVyKG5ldyBOZXNFcnJvcignSW52YWxpZCBwYXRoJywgJ3VzZXInKSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3VicyA9IHRoaXMuX3N1YnNjcmlwdGlvbnNbcGF0aF07XG4gICAgICAgIGlmICghc3Vicykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN5bmMgPSBmYWxzZTtcbiAgICAgICAgaWYgKCFoYW5kbGVyKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fc3Vic2NyaXB0aW9uc1twYXRoXTtcbiAgICAgICAgICAgIHN5bmMgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHBvcyA9IHN1YnMuaW5kZXhPZihoYW5kbGVyKTtcbiAgICAgICAgICAgIGlmIChwb3MgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdWJzLnNwbGljZShwb3MsIDEpO1xuICAgICAgICAgICAgaWYgKCFzdWJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9zdWJzY3JpcHRpb25zW3BhdGhdO1xuICAgICAgICAgICAgICAgIHN5bmMgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzeW5jIHx8ICF0aGlzLl93cyB8fCB0aGlzLl93cy5yZWFkeVN0YXRlICE9PSBDbGllbnQuV2ViU29ja2V0Lk9QRU4pIHtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XG4gICAgICAgICAgICB0eXBlOiAndW5zdWInLFxuICAgICAgICAgICAgcGF0aDogcGF0aFxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9zZW5kKHJlcXVlc3QsIGZhbHNlKTsgLy8gSWdub3JpbmcgZXJyb3JzIGFzIHRoZSBzdWJzY3JpcHRpb24gaGFuZGxlcnMgYXJlIGFscmVhZHkgcmVtb3ZlZFxuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLl9vbk1lc3NhZ2UgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICB2YXIgX3RoaXM1ID0gdGhpcztcblxuICAgICAgICB0aGlzLl9iZWF0KCk7XG5cbiAgICAgICAgcGFyc2UobWVzc2FnZS5kYXRhLCBmdW5jdGlvbiAoZXJyLCB1cGRhdGUpIHtcblxuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdGhpczUub25FcnJvcihlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBSZWNyZWF0ZSBlcnJvclxuXG4gICAgICAgICAgICB2YXIgZXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgaWYgKHVwZGF0ZS5zdGF0dXNDb2RlICYmIHVwZGF0ZS5zdGF0dXNDb2RlID49IDQwMCAmJiB1cGRhdGUuc3RhdHVzQ29kZSA8PSA1OTkpIHtcblxuICAgICAgICAgICAgICAgIGVycm9yID0gbmV3IE5lc0Vycm9yKHVwZGF0ZS5wYXlsb2FkLm1lc3NhZ2UgfHwgdXBkYXRlLnBheWxvYWQuZXJyb3IsICdzZXJ2ZXInKTtcbiAgICAgICAgICAgICAgICBlcnJvci5zdGF0dXNDb2RlID0gdXBkYXRlLnN0YXR1c0NvZGU7XG4gICAgICAgICAgICAgICAgZXJyb3IuZGF0YSA9IHVwZGF0ZS5wYXlsb2FkO1xuICAgICAgICAgICAgICAgIGVycm9yLmhlYWRlcnMgPSB1cGRhdGUuaGVhZGVycztcbiAgICAgICAgICAgICAgICBlcnJvci5wYXRoID0gdXBkYXRlLnBhdGg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFBpbmdcblxuICAgICAgICAgICAgaWYgKHVwZGF0ZS50eXBlID09PSAncGluZycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXM1Ll9zZW5kKHsgdHlwZTogJ3BpbmcnIH0sIGZhbHNlKTsgLy8gSWdub3JlIGVycm9yc1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBCcm9hZGNhc3QgYW5kIHVwZGF0ZVxuXG4gICAgICAgICAgICBpZiAodXBkYXRlLnR5cGUgPT09ICd1cGRhdGUnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzNS5vblVwZGF0ZSh1cGRhdGUubWVzc2FnZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFB1Ymxpc2hcblxuICAgICAgICAgICAgaWYgKHVwZGF0ZS50eXBlID09PSAncHViJykge1xuICAgICAgICAgICAgICAgIHZhciBoYW5kbGVycyA9IF90aGlzNS5fc3Vic2NyaXB0aW9uc1t1cGRhdGUucGF0aF07XG4gICAgICAgICAgICAgICAgaWYgKGhhbmRsZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGFuZGxlcnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXJzW2ldKHVwZGF0ZS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTG9va3VwIGNhbGxiYWNrIChtZXNzYWdlIG11c3QgaW5jbHVkZSBhbiBpZCBmcm9tIHRoaXMgcG9pbnQpXG5cbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0gX3RoaXM1Ll9yZXF1ZXN0c1t1cGRhdGUuaWRdO1xuICAgICAgICAgICAgaWYgKCFyZXF1ZXN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzNS5vbkVycm9yKG5ldyBOZXNFcnJvcignUmVjZWl2ZWQgcmVzcG9uc2UgZm9yIHVua25vd24gcmVxdWVzdCcsICdwcm90b2NvbCcpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gcmVxdWVzdC5jYWxsYmFjaztcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChyZXF1ZXN0LnRpbWVvdXQpO1xuICAgICAgICAgICAgZGVsZXRlIF90aGlzNS5fcmVxdWVzdHNbdXBkYXRlLmlkXTtcblxuICAgICAgICAgICAgaWYgKCFjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHJldHVybjsgLy8gUmVzcG9uc2UgcmVjZWl2ZWQgYWZ0ZXIgdGltZW91dFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBSZXNwb25zZVxuXG4gICAgICAgICAgICBpZiAodXBkYXRlLnR5cGUgPT09ICdyZXF1ZXN0Jykge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvciwgdXBkYXRlLnBheWxvYWQsIHVwZGF0ZS5zdGF0dXNDb2RlLCB1cGRhdGUuaGVhZGVycyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEN1c3RvbSBtZXNzYWdlXG5cbiAgICAgICAgICAgIGlmICh1cGRhdGUudHlwZSA9PT0gJ21lc3NhZ2UnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yLCB1cGRhdGUubWVzc2FnZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEF1dGhlbnRpY2F0aW9uXG5cbiAgICAgICAgICAgIGlmICh1cGRhdGUudHlwZSA9PT0gJ2hlbGxvJykge1xuICAgICAgICAgICAgICAgIF90aGlzNS5pZCA9IHVwZGF0ZS5zb2NrZXQ7XG4gICAgICAgICAgICAgICAgaWYgKHVwZGF0ZS5oZWFydGJlYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXM1Ll9oZWFydGJlYXRUaW1lb3V0ID0gdXBkYXRlLmhlYXJ0YmVhdC5pbnRlcnZhbCArIHVwZGF0ZS5oZWFydGJlYXQudGltZW91dDtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXM1Ll9iZWF0KCk7IC8vIENhbGwgYWdhaW4gb25jZSB0aW1lb3V0IGlzIHNldFxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFN1YnNjcmlwdGlvbnNcblxuICAgICAgICAgICAgaWYgKHVwZGF0ZS50eXBlID09PSAnc3ViJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBfdGhpczUub25FcnJvcihuZXcgTmVzRXJyb3IoJ1JlY2VpdmVkIHVua25vd24gcmVzcG9uc2UgdHlwZTogJyArIHVwZGF0ZS50eXBlLCAncHJvdG9jb2wnKSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLl9iZWF0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXM2ID0gdGhpcztcblxuICAgICAgICBpZiAoIXRoaXMuX2hlYXJ0YmVhdFRpbWVvdXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9oZWFydGJlYXQpO1xuXG4gICAgICAgIHRoaXMuX2hlYXJ0YmVhdCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICBfdGhpczYub25FcnJvcihuZXcgTmVzRXJyb3IoJ0Rpc2Nvbm5lY3RpbmcgZHVlIHRvIGhlYXJ0YmVhdCB0aW1lb3V0JywgJ3RpbWVvdXQnKSk7XG4gICAgICAgICAgICBfdGhpczYuX3dzLmNsb3NlKCk7XG4gICAgICAgIH0sIHRoaXMuX2hlYXJ0YmVhdFRpbWVvdXQpO1xuICAgIH07XG5cbiAgICAvLyBFeHBvc2UgaW50ZXJmYWNlXG5cbiAgICByZXR1cm4geyBDbGllbnQ6IENsaWVudCB9O1xufSk7XG4iLCIgIC8qIGdsb2JhbHMgcmVxdWlyZSwgbW9kdWxlICovXG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qKlxuICAgKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICAgKi9cblxuICB2YXIgcGF0aHRvUmVnZXhwID0gcmVxdWlyZSgncGF0aC10by1yZWdleHAnKTtcblxuICAvKipcbiAgICogTW9kdWxlIGV4cG9ydHMuXG4gICAqL1xuXG4gIG1vZHVsZS5leHBvcnRzID0gcGFnZTtcblxuICAvKipcbiAgICogRGV0ZWN0IGNsaWNrIGV2ZW50XG4gICAqL1xuICB2YXIgY2xpY2tFdmVudCA9ICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIGRvY3VtZW50KSAmJiBkb2N1bWVudC5vbnRvdWNoc3RhcnQgPyAndG91Y2hzdGFydCcgOiAnY2xpY2snO1xuXG4gIC8qKlxuICAgKiBUbyB3b3JrIHByb3Blcmx5IHdpdGggdGhlIFVSTFxuICAgKiBoaXN0b3J5LmxvY2F0aW9uIGdlbmVyYXRlZCBwb2x5ZmlsbCBpbiBodHRwczovL2dpdGh1Yi5jb20vZGV2b3RlL0hUTUw1LUhpc3RvcnktQVBJXG4gICAqL1xuXG4gIHZhciBsb2NhdGlvbiA9ICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIHdpbmRvdykgJiYgKHdpbmRvdy5oaXN0b3J5LmxvY2F0aW9uIHx8IHdpbmRvdy5sb2NhdGlvbik7XG5cbiAgLyoqXG4gICAqIFBlcmZvcm0gaW5pdGlhbCBkaXNwYXRjaC5cbiAgICovXG5cbiAgdmFyIGRpc3BhdGNoID0gdHJ1ZTtcblxuXG4gIC8qKlxuICAgKiBEZWNvZGUgVVJMIGNvbXBvbmVudHMgKHF1ZXJ5IHN0cmluZywgcGF0aG5hbWUsIGhhc2gpLlxuICAgKiBBY2NvbW1vZGF0ZXMgYm90aCByZWd1bGFyIHBlcmNlbnQgZW5jb2RpbmcgYW5kIHgtd3d3LWZvcm0tdXJsZW5jb2RlZCBmb3JtYXQuXG4gICAqL1xuICB2YXIgZGVjb2RlVVJMQ29tcG9uZW50cyA9IHRydWU7XG5cbiAgLyoqXG4gICAqIEJhc2UgcGF0aC5cbiAgICovXG5cbiAgdmFyIGJhc2UgPSAnJztcblxuICAvKipcbiAgICogUnVubmluZyBmbGFnLlxuICAgKi9cblxuICB2YXIgcnVubmluZztcblxuICAvKipcbiAgICogSGFzaEJhbmcgb3B0aW9uXG4gICAqL1xuXG4gIHZhciBoYXNoYmFuZyA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBQcmV2aW91cyBjb250ZXh0LCBmb3IgY2FwdHVyaW5nXG4gICAqIHBhZ2UgZXhpdCBldmVudHMuXG4gICAqL1xuXG4gIHZhciBwcmV2Q29udGV4dDtcblxuICAvKipcbiAgICogUmVnaXN0ZXIgYHBhdGhgIHdpdGggY2FsbGJhY2sgYGZuKClgLFxuICAgKiBvciByb3V0ZSBgcGF0aGAsIG9yIHJlZGlyZWN0aW9uLFxuICAgKiBvciBgcGFnZS5zdGFydCgpYC5cbiAgICpcbiAgICogICBwYWdlKGZuKTtcbiAgICogICBwYWdlKCcqJywgZm4pO1xuICAgKiAgIHBhZ2UoJy91c2VyLzppZCcsIGxvYWQsIHVzZXIpO1xuICAgKiAgIHBhZ2UoJy91c2VyLycgKyB1c2VyLmlkLCB7IHNvbWU6ICd0aGluZycgfSk7XG4gICAqICAgcGFnZSgnL3VzZXIvJyArIHVzZXIuaWQpO1xuICAgKiAgIHBhZ2UoJy9mcm9tJywgJy90bycpXG4gICAqICAgcGFnZSgpO1xuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ3xGdW5jdGlvbn0gcGF0aFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbi4uLlxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBmdW5jdGlvbiBwYWdlKHBhdGgsIGZuKSB7XG4gICAgLy8gPGNhbGxiYWNrPlxuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgcGF0aCkge1xuICAgICAgcmV0dXJuIHBhZ2UoJyonLCBwYXRoKTtcbiAgICB9XG5cbiAgICAvLyByb3V0ZSA8cGF0aD4gdG8gPGNhbGxiYWNrIC4uLj5cbiAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGZuKSB7XG4gICAgICB2YXIgcm91dGUgPSBuZXcgUm91dGUocGF0aCk7XG4gICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgICBwYWdlLmNhbGxiYWNrcy5wdXNoKHJvdXRlLm1pZGRsZXdhcmUoYXJndW1lbnRzW2ldKSk7XG4gICAgICB9XG4gICAgICAvLyBzaG93IDxwYXRoPiB3aXRoIFtzdGF0ZV1cbiAgICB9IGVsc2UgaWYgKCdzdHJpbmcnID09PSB0eXBlb2YgcGF0aCkge1xuICAgICAgcGFnZVsnc3RyaW5nJyA9PT0gdHlwZW9mIGZuID8gJ3JlZGlyZWN0JyA6ICdzaG93J10ocGF0aCwgZm4pO1xuICAgICAgLy8gc3RhcnQgW29wdGlvbnNdXG4gICAgfSBlbHNlIHtcbiAgICAgIHBhZ2Uuc3RhcnQocGF0aCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxiYWNrIGZ1bmN0aW9ucy5cbiAgICovXG5cbiAgcGFnZS5jYWxsYmFja3MgPSBbXTtcbiAgcGFnZS5leGl0cyA9IFtdO1xuXG4gIC8qKlxuICAgKiBDdXJyZW50IHBhdGggYmVpbmcgcHJvY2Vzc2VkXG4gICAqIEB0eXBlIHtTdHJpbmd9XG4gICAqL1xuICBwYWdlLmN1cnJlbnQgPSAnJztcblxuICAvKipcbiAgICogTnVtYmVyIG9mIHBhZ2VzIG5hdmlnYXRlZCB0by5cbiAgICogQHR5cGUge251bWJlcn1cbiAgICpcbiAgICogICAgIHBhZ2UubGVuID09IDA7XG4gICAqICAgICBwYWdlKCcvbG9naW4nKTtcbiAgICogICAgIHBhZ2UubGVuID09IDE7XG4gICAqL1xuXG4gIHBhZ2UubGVuID0gMDtcblxuICAvKipcbiAgICogR2V0IG9yIHNldCBiYXNlcGF0aCB0byBgcGF0aGAuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIHBhZ2UuYmFzZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgICBpZiAoMCA9PT0gYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGJhc2U7XG4gICAgYmFzZSA9IHBhdGg7XG4gIH07XG5cbiAgLyoqXG4gICAqIEJpbmQgd2l0aCB0aGUgZ2l2ZW4gYG9wdGlvbnNgLlxuICAgKlxuICAgKiBPcHRpb25zOlxuICAgKlxuICAgKiAgICAtIGBjbGlja2AgYmluZCB0byBjbGljayBldmVudHMgW3RydWVdXG4gICAqICAgIC0gYHBvcHN0YXRlYCBiaW5kIHRvIHBvcHN0YXRlIFt0cnVlXVxuICAgKiAgICAtIGBkaXNwYXRjaGAgcGVyZm9ybSBpbml0aWFsIGRpc3BhdGNoIFt0cnVlXVxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBwYWdlLnN0YXJ0ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIGlmIChydW5uaW5nKSByZXR1cm47XG4gICAgcnVubmluZyA9IHRydWU7XG4gICAgaWYgKGZhbHNlID09PSBvcHRpb25zLmRpc3BhdGNoKSBkaXNwYXRjaCA9IGZhbHNlO1xuICAgIGlmIChmYWxzZSA9PT0gb3B0aW9ucy5kZWNvZGVVUkxDb21wb25lbnRzKSBkZWNvZGVVUkxDb21wb25lbnRzID0gZmFsc2U7XG4gICAgaWYgKGZhbHNlICE9PSBvcHRpb25zLnBvcHN0YXRlKSB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncG9wc3RhdGUnLCBvbnBvcHN0YXRlLCBmYWxzZSk7XG4gICAgaWYgKGZhbHNlICE9PSBvcHRpb25zLmNsaWNrKSB7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKGNsaWNrRXZlbnQsIG9uY2xpY2ssIGZhbHNlKTtcbiAgICB9XG4gICAgaWYgKHRydWUgPT09IG9wdGlvbnMuaGFzaGJhbmcpIGhhc2hiYW5nID0gdHJ1ZTtcbiAgICBpZiAoIWRpc3BhdGNoKSByZXR1cm47XG4gICAgdmFyIHVybCA9IChoYXNoYmFuZyAmJiB+bG9jYXRpb24uaGFzaC5pbmRleE9mKCcjIScpKSA/IGxvY2F0aW9uLmhhc2guc3Vic3RyKDIpICsgbG9jYXRpb24uc2VhcmNoIDogbG9jYXRpb24ucGF0aG5hbWUgKyBsb2NhdGlvbi5zZWFyY2ggKyBsb2NhdGlvbi5oYXNoO1xuICAgIHBhZ2UucmVwbGFjZSh1cmwsIG51bGwsIHRydWUsIGRpc3BhdGNoKTtcbiAgfTtcblxuICAvKipcbiAgICogVW5iaW5kIGNsaWNrIGFuZCBwb3BzdGF0ZSBldmVudCBoYW5kbGVycy5cbiAgICpcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgcGFnZS5zdG9wID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCFydW5uaW5nKSByZXR1cm47XG4gICAgcGFnZS5jdXJyZW50ID0gJyc7XG4gICAgcGFnZS5sZW4gPSAwO1xuICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGNsaWNrRXZlbnQsIG9uY2xpY2ssIGZhbHNlKTtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9wc3RhdGUnLCBvbnBvcHN0YXRlLCBmYWxzZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNob3cgYHBhdGhgIHdpdGggb3B0aW9uYWwgYHN0YXRlYCBvYmplY3QuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzdGF0ZVxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGRpc3BhdGNoXG4gICAqIEByZXR1cm4ge0NvbnRleHR9XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIHBhZ2Uuc2hvdyA9IGZ1bmN0aW9uKHBhdGgsIHN0YXRlLCBkaXNwYXRjaCwgcHVzaCkge1xuICAgIHZhciBjdHggPSBuZXcgQ29udGV4dChwYXRoLCBzdGF0ZSk7XG4gICAgcGFnZS5jdXJyZW50ID0gY3R4LnBhdGg7XG4gICAgaWYgKGZhbHNlICE9PSBkaXNwYXRjaCkgcGFnZS5kaXNwYXRjaChjdHgpO1xuICAgIGlmIChmYWxzZSAhPT0gY3R4LmhhbmRsZWQgJiYgZmFsc2UgIT09IHB1c2gpIGN0eC5wdXNoU3RhdGUoKTtcbiAgICByZXR1cm4gY3R4O1xuICB9O1xuXG4gIC8qKlxuICAgKiBHb2VzIGJhY2sgaW4gdGhlIGhpc3RvcnlcbiAgICogQmFjayBzaG91bGQgYWx3YXlzIGxldCB0aGUgY3VycmVudCByb3V0ZSBwdXNoIHN0YXRlIGFuZCB0aGVuIGdvIGJhY2suXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIC0gZmFsbGJhY2sgcGF0aCB0byBnbyBiYWNrIGlmIG5vIG1vcmUgaGlzdG9yeSBleGlzdHMsIGlmIHVuZGVmaW5lZCBkZWZhdWx0cyB0byBwYWdlLmJhc2VcbiAgICogQHBhcmFtIHtPYmplY3R9IFtzdGF0ZV1cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgcGFnZS5iYWNrID0gZnVuY3Rpb24ocGF0aCwgc3RhdGUpIHtcbiAgICBpZiAocGFnZS5sZW4gPiAwKSB7XG4gICAgICAvLyB0aGlzIG1heSBuZWVkIG1vcmUgdGVzdGluZyB0byBzZWUgaWYgYWxsIGJyb3dzZXJzXG4gICAgICAvLyB3YWl0IGZvciB0aGUgbmV4dCB0aWNrIHRvIGdvIGJhY2sgaW4gaGlzdG9yeVxuICAgICAgaGlzdG9yeS5iYWNrKCk7XG4gICAgICBwYWdlLmxlbi0tO1xuICAgIH0gZWxzZSBpZiAocGF0aCkge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgcGFnZS5zaG93KHBhdGgsIHN0YXRlKTtcbiAgICAgIH0pO1xuICAgIH1lbHNle1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgcGFnZS5zaG93KGJhc2UsIHN0YXRlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciByb3V0ZSB0byByZWRpcmVjdCBmcm9tIG9uZSBwYXRoIHRvIG90aGVyXG4gICAqIG9yIGp1c3QgcmVkaXJlY3QgdG8gYW5vdGhlciByb3V0ZVxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gZnJvbSAtIGlmIHBhcmFtICd0bycgaXMgdW5kZWZpbmVkIHJlZGlyZWN0cyB0byAnZnJvbSdcbiAgICogQHBhcmFtIHtTdHJpbmd9IFt0b11cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG4gIHBhZ2UucmVkaXJlY3QgPSBmdW5jdGlvbihmcm9tLCB0bykge1xuICAgIC8vIERlZmluZSByb3V0ZSBmcm9tIGEgcGF0aCB0byBhbm90aGVyXG4gICAgaWYgKCdzdHJpbmcnID09PSB0eXBlb2YgZnJvbSAmJiAnc3RyaW5nJyA9PT0gdHlwZW9mIHRvKSB7XG4gICAgICBwYWdlKGZyb20sIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBwYWdlLnJlcGxhY2UodG8pO1xuICAgICAgICB9LCAwKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFdhaXQgZm9yIHRoZSBwdXNoIHN0YXRlIGFuZCByZXBsYWNlIGl0IHdpdGggYW5vdGhlclxuICAgIGlmICgnc3RyaW5nJyA9PT0gdHlwZW9mIGZyb20gJiYgJ3VuZGVmaW5lZCcgPT09IHR5cGVvZiB0bykge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgcGFnZS5yZXBsYWNlKGZyb20pO1xuICAgICAgfSwgMCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBSZXBsYWNlIGBwYXRoYCB3aXRoIG9wdGlvbmFsIGBzdGF0ZWAgb2JqZWN0LlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAcGFyYW0ge09iamVjdH0gc3RhdGVcbiAgICogQHJldHVybiB7Q29udGV4dH1cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cblxuICBwYWdlLnJlcGxhY2UgPSBmdW5jdGlvbihwYXRoLCBzdGF0ZSwgaW5pdCwgZGlzcGF0Y2gpIHtcbiAgICB2YXIgY3R4ID0gbmV3IENvbnRleHQocGF0aCwgc3RhdGUpO1xuICAgIHBhZ2UuY3VycmVudCA9IGN0eC5wYXRoO1xuICAgIGN0eC5pbml0ID0gaW5pdDtcbiAgICBjdHguc2F2ZSgpOyAvLyBzYXZlIGJlZm9yZSBkaXNwYXRjaGluZywgd2hpY2ggbWF5IHJlZGlyZWN0XG4gICAgaWYgKGZhbHNlICE9PSBkaXNwYXRjaCkgcGFnZS5kaXNwYXRjaChjdHgpO1xuICAgIHJldHVybiBjdHg7XG4gIH07XG5cbiAgLyoqXG4gICAqIERpc3BhdGNoIHRoZSBnaXZlbiBgY3R4YC5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGN0eFxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgcGFnZS5kaXNwYXRjaCA9IGZ1bmN0aW9uKGN0eCkge1xuICAgIHZhciBwcmV2ID0gcHJldkNvbnRleHQsXG4gICAgICBpID0gMCxcbiAgICAgIGogPSAwO1xuXG4gICAgcHJldkNvbnRleHQgPSBjdHg7XG5cbiAgICBmdW5jdGlvbiBuZXh0RXhpdCgpIHtcbiAgICAgIHZhciBmbiA9IHBhZ2UuZXhpdHNbaisrXTtcbiAgICAgIGlmICghZm4pIHJldHVybiBuZXh0RW50ZXIoKTtcbiAgICAgIGZuKHByZXYsIG5leHRFeGl0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBuZXh0RW50ZXIoKSB7XG4gICAgICB2YXIgZm4gPSBwYWdlLmNhbGxiYWNrc1tpKytdO1xuXG4gICAgICBpZiAoY3R4LnBhdGggIT09IHBhZ2UuY3VycmVudCkge1xuICAgICAgICBjdHguaGFuZGxlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoIWZuKSByZXR1cm4gdW5oYW5kbGVkKGN0eCk7XG4gICAgICBmbihjdHgsIG5leHRFbnRlcik7XG4gICAgfVxuXG4gICAgaWYgKHByZXYpIHtcbiAgICAgIG5leHRFeGl0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5leHRFbnRlcigpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogVW5oYW5kbGVkIGBjdHhgLiBXaGVuIGl0J3Mgbm90IHRoZSBpbml0aWFsXG4gICAqIHBvcHN0YXRlIHRoZW4gcmVkaXJlY3QuIElmIHlvdSB3aXNoIHRvIGhhbmRsZVxuICAgKiA0MDRzIG9uIHlvdXIgb3duIHVzZSBgcGFnZSgnKicsIGNhbGxiYWNrKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29udGV4dH0gY3R4XG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBmdW5jdGlvbiB1bmhhbmRsZWQoY3R4KSB7XG4gICAgaWYgKGN0eC5oYW5kbGVkKSByZXR1cm47XG4gICAgdmFyIGN1cnJlbnQ7XG5cbiAgICBpZiAoaGFzaGJhbmcpIHtcbiAgICAgIGN1cnJlbnQgPSBiYXNlICsgbG9jYXRpb24uaGFzaC5yZXBsYWNlKCcjIScsICcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY3VycmVudCA9IGxvY2F0aW9uLnBhdGhuYW1lICsgbG9jYXRpb24uc2VhcmNoO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50ID09PSBjdHguY2Fub25pY2FsUGF0aCkgcmV0dXJuO1xuICAgIHBhZ2Uuc3RvcCgpO1xuICAgIGN0eC5oYW5kbGVkID0gZmFsc2U7XG4gICAgbG9jYXRpb24uaHJlZiA9IGN0eC5jYW5vbmljYWxQYXRoO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGFuIGV4aXQgcm91dGUgb24gYHBhdGhgIHdpdGhcbiAgICogY2FsbGJhY2sgYGZuKClgLCB3aGljaCB3aWxsIGJlIGNhbGxlZFxuICAgKiBvbiB0aGUgcHJldmlvdXMgY29udGV4dCB3aGVuIGEgbmV3XG4gICAqIHBhZ2UgaXMgdmlzaXRlZC5cbiAgICovXG4gIHBhZ2UuZXhpdCA9IGZ1bmN0aW9uKHBhdGgsIGZuKSB7XG4gICAgaWYgKHR5cGVvZiBwYXRoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gcGFnZS5leGl0KCcqJywgcGF0aCk7XG4gICAgfVxuXG4gICAgdmFyIHJvdXRlID0gbmV3IFJvdXRlKHBhdGgpO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICBwYWdlLmV4aXRzLnB1c2gocm91dGUubWlkZGxld2FyZShhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBVUkwgZW5jb2RpbmcgZnJvbSB0aGUgZ2l2ZW4gYHN0cmAuXG4gICAqIEFjY29tbW9kYXRlcyB3aGl0ZXNwYWNlIGluIGJvdGggeC13d3ctZm9ybS11cmxlbmNvZGVkXG4gICAqIGFuZCByZWd1bGFyIHBlcmNlbnQtZW5jb2RlZCBmb3JtLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cn0gVVJMIGNvbXBvbmVudCB0byBkZWNvZGVcbiAgICovXG4gIGZ1bmN0aW9uIGRlY29kZVVSTEVuY29kZWRVUklDb21wb25lbnQodmFsKSB7XG4gICAgaWYgKHR5cGVvZiB2YWwgIT09ICdzdHJpbmcnKSB7IHJldHVybiB2YWw7IH1cbiAgICByZXR1cm4gZGVjb2RlVVJMQ29tcG9uZW50cyA/IGRlY29kZVVSSUNvbXBvbmVudCh2YWwucmVwbGFjZSgvXFwrL2csICcgJykpIDogdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgYSBuZXcgXCJyZXF1ZXN0XCIgYENvbnRleHRgXG4gICAqIHdpdGggdGhlIGdpdmVuIGBwYXRoYCBhbmQgb3B0aW9uYWwgaW5pdGlhbCBgc3RhdGVgLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAcGFyYW0ge09iamVjdH0gc3RhdGVcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgZnVuY3Rpb24gQ29udGV4dChwYXRoLCBzdGF0ZSkge1xuICAgIGlmICgnLycgPT09IHBhdGhbMF0gJiYgMCAhPT0gcGF0aC5pbmRleE9mKGJhc2UpKSBwYXRoID0gYmFzZSArIChoYXNoYmFuZyA/ICcjIScgOiAnJykgKyBwYXRoO1xuICAgIHZhciBpID0gcGF0aC5pbmRleE9mKCc/Jyk7XG5cbiAgICB0aGlzLmNhbm9uaWNhbFBhdGggPSBwYXRoO1xuICAgIHRoaXMucGF0aCA9IHBhdGgucmVwbGFjZShiYXNlLCAnJykgfHwgJy8nO1xuICAgIGlmIChoYXNoYmFuZykgdGhpcy5wYXRoID0gdGhpcy5wYXRoLnJlcGxhY2UoJyMhJywgJycpIHx8ICcvJztcblxuICAgIHRoaXMudGl0bGUgPSBkb2N1bWVudC50aXRsZTtcbiAgICB0aGlzLnN0YXRlID0gc3RhdGUgfHwge307XG4gICAgdGhpcy5zdGF0ZS5wYXRoID0gcGF0aDtcbiAgICB0aGlzLnF1ZXJ5c3RyaW5nID0gfmkgPyBkZWNvZGVVUkxFbmNvZGVkVVJJQ29tcG9uZW50KHBhdGguc2xpY2UoaSArIDEpKSA6ICcnO1xuICAgIHRoaXMucGF0aG5hbWUgPSBkZWNvZGVVUkxFbmNvZGVkVVJJQ29tcG9uZW50KH5pID8gcGF0aC5zbGljZSgwLCBpKSA6IHBhdGgpO1xuICAgIHRoaXMucGFyYW1zID0ge307XG5cbiAgICAvLyBmcmFnbWVudFxuICAgIHRoaXMuaGFzaCA9ICcnO1xuICAgIGlmICghaGFzaGJhbmcpIHtcbiAgICAgIGlmICghfnRoaXMucGF0aC5pbmRleE9mKCcjJykpIHJldHVybjtcbiAgICAgIHZhciBwYXJ0cyA9IHRoaXMucGF0aC5zcGxpdCgnIycpO1xuICAgICAgdGhpcy5wYXRoID0gcGFydHNbMF07XG4gICAgICB0aGlzLmhhc2ggPSBkZWNvZGVVUkxFbmNvZGVkVVJJQ29tcG9uZW50KHBhcnRzWzFdKSB8fCAnJztcbiAgICAgIHRoaXMucXVlcnlzdHJpbmcgPSB0aGlzLnF1ZXJ5c3RyaW5nLnNwbGl0KCcjJylbMF07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4cG9zZSBgQ29udGV4dGAuXG4gICAqL1xuXG4gIHBhZ2UuQ29udGV4dCA9IENvbnRleHQ7XG5cbiAgLyoqXG4gICAqIFB1c2ggc3RhdGUuXG4gICAqXG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBDb250ZXh0LnByb3RvdHlwZS5wdXNoU3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBwYWdlLmxlbisrO1xuICAgIGhpc3RvcnkucHVzaFN0YXRlKHRoaXMuc3RhdGUsIHRoaXMudGl0bGUsIGhhc2hiYW5nICYmIHRoaXMucGF0aCAhPT0gJy8nID8gJyMhJyArIHRoaXMucGF0aCA6IHRoaXMuY2Fub25pY2FsUGF0aCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNhdmUgdGhlIGNvbnRleHQgc3RhdGUuXG4gICAqXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIENvbnRleHQucHJvdG90eXBlLnNhdmUgPSBmdW5jdGlvbigpIHtcbiAgICBoaXN0b3J5LnJlcGxhY2VTdGF0ZSh0aGlzLnN0YXRlLCB0aGlzLnRpdGxlLCBoYXNoYmFuZyAmJiB0aGlzLnBhdGggIT09ICcvJyA/ICcjIScgKyB0aGlzLnBhdGggOiB0aGlzLmNhbm9uaWNhbFBhdGgpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGBSb3V0ZWAgd2l0aCB0aGUgZ2l2ZW4gSFRUUCBgcGF0aGAsXG4gICAqIGFuZCBhbiBhcnJheSBvZiBgY2FsbGJhY2tzYCBhbmQgYG9wdGlvbnNgLlxuICAgKlxuICAgKiBPcHRpb25zOlxuICAgKlxuICAgKiAgIC0gYHNlbnNpdGl2ZWAgICAgZW5hYmxlIGNhc2Utc2Vuc2l0aXZlIHJvdXRlc1xuICAgKiAgIC0gYHN0cmljdGAgICAgICAgZW5hYmxlIHN0cmljdCBtYXRjaGluZyBmb3IgdHJhaWxpbmcgc2xhc2hlc1xuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucy5cbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIGZ1bmN0aW9uIFJvdXRlKHBhdGgsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0aGlzLnBhdGggPSAocGF0aCA9PT0gJyonKSA/ICcoLiopJyA6IHBhdGg7XG4gICAgdGhpcy5tZXRob2QgPSAnR0VUJztcbiAgICB0aGlzLnJlZ2V4cCA9IHBhdGh0b1JlZ2V4cCh0aGlzLnBhdGgsXG4gICAgICB0aGlzLmtleXMgPSBbXSxcbiAgICAgIG9wdGlvbnMuc2Vuc2l0aXZlLFxuICAgICAgb3B0aW9ucy5zdHJpY3QpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4cG9zZSBgUm91dGVgLlxuICAgKi9cblxuICBwYWdlLlJvdXRlID0gUm91dGU7XG5cbiAgLyoqXG4gICAqIFJldHVybiByb3V0ZSBtaWRkbGV3YXJlIHdpdGhcbiAgICogdGhlIGdpdmVuIGNhbGxiYWNrIGBmbigpYC5cbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAgICogQHJldHVybiB7RnVuY3Rpb259XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIFJvdXRlLnByb3RvdHlwZS5taWRkbGV3YXJlID0gZnVuY3Rpb24oZm4pIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGN0eCwgbmV4dCkge1xuICAgICAgaWYgKHNlbGYubWF0Y2goY3R4LnBhdGgsIGN0eC5wYXJhbXMpKSByZXR1cm4gZm4oY3R4LCBuZXh0KTtcbiAgICAgIG5leHQoKTtcbiAgICB9O1xuICB9O1xuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGlzIHJvdXRlIG1hdGNoZXMgYHBhdGhgLCBpZiBzb1xuICAgKiBwb3B1bGF0ZSBgcGFyYW1zYC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtc1xuICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgUm91dGUucHJvdG90eXBlLm1hdGNoID0gZnVuY3Rpb24ocGF0aCwgcGFyYW1zKSB7XG4gICAgdmFyIGtleXMgPSB0aGlzLmtleXMsXG4gICAgICBxc0luZGV4ID0gcGF0aC5pbmRleE9mKCc/JyksXG4gICAgICBwYXRobmFtZSA9IH5xc0luZGV4ID8gcGF0aC5zbGljZSgwLCBxc0luZGV4KSA6IHBhdGgsXG4gICAgICBtID0gdGhpcy5yZWdleHAuZXhlYyhkZWNvZGVVUklDb21wb25lbnQocGF0aG5hbWUpKTtcblxuICAgIGlmICghbSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDEsIGxlbiA9IG0ubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgIHZhciBrZXkgPSBrZXlzW2kgLSAxXTtcbiAgICAgIHZhciB2YWwgPSBkZWNvZGVVUkxFbmNvZGVkVVJJQ29tcG9uZW50KG1baV0pO1xuICAgICAgaWYgKHZhbCAhPT0gdW5kZWZpbmVkIHx8ICEoaGFzT3duUHJvcGVydHkuY2FsbChwYXJhbXMsIGtleS5uYW1lKSkpIHtcbiAgICAgICAgcGFyYW1zW2tleS5uYW1lXSA9IHZhbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBIYW5kbGUgXCJwb3B1bGF0ZVwiIGV2ZW50cy5cbiAgICovXG5cbiAgdmFyIG9ucG9wc3RhdGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBsb2FkZWQgPSBmYWxzZTtcbiAgICBpZiAoJ3VuZGVmaW5lZCcgPT09IHR5cGVvZiB3aW5kb3cpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcbiAgICAgIGxvYWRlZCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgfSwgMCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIG9ucG9wc3RhdGUoZSkge1xuICAgICAgaWYgKCFsb2FkZWQpIHJldHVybjtcbiAgICAgIGlmIChlLnN0YXRlKSB7XG4gICAgICAgIHZhciBwYXRoID0gZS5zdGF0ZS5wYXRoO1xuICAgICAgICBwYWdlLnJlcGxhY2UocGF0aCwgZS5zdGF0ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYWdlLnNob3cobG9jYXRpb24ucGF0aG5hbWUgKyBsb2NhdGlvbi5oYXNoLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgZmFsc2UpO1xuICAgICAgfVxuICAgIH07XG4gIH0pKCk7XG4gIC8qKlxuICAgKiBIYW5kbGUgXCJjbGlja1wiIGV2ZW50cy5cbiAgICovXG5cbiAgZnVuY3Rpb24gb25jbGljayhlKSB7XG5cbiAgICBpZiAoMSAhPT0gd2hpY2goZSkpIHJldHVybjtcblxuICAgIGlmIChlLm1ldGFLZXkgfHwgZS5jdHJsS2V5IHx8IGUuc2hpZnRLZXkpIHJldHVybjtcbiAgICBpZiAoZS5kZWZhdWx0UHJldmVudGVkKSByZXR1cm47XG5cblxuXG4gICAgLy8gZW5zdXJlIGxpbmtcbiAgICB2YXIgZWwgPSBlLnRhcmdldDtcbiAgICB3aGlsZSAoZWwgJiYgJ0EnICE9PSBlbC5ub2RlTmFtZSkgZWwgPSBlbC5wYXJlbnROb2RlO1xuICAgIGlmICghZWwgfHwgJ0EnICE9PSBlbC5ub2RlTmFtZSkgcmV0dXJuO1xuXG5cblxuICAgIC8vIElnbm9yZSBpZiB0YWcgaGFzXG4gICAgLy8gMS4gXCJkb3dubG9hZFwiIGF0dHJpYnV0ZVxuICAgIC8vIDIuIHJlbD1cImV4dGVybmFsXCIgYXR0cmlidXRlXG4gICAgaWYgKGVsLmhhc0F0dHJpYnV0ZSgnZG93bmxvYWQnKSB8fCBlbC5nZXRBdHRyaWJ1dGUoJ3JlbCcpID09PSAnZXh0ZXJuYWwnKSByZXR1cm47XG5cbiAgICAvLyBlbnN1cmUgbm9uLWhhc2ggZm9yIHRoZSBzYW1lIHBhdGhcbiAgICB2YXIgbGluayA9IGVsLmdldEF0dHJpYnV0ZSgnaHJlZicpO1xuICAgIGlmICghaGFzaGJhbmcgJiYgZWwucGF0aG5hbWUgPT09IGxvY2F0aW9uLnBhdGhuYW1lICYmIChlbC5oYXNoIHx8ICcjJyA9PT0gbGluaykpIHJldHVybjtcblxuXG5cbiAgICAvLyBDaGVjayBmb3IgbWFpbHRvOiBpbiB0aGUgaHJlZlxuICAgIGlmIChsaW5rICYmIGxpbmsuaW5kZXhPZignbWFpbHRvOicpID4gLTEpIHJldHVybjtcblxuICAgIC8vIGNoZWNrIHRhcmdldFxuICAgIGlmIChlbC50YXJnZXQpIHJldHVybjtcblxuICAgIC8vIHgtb3JpZ2luXG4gICAgaWYgKCFzYW1lT3JpZ2luKGVsLmhyZWYpKSByZXR1cm47XG5cblxuXG4gICAgLy8gcmVidWlsZCBwYXRoXG4gICAgdmFyIHBhdGggPSBlbC5wYXRobmFtZSArIGVsLnNlYXJjaCArIChlbC5oYXNoIHx8ICcnKTtcblxuICAgIC8vIHN0cmlwIGxlYWRpbmcgXCIvW2RyaXZlIGxldHRlcl06XCIgb24gTlcuanMgb24gV2luZG93c1xuICAgIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgcGF0aC5tYXRjaCgvXlxcL1thLXpBLVpdOlxcLy8pKSB7XG4gICAgICBwYXRoID0gcGF0aC5yZXBsYWNlKC9eXFwvW2EtekEtWl06XFwvLywgJy8nKTtcbiAgICB9XG5cbiAgICAvLyBzYW1lIHBhZ2VcbiAgICB2YXIgb3JpZyA9IHBhdGg7XG5cbiAgICBpZiAocGF0aC5pbmRleE9mKGJhc2UpID09PSAwKSB7XG4gICAgICBwYXRoID0gcGF0aC5zdWJzdHIoYmFzZS5sZW5ndGgpO1xuICAgIH1cblxuICAgIGlmIChoYXNoYmFuZykgcGF0aCA9IHBhdGgucmVwbGFjZSgnIyEnLCAnJyk7XG5cbiAgICBpZiAoYmFzZSAmJiBvcmlnID09PSBwYXRoKSByZXR1cm47XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgcGFnZS5zaG93KG9yaWcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV2ZW50IGJ1dHRvbi5cbiAgICovXG5cbiAgZnVuY3Rpb24gd2hpY2goZSkge1xuICAgIGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcbiAgICByZXR1cm4gbnVsbCA9PT0gZS53aGljaCA/IGUuYnV0dG9uIDogZS53aGljaDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBgaHJlZmAgaXMgdGhlIHNhbWUgb3JpZ2luLlxuICAgKi9cblxuICBmdW5jdGlvbiBzYW1lT3JpZ2luKGhyZWYpIHtcbiAgICB2YXIgb3JpZ2luID0gbG9jYXRpb24ucHJvdG9jb2wgKyAnLy8nICsgbG9jYXRpb24uaG9zdG5hbWU7XG4gICAgaWYgKGxvY2F0aW9uLnBvcnQpIG9yaWdpbiArPSAnOicgKyBsb2NhdGlvbi5wb3J0O1xuICAgIHJldHVybiAoaHJlZiAmJiAoMCA9PT0gaHJlZi5pbmRleE9mKG9yaWdpbikpKTtcbiAgfVxuXG4gIHBhZ2Uuc2FtZU9yaWdpbiA9IHNhbWVPcmlnaW47XG4iLCJ2YXIgaXNhcnJheSA9IHJlcXVpcmUoJ2lzYXJyYXknKVxuXG4vKipcbiAqIEV4cG9zZSBgcGF0aFRvUmVnZXhwYC5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBwYXRoVG9SZWdleHBcbm1vZHVsZS5leHBvcnRzLnBhcnNlID0gcGFyc2Vcbm1vZHVsZS5leHBvcnRzLmNvbXBpbGUgPSBjb21waWxlXG5tb2R1bGUuZXhwb3J0cy50b2tlbnNUb0Z1bmN0aW9uID0gdG9rZW5zVG9GdW5jdGlvblxubW9kdWxlLmV4cG9ydHMudG9rZW5zVG9SZWdFeHAgPSB0b2tlbnNUb1JlZ0V4cFxuXG4vKipcbiAqIFRoZSBtYWluIHBhdGggbWF0Y2hpbmcgcmVnZXhwIHV0aWxpdHkuXG4gKlxuICogQHR5cGUge1JlZ0V4cH1cbiAqL1xudmFyIFBBVEhfUkVHRVhQID0gbmV3IFJlZ0V4cChbXG4gIC8vIE1hdGNoIGVzY2FwZWQgY2hhcmFjdGVycyB0aGF0IHdvdWxkIG90aGVyd2lzZSBhcHBlYXIgaW4gZnV0dXJlIG1hdGNoZXMuXG4gIC8vIFRoaXMgYWxsb3dzIHRoZSB1c2VyIHRvIGVzY2FwZSBzcGVjaWFsIGNoYXJhY3RlcnMgdGhhdCB3b24ndCB0cmFuc2Zvcm0uXG4gICcoXFxcXFxcXFwuKScsXG4gIC8vIE1hdGNoIEV4cHJlc3Mtc3R5bGUgcGFyYW1ldGVycyBhbmQgdW4tbmFtZWQgcGFyYW1ldGVycyB3aXRoIGEgcHJlZml4XG4gIC8vIGFuZCBvcHRpb25hbCBzdWZmaXhlcy4gTWF0Y2hlcyBhcHBlYXIgYXM6XG4gIC8vXG4gIC8vIFwiLzp0ZXN0KFxcXFxkKyk/XCIgPT4gW1wiL1wiLCBcInRlc3RcIiwgXCJcXGQrXCIsIHVuZGVmaW5lZCwgXCI/XCIsIHVuZGVmaW5lZF1cbiAgLy8gXCIvcm91dGUoXFxcXGQrKVwiICA9PiBbdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgXCJcXGQrXCIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkXVxuICAvLyBcIi8qXCIgICAgICAgICAgICA9PiBbXCIvXCIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgXCIqXCJdXG4gICcoW1xcXFwvLl0pPyg/Oig/OlxcXFw6KFxcXFx3KykoPzpcXFxcKCgoPzpcXFxcXFxcXC58W14oKV0pKylcXFxcKSk/fFxcXFwoKCg/OlxcXFxcXFxcLnxbXigpXSkrKVxcXFwpKShbKyo/XSk/fChcXFxcKikpJ1xuXS5qb2luKCd8JyksICdnJylcblxuLyoqXG4gKiBQYXJzZSBhIHN0cmluZyBmb3IgdGhlIHJhdyB0b2tlbnMuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge0FycmF5fVxuICovXG5mdW5jdGlvbiBwYXJzZSAoc3RyKSB7XG4gIHZhciB0b2tlbnMgPSBbXVxuICB2YXIga2V5ID0gMFxuICB2YXIgaW5kZXggPSAwXG4gIHZhciBwYXRoID0gJydcbiAgdmFyIHJlc1xuXG4gIHdoaWxlICgocmVzID0gUEFUSF9SRUdFWFAuZXhlYyhzdHIpKSAhPSBudWxsKSB7XG4gICAgdmFyIG0gPSByZXNbMF1cbiAgICB2YXIgZXNjYXBlZCA9IHJlc1sxXVxuICAgIHZhciBvZmZzZXQgPSByZXMuaW5kZXhcbiAgICBwYXRoICs9IHN0ci5zbGljZShpbmRleCwgb2Zmc2V0KVxuICAgIGluZGV4ID0gb2Zmc2V0ICsgbS5sZW5ndGhcblxuICAgIC8vIElnbm9yZSBhbHJlYWR5IGVzY2FwZWQgc2VxdWVuY2VzLlxuICAgIGlmIChlc2NhcGVkKSB7XG4gICAgICBwYXRoICs9IGVzY2FwZWRbMV1cbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgLy8gUHVzaCB0aGUgY3VycmVudCBwYXRoIG9udG8gdGhlIHRva2Vucy5cbiAgICBpZiAocGF0aCkge1xuICAgICAgdG9rZW5zLnB1c2gocGF0aClcbiAgICAgIHBhdGggPSAnJ1xuICAgIH1cblxuICAgIHZhciBwcmVmaXggPSByZXNbMl1cbiAgICB2YXIgbmFtZSA9IHJlc1szXVxuICAgIHZhciBjYXB0dXJlID0gcmVzWzRdXG4gICAgdmFyIGdyb3VwID0gcmVzWzVdXG4gICAgdmFyIHN1ZmZpeCA9IHJlc1s2XVxuICAgIHZhciBhc3RlcmlzayA9IHJlc1s3XVxuXG4gICAgdmFyIHJlcGVhdCA9IHN1ZmZpeCA9PT0gJysnIHx8IHN1ZmZpeCA9PT0gJyonXG4gICAgdmFyIG9wdGlvbmFsID0gc3VmZml4ID09PSAnPycgfHwgc3VmZml4ID09PSAnKidcbiAgICB2YXIgZGVsaW1pdGVyID0gcHJlZml4IHx8ICcvJ1xuICAgIHZhciBwYXR0ZXJuID0gY2FwdHVyZSB8fCBncm91cCB8fCAoYXN0ZXJpc2sgPyAnLionIDogJ1teJyArIGRlbGltaXRlciArICddKz8nKVxuXG4gICAgdG9rZW5zLnB1c2goe1xuICAgICAgbmFtZTogbmFtZSB8fCBrZXkrKyxcbiAgICAgIHByZWZpeDogcHJlZml4IHx8ICcnLFxuICAgICAgZGVsaW1pdGVyOiBkZWxpbWl0ZXIsXG4gICAgICBvcHRpb25hbDogb3B0aW9uYWwsXG4gICAgICByZXBlYXQ6IHJlcGVhdCxcbiAgICAgIHBhdHRlcm46IGVzY2FwZUdyb3VwKHBhdHRlcm4pXG4gICAgfSlcbiAgfVxuXG4gIC8vIE1hdGNoIGFueSBjaGFyYWN0ZXJzIHN0aWxsIHJlbWFpbmluZy5cbiAgaWYgKGluZGV4IDwgc3RyLmxlbmd0aCkge1xuICAgIHBhdGggKz0gc3RyLnN1YnN0cihpbmRleClcbiAgfVxuXG4gIC8vIElmIHRoZSBwYXRoIGV4aXN0cywgcHVzaCBpdCBvbnRvIHRoZSBlbmQuXG4gIGlmIChwYXRoKSB7XG4gICAgdG9rZW5zLnB1c2gocGF0aClcbiAgfVxuXG4gIHJldHVybiB0b2tlbnNcbn1cblxuLyoqXG4gKiBDb21waWxlIGEgc3RyaW5nIHRvIGEgdGVtcGxhdGUgZnVuY3Rpb24gZm9yIHRoZSBwYXRoLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gICBzdHJcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICovXG5mdW5jdGlvbiBjb21waWxlIChzdHIpIHtcbiAgcmV0dXJuIHRva2Vuc1RvRnVuY3Rpb24ocGFyc2Uoc3RyKSlcbn1cblxuLyoqXG4gKiBFeHBvc2UgYSBtZXRob2QgZm9yIHRyYW5zZm9ybWluZyB0b2tlbnMgaW50byB0aGUgcGF0aCBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gdG9rZW5zVG9GdW5jdGlvbiAodG9rZW5zKSB7XG4gIC8vIENvbXBpbGUgYWxsIHRoZSB0b2tlbnMgaW50byByZWdleHBzLlxuICB2YXIgbWF0Y2hlcyA9IG5ldyBBcnJheSh0b2tlbnMubGVuZ3RoKVxuXG4gIC8vIENvbXBpbGUgYWxsIHRoZSBwYXR0ZXJucyBiZWZvcmUgY29tcGlsYXRpb24uXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHR5cGVvZiB0b2tlbnNbaV0gPT09ICdvYmplY3QnKSB7XG4gICAgICBtYXRjaGVzW2ldID0gbmV3IFJlZ0V4cCgnXicgKyB0b2tlbnNbaV0ucGF0dGVybiArICckJylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciBwYXRoID0gJydcbiAgICB2YXIgZGF0YSA9IG9iaiB8fCB7fVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciB0b2tlbiA9IHRva2Vuc1tpXVxuXG4gICAgICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgICAgICBwYXRoICs9IHRva2VuXG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgdmFyIHZhbHVlID0gZGF0YVt0b2tlbi5uYW1lXVxuICAgICAgdmFyIHNlZ21lbnRcblxuICAgICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgICAgaWYgKHRva2VuLm9wdGlvbmFsKSB7XG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIGJlIGRlZmluZWQnKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChpc2FycmF5KHZhbHVlKSkge1xuICAgICAgICBpZiAoIXRva2VuLnJlcGVhdCkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gbm90IHJlcGVhdCwgYnV0IHJlY2VpdmVkIFwiJyArIHZhbHVlICsgJ1wiJylcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBpZiAodG9rZW4ub3B0aW9uYWwpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gbm90IGJlIGVtcHR5JylcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHZhbHVlLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgc2VnbWVudCA9IGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZVtqXSlcblxuICAgICAgICAgIGlmICghbWF0Y2hlc1tpXS50ZXN0KHNlZ21lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBhbGwgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBtYXRjaCBcIicgKyB0b2tlbi5wYXR0ZXJuICsgJ1wiLCBidXQgcmVjZWl2ZWQgXCInICsgc2VnbWVudCArICdcIicpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcGF0aCArPSAoaiA9PT0gMCA/IHRva2VuLnByZWZpeCA6IHRva2VuLmRlbGltaXRlcikgKyBzZWdtZW50XG4gICAgICAgIH1cblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICBzZWdtZW50ID0gZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKVxuXG4gICAgICBpZiAoIW1hdGNoZXNbaV0udGVzdChzZWdtZW50KSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG1hdGNoIFwiJyArIHRva2VuLnBhdHRlcm4gKyAnXCIsIGJ1dCByZWNlaXZlZCBcIicgKyBzZWdtZW50ICsgJ1wiJylcbiAgICAgIH1cblxuICAgICAgcGF0aCArPSB0b2tlbi5wcmVmaXggKyBzZWdtZW50XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdGhcbiAgfVxufVxuXG4vKipcbiAqIEVzY2FwZSBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBzdHJpbmcuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZXNjYXBlU3RyaW5nIChzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oWy4rKj89XiE6JHt9KClbXFxdfFxcL10pL2csICdcXFxcJDEnKVxufVxuXG4vKipcbiAqIEVzY2FwZSB0aGUgY2FwdHVyaW5nIGdyb3VwIGJ5IGVzY2FwaW5nIHNwZWNpYWwgY2hhcmFjdGVycyBhbmQgbWVhbmluZy5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGdyb3VwXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVzY2FwZUdyb3VwIChncm91cCkge1xuICByZXR1cm4gZ3JvdXAucmVwbGFjZSgvKFs9ITokXFwvKCldKS9nLCAnXFxcXCQxJylcbn1cblxuLyoqXG4gKiBBdHRhY2ggdGhlIGtleXMgYXMgYSBwcm9wZXJ0eSBvZiB0aGUgcmVnZXhwLlxuICpcbiAqIEBwYXJhbSAge1JlZ0V4cH0gcmVcbiAqIEBwYXJhbSAge0FycmF5fSAga2V5c1xuICogQHJldHVybiB7UmVnRXhwfVxuICovXG5mdW5jdGlvbiBhdHRhY2hLZXlzIChyZSwga2V5cykge1xuICByZS5rZXlzID0ga2V5c1xuICByZXR1cm4gcmVcbn1cblxuLyoqXG4gKiBHZXQgdGhlIGZsYWdzIGZvciBhIHJlZ2V4cCBmcm9tIHRoZSBvcHRpb25zLlxuICpcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBmbGFncyAob3B0aW9ucykge1xuICByZXR1cm4gb3B0aW9ucy5zZW5zaXRpdmUgPyAnJyA6ICdpJ1xufVxuXG4vKipcbiAqIFB1bGwgb3V0IGtleXMgZnJvbSBhIHJlZ2V4cC5cbiAqXG4gKiBAcGFyYW0gIHtSZWdFeHB9IHBhdGhcbiAqIEBwYXJhbSAge0FycmF5fSAga2V5c1xuICogQHJldHVybiB7UmVnRXhwfVxuICovXG5mdW5jdGlvbiByZWdleHBUb1JlZ2V4cCAocGF0aCwga2V5cykge1xuICAvLyBVc2UgYSBuZWdhdGl2ZSBsb29rYWhlYWQgdG8gbWF0Y2ggb25seSBjYXB0dXJpbmcgZ3JvdXBzLlxuICB2YXIgZ3JvdXBzID0gcGF0aC5zb3VyY2UubWF0Y2goL1xcKCg/IVxcPykvZylcblxuICBpZiAoZ3JvdXBzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBncm91cHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGtleXMucHVzaCh7XG4gICAgICAgIG5hbWU6IGksXG4gICAgICAgIHByZWZpeDogbnVsbCxcbiAgICAgICAgZGVsaW1pdGVyOiBudWxsLFxuICAgICAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgICAgIHJlcGVhdDogZmFsc2UsXG4gICAgICAgIHBhdHRlcm46IG51bGxcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dGFjaEtleXMocGF0aCwga2V5cylcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm0gYW4gYXJyYXkgaW50byBhIHJlZ2V4cC5cbiAqXG4gKiBAcGFyYW0gIHtBcnJheX0gIHBhdGhcbiAqIEBwYXJhbSAge0FycmF5fSAga2V5c1xuICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIGFycmF5VG9SZWdleHAgKHBhdGgsIGtleXMsIG9wdGlvbnMpIHtcbiAgdmFyIHBhcnRzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICBwYXJ0cy5wdXNoKHBhdGhUb1JlZ2V4cChwYXRoW2ldLCBrZXlzLCBvcHRpb25zKS5zb3VyY2UpXG4gIH1cblxuICB2YXIgcmVnZXhwID0gbmV3IFJlZ0V4cCgnKD86JyArIHBhcnRzLmpvaW4oJ3wnKSArICcpJywgZmxhZ3Mob3B0aW9ucykpXG5cbiAgcmV0dXJuIGF0dGFjaEtleXMocmVnZXhwLCBrZXlzKVxufVxuXG4vKipcbiAqIENyZWF0ZSBhIHBhdGggcmVnZXhwIGZyb20gc3RyaW5nIGlucHV0LlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gcGF0aFxuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gc3RyaW5nVG9SZWdleHAgKHBhdGgsIGtleXMsIG9wdGlvbnMpIHtcbiAgdmFyIHRva2VucyA9IHBhcnNlKHBhdGgpXG4gIHZhciByZSA9IHRva2Vuc1RvUmVnRXhwKHRva2Vucywgb3B0aW9ucylcblxuICAvLyBBdHRhY2gga2V5cyBiYWNrIHRvIHRoZSByZWdleHAuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHR5cGVvZiB0b2tlbnNbaV0gIT09ICdzdHJpbmcnKSB7XG4gICAgICBrZXlzLnB1c2godG9rZW5zW2ldKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRhY2hLZXlzKHJlLCBrZXlzKVxufVxuXG4vKipcbiAqIEV4cG9zZSBhIGZ1bmN0aW9uIGZvciB0YWtpbmcgdG9rZW5zIGFuZCByZXR1cm5pbmcgYSBSZWdFeHAuXG4gKlxuICogQHBhcmFtICB7QXJyYXl9ICB0b2tlbnNcbiAqIEBwYXJhbSAge0FycmF5fSAga2V5c1xuICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIHRva2Vuc1RvUmVnRXhwICh0b2tlbnMsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cblxuICB2YXIgc3RyaWN0ID0gb3B0aW9ucy5zdHJpY3RcbiAgdmFyIGVuZCA9IG9wdGlvbnMuZW5kICE9PSBmYWxzZVxuICB2YXIgcm91dGUgPSAnJ1xuICB2YXIgbGFzdFRva2VuID0gdG9rZW5zW3Rva2Vucy5sZW5ndGggLSAxXVxuICB2YXIgZW5kc1dpdGhTbGFzaCA9IHR5cGVvZiBsYXN0VG9rZW4gPT09ICdzdHJpbmcnICYmIC9cXC8kLy50ZXN0KGxhc3RUb2tlbilcblxuICAvLyBJdGVyYXRlIG92ZXIgdGhlIHRva2VucyBhbmQgY3JlYXRlIG91ciByZWdleHAgc3RyaW5nLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIHZhciB0b2tlbiA9IHRva2Vuc1tpXVxuXG4gICAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJvdXRlICs9IGVzY2FwZVN0cmluZyh0b2tlbilcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHByZWZpeCA9IGVzY2FwZVN0cmluZyh0b2tlbi5wcmVmaXgpXG4gICAgICB2YXIgY2FwdHVyZSA9IHRva2VuLnBhdHRlcm5cblxuICAgICAgaWYgKHRva2VuLnJlcGVhdCkge1xuICAgICAgICBjYXB0dXJlICs9ICcoPzonICsgcHJlZml4ICsgY2FwdHVyZSArICcpKidcbiAgICAgIH1cblxuICAgICAgaWYgKHRva2VuLm9wdGlvbmFsKSB7XG4gICAgICAgIGlmIChwcmVmaXgpIHtcbiAgICAgICAgICBjYXB0dXJlID0gJyg/OicgKyBwcmVmaXggKyAnKCcgKyBjYXB0dXJlICsgJykpPydcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYXB0dXJlID0gJygnICsgY2FwdHVyZSArICcpPydcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FwdHVyZSA9IHByZWZpeCArICcoJyArIGNhcHR1cmUgKyAnKSdcbiAgICAgIH1cblxuICAgICAgcm91dGUgKz0gY2FwdHVyZVxuICAgIH1cbiAgfVxuXG4gIC8vIEluIG5vbi1zdHJpY3QgbW9kZSB3ZSBhbGxvdyBhIHNsYXNoIGF0IHRoZSBlbmQgb2YgbWF0Y2guIElmIHRoZSBwYXRoIHRvXG4gIC8vIG1hdGNoIGFscmVhZHkgZW5kcyB3aXRoIGEgc2xhc2gsIHdlIHJlbW92ZSBpdCBmb3IgY29uc2lzdGVuY3kuIFRoZSBzbGFzaFxuICAvLyBpcyB2YWxpZCBhdCB0aGUgZW5kIG9mIGEgcGF0aCBtYXRjaCwgbm90IGluIHRoZSBtaWRkbGUuIFRoaXMgaXMgaW1wb3J0YW50XG4gIC8vIGluIG5vbi1lbmRpbmcgbW9kZSwgd2hlcmUgXCIvdGVzdC9cIiBzaG91bGRuJ3QgbWF0Y2ggXCIvdGVzdC8vcm91dGVcIi5cbiAgaWYgKCFzdHJpY3QpIHtcbiAgICByb3V0ZSA9IChlbmRzV2l0aFNsYXNoID8gcm91dGUuc2xpY2UoMCwgLTIpIDogcm91dGUpICsgJyg/OlxcXFwvKD89JCkpPydcbiAgfVxuXG4gIGlmIChlbmQpIHtcbiAgICByb3V0ZSArPSAnJCdcbiAgfSBlbHNlIHtcbiAgICAvLyBJbiBub24tZW5kaW5nIG1vZGUsIHdlIG5lZWQgdGhlIGNhcHR1cmluZyBncm91cHMgdG8gbWF0Y2ggYXMgbXVjaCBhc1xuICAgIC8vIHBvc3NpYmxlIGJ5IHVzaW5nIGEgcG9zaXRpdmUgbG9va2FoZWFkIHRvIHRoZSBlbmQgb3IgbmV4dCBwYXRoIHNlZ21lbnQuXG4gICAgcm91dGUgKz0gc3RyaWN0ICYmIGVuZHNXaXRoU2xhc2ggPyAnJyA6ICcoPz1cXFxcL3wkKSdcbiAgfVxuXG4gIHJldHVybiBuZXcgUmVnRXhwKCdeJyArIHJvdXRlLCBmbGFncyhvcHRpb25zKSlcbn1cblxuLyoqXG4gKiBOb3JtYWxpemUgdGhlIGdpdmVuIHBhdGggc3RyaW5nLCByZXR1cm5pbmcgYSByZWd1bGFyIGV4cHJlc3Npb24uXG4gKlxuICogQW4gZW1wdHkgYXJyYXkgY2FuIGJlIHBhc3NlZCBpbiBmb3IgdGhlIGtleXMsIHdoaWNoIHdpbGwgaG9sZCB0aGVcbiAqIHBsYWNlaG9sZGVyIGtleSBkZXNjcmlwdGlvbnMuIEZvciBleGFtcGxlLCB1c2luZyBgL3VzZXIvOmlkYCwgYGtleXNgIHdpbGxcbiAqIGNvbnRhaW4gYFt7IG5hbWU6ICdpZCcsIGRlbGltaXRlcjogJy8nLCBvcHRpb25hbDogZmFsc2UsIHJlcGVhdDogZmFsc2UgfV1gLlxuICpcbiAqIEBwYXJhbSAgeyhTdHJpbmd8UmVnRXhwfEFycmF5KX0gcGF0aFxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgICAgICAgICAgICBba2V5c11cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICAgICAgICAgW29wdGlvbnNdXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIHBhdGhUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICBrZXlzID0ga2V5cyB8fCBbXVxuXG4gIGlmICghaXNhcnJheShrZXlzKSkge1xuICAgIG9wdGlvbnMgPSBrZXlzXG4gICAga2V5cyA9IFtdXG4gIH0gZWxzZSBpZiAoIW9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0ge31cbiAgfVxuXG4gIGlmIChwYXRoIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgcmV0dXJuIHJlZ2V4cFRvUmVnZXhwKHBhdGgsIGtleXMsIG9wdGlvbnMpXG4gIH1cblxuICBpZiAoaXNhcnJheShwYXRoKSkge1xuICAgIHJldHVybiBhcnJheVRvUmVnZXhwKHBhdGgsIGtleXMsIG9wdGlvbnMpXG4gIH1cblxuICByZXR1cm4gc3RyaW5nVG9SZWdleHAocGF0aCwga2V5cywgb3B0aW9ucylcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoYXJyKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJyKSA9PSAnW29iamVjdCBBcnJheV0nO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvc3VwZXJtb2RlbHMnKTtcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpXG52YXIgY3JlYXRlV3JhcHBlckZhY3RvcnkgPSByZXF1aXJlKCcuL2ZhY3RvcnknKVxuXG5mdW5jdGlvbiByZXNvbHZlIChmcm9tKSB7XG4gIHZhciBpc0N0b3IgPSB1dGlsLmlzQ29uc3RydWN0b3IoZnJvbSlcbiAgdmFyIGlzU3VwZXJtb2RlbEN0b3IgPSB1dGlsLmlzU3VwZXJtb2RlbENvbnN0cnVjdG9yKGZyb20pXG4gIHZhciBpc0FycmF5ID0gdXRpbC5pc0FycmF5KGZyb20pXG5cbiAgaWYgKGlzQ3RvciB8fCBpc1N1cGVybW9kZWxDdG9yIHx8IGlzQXJyYXkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgX190eXBlOiBmcm9tXG4gICAgfVxuICB9XG5cbiAgdmFyIGlzVmFsdWUgPSAhdXRpbC5pc09iamVjdChmcm9tKVxuICBpZiAoaXNWYWx1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICBfX3ZhbHVlOiBmcm9tXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZyb21cbn1cblxuZnVuY3Rpb24gY3JlYXRlRGVmIChmcm9tKSB7XG4gIGZyb20gPSByZXNvbHZlKGZyb20pXG5cbiAgdmFyIF9fVkFMSURBVE9SUyA9ICdfX3ZhbGlkYXRvcnMnXG4gIHZhciBfX1ZBTFVFID0gJ19fdmFsdWUnXG4gIHZhciBfX1RZUEUgPSAnX190eXBlJ1xuICB2YXIgX19ESVNQTEFZTkFNRSA9ICdfX2Rpc3BsYXlOYW1lJ1xuICB2YXIgX19HRVQgPSAnX19nZXQnXG4gIHZhciBfX1NFVCA9ICdfX3NldCdcbiAgdmFyIF9fRU5VTUVSQUJMRSA9ICdfX2VudW1lcmFibGUnXG4gIHZhciBfX0NPTkZJR1VSQUJMRSA9ICdfX2NvbmZpZ3VyYWJsZSdcbiAgdmFyIF9fV1JJVEFCTEUgPSAnX193cml0YWJsZSdcbiAgdmFyIF9fU1BFQ0lBTF9QUk9QUyA9IFtcbiAgICBfX1ZBTElEQVRPUlMsIF9fVkFMVUUsIF9fVFlQRSwgX19ESVNQTEFZTkFNRSxcbiAgICBfX0dFVCwgX19TRVQsIF9fRU5VTUVSQUJMRSwgX19DT05GSUdVUkFCTEUsIF9fV1JJVEFCTEVcbiAgXVxuXG4gIHZhciBkZWYgPSB7XG4gICAgZnJvbTogZnJvbSxcbiAgICB0eXBlOiBmcm9tW19fVFlQRV0sXG4gICAgdmFsdWU6IGZyb21bX19WQUxVRV0sXG4gICAgdmFsaWRhdG9yczogZnJvbVtfX1ZBTElEQVRPUlNdIHx8IFtdLFxuICAgIGVudW1lcmFibGU6IGZyb21bX19FTlVNRVJBQkxFXSAhPT0gZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiAhIWZyb21bX19DT05GSUdVUkFCTEVdLFxuICAgIHdyaXRhYmxlOiBmcm9tW19fV1JJVEFCTEVdICE9PSBmYWxzZSxcbiAgICBkaXNwbGF5TmFtZTogZnJvbVtfX0RJU1BMQVlOQU1FXSxcbiAgICBnZXR0ZXI6IGZyb21bX19HRVRdLFxuICAgIHNldHRlcjogZnJvbVtfX1NFVF1cbiAgfVxuXG4gIHZhciB0eXBlID0gZGVmLnR5cGVcblxuICAvLyBTaW1wbGUgJ0NvbnN0cnVjdG9yJyBUeXBlXG4gIGlmICh1dGlsLmlzU2ltcGxlQ29uc3RydWN0b3IodHlwZSkpIHtcbiAgICBkZWYuaXNTaW1wbGUgPSB0cnVlXG5cbiAgICBkZWYuY2FzdCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHV0aWwuY2FzdCh2YWx1ZSwgdHlwZSlcbiAgICB9XG4gIH0gZWxzZSBpZiAodXRpbC5pc1N1cGVybW9kZWxDb25zdHJ1Y3Rvcih0eXBlKSkge1xuICAgIGRlZi5pc1JlZmVyZW5jZSA9IHRydWVcbiAgfSBlbHNlIGlmIChkZWYudmFsdWUpIHtcbiAgICAvLyBJZiBhIHZhbHVlIGlzIHByZXNlbnQsIHVzZVxuICAgIC8vIHRoYXQgYW5kIHNob3J0LWNpcmN1aXQgdGhlIHJlc3RcbiAgICBkZWYuaXNTaW1wbGUgPSB0cnVlXG4gIH0gZWxzZSB7XG4gICAgLy8gT3RoZXJ3aXNlIGxvb2sgZm9yIG90aGVyIG5vbi1zcGVjaWFsXG4gICAgLy8ga2V5cyBhbmQgYWxzbyBhbnkgaXRlbSBkZWZpbml0aW9uXG4gICAgLy8gaW4gdGhlIGNhc2Ugb2YgQXJyYXlzXG5cbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGZyb20pXG4gICAgdmFyIGNoaWxkS2V5cyA9IGtleXMuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gX19TUEVDSUFMX1BST1BTLmluZGV4T2YoaXRlbSkgPT09IC0xXG4gICAgfSlcblxuICAgIGlmIChjaGlsZEtleXMubGVuZ3RoKSB7XG4gICAgICB2YXIgZGVmcyA9IHt9XG4gICAgICB2YXIgcHJvdG9cblxuICAgICAgY2hpbGRLZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICB2YXIgZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoZnJvbSwga2V5KVxuICAgICAgICB2YXIgdmFsdWVcblxuICAgICAgICBpZiAoZGVzY3JpcHRvci5nZXQgfHwgZGVzY3JpcHRvci5zZXQpIHtcbiAgICAgICAgICB2YWx1ZSA9IHtcbiAgICAgICAgICAgIF9fZ2V0OiBkZXNjcmlwdG9yLmdldCxcbiAgICAgICAgICAgIF9fc2V0OiBkZXNjcmlwdG9yLnNldFxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWx1ZSA9IGZyb21ba2V5XVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF1dGlsLmlzQ29uc3RydWN0b3IodmFsdWUpICYmICF1dGlsLmlzU3VwZXJtb2RlbENvbnN0cnVjdG9yKHZhbHVlKSAmJiB1dGlsLmlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICAgICAgaWYgKCFwcm90bykge1xuICAgICAgICAgICAgcHJvdG8gPSB7fVxuICAgICAgICAgIH1cbiAgICAgICAgICBwcm90b1trZXldID0gdmFsdWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWZzW2tleV0gPSBjcmVhdGVEZWYodmFsdWUpXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIGRlZi5kZWZzID0gZGVmc1xuICAgICAgZGVmLnByb3RvID0gcHJvdG9cbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgQXJyYXlcbiAgICBpZiAodHlwZSA9PT0gQXJyYXkgfHwgdXRpbC5pc0FycmF5KHR5cGUpKSB7XG4gICAgICBkZWYuaXNBcnJheSA9IHRydWVcblxuICAgICAgaWYgKHR5cGUubGVuZ3RoID4gMCkge1xuICAgICAgICBkZWYuZGVmID0gY3JlYXRlRGVmKHR5cGVbMF0pXG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjaGlsZEtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBkZWYuaXNTaW1wbGUgPSB0cnVlXG4gICAgfVxuICB9XG5cbiAgZGVmLmNyZWF0ZSA9IGNyZWF0ZVdyYXBwZXJGYWN0b3J5KGRlZilcblxuICByZXR1cm4gZGVmXG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlRGVmXG4iLCIndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgdmFyIGFyciA9IFtdXG5cbiAgLyoqXG4gICAqIFByb3hpZWQgYXJyYXkgbXV0YXRvcnMgbWV0aG9kc1xuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gICAqIEByZXR1cm4ge09iamVjdH1cbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuICB2YXIgcG9wID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZXN1bHQgPSBBcnJheS5wcm90b3R5cGUucG9wLmFwcGx5KGFycilcblxuICAgIGNhbGxiYWNrKCdwb3AnLCBhcnIsIHtcbiAgICAgIHZhbHVlOiByZXN1bHRcbiAgICB9KVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG4gIHZhciBwdXNoID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZXN1bHQgPSBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShhcnIsIGFyZ3VtZW50cylcblxuICAgIGNhbGxiYWNrKCdwdXNoJywgYXJyLCB7XG4gICAgICB2YWx1ZTogcmVzdWx0XG4gICAgfSlcblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICB2YXIgc2hpZnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlc3VsdCA9IEFycmF5LnByb3RvdHlwZS5zaGlmdC5hcHBseShhcnIpXG5cbiAgICBjYWxsYmFjaygnc2hpZnQnLCBhcnIsIHtcbiAgICAgIHZhbHVlOiByZXN1bHRcbiAgICB9KVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG4gIHZhciBzb3J0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZXN1bHQgPSBBcnJheS5wcm90b3R5cGUuc29ydC5hcHBseShhcnIsIGFyZ3VtZW50cylcblxuICAgIGNhbGxiYWNrKCdzb3J0JywgYXJyLCB7XG4gICAgICB2YWx1ZTogcmVzdWx0XG4gICAgfSlcblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICB2YXIgdW5zaGlmdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVzdWx0ID0gQXJyYXkucHJvdG90eXBlLnVuc2hpZnQuYXBwbHkoYXJyLCBhcmd1bWVudHMpXG5cbiAgICBjYWxsYmFjaygndW5zaGlmdCcsIGFyciwge1xuICAgICAgdmFsdWU6IHJlc3VsdFxuICAgIH0pXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbiAgdmFyIHJldmVyc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlc3VsdCA9IEFycmF5LnByb3RvdHlwZS5yZXZlcnNlLmFwcGx5KGFycilcblxuICAgIGNhbGxiYWNrKCdyZXZlcnNlJywgYXJyLCB7XG4gICAgICB2YWx1ZTogcmVzdWx0XG4gICAgfSlcblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICB2YXIgc3BsaWNlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdmFyIHJlc3VsdCA9IEFycmF5LnByb3RvdHlwZS5zcGxpY2UuYXBwbHkoYXJyLCBhcmd1bWVudHMpXG5cbiAgICBjYWxsYmFjaygnc3BsaWNlJywgYXJyLCB7XG4gICAgICB2YWx1ZTogcmVzdWx0LFxuICAgICAgcmVtb3ZlZDogcmVzdWx0LFxuICAgICAgYWRkZWQ6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMilcbiAgICB9KVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIFByb3h5IGFsbCBBcnJheS5wcm90b3R5cGUgbXV0YXRvciBtZXRob2RzIG9uIHRoaXMgYXJyYXkgaW5zdGFuY2VcbiAgICovXG4gIGFyci5wb3AgPSBhcnIucG9wICYmIHBvcFxuICBhcnIucHVzaCA9IGFyci5wdXNoICYmIHB1c2hcbiAgYXJyLnNoaWZ0ID0gYXJyLnNoaWZ0ICYmIHNoaWZ0XG4gIGFyci51bnNoaWZ0ID0gYXJyLnVuc2hpZnQgJiYgdW5zaGlmdFxuICBhcnIuc29ydCA9IGFyci5zb3J0ICYmIHNvcnRcbiAgYXJyLnJldmVyc2UgPSBhcnIucmV2ZXJzZSAmJiByZXZlcnNlXG4gIGFyci5zcGxpY2UgPSBhcnIuc3BsaWNlICYmIHNwbGljZVxuXG4gIC8qKlxuICAgKiBTcGVjaWFsIHVwZGF0ZSBmdW5jdGlvbiBzaW5jZSB3ZSBjYW4ndCBkZXRlY3RcbiAgICogYXNzaWdubWVudCBieSBpbmRleCBlLmcuIGFyclswXSA9ICdzb21ldGhpbmcnXG4gICAqL1xuICBhcnIudXBkYXRlID0gZnVuY3Rpb24gKGluZGV4LCB2YWx1ZSkge1xuICAgIHZhciBvbGRWYWx1ZSA9IGFycltpbmRleF1cbiAgICB2YXIgbmV3VmFsdWUgPSBhcnJbaW5kZXhdID0gdmFsdWVcblxuICAgIGNhbGxiYWNrKCd1cGRhdGUnLCBhcnIsIHtcbiAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgIHZhbHVlOiBuZXdWYWx1ZSxcbiAgICAgIG9sZFZhbHVlOiBvbGRWYWx1ZVxuICAgIH0pXG5cbiAgICByZXR1cm4gbmV3VmFsdWVcbiAgfVxuXG4gIHJldHVybiBhcnJcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEVtaXR0ZXJFdmVudCAobmFtZSwgcGF0aCwgdGFyZ2V0LCBkZXRhaWwpIHtcbiAgdGhpcy5uYW1lID0gbmFtZVxuICB0aGlzLnBhdGggPSBwYXRoXG4gIHRoaXMudGFyZ2V0ID0gdGFyZ2V0XG5cbiAgaWYgKGRldGFpbCkge1xuICAgIHRoaXMuZGV0YWlsID0gZGV0YWlsXG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG4vKipcbiAqIEV4cG9zZSBgRW1pdHRlcmAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBFbWl0dGVyXG5cbi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgRW1pdHRlcmAuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBFbWl0dGVyIChvYmopIHtcbiAgdmFyIGN0eCA9IG9iaiB8fCB0aGlzXG5cbiAgaWYgKG9iaikge1xuICAgIGN0eCA9IG1peGluKG9iailcbiAgICByZXR1cm4gY3R4XG4gIH1cbn1cblxuLyoqXG4gKiBNaXhpbiB0aGUgZW1pdHRlciBwcm9wZXJ0aWVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIG1peGluIChvYmopIHtcbiAgZm9yICh2YXIga2V5IGluIEVtaXR0ZXIucHJvdG90eXBlKSB7XG4gICAgb2JqW2tleV0gPSBFbWl0dGVyLnByb3RvdHlwZVtrZXldXG4gIH1cbiAgcmV0dXJuIG9ialxufVxuXG4vKipcbiAqIExpc3RlbiBvbiB0aGUgZ2l2ZW4gYGV2ZW50YCB3aXRoIGBmbmAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub24gPSBFbWl0dGVyLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKGV2ZW50LCBmbikge1xuICAodGhpcy5fX2NhbGxiYWNrc1tldmVudF0gPSB0aGlzLl9fY2FsbGJhY2tzW2V2ZW50XSB8fCBbXSlcbiAgICAucHVzaChmbilcbiAgcmV0dXJuIHRoaXNcbn1cblxuLyoqXG4gKiBBZGRzIGFuIGBldmVudGAgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGludm9rZWQgYSBzaW5nbGVcbiAqIHRpbWUgdGhlbiBhdXRvbWF0aWNhbGx5IHJlbW92ZWQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIChldmVudCwgZm4pIHtcbiAgZnVuY3Rpb24gb24gKCkge1xuICAgIHRoaXMub2ZmKGV2ZW50LCBvbilcbiAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gIH1cblxuICBvbi5mbiA9IGZuXG4gIHRoaXMub24oZXZlbnQsIG9uKVxuICByZXR1cm4gdGhpc1xufVxuXG4vKipcbiAqIFJlbW92ZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgZm9yIGBldmVudGAgb3IgYWxsXG4gKiByZWdpc3RlcmVkIGNhbGxiYWNrcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24gKGV2ZW50LCBmbikge1xuICAvLyBhbGxcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICB0aGlzLl9fY2FsbGJhY2tzID0ge31cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLy8gc3BlY2lmaWMgZXZlbnRcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuX19jYWxsYmFja3NbZXZlbnRdXG4gIGlmICghY2FsbGJhY2tzKSB7XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8vIHJlbW92ZSBhbGwgaGFuZGxlcnNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICBkZWxldGUgdGhpcy5fX2NhbGxiYWNrc1tldmVudF1cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLy8gcmVtb3ZlIHNwZWNpZmljIGhhbmRsZXJcbiAgdmFyIGNiXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgY2IgPSBjYWxsYmFja3NbaV1cbiAgICBpZiAoY2IgPT09IGZuIHx8IGNiLmZuID09PSBmbikge1xuICAgICAgY2FsbGJhY2tzLnNwbGljZShpLCAxKVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuLyoqXG4gKiBFbWl0IGBldmVudGAgd2l0aCB0aGUgZ2l2ZW4gYXJncy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7TWl4ZWR9IC4uLlxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpXG4gIHZhciBjYWxsYmFja3MgPSB0aGlzLl9fY2FsbGJhY2tzW2V2ZW50XVxuXG4gIGlmIChjYWxsYmFja3MpIHtcbiAgICBjYWxsYmFja3MgPSBjYWxsYmFja3Muc2xpY2UoMClcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gY2FsbGJhY2tzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICBjYWxsYmFja3NbaV0uYXBwbHkodGhpcywgYXJncylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vKipcbiAqIFJldHVybiBhcnJheSBvZiBjYWxsYmFja3MgZm9yIGBldmVudGAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gIHJldHVybiB0aGlzLl9fY2FsbGJhY2tzW2V2ZW50XSB8fCBbXVxufVxuXG4vKipcbiAqIENoZWNrIGlmIHRoaXMgZW1pdHRlciBoYXMgYGV2ZW50YCBoYW5kbGVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLmhhc0xpc3RlbmVycyA9IGZ1bmN0aW9uIChldmVudCkge1xuICByZXR1cm4gISF0aGlzLmxpc3RlbmVycyhldmVudCkubGVuZ3RoXG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKVxudmFyIGNyZWF0ZU1vZGVsUHJvdG90eXBlID0gcmVxdWlyZSgnLi9wcm90bycpXG52YXIgV3JhcHBlciA9IHJlcXVpcmUoJy4vd3JhcHBlcicpXG5cbmZ1bmN0aW9uIGNyZWF0ZU1vZGVsRGVzY3JpcHRvcnMgKGRlZiwgcGFyZW50KSB7XG4gIHZhciBfXyA9IHt9XG5cbiAgdmFyIGRlc2MgPSB7XG4gICAgX186IHtcbiAgICAgIHZhbHVlOiBfX1xuICAgIH0sXG4gICAgX19kZWY6IHtcbiAgICAgIHZhbHVlOiBkZWZcbiAgICB9LFxuICAgIF9fcGFyZW50OiB7XG4gICAgICB2YWx1ZTogcGFyZW50LFxuICAgICAgd3JpdGFibGU6IHRydWVcbiAgICB9LFxuICAgIF9fY2FsbGJhY2tzOiB7XG4gICAgICB2YWx1ZToge30sXG4gICAgICB3cml0YWJsZTogdHJ1ZVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBkZXNjXG59XG5cbmZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXMgKG1vZGVsKSB7XG4gIHZhciBkZWZzID0gbW9kZWwuX19kZWYuZGVmc1xuICBmb3IgKHZhciBrZXkgaW4gZGVmcykge1xuICAgIGRlZmluZVByb3BlcnR5KG1vZGVsLCBrZXksIGRlZnNba2V5XSlcbiAgfVxufVxuXG5mdW5jdGlvbiBkZWZpbmVQcm9wZXJ0eSAobW9kZWwsIGtleSwgZGVmKSB7XG4gIHZhciBkZXNjID0ge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX19nZXQoa2V5KVxuICAgIH0sXG4gICAgZW51bWVyYWJsZTogZGVmLmVudW1lcmFibGUsXG4gICAgY29uZmlndXJhYmxlOiBkZWYuY29uZmlndXJhYmxlXG4gIH1cblxuICBpZiAoZGVmLndyaXRhYmxlKSB7XG4gICAgZGVzYy5zZXQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHRoaXMuX19zZXROb3RpZnlDaGFuZ2Uoa2V5LCB2YWx1ZSlcbiAgICB9XG4gIH1cblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkobW9kZWwsIGtleSwgZGVzYylcblxuICAvLyBTaWxlbnRseSBpbml0aWFsaXplIHRoZSBwcm9wZXJ0eSB3cmFwcGVyXG4gIG1vZGVsLl9fW2tleV0gPSBkZWYuY3JlYXRlKG1vZGVsKVxufVxuXG5mdW5jdGlvbiBjcmVhdGVXcmFwcGVyRmFjdG9yeSAoZGVmKSB7XG4gIHZhciB3cmFwcGVyLCBkZWZhdWx0VmFsdWUsIGFzc2VydFxuXG4gIGlmIChkZWYuaXNTaW1wbGUpIHtcbiAgICB3cmFwcGVyID0gbmV3IFdyYXBwZXIoZGVmLnZhbHVlLCBkZWYud3JpdGFibGUsIGRlZi52YWxpZGF0b3JzLCBkZWYuZ2V0dGVyLCBkZWYuc2V0dGVyLCBkZWYuY2FzdCwgbnVsbClcbiAgfSBlbHNlIGlmIChkZWYuaXNSZWZlcmVuY2UpIHtcbiAgICAvLyBIb2xkIGEgcmVmZXJlbmNlIHRvIHRoZVxuICAgIC8vIHJlZmVyZXJlbmNlZCB0eXBlcycgZGVmaW5pdGlvblxuICAgIHZhciByZWZEZWYgPSBkZWYudHlwZS5kZWZcblxuICAgIGlmIChyZWZEZWYuaXNTaW1wbGUpIHtcbiAgICAgIC8vIElmIHRoZSByZWZlcmVuY2VkIHR5cGUgaXMgaXRzZWxmIHNpbXBsZSxcbiAgICAgIC8vIHdlIGNhbiBzZXQganVzdCByZXR1cm4gYSB3cmFwcGVyIGFuZFxuICAgICAgLy8gdGhlIHByb3BlcnR5IHdpbGwgZ2V0IGluaXRpYWxpemVkLlxuICAgICAgd3JhcHBlciA9IG5ldyBXcmFwcGVyKHJlZkRlZi52YWx1ZSwgcmVmRGVmLndyaXRhYmxlLCByZWZEZWYudmFsaWRhdG9ycywgZGVmLmdldHRlciwgZGVmLnNldHRlciwgcmVmRGVmLmNhc3QsIG51bGwpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHdlJ3JlIG5vdCBkZWFsaW5nIHdpdGggYSBzaW1wbGUgcmVmZXJlbmNlIG1vZGVsXG4gICAgICAvLyB3ZSBuZWVkIHRvIGRlZmluZSBhbiBhc3NlcnRpb24gdGhhdCB0aGUgaW5zdGFuY2VcbiAgICAgIC8vIGJlaW5nIHNldCBpcyBvZiB0aGUgY29ycmVjdCB0eXBlLiBXZSBkbyB0aGlzIGJlXG4gICAgICAvLyBjb21wYXJpbmcgdGhlIGRlZnMuXG5cbiAgICAgIGFzc2VydCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAvLyBjb21wYXJlIHRoZSBkZWZpbnRpb25zIG9mIHRoZSB2YWx1ZSBpbnN0YW5jZVxuICAgICAgICAvLyBiZWluZyBwYXNzZWQgYW5kIHRoZSBkZWYgcHJvcGVydHkgYXR0YWNoZWRcbiAgICAgICAgLy8gdG8gdGhlIHR5cGUgU3VwZXJtb2RlbENvbnN0cnVjdG9yLiBBbGxvdyB0aGVcbiAgICAgICAgLy8gdmFsdWUgdG8gYmUgdW5kZWZpbmVkIG9yIG51bGwgYWxzby5cbiAgICAgICAgdmFyIGlzQ29ycmVjdFR5cGUgPSBmYWxzZVxuXG4gICAgICAgIGlmICh1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICAgIGlzQ29ycmVjdFR5cGUgPSB0cnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaXNDb3JyZWN0VHlwZSA9IHJlZkRlZiA9PT0gdmFsdWUuX19kZWZcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaXNDb3JyZWN0VHlwZSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVmFsdWUgc2hvdWxkIGJlIGFuIGluc3RhbmNlIG9mIHRoZSByZWZlcmVuY2VkIG1vZGVsLCBudWxsIG9yIHVuZGVmaW5lZCcpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgd3JhcHBlciA9IG5ldyBXcmFwcGVyKGRlZi52YWx1ZSwgZGVmLndyaXRhYmxlLCBkZWYudmFsaWRhdG9ycywgZGVmLmdldHRlciwgZGVmLnNldHRlciwgbnVsbCwgYXNzZXJ0KVxuICAgIH1cbiAgfSBlbHNlIGlmIChkZWYuaXNBcnJheSkge1xuICAgIGRlZmF1bHRWYWx1ZSA9IGZ1bmN0aW9uIChwYXJlbnQpIHtcbiAgICAgIC8vIGZvciBBcnJheXMsIHdlIGNyZWF0ZSBhIG5ldyBBcnJheSBhbmQgZWFjaFxuICAgICAgLy8gdGltZSwgbWl4IHRoZSBtb2RlbCBwcm9wZXJ0aWVzIGludG8gaXRcbiAgICAgIHZhciBtb2RlbCA9IGNyZWF0ZU1vZGVsUHJvdG90eXBlKGRlZilcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKG1vZGVsLCBjcmVhdGVNb2RlbERlc2NyaXB0b3JzKGRlZiwgcGFyZW50KSlcbiAgICAgIGRlZmluZVByb3BlcnRpZXMobW9kZWwpXG4gICAgICByZXR1cm4gbW9kZWxcbiAgICB9XG5cbiAgICBhc3NlcnQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIC8vIHRvZG86IGZ1cnRoZXIgYXJyYXkgdHlwZSB2YWxpZGF0aW9uXG4gICAgICBpZiAoIXV0aWwuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdWYWx1ZSBzaG91bGQgYmUgYW4gYXJyYXknKVxuICAgICAgfVxuICAgIH1cblxuICAgIHdyYXBwZXIgPSBuZXcgV3JhcHBlcihkZWZhdWx0VmFsdWUsIGRlZi53cml0YWJsZSwgZGVmLnZhbGlkYXRvcnMsIGRlZi5nZXR0ZXIsIGRlZi5zZXR0ZXIsIG51bGwsIGFzc2VydClcbiAgfSBlbHNlIHtcbiAgICAvLyBmb3IgT2JqZWN0cywgd2UgY2FuIGNyZWF0ZSBhbmQgcmV1c2VcbiAgICAvLyBhIHByb3RvdHlwZSBvYmplY3QuIFdlIHRoZW4gbmVlZCB0byBvbmx5XG4gICAgLy8gZGVmaW5lIHRoZSBkZWZzIGFuZCB0aGUgJ2luc3RhbmNlJyBwcm9wZXJ0aWVzXG4gICAgLy8gZS5nLiBfXywgcGFyZW50IGV0Yy5cbiAgICB2YXIgcHJvdG8gPSBjcmVhdGVNb2RlbFByb3RvdHlwZShkZWYpXG5cbiAgICBkZWZhdWx0VmFsdWUgPSBmdW5jdGlvbiAocGFyZW50KSB7XG4gICAgICB2YXIgbW9kZWwgPSBPYmplY3QuY3JlYXRlKHByb3RvLCBjcmVhdGVNb2RlbERlc2NyaXB0b3JzKGRlZiwgcGFyZW50KSlcbiAgICAgIGRlZmluZVByb3BlcnRpZXMobW9kZWwpXG4gICAgICByZXR1cm4gbW9kZWxcbiAgICB9XG5cbiAgICBhc3NlcnQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICghcHJvdG8uaXNQcm90b3R5cGVPZih2YWx1ZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHByb3RvdHlwZScpXG4gICAgICB9XG4gICAgfVxuXG4gICAgd3JhcHBlciA9IG5ldyBXcmFwcGVyKGRlZmF1bHRWYWx1ZSwgZGVmLndyaXRhYmxlLCBkZWYudmFsaWRhdG9ycywgZGVmLmdldHRlciwgZGVmLnNldHRlciwgbnVsbCwgYXNzZXJ0KVxuICB9XG5cbiAgdmFyIGZhY3RvcnkgPSBmdW5jdGlvbiAocGFyZW50KSB7XG4gICAgdmFyIHdyYXAgPSBPYmplY3QuY3JlYXRlKHdyYXBwZXIpXG4gICAgLy8gaWYgKCF3cmFwLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICB3cmFwLl9pbml0aWFsaXplKHBhcmVudClcbiAgICAvLyB9XG4gICAgcmV0dXJuIHdyYXBcbiAgfVxuXG4gIC8vIGV4cG9zZSB0aGUgd3JhcHBlciwgdGhpcyBpcyB1c2VkXG4gIC8vIGZvciB2YWxpZGF0aW5nIGFycmF5IGl0ZW1zIGxhdGVyXG4gIGZhY3Rvcnkud3JhcHBlciA9IHdyYXBwZXJcblxuICByZXR1cm4gZmFjdG9yeVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVdyYXBwZXJGYWN0b3J5XG4iLCIndXNlIHN0cmljdCdcblxuZnVuY3Rpb24gbWVyZ2UgKG1vZGVsLCBvYmopIHtcbiAgdmFyIGlzQXJyYXkgPSBtb2RlbC5fX2RlZi5pc0FycmF5XG4gIHZhciBkZWZzID0gbW9kZWwuX19kZWYuZGVmc1xuICB2YXIgZGVmS2V5cywgZGVmLCBrZXksIGksIGlzU2ltcGxlLFxuICAgIGlzU2ltcGxlUmVmZXJlbmNlLCBpc0luaXRpYWxpemVkUmVmZXJlbmNlXG5cbiAgaWYgKGRlZnMpIHtcbiAgICBkZWZLZXlzID0gT2JqZWN0LmtleXMoZGVmcylcbiAgICBmb3IgKGkgPSAwOyBpIDwgZGVmS2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAga2V5ID0gZGVmS2V5c1tpXVxuICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIGRlZiA9IGRlZnNba2V5XVxuXG4gICAgICAgIGlzU2ltcGxlID0gZGVmLmlzU2ltcGxlXG4gICAgICAgIGlzU2ltcGxlUmVmZXJlbmNlID0gZGVmLmlzUmVmZXJlbmNlICYmIGRlZi50eXBlLmRlZi5pc1NpbXBsZVxuICAgICAgICBpc0luaXRpYWxpemVkUmVmZXJlbmNlID0gZGVmLmlzUmVmZXJlbmNlICYmIG9ialtrZXldICYmIG9ialtrZXldLl9fc3VwZXJtb2RlbFxuXG4gICAgICAgIGlmIChpc1NpbXBsZSB8fCBpc1NpbXBsZVJlZmVyZW5jZSB8fCBpc0luaXRpYWxpemVkUmVmZXJlbmNlKSB7XG4gICAgICAgICAgbW9kZWxba2V5XSA9IG9ialtrZXldXG4gICAgICAgIH0gZWxzZSBpZiAob2JqW2tleV0pIHtcbiAgICAgICAgICBpZiAoZGVmLmlzUmVmZXJlbmNlKSB7XG4gICAgICAgICAgICBtb2RlbFtrZXldID0gZGVmLnR5cGUoKVxuICAgICAgICAgIH1cbiAgICAgICAgICBtZXJnZShtb2RlbFtrZXldLCBvYmpba2V5XSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChpc0FycmF5ICYmIEFycmF5LmlzQXJyYXkob2JqKSkge1xuICAgIGZvciAoaSA9IDA7IGkgPCBvYmoubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChvYmpbaV0gJiYgb2JqW2ldLl9fc3VwZXJtb2RlbCkge1xuICAgICAgICBtb2RlbC5wdXNoKG9ialtpXSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBpdGVtID0gbW9kZWwuY3JlYXRlKClcbiAgICAgICAgbW9kZWwucHVzaChpdGVtICYmIGl0ZW0uX19zdXBlcm1vZGVsID8gbWVyZ2UoaXRlbSwgb2JqW2ldKSA6IG9ialtpXSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbW9kZWxcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBtZXJnZVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBFbWl0dGVyRXZlbnQgPSByZXF1aXJlKCcuL2VtaXR0ZXItZXZlbnQnKVxudmFyIFZhbGlkYXRpb25FcnJvciA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbi1lcnJvcicpXG52YXIgV3JhcHBlciA9IHJlcXVpcmUoJy4vd3JhcHBlcicpXG52YXIgbWVyZ2UgPSByZXF1aXJlKCcuL21lcmdlJylcblxudmFyIGRlc2NyaXB0b3JzID0ge1xuICBfX3N1cGVybW9kZWw6IHtcbiAgICB2YWx1ZTogdHJ1ZVxuICB9LFxuICBfX2tleXM6IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXModGhpcylcblxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcykpIHtcbiAgICAgICAgdmFyIG9taXQgPSBbXG4gICAgICAgICAgJ2FkZEV2ZW50TGlzdGVuZXInLCAnb24nLCAnb25jZScsICdyZW1vdmVFdmVudExpc3RlbmVyJywgJ3JlbW92ZUFsbExpc3RlbmVycycsXG4gICAgICAgICAgJ3JlbW92ZUxpc3RlbmVyJywgJ29mZicsICdlbWl0JywgJ2xpc3RlbmVycycsICdoYXNMaXN0ZW5lcnMnLCAncG9wJywgJ3B1c2gnLFxuICAgICAgICAgICdyZXZlcnNlJywgJ3NoaWZ0JywgJ3NvcnQnLCAnc3BsaWNlJywgJ3VwZGF0ZScsICd1bnNoaWZ0JywgJ2NyZWF0ZScsICdfX21lcmdlJyxcbiAgICAgICAgICAnX19zZXROb3RpZnlDaGFuZ2UnLCAnX19ub3RpZnlDaGFuZ2UnLCAnX19zZXQnLCAnX19nZXQnLCAnX19jaGFpbicsICdfX3JlbGF0aXZlUGF0aCdcbiAgICAgICAgXVxuXG4gICAgICAgIGtleXMgPSBrZXlzLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgIHJldHVybiBvbWl0LmluZGV4T2YoaXRlbSkgPCAwXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBrZXlzXG4gICAgfVxuICB9LFxuICBfX25hbWU6IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLl9faXNSb290KSB7XG4gICAgICAgIHJldHVybiAnJ1xuICAgICAgfVxuXG4gICAgICAvLyBXb3JrIG91dCB0aGUgJ25hbWUnIG9mIHRoZSBtb2RlbFxuICAgICAgLy8gTG9vayB1cCB0byB0aGUgcGFyZW50IGFuZCBsb29wIHRocm91Z2ggaXQncyBrZXlzLFxuICAgICAgLy8gQW55IHZhbHVlIG9yIGFycmF5IGZvdW5kIHRvIGNvbnRhaW4gdGhlIHZhbHVlIG9mIHRoaXMgKHRoaXMgbW9kZWwpXG4gICAgICAvLyB0aGVuIHdlIHJldHVybiB0aGUga2V5IGFuZCBpbmRleCBpbiB0aGUgY2FzZSB3ZSBmb3VuZCB0aGUgbW9kZWwgaW4gYW4gYXJyYXkuXG4gICAgICB2YXIgcGFyZW50S2V5cyA9IHRoaXMuX19wYXJlbnQuX19rZXlzXG4gICAgICB2YXIgcGFyZW50S2V5LCBwYXJlbnRWYWx1ZVxuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcmVudEtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcGFyZW50S2V5ID0gcGFyZW50S2V5c1tpXVxuICAgICAgICBwYXJlbnRWYWx1ZSA9IHRoaXMuX19wYXJlbnRbcGFyZW50S2V5XVxuXG4gICAgICAgIGlmIChwYXJlbnRWYWx1ZSA9PT0gdGhpcykge1xuICAgICAgICAgIHJldHVybiBwYXJlbnRLZXlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgX19wYXRoOiB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5fX2hhc0FuY2VzdG9ycyAmJiAhdGhpcy5fX3BhcmVudC5fX2lzUm9vdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX3BhcmVudC5fX3BhdGggKyAnLicgKyB0aGlzLl9fbmFtZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19uYW1lXG4gICAgICB9XG4gICAgfVxuICB9LFxuICBfX2lzUm9vdDoge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuICF0aGlzLl9faGFzQW5jZXN0b3JzXG4gICAgfVxuICB9LFxuICBfX2NoaWxkcmVuOiB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY2hpbGRyZW4gPSBbXVxuXG4gICAgICB2YXIga2V5cyA9IHRoaXMuX19rZXlzXG4gICAgICB2YXIga2V5LCB2YWx1ZVxuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAga2V5ID0ga2V5c1tpXVxuICAgICAgICB2YWx1ZSA9IHRoaXNba2V5XVxuXG4gICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5fX3N1cGVybW9kZWwpIHtcbiAgICAgICAgICBjaGlsZHJlbi5wdXNoKHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjaGlsZHJlblxuICAgIH1cbiAgfSxcbiAgX19hbmNlc3RvcnM6IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBhbmNlc3RvcnMgPSBbXVxuICAgICAgdmFyIHIgPSB0aGlzXG5cbiAgICAgIHdoaWxlIChyLl9fcGFyZW50KSB7XG4gICAgICAgIGFuY2VzdG9ycy5wdXNoKHIuX19wYXJlbnQpXG4gICAgICAgIHIgPSByLl9fcGFyZW50XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhbmNlc3RvcnNcbiAgICB9XG4gIH0sXG4gIF9fZGVzY2VuZGFudHM6IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBkZXNjZW5kYW50cyA9IFtdXG5cbiAgICAgIGZ1bmN0aW9uIGNoZWNrQW5kQWRkRGVzY2VuZGFudElmTW9kZWwgKG9iaikge1xuICAgICAgICB2YXIga2V5cyA9IG9iai5fX2tleXNcbiAgICAgICAgdmFyIGtleSwgdmFsdWVcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBrZXkgPSBrZXlzW2ldXG4gICAgICAgICAgdmFsdWUgPSBvYmpba2V5XVxuXG4gICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLl9fc3VwZXJtb2RlbCkge1xuICAgICAgICAgICAgZGVzY2VuZGFudHMucHVzaCh2YWx1ZSlcbiAgICAgICAgICAgIGNoZWNrQW5kQWRkRGVzY2VuZGFudElmTW9kZWwodmFsdWUpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNoZWNrQW5kQWRkRGVzY2VuZGFudElmTW9kZWwodGhpcylcblxuICAgICAgcmV0dXJuIGRlc2NlbmRhbnRzXG4gICAgfVxuICB9LFxuICBfX2hhc0FuY2VzdG9yczoge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuICEhdGhpcy5fX2FuY2VzdG9ycy5sZW5ndGhcbiAgICB9XG4gIH0sXG4gIF9faGFzRGVzY2VuZGFudHM6IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiAhIXRoaXMuX19kZXNjZW5kYW50cy5sZW5ndGhcbiAgICB9XG4gIH0sXG4gIGVycm9yczoge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGVycm9ycyA9IFtdXG4gICAgICB2YXIgZGVmID0gdGhpcy5fX2RlZlxuICAgICAgdmFyIHZhbGlkYXRvciwgZXJyb3IsIGlcblxuICAgICAgLy8gUnVuIG93biB2YWxpZGF0b3JzXG4gICAgICB2YXIgb3duID0gZGVmLnZhbGlkYXRvcnMuc2xpY2UoMClcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBvd24ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFsaWRhdG9yID0gb3duW2ldXG4gICAgICAgIGVycm9yID0gdmFsaWRhdG9yLmNhbGwodGhpcywgdGhpcylcblxuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKHRoaXMsIGVycm9yLCB2YWxpZGF0b3IpKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBSdW4gdGhyb3VnaCBrZXlzIGFuZCBldmFsdWF0ZSB2YWxpZGF0b3JzXG4gICAgICB2YXIga2V5cyA9IHRoaXMuX19rZXlzXG4gICAgICB2YXIgdmFsdWUsIGtleSwgaXRlbURlZiwgZGlzcGxheU5hbWVcblxuICAgICAgZm9yIChpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAga2V5ID0ga2V5c1tpXVxuICAgICAgICBkaXNwbGF5TmFtZSA9IHRoaXMuX19kZWYuZGVmcyAmJiB0aGlzLl9fZGVmLmRlZnNba2V5XS5kaXNwbGF5TmFtZVxuICAgICAgICAvLyBJZiB3ZSBhcmUgYW4gQXJyYXkgd2l0aCBhbiBpdGVtIGRlZmluaXRpb25cbiAgICAgICAgLy8gdGhlbiB3ZSBoYXZlIHRvIGxvb2sgaW50byB0aGUgQXJyYXkgZm9yIG91ciB2YWx1ZVxuICAgICAgICAvLyBhbmQgYWxzbyBnZXQgaG9sZCBvZiB0aGUgd3JhcHBlci4gV2Ugb25seSBuZWVkIHRvXG4gICAgICAgIC8vIGRvIHRoaXMgaWYgdGhlIGtleSBpcyBub3QgYSBwcm9wZXJ0eSBvZiB0aGUgYXJyYXkuXG4gICAgICAgIC8vIFdlIGNoZWNrIHRoZSBkZWZzIHRvIHdvcmsgdGhpcyBvdXQgKGkuZS4gMCwgMSwgMikuXG4gICAgICAgIC8vIHRvZG86IFRoaXMgY291bGQgYmUgYmV0dGVyIHRvIGNoZWNrICFOYU4gb24gdGhlIGtleT9cbiAgICAgICAgaWYgKGRlZi5pc0FycmF5ICYmIGRlZi5kZWYgJiYgKCFkZWYuZGVmcyB8fCAhKGtleSBpbiBkZWYuZGVmcykpKSB7XG4gICAgICAgICAgLy8gSWYgd2UgYXJlIGFuIEFycmF5IHdpdGggYSBzaW1wbGUgaXRlbSBkZWZpbml0aW9uXG4gICAgICAgICAgLy8gb3IgYSByZWZlcmVuY2UgdG8gYSBzaW1wbGUgdHlwZSBkZWZpbml0aW9uXG4gICAgICAgICAgLy8gc3Vic3RpdHV0ZSB0aGUgdmFsdWUgd2l0aCB0aGUgd3JhcHBlciB3ZSBnZXQgZnJvbSB0aGVcbiAgICAgICAgICAvLyBjcmVhdGUgZmFjdG9yeSBmdW5jdGlvbi4gT3RoZXJ3aXNlIHNldCB0aGUgdmFsdWUgdG9cbiAgICAgICAgICAvLyB0aGUgcmVhbCB2YWx1ZSBvZiB0aGUgcHJvcGVydHkuXG4gICAgICAgICAgaXRlbURlZiA9IGRlZi5kZWZcblxuICAgICAgICAgIGlmIChpdGVtRGVmLmlzU2ltcGxlKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGl0ZW1EZWYuY3JlYXRlLndyYXBwZXJcbiAgICAgICAgICAgIHZhbHVlLl9zZXRWYWx1ZSh0aGlzW2tleV0pXG4gICAgICAgICAgfSBlbHNlIGlmIChpdGVtRGVmLmlzUmVmZXJlbmNlICYmIGl0ZW1EZWYudHlwZS5kZWYuaXNTaW1wbGUpIHtcbiAgICAgICAgICAgIHZhbHVlID0gaXRlbURlZi50eXBlLmRlZi5jcmVhdGUud3JhcHBlclxuICAgICAgICAgICAgdmFsdWUuX3NldFZhbHVlKHRoaXNba2V5XSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFsdWUgPSB0aGlzW2tleV1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gU2V0IHRoZSB2YWx1ZSB0byB0aGUgd3JhcHBlZCB2YWx1ZSBvZiB0aGUgcHJvcGVydHlcbiAgICAgICAgICB2YWx1ZSA9IHRoaXMuX19ba2V5XVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKHZhbHVlLl9fc3VwZXJtb2RlbCkge1xuICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoZXJyb3JzLCB2YWx1ZS5lcnJvcnMpXG4gICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFdyYXBwZXIpIHtcbiAgICAgICAgICAgIHZhciB3cmFwcGVyVmFsdWUgPSB2YWx1ZS5fZ2V0VmFsdWUodGhpcylcblxuICAgICAgICAgICAgaWYgKHdyYXBwZXJWYWx1ZSAmJiB3cmFwcGVyVmFsdWUuX19zdXBlcm1vZGVsKSB7XG4gICAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGVycm9ycywgd3JhcHBlclZhbHVlLmVycm9ycylcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGVycm9ycywgdmFsdWUuX2dldEVycm9ycyh0aGlzLCBrZXksIGRpc3BsYXlOYW1lIHx8IGtleSkpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBlcnJvcnNcbiAgICB9XG4gIH1cbn1cblxudmFyIHByb3RvID0ge1xuICBfX2dldDogZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiB0aGlzLl9fW2tleV0uX2dldFZhbHVlKHRoaXMpXG4gIH0sXG4gIF9fc2V0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgIHRoaXMuX19ba2V5XS5fc2V0VmFsdWUodmFsdWUsIHRoaXMpXG4gIH0sXG4gIF9fcmVsYXRpdmVQYXRoOiBmdW5jdGlvbiAodG8sIGtleSkge1xuICAgIHZhciByZWxhdGl2ZVBhdGggPSB0aGlzLl9fcGF0aFxuICAgICAgPyB0by5zdWJzdHIodGhpcy5fX3BhdGgubGVuZ3RoICsgMSlcbiAgICAgIDogdG9cblxuICAgIGlmIChyZWxhdGl2ZVBhdGgpIHtcbiAgICAgIHJldHVybiBrZXkgPyByZWxhdGl2ZVBhdGggKyAnLicgKyBrZXkgOiByZWxhdGl2ZVBhdGhcbiAgICB9XG4gICAgcmV0dXJuIGtleVxuICB9LFxuICBfX2NoYWluOiBmdW5jdGlvbiAoZm4pIHtcbiAgICByZXR1cm4gW3RoaXNdLmNvbmNhdCh0aGlzLl9fYW5jZXN0b3JzKS5mb3JFYWNoKGZuKVxuICB9LFxuICBfX21lcmdlOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHJldHVybiBtZXJnZSh0aGlzLCBkYXRhKVxuICB9LFxuICBfX25vdGlmeUNoYW5nZTogZnVuY3Rpb24gKGtleSwgbmV3VmFsdWUsIG9sZFZhbHVlKSB7XG4gICAgdmFyIHRhcmdldCA9IHRoaXNcbiAgICB2YXIgdGFyZ2V0UGF0aCA9IHRoaXMuX19wYXRoXG4gICAgdmFyIGV2ZW50TmFtZSA9ICdzZXQnXG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICBvbGRWYWx1ZTogb2xkVmFsdWUsXG4gICAgICBuZXdWYWx1ZTogbmV3VmFsdWVcbiAgICB9XG5cbiAgICB0aGlzLmVtaXQoZXZlbnROYW1lLCBuZXcgRW1pdHRlckV2ZW50KGV2ZW50TmFtZSwga2V5LCB0YXJnZXQsIGRhdGEpKVxuICAgIHRoaXMuZW1pdCgnY2hhbmdlJywgbmV3IEVtaXR0ZXJFdmVudChldmVudE5hbWUsIGtleSwgdGFyZ2V0LCBkYXRhKSlcbiAgICB0aGlzLmVtaXQoJ2NoYW5nZTonICsga2V5LCBuZXcgRW1pdHRlckV2ZW50KGV2ZW50TmFtZSwga2V5LCB0YXJnZXQsIGRhdGEpKVxuXG4gICAgdGhpcy5fX2FuY2VzdG9ycy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICB2YXIgcGF0aCA9IGl0ZW0uX19yZWxhdGl2ZVBhdGgodGFyZ2V0UGF0aCwga2V5KVxuICAgICAgaXRlbS5lbWl0KCdjaGFuZ2UnLCBuZXcgRW1pdHRlckV2ZW50KGV2ZW50TmFtZSwgcGF0aCwgdGFyZ2V0LCBkYXRhKSlcbiAgICB9KVxuICB9LFxuICBfX3NldE5vdGlmeUNoYW5nZTogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICB2YXIgb2xkVmFsdWUgPSB0aGlzLl9fZ2V0KGtleSlcbiAgICB0aGlzLl9fc2V0KGtleSwgdmFsdWUpXG4gICAgdmFyIG5ld1ZhbHVlID0gdGhpcy5fX2dldChrZXkpXG4gICAgdGhpcy5fX25vdGlmeUNoYW5nZShrZXksIG5ld1ZhbHVlLCBvbGRWYWx1ZSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgcHJvdG86IHByb3RvLFxuICBkZXNjcmlwdG9yczogZGVzY3JpcHRvcnNcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5mdW5jdGlvbiBmYWN0b3J5ICgpIHtcbiAgZnVuY3Rpb24gUHJvcCAodHlwZSkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBQcm9wKSkge1xuICAgICAgcmV0dXJuIG5ldyBQcm9wKHR5cGUpXG4gICAgfVxuXG4gICAgdGhpcy5fX3R5cGUgPSB0eXBlXG4gICAgdGhpcy5fX3ZhbGlkYXRvcnMgPSBbXVxuICB9XG4gIFByb3AucHJvdG90eXBlLnR5cGUgPSBmdW5jdGlvbiAodHlwZSkge1xuICAgIHRoaXMuX190eXBlID0gdHlwZVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgUHJvcC5wcm90b3R5cGUuZW51bWVyYWJsZSA9IGZ1bmN0aW9uIChlbnVtZXJhYmxlKSB7XG4gICAgdGhpcy5fX2VudW1lcmFibGUgPSBlbnVtZXJhYmxlXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBQcm9wLnByb3RvdHlwZS5jb25maWd1cmFibGUgPSBmdW5jdGlvbiAoY29uZmlndXJhYmxlKSB7XG4gICAgdGhpcy5fX2NvbmZpZ3VyYWJsZSA9IGNvbmZpZ3VyYWJsZVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgUHJvcC5wcm90b3R5cGUud3JpdGFibGUgPSBmdW5jdGlvbiAod3JpdGFibGUpIHtcbiAgICB0aGlzLl9fd3JpdGFibGUgPSB3cml0YWJsZVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgUHJvcC5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uIChrZXlzKSB7XG4gICAgaWYgKHRoaXMuX190eXBlICE9PSBBcnJheSkge1xuICAgICAgdGhpcy5fX3R5cGUgPSBPYmplY3RcbiAgICB9XG4gICAgZm9yICh2YXIga2V5IGluIGtleXMpIHtcbiAgICAgIHRoaXNba2V5XSA9IGtleXNba2V5XVxuICAgIH1cbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIFByb3AucHJvdG90eXBlLnZhbGlkYXRlID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgdGhpcy5fX3ZhbGlkYXRvcnMucHVzaChmbilcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIFByb3AucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChmbikge1xuICAgIHRoaXMuX19nZXQgPSBmblxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgUHJvcC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgdGhpcy5fX3NldCA9IGZuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBQcm9wLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHRoaXMuX192YWx1ZSA9IHZhbHVlXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBQcm9wLnByb3RvdHlwZS5uYW1lID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aGlzLl9fZGlzcGxheU5hbWUgPSBuYW1lXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBQcm9wLnJlZ2lzdGVyID0gZnVuY3Rpb24gKG5hbWUsIGZuKSB7XG4gICAgdmFyIHdyYXBwZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLl9fdmFsaWRhdG9ycy5wdXNoKGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpXG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUHJvcC5wcm90b3R5cGUsIG5hbWUsIHtcbiAgICAgIHZhbHVlOiB3cmFwcGVyXG4gICAgfSlcbiAgfVxuICByZXR1cm4gUHJvcFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnlcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgZW1pdHRlciA9IHJlcXVpcmUoJy4vZW1pdHRlci1vYmplY3QnKVxudmFyIGVtaXR0ZXJBcnJheSA9IHJlcXVpcmUoJy4vZW1pdHRlci1hcnJheScpXG52YXIgRW1pdHRlckV2ZW50ID0gcmVxdWlyZSgnLi9lbWl0dGVyLWV2ZW50JylcblxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJy4vdXRpbCcpLmV4dGVuZFxudmFyIG1vZGVsID0gcmVxdWlyZSgnLi9tb2RlbCcpXG52YXIgbW9kZWxQcm90byA9IG1vZGVsLnByb3RvXG52YXIgbW9kZWxEZXNjcmlwdG9ycyA9IG1vZGVsLmRlc2NyaXB0b3JzXG5cbnZhciBtb2RlbFByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobW9kZWxQcm90bywgbW9kZWxEZXNjcmlwdG9ycylcbnZhciBvYmplY3RQcm90b3R5cGUgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgcCA9IE9iamVjdC5jcmVhdGUobW9kZWxQcm90b3R5cGUpXG5cbiAgZW1pdHRlcihwKVxuXG4gIHJldHVybiBwXG59KSgpXG5cbmZ1bmN0aW9uIGNyZWF0ZUFycmF5UHJvdG90eXBlICgpIHtcbiAgdmFyIHAgPSBlbWl0dGVyQXJyYXkoZnVuY3Rpb24gKGV2ZW50TmFtZSwgYXJyLCBlKSB7XG4gICAgaWYgKGV2ZW50TmFtZSA9PT0gJ3VwZGF0ZScpIHtcbiAgICAgIC8qKlxuICAgICAgICogRm9yd2FyZCB0aGUgc3BlY2lhbCBhcnJheSB1cGRhdGVcbiAgICAgICAqIGV2ZW50cyBhcyBzdGFuZGFyZCBfX25vdGlmeUNoYW5nZSBldmVudHNcbiAgICAgICAqL1xuICAgICAgYXJyLl9fbm90aWZ5Q2hhbmdlKGUuaW5kZXgsIGUudmFsdWUsIGUub2xkVmFsdWUpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8qKlxuICAgICAgICogQWxsIG90aGVyIGV2ZW50cyBlLmcuIHB1c2gsIHNwbGljZSBhcmUgcmVsYXllZFxuICAgICAgICovXG4gICAgICB2YXIgdGFyZ2V0ID0gYXJyXG4gICAgICB2YXIgcGF0aCA9IGFyci5fX3BhdGhcbiAgICAgIHZhciBkYXRhID0gZVxuICAgICAgdmFyIGtleSA9IGUuaW5kZXhcblxuICAgICAgYXJyLmVtaXQoZXZlbnROYW1lLCBuZXcgRW1pdHRlckV2ZW50KGV2ZW50TmFtZSwgJycsIHRhcmdldCwgZGF0YSkpXG4gICAgICBhcnIuZW1pdCgnY2hhbmdlJywgbmV3IEVtaXR0ZXJFdmVudChldmVudE5hbWUsICcnLCB0YXJnZXQsIGRhdGEpKVxuICAgICAgYXJyLl9fYW5jZXN0b3JzLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgdmFyIG5hbWUgPSBpdGVtLl9fcmVsYXRpdmVQYXRoKHBhdGgsIGtleSlcbiAgICAgICAgaXRlbS5lbWl0KCdjaGFuZ2UnLCBuZXcgRW1pdHRlckV2ZW50KGV2ZW50TmFtZSwgbmFtZSwgdGFyZ2V0LCBkYXRhKSlcbiAgICAgIH0pXG4gICAgfVxuICB9KVxuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHAsIG1vZGVsRGVzY3JpcHRvcnMpXG5cbiAgZW1pdHRlcihwKVxuXG4gIGV4dGVuZChwLCBtb2RlbFByb3RvKVxuXG4gIHJldHVybiBwXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU9iamVjdE1vZGVsUHJvdG90eXBlIChwcm90bykge1xuICB2YXIgcCA9IE9iamVjdC5jcmVhdGUob2JqZWN0UHJvdG90eXBlKVxuXG4gIGlmIChwcm90bykge1xuICAgIGV4dGVuZChwLCBwcm90bylcbiAgfVxuXG4gIHJldHVybiBwXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUFycmF5TW9kZWxQcm90b3R5cGUgKHByb3RvLCBpdGVtRGVmKSB7XG4gIC8vIFdlIGRvIG5vdCB0byBhdHRlbXB0IHRvIHN1YmNsYXNzIEFycmF5LFxuICAvLyBpbnN0ZWFkIGNyZWF0ZSBhIG5ldyBpbnN0YW5jZSBlYWNoIHRpbWVcbiAgLy8gYW5kIG1peGluIHRoZSBwcm90byBvYmplY3RcbiAgdmFyIHAgPSBjcmVhdGVBcnJheVByb3RvdHlwZSgpXG5cbiAgaWYgKHByb3RvKSB7XG4gICAgZXh0ZW5kKHAsIHByb3RvKVxuICB9XG5cbiAgaWYgKGl0ZW1EZWYpIHtcbiAgICAvLyBXZSBoYXZlIGEgZGVmaW5pdGlvbiBmb3IgdGhlIGl0ZW1zXG4gICAgLy8gdGhhdCBiZWxvbmcgaW4gdGhpcyBhcnJheS5cblxuICAgIC8vIFVzZSB0aGUgYHdyYXBwZXJgIHByb3RvdHlwZSBwcm9wZXJ0eSBhcyBhXG4gICAgLy8gdmlydHVhbCBXcmFwcGVyIG9iamVjdCB3ZSBjYW4gdXNlXG4gICAgLy8gdmFsaWRhdGUgYWxsIHRoZSBpdGVtcyBpbiB0aGUgYXJyYXkuXG4gICAgdmFyIGFyckl0ZW1XcmFwcGVyID0gaXRlbURlZi5jcmVhdGUud3JhcHBlclxuXG4gICAgLy8gVmFsaWRhdGUgbmV3IG1vZGVscyBieSBvdmVycmlkaW5nIHRoZSBlbWl0dGVyIGFycmF5XG4gICAgLy8gbXV0YXRvcnMgdGhhdCBjYW4gY2F1c2UgbmV3IGl0ZW1zIHRvIGVudGVyIHRoZSBhcnJheS5cbiAgICBvdmVycmlkZUFycmF5QWRkaW5nTXV0YXRvcnMocCwgYXJySXRlbVdyYXBwZXIpXG5cbiAgICAvLyBQcm92aWRlIGEgY29udmVuaWVudCBtb2RlbCBmYWN0b3J5XG4gICAgLy8gZm9yIGNyZWF0aW5nIGFycmF5IGl0ZW0gaW5zdGFuY2VzXG4gICAgcC5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gaXRlbURlZi5pc1JlZmVyZW5jZSA/IGl0ZW1EZWYudHlwZSgpIDogaXRlbURlZi5jcmVhdGUoKS5fZ2V0VmFsdWUodGhpcylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcFxufVxuXG5mdW5jdGlvbiBvdmVycmlkZUFycmF5QWRkaW5nTXV0YXRvcnMgKGFyciwgaXRlbVdyYXBwZXIpIHtcbiAgZnVuY3Rpb24gZ2V0QXJyYXlBcmdzIChpdGVtcykge1xuICAgIHZhciBhcmdzID0gW11cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpdGVtV3JhcHBlci5fc2V0VmFsdWUoaXRlbXNbaV0sIGFycilcbiAgICAgIGFyZ3MucHVzaChpdGVtV3JhcHBlci5fZ2V0VmFsdWUoYXJyKSlcbiAgICB9XG4gICAgcmV0dXJuIGFyZ3NcbiAgfVxuXG4gIHZhciBwdXNoID0gYXJyLnB1c2hcbiAgdmFyIHVuc2hpZnQgPSBhcnIudW5zaGlmdFxuICB2YXIgc3BsaWNlID0gYXJyLnNwbGljZVxuICB2YXIgdXBkYXRlID0gYXJyLnVwZGF0ZVxuXG4gIGlmIChwdXNoKSB7XG4gICAgYXJyLnB1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgYXJncyA9IGdldEFycmF5QXJncyhhcmd1bWVudHMpXG4gICAgICByZXR1cm4gcHVzaC5hcHBseShhcnIsIGFyZ3MpXG4gICAgfVxuICB9XG5cbiAgaWYgKHVuc2hpZnQpIHtcbiAgICBhcnIudW5zaGlmdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBhcmdzID0gZ2V0QXJyYXlBcmdzKGFyZ3VtZW50cylcbiAgICAgIHJldHVybiB1bnNoaWZ0LmFwcGx5KGFyciwgYXJncylcbiAgICB9XG4gIH1cblxuICBpZiAoc3BsaWNlKSB7XG4gICAgYXJyLnNwbGljZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBhcmdzID0gZ2V0QXJyYXlBcmdzKEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMikpXG4gICAgICBhcmdzLnVuc2hpZnQoYXJndW1lbnRzWzFdKVxuICAgICAgYXJncy51bnNoaWZ0KGFyZ3VtZW50c1swXSlcbiAgICAgIHJldHVybiBzcGxpY2UuYXBwbHkoYXJyLCBhcmdzKVxuICAgIH1cbiAgfVxuXG4gIGlmICh1cGRhdGUpIHtcbiAgICBhcnIudXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGFyZ3MgPSBnZXRBcnJheUFyZ3MoW2FyZ3VtZW50c1sxXV0pXG4gICAgICBhcmdzLnVuc2hpZnQoYXJndW1lbnRzWzBdKVxuICAgICAgcmV0dXJuIHVwZGF0ZS5hcHBseShhcnIsIGFyZ3MpXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU1vZGVsUHJvdG90eXBlIChkZWYpIHtcbiAgcmV0dXJuIGRlZi5pc0FycmF5ID8gY3JlYXRlQXJyYXlNb2RlbFByb3RvdHlwZShkZWYucHJvdG8sIGRlZi5kZWYpIDogY3JlYXRlT2JqZWN0TW9kZWxQcm90b3R5cGUoZGVmLnByb3RvKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZU1vZGVsUHJvdG90eXBlXG4iLCIndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSB7fVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBwcm9wID0gcmVxdWlyZSgnLi9wcm9wJylcbnZhciBtZXJnZSA9IHJlcXVpcmUoJy4vbWVyZ2UnKVxudmFyIGNyZWF0ZURlZiA9IHJlcXVpcmUoJy4vZGVmJylcbnZhciBTdXBlcm1vZGVsID0gcmVxdWlyZSgnLi9zdXBlcm1vZGVsJylcblxuZnVuY3Rpb24gc3VwZXJtb2RlbHMgKHNjaGVtYSkge1xuICB2YXIgZGVmID0gY3JlYXRlRGVmKHNjaGVtYSlcblxuICBmdW5jdGlvbiBTdXBlcm1vZGVsQ29uc3RydWN0b3IgKGRhdGEpIHtcbiAgICB2YXIgbW9kZWwgPSBkZWYuaXNTaW1wbGUgPyBkZWYuY3JlYXRlKCkgOiBkZWYuY3JlYXRlKCkuX2dldFZhbHVlKHt9KVxuXG4gICAgaWYgKGRhdGEpIHtcbiAgICAgIC8vIGlmIHR3ZSBoYXZlIGJlZW4gcGFzc2VkIHNvbWVcbiAgICAgIC8vIGRhdGEsIG1lcmdlIGl0IGludG8gdGhlIG1vZGVsLlxuICAgICAgbW9kZWwuX19tZXJnZShkYXRhKVxuICAgIH1cbiAgICByZXR1cm4gbW9kZWxcbiAgfVxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3VwZXJtb2RlbENvbnN0cnVjdG9yLCAnZGVmJywge1xuICAgIHZhbHVlOiBkZWYgLy8gdGhpcyBpcyB1c2VkIHRvIHZhbGlkYXRlIHJlZmVyZW5jZWQgU3VwZXJtb2RlbENvbnN0cnVjdG9yc1xuICB9KVxuICBTdXBlcm1vZGVsQ29uc3RydWN0b3IucHJvdG90eXBlID0gU3VwZXJtb2RlbCAvLyB0aGlzIHNoYXJlZCBvYmplY3QgaXMgdXNlZCwgYXMgYSBwcm90b3R5cGUsIHRvIGlkZW50aWZ5IFN1cGVybW9kZWxDb25zdHJ1Y3RvcnNcbiAgU3VwZXJtb2RlbENvbnN0cnVjdG9yLmNvbnN0cnVjdG9yID0gU3VwZXJtb2RlbENvbnN0cnVjdG9yXG4gIHJldHVybiBTdXBlcm1vZGVsQ29uc3RydWN0b3Jcbn1cblxuc3VwZXJtb2RlbHMucHJvcCA9IHByb3BcbnN1cGVybW9kZWxzLm1lcmdlID0gbWVyZ2VcblxubW9kdWxlLmV4cG9ydHMgPSBzdXBlcm1vZGVsc1xuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBTdXBlcm1vZGVsID0gcmVxdWlyZSgnLi9zdXBlcm1vZGVsJylcblxuZnVuY3Rpb24gZXh0ZW5kIChvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8IHR5cGVvZiBhZGQgIT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIG9yaWdpblxuICB9XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpXG4gIHZhciBpID0ga2V5cy5sZW5ndGhcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXVxuICB9XG4gIHJldHVybiBvcmlnaW5cbn1cblxudmFyIHV0aWwgPSB7XG4gIGV4dGVuZDogZXh0ZW5kLFxuICB0eXBlT2Y6IGZ1bmN0aW9uIChvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikubWF0Y2goL1xccyhbYS16QS1aXSspLylbMV0udG9Mb3dlckNhc2UoKVxuICB9LFxuICBpc09iamVjdDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMudHlwZU9mKHZhbHVlKSA9PT0gJ29iamVjdCdcbiAgfSxcbiAgaXNBcnJheTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpXG4gIH0sXG4gIGlzU2ltcGxlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAvLyAnU2ltcGxlJyBoZXJlIG1lYW5zIGFueXRoaW5nXG4gICAgLy8gb3RoZXIgdGhhbiBhbiBPYmplY3Qgb3IgYW4gQXJyYXlcbiAgICAvLyBpLmUuIG51bWJlciwgc3RyaW5nLCBkYXRlLCBib29sLCBudWxsLCB1bmRlZmluZWQsIHJlZ2V4Li4uXG4gICAgcmV0dXJuICF0aGlzLmlzT2JqZWN0KHZhbHVlKSAmJiAhdGhpcy5pc0FycmF5KHZhbHVlKVxuICB9LFxuICBpc0Z1bmN0aW9uOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy50eXBlT2YodmFsdWUpID09PSAnZnVuY3Rpb24nXG4gIH0sXG4gIGlzRGF0ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMudHlwZU9mKHZhbHVlKSA9PT0gJ2RhdGUnXG4gIH0sXG4gIGlzTnVsbDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSBudWxsXG4gIH0sXG4gIGlzVW5kZWZpbmVkOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mICh2YWx1ZSkgPT09ICd1bmRlZmluZWQnXG4gIH0sXG4gIGlzTnVsbE9yVW5kZWZpbmVkOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5pc051bGwodmFsdWUpIHx8IHRoaXMuaXNVbmRlZmluZWQodmFsdWUpXG4gIH0sXG4gIGNhc3Q6IGZ1bmN0aW9uICh2YWx1ZSwgdHlwZSkge1xuICAgIGlmICghdHlwZSkge1xuICAgICAgcmV0dXJuIHZhbHVlXG4gICAgfVxuXG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlIFN0cmluZzpcbiAgICAgICAgcmV0dXJuIHV0aWwuY2FzdFN0cmluZyh2YWx1ZSlcbiAgICAgIGNhc2UgTnVtYmVyOlxuICAgICAgICByZXR1cm4gdXRpbC5jYXN0TnVtYmVyKHZhbHVlKVxuICAgICAgY2FzZSBCb29sZWFuOlxuICAgICAgICByZXR1cm4gdXRpbC5jYXN0Qm9vbGVhbih2YWx1ZSlcbiAgICAgIGNhc2UgRGF0ZTpcbiAgICAgICAgcmV0dXJuIHV0aWwuY2FzdERhdGUodmFsdWUpXG4gICAgICBjYXNlIE9iamVjdDpcbiAgICAgIGNhc2UgRnVuY3Rpb246XG4gICAgICAgIHJldHVybiB2YWx1ZVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNhc3QnKVxuICAgIH1cbiAgfSxcbiAgY2FzdFN0cmluZzogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdXRpbC50eXBlT2YodmFsdWUpID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHZhbHVlXG4gICAgfVxuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZyAmJiB2YWx1ZS50b1N0cmluZygpXG4gIH0sXG4gIGNhc3ROdW1iZXI6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gTmFOXG4gICAgfVxuICAgIGlmICh1dGlsLnR5cGVPZih2YWx1ZSkgPT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gdmFsdWVcbiAgICB9XG4gICAgcmV0dXJuIE51bWJlcih2YWx1ZSlcbiAgfSxcbiAgY2FzdEJvb2xlYW46IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGlmICghdmFsdWUpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICB2YXIgZmFsc2V5ID0gWycwJywgJ2ZhbHNlJywgJ29mZicsICdubyddXG4gICAgcmV0dXJuIGZhbHNleS5pbmRleE9mKHZhbHVlKSA9PT0gLTFcbiAgfSxcbiAgY2FzdERhdGU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHV0aWwudHlwZU9mKHZhbHVlKSA9PT0gJ2RhdGUnKSB7XG4gICAgICByZXR1cm4gdmFsdWVcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBEYXRlKHZhbHVlKVxuICB9LFxuICBpc0NvbnN0cnVjdG9yOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5pc1NpbXBsZUNvbnN0cnVjdG9yKHZhbHVlKSB8fCBbQXJyYXksIE9iamVjdF0uaW5kZXhPZih2YWx1ZSkgPiAtMVxuICB9LFxuICBpc1NpbXBsZUNvbnN0cnVjdG9yOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gW1N0cmluZywgTnVtYmVyLCBEYXRlLCBCb29sZWFuXS5pbmRleE9mKHZhbHVlKSA+IC0xXG4gIH0sXG4gIGlzU3VwZXJtb2RlbENvbnN0cnVjdG9yOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5pc0Z1bmN0aW9uKHZhbHVlKSAmJiB2YWx1ZS5wcm90b3R5cGUgPT09IFN1cGVybW9kZWxcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxcbiIsIid1c2Ugc3RyaWN0J1xuXG5mdW5jdGlvbiBWYWxpZGF0aW9uRXJyb3IgKHRhcmdldCwgZXJyb3IsIHZhbGlkYXRvciwga2V5KSB7XG4gIHRoaXMudGFyZ2V0ID0gdGFyZ2V0XG4gIHRoaXMuZXJyb3IgPSBlcnJvclxuICB0aGlzLnZhbGlkYXRvciA9IHZhbGlkYXRvclxuXG4gIGlmIChrZXkpIHtcbiAgICB0aGlzLmtleSA9IGtleVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmFsaWRhdGlvbkVycm9yXG4iLCIndXNlIHN0cmljdCdcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKVxudmFyIFZhbGlkYXRpb25FcnJvciA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbi1lcnJvcicpXG5cbmZ1bmN0aW9uIFdyYXBwZXIgKGRlZmF1bHRWYWx1ZSwgd3JpdGFibGUsIHZhbGlkYXRvcnMsIGdldHRlciwgc2V0dGVyLCBiZWZvcmVTZXQsIGFzc2VydCkge1xuICB0aGlzLnZhbGlkYXRvcnMgPSB2YWxpZGF0b3JzXG5cbiAgdGhpcy5fZGVmYXVsdFZhbHVlID0gZGVmYXVsdFZhbHVlXG4gIHRoaXMuX3dyaXRhYmxlID0gd3JpdGFibGVcbiAgdGhpcy5fZ2V0dGVyID0gZ2V0dGVyXG4gIHRoaXMuX3NldHRlciA9IHNldHRlclxuICB0aGlzLl9iZWZvcmVTZXQgPSBiZWZvcmVTZXRcbiAgdGhpcy5fYXNzZXJ0ID0gYXNzZXJ0XG4gIHRoaXMuaXNJbml0aWFsaXplZCA9IGZhbHNlXG5cbiAgaWYgKCF1dGlsLmlzRnVuY3Rpb24oZGVmYXVsdFZhbHVlKSkge1xuICAgIHRoaXMuaXNJbml0aWFsaXplZCA9IHRydWVcblxuICAgIGlmICghdXRpbC5pc1VuZGVmaW5lZChkZWZhdWx0VmFsdWUpKSB7XG4gICAgICB0aGlzLl92YWx1ZSA9IGRlZmF1bHRWYWx1ZVxuICAgIH1cbiAgfVxufVxuV3JhcHBlci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbiAocGFyZW50KSB7XG4gIGlmICh0aGlzLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIHRoaXMuX3NldFZhbHVlKHRoaXMuX2RlZmF1bHRWYWx1ZShwYXJlbnQpLCBwYXJlbnQpXG4gIHRoaXMuaXNJbml0aWFsaXplZCA9IHRydWVcbn1cbldyYXBwZXIucHJvdG90eXBlLl9nZXRFcnJvcnMgPSBmdW5jdGlvbiAobW9kZWwsIGtleSwgZGlzcGxheU5hbWUpIHtcbiAgbW9kZWwgPSBtb2RlbCB8fCB0aGlzXG4gIGtleSA9IGtleSB8fCAnJ1xuICBkaXNwbGF5TmFtZSA9IGRpc3BsYXlOYW1lIHx8IGtleVxuXG4gIHZhciBzaW1wbGUgPSB0aGlzLnZhbGlkYXRvcnNcbiAgdmFyIGVycm9ycyA9IFtdXG4gIHZhciB2YWx1ZSA9IHRoaXMuX2dldFZhbHVlKG1vZGVsKVxuICB2YXIgdmFsaWRhdG9yLCBlcnJvclxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2ltcGxlLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFsaWRhdG9yID0gc2ltcGxlW2ldXG4gICAgZXJyb3IgPSB2YWxpZGF0b3IuY2FsbChtb2RlbCwgdmFsdWUsIGRpc3BsYXlOYW1lKVxuXG4gICAgaWYgKGVycm9yKSB7XG4gICAgICBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKG1vZGVsLCBlcnJvciwgdmFsaWRhdG9yLCBrZXkpKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBlcnJvcnNcbn1cbldyYXBwZXIucHJvdG90eXBlLl9nZXRWYWx1ZSA9IGZ1bmN0aW9uIChtb2RlbCkge1xuICByZXR1cm4gdGhpcy5fZ2V0dGVyID8gdGhpcy5fZ2V0dGVyLmNhbGwobW9kZWwpIDogdGhpcy5fdmFsdWVcbn1cbldyYXBwZXIucHJvdG90eXBlLl9zZXRWYWx1ZSA9IGZ1bmN0aW9uICh2YWx1ZSwgbW9kZWwpIHtcbiAgaWYgKCF0aGlzLl93cml0YWJsZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignVmFsdWUgaXMgcmVhZG9ubHknKVxuICB9XG5cbiAgLy8gSG9vayB1cCB0aGUgcGFyZW50IHJlZiBpZiBuZWNlc3NhcnlcbiAgaWYgKHZhbHVlICYmIHZhbHVlLl9fc3VwZXJtb2RlbCAmJiBtb2RlbCkge1xuICAgIGlmICh2YWx1ZS5fX3BhcmVudCAhPT0gbW9kZWwpIHtcbiAgICAgIHZhbHVlLl9fcGFyZW50ID0gbW9kZWxcbiAgICB9XG4gIH1cblxuICB2YXIgdmFsXG4gIGlmICh0aGlzLl9zZXR0ZXIpIHtcbiAgICB0aGlzLl9zZXR0ZXIuY2FsbChtb2RlbCwgdmFsdWUpXG4gICAgdmFsID0gdGhpcy5fZ2V0VmFsdWUobW9kZWwpXG4gIH0gZWxzZSB7XG4gICAgdmFsID0gdGhpcy5fYmVmb3JlU2V0ID8gdGhpcy5fYmVmb3JlU2V0KHZhbHVlKSA6IHZhbHVlXG4gIH1cblxuICBpZiAodGhpcy5fYXNzZXJ0KSB7XG4gICAgdGhpcy5fYXNzZXJ0KHZhbClcbiAgfVxuXG4gIHRoaXMuX3ZhbHVlID0gdmFsXG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKFdyYXBwZXIucHJvdG90eXBlLCB7XG4gIHZhbHVlOiB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ2V0VmFsdWUoKVxuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHRoaXMuX3NldFZhbHVlKHZhbHVlKVxuICAgIH1cbiAgfSxcbiAgZXJyb3JzOiB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ2V0RXJyb3JzKClcbiAgICB9XG4gIH1cbn0pXG5tb2R1bGUuZXhwb3J0cyA9IFdyYXBwZXJcbiJdfQ==
