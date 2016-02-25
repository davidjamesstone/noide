(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var config = require('../../../config/client')

function Editor () {
  var editor = window.ace.edit('editor')

  // enable autocompletion and snippets
  editor.setOptions({
    enableSnippets: true,
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: false
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

  this.addCommands = function () {
    editor.commands.addCommands.apply(editor.commands, arguments)
  }
  this.setSession = function (editSession) {
    editor.setSession(editSession)
  }
}

module.exports = Editor

},{"../../../config/client":14}],2:[function(require,module,exports){
var supermodels = require('supermodels.js')

var schema = {
  name: String,
  path: String,
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

},{"supermodels.js":21}],3:[function(require,module,exports){
var supermodels = require('supermodels.js')
var Fso = require('./fso')

var schema = {
  __type: [Fso],
  findByPath: function (path) {
    return this.find(function (item) {
      return item.path === path
    })
  }
}

module.exports = supermodels(schema)

},{"./fso":2,"supermodels.js":21}],4:[function(require,module,exports){
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

},{"./noide":6,"./recent":8,"./tree":13,"slideout":18}],5:[function(require,module,exports){
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
    '.xml': 'ace/mode/xml'
  }

  return modes[file.ext]
}

},{}],6:[function(require,module,exports){
var Nes = require('nes/client')
var supermodels = require('supermodels.js')
var Sessions = require('./sessions')
var Editor = require('./editor')
var Fso = require('./fso')
var Fsos = require('./fsos')
var prop = supermodels.prop()
var editor = new Editor()
var storageKey = 'noide'
var sessions = new Sessions()
var host = window.location.host
var client = new Nes.Client('ws://' + host)
var files = new Fsos()
var stateLoaded = false

var stateSchema = {
  recent: Fsos,
  current: Fso
}

var State = supermodels(stateSchema)
var state = new State({
  recent: new Fsos()
})

client.onDisconnect = function (willReconnect, log) {
  noide.connected = willReconnect ? null : false
  console.log(log)
}

client.onConnect = function () {
  noide.connected = true
  client.request('/watched', function (err, payload) {
    if (err) {
      return handleError(err)
    }

    var files = noide.files
    files.splice.apply(files, [0, files.length].concat(new Fsos(payload)))

    if (!stateLoaded) {
      loadState()
      stateLoaded = true

      noide.client.subscribe('/change', function (payload) {
        if (err) {
          throw err
        }

        sessions.items.forEach(function (session) {
          var file = session.file
          if (payload.path === file.path) {
            if (payload.stat.mtime !== file.stat.mtime) {
              readFile(file.path, function (err, payload) {
                if (err) {
                  return handleError(err)
                }
                file.stat = payload.stat
                session.editSession.setValue(payload.contents)
              })
            }
          }
        })
      }, function (err) {
        if (err) {
          return handleError(err)
        }
      })
      //
      // client.subscribe('/unlink', function (payload) {
      //   if (err) {
      //     throw err
      //   }
      //
      //   var data = payload
      //   if (data.path === state.path) {
      //     if (window.confirm('File has been removed - close this tab?')) {
      //       window.close()
      //     }
      //   }
      // }, function (err) {
      //   if (err) {
      //     return handleError(err)
      //   }
      // })
      //
      var lastConsolePid
      client.subscribe('/io', function (payload) {
        if (err) {
          return handleError(err)
        }
var d
        if (lastConsolePid !== payload.pid) {
          lastConsolePid = payload.pid
          console.log(lastConsolePid)
        }
        console.log(payload.data)
      }, function (err) {
        if (err) {
          return handleError(err)
        }
      })

      client.subscribe('/io/pids', function (payload) {
        if (err) {
          return handleError(err)
        }
        console.log(payload)
      }, function (err) {
        if (err) {
          return handleError(err)
        }
      })
    }
  })
}

function handleError (err) {
  console.error(err)
}

function saveState () {
  var state = noide.state
  var storage = {
    current: state.current ? state.current.path : null,
    recent: state.recent.map(function (item) {
      return item.path
    }),
    expanded: files.filter(function (item) {
      return item.expanded
    }).map(function (item) {
      return item.path
    })
  }
  window.localStorage.setItem(storageKey, JSON.stringify(storage))
}

function loadState () {
  var storage = window.localStorage.getItem(storageKey)
  storage = storage ? JSON.parse(storage) : {}

  var dir, file, i, current
  var recent = []

  if (storage.recent) {
    for (i = 0; i < storage.recent.length; i++) {
      file = files.findByPath(storage.recent[i])
      if (file) {
        recent.push(file)
      }
    }
    if (recent.length) {
      state.recent.splice.apply(state.recent, [0, 0].concat(recent))
    }
  }

  if (storage.current) {
    file = files.findByPath(storage.current)
    if (file) {
      current = file
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

  if (current) {
    openFile(current)
  }
}

function readFile (path, callback) {
  client.request({
    path: '/readfile',
    payload: {
      path: path
    },
    method: 'POST'
  }, callback)
}

function openFile (file) {
  var session = sessions.find(file)
  if (session) {
    state.current = file
    editor.setSession(session.editSession)
  } else {
    readFile(file.path, function (err, payload) {
      if (err) {
        return handleError(err)
      }

      if (!state.recent.findByPath(file.path)) {
        state.recent.unshift(file)
      }

      session = sessions.add(file, payload.contents)
      state.current = file
      editor.setSession(session.editSession)
    })
  }
}

function closeFile (file) {
  var close = false
  var session = sessions.find(file)

  if (session && session.isDirty) {
    if (window.confirm('There are unsaved changes to this file. Are you sure?')) {
      close = true
    }
  } else {
    close = true
  }

  if (close) {
    // Remove from recent files
    state.recent.splice(state.recent.indexOf(file), 1)

    if (session) {
      // Remove session
      sessions.items.splice(sessions.items.indexOf(session), 1)

      if (state.current === file) {
        if (sessions.items.length) {
          // Open the next session
          openFile(sessions.items[0].file)
        } else if (state.recent.length) {
          // Open the next file
          openFile(state.recent[0])
        } else {
          state.current = null
          editor.setSession(null)
        }
      }
    }
  }
}

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

function saveAll () {
  sessions.dirty.forEach(function (item) {
    var file = item.file
    var editSession = item.editSession
    writeFile(file.path, editSession.getValue(), function (err, payload) {
      if (err) {
        return handleError(err)
      }
      file.stat = payload.stat
      editSession.getUndoManager().markClean()
    })
  })
}

var schema = {
  connected: prop(Boolean).value(false),
  get files() { return files },
  get state() { return state },
  get client() { return client },
  get editor() { return editor },
  get sessions() { return sessions },
  openFile: openFile,
  closeFile: closeFile,
  readFile: readFile,
  writeFile: writeFile
}

var Noide = supermodels(schema)
var noide = new Noide()

state.on('change', saveState)

editor.addCommands([{
  name: 'save',
  bindKey: {
    win: 'Ctrl-S',
    mac: 'Command-S'
  },
  exec: function (editor) {
    var file = state.current
    var editSession = sessions.find(file).editSession
    writeFile(file.path, editSession.getValue(), function (err, payload) {
      if (err) {
        return handleError(err)
      }
      file.stat = payload.stat
      editSession.getUndoManager().markClean()
    })
  },
  readOnly: false
}, {
  name: 'saveall',
  bindKey: {
    win: 'Ctrl-Shift-S',
    mac: 'Command-Option-S'
  },
  exec: function (editor) {
    saveAll()
  },
  readOnly: false
}])

var linter = require('./standard')
linter(noide)

window.noide = noide
module.exports = noide

},{"./editor":1,"./fso":2,"./fsos":3,"./sessions":10,"./standard":11,"nes/client":16,"supermodels.js":21}],7:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementVoid = IncrementalDOM.elementVoid
var elementClose = IncrementalDOM.elementClose
var text = IncrementalDOM.text

module.exports = function recent (files, current, onClick, onClickClose) {
  elementOpen("ul", null, null, "style", {display: files.length ? '' : 'none'})
    ;(Array.isArray(files) ? files : Object.keys(files)).forEach(function(file, $index) {
      elementOpen("li", file.path)
        elementOpen("a", null, ["href", "#", "class", "name icon icon-file-text"], "onclick", function ($event) {
          $event.preventDefault();
          var $element = this;
        onClick(file)}, "title", file.path, "data-name", file.name, "data-path", file.relativePath)
          elementOpen("span")
            text("" + (file.name) + "")
          elementClose("span")
        elementClose("a")
        elementOpen("a", null, ["class", "close"], "onclick", function ($event) {
          $event.preventDefault();
          var $element = this;
        onClickClose(file)})
          text("✖")
        elementClose("a")
        if (file === current) {
          elementOpen("span", null, ["class", "triangle-left"])
          elementClose("span")
        }
      elementClose("li")
    }, files)
  elementClose("ul")
};

},{"incremental-dom":15}],8:[function(require,module,exports){
var patch = require('incremental-dom').patch
var view = require('./index.html')
var noide = require('../noide')

function Recent (el, state) {
  state.on('change', render)

  function onClick (file) {
    noide.openFile(file)
  }

  function onClickClose (file) {
    noide.closeFile(file)
  }

  function update (state) {
    view(state.recent, state.current, onClick, onClickClose)
  }

  function render () {
    patch(el, update, state)
  }

  this.render = render
}

module.exports = Recent

},{"../noide":6,"./index.html":7,"incremental-dom":15}],9:[function(require,module,exports){
var supermodels = require('supermodels.js')
var Fso = require('./fso')
var prop = supermodels.prop()

module.exports = supermodels({
  file: Fso,
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

},{"./fso":2,"supermodels.js":21}],10:[function(require,module,exports){
// var ace = require('brace')
var supermodels = require('supermodels.js')
var config = require('../../config/client')
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

module.exports = supermodels(schema)

},{"../../config/client":14,"./modes":5,"./session":9,"supermodels.js":21}],11:[function(require,module,exports){
function linter (noide) {
  function lint () {
    var file = noide.state.current
    if (file && file.ext === '.js') {
      var editSession = noide.sessions.find(file).editSession
      noide.client.request({
        path: '/standard',
        payload: {
          value: editSession.getValue()
        },
        method: 'POST'
      }, function (err, payload) {
        if (err) {
          return noide.handleError(err)
        }
        editSession.setAnnotations(payload)
        setTimeout(lint, 3000)
      })
    } else {
      setTimeout(lint, 3000)
    }
  }
  lint()
}

module.exports = linter

},{}],12:[function(require,module,exports){
var IncrementalDOM = require('incremental-dom')
var patch = IncrementalDOM.patch
var elementOpen = IncrementalDOM.elementOpen
var elementVoid = IncrementalDOM.elementVoid
var elementClose = IncrementalDOM.elementClose
var text = IncrementalDOM.text

module.exports = function tree (data, tree, isRoot, current, onClick) {
  elementOpen("ul", null, null, "class", isRoot ? 'tree' : '')
    ;(Array.isArray(data) ? data : Object.keys(data)).forEach(function(fso, $index) {
      elementOpen("li", fso.path)
        elementOpen("a", null, ["href", "#"], "onclick", function ($event) {
          $event.preventDefault();
          var $element = this;
        onClick(fso)})
          if (fso.isDirectory) {
            if (fso.expanded) {
              elementOpen("small", null, ["class", "expanded"])
                text("▼")
              elementClose("small")
            }
            if (!fso.expanded) {
              elementOpen("small", null, ["class", "collapsed"])
                text("▶")
              elementClose("small")
            }
          }
          elementOpen("span", null, null, "data-name", fso.name, "data-path", fso.relativePath, "class", 'name icon ' + (fso.isDirectory ? 'icon-file-directory' : 'icon-file-text'))
            text(" \
                     " + (fso.name) + " \
                   ")
          elementClose("span")
        elementClose("a")
        if (fso.isFile && fso === current) {
          elementOpen("span", null, ["class", "triangle-left"])
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
                    tree(fso.children, tree, false, current, onClick)
        }
      elementClose("li")
    }, data)
  elementClose("ul")
};

},{"incremental-dom":15}],13:[function(require,module,exports){
var patch = require('incremental-dom').patch
var view = require('./index.html')
var noide = require('../noide')

function Tree (el, fsos, state) {
  fsos.on('change', render)
  state.on('change:current', render)

  function onClick (fso) {
    if (!fso.isDirectory) {
      noide.openFile(fso)
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

},{"../noide":6,"./index.html":12,"incremental-dom":15}],14:[function(require,module,exports){
module.exports = {
  ace: {
    tabSize: 2,
    theme: 'monokai',
    useSoftTabs: true
  }
}

},{}],15:[function(require,module,exports){

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

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) : typeof define === 'function' && define.amd ? define(['exports'], factory) : factory(global.IncrementalDOM = {});
})(this, function (exports) {
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
   * Similar to the built-in Treewalker class, but simplified and allows direct
   * access to modify the currentNode property.
   * @param {!Element|!DocumentFragment} node The root Node of the subtree the
   *     walker should start traversing.
   * @constructor
   */
  function TreeWalker(node) {
    /**
     * Keeps track of the current parent node. This is necessary as the traversal
     * methods may traverse past the last child and we still need a way to get
     * back to the parent.
     * @const @private {!Array<!Node>}
     */
    this.stack_ = [];

    /**
     * @const {!Element|!DocumentFragment}
     */
    this.root = node;

    /**
     * @type {?Node}
     */
    this.currentNode = node;
  }

  /**
   * @return {!Node} The current parent of the current location in the subtree.
   */
  TreeWalker.prototype.getCurrentParent = function () {
    return this.stack_[this.stack_.length - 1];
  };

  /**
   * Changes the current location the firstChild of the current location.
   */
  TreeWalker.prototype.firstChild = function () {
    this.stack_.push(this.currentNode);
    this.currentNode = this.currentNode.firstChild;
  };

  /**
   * Changes the current location the nextSibling of the current location.
   */
  TreeWalker.prototype.nextSibling = function () {
    this.currentNode = this.currentNode.nextSibling;
  };

  /**
   * Changes the current location the parentNode of the current location.
   */
  TreeWalker.prototype.parentNode = function () {
    this.currentNode = this.stack_.pop();
  };

  /**
   * Keeps track of the state of a patch.
   * @param {!Element|!DocumentFragment} node The root Node of the subtree the
   *     is for.
   * @param {?Context} prevContext The previous context.
   * @constructor
   */
  function Context(node, prevContext) {
    /**
     * @const {TreeWalker}
     */
    this.walker = new TreeWalker(node);

    /**
     * @const {Document}
     */
    this.doc = node.ownerDocument;

    /**
     * Keeps track of what namespace to create new Elements in.
     * @private
     * @const {!Array<(string|undefined)>}
     */
    this.nsStack_ = [undefined];

    /**
     * @const {?Context}
     */
    this.prevContext = prevContext;

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
   * @return {(string|undefined)} The current namespace to create Elements in.
   */
  Context.prototype.getCurrentNamespace = function () {
    return this.nsStack_[this.nsStack_.length - 1];
  };

  /**
   * @param {string=} namespace The namespace to enter.
   */
  Context.prototype.enterNamespace = function (namespace) {
    this.nsStack_.push(namespace);
  };

  /**
   * Exits the current namespace
   */
  Context.prototype.exitNamespace = function () {
    this.nsStack_.pop();
  };

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
   * The current context.
   * @type {?Context}
   */
  var context;

  /**
   * Enters a new patch context.
   * @param {!Element|!DocumentFragment} node
   */
  var enterContext = function (node) {
    context = new Context(node, context);
  };

  /**
   * Restores the previous patch context.
   */
  var restoreContext = function () {
    context = context.prevContext;
  };

  /**
   * Gets the current patch context.
   * @return {?Context}
   */
  var getContext = function () {
    return context;
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
     * @const
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
     * The last child to have been visited within the current pass.
     * @type {?Node}
     */
    this.lastVisitedChild = null;

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

    // If, after changing the attribute,
    // the corresponding property is not updated,
    // also update it.
    if (el[name] !== value) {
      el[name] = value;
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
   * @param {string|Object<string,string>} style The style to set. Either a
   *     string of css or an object containing property-value pairs.
   */
  var applyStyle = function (el, name, style) {
    if (typeof style === 'string') {
      el.style.cssText = style;
    } else {
      el.style.cssText = '';
      var elStyle = el.style;

      for (var prop in style) {
        if (has(style, prop)) {
          elStyle[prop] = style[prop];
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

  var SVG_NS = 'http://www.w3.org/2000/svg';

  /**
   * Enters a tag, checking to see if it is a namespace boundary, and if so,
   * updates the current namespace.
   * @param {string} tag The tag to enter.
   */
  var enterTag = function (tag) {
    if (tag === 'svg') {
      getContext().enterNamespace(SVG_NS);
    } else if (tag === 'foreignObject') {
      getContext().enterNamespace(undefined);
    }
  };

  /**
   * Exits a tag, checking to see if it is a namespace boundary, and if so,
   * updates the current namespace.
   * @param {string} tag The tag to enter.
   */
  var exitTag = function (tag) {
    if (tag === 'svg' || tag === 'foreignObject') {
      getContext().exitNamespace();
    }
  };

  /**
   * Gets the namespace to create an element (of a given tag) in.
   * @param {string} tag The tag to get the namespace for.
   * @return {(string|undefined)} The namespace to create the tag in.
   */
  var getNamespaceForTag = function (tag) {
    if (tag === 'svg') {
      return SVG_NS;
    }

    return getContext().getCurrentNamespace();
  };

  /**
   * Creates an Element.
   * @param {Document} doc The document with which to create the Element.
   * @param {string} tag The tag for the Element.
   * @param {?string=} key A key to identify the Element.
   * @param {?Array<*>=} statics An array of attribute name/value pairs of
   *     the static attributes for the Element.
   * @return {!Element}
   */
  var createElement = function (doc, tag, key, statics) {
    var namespace = getNamespaceForTag(tag);
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
   * Creates a Node, either a Text or an Element depending on the node name
   * provided.
   * @param {Document} doc The document with which to create the Node.
   * @param {string} nodeName The tag if creating an element or #text to create
   *     a Text.
   * @param {?string=} key A key to identify the Element.
   * @param {?Array<*>=} statics The static data to initialize the Node
   *     with. For an Element, an array of attribute name/value pairs of
   *     the static attributes for the Element.
   * @return {!Node}
   */
  var createNode = function (doc, nodeName, key, statics) {
    if (nodeName === '#text') {
      return doc.createTextNode('');
    }

    return createElement(doc, nodeName, key, statics);
  };

  /**
   * Creates a mapping that can be used to look up children using a key.
   * @param {!Node} el
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
   * @param {!Node} el
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
   * @param {!Node} parent
   * @param {?string=} key
   * @return {?Element} The child corresponding to the key.
   */
  var getChild = function (parent, key) {
    return (/** @type {?Element} */key && getKeyMap(parent)[key]
    );
  };

  /**
   * Registers an element as being a child. The parent will keep track of the
   * child using the key. The child can be retrieved using the same key using
   * getKeyMap. The provided key should be unique within the parent Element.
   * @param {!Node} parent The parent of child.
   * @param {string} key A key to identify the child with.
   * @param {!Node} child The child to register.
   */
  var registerChild = function (parent, key, child) {
    getKeyMap(parent)[key] = child;
  };

  if ('development' !== 'production') {
    /**
    * Makes sure that keyed Element matches the tag name provided.
    * @param {!Element} node The node that is being matched.
    * @param {string=} tag The tag name of the Element.
    * @param {?string=} key The key of the Element.
    */
    var assertKeyedTagMatches = function (node, tag, key) {
      var nodeName = getData(node).nodeName;
      if (nodeName !== tag) {
        throw new Error('Was expecting node with key "' + key + '" to be a ' + tag + ', not a ' + nodeName + '.');
      }
    };
  }

  /**
   * Checks whether or not a given node matches the specified nodeName and key.
   *
   * @param {!Node} node An HTML node, typically an HTMLElement or Text.
   * @param {?string} nodeName The nodeName for this node.
   * @param {?string=} key An optional key that identifies a node.
   * @return {boolean} True if the node matches, false otherwise.
   */
  var matches = function (node, nodeName, key) {
    var data = getData(node);

    // Key check is done using double equals as we want to treat a null key the
    // same as undefined. This should be okay as the only values allowed are
    // strings, null and undefined so the == semantics are not too weird.
    return key == data.key && nodeName === data.nodeName;
  };

  /**
   * Aligns the virtual Element definition with the actual DOM, moving the
   * corresponding DOM node to the correct location or creating it if necessary.
   * @param {string} nodeName For an Element, this should be a valid tag string.
   *     For a Text, this should be #text.
   * @param {?string=} key The key used to identify this element.
   * @param {?Array<*>=} statics For an Element, this should be an array of
   *     name-value pairs.
   * @return {!Node} The matching node.
   */
  var alignWithDOM = function (nodeName, key, statics) {
    var context = getContext();
    var walker = context.walker;
    var currentNode = walker.currentNode;
    var parent = walker.getCurrentParent();
    var matchingNode;

    // Check to see if we have a node to reuse
    if (currentNode && matches(currentNode, nodeName, key)) {
      matchingNode = currentNode;
    } else {
      var existingNode = getChild(parent, key);

      // Check to see if the node has moved within the parent or if a new one
      // should be created
      if (existingNode) {
        if ('development' !== 'production') {
          assertKeyedTagMatches(existingNode, nodeName, key);
        }

        matchingNode = existingNode;
      } else {
        matchingNode = createNode(context.doc, nodeName, key, statics);

        if (key) {
          registerChild(parent, key, matchingNode);
        }

        context.markCreated(matchingNode);
      }

      // If the node has a key, remove it from the DOM to prevent a large number
      // of re-orders in the case that it moved far or was completely removed.
      // Since we hold on to a reference through the keyMap, we can always add it
      // back.
      if (currentNode && getData(currentNode).key) {
        parent.replaceChild(matchingNode, currentNode);
        getData(parent).keyMapValid = false;
      } else {
        parent.insertBefore(matchingNode, currentNode);
      }

      walker.currentNode = matchingNode;
    }

    return matchingNode;
  };

  /**
   * Clears out any unvisited Nodes, as the corresponding virtual element
   * functions were never called for them.
   * @param {Node} node
   */
  var clearUnvisitedDOM = function (node) {
    var context = getContext();
    var walker = context.walker;
    var data = getData(node);
    var keyMap = data.keyMap;
    var keyMapValid = data.keyMapValid;
    var lastVisitedChild = data.lastVisitedChild;
    var child = node.lastChild;
    var key;

    data.lastVisitedChild = null;

    if (child === lastVisitedChild && keyMapValid) {
      return;
    }

    if (data.attrs[exports.symbols.placeholder] && walker.currentNode !== walker.root) {
      return;
    }

    while (child !== lastVisitedChild) {
      node.removeChild(child);
      context.markDeleted( /** @type {!Node}*/child);

      key = getData(child).key;
      if (key) {
        delete keyMap[key];
      }
      child = node.lastChild;
    }

    // Clean the keyMap, removing any unusued keys.
    for (key in keyMap) {
      child = keyMap[key];
      if (!child.parentNode) {
        context.markDeleted(child);
        delete keyMap[key];
      }
    }

    data.keyMapValid = true;
  };

  /**
   * Enters an Element, setting the current namespace for nested elements.
   * @param {Node} node
   */
  var enterNode = function (node) {
    var data = getData(node);
    enterTag(data.nodeName);
  };

  /**
   * Exits an Element, unwinding the current namespace to the previous value.
   * @param {Node} node
   */
  var exitNode = function (node) {
    var data = getData(node);
    exitTag(data.nodeName);
  };

  /**
   * Marks node's parent as having visited node.
   * @param {Node} node
   */
  var markVisited = function (node) {
    var context = getContext();
    var walker = context.walker;
    var parent = walker.getCurrentParent();
    var data = getData(parent);
    data.lastVisitedChild = node;
  };

  /**
   * Changes to the first child of the current node.
   */
  var firstChild = function () {
    var context = getContext();
    var walker = context.walker;
    enterNode(walker.currentNode);
    walker.firstChild();
  };

  /**
   * Changes to the next sibling of the current node.
   */
  var nextSibling = function () {
    var context = getContext();
    var walker = context.walker;
    markVisited(walker.currentNode);
    walker.nextSibling();
  };

  /**
   * Changes to the parent of the current node, removing any unvisited children.
   */
  var parentNode = function () {
    var context = getContext();
    var walker = context.walker;
    walker.parentNode();
    exitNode(walker.currentNode);
  };

  if ('development' !== 'production') {
    var assertNoUnclosedTags = function (root) {
      var openElement = getContext().walker.getCurrentParent();
      if (!openElement) {
        return;
      }

      var openTags = [];
      while (openElement && openElement !== root) {
        openTags.push(openElement.nodeName.toLowerCase());
        openElement = openElement.parentNode;
      }

      throw new Error('One or more tags were not closed:\n' + openTags.join('\n'));
    };
  }

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
    enterContext(node);

    firstChild();
    fn(data);
    parentNode();
    clearUnvisitedDOM(node);

    if ('development' !== 'production') {
      assertNoUnclosedTags(node);
    }

    getContext().notifyChanges();
    restoreContext();
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

  if ('development' !== 'production') {
    /**
     * Keeps track whether or not we are in an attributes declaration (after
     * elementOpenStart, but before elementOpenEnd).
     * @type {boolean}
     */
    var inAttributes = false;

    /** Makes sure that the caller is not where attributes are expected. */
    var assertNotInAttributes = function () {
      if (inAttributes) {
        throw new Error('Was not expecting a call to attr or elementOpenEnd, ' + 'they must follow a call to elementOpenStart.');
      }
    };

    /** Makes sure that the caller is where attributes are expected. */
    var assertInAttributes = function () {
      if (!inAttributes) {
        throw new Error('Was expecting a call to attr or elementOpenEnd. ' + 'elementOpenStart must be followed by zero or more calls to attr, ' + 'then one call to elementOpenEnd.');
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
     * @param {string} tag
     */
    var assertCloseMatchesOpenTag = function (tag) {
      var context = getContext();
      var walker = context.walker;
      var closingNode = walker.getCurrentParent();
      var data = getData(closingNode);

      if (tag !== data.nodeName) {
        throw new Error('Received a call to close ' + tag + ' but ' + data.nodeName + ' was open.');
      }
    };

    /** Updates the state to being in an attribute declaration. */
    var setInAttributes = function () {
      inAttributes = true;
    };

    /** Updates the state to not being in an attribute declaration. */
    var setNotInAttributes = function () {
      inAttributes = false;
    };
  }

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
    if ('development' !== 'production') {
      assertNotInAttributes();
    }

    var node = /** @type {!Element}*/alignWithDOM(tag, key, statics);
    var data = getData(node);

    /*
     * Checks to see if one or more attributes have changed for a given Element.
     * When no attributes have changed, this is much faster than checking each
     * individual argument. When attributes have changed, the overhead of this is
     * minimal.
     */
    var attrsArr = data.attrsArr;
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
      var attr,
          newAttrs = data.newAttrs;

      for (attr in newAttrs) {
        newAttrs[attr] = undefined;
      }

      for (i = ATTRIBUTES_OFFSET; i < arguments.length; i += 2) {
        newAttrs[arguments[i]] = arguments[i + 1];
      }

      for (attr in newAttrs) {
        updateAttribute(node, attr, newAttrs[attr]);
      }
    }

    firstChild();
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
    if ('development' !== 'production') {
      assertNotInAttributes();
      setInAttributes();
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
    if ('development' !== 'production') {
      assertInAttributes();
    }

    argsBuilder.push(name, value);
  };

  /**
   * Closes an open tag started with elementOpenStart.
   * @return {!Element} The corresponding Element.
   */
  exports.elementOpenEnd = function () {
    if ('development' !== 'production') {
      assertInAttributes();
      setNotInAttributes();
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
    if ('development' !== 'production') {
      assertNotInAttributes();
      assertCloseMatchesOpenTag(tag);
    }

    parentNode();

    var node = /** @type {!Element} */getContext().walker.currentNode;

    clearUnvisitedDOM(node);

    nextSibling();
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
    if ('development' !== 'production') {
      assertPlaceholderKeySpecified(key);
    }

    var node = exports.elementOpen.apply(null, arguments);
    updateAttribute(node, exports.symbols.placeholder, true);
    exports.elementClose.apply(null, arguments);
    return node;
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
    if ('development' !== 'production') {
      assertNotInAttributes();
    }

    var node = /** @type {!Text}*/alignWithDOM('#text', null);
    var data = getData(node);

    if (data.text !== value) {
      data.text = /** @type {string} */value;

      var formatted = value;
      for (var i = 1; i < arguments.length; i += 1) {
        formatted = arguments[i](formatted);
      }

      node.data = formatted;
    }

    nextSibling();
    return node;
  };
});

},{}],16:[function(require,module,exports){
'use strict';

module.exports = require('./dist/client');

},{"./dist/client":17}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
'use strict';

/**
 * Module dependencies
 */
var decouple = require('decouple');
var Emitter = require('emitter');

/**
 * Privates
 */
var scrollTimeout;
var scrolling = false;
var doc = window.document;
var html = doc.documentElement;
var msPointerSupported = window.navigator.msPointerEnabled;
var touch = {
  'start': msPointerSupported ? 'MSPointerDown' : 'touchstart',
  'move': msPointerSupported ? 'MSPointerMove' : 'touchmove',
  'end': msPointerSupported ? 'MSPointerUp' : 'touchend'
};
var prefix = (function prefix() {
  var regex = /^(Webkit|Khtml|Moz|ms|O)(?=[A-Z])/;
  var styleDeclaration = doc.getElementsByTagName('script')[0].style;
  for (var prop in styleDeclaration) {
    if (regex.test(prop)) {
      return '-' + prop.match(regex)[0].toLowerCase() + '-';
    }
  }
  // Nothing found so far? Webkit does not enumerate over the CSS properties of the style object.
  // However (prop in style) returns the correct value, so we'll have to test for
  // the precence of a specific property
  if ('WebkitOpacity' in styleDeclaration) { return '-webkit-'; }
  if ('KhtmlOpacity' in styleDeclaration) { return '-khtml-'; }
  return '';
}());
function extend(destination, from) {
  for (var prop in from) {
    if (from[prop]) {
      destination[prop] = from[prop];
    }
  }
  return destination;
}
function inherits(child, uber) {
  child.prototype = extend(child.prototype || {}, uber.prototype);
}

/**
 * Slideout constructor
 */
function Slideout(options) {
  options = options || {};

  // Sets default values
  this._startOffsetX = 0;
  this._currentOffsetX = 0;
  this._opening = false;
  this._moved = false;
  this._opened = false;
  this._preventOpen = false;
  this._touch = options.touch === undefined ? true : options.touch && true;

  // Sets panel
  this.panel = options.panel;
  this.menu = options.menu;

  // Sets  classnames
  if(this.panel.className.search('slideout-panel') === -1) { this.panel.className += ' slideout-panel'; }
  if(this.menu.className.search('slideout-menu') === -1) { this.menu.className += ' slideout-menu'; }


  // Sets options
  this._fx = options.fx || 'ease';
  this._duration = parseInt(options.duration, 10) || 300;
  this._tolerance = parseInt(options.tolerance, 10) || 70;
  this._padding = this._translateTo = parseInt(options.padding, 10) || 256;
  this._orientation = options.side === 'right' ? -1 : 1;
  this._translateTo *= this._orientation;

  // Init touch events
  if (this._touch) {
    this._initTouchEvents();
  }
}

/**
 * Inherits from Emitter
 */
inherits(Slideout, Emitter);

/**
 * Opens the slideout menu.
 */
Slideout.prototype.open = function() {
  var self = this;
  this.emit('beforeopen');
  if (html.className.search('slideout-open') === -1) { html.className += ' slideout-open'; }
  this._setTransition();
  this._translateXTo(this._translateTo);
  this._opened = true;
  setTimeout(function() {
    self.panel.style.transition = self.panel.style['-webkit-transition'] = '';
    self.emit('open');
  }, this._duration + 50);
  return this;
};

/**
 * Closes slideout menu.
 */
Slideout.prototype.close = function() {
  var self = this;
  if (!this.isOpen() && !this._opening) {
    return this;
  }
  this.emit('beforeclose');
  this._setTransition();
  this._translateXTo(0);
  this._opened = false;
  setTimeout(function() {
    html.className = html.className.replace(/ slideout-open/, '');
    self.panel.style.transition = self.panel.style['-webkit-transition'] = self.panel.style[prefix + 'transform'] = self.panel.style.transform = '';
    self.emit('close');
  }, this._duration + 50);
  return this;
};

/**
 * Toggles (open/close) slideout menu.
 */
Slideout.prototype.toggle = function() {
  return this.isOpen() ? this.close() : this.open();
};

/**
 * Returns true if the slideout is currently open, and false if it is closed.
 */
Slideout.prototype.isOpen = function() {
  return this._opened;
};

/**
 * Translates panel and updates currentOffset with a given X point
 */
Slideout.prototype._translateXTo = function(translateX) {
  this._currentOffsetX = translateX;
  this.panel.style[prefix + 'transform'] = this.panel.style.transform = 'translateX(' + translateX + 'px)';
  return this;
};

/**
 * Set transition properties
 */
Slideout.prototype._setTransition = function() {
  this.panel.style[prefix + 'transition'] = this.panel.style.transition = prefix + 'transform ' + this._duration + 'ms ' + this._fx;
  return this;
};

/**
 * Initializes touch event
 */
Slideout.prototype._initTouchEvents = function() {
  var self = this;

  /**
   * Decouple scroll event
   */
  this._onScrollFn = decouple(doc, 'scroll', function() {
    if (!self._moved) {
      clearTimeout(scrollTimeout);
      scrolling = true;
      scrollTimeout = setTimeout(function() {
        scrolling = false;
      }, 250);
    }
  });

  /**
   * Prevents touchmove event if slideout is moving
   */
  this._preventMove = function(eve) {
    if (self._moved) {
      eve.preventDefault();
    }
  };

  doc.addEventListener(touch.move, this._preventMove);

  /**
   * Resets values on touchstart
   */
  this._resetTouchFn = function(eve) {
    if (typeof eve.touches === 'undefined') {
      return;
    }

    self._moved = false;
    self._opening = false;
    self._startOffsetX = eve.touches[0].pageX;
    self._preventOpen = (!self._touch || (!self.isOpen() && self.menu.clientWidth !== 0));
  };

  this.panel.addEventListener(touch.start, this._resetTouchFn);

  /**
   * Resets values on touchcancel
   */
  this._onTouchCancelFn = function() {
    self._moved = false;
    self._opening = false;
  };

  this.panel.addEventListener('touchcancel', this._onTouchCancelFn);

  /**
   * Toggles slideout on touchend
   */
  this._onTouchEndFn = function() {
    if (self._moved) {
      self.emit('translateend');
      (self._opening && Math.abs(self._currentOffsetX) > self._tolerance) ? self.open() : self.close();
    }
    self._moved = false;
  };

  this.panel.addEventListener(touch.end, this._onTouchEndFn);

  /**
   * Translates panel on touchmove
   */
  this._onTouchMoveFn = function(eve) {

    if (scrolling || self._preventOpen || typeof eve.touches === 'undefined') {
      return;
    }

    var dif_x = eve.touches[0].clientX - self._startOffsetX;
    var translateX = self._currentOffsetX = dif_x;

    if (Math.abs(translateX) > self._padding) {
      return;
    }

    if (Math.abs(dif_x) > 20) {

      self._opening = true;

      var oriented_dif_x = dif_x * self._orientation;

      if (self._opened && oriented_dif_x > 0 || !self._opened && oriented_dif_x < 0) {
        return;
      }

      if (!self._moved) {
        self.emit('translatestart');
      }

      if (oriented_dif_x <= 0) {
        translateX = dif_x + self._padding * self._orientation;
        self._opening = false;
      }

      if (!self._moved && html.className.search('slideout-open') === -1) {
        html.className += ' slideout-open';
      }

      self.panel.style[prefix + 'transform'] = self.panel.style.transform = 'translateX(' + translateX + 'px)';
      self.emit('translate', translateX);
      self._moved = true;
    }

  };

  this.panel.addEventListener(touch.move, this._onTouchMoveFn);

  return this;
};

/**
 * Enable opening the slideout via touch events.
 */
Slideout.prototype.enableTouch = function() {
  this._touch = true;
  return this;
};

/**
 * Disable opening the slideout via touch events.
 */
Slideout.prototype.disableTouch = function() {
  this._touch = false;
  return this;
};

/**
 * Destroy an instance of slideout.
 */
Slideout.prototype.destroy = function() {
  // Close before clean
  this.close();

  // Remove event listeners
  doc.removeEventListener(touch.move, this._preventMove);
  this.panel.removeEventListener(touch.start, this._resetTouchFn);
  this.panel.removeEventListener('touchcancel', this._onTouchCancelFn);
  this.panel.removeEventListener(touch.end, this._onTouchEndFn);
  this.panel.removeEventListener(touch.move, this._onTouchMoveFn);
  doc.removeEventListener('scroll', this._onScrollFn);

  // Remove methods
  this.open = this.close = function() {};

  // Return the instance so it can be easily dereferenced
  return this;
};

/**
 * Expose Slideout
 */
module.exports = Slideout;

},{"decouple":19,"emitter":20}],19:[function(require,module,exports){
'use strict';

var requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    };
}());

function decouple(node, event, fn) {
  var eve,
      tracking = false;

  function captureEvent(e) {
    eve = e;
    track();
  }

  function track() {
    if (!tracking) {
      requestAnimFrame(update);
      tracking = true;
    }
  }

  function update() {
    fn.call(node, eve);
    tracking = false;
  }

  node.addEventListener(event, captureEvent, false);

  return captureEvent;
}

/**
 * Expose decouple
 */
module.exports = decouple;

},{}],20:[function(require,module,exports){
"use strict";

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

exports.__esModule = true;
/**
 * Creates a new instance of Emitter.
 * @class
 * @returns {Object} Returns a new instance of Emitter.
 * @example
 * // Creates a new instance of Emitter.
 * var Emitter = require('emitter');
 *
 * var emitter = new Emitter();
 */

var Emitter = (function () {
  function Emitter() {
    _classCallCheck(this, Emitter);
  }

  /**
   * Adds a listener to the collection for the specified event.
   * @memberof! Emitter.prototype
   * @function
   * @param {String} event - The event name.
   * @param {Function} listener - A listener function to add.
   * @returns {Object} Returns an instance of Emitter.
   * @example
   * // Add an event listener to "foo" event.
   * emitter.on('foo', listener);
   */

  Emitter.prototype.on = function on(event, listener) {
    // Use the current collection or create it.
    this._eventCollection = this._eventCollection || {};

    // Use the current collection of an event or create it.
    this._eventCollection[event] = this._eventCollection[event] || [];

    // Appends the listener into the collection of the given event
    this._eventCollection[event].push(listener);

    return this;
  };

  /**
   * Adds a listener to the collection for the specified event that will be called only once.
   * @memberof! Emitter.prototype
   * @function
   * @param {String} event - The event name.
   * @param {Function} listener - A listener function to add.
   * @returns {Object} Returns an instance of Emitter.
   * @example
   * // Will add an event handler to "foo" event once.
   * emitter.once('foo', listener);
   */

  Emitter.prototype.once = function once(event, listener) {
    var self = this;

    function fn() {
      self.off(event, fn);
      listener.apply(this, arguments);
    }

    fn.listener = listener;

    this.on(event, fn);

    return this;
  };

  /**
   * Removes a listener from the collection for the specified event.
   * @memberof! Emitter.prototype
   * @function
   * @param {String} event - The event name.
   * @param {Function} listener - A listener function to remove.
   * @returns {Object} Returns an instance of Emitter.
   * @example
   * // Remove a given listener.
   * emitter.off('foo', listener);
   */

  Emitter.prototype.off = function off(event, listener) {

    var listeners = undefined;

    // Defines listeners value.
    if (!this._eventCollection || !(listeners = this._eventCollection[event])) {
      return this;
    }

    listeners.forEach(function (fn, i) {
      if (fn === listener || fn.listener === listener) {
        // Removes the given listener.
        listeners.splice(i, 1);
      }
    });

    // Removes an empty event collection.
    if (listeners.length === 0) {
      delete this._eventCollection[event];
    }

    return this;
  };

  /**
   * Execute each item in the listener collection in order with the specified data.
   * @memberof! Emitter.prototype
   * @function
   * @param {String} event - The name of the event you want to emit.
   * @param {...Object} data - Data to pass to the listeners.
   * @returns {Object} Returns an instance of Emitter.
   * @example
   * // Emits the "foo" event with 'param1' and 'param2' as arguments.
   * emitter.emit('foo', 'param1', 'param2');
   */

  Emitter.prototype.emit = function emit(event) {
    var _this = this;

    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    var listeners = undefined;

    // Defines listeners value.
    if (!this._eventCollection || !(listeners = this._eventCollection[event])) {
      return this;
    }

    // Clone listeners
    listeners = listeners.slice(0);

    listeners.forEach(function (fn) {
      return fn.apply(_this, args);
    });

    return this;
  };

  return Emitter;
})();

/**
 * Exports Emitter
 */
exports["default"] = Emitter;
module.exports = exports["default"];
},{}],21:[function(require,module,exports){
module.exports = require('./lib/supermodels');

},{"./lib/supermodels":32}],22:[function(require,module,exports){
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

},{"./factory":26,"./util":33}],23:[function(require,module,exports){
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

},{}],24:[function(require,module,exports){
'use strict'

module.exports = function EmitterEvent (name, path, target, detail) {
  this.name = name
  this.path = path
  this.target = target

  if (detail) {
    this.detail = detail
  }
}

},{}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
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

},{"./proto":30,"./util":33,"./wrapper":35}],27:[function(require,module,exports){
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
      var item = model.create()
      model.push(item && item.__supermodel ? merge(item, obj[i]) : obj[i])
    }
  }

  return model
}

module.exports = merge

},{}],28:[function(require,module,exports){
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

},{"./emitter-event":24,"./merge":27,"./validation-error":34,"./wrapper":35}],29:[function(require,module,exports){
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

},{}],30:[function(require,module,exports){
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

},{"./emitter-array":23,"./emitter-event":24,"./emitter-object":25,"./model":28,"./util":33}],31:[function(require,module,exports){
'use strict'

module.exports = {}

},{}],32:[function(require,module,exports){
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

},{"./def":22,"./merge":27,"./prop":29,"./supermodel":31}],33:[function(require,module,exports){
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

},{"./supermodel":31}],34:[function(require,module,exports){
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

},{}],35:[function(require,module,exports){
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

},{"./util":33,"./validation-error":34}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvanMvZWRpdG9yL2luZGV4LmpzIiwiY2xpZW50L2pzL2Zzby5qcyIsImNsaWVudC9qcy9mc29zLmpzIiwiY2xpZW50L2pzL2luZGV4LmpzIiwiY2xpZW50L2pzL21vZGVzLmpzIiwiY2xpZW50L2pzL25vaWRlLmpzIiwiY2xpZW50L2pzL3JlY2VudC9pbmRleC5odG1sIiwiY2xpZW50L2pzL3JlY2VudC9pbmRleC5qcyIsImNsaWVudC9qcy9zZXNzaW9uLmpzIiwiY2xpZW50L2pzL3Nlc3Npb25zLmpzIiwiY2xpZW50L2pzL3N0YW5kYXJkLmpzIiwiY2xpZW50L2pzL3RyZWUvaW5kZXguaHRtbCIsImNsaWVudC9qcy90cmVlL2luZGV4LmpzIiwiY29uZmlnL2NsaWVudC5qcyIsIm5vZGVfbW9kdWxlcy9pbmNyZW1lbnRhbC1kb20vZGlzdC9pbmNyZW1lbnRhbC1kb20uanMiLCJub2RlX21vZHVsZXMvbmVzL2NsaWVudC5qcyIsIm5vZGVfbW9kdWxlcy9uZXMvZGlzdC9jbGllbnQuanMiLCJub2RlX21vZHVsZXMvc2xpZGVvdXQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc2xpZGVvdXQvbm9kZV9tb2R1bGVzL2RlY291cGxlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3NsaWRlb3V0L25vZGVfbW9kdWxlcy9lbWl0dGVyL2Rpc3QvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL2RlZi5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcm1vZGVscy5qcy9saWIvZW1pdHRlci1hcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcm1vZGVscy5qcy9saWIvZW1pdHRlci1ldmVudC5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcm1vZGVscy5qcy9saWIvZW1pdHRlci1vYmplY3QuanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL2ZhY3RvcnkuanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL21lcmdlLmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybW9kZWxzLmpzL2xpYi9tb2RlbC5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcm1vZGVscy5qcy9saWIvcHJvcC5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcm1vZGVscy5qcy9saWIvcHJvdG8uanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL3N1cGVybW9kZWwuanMiLCJub2RlX21vZHVsZXMvc3VwZXJtb2RlbHMuanMvbGliL3N1cGVybW9kZWxzLmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybW9kZWxzLmpzL2xpYi91dGlsLmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybW9kZWxzLmpzL2xpYi92YWxpZGF0aW9uLWVycm9yLmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybW9kZWxzLmpzL2xpYi93cmFwcGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDblVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcHNDQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNW1CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vLi4vLi4vY29uZmlnL2NsaWVudCcpXG5cbmZ1bmN0aW9uIEVkaXRvciAoKSB7XG4gIHZhciBlZGl0b3IgPSB3aW5kb3cuYWNlLmVkaXQoJ2VkaXRvcicpXG5cbiAgLy8gZW5hYmxlIGF1dG9jb21wbGV0aW9uIGFuZCBzbmlwcGV0c1xuICBlZGl0b3Iuc2V0T3B0aW9ucyh7XG4gICAgZW5hYmxlU25pcHBldHM6IHRydWUsXG4gICAgZW5hYmxlQmFzaWNBdXRvY29tcGxldGlvbjogdHJ1ZSxcbiAgICBlbmFibGVMaXZlQXV0b2NvbXBsZXRpb246IGZhbHNlXG4gIH0pXG5cbiAgZWRpdG9yLmNvbW1hbmRzLmFkZENvbW1hbmRzKFt7XG4gICAgbmFtZTogJ2hlbHAnLFxuICAgIGJpbmRLZXk6IHtcbiAgICAgIHdpbjogJ0N0cmwtSCcsXG4gICAgICBtYWM6ICdDb21tYW5kLUgnXG4gICAgfSxcbiAgICBleGVjOiBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyAkbW9kYWwub3Blbih7XG4gICAgICAvLyAgIHRlbXBsYXRlVXJsOiAnL2NsaWVudC9mcy92aWV3cy9rZXlib2FyZC1zaG9ydGN1dHMuaHRtbCcsXG4gICAgICAvLyAgIHNpemU6ICdsZydcbiAgICAgIC8vIH0pXG4gICAgfSxcbiAgICByZWFkT25seTogZmFsc2UgLy8gdGhpcyBjb21tYW5kIHNob3VsZCBhcHBseSBpbiByZWFkT25seSBtb2RlXG4gIH1dKVxuXG4gIGVkaXRvci5zZXRUaGVtZSgnYWNlL3RoZW1lLycgKyBjb25maWcuYWNlLnRoZW1lKVxuXG4gIHRoaXMuYWRkQ29tbWFuZHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgZWRpdG9yLmNvbW1hbmRzLmFkZENvbW1hbmRzLmFwcGx5KGVkaXRvci5jb21tYW5kcywgYXJndW1lbnRzKVxuICB9XG4gIHRoaXMuc2V0U2Vzc2lvbiA9IGZ1bmN0aW9uIChlZGl0U2Vzc2lvbikge1xuICAgIGVkaXRvci5zZXRTZXNzaW9uKGVkaXRTZXNzaW9uKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yXG4iLCJ2YXIgc3VwZXJtb2RlbHMgPSByZXF1aXJlKCdzdXBlcm1vZGVscy5qcycpXG5cbnZhciBzY2hlbWEgPSB7XG4gIG5hbWU6IFN0cmluZyxcbiAgcGF0aDogU3RyaW5nLFxuICBkaXI6IFN0cmluZyxcbiAgaXNEaXJlY3Rvcnk6IEJvb2xlYW4sXG4gIGV4dDogU3RyaW5nLFxuICBzdGF0OiBPYmplY3QsXG4gIGdldCBpc0ZpbGUgKCkge1xuICAgIHJldHVybiAhdGhpcy5pc0RpcmVjdG9yeVxuICB9LFxuICBleHBhbmRlZDogQm9vbGVhblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN1cGVybW9kZWxzKHNjaGVtYSlcbiIsInZhciBzdXBlcm1vZGVscyA9IHJlcXVpcmUoJ3N1cGVybW9kZWxzLmpzJylcbnZhciBGc28gPSByZXF1aXJlKCcuL2ZzbycpXG5cbnZhciBzY2hlbWEgPSB7XG4gIF9fdHlwZTogW0Zzb10sXG4gIGZpbmRCeVBhdGg6IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMuZmluZChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0ucGF0aCA9PT0gcGF0aFxuICAgIH0pXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdXBlcm1vZGVscyhzY2hlbWEpXG4iLCJ2YXIgU2xpZGVvdXQgPSByZXF1aXJlKCdzbGlkZW91dCcpXG52YXIgbm9pZGUgPSByZXF1aXJlKCcuL25vaWRlJylcbnZhciBUcmVlID0gcmVxdWlyZSgnLi90cmVlJylcbnZhciBSZWNlbnQgPSByZXF1aXJlKCcuL3JlY2VudCcpXG5cbndpbmRvdy5vbmJlZm9yZXVubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKG5vaWRlLnNlc3Npb25zLmRpcnR5Lmxlbmd0aCkge1xuICAgIHJldHVybiAnVW5zYXZlZCBjaGFuZ2VzIHdpbGwgYmUgbG9zdCAtIGFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBsZWF2ZT8nXG4gIH1cbn1cblxudmFyIG1lbnVFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51JylcbnZhciByZWNlbnRFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWNlbnQnKVxudmFyIHRyZWVFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0cmVlJylcblxubm9pZGUuY2xpZW50LmNvbm5lY3QoZnVuY3Rpb24gKGVycikge1xuICBpZiAoZXJyKSB7XG4gICAgcmV0dXJuIG5vaWRlLmhhbmRsZUVycm9yKGVycilcbiAgfVxuXG4gIHZhciB0cmVlID0gbmV3IFRyZWUodHJlZUVsLCBub2lkZS5maWxlcywgbm9pZGUuc3RhdGUpXG4gIHZhciByZWNlbnQgPSBuZXcgUmVjZW50KHJlY2VudEVsLCBub2lkZS5zdGF0ZSlcblxuICBub2lkZS5maWxlcy5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkgeyB0cmVlLnJlbmRlcigpIH0pXG4gIG5vaWRlLnN0YXRlLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7IHJlY2VudC5yZW5kZXIoKSB9KVxufSlcblxudmFyIHNsaWRlb3V0ID0gbmV3IFNsaWRlb3V0KHtcbiAgcGFuZWw6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYW5lbCcpLFxuICBtZW51OiBtZW51RWwsXG4gIHBhZGRpbmc6IDI1NixcbiAgdG9sZXJhbmNlOiA3MFxufSlcbnNsaWRlb3V0Lm9wZW4oKVxuXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanMtc2xpZGVvdXQtdG9nZ2xlJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gIHNsaWRlb3V0LnRvZ2dsZSgpXG59KVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZmlsZSkge1xuICB2YXIgbW9kZXMgPSB7XG4gICAgJy5qcyc6ICdhY2UvbW9kZS9qYXZhc2NyaXB0JyxcbiAgICAnLmNzcyc6ICdhY2UvbW9kZS9jc3MnLFxuICAgICcuc2Nzcyc6ICdhY2UvbW9kZS9zY3NzJyxcbiAgICAnLmxlc3MnOiAnYWNlL21vZGUvbGVzcycsXG4gICAgJy5odG1sJzogJ2FjZS9tb2RlL2h0bWwnLFxuICAgICcuaHRtJzogJ2FjZS9tb2RlL2h0bWwnLFxuICAgICcuZWpzJzogJ2FjZS9tb2RlL2h0bWwnLFxuICAgICcuanNvbic6ICdhY2UvbW9kZS9qc29uJyxcbiAgICAnLm1kJzogJ2FjZS9tb2RlL21hcmtkb3duJyxcbiAgICAnLmNvZmZlZSc6ICdhY2UvbW9kZS9jb2ZmZWUnLFxuICAgICcuamFkZSc6ICdhY2UvbW9kZS9qYWRlJyxcbiAgICAnLnBocCc6ICdhY2UvbW9kZS9waHAnLFxuICAgICcucHknOiAnYWNlL21vZGUvcHl0aG9uJyxcbiAgICAnLnNhc3MnOiAnYWNlL21vZGUvc2FzcycsXG4gICAgJy50eHQnOiAnYWNlL21vZGUvdGV4dCcsXG4gICAgJy50eXBlc2NyaXB0JzogJ2FjZS9tb2RlL3R5cGVzY3JpcHQnLFxuICAgICcueG1sJzogJ2FjZS9tb2RlL3htbCdcbiAgfVxuXG4gIHJldHVybiBtb2Rlc1tmaWxlLmV4dF1cbn1cbiIsInZhciBOZXMgPSByZXF1aXJlKCduZXMvY2xpZW50JylcbnZhciBzdXBlcm1vZGVscyA9IHJlcXVpcmUoJ3N1cGVybW9kZWxzLmpzJylcbnZhciBTZXNzaW9ucyA9IHJlcXVpcmUoJy4vc2Vzc2lvbnMnKVxudmFyIEVkaXRvciA9IHJlcXVpcmUoJy4vZWRpdG9yJylcbnZhciBGc28gPSByZXF1aXJlKCcuL2ZzbycpXG52YXIgRnNvcyA9IHJlcXVpcmUoJy4vZnNvcycpXG52YXIgcHJvcCA9IHN1cGVybW9kZWxzLnByb3AoKVxudmFyIGVkaXRvciA9IG5ldyBFZGl0b3IoKVxudmFyIHN0b3JhZ2VLZXkgPSAnbm9pZGUnXG52YXIgc2Vzc2lvbnMgPSBuZXcgU2Vzc2lvbnMoKVxudmFyIGhvc3QgPSB3aW5kb3cubG9jYXRpb24uaG9zdFxudmFyIGNsaWVudCA9IG5ldyBOZXMuQ2xpZW50KCd3czovLycgKyBob3N0KVxudmFyIGZpbGVzID0gbmV3IEZzb3MoKVxudmFyIHN0YXRlTG9hZGVkID0gZmFsc2VcblxudmFyIHN0YXRlU2NoZW1hID0ge1xuICByZWNlbnQ6IEZzb3MsXG4gIGN1cnJlbnQ6IEZzb1xufVxuXG52YXIgU3RhdGUgPSBzdXBlcm1vZGVscyhzdGF0ZVNjaGVtYSlcbnZhciBzdGF0ZSA9IG5ldyBTdGF0ZSh7XG4gIHJlY2VudDogbmV3IEZzb3MoKVxufSlcblxuY2xpZW50Lm9uRGlzY29ubmVjdCA9IGZ1bmN0aW9uICh3aWxsUmVjb25uZWN0LCBsb2cpIHtcbiAgbm9pZGUuY29ubmVjdGVkID0gd2lsbFJlY29ubmVjdCA/IG51bGwgOiBmYWxzZVxuICBjb25zb2xlLmxvZyhsb2cpXG59XG5cbmNsaWVudC5vbkNvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XG4gIG5vaWRlLmNvbm5lY3RlZCA9IHRydWVcbiAgY2xpZW50LnJlcXVlc3QoJy93YXRjaGVkJywgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiBoYW5kbGVFcnJvcihlcnIpXG4gICAgfVxuXG4gICAgdmFyIGZpbGVzID0gbm9pZGUuZmlsZXNcbiAgICBmaWxlcy5zcGxpY2UuYXBwbHkoZmlsZXMsIFswLCBmaWxlcy5sZW5ndGhdLmNvbmNhdChuZXcgRnNvcyhwYXlsb2FkKSkpXG5cbiAgICBpZiAoIXN0YXRlTG9hZGVkKSB7XG4gICAgICBsb2FkU3RhdGUoKVxuICAgICAgc3RhdGVMb2FkZWQgPSB0cnVlXG5cbiAgICAgIG5vaWRlLmNsaWVudC5zdWJzY3JpYmUoJy9jaGFuZ2UnLCBmdW5jdGlvbiAocGF5bG9hZCkge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgIH1cblxuICAgICAgICBzZXNzaW9ucy5pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChzZXNzaW9uKSB7XG4gICAgICAgICAgdmFyIGZpbGUgPSBzZXNzaW9uLmZpbGVcbiAgICAgICAgICBpZiAocGF5bG9hZC5wYXRoID09PSBmaWxlLnBhdGgpIHtcbiAgICAgICAgICAgIGlmIChwYXlsb2FkLnN0YXQubXRpbWUgIT09IGZpbGUuc3RhdC5tdGltZSkge1xuICAgICAgICAgICAgICByZWFkRmlsZShmaWxlLnBhdGgsIGZ1bmN0aW9uIChlcnIsIHBheWxvYWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gaGFuZGxlRXJyb3IoZXJyKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaWxlLnN0YXQgPSBwYXlsb2FkLnN0YXRcbiAgICAgICAgICAgICAgICBzZXNzaW9uLmVkaXRTZXNzaW9uLnNldFZhbHVlKHBheWxvYWQuY29udGVudHMpXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIGhhbmRsZUVycm9yKGVycilcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC8vXG4gICAgICAvLyBjbGllbnQuc3Vic2NyaWJlKCcvdW5saW5rJywgZnVuY3Rpb24gKHBheWxvYWQpIHtcbiAgICAgIC8vICAgaWYgKGVycikge1xuICAgICAgLy8gICAgIHRocm93IGVyclxuICAgICAgLy8gICB9XG4gICAgICAvL1xuICAgICAgLy8gICB2YXIgZGF0YSA9IHBheWxvYWRcbiAgICAgIC8vICAgaWYgKGRhdGEucGF0aCA9PT0gc3RhdGUucGF0aCkge1xuICAgICAgLy8gICAgIGlmICh3aW5kb3cuY29uZmlybSgnRmlsZSBoYXMgYmVlbiByZW1vdmVkIC0gY2xvc2UgdGhpcyB0YWI/JykpIHtcbiAgICAgIC8vICAgICAgIHdpbmRvdy5jbG9zZSgpXG4gICAgICAvLyAgICAgfVxuICAgICAgLy8gICB9XG4gICAgICAvLyB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAvLyAgIGlmIChlcnIpIHtcbiAgICAgIC8vICAgICByZXR1cm4gaGFuZGxlRXJyb3IoZXJyKVxuICAgICAgLy8gICB9XG4gICAgICAvLyB9KVxuICAgICAgLy9cbiAgICAgIHZhciBsYXN0Q29uc29sZVBpZFxuICAgICAgY2xpZW50LnN1YnNjcmliZSgnL2lvJywgZnVuY3Rpb24gKHBheWxvYWQpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJldHVybiBoYW5kbGVFcnJvcihlcnIpXG4gICAgICAgIH1cbnZhciBkXG4gICAgICAgIGlmIChsYXN0Q29uc29sZVBpZCAhPT0gcGF5bG9hZC5waWQpIHtcbiAgICAgICAgICBsYXN0Q29uc29sZVBpZCA9IHBheWxvYWQucGlkXG4gICAgICAgICAgY29uc29sZS5sb2cobGFzdENvbnNvbGVQaWQpXG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2cocGF5bG9hZC5kYXRhKVxuICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIGhhbmRsZUVycm9yKGVycilcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgY2xpZW50LnN1YnNjcmliZSgnL2lvL3BpZHMnLCBmdW5jdGlvbiAocGF5bG9hZCkge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIGhhbmRsZUVycm9yKGVycilcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhwYXlsb2FkKVxuICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIGhhbmRsZUVycm9yKGVycilcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gIH0pXG59XG5cbmZ1bmN0aW9uIGhhbmRsZUVycm9yIChlcnIpIHtcbiAgY29uc29sZS5lcnJvcihlcnIpXG59XG5cbmZ1bmN0aW9uIHNhdmVTdGF0ZSAoKSB7XG4gIHZhciBzdGF0ZSA9IG5vaWRlLnN0YXRlXG4gIHZhciBzdG9yYWdlID0ge1xuICAgIGN1cnJlbnQ6IHN0YXRlLmN1cnJlbnQgPyBzdGF0ZS5jdXJyZW50LnBhdGggOiBudWxsLFxuICAgIHJlY2VudDogc3RhdGUucmVjZW50Lm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0ucGF0aFxuICAgIH0pLFxuICAgIGV4cGFuZGVkOiBmaWxlcy5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHJldHVybiBpdGVtLmV4cGFuZGVkXG4gICAgfSkubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5wYXRoXG4gICAgfSlcbiAgfVxuICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oc3RvcmFnZUtleSwgSlNPTi5zdHJpbmdpZnkoc3RvcmFnZSkpXG59XG5cbmZ1bmN0aW9uIGxvYWRTdGF0ZSAoKSB7XG4gIHZhciBzdG9yYWdlID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKHN0b3JhZ2VLZXkpXG4gIHN0b3JhZ2UgPSBzdG9yYWdlID8gSlNPTi5wYXJzZShzdG9yYWdlKSA6IHt9XG5cbiAgdmFyIGRpciwgZmlsZSwgaSwgY3VycmVudFxuICB2YXIgcmVjZW50ID0gW11cblxuICBpZiAoc3RvcmFnZS5yZWNlbnQpIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgc3RvcmFnZS5yZWNlbnQubGVuZ3RoOyBpKyspIHtcbiAgICAgIGZpbGUgPSBmaWxlcy5maW5kQnlQYXRoKHN0b3JhZ2UucmVjZW50W2ldKVxuICAgICAgaWYgKGZpbGUpIHtcbiAgICAgICAgcmVjZW50LnB1c2goZmlsZSlcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJlY2VudC5sZW5ndGgpIHtcbiAgICAgIHN0YXRlLnJlY2VudC5zcGxpY2UuYXBwbHkoc3RhdGUucmVjZW50LCBbMCwgMF0uY29uY2F0KHJlY2VudCkpXG4gICAgfVxuICB9XG5cbiAgaWYgKHN0b3JhZ2UuY3VycmVudCkge1xuICAgIGZpbGUgPSBmaWxlcy5maW5kQnlQYXRoKHN0b3JhZ2UuY3VycmVudClcbiAgICBpZiAoZmlsZSkge1xuICAgICAgY3VycmVudCA9IGZpbGVcbiAgICB9XG4gIH1cblxuICBpZiAoc3RvcmFnZS5leHBhbmRlZCkge1xuICAgIGZvciAoaSA9IDA7IGkgPCBzdG9yYWdlLmV4cGFuZGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICBkaXIgPSBmaWxlcy5maW5kQnlQYXRoKHN0b3JhZ2UuZXhwYW5kZWRbaV0pXG4gICAgICBpZiAoZGlyKSB7XG4gICAgICAgIGRpci5leHBhbmRlZCA9IHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoY3VycmVudCkge1xuICAgIG9wZW5GaWxlKGN1cnJlbnQpXG4gIH1cbn1cblxuZnVuY3Rpb24gcmVhZEZpbGUgKHBhdGgsIGNhbGxiYWNrKSB7XG4gIGNsaWVudC5yZXF1ZXN0KHtcbiAgICBwYXRoOiAnL3JlYWRmaWxlJyxcbiAgICBwYXlsb2FkOiB7XG4gICAgICBwYXRoOiBwYXRoXG4gICAgfSxcbiAgICBtZXRob2Q6ICdQT1NUJ1xuICB9LCBjYWxsYmFjaylcbn1cblxuZnVuY3Rpb24gb3BlbkZpbGUgKGZpbGUpIHtcbiAgdmFyIHNlc3Npb24gPSBzZXNzaW9ucy5maW5kKGZpbGUpXG4gIGlmIChzZXNzaW9uKSB7XG4gICAgc3RhdGUuY3VycmVudCA9IGZpbGVcbiAgICBlZGl0b3Iuc2V0U2Vzc2lvbihzZXNzaW9uLmVkaXRTZXNzaW9uKVxuICB9IGVsc2Uge1xuICAgIHJlYWRGaWxlKGZpbGUucGF0aCwgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gaGFuZGxlRXJyb3IoZXJyKVxuICAgICAgfVxuXG4gICAgICBpZiAoIXN0YXRlLnJlY2VudC5maW5kQnlQYXRoKGZpbGUucGF0aCkpIHtcbiAgICAgICAgc3RhdGUucmVjZW50LnVuc2hpZnQoZmlsZSlcbiAgICAgIH1cblxuICAgICAgc2Vzc2lvbiA9IHNlc3Npb25zLmFkZChmaWxlLCBwYXlsb2FkLmNvbnRlbnRzKVxuICAgICAgc3RhdGUuY3VycmVudCA9IGZpbGVcbiAgICAgIGVkaXRvci5zZXRTZXNzaW9uKHNlc3Npb24uZWRpdFNlc3Npb24pXG4gICAgfSlcbiAgfVxufVxuXG5mdW5jdGlvbiBjbG9zZUZpbGUgKGZpbGUpIHtcbiAgdmFyIGNsb3NlID0gZmFsc2VcbiAgdmFyIHNlc3Npb24gPSBzZXNzaW9ucy5maW5kKGZpbGUpXG5cbiAgaWYgKHNlc3Npb24gJiYgc2Vzc2lvbi5pc0RpcnR5KSB7XG4gICAgaWYgKHdpbmRvdy5jb25maXJtKCdUaGVyZSBhcmUgdW5zYXZlZCBjaGFuZ2VzIHRvIHRoaXMgZmlsZS4gQXJlIHlvdSBzdXJlPycpKSB7XG4gICAgICBjbG9zZSA9IHRydWVcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY2xvc2UgPSB0cnVlXG4gIH1cblxuICBpZiAoY2xvc2UpIHtcbiAgICAvLyBSZW1vdmUgZnJvbSByZWNlbnQgZmlsZXNcbiAgICBzdGF0ZS5yZWNlbnQuc3BsaWNlKHN0YXRlLnJlY2VudC5pbmRleE9mKGZpbGUpLCAxKVxuXG4gICAgaWYgKHNlc3Npb24pIHtcbiAgICAgIC8vIFJlbW92ZSBzZXNzaW9uXG4gICAgICBzZXNzaW9ucy5pdGVtcy5zcGxpY2Uoc2Vzc2lvbnMuaXRlbXMuaW5kZXhPZihzZXNzaW9uKSwgMSlcblxuICAgICAgaWYgKHN0YXRlLmN1cnJlbnQgPT09IGZpbGUpIHtcbiAgICAgICAgaWYgKHNlc3Npb25zLml0ZW1zLmxlbmd0aCkge1xuICAgICAgICAgIC8vIE9wZW4gdGhlIG5leHQgc2Vzc2lvblxuICAgICAgICAgIG9wZW5GaWxlKHNlc3Npb25zLml0ZW1zWzBdLmZpbGUpXG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUucmVjZW50Lmxlbmd0aCkge1xuICAgICAgICAgIC8vIE9wZW4gdGhlIG5leHQgZmlsZVxuICAgICAgICAgIG9wZW5GaWxlKHN0YXRlLnJlY2VudFswXSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdGF0ZS5jdXJyZW50ID0gbnVsbFxuICAgICAgICAgIGVkaXRvci5zZXRTZXNzaW9uKG51bGwpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gd3JpdGVGaWxlIChwYXRoLCBjb250ZW50cywgY2FsbGJhY2spIHtcbiAgY2xpZW50LnJlcXVlc3Qoe1xuICAgIHBhdGg6ICcvd3JpdGVmaWxlJyxcbiAgICBwYXlsb2FkOiB7XG4gICAgICBwYXRoOiBwYXRoLFxuICAgICAgY29udGVudHM6IGNvbnRlbnRzXG4gICAgfSxcbiAgICBtZXRob2Q6ICdQVVQnXG4gIH0sIGNhbGxiYWNrKVxufVxuXG5mdW5jdGlvbiBzYXZlQWxsICgpIHtcbiAgc2Vzc2lvbnMuZGlydHkuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgIHZhciBmaWxlID0gaXRlbS5maWxlXG4gICAgdmFyIGVkaXRTZXNzaW9uID0gaXRlbS5lZGl0U2Vzc2lvblxuICAgIHdyaXRlRmlsZShmaWxlLnBhdGgsIGVkaXRTZXNzaW9uLmdldFZhbHVlKCksIGZ1bmN0aW9uIChlcnIsIHBheWxvYWQpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIGhhbmRsZUVycm9yKGVycilcbiAgICAgIH1cbiAgICAgIGZpbGUuc3RhdCA9IHBheWxvYWQuc3RhdFxuICAgICAgZWRpdFNlc3Npb24uZ2V0VW5kb01hbmFnZXIoKS5tYXJrQ2xlYW4oKVxuICAgIH0pXG4gIH0pXG59XG5cbnZhciBzY2hlbWEgPSB7XG4gIGNvbm5lY3RlZDogcHJvcChCb29sZWFuKS52YWx1ZShmYWxzZSksXG4gIGdldCBmaWxlcygpIHsgcmV0dXJuIGZpbGVzIH0sXG4gIGdldCBzdGF0ZSgpIHsgcmV0dXJuIHN0YXRlIH0sXG4gIGdldCBjbGllbnQoKSB7IHJldHVybiBjbGllbnQgfSxcbiAgZ2V0IGVkaXRvcigpIHsgcmV0dXJuIGVkaXRvciB9LFxuICBnZXQgc2Vzc2lvbnMoKSB7IHJldHVybiBzZXNzaW9ucyB9LFxuICBvcGVuRmlsZTogb3BlbkZpbGUsXG4gIGNsb3NlRmlsZTogY2xvc2VGaWxlLFxuICByZWFkRmlsZTogcmVhZEZpbGUsXG4gIHdyaXRlRmlsZTogd3JpdGVGaWxlXG59XG5cbnZhciBOb2lkZSA9IHN1cGVybW9kZWxzKHNjaGVtYSlcbnZhciBub2lkZSA9IG5ldyBOb2lkZSgpXG5cbnN0YXRlLm9uKCdjaGFuZ2UnLCBzYXZlU3RhdGUpXG5cbmVkaXRvci5hZGRDb21tYW5kcyhbe1xuICBuYW1lOiAnc2F2ZScsXG4gIGJpbmRLZXk6IHtcbiAgICB3aW46ICdDdHJsLVMnLFxuICAgIG1hYzogJ0NvbW1hbmQtUydcbiAgfSxcbiAgZXhlYzogZnVuY3Rpb24gKGVkaXRvcikge1xuICAgIHZhciBmaWxlID0gc3RhdGUuY3VycmVudFxuICAgIHZhciBlZGl0U2Vzc2lvbiA9IHNlc3Npb25zLmZpbmQoZmlsZSkuZWRpdFNlc3Npb25cbiAgICB3cml0ZUZpbGUoZmlsZS5wYXRoLCBlZGl0U2Vzc2lvbi5nZXRWYWx1ZSgpLCBmdW5jdGlvbiAoZXJyLCBwYXlsb2FkKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBoYW5kbGVFcnJvcihlcnIpXG4gICAgICB9XG4gICAgICBmaWxlLnN0YXQgPSBwYXlsb2FkLnN0YXRcbiAgICAgIGVkaXRTZXNzaW9uLmdldFVuZG9NYW5hZ2VyKCkubWFya0NsZWFuKClcbiAgICB9KVxuICB9LFxuICByZWFkT25seTogZmFsc2Vcbn0sIHtcbiAgbmFtZTogJ3NhdmVhbGwnLFxuICBiaW5kS2V5OiB7XG4gICAgd2luOiAnQ3RybC1TaGlmdC1TJyxcbiAgICBtYWM6ICdDb21tYW5kLU9wdGlvbi1TJ1xuICB9LFxuICBleGVjOiBmdW5jdGlvbiAoZWRpdG9yKSB7XG4gICAgc2F2ZUFsbCgpXG4gIH0sXG4gIHJlYWRPbmx5OiBmYWxzZVxufV0pXG5cbnZhciBsaW50ZXIgPSByZXF1aXJlKCcuL3N0YW5kYXJkJylcbmxpbnRlcihub2lkZSlcblxud2luZG93Lm5vaWRlID0gbm9pZGVcbm1vZHVsZS5leHBvcnRzID0gbm9pZGVcbiIsInZhciBJbmNyZW1lbnRhbERPTSA9IHJlcXVpcmUoJ2luY3JlbWVudGFsLWRvbScpXG52YXIgcGF0Y2ggPSBJbmNyZW1lbnRhbERPTS5wYXRjaFxudmFyIGVsZW1lbnRPcGVuID0gSW5jcmVtZW50YWxET00uZWxlbWVudE9wZW5cbnZhciBlbGVtZW50Vm9pZCA9IEluY3JlbWVudGFsRE9NLmVsZW1lbnRWb2lkXG52YXIgZWxlbWVudENsb3NlID0gSW5jcmVtZW50YWxET00uZWxlbWVudENsb3NlXG52YXIgdGV4dCA9IEluY3JlbWVudGFsRE9NLnRleHRcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiByZWNlbnQgKGZpbGVzLCBjdXJyZW50LCBvbkNsaWNrLCBvbkNsaWNrQ2xvc2UpIHtcbiAgZWxlbWVudE9wZW4oXCJ1bFwiLCBudWxsLCBudWxsLCBcInN0eWxlXCIsIHtkaXNwbGF5OiBmaWxlcy5sZW5ndGggPyAnJyA6ICdub25lJ30pXG4gICAgOyhBcnJheS5pc0FycmF5KGZpbGVzKSA/IGZpbGVzIDogT2JqZWN0LmtleXMoZmlsZXMpKS5mb3JFYWNoKGZ1bmN0aW9uKGZpbGUsICRpbmRleCkge1xuICAgICAgZWxlbWVudE9wZW4oXCJsaVwiLCBmaWxlLnBhdGgpXG4gICAgICAgIGVsZW1lbnRPcGVuKFwiYVwiLCBudWxsLCBbXCJocmVmXCIsIFwiI1wiLCBcImNsYXNzXCIsIFwibmFtZSBpY29uIGljb24tZmlsZS10ZXh0XCJdLCBcIm9uY2xpY2tcIiwgZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgICAgICRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHZhciAkZWxlbWVudCA9IHRoaXM7XG4gICAgICAgIG9uQ2xpY2soZmlsZSl9LCBcInRpdGxlXCIsIGZpbGUucGF0aCwgXCJkYXRhLW5hbWVcIiwgZmlsZS5uYW1lLCBcImRhdGEtcGF0aFwiLCBmaWxlLnJlbGF0aXZlUGF0aClcbiAgICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIilcbiAgICAgICAgICAgIHRleHQoXCJcIiArIChmaWxlLm5hbWUpICsgXCJcIilcbiAgICAgICAgICBlbGVtZW50Q2xvc2UoXCJzcGFuXCIpXG4gICAgICAgIGVsZW1lbnRDbG9zZShcImFcIilcbiAgICAgICAgZWxlbWVudE9wZW4oXCJhXCIsIG51bGwsIFtcImNsYXNzXCIsIFwiY2xvc2VcIl0sIFwib25jbGlja1wiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgICAgb25DbGlja0Nsb3NlKGZpbGUpfSlcbiAgICAgICAgICB0ZXh0KFwi4pyWXCIpXG4gICAgICAgIGVsZW1lbnRDbG9zZShcImFcIilcbiAgICAgICAgaWYgKGZpbGUgPT09IGN1cnJlbnQpIHtcbiAgICAgICAgICBlbGVtZW50T3BlbihcInNwYW5cIiwgbnVsbCwgW1wiY2xhc3NcIiwgXCJ0cmlhbmdsZS1sZWZ0XCJdKVxuICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNwYW5cIilcbiAgICAgICAgfVxuICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICB9LCBmaWxlcylcbiAgZWxlbWVudENsb3NlKFwidWxcIilcbn07XG4iLCJ2YXIgcGF0Y2ggPSByZXF1aXJlKCdpbmNyZW1lbnRhbC1kb20nKS5wYXRjaFxudmFyIHZpZXcgPSByZXF1aXJlKCcuL2luZGV4Lmh0bWwnKVxudmFyIG5vaWRlID0gcmVxdWlyZSgnLi4vbm9pZGUnKVxuXG5mdW5jdGlvbiBSZWNlbnQgKGVsLCBzdGF0ZSkge1xuICBzdGF0ZS5vbignY2hhbmdlJywgcmVuZGVyKVxuXG4gIGZ1bmN0aW9uIG9uQ2xpY2sgKGZpbGUpIHtcbiAgICBub2lkZS5vcGVuRmlsZShmaWxlKVxuICB9XG5cbiAgZnVuY3Rpb24gb25DbGlja0Nsb3NlIChmaWxlKSB7XG4gICAgbm9pZGUuY2xvc2VGaWxlKGZpbGUpXG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGUgKHN0YXRlKSB7XG4gICAgdmlldyhzdGF0ZS5yZWNlbnQsIHN0YXRlLmN1cnJlbnQsIG9uQ2xpY2ssIG9uQ2xpY2tDbG9zZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlciAoKSB7XG4gICAgcGF0Y2goZWwsIHVwZGF0ZSwgc3RhdGUpXG4gIH1cblxuICB0aGlzLnJlbmRlciA9IHJlbmRlclxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlY2VudFxuIiwidmFyIHN1cGVybW9kZWxzID0gcmVxdWlyZSgnc3VwZXJtb2RlbHMuanMnKVxudmFyIEZzbyA9IHJlcXVpcmUoJy4vZnNvJylcbnZhciBwcm9wID0gc3VwZXJtb2RlbHMucHJvcCgpXG5cbm1vZHVsZS5leHBvcnRzID0gc3VwZXJtb2RlbHMoe1xuICBmaWxlOiBGc28sXG4gIGVkaXRTZXNzaW9uOiBPYmplY3QsXG4gIGNyZWF0ZWQ6IHByb3AoRGF0ZSkudmFsdWUoRGF0ZS5ub3cpLFxuICBtb2RpZmllZDogcHJvcChEYXRlKS52YWx1ZShEYXRlLm5vdyksXG4gIGdldCBpc0NsZWFuICgpIHtcbiAgICByZXR1cm4gdGhpcy5lZGl0U2Vzc2lvbi5nZXRVbmRvTWFuYWdlcigpLmlzQ2xlYW4oKVxuICB9LFxuICBnZXQgaXNEaXJ0eSAoKSB7XG4gICAgcmV0dXJuICF0aGlzLmlzQ2xlYW5cbiAgfVxufSlcbiIsIi8vIHZhciBhY2UgPSByZXF1aXJlKCdicmFjZScpXG52YXIgc3VwZXJtb2RlbHMgPSByZXF1aXJlKCdzdXBlcm1vZGVscy5qcycpXG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vLi4vY29uZmlnL2NsaWVudCcpXG52YXIgbW9kZXMgPSByZXF1aXJlKCcuL21vZGVzJylcbnZhciBTZXNzaW9uID0gcmVxdWlyZSgnLi9zZXNzaW9uJylcbnZhciBFZGl0U2Vzc2lvbiA9IHdpbmRvdy5hY2UucmVxdWlyZSgnYWNlL2VkaXRfc2Vzc2lvbicpLkVkaXRTZXNzaW9uXG52YXIgVW5kb01hbmFnZXIgPSB3aW5kb3cuYWNlLnJlcXVpcmUoJ2FjZS91bmRvbWFuYWdlcicpLlVuZG9NYW5hZ2VyXG5cbnZhciBzY2hlbWEgPSB7XG4gIGl0ZW1zOiBbU2Vzc2lvbl0sXG4gIGdldCBkaXJ0eSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXRlbXMuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gIWl0ZW0uaXNDbGVhblxuICAgIH0pXG4gIH0sXG4gIGZpbmQ6IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgcmV0dXJuIHRoaXMuaXRlbXMuZmluZChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0uZmlsZSA9PT0gZmlsZVxuICAgIH0pXG4gIH0sXG4gIGFkZDogZnVuY3Rpb24gKGZpbGUsIGNvbnRlbnRzKSB7XG4gICAgdmFyIGVkaXRTZXNzaW9uID0gbmV3IEVkaXRTZXNzaW9uKGNvbnRlbnRzLCBtb2RlcyhmaWxlKSlcbiAgICBlZGl0U2Vzc2lvbi5zZXRNb2RlKG1vZGVzKGZpbGUpKVxuICAgIGVkaXRTZXNzaW9uLnNldFVzZVdvcmtlcihmYWxzZSlcbiAgICBlZGl0U2Vzc2lvbi5zZXRUYWJTaXplKGNvbmZpZy5hY2UudGFiU2l6ZSlcbiAgICBlZGl0U2Vzc2lvbi5zZXRVc2VTb2Z0VGFicyhjb25maWcuYWNlLnVzZVNvZnRUYWJzKVxuICAgIGVkaXRTZXNzaW9uLnNldFVuZG9NYW5hZ2VyKG5ldyBVbmRvTWFuYWdlcigpKVxuXG4gICAgdmFyIHNlc3Npb24gPSBuZXcgU2Vzc2lvbih7XG4gICAgICBmaWxlOiBmaWxlLFxuICAgICAgZWRpdFNlc3Npb246IGVkaXRTZXNzaW9uXG4gICAgfSlcbiAgICB0aGlzLml0ZW1zLnB1c2goc2Vzc2lvbilcbiAgICByZXR1cm4gc2Vzc2lvblxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc3VwZXJtb2RlbHMoc2NoZW1hKVxuIiwiZnVuY3Rpb24gbGludGVyIChub2lkZSkge1xuICBmdW5jdGlvbiBsaW50ICgpIHtcbiAgICB2YXIgZmlsZSA9IG5vaWRlLnN0YXRlLmN1cnJlbnRcbiAgICBpZiAoZmlsZSAmJiBmaWxlLmV4dCA9PT0gJy5qcycpIHtcbiAgICAgIHZhciBlZGl0U2Vzc2lvbiA9IG5vaWRlLnNlc3Npb25zLmZpbmQoZmlsZSkuZWRpdFNlc3Npb25cbiAgICAgIG5vaWRlLmNsaWVudC5yZXF1ZXN0KHtcbiAgICAgICAgcGF0aDogJy9zdGFuZGFyZCcsXG4gICAgICAgIHBheWxvYWQ6IHtcbiAgICAgICAgICB2YWx1ZTogZWRpdFNlc3Npb24uZ2V0VmFsdWUoKVxuICAgICAgICB9LFxuICAgICAgICBtZXRob2Q6ICdQT1NUJ1xuICAgICAgfSwgZnVuY3Rpb24gKGVyciwgcGF5bG9hZCkge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIG5vaWRlLmhhbmRsZUVycm9yKGVycilcbiAgICAgICAgfVxuICAgICAgICBlZGl0U2Vzc2lvbi5zZXRBbm5vdGF0aW9ucyhwYXlsb2FkKVxuICAgICAgICBzZXRUaW1lb3V0KGxpbnQsIDMwMDApXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICBzZXRUaW1lb3V0KGxpbnQsIDMwMDApXG4gICAgfVxuICB9XG4gIGxpbnQoKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxpbnRlclxuIiwidmFyIEluY3JlbWVudGFsRE9NID0gcmVxdWlyZSgnaW5jcmVtZW50YWwtZG9tJylcbnZhciBwYXRjaCA9IEluY3JlbWVudGFsRE9NLnBhdGNoXG52YXIgZWxlbWVudE9wZW4gPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50T3BlblxudmFyIGVsZW1lbnRWb2lkID0gSW5jcmVtZW50YWxET00uZWxlbWVudFZvaWRcbnZhciBlbGVtZW50Q2xvc2UgPSBJbmNyZW1lbnRhbERPTS5lbGVtZW50Q2xvc2VcbnZhciB0ZXh0ID0gSW5jcmVtZW50YWxET00udGV4dFxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRyZWUgKGRhdGEsIHRyZWUsIGlzUm9vdCwgY3VycmVudCwgb25DbGljaykge1xuICBlbGVtZW50T3BlbihcInVsXCIsIG51bGwsIG51bGwsIFwiY2xhc3NcIiwgaXNSb290ID8gJ3RyZWUnIDogJycpXG4gICAgOyhBcnJheS5pc0FycmF5KGRhdGEpID8gZGF0YSA6IE9iamVjdC5rZXlzKGRhdGEpKS5mb3JFYWNoKGZ1bmN0aW9uKGZzbywgJGluZGV4KSB7XG4gICAgICBlbGVtZW50T3BlbihcImxpXCIsIGZzby5wYXRoKVxuICAgICAgICBlbGVtZW50T3BlbihcImFcIiwgbnVsbCwgW1wiaHJlZlwiLCBcIiNcIl0sIFwib25jbGlja1wiLCBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdmFyICRlbGVtZW50ID0gdGhpcztcbiAgICAgICAgb25DbGljayhmc28pfSlcbiAgICAgICAgICBpZiAoZnNvLmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICBpZiAoZnNvLmV4cGFuZGVkKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnRPcGVuKFwic21hbGxcIiwgbnVsbCwgW1wiY2xhc3NcIiwgXCJleHBhbmRlZFwiXSlcbiAgICAgICAgICAgICAgICB0ZXh0KFwi4pa8XCIpXG4gICAgICAgICAgICAgIGVsZW1lbnRDbG9zZShcInNtYWxsXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWZzby5leHBhbmRlZCkge1xuICAgICAgICAgICAgICBlbGVtZW50T3BlbihcInNtYWxsXCIsIG51bGwsIFtcImNsYXNzXCIsIFwiY29sbGFwc2VkXCJdKVxuICAgICAgICAgICAgICAgIHRleHQoXCLilrZcIilcbiAgICAgICAgICAgICAgZWxlbWVudENsb3NlKFwic21hbGxcIilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxlbWVudE9wZW4oXCJzcGFuXCIsIG51bGwsIG51bGwsIFwiZGF0YS1uYW1lXCIsIGZzby5uYW1lLCBcImRhdGEtcGF0aFwiLCBmc28ucmVsYXRpdmVQYXRoLCBcImNsYXNzXCIsICduYW1lIGljb24gJyArIChmc28uaXNEaXJlY3RvcnkgPyAnaWNvbi1maWxlLWRpcmVjdG9yeScgOiAnaWNvbi1maWxlLXRleHQnKSlcbiAgICAgICAgICAgIHRleHQoXCIgXFxcbiAgICAgICAgICAgICAgICAgICAgIFwiICsgKGZzby5uYW1lKSArIFwiIFxcXG4gICAgICAgICAgICAgICAgICAgXCIpXG4gICAgICAgICAgZWxlbWVudENsb3NlKFwic3BhblwiKVxuICAgICAgICBlbGVtZW50Q2xvc2UoXCJhXCIpXG4gICAgICAgIGlmIChmc28uaXNGaWxlICYmIGZzbyA9PT0gY3VycmVudCkge1xuICAgICAgICAgIGVsZW1lbnRPcGVuKFwic3BhblwiLCBudWxsLCBbXCJjbGFzc1wiLCBcInRyaWFuZ2xlLWxlZnRcIl0pXG4gICAgICAgICAgZWxlbWVudENsb3NlKFwic3BhblwiKVxuICAgICAgICB9XG4gICAgICAgIGlmIChmc28uaXNEaXJlY3RvcnkgJiYgZnNvLmV4cGFuZGVkKSB7XG4gICAgICAgICAgZnNvLmNoaWxkcmVuLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChhLmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYi5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS5uYW1lLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICA8IGIubmFtZS50b0xvd2VyQ2FzZSgpID8gLTEgOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTFcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGIuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDFcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhLm5hbWUudG9Mb3dlckNhc2UoKVxuICAgICAgICAgIDwgYi5uYW1lLnRvTG93ZXJDYXNlKCkgPyAtMSA6IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIHRyZWUoZnNvLmNoaWxkcmVuLCB0cmVlLCBmYWxzZSwgY3VycmVudCwgb25DbGljaylcbiAgICAgICAgfVxuICAgICAgZWxlbWVudENsb3NlKFwibGlcIilcbiAgICB9LCBkYXRhKVxuICBlbGVtZW50Q2xvc2UoXCJ1bFwiKVxufTtcbiIsInZhciBwYXRjaCA9IHJlcXVpcmUoJ2luY3JlbWVudGFsLWRvbScpLnBhdGNoXG52YXIgdmlldyA9IHJlcXVpcmUoJy4vaW5kZXguaHRtbCcpXG52YXIgbm9pZGUgPSByZXF1aXJlKCcuLi9ub2lkZScpXG5cbmZ1bmN0aW9uIFRyZWUgKGVsLCBmc29zLCBzdGF0ZSkge1xuICBmc29zLm9uKCdjaGFuZ2UnLCByZW5kZXIpXG4gIHN0YXRlLm9uKCdjaGFuZ2U6Y3VycmVudCcsIHJlbmRlcilcblxuICBmdW5jdGlvbiBvbkNsaWNrIChmc28pIHtcbiAgICBpZiAoIWZzby5pc0RpcmVjdG9yeSkge1xuICAgICAgbm9pZGUub3BlbkZpbGUoZnNvKVxuICAgIH0gZWxzZSB7XG4gICAgICBmc28uZXhwYW5kZWQgPSAhZnNvLmV4cGFuZGVkXG4gICAgICByZW5kZXIoKVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZSAodHJlZSkge1xuICAgIHZpZXcodHJlZSwgdmlldywgdHJ1ZSwgc3RhdGUuY3VycmVudCwgb25DbGljaylcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlciAoKSB7XG4gICAgdmFyIHRyZWUgPSBtYWtlVHJlZShmc29zKVxuICAgIHBhdGNoKGVsLCB1cGRhdGUsIHRyZWUpXG4gIH1cblxuICBmdW5jdGlvbiBtYWtlVHJlZSAoZGF0YSkge1xuICAgIGZ1bmN0aW9uIHRyZWVpZnkgKGxpc3QsIGlkQXR0ciwgcGFyZW50QXR0ciwgY2hpbGRyZW5BdHRyKSB7XG4gICAgICB2YXIgdHJlZUxpc3QgPSBbXVxuICAgICAgdmFyIGxvb2t1cCA9IHt9XG4gICAgICB2YXIgaSwgb2JqXG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG9iaiA9IGxpc3RbaV1cbiAgICAgICAgbG9va3VwW29ialtpZEF0dHJdXSA9IG9ialxuICAgICAgICBvYmpbY2hpbGRyZW5BdHRyXSA9IFtdXG4gICAgICB9XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG9iaiA9IGxpc3RbaV1cbiAgICAgICAgdmFyIHBhcmVudCA9IGxvb2t1cFtvYmpbcGFyZW50QXR0cl1dXG4gICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICBvYmoucGFyZW50ID0gcGFyZW50XG4gICAgICAgICAgbG9va3VwW29ialtwYXJlbnRBdHRyXV1bY2hpbGRyZW5BdHRyXS5wdXNoKG9iailcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0cmVlTGlzdC5wdXNoKG9iailcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJlZUxpc3RcbiAgICB9XG4gICAgcmV0dXJuIHRyZWVpZnkoZGF0YSwgJ3BhdGgnLCAnZGlyJywgJ2NoaWxkcmVuJylcbiAgfVxuXG4gIHRoaXMucmVuZGVyID0gcmVuZGVyXG59XG5cbm1vZHVsZS5leHBvcnRzID0gVHJlZVxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFjZToge1xuICAgIHRhYlNpemU6IDIsXG4gICAgdGhlbWU6ICdtb25va2FpJyxcbiAgICB1c2VTb2Z0VGFiczogdHJ1ZVxuICB9XG59XG4iLCJcbi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IGZhY3RvcnkoZXhwb3J0cykgOiB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoWydleHBvcnRzJ10sIGZhY3RvcnkpIDogZmFjdG9yeShnbG9iYWwuSW5jcmVtZW50YWxET00gPSB7fSk7XG59KSh0aGlzLCBmdW5jdGlvbiAoZXhwb3J0cykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLyoqXG4gICAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAgICpcbiAgICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAgICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICAgKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAgICpcbiAgICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAgICpcbiAgICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICAgKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gICAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICAgKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gICAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICAgKi9cblxuICAvKiogKi9cbiAgZXhwb3J0cy5ub3RpZmljYXRpb25zID0ge1xuICAgIC8qKlxuICAgICAqIENhbGxlZCBhZnRlciBwYXRjaCBoYXMgY29tcGxlYXRlZCB3aXRoIGFueSBOb2RlcyB0aGF0IGhhdmUgYmVlbiBjcmVhdGVkXG4gICAgICogYW5kIGFkZGVkIHRvIHRoZSBET00uXG4gICAgICogQHR5cGUgez9mdW5jdGlvbihBcnJheTwhTm9kZT4pfVxuICAgICAqL1xuICAgIG5vZGVzQ3JlYXRlZDogbnVsbCxcblxuICAgIC8qKlxuICAgICAqIENhbGxlZCBhZnRlciBwYXRjaCBoYXMgY29tcGxlYXRlZCB3aXRoIGFueSBOb2RlcyB0aGF0IGhhdmUgYmVlbiByZW1vdmVkXG4gICAgICogZnJvbSB0aGUgRE9NLlxuICAgICAqIE5vdGUgaXQncyBhbiBhcHBsaWNhdGlvbnMgcmVzcG9uc2liaWxpdHkgdG8gaGFuZGxlIGFueSBjaGlsZE5vZGVzLlxuICAgICAqIEB0eXBlIHs/ZnVuY3Rpb24oQXJyYXk8IU5vZGU+KX1cbiAgICAgKi9cbiAgICBub2Rlc0RlbGV0ZWQ6IG51bGxcbiAgfTtcblxuICAvKipcbiAgICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICAgKlxuICAgKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICAgKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gICAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICAgKlxuICAgKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICAgKlxuICAgKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gICAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAgICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gICAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAgICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBTaW1pbGFyIHRvIHRoZSBidWlsdC1pbiBUcmVld2Fsa2VyIGNsYXNzLCBidXQgc2ltcGxpZmllZCBhbmQgYWxsb3dzIGRpcmVjdFxuICAgKiBhY2Nlc3MgdG8gbW9kaWZ5IHRoZSBjdXJyZW50Tm9kZSBwcm9wZXJ0eS5cbiAgICogQHBhcmFtIHshRWxlbWVudHwhRG9jdW1lbnRGcmFnbWVudH0gbm9kZSBUaGUgcm9vdCBOb2RlIG9mIHRoZSBzdWJ0cmVlIHRoZVxuICAgKiAgICAgd2Fsa2VyIHNob3VsZCBzdGFydCB0cmF2ZXJzaW5nLlxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGZ1bmN0aW9uIFRyZWVXYWxrZXIobm9kZSkge1xuICAgIC8qKlxuICAgICAqIEtlZXBzIHRyYWNrIG9mIHRoZSBjdXJyZW50IHBhcmVudCBub2RlLiBUaGlzIGlzIG5lY2Vzc2FyeSBhcyB0aGUgdHJhdmVyc2FsXG4gICAgICogbWV0aG9kcyBtYXkgdHJhdmVyc2UgcGFzdCB0aGUgbGFzdCBjaGlsZCBhbmQgd2Ugc3RpbGwgbmVlZCBhIHdheSB0byBnZXRcbiAgICAgKiBiYWNrIHRvIHRoZSBwYXJlbnQuXG4gICAgICogQGNvbnN0IEBwcml2YXRlIHshQXJyYXk8IU5vZGU+fVxuICAgICAqL1xuICAgIHRoaXMuc3RhY2tfID0gW107XG5cbiAgICAvKipcbiAgICAgKiBAY29uc3QgeyFFbGVtZW50fCFEb2N1bWVudEZyYWdtZW50fVxuICAgICAqL1xuICAgIHRoaXMucm9vdCA9IG5vZGU7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7P05vZGV9XG4gICAgICovXG4gICAgdGhpcy5jdXJyZW50Tm9kZSA9IG5vZGU7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7IU5vZGV9IFRoZSBjdXJyZW50IHBhcmVudCBvZiB0aGUgY3VycmVudCBsb2NhdGlvbiBpbiB0aGUgc3VidHJlZS5cbiAgICovXG4gIFRyZWVXYWxrZXIucHJvdG90eXBlLmdldEN1cnJlbnRQYXJlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhY2tfW3RoaXMuc3RhY2tfLmxlbmd0aCAtIDFdO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDaGFuZ2VzIHRoZSBjdXJyZW50IGxvY2F0aW9uIHRoZSBmaXJzdENoaWxkIG9mIHRoZSBjdXJyZW50IGxvY2F0aW9uLlxuICAgKi9cbiAgVHJlZVdhbGtlci5wcm90b3R5cGUuZmlyc3RDaGlsZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnN0YWNrXy5wdXNoKHRoaXMuY3VycmVudE5vZGUpO1xuICAgIHRoaXMuY3VycmVudE5vZGUgPSB0aGlzLmN1cnJlbnROb2RlLmZpcnN0Q2hpbGQ7XG4gIH07XG5cbiAgLyoqXG4gICAqIENoYW5nZXMgdGhlIGN1cnJlbnQgbG9jYXRpb24gdGhlIG5leHRTaWJsaW5nIG9mIHRoZSBjdXJyZW50IGxvY2F0aW9uLlxuICAgKi9cbiAgVHJlZVdhbGtlci5wcm90b3R5cGUubmV4dFNpYmxpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5jdXJyZW50Tm9kZSA9IHRoaXMuY3VycmVudE5vZGUubmV4dFNpYmxpbmc7XG4gIH07XG5cbiAgLyoqXG4gICAqIENoYW5nZXMgdGhlIGN1cnJlbnQgbG9jYXRpb24gdGhlIHBhcmVudE5vZGUgb2YgdGhlIGN1cnJlbnQgbG9jYXRpb24uXG4gICAqL1xuICBUcmVlV2Fsa2VyLnByb3RvdHlwZS5wYXJlbnROb2RlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuY3VycmVudE5vZGUgPSB0aGlzLnN0YWNrXy5wb3AoKTtcbiAgfTtcblxuICAvKipcbiAgICogS2VlcHMgdHJhY2sgb2YgdGhlIHN0YXRlIG9mIGEgcGF0Y2guXG4gICAqIEBwYXJhbSB7IUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnR9IG5vZGUgVGhlIHJvb3QgTm9kZSBvZiB0aGUgc3VidHJlZSB0aGVcbiAgICogICAgIGlzIGZvci5cbiAgICogQHBhcmFtIHs/Q29udGV4dH0gcHJldkNvbnRleHQgVGhlIHByZXZpb3VzIGNvbnRleHQuXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKi9cbiAgZnVuY3Rpb24gQ29udGV4dChub2RlLCBwcmV2Q29udGV4dCkge1xuICAgIC8qKlxuICAgICAqIEBjb25zdCB7VHJlZVdhbGtlcn1cbiAgICAgKi9cbiAgICB0aGlzLndhbGtlciA9IG5ldyBUcmVlV2Fsa2VyKG5vZGUpO1xuXG4gICAgLyoqXG4gICAgICogQGNvbnN0IHtEb2N1bWVudH1cbiAgICAgKi9cbiAgICB0aGlzLmRvYyA9IG5vZGUub3duZXJEb2N1bWVudDtcblxuICAgIC8qKlxuICAgICAqIEtlZXBzIHRyYWNrIG9mIHdoYXQgbmFtZXNwYWNlIHRvIGNyZWF0ZSBuZXcgRWxlbWVudHMgaW4uXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAY29uc3QgeyFBcnJheTwoc3RyaW5nfHVuZGVmaW5lZCk+fVxuICAgICAqL1xuICAgIHRoaXMubnNTdGFja18gPSBbdW5kZWZpbmVkXTtcblxuICAgIC8qKlxuICAgICAqIEBjb25zdCB7P0NvbnRleHR9XG4gICAgICovXG4gICAgdGhpcy5wcmV2Q29udGV4dCA9IHByZXZDb250ZXh0O1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUgeyhBcnJheTwhTm9kZT58dW5kZWZpbmVkKX1cbiAgICAgKi9cbiAgICB0aGlzLmNyZWF0ZWQgPSBleHBvcnRzLm5vdGlmaWNhdGlvbnMubm9kZXNDcmVhdGVkICYmIFtdO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUgeyhBcnJheTwhTm9kZT58dW5kZWZpbmVkKX1cbiAgICAgKi9cbiAgICB0aGlzLmRlbGV0ZWQgPSBleHBvcnRzLm5vdGlmaWNhdGlvbnMubm9kZXNEZWxldGVkICYmIFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4geyhzdHJpbmd8dW5kZWZpbmVkKX0gVGhlIGN1cnJlbnQgbmFtZXNwYWNlIHRvIGNyZWF0ZSBFbGVtZW50cyBpbi5cbiAgICovXG4gIENvbnRleHQucHJvdG90eXBlLmdldEN1cnJlbnROYW1lc3BhY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubnNTdGFja19bdGhpcy5uc1N0YWNrXy5sZW5ndGggLSAxXTtcbiAgfTtcblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmc9fSBuYW1lc3BhY2UgVGhlIG5hbWVzcGFjZSB0byBlbnRlci5cbiAgICovXG4gIENvbnRleHQucHJvdG90eXBlLmVudGVyTmFtZXNwYWNlID0gZnVuY3Rpb24gKG5hbWVzcGFjZSkge1xuICAgIHRoaXMubnNTdGFja18ucHVzaChuYW1lc3BhY2UpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBFeGl0cyB0aGUgY3VycmVudCBuYW1lc3BhY2VcbiAgICovXG4gIENvbnRleHQucHJvdG90eXBlLmV4aXROYW1lc3BhY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5uc1N0YWNrXy5wb3AoKTtcbiAgfTtcblxuICAvKipcbiAgICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICAgKi9cbiAgQ29udGV4dC5wcm90b3R5cGUubWFya0NyZWF0ZWQgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIGlmICh0aGlzLmNyZWF0ZWQpIHtcbiAgICAgIHRoaXMuY3JlYXRlZC5wdXNoKG5vZGUpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICAgKi9cbiAgQ29udGV4dC5wcm90b3R5cGUubWFya0RlbGV0ZWQgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIGlmICh0aGlzLmRlbGV0ZWQpIHtcbiAgICAgIHRoaXMuZGVsZXRlZC5wdXNoKG5vZGUpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogTm90aWZpZXMgYWJvdXQgbm9kZXMgdGhhdCB3ZXJlIGNyZWF0ZWQgZHVyaW5nIHRoZSBwYXRjaCBvcGVhcmF0aW9uLlxuICAgKi9cbiAgQ29udGV4dC5wcm90b3R5cGUubm90aWZ5Q2hhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5jcmVhdGVkICYmIHRoaXMuY3JlYXRlZC5sZW5ndGggPiAwKSB7XG4gICAgICBleHBvcnRzLm5vdGlmaWNhdGlvbnMubm9kZXNDcmVhdGVkKHRoaXMuY3JlYXRlZCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZGVsZXRlZCAmJiB0aGlzLmRlbGV0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgZXhwb3J0cy5ub3RpZmljYXRpb25zLm5vZGVzRGVsZXRlZCh0aGlzLmRlbGV0ZWQpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogVGhlIGN1cnJlbnQgY29udGV4dC5cbiAgICogQHR5cGUgez9Db250ZXh0fVxuICAgKi9cbiAgdmFyIGNvbnRleHQ7XG5cbiAgLyoqXG4gICAqIEVudGVycyBhIG5ldyBwYXRjaCBjb250ZXh0LlxuICAgKiBAcGFyYW0geyFFbGVtZW50fCFEb2N1bWVudEZyYWdtZW50fSBub2RlXG4gICAqL1xuICB2YXIgZW50ZXJDb250ZXh0ID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICBjb250ZXh0ID0gbmV3IENvbnRleHQobm9kZSwgY29udGV4dCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlc3RvcmVzIHRoZSBwcmV2aW91cyBwYXRjaCBjb250ZXh0LlxuICAgKi9cbiAgdmFyIHJlc3RvcmVDb250ZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIGNvbnRleHQgPSBjb250ZXh0LnByZXZDb250ZXh0O1xuICB9O1xuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IHBhdGNoIGNvbnRleHQuXG4gICAqIEByZXR1cm4gez9Db250ZXh0fVxuICAgKi9cbiAgdmFyIGdldENvbnRleHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGNvbnRleHQ7XG4gIH07XG5cbiAgLyoqXG4gICAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAgICpcbiAgICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAgICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICAgKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAgICpcbiAgICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAgICpcbiAgICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICAgKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gICAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICAgKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gICAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICAgKi9cblxuICAvKipcbiAgICogQSBjYWNoZWQgcmVmZXJlbmNlIHRvIHRoZSBoYXNPd25Qcm9wZXJ0eSBmdW5jdGlvbi5cbiAgICovXG4gIHZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbiAgLyoqXG4gICAqIEEgY2FjaGVkIHJlZmVyZW5jZSB0byB0aGUgY3JlYXRlIGZ1bmN0aW9uLlxuICAgKi9cbiAgdmFyIGNyZWF0ZSA9IE9iamVjdC5jcmVhdGU7XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gcHJldmVudCBwcm9wZXJ0eSBjb2xsaXNpb25zIGJldHdlZW4gb3VyIFwibWFwXCIgYW5kIGl0cyBwcm90b3R5cGUuXG4gICAqIEBwYXJhbSB7IU9iamVjdDxzdHJpbmcsICo+fSBtYXAgVGhlIG1hcCB0byBjaGVjay5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5IFRoZSBwcm9wZXJ0eSB0byBjaGVjay5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciBtYXAgaGFzIHByb3BlcnR5LlxuICAgKi9cbiAgdmFyIGhhcyA9IGZ1bmN0aW9uIChtYXAsIHByb3BlcnR5KSB7XG4gICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwobWFwLCBwcm9wZXJ0eSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gbWFwIG9iamVjdCB3aXRob3V0IGEgcHJvdG90eXBlLlxuICAgKiBAcmV0dXJuIHshT2JqZWN0fVxuICAgKi9cbiAgdmFyIGNyZWF0ZU1hcCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gY3JlYXRlKG51bGwpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBLZWVwcyB0cmFjayBvZiBpbmZvcm1hdGlvbiBuZWVkZWQgdG8gcGVyZm9ybSBkaWZmcyBmb3IgYSBnaXZlbiBET00gbm9kZS5cbiAgICogQHBhcmFtIHshc3RyaW5nfSBub2RlTmFtZVxuICAgKiBAcGFyYW0gez9zdHJpbmc9fSBrZXlcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuICBmdW5jdGlvbiBOb2RlRGF0YShub2RlTmFtZSwga2V5KSB7XG4gICAgLyoqXG4gICAgICogVGhlIGF0dHJpYnV0ZXMgYW5kIHRoZWlyIHZhbHVlcy5cbiAgICAgKiBAY29uc3RcbiAgICAgKi9cbiAgICB0aGlzLmF0dHJzID0gY3JlYXRlTWFwKCk7XG5cbiAgICAvKipcbiAgICAgKiBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycywgdXNlZCBmb3IgcXVpY2tseSBkaWZmaW5nIHRoZVxuICAgICAqIGluY29tbWluZyBhdHRyaWJ1dGVzIHRvIHNlZSBpZiB0aGUgRE9NIG5vZGUncyBhdHRyaWJ1dGVzIG5lZWQgdG8gYmVcbiAgICAgKiB1cGRhdGVkLlxuICAgICAqIEBjb25zdCB7QXJyYXk8Kj59XG4gICAgICovXG4gICAgdGhpcy5hdHRyc0FyciA9IFtdO1xuXG4gICAgLyoqXG4gICAgICogVGhlIGluY29taW5nIGF0dHJpYnV0ZXMgZm9yIHRoaXMgTm9kZSwgYmVmb3JlIHRoZXkgYXJlIHVwZGF0ZWQuXG4gICAgICogQGNvbnN0IHshT2JqZWN0PHN0cmluZywgKj59XG4gICAgICovXG4gICAgdGhpcy5uZXdBdHRycyA9IGNyZWF0ZU1hcCgpO1xuXG4gICAgLyoqXG4gICAgICogVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgbm9kZSwgdXNlZCB0byBwcmVzZXJ2ZSBET00gbm9kZXMgd2hlbiB0aGV5XG4gICAgICogbW92ZSB3aXRoaW4gdGhlaXIgcGFyZW50LlxuICAgICAqIEBjb25zdFxuICAgICAqL1xuICAgIHRoaXMua2V5ID0ga2V5O1xuXG4gICAgLyoqXG4gICAgICogS2VlcHMgdHJhY2sgb2YgY2hpbGRyZW4gd2l0aGluIHRoaXMgbm9kZSBieSB0aGVpciBrZXkuXG4gICAgICogez9PYmplY3Q8c3RyaW5nLCAhRWxlbWVudD59XG4gICAgICovXG4gICAgdGhpcy5rZXlNYXAgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogV2hldGhlciBvciBub3QgdGhlIGtleU1hcCBpcyBjdXJyZW50bHkgdmFsaWQuXG4gICAgICoge2Jvb2xlYW59XG4gICAgICovXG4gICAgdGhpcy5rZXlNYXBWYWxpZCA9IHRydWU7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbGFzdCBjaGlsZCB0byBoYXZlIGJlZW4gdmlzaXRlZCB3aXRoaW4gdGhlIGN1cnJlbnQgcGFzcy5cbiAgICAgKiBAdHlwZSB7P05vZGV9XG4gICAgICovXG4gICAgdGhpcy5sYXN0VmlzaXRlZENoaWxkID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIFRoZSBub2RlIG5hbWUgZm9yIHRoaXMgbm9kZS5cbiAgICAgKiBAY29uc3Qge3N0cmluZ31cbiAgICAgKi9cbiAgICB0aGlzLm5vZGVOYW1lID0gbm9kZU5hbWU7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7P3N0cmluZ31cbiAgICAgKi9cbiAgICB0aGlzLnRleHQgPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgTm9kZURhdGEgb2JqZWN0IGZvciBhIE5vZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgbm9kZSB0byBpbml0aWFsaXplIGRhdGEgZm9yLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZU5hbWUgVGhlIG5vZGUgbmFtZSBvZiBub2RlLlxuICAgKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB0aGF0IGlkZW50aWZpZXMgdGhlIG5vZGUuXG4gICAqIEByZXR1cm4geyFOb2RlRGF0YX0gVGhlIG5ld2x5IGluaXRpYWxpemVkIGRhdGEgb2JqZWN0XG4gICAqL1xuICB2YXIgaW5pdERhdGEgPSBmdW5jdGlvbiAobm9kZSwgbm9kZU5hbWUsIGtleSkge1xuICAgIHZhciBkYXRhID0gbmV3IE5vZGVEYXRhKG5vZGVOYW1lLCBrZXkpO1xuICAgIG5vZGVbJ19faW5jcmVtZW50YWxET01EYXRhJ10gPSBkYXRhO1xuICAgIHJldHVybiBkYXRhO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIE5vZGVEYXRhIG9iamVjdCBmb3IgYSBOb2RlLCBjcmVhdGluZyBpdCBpZiBuZWNlc3NhcnkuXG4gICAqXG4gICAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgbm9kZSB0byByZXRyaWV2ZSB0aGUgZGF0YSBmb3IuXG4gICAqIEByZXR1cm4geyFOb2RlRGF0YX0gVGhlIE5vZGVEYXRhIGZvciB0aGlzIE5vZGUuXG4gICAqL1xuICB2YXIgZ2V0RGF0YSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgdmFyIGRhdGEgPSBub2RlWydfX2luY3JlbWVudGFsRE9NRGF0YSddO1xuXG4gICAgaWYgKCFkYXRhKSB7XG4gICAgICB2YXIgbm9kZU5hbWUgPSBub2RlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICB2YXIga2V5ID0gbnVsbDtcblxuICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICAgIGtleSA9IG5vZGUuZ2V0QXR0cmlidXRlKCdrZXknKTtcbiAgICAgIH1cblxuICAgICAgZGF0YSA9IGluaXREYXRhKG5vZGUsIG5vZGVOYW1lLCBrZXkpO1xuICAgIH1cblxuICAgIHJldHVybiBkYXRhO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gICAqXG4gICAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gICAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAgICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gICAqXG4gICAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gICAqXG4gICAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAgICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICAgKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAgICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICAgKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAgICovXG5cbiAgZXhwb3J0cy5zeW1ib2xzID0ge1xuICAgIGRlZmF1bHQ6ICdfX2RlZmF1bHQnLFxuXG4gICAgcGxhY2Vob2xkZXI6ICdfX3BsYWNlaG9sZGVyJ1xuICB9O1xuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGFuIGF0dHJpYnV0ZSBvciBwcm9wZXJ0eSB0byBhIGdpdmVuIEVsZW1lbnQuIElmIHRoZSB2YWx1ZSBpcyBudWxsXG4gICAqIG9yIHVuZGVmaW5lZCwgaXQgaXMgcmVtb3ZlZCBmcm9tIHRoZSBFbGVtZW50LiBPdGhlcndpc2UsIHRoZSB2YWx1ZSBpcyBzZXRcbiAgICogYXMgYW4gYXR0cmlidXRlLlxuICAgKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAgICogQHBhcmFtIHs/KGJvb2xlYW58bnVtYmVyfHN0cmluZyk9fSB2YWx1ZSBUaGUgYXR0cmlidXRlJ3MgdmFsdWUuXG4gICAqL1xuICBleHBvcnRzLmFwcGx5QXR0ciA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbC5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xuICAgIH1cblxuICAgIC8vIElmLCBhZnRlciBjaGFuZ2luZyB0aGUgYXR0cmlidXRlLFxuICAgIC8vIHRoZSBjb3JyZXNwb25kaW5nIHByb3BlcnR5IGlzIG5vdCB1cGRhdGVkLFxuICAgIC8vIGFsc28gdXBkYXRlIGl0LlxuICAgIGlmIChlbFtuYW1lXSAhPT0gdmFsdWUpIHtcbiAgICAgIGVsW25hbWVdID0gdmFsdWU7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGEgcHJvcGVydHkgdG8gYSBnaXZlbiBFbGVtZW50LlxuICAgKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgcHJvcGVydHkncyBuYW1lLlxuICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBwcm9wZXJ0eSdzIHZhbHVlLlxuICAgKi9cbiAgZXhwb3J0cy5hcHBseVByb3AgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gICAgZWxbbmFtZV0gPSB2YWx1ZTtcbiAgfTtcblxuICAvKipcbiAgICogQXBwbGllcyBhIHN0eWxlIHRvIGFuIEVsZW1lbnQuIE5vIHZlbmRvciBwcmVmaXggZXhwYW5zaW9uIGlzIGRvbmUgZm9yXG4gICAqIHByb3BlcnR5IG5hbWVzL3ZhbHVlcy5cbiAgICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfE9iamVjdDxzdHJpbmcsc3RyaW5nPn0gc3R5bGUgVGhlIHN0eWxlIHRvIHNldC4gRWl0aGVyIGFcbiAgICogICAgIHN0cmluZyBvZiBjc3Mgb3IgYW4gb2JqZWN0IGNvbnRhaW5pbmcgcHJvcGVydHktdmFsdWUgcGFpcnMuXG4gICAqL1xuICB2YXIgYXBwbHlTdHlsZSA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgc3R5bGUpIHtcbiAgICBpZiAodHlwZW9mIHN0eWxlID09PSAnc3RyaW5nJykge1xuICAgICAgZWwuc3R5bGUuY3NzVGV4dCA9IHN0eWxlO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbC5zdHlsZS5jc3NUZXh0ID0gJyc7XG4gICAgICB2YXIgZWxTdHlsZSA9IGVsLnN0eWxlO1xuXG4gICAgICBmb3IgKHZhciBwcm9wIGluIHN0eWxlKSB7XG4gICAgICAgIGlmIChoYXMoc3R5bGUsIHByb3ApKSB7XG4gICAgICAgICAgZWxTdHlsZVtwcm9wXSA9IHN0eWxlW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBVcGRhdGVzIGEgc2luZ2xlIGF0dHJpYnV0ZSBvbiBhbiBFbGVtZW50LlxuICAgKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgYXR0cmlidXRlJ3MgdmFsdWUuIElmIHRoZSB2YWx1ZSBpcyBhbiBvYmplY3Qgb3JcbiAgICogICAgIGZ1bmN0aW9uIGl0IGlzIHNldCBvbiB0aGUgRWxlbWVudCwgb3RoZXJ3aXNlLCBpdCBpcyBzZXQgYXMgYW4gSFRNTFxuICAgKiAgICAgYXR0cmlidXRlLlxuICAgKi9cbiAgdmFyIGFwcGx5QXR0cmlidXRlVHlwZWQgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG5cbiAgICBpZiAodHlwZSA9PT0gJ29iamVjdCcgfHwgdHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZXhwb3J0cy5hcHBseVByb3AoZWwsIG5hbWUsIHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwb3J0cy5hcHBseUF0dHIoZWwsIG5hbWUsIC8qKiBAdHlwZSB7Pyhib29sZWFufG51bWJlcnxzdHJpbmcpfSAqL3ZhbHVlKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIENhbGxzIHRoZSBhcHByb3ByaWF0ZSBhdHRyaWJ1dGUgbXV0YXRvciBmb3IgdGhpcyBhdHRyaWJ1dGUuXG4gICAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBhdHRyaWJ1dGUncyBuYW1lLlxuICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBhdHRyaWJ1dGUncyB2YWx1ZS5cbiAgICovXG4gIHZhciB1cGRhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIGRhdGEgPSBnZXREYXRhKGVsKTtcbiAgICB2YXIgYXR0cnMgPSBkYXRhLmF0dHJzO1xuXG4gICAgaWYgKGF0dHJzW25hbWVdID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBtdXRhdG9yID0gZXhwb3J0cy5hdHRyaWJ1dGVzW25hbWVdIHx8IGV4cG9ydHMuYXR0cmlidXRlc1tleHBvcnRzLnN5bWJvbHMuZGVmYXVsdF07XG4gICAgbXV0YXRvcihlbCwgbmFtZSwgdmFsdWUpO1xuXG4gICAgYXR0cnNbbmFtZV0gPSB2YWx1ZTtcbiAgfTtcblxuICAvKipcbiAgICogQSBwdWJsaWNseSBtdXRhYmxlIG9iamVjdCB0byBwcm92aWRlIGN1c3RvbSBtdXRhdG9ycyBmb3IgYXR0cmlidXRlcy5cbiAgICogQGNvbnN0IHshT2JqZWN0PHN0cmluZywgZnVuY3Rpb24oIUVsZW1lbnQsIHN0cmluZywgKik+fVxuICAgKi9cbiAgZXhwb3J0cy5hdHRyaWJ1dGVzID0gY3JlYXRlTWFwKCk7XG5cbiAgLy8gU3BlY2lhbCBnZW5lcmljIG11dGF0b3IgdGhhdCdzIGNhbGxlZCBmb3IgYW55IGF0dHJpYnV0ZSB0aGF0IGRvZXMgbm90XG4gIC8vIGhhdmUgYSBzcGVjaWZpYyBtdXRhdG9yLlxuICBleHBvcnRzLmF0dHJpYnV0ZXNbZXhwb3J0cy5zeW1ib2xzLmRlZmF1bHRdID0gYXBwbHlBdHRyaWJ1dGVUeXBlZDtcblxuICBleHBvcnRzLmF0dHJpYnV0ZXNbZXhwb3J0cy5zeW1ib2xzLnBsYWNlaG9sZGVyXSA9IGZ1bmN0aW9uICgpIHt9O1xuXG4gIGV4cG9ydHMuYXR0cmlidXRlc1snc3R5bGUnXSA9IGFwcGx5U3R5bGU7XG5cbiAgdmFyIFNWR19OUyA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG5cbiAgLyoqXG4gICAqIEVudGVycyBhIHRhZywgY2hlY2tpbmcgdG8gc2VlIGlmIGl0IGlzIGEgbmFtZXNwYWNlIGJvdW5kYXJ5LCBhbmQgaWYgc28sXG4gICAqIHVwZGF0ZXMgdGhlIGN1cnJlbnQgbmFtZXNwYWNlLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSB0YWcgdG8gZW50ZXIuXG4gICAqL1xuICB2YXIgZW50ZXJUYWcgPSBmdW5jdGlvbiAodGFnKSB7XG4gICAgaWYgKHRhZyA9PT0gJ3N2ZycpIHtcbiAgICAgIGdldENvbnRleHQoKS5lbnRlck5hbWVzcGFjZShTVkdfTlMpO1xuICAgIH0gZWxzZSBpZiAodGFnID09PSAnZm9yZWlnbk9iamVjdCcpIHtcbiAgICAgIGdldENvbnRleHQoKS5lbnRlck5hbWVzcGFjZSh1bmRlZmluZWQpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogRXhpdHMgYSB0YWcsIGNoZWNraW5nIHRvIHNlZSBpZiBpdCBpcyBhIG5hbWVzcGFjZSBib3VuZGFyeSwgYW5kIGlmIHNvLFxuICAgKiB1cGRhdGVzIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgdGFnIHRvIGVudGVyLlxuICAgKi9cbiAgdmFyIGV4aXRUYWcgPSBmdW5jdGlvbiAodGFnKSB7XG4gICAgaWYgKHRhZyA9PT0gJ3N2ZycgfHwgdGFnID09PSAnZm9yZWlnbk9iamVjdCcpIHtcbiAgICAgIGdldENvbnRleHQoKS5leGl0TmFtZXNwYWNlKCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBuYW1lc3BhY2UgdG8gY3JlYXRlIGFuIGVsZW1lbnQgKG9mIGEgZ2l2ZW4gdGFnKSBpbi5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgdGFnIHRvIGdldCB0aGUgbmFtZXNwYWNlIGZvci5cbiAgICogQHJldHVybiB7KHN0cmluZ3x1bmRlZmluZWQpfSBUaGUgbmFtZXNwYWNlIHRvIGNyZWF0ZSB0aGUgdGFnIGluLlxuICAgKi9cbiAgdmFyIGdldE5hbWVzcGFjZUZvclRhZyA9IGZ1bmN0aW9uICh0YWcpIHtcbiAgICBpZiAodGFnID09PSAnc3ZnJykge1xuICAgICAgcmV0dXJuIFNWR19OUztcbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0Q29udGV4dCgpLmdldEN1cnJlbnROYW1lc3BhY2UoKTtcbiAgfTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBFbGVtZW50LlxuICAgKiBAcGFyYW0ge0RvY3VtZW50fSBkb2MgVGhlIGRvY3VtZW50IHdpdGggd2hpY2ggdG8gY3JlYXRlIHRoZSBFbGVtZW50LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSB0YWcgZm9yIHRoZSBFbGVtZW50LlxuICAgKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgQSBrZXkgdG8gaWRlbnRpZnkgdGhlIEVsZW1lbnQuXG4gICAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZlxuICAgKiAgICAgdGhlIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC5cbiAgICogQHJldHVybiB7IUVsZW1lbnR9XG4gICAqL1xuICB2YXIgY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uIChkb2MsIHRhZywga2V5LCBzdGF0aWNzKSB7XG4gICAgdmFyIG5hbWVzcGFjZSA9IGdldE5hbWVzcGFjZUZvclRhZyh0YWcpO1xuICAgIHZhciBlbDtcblxuICAgIGlmIChuYW1lc3BhY2UpIHtcbiAgICAgIGVsID0gZG9jLmNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2UsIHRhZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsID0gZG9jLmNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgICB9XG5cbiAgICBpbml0RGF0YShlbCwgdGFnLCBrZXkpO1xuXG4gICAgaWYgKHN0YXRpY3MpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhdGljcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICB1cGRhdGVBdHRyaWJ1dGUoZWwsIC8qKiBAdHlwZSB7IXN0cmluZ30qL3N0YXRpY3NbaV0sIHN0YXRpY3NbaSArIDFdKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZWw7XG4gIH07XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBOb2RlLCBlaXRoZXIgYSBUZXh0IG9yIGFuIEVsZW1lbnQgZGVwZW5kaW5nIG9uIHRoZSBub2RlIG5hbWVcbiAgICogcHJvdmlkZWQuXG4gICAqIEBwYXJhbSB7RG9jdW1lbnR9IGRvYyBUaGUgZG9jdW1lbnQgd2l0aCB3aGljaCB0byBjcmVhdGUgdGhlIE5vZGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlTmFtZSBUaGUgdGFnIGlmIGNyZWF0aW5nIGFuIGVsZW1lbnQgb3IgI3RleHQgdG8gY3JlYXRlXG4gICAqICAgICBhIFRleHQuXG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBBIGtleSB0byBpZGVudGlmeSB0aGUgRWxlbWVudC5cbiAgICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIFRoZSBzdGF0aWMgZGF0YSB0byBpbml0aWFsaXplIHRoZSBOb2RlXG4gICAqICAgICB3aXRoLiBGb3IgYW4gRWxlbWVudCwgYW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2ZcbiAgICogICAgIHRoZSBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuXG4gICAqIEByZXR1cm4geyFOb2RlfVxuICAgKi9cbiAgdmFyIGNyZWF0ZU5vZGUgPSBmdW5jdGlvbiAoZG9jLCBub2RlTmFtZSwga2V5LCBzdGF0aWNzKSB7XG4gICAgaWYgKG5vZGVOYW1lID09PSAnI3RleHQnKSB7XG4gICAgICByZXR1cm4gZG9jLmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY3JlYXRlRWxlbWVudChkb2MsIG5vZGVOYW1lLCBrZXksIHN0YXRpY3MpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbWFwcGluZyB0aGF0IGNhbiBiZSB1c2VkIHRvIGxvb2sgdXAgY2hpbGRyZW4gdXNpbmcgYSBrZXkuXG4gICAqIEBwYXJhbSB7IU5vZGV9IGVsXG4gICAqIEByZXR1cm4geyFPYmplY3Q8c3RyaW5nLCAhRWxlbWVudD59IEEgbWFwcGluZyBvZiBrZXlzIHRvIHRoZSBjaGlsZHJlbiBvZiB0aGVcbiAgICogICAgIEVsZW1lbnQuXG4gICAqL1xuICB2YXIgY3JlYXRlS2V5TWFwID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgdmFyIG1hcCA9IGNyZWF0ZU1hcCgpO1xuICAgIHZhciBjaGlsZHJlbiA9IGVsLmNoaWxkcmVuO1xuICAgIHZhciBjb3VudCA9IGNoaWxkcmVuLmxlbmd0aDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkgKz0gMSkge1xuICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICB2YXIga2V5ID0gZ2V0RGF0YShjaGlsZCkua2V5O1xuXG4gICAgICBpZiAoa2V5KSB7XG4gICAgICAgIG1hcFtrZXldID0gY2hpbGQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hcDtcbiAgfTtcblxuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSBtYXBwaW5nIG9mIGtleSB0byBjaGlsZCBub2RlIGZvciBhIGdpdmVuIEVsZW1lbnQsIGNyZWF0aW5nIGl0XG4gICAqIGlmIG5lY2Vzc2FyeS5cbiAgICogQHBhcmFtIHshTm9kZX0gZWxcbiAgICogQHJldHVybiB7IU9iamVjdDxzdHJpbmcsICFOb2RlPn0gQSBtYXBwaW5nIG9mIGtleXMgdG8gY2hpbGQgRWxlbWVudHNcbiAgICovXG4gIHZhciBnZXRLZXlNYXAgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICB2YXIgZGF0YSA9IGdldERhdGEoZWwpO1xuXG4gICAgaWYgKCFkYXRhLmtleU1hcCkge1xuICAgICAgZGF0YS5rZXlNYXAgPSBjcmVhdGVLZXlNYXAoZWwpO1xuICAgIH1cblxuICAgIHJldHVybiBkYXRhLmtleU1hcDtcbiAgfTtcblxuICAvKipcbiAgICogUmV0cmlldmVzIGEgY2hpbGQgZnJvbSB0aGUgcGFyZW50IHdpdGggdGhlIGdpdmVuIGtleS5cbiAgICogQHBhcmFtIHshTm9kZX0gcGFyZW50XG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleVxuICAgKiBAcmV0dXJuIHs/RWxlbWVudH0gVGhlIGNoaWxkIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGtleS5cbiAgICovXG4gIHZhciBnZXRDaGlsZCA9IGZ1bmN0aW9uIChwYXJlbnQsIGtleSkge1xuICAgIHJldHVybiAoLyoqIEB0eXBlIHs/RWxlbWVudH0gKi9rZXkgJiYgZ2V0S2V5TWFwKHBhcmVudClba2V5XVxuICAgICk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhbiBlbGVtZW50IGFzIGJlaW5nIGEgY2hpbGQuIFRoZSBwYXJlbnQgd2lsbCBrZWVwIHRyYWNrIG9mIHRoZVxuICAgKiBjaGlsZCB1c2luZyB0aGUga2V5LiBUaGUgY2hpbGQgY2FuIGJlIHJldHJpZXZlZCB1c2luZyB0aGUgc2FtZSBrZXkgdXNpbmdcbiAgICogZ2V0S2V5TWFwLiBUaGUgcHJvdmlkZWQga2V5IHNob3VsZCBiZSB1bmlxdWUgd2l0aGluIHRoZSBwYXJlbnQgRWxlbWVudC5cbiAgICogQHBhcmFtIHshTm9kZX0gcGFyZW50IFRoZSBwYXJlbnQgb2YgY2hpbGQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgQSBrZXkgdG8gaWRlbnRpZnkgdGhlIGNoaWxkIHdpdGguXG4gICAqIEBwYXJhbSB7IU5vZGV9IGNoaWxkIFRoZSBjaGlsZCB0byByZWdpc3Rlci5cbiAgICovXG4gIHZhciByZWdpc3RlckNoaWxkID0gZnVuY3Rpb24gKHBhcmVudCwga2V5LCBjaGlsZCkge1xuICAgIGdldEtleU1hcChwYXJlbnQpW2tleV0gPSBjaGlsZDtcbiAgfTtcblxuICBpZiAoJ2RldmVsb3BtZW50JyAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgLyoqXG4gICAgKiBNYWtlcyBzdXJlIHRoYXQga2V5ZWQgRWxlbWVudCBtYXRjaGVzIHRoZSB0YWcgbmFtZSBwcm92aWRlZC5cbiAgICAqIEBwYXJhbSB7IUVsZW1lbnR9IG5vZGUgVGhlIG5vZGUgdGhhdCBpcyBiZWluZyBtYXRjaGVkLlxuICAgICogQHBhcmFtIHtzdHJpbmc9fSB0YWcgVGhlIHRhZyBuYW1lIG9mIHRoZSBFbGVtZW50LlxuICAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgb2YgdGhlIEVsZW1lbnQuXG4gICAgKi9cbiAgICB2YXIgYXNzZXJ0S2V5ZWRUYWdNYXRjaGVzID0gZnVuY3Rpb24gKG5vZGUsIHRhZywga2V5KSB7XG4gICAgICB2YXIgbm9kZU5hbWUgPSBnZXREYXRhKG5vZGUpLm5vZGVOYW1lO1xuICAgICAgaWYgKG5vZGVOYW1lICE9PSB0YWcpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdXYXMgZXhwZWN0aW5nIG5vZGUgd2l0aCBrZXkgXCInICsga2V5ICsgJ1wiIHRvIGJlIGEgJyArIHRhZyArICcsIG5vdCBhICcgKyBub2RlTmFtZSArICcuJyk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciBvciBub3QgYSBnaXZlbiBub2RlIG1hdGNoZXMgdGhlIHNwZWNpZmllZCBub2RlTmFtZSBhbmQga2V5LlxuICAgKlxuICAgKiBAcGFyYW0geyFOb2RlfSBub2RlIEFuIEhUTUwgbm9kZSwgdHlwaWNhbGx5IGFuIEhUTUxFbGVtZW50IG9yIFRleHQuXG4gICAqIEBwYXJhbSB7P3N0cmluZ30gbm9kZU5hbWUgVGhlIG5vZGVOYW1lIGZvciB0aGlzIG5vZGUuXG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBBbiBvcHRpb25hbCBrZXkgdGhhdCBpZGVudGlmaWVzIGEgbm9kZS5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgbm9kZSBtYXRjaGVzLCBmYWxzZSBvdGhlcndpc2UuXG4gICAqL1xuICB2YXIgbWF0Y2hlcyA9IGZ1bmN0aW9uIChub2RlLCBub2RlTmFtZSwga2V5KSB7XG4gICAgdmFyIGRhdGEgPSBnZXREYXRhKG5vZGUpO1xuXG4gICAgLy8gS2V5IGNoZWNrIGlzIGRvbmUgdXNpbmcgZG91YmxlIGVxdWFscyBhcyB3ZSB3YW50IHRvIHRyZWF0IGEgbnVsbCBrZXkgdGhlXG4gICAgLy8gc2FtZSBhcyB1bmRlZmluZWQuIFRoaXMgc2hvdWxkIGJlIG9rYXkgYXMgdGhlIG9ubHkgdmFsdWVzIGFsbG93ZWQgYXJlXG4gICAgLy8gc3RyaW5ncywgbnVsbCBhbmQgdW5kZWZpbmVkIHNvIHRoZSA9PSBzZW1hbnRpY3MgYXJlIG5vdCB0b28gd2VpcmQuXG4gICAgcmV0dXJuIGtleSA9PSBkYXRhLmtleSAmJiBub2RlTmFtZSA9PT0gZGF0YS5ub2RlTmFtZTtcbiAgfTtcblxuICAvKipcbiAgICogQWxpZ25zIHRoZSB2aXJ0dWFsIEVsZW1lbnQgZGVmaW5pdGlvbiB3aXRoIHRoZSBhY3R1YWwgRE9NLCBtb3ZpbmcgdGhlXG4gICAqIGNvcnJlc3BvbmRpbmcgRE9NIG5vZGUgdG8gdGhlIGNvcnJlY3QgbG9jYXRpb24gb3IgY3JlYXRpbmcgaXQgaWYgbmVjZXNzYXJ5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZU5hbWUgRm9yIGFuIEVsZW1lbnQsIHRoaXMgc2hvdWxkIGJlIGEgdmFsaWQgdGFnIHN0cmluZy5cbiAgICogICAgIEZvciBhIFRleHQsIHRoaXMgc2hvdWxkIGJlICN0ZXh0LlxuICAgKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC5cbiAgICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEZvciBhbiBFbGVtZW50LCB0aGlzIHNob3VsZCBiZSBhbiBhcnJheSBvZlxuICAgKiAgICAgbmFtZS12YWx1ZSBwYWlycy5cbiAgICogQHJldHVybiB7IU5vZGV9IFRoZSBtYXRjaGluZyBub2RlLlxuICAgKi9cbiAgdmFyIGFsaWduV2l0aERPTSA9IGZ1bmN0aW9uIChub2RlTmFtZSwga2V5LCBzdGF0aWNzKSB7XG4gICAgdmFyIGNvbnRleHQgPSBnZXRDb250ZXh0KCk7XG4gICAgdmFyIHdhbGtlciA9IGNvbnRleHQud2Fsa2VyO1xuICAgIHZhciBjdXJyZW50Tm9kZSA9IHdhbGtlci5jdXJyZW50Tm9kZTtcbiAgICB2YXIgcGFyZW50ID0gd2Fsa2VyLmdldEN1cnJlbnRQYXJlbnQoKTtcbiAgICB2YXIgbWF0Y2hpbmdOb2RlO1xuXG4gICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHdlIGhhdmUgYSBub2RlIHRvIHJldXNlXG4gICAgaWYgKGN1cnJlbnROb2RlICYmIG1hdGNoZXMoY3VycmVudE5vZGUsIG5vZGVOYW1lLCBrZXkpKSB7XG4gICAgICBtYXRjaGluZ05vZGUgPSBjdXJyZW50Tm9kZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGV4aXN0aW5nTm9kZSA9IGdldENoaWxkKHBhcmVudCwga2V5KTtcblxuICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSBub2RlIGhhcyBtb3ZlZCB3aXRoaW4gdGhlIHBhcmVudCBvciBpZiBhIG5ldyBvbmVcbiAgICAgIC8vIHNob3VsZCBiZSBjcmVhdGVkXG4gICAgICBpZiAoZXhpc3RpbmdOb2RlKSB7XG4gICAgICAgIGlmICgnZGV2ZWxvcG1lbnQnICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICBhc3NlcnRLZXllZFRhZ01hdGNoZXMoZXhpc3RpbmdOb2RlLCBub2RlTmFtZSwga2V5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIG1hdGNoaW5nTm9kZSA9IGV4aXN0aW5nTm9kZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1hdGNoaW5nTm9kZSA9IGNyZWF0ZU5vZGUoY29udGV4dC5kb2MsIG5vZGVOYW1lLCBrZXksIHN0YXRpY3MpO1xuXG4gICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICByZWdpc3RlckNoaWxkKHBhcmVudCwga2V5LCBtYXRjaGluZ05vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGV4dC5tYXJrQ3JlYXRlZChtYXRjaGluZ05vZGUpO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGUgbm9kZSBoYXMgYSBrZXksIHJlbW92ZSBpdCBmcm9tIHRoZSBET00gdG8gcHJldmVudCBhIGxhcmdlIG51bWJlclxuICAgICAgLy8gb2YgcmUtb3JkZXJzIGluIHRoZSBjYXNlIHRoYXQgaXQgbW92ZWQgZmFyIG9yIHdhcyBjb21wbGV0ZWx5IHJlbW92ZWQuXG4gICAgICAvLyBTaW5jZSB3ZSBob2xkIG9uIHRvIGEgcmVmZXJlbmNlIHRocm91Z2ggdGhlIGtleU1hcCwgd2UgY2FuIGFsd2F5cyBhZGQgaXRcbiAgICAgIC8vIGJhY2suXG4gICAgICBpZiAoY3VycmVudE5vZGUgJiYgZ2V0RGF0YShjdXJyZW50Tm9kZSkua2V5KSB7XG4gICAgICAgIHBhcmVudC5yZXBsYWNlQ2hpbGQobWF0Y2hpbmdOb2RlLCBjdXJyZW50Tm9kZSk7XG4gICAgICAgIGdldERhdGEocGFyZW50KS5rZXlNYXBWYWxpZCA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShtYXRjaGluZ05vZGUsIGN1cnJlbnROb2RlKTtcbiAgICAgIH1cblxuICAgICAgd2Fsa2VyLmN1cnJlbnROb2RlID0gbWF0Y2hpbmdOb2RlO1xuICAgIH1cblxuICAgIHJldHVybiBtYXRjaGluZ05vZGU7XG4gIH07XG5cbiAgLyoqXG4gICAqIENsZWFycyBvdXQgYW55IHVudmlzaXRlZCBOb2RlcywgYXMgdGhlIGNvcnJlc3BvbmRpbmcgdmlydHVhbCBlbGVtZW50XG4gICAqIGZ1bmN0aW9ucyB3ZXJlIG5ldmVyIGNhbGxlZCBmb3IgdGhlbS5cbiAgICogQHBhcmFtIHtOb2RlfSBub2RlXG4gICAqL1xuICB2YXIgY2xlYXJVbnZpc2l0ZWRET00gPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIHZhciBjb250ZXh0ID0gZ2V0Q29udGV4dCgpO1xuICAgIHZhciB3YWxrZXIgPSBjb250ZXh0LndhbGtlcjtcbiAgICB2YXIgZGF0YSA9IGdldERhdGEobm9kZSk7XG4gICAgdmFyIGtleU1hcCA9IGRhdGEua2V5TWFwO1xuICAgIHZhciBrZXlNYXBWYWxpZCA9IGRhdGEua2V5TWFwVmFsaWQ7XG4gICAgdmFyIGxhc3RWaXNpdGVkQ2hpbGQgPSBkYXRhLmxhc3RWaXNpdGVkQ2hpbGQ7XG4gICAgdmFyIGNoaWxkID0gbm9kZS5sYXN0Q2hpbGQ7XG4gICAgdmFyIGtleTtcblxuICAgIGRhdGEubGFzdFZpc2l0ZWRDaGlsZCA9IG51bGw7XG5cbiAgICBpZiAoY2hpbGQgPT09IGxhc3RWaXNpdGVkQ2hpbGQgJiYga2V5TWFwVmFsaWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoZGF0YS5hdHRyc1tleHBvcnRzLnN5bWJvbHMucGxhY2Vob2xkZXJdICYmIHdhbGtlci5jdXJyZW50Tm9kZSAhPT0gd2Fsa2VyLnJvb3QpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB3aGlsZSAoY2hpbGQgIT09IGxhc3RWaXNpdGVkQ2hpbGQpIHtcbiAgICAgIG5vZGUucmVtb3ZlQ2hpbGQoY2hpbGQpO1xuICAgICAgY29udGV4dC5tYXJrRGVsZXRlZCggLyoqIEB0eXBlIHshTm9kZX0qL2NoaWxkKTtcblxuICAgICAga2V5ID0gZ2V0RGF0YShjaGlsZCkua2V5O1xuICAgICAgaWYgKGtleSkge1xuICAgICAgICBkZWxldGUga2V5TWFwW2tleV07XG4gICAgICB9XG4gICAgICBjaGlsZCA9IG5vZGUubGFzdENoaWxkO1xuICAgIH1cblxuICAgIC8vIENsZWFuIHRoZSBrZXlNYXAsIHJlbW92aW5nIGFueSB1bnVzdWVkIGtleXMuXG4gICAgZm9yIChrZXkgaW4ga2V5TWFwKSB7XG4gICAgICBjaGlsZCA9IGtleU1hcFtrZXldO1xuICAgICAgaWYgKCFjaGlsZC5wYXJlbnROb2RlKSB7XG4gICAgICAgIGNvbnRleHQubWFya0RlbGV0ZWQoY2hpbGQpO1xuICAgICAgICBkZWxldGUga2V5TWFwW2tleV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgZGF0YS5rZXlNYXBWYWxpZCA9IHRydWU7XG4gIH07XG5cbiAgLyoqXG4gICAqIEVudGVycyBhbiBFbGVtZW50LCBzZXR0aW5nIHRoZSBjdXJyZW50IG5hbWVzcGFjZSBmb3IgbmVzdGVkIGVsZW1lbnRzLlxuICAgKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAgICovXG4gIHZhciBlbnRlck5vZGUgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIHZhciBkYXRhID0gZ2V0RGF0YShub2RlKTtcbiAgICBlbnRlclRhZyhkYXRhLm5vZGVOYW1lKTtcbiAgfTtcblxuICAvKipcbiAgICogRXhpdHMgYW4gRWxlbWVudCwgdW53aW5kaW5nIHRoZSBjdXJyZW50IG5hbWVzcGFjZSB0byB0aGUgcHJldmlvdXMgdmFsdWUuXG4gICAqIEBwYXJhbSB7Tm9kZX0gbm9kZVxuICAgKi9cbiAgdmFyIGV4aXROb2RlID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICB2YXIgZGF0YSA9IGdldERhdGEobm9kZSk7XG4gICAgZXhpdFRhZyhkYXRhLm5vZGVOYW1lKTtcbiAgfTtcblxuICAvKipcbiAgICogTWFya3Mgbm9kZSdzIHBhcmVudCBhcyBoYXZpbmcgdmlzaXRlZCBub2RlLlxuICAgKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAgICovXG4gIHZhciBtYXJrVmlzaXRlZCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgdmFyIGNvbnRleHQgPSBnZXRDb250ZXh0KCk7XG4gICAgdmFyIHdhbGtlciA9IGNvbnRleHQud2Fsa2VyO1xuICAgIHZhciBwYXJlbnQgPSB3YWxrZXIuZ2V0Q3VycmVudFBhcmVudCgpO1xuICAgIHZhciBkYXRhID0gZ2V0RGF0YShwYXJlbnQpO1xuICAgIGRhdGEubGFzdFZpc2l0ZWRDaGlsZCA9IG5vZGU7XG4gIH07XG5cbiAgLyoqXG4gICAqIENoYW5nZXMgdG8gdGhlIGZpcnN0IGNoaWxkIG9mIHRoZSBjdXJyZW50IG5vZGUuXG4gICAqL1xuICB2YXIgZmlyc3RDaGlsZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY29udGV4dCA9IGdldENvbnRleHQoKTtcbiAgICB2YXIgd2Fsa2VyID0gY29udGV4dC53YWxrZXI7XG4gICAgZW50ZXJOb2RlKHdhbGtlci5jdXJyZW50Tm9kZSk7XG4gICAgd2Fsa2VyLmZpcnN0Q2hpbGQoKTtcbiAgfTtcblxuICAvKipcbiAgICogQ2hhbmdlcyB0byB0aGUgbmV4dCBzaWJsaW5nIG9mIHRoZSBjdXJyZW50IG5vZGUuXG4gICAqL1xuICB2YXIgbmV4dFNpYmxpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNvbnRleHQgPSBnZXRDb250ZXh0KCk7XG4gICAgdmFyIHdhbGtlciA9IGNvbnRleHQud2Fsa2VyO1xuICAgIG1hcmtWaXNpdGVkKHdhbGtlci5jdXJyZW50Tm9kZSk7XG4gICAgd2Fsa2VyLm5leHRTaWJsaW5nKCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENoYW5nZXMgdG8gdGhlIHBhcmVudCBvZiB0aGUgY3VycmVudCBub2RlLCByZW1vdmluZyBhbnkgdW52aXNpdGVkIGNoaWxkcmVuLlxuICAgKi9cbiAgdmFyIHBhcmVudE5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNvbnRleHQgPSBnZXRDb250ZXh0KCk7XG4gICAgdmFyIHdhbGtlciA9IGNvbnRleHQud2Fsa2VyO1xuICAgIHdhbGtlci5wYXJlbnROb2RlKCk7XG4gICAgZXhpdE5vZGUod2Fsa2VyLmN1cnJlbnROb2RlKTtcbiAgfTtcblxuICBpZiAoJ2RldmVsb3BtZW50JyAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgdmFyIGFzc2VydE5vVW5jbG9zZWRUYWdzID0gZnVuY3Rpb24gKHJvb3QpIHtcbiAgICAgIHZhciBvcGVuRWxlbWVudCA9IGdldENvbnRleHQoKS53YWxrZXIuZ2V0Q3VycmVudFBhcmVudCgpO1xuICAgICAgaWYgKCFvcGVuRWxlbWVudCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBvcGVuVGFncyA9IFtdO1xuICAgICAgd2hpbGUgKG9wZW5FbGVtZW50ICYmIG9wZW5FbGVtZW50ICE9PSByb290KSB7XG4gICAgICAgIG9wZW5UYWdzLnB1c2gob3BlbkVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgIG9wZW5FbGVtZW50ID0gb3BlbkVsZW1lbnQucGFyZW50Tm9kZTtcbiAgICAgIH1cblxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdPbmUgb3IgbW9yZSB0YWdzIHdlcmUgbm90IGNsb3NlZDpcXG4nICsgb3BlblRhZ3Muam9pbignXFxuJykpO1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogUGF0Y2hlcyB0aGUgZG9jdW1lbnQgc3RhcnRpbmcgYXQgZWwgd2l0aCB0aGUgcHJvdmlkZWQgZnVuY3Rpb24uIFRoaXMgZnVuY3Rpb25cbiAgICogbWF5IGJlIGNhbGxlZCBkdXJpbmcgYW4gZXhpc3RpbmcgcGF0Y2ggb3BlcmF0aW9uLlxuICAgKiBAcGFyYW0geyFFbGVtZW50fCFEb2N1bWVudEZyYWdtZW50fSBub2RlIFRoZSBFbGVtZW50IG9yIERvY3VtZW50XG4gICAqICAgICB0byBwYXRjaC5cbiAgICogQHBhcmFtIHshZnVuY3Rpb24oVCl9IGZuIEEgZnVuY3Rpb24gY29udGFpbmluZyBlbGVtZW50T3Blbi9lbGVtZW50Q2xvc2UvZXRjLlxuICAgKiAgICAgY2FsbHMgdGhhdCBkZXNjcmliZSB0aGUgRE9NLlxuICAgKiBAcGFyYW0ge1Q9fSBkYXRhIEFuIGFyZ3VtZW50IHBhc3NlZCB0byBmbiB0byByZXByZXNlbnQgRE9NIHN0YXRlLlxuICAgKiBAdGVtcGxhdGUgVFxuICAgKi9cbiAgZXhwb3J0cy5wYXRjaCA9IGZ1bmN0aW9uIChub2RlLCBmbiwgZGF0YSkge1xuICAgIGVudGVyQ29udGV4dChub2RlKTtcblxuICAgIGZpcnN0Q2hpbGQoKTtcbiAgICBmbihkYXRhKTtcbiAgICBwYXJlbnROb2RlKCk7XG4gICAgY2xlYXJVbnZpc2l0ZWRET00obm9kZSk7XG5cbiAgICBpZiAoJ2RldmVsb3BtZW50JyAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICBhc3NlcnROb1VuY2xvc2VkVGFncyhub2RlKTtcbiAgICB9XG5cbiAgICBnZXRDb250ZXh0KCkubm90aWZ5Q2hhbmdlcygpO1xuICAgIHJlc3RvcmVDb250ZXh0KCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFRoZSBvZmZzZXQgaW4gdGhlIHZpcnR1YWwgZWxlbWVudCBkZWNsYXJhdGlvbiB3aGVyZSB0aGUgYXR0cmlidXRlcyBhcmVcbiAgICogc3BlY2lmaWVkLlxuICAgKiBAY29uc3RcbiAgICovXG4gIHZhciBBVFRSSUJVVEVTX09GRlNFVCA9IDM7XG5cbiAgLyoqXG4gICAqIEJ1aWxkcyBhbiBhcnJheSBvZiBhcmd1bWVudHMgZm9yIHVzZSB3aXRoIGVsZW1lbnRPcGVuU3RhcnQsIGF0dHIgYW5kXG4gICAqIGVsZW1lbnRPcGVuRW5kLlxuICAgKiBAY29uc3Qge0FycmF5PCo+fVxuICAgKi9cbiAgdmFyIGFyZ3NCdWlsZGVyID0gW107XG5cbiAgaWYgKCdkZXZlbG9wbWVudCcgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIC8qKlxuICAgICAqIEtlZXBzIHRyYWNrIHdoZXRoZXIgb3Igbm90IHdlIGFyZSBpbiBhbiBhdHRyaWJ1dGVzIGRlY2xhcmF0aW9uIChhZnRlclxuICAgICAqIGVsZW1lbnRPcGVuU3RhcnQsIGJ1dCBiZWZvcmUgZWxlbWVudE9wZW5FbmQpLlxuICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAqL1xuICAgIHZhciBpbkF0dHJpYnV0ZXMgPSBmYWxzZTtcblxuICAgIC8qKiBNYWtlcyBzdXJlIHRoYXQgdGhlIGNhbGxlciBpcyBub3Qgd2hlcmUgYXR0cmlidXRlcyBhcmUgZXhwZWN0ZWQuICovXG4gICAgdmFyIGFzc2VydE5vdEluQXR0cmlidXRlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChpbkF0dHJpYnV0ZXMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdXYXMgbm90IGV4cGVjdGluZyBhIGNhbGwgdG8gYXR0ciBvciBlbGVtZW50T3BlbkVuZCwgJyArICd0aGV5IG11c3QgZm9sbG93IGEgY2FsbCB0byBlbGVtZW50T3BlblN0YXJ0LicpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvKiogTWFrZXMgc3VyZSB0aGF0IHRoZSBjYWxsZXIgaXMgd2hlcmUgYXR0cmlidXRlcyBhcmUgZXhwZWN0ZWQuICovXG4gICAgdmFyIGFzc2VydEluQXR0cmlidXRlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICghaW5BdHRyaWJ1dGVzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignV2FzIGV4cGVjdGluZyBhIGNhbGwgdG8gYXR0ciBvciBlbGVtZW50T3BlbkVuZC4gJyArICdlbGVtZW50T3BlblN0YXJ0IG11c3QgYmUgZm9sbG93ZWQgYnkgemVybyBvciBtb3JlIGNhbGxzIHRvIGF0dHIsICcgKyAndGhlbiBvbmUgY2FsbCB0byBlbGVtZW50T3BlbkVuZC4nKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogTWFrZXMgc3VyZSB0aGF0IHBsYWNlaG9sZGVycyBoYXZlIGEga2V5IHNwZWNpZmllZC4gT3RoZXJ3aXNlLCBjb25kaXRpb25hbFxuICAgICAqIHBsYWNlaG9sZGVycyBhbmQgY29uZGl0aW9uYWwgZWxlbWVudHMgbmV4dCB0byBwbGFjZWhvbGRlcnMgd2lsbCBjYXVzZVxuICAgICAqIHBsYWNlaG9sZGVyIGVsZW1lbnRzIHRvIGJlIHJlLXVzZWQgYXMgbm9uLXBsYWNlaG9sZGVycyBhbmQgdmljZSB2ZXJzYS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gICAgICovXG4gICAgdmFyIGFzc2VydFBsYWNlaG9sZGVyS2V5U3BlY2lmaWVkID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGFjZWhvbGRlciBlbGVtZW50cyBtdXN0IGhhdmUgYSBrZXkgc3BlY2lmaWVkLicpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBNYWtlcyBzdXJlIHRoYXQgdGFncyBhcmUgY29ycmVjdGx5IG5lc3RlZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnXG4gICAgICovXG4gICAgdmFyIGFzc2VydENsb3NlTWF0Y2hlc09wZW5UYWcgPSBmdW5jdGlvbiAodGFnKSB7XG4gICAgICB2YXIgY29udGV4dCA9IGdldENvbnRleHQoKTtcbiAgICAgIHZhciB3YWxrZXIgPSBjb250ZXh0LndhbGtlcjtcbiAgICAgIHZhciBjbG9zaW5nTm9kZSA9IHdhbGtlci5nZXRDdXJyZW50UGFyZW50KCk7XG4gICAgICB2YXIgZGF0YSA9IGdldERhdGEoY2xvc2luZ05vZGUpO1xuXG4gICAgICBpZiAodGFnICE9PSBkYXRhLm5vZGVOYW1lKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUmVjZWl2ZWQgYSBjYWxsIHRvIGNsb3NlICcgKyB0YWcgKyAnIGJ1dCAnICsgZGF0YS5ub2RlTmFtZSArICcgd2FzIG9wZW4uJyk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8qKiBVcGRhdGVzIHRoZSBzdGF0ZSB0byBiZWluZyBpbiBhbiBhdHRyaWJ1dGUgZGVjbGFyYXRpb24uICovXG4gICAgdmFyIHNldEluQXR0cmlidXRlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGluQXR0cmlidXRlcyA9IHRydWU7XG4gICAgfTtcblxuICAgIC8qKiBVcGRhdGVzIHRoZSBzdGF0ZSB0byBub3QgYmVpbmcgaW4gYW4gYXR0cmlidXRlIGRlY2xhcmF0aW9uLiAqL1xuICAgIHZhciBzZXROb3RJbkF0dHJpYnV0ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpbkF0dHJpYnV0ZXMgPSBmYWxzZTtcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICAgKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gICAqICAgICB3aGVuIGl0ZXJhdGluZyBvdmVyIGFuIGFycmF5IG9mIGl0ZW1zLlxuICAgKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gICAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICAgKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICAgKiBAcGFyYW0gey4uLip9IHZhcl9hcmdzIEF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZSBkeW5hbWljIGF0dHJpYnV0ZXNcbiAgICogICAgIGZvciB0aGUgRWxlbWVudC5cbiAgICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gICAqL1xuICBleHBvcnRzLmVsZW1lbnRPcGVuID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzLCB2YXJfYXJncykge1xuICAgIGlmICgnZGV2ZWxvcG1lbnQnICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIGFzc2VydE5vdEluQXR0cmlidXRlcygpO1xuICAgIH1cblxuICAgIHZhciBub2RlID0gLyoqIEB0eXBlIHshRWxlbWVudH0qL2FsaWduV2l0aERPTSh0YWcsIGtleSwgc3RhdGljcyk7XG4gICAgdmFyIGRhdGEgPSBnZXREYXRhKG5vZGUpO1xuXG4gICAgLypcbiAgICAgKiBDaGVja3MgdG8gc2VlIGlmIG9uZSBvciBtb3JlIGF0dHJpYnV0ZXMgaGF2ZSBjaGFuZ2VkIGZvciBhIGdpdmVuIEVsZW1lbnQuXG4gICAgICogV2hlbiBubyBhdHRyaWJ1dGVzIGhhdmUgY2hhbmdlZCwgdGhpcyBpcyBtdWNoIGZhc3RlciB0aGFuIGNoZWNraW5nIGVhY2hcbiAgICAgKiBpbmRpdmlkdWFsIGFyZ3VtZW50LiBXaGVuIGF0dHJpYnV0ZXMgaGF2ZSBjaGFuZ2VkLCB0aGUgb3ZlcmhlYWQgb2YgdGhpcyBpc1xuICAgICAqIG1pbmltYWwuXG4gICAgICovXG4gICAgdmFyIGF0dHJzQXJyID0gZGF0YS5hdHRyc0FycjtcbiAgICB2YXIgYXR0cnNDaGFuZ2VkID0gZmFsc2U7XG4gICAgdmFyIGkgPSBBVFRSSUJVVEVTX09GRlNFVDtcbiAgICB2YXIgaiA9IDA7XG5cbiAgICBmb3IgKDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMSwgaiArPSAxKSB7XG4gICAgICBpZiAoYXR0cnNBcnJbal0gIT09IGFyZ3VtZW50c1tpXSkge1xuICAgICAgICBhdHRyc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMSwgaiArPSAxKSB7XG4gICAgICBhdHRyc0FycltqXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBpZiAoaiA8IGF0dHJzQXJyLmxlbmd0aCkge1xuICAgICAgYXR0cnNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIGF0dHJzQXJyLmxlbmd0aCA9IGo7XG4gICAgfVxuXG4gICAgLypcbiAgICAgKiBBY3R1YWxseSBwZXJmb3JtIHRoZSBhdHRyaWJ1dGUgdXBkYXRlLlxuICAgICAqL1xuICAgIGlmIChhdHRyc0NoYW5nZWQpIHtcbiAgICAgIHZhciBhdHRyLFxuICAgICAgICAgIG5ld0F0dHJzID0gZGF0YS5uZXdBdHRycztcblxuICAgICAgZm9yIChhdHRyIGluIG5ld0F0dHJzKSB7XG4gICAgICAgIG5ld0F0dHJzW2F0dHJdID0gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGkgPSBBVFRSSUJVVEVTX09GRlNFVDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICBuZXdBdHRyc1thcmd1bWVudHNbaV1dID0gYXJndW1lbnRzW2kgKyAxXTtcbiAgICAgIH1cblxuICAgICAgZm9yIChhdHRyIGluIG5ld0F0dHJzKSB7XG4gICAgICAgIHVwZGF0ZUF0dHJpYnV0ZShub2RlLCBhdHRyLCBuZXdBdHRyc1thdHRyXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZmlyc3RDaGlsZCgpO1xuICAgIHJldHVybiBub2RlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZWNsYXJlcyBhIHZpcnR1YWwgRWxlbWVudCBhdCB0aGUgY3VycmVudCBsb2NhdGlvbiBpbiB0aGUgZG9jdW1lbnQuIFRoaXNcbiAgICogY29ycmVzcG9uZHMgdG8gYW4gb3BlbmluZyB0YWcgYW5kIGEgZWxlbWVudENsb3NlIHRhZyBpcyByZXF1aXJlZC4gVGhpcyBpc1xuICAgKiBsaWtlIGVsZW1lbnRPcGVuLCBidXQgdGhlIGF0dHJpYnV0ZXMgYXJlIGRlZmluZWQgdXNpbmcgdGhlIGF0dHIgZnVuY3Rpb25cbiAgICogcmF0aGVyIHRoYW4gYmVpbmcgcGFzc2VkIGFzIGFyZ3VtZW50cy4gTXVzdCBiZSBmb2xsbG93ZWQgYnkgMCBvciBtb3JlIGNhbGxzXG4gICAqIHRvIGF0dHIsIHRoZW4gYSBjYWxsIHRvIGVsZW1lbnRPcGVuRW5kLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICAgKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC4gVGhpcyBjYW4gYmUgYW5cbiAgICogICAgIGVtcHR5IHN0cmluZywgYnV0IHBlcmZvcm1hbmNlIG1heSBiZSBiZXR0ZXIgaWYgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZFxuICAgKiAgICAgd2hlbiBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBvZiBpdGVtcy5cbiAgICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICAgKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAgICogICAgIEVsZW1lbnQgaXMgY3JlYXRlZC5cbiAgICovXG4gIGV4cG9ydHMuZWxlbWVudE9wZW5TdGFydCA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcykge1xuICAgIGlmICgnZGV2ZWxvcG1lbnQnICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIGFzc2VydE5vdEluQXR0cmlidXRlcygpO1xuICAgICAgc2V0SW5BdHRyaWJ1dGVzKCk7XG4gICAgfVxuXG4gICAgYXJnc0J1aWxkZXJbMF0gPSB0YWc7XG4gICAgYXJnc0J1aWxkZXJbMV0gPSBrZXk7XG4gICAgYXJnc0J1aWxkZXJbMl0gPSBzdGF0aWNzO1xuICB9O1xuXG4gIC8qKipcbiAgICogRGVmaW5lcyBhIHZpcnR1YWwgYXR0cmlidXRlIGF0IHRoaXMgcG9pbnQgb2YgdGhlIERPTS4gVGhpcyBpcyBvbmx5IHZhbGlkXG4gICAqIHdoZW4gY2FsbGVkIGJldHdlZW4gZWxlbWVudE9wZW5TdGFydCBhbmQgZWxlbWVudE9wZW5FbmQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWVcbiAgICovXG4gIGV4cG9ydHMuYXR0ciA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICAgIGlmICgnZGV2ZWxvcG1lbnQnICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIGFzc2VydEluQXR0cmlidXRlcygpO1xuICAgIH1cblxuICAgIGFyZ3NCdWlsZGVyLnB1c2gobmFtZSwgdmFsdWUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDbG9zZXMgYW4gb3BlbiB0YWcgc3RhcnRlZCB3aXRoIGVsZW1lbnRPcGVuU3RhcnQuXG4gICAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICAgKi9cbiAgZXhwb3J0cy5lbGVtZW50T3BlbkVuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoJ2RldmVsb3BtZW50JyAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICBhc3NlcnRJbkF0dHJpYnV0ZXMoKTtcbiAgICAgIHNldE5vdEluQXR0cmlidXRlcygpO1xuICAgIH1cblxuICAgIHZhciBub2RlID0gZXhwb3J0cy5lbGVtZW50T3Blbi5hcHBseShudWxsLCBhcmdzQnVpbGRlcik7XG4gICAgYXJnc0J1aWxkZXIubGVuZ3RoID0gMDtcbiAgICByZXR1cm4gbm9kZTtcbiAgfTtcblxuICAvKipcbiAgICogQ2xvc2VzIGFuIG9wZW4gdmlydHVhbCBFbGVtZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICAgKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAgICovXG4gIGV4cG9ydHMuZWxlbWVudENsb3NlID0gZnVuY3Rpb24gKHRhZykge1xuICAgIGlmICgnZGV2ZWxvcG1lbnQnICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIGFzc2VydE5vdEluQXR0cmlidXRlcygpO1xuICAgICAgYXNzZXJ0Q2xvc2VNYXRjaGVzT3BlblRhZyh0YWcpO1xuICAgIH1cblxuICAgIHBhcmVudE5vZGUoKTtcblxuICAgIHZhciBub2RlID0gLyoqIEB0eXBlIHshRWxlbWVudH0gKi9nZXRDb250ZXh0KCkud2Fsa2VyLmN1cnJlbnROb2RlO1xuXG4gICAgY2xlYXJVbnZpc2l0ZWRET00obm9kZSk7XG5cbiAgICBuZXh0U2libGluZygpO1xuICAgIHJldHVybiBub2RlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZWNsYXJlcyBhIHZpcnR1YWwgRWxlbWVudCBhdCB0aGUgY3VycmVudCBsb2NhdGlvbiBpbiB0aGUgZG9jdW1lbnQgdGhhdCBoYXNcbiAgICogbm8gY2hpbGRyZW4uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICAgKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gICAqICAgICB3aGVuIGl0ZXJhdGluZyBvdmVyIGFuIGFycmF5IG9mIGl0ZW1zLlxuICAgKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gICAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICAgKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICAgKiBAcGFyYW0gey4uLip9IHZhcl9hcmdzIEF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZSBkeW5hbWljIGF0dHJpYnV0ZXNcbiAgICogICAgIGZvciB0aGUgRWxlbWVudC5cbiAgICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gICAqL1xuICBleHBvcnRzLmVsZW1lbnRWb2lkID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzLCB2YXJfYXJncykge1xuICAgIHZhciBub2RlID0gZXhwb3J0cy5lbGVtZW50T3Blbi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgIGV4cG9ydHMuZWxlbWVudENsb3NlLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIG5vZGU7XG4gIH07XG5cbiAgLyoqXG4gICAqIERlY2xhcmVzIGEgdmlydHVhbCBFbGVtZW50IGF0IHRoZSBjdXJyZW50IGxvY2F0aW9uIGluIHRoZSBkb2N1bWVudCB0aGF0IGlzIGFcbiAgICogcGxhY2Vob2xkZXIgZWxlbWVudC4gQ2hpbGRyZW4gb2YgdGhpcyBFbGVtZW50IGNhbiBiZSBtYW51YWxseSBtYW5hZ2VkIGFuZFxuICAgKiB3aWxsIG5vdCBiZSBjbGVhcmVkIGJ5IHRoZSBsaWJyYXJ5LlxuICAgKlxuICAgKiBBIGtleSBtdXN0IGJlIHNwZWNpZmllZCB0byBtYWtlIHN1cmUgdGhhdCB0aGlzIG5vZGUgaXMgY29ycmVjdGx5IHByZXNlcnZlZFxuICAgKiBhY3Jvc3MgYWxsIGNvbmRpdGlvbmFscy5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LlxuICAgKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gICAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICAgKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICAgKiBAcGFyYW0gey4uLip9IHZhcl9hcmdzIEF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZSBkeW5hbWljIGF0dHJpYnV0ZXNcbiAgICogICAgIGZvciB0aGUgRWxlbWVudC5cbiAgICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gICAqL1xuICBleHBvcnRzLmVsZW1lbnRQbGFjZWhvbGRlciA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcywgdmFyX2FyZ3MpIHtcbiAgICBpZiAoJ2RldmVsb3BtZW50JyAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICBhc3NlcnRQbGFjZWhvbGRlcktleVNwZWNpZmllZChrZXkpO1xuICAgIH1cblxuICAgIHZhciBub2RlID0gZXhwb3J0cy5lbGVtZW50T3Blbi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgIHVwZGF0ZUF0dHJpYnV0ZShub2RlLCBleHBvcnRzLnN5bWJvbHMucGxhY2Vob2xkZXIsIHRydWUpO1xuICAgIGV4cG9ydHMuZWxlbWVudENsb3NlLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIG5vZGU7XG4gIH07XG5cbiAgLyoqXG4gICAqIERlY2xhcmVzIGEgdmlydHVhbCBUZXh0IGF0IHRoaXMgcG9pbnQgaW4gdGhlIGRvY3VtZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ8Ym9vbGVhbn0gdmFsdWUgVGhlIHZhbHVlIG9mIHRoZSBUZXh0LlxuICAgKiBAcGFyYW0gey4uLihmdW5jdGlvbigoc3RyaW5nfG51bWJlcnxib29sZWFuKSk6c3RyaW5nKX0gdmFyX2FyZ3NcbiAgICogICAgIEZ1bmN0aW9ucyB0byBmb3JtYXQgdGhlIHZhbHVlIHdoaWNoIGFyZSBjYWxsZWQgb25seSB3aGVuIHRoZSB2YWx1ZSBoYXNcbiAgICogICAgIGNoYW5nZWQuXG4gICAqIEByZXR1cm4geyFUZXh0fSBUaGUgY29ycmVzcG9uZGluZyB0ZXh0IG5vZGUuXG4gICAqL1xuICBleHBvcnRzLnRleHQgPSBmdW5jdGlvbiAodmFsdWUsIHZhcl9hcmdzKSB7XG4gICAgaWYgKCdkZXZlbG9wbWVudCcgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgYXNzZXJ0Tm90SW5BdHRyaWJ1dGVzKCk7XG4gICAgfVxuXG4gICAgdmFyIG5vZGUgPSAvKiogQHR5cGUgeyFUZXh0fSovYWxpZ25XaXRoRE9NKCcjdGV4dCcsIG51bGwpO1xuICAgIHZhciBkYXRhID0gZ2V0RGF0YShub2RlKTtcblxuICAgIGlmIChkYXRhLnRleHQgIT09IHZhbHVlKSB7XG4gICAgICBkYXRhLnRleHQgPSAvKiogQHR5cGUge3N0cmluZ30gKi92YWx1ZTtcblxuICAgICAgdmFyIGZvcm1hdHRlZCA9IHZhbHVlO1xuICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgZm9ybWF0dGVkID0gYXJndW1lbnRzW2ldKGZvcm1hdHRlZCk7XG4gICAgICB9XG5cbiAgICAgIG5vZGUuZGF0YSA9IGZvcm1hdHRlZDtcbiAgICB9XG5cbiAgICBuZXh0U2libGluZygpO1xuICAgIHJldHVybiBub2RlO1xuICB9O1xufSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmNyZW1lbnRhbC1kb20uanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZGlzdC9jbGllbnQnKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLypcbiAgICAoaGFwaSluZXMgV2ViU29ja2V0IENsaWVudCAoaHR0cHM6Ly9naXRodWIuY29tL2hhcGlqcy9uZXMpXG4gICAgQ29weXJpZ2h0IChjKSAyMDE1LCBFcmFuIEhhbW1lciA8ZXJhbkBoYW1tZXIuaW8+IGFuZCBvdGhlciBjb250cmlidXRvcnNcbiAgICBCU0QgTGljZW5zZWRcbiovXG5cbnZhciBfdHlwZW9mID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIgPyBmdW5jdGlvbiAob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9IDogZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9O1xuXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblxuICAgIC8vICRsYWI6Y292ZXJhZ2U6b2ZmJFxuXG4gICAgaWYgKCh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcgPyAndW5kZWZpbmVkJyA6IF90eXBlb2YoZXhwb3J0cykpID09PSAnb2JqZWN0JyAmJiAodHlwZW9mIG1vZHVsZSA9PT0gJ3VuZGVmaW5lZCcgPyAndW5kZWZpbmVkJyA6IF90eXBlb2YobW9kdWxlKSkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpOyAvLyBFeHBvcnQgaWYgdXNlZCBhcyBhIG1vZHVsZVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgICAgICBkZWZpbmUoZmFjdG9yeSk7XG4gICAgICAgIH0gZWxzZSBpZiAoKHR5cGVvZiBleHBvcnRzID09PSAndW5kZWZpbmVkJyA/ICd1bmRlZmluZWQnIDogX3R5cGVvZihleHBvcnRzKSkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBleHBvcnRzLm5lcyA9IGZhY3RvcnkoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJvb3QubmVzID0gZmFjdG9yeSgpO1xuICAgICAgICB9XG5cbiAgICAvLyAkbGFiOmNvdmVyYWdlOm9uJFxufSkodW5kZWZpbmVkLCBmdW5jdGlvbiAoKSB7XG5cbiAgICAvLyBVdGlsaXRpZXNcblxuICAgIHZhciB2ZXJzaW9uID0gJzInO1xuICAgIHZhciBpZ25vcmUgPSBmdW5jdGlvbiBpZ25vcmUoKSB7fTtcblxuICAgIHZhciBwYXJzZSA9IGZ1bmN0aW9uIHBhcnNlKG1lc3NhZ2UsIG5leHQpIHtcblxuICAgICAgICB2YXIgb2JqID0gbnVsbDtcbiAgICAgICAgdmFyIGVycm9yID0gbnVsbDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgb2JqID0gSlNPTi5wYXJzZShtZXNzYWdlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBlcnJvciA9IG5ldyBOZXNFcnJvcihlcnIsICdwcm90b2NvbCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5leHQoZXJyb3IsIG9iaik7XG4gICAgfTtcblxuICAgIHZhciBzdHJpbmdpZnkgPSBmdW5jdGlvbiBzdHJpbmdpZnkobWVzc2FnZSwgbmV4dCkge1xuXG4gICAgICAgIHZhciBzdHJpbmcgPSBudWxsO1xuICAgICAgICB2YXIgZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzdHJpbmcgPSBKU09OLnN0cmluZ2lmeShtZXNzYWdlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBlcnJvciA9IG5ldyBOZXNFcnJvcihlcnIsICd1c2VyJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV4dChlcnJvciwgc3RyaW5nKTtcbiAgICB9O1xuXG4gICAgdmFyIE5lc0Vycm9yID0gZnVuY3Rpb24gTmVzRXJyb3IoZXJyLCB0eXBlKSB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBlcnIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBlcnIgPSBuZXcgRXJyb3IoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVyci50eXBlID0gdHlwZTtcbiAgICAgICAgcmV0dXJuIGVycjtcbiAgICB9O1xuXG4gICAgLy8gRXJyb3IgY29kZXNcblxuICAgIHZhciBlcnJvckNvZGVzID0ge1xuICAgICAgICAxMDAwOiAnTm9ybWFsIGNsb3N1cmUnLFxuICAgICAgICAxMDAxOiAnR29pbmcgYXdheScsXG4gICAgICAgIDEwMDI6ICdQcm90b2NvbCBlcnJvcicsXG4gICAgICAgIDEwMDM6ICdVbnN1cHBvcnRlZCBkYXRhJyxcbiAgICAgICAgMTAwNDogJ1Jlc2VydmVkJyxcbiAgICAgICAgMTAwNTogJ05vIHN0YXR1cyByZWNlaXZlZCcsXG4gICAgICAgIDEwMDY6ICdBYm5vcm1hbCBjbG9zdXJlJyxcbiAgICAgICAgMTAwNzogJ0ludmFsaWQgZnJhbWUgcGF5bG9hZCBkYXRhJyxcbiAgICAgICAgMTAwODogJ1BvbGljeSB2aW9sYXRpb24nLFxuICAgICAgICAxMDA5OiAnTWVzc2FnZSB0b28gYmlnJyxcbiAgICAgICAgMTAxMDogJ01hbmRhdG9yeSBleHRlbnNpb24nLFxuICAgICAgICAxMDExOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyxcbiAgICAgICAgMTAxNTogJ1RMUyBoYW5kc2hha2UnXG4gICAgfTtcblxuICAgIC8vIENsaWVudFxuXG4gICAgdmFyIENsaWVudCA9IGZ1bmN0aW9uIENsaWVudCh1cmwsIG9wdGlvbnMpIHtcblxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAvLyBDb25maWd1cmF0aW9uXG5cbiAgICAgICAgdGhpcy5fdXJsID0gdXJsO1xuICAgICAgICB0aGlzLl9zZXR0aW5ncyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMuX2hlYXJ0YmVhdFRpbWVvdXQgPSBmYWxzZTsgLy8gU2VydmVyIGhlYXJ0YmVhdCBjb25maWd1cmF0aW9uXG5cbiAgICAgICAgLy8gU3RhdGVcblxuICAgICAgICB0aGlzLl93cyA9IG51bGw7XG4gICAgICAgIHRoaXMuX3JlY29ubmVjdGlvbiA9IG51bGw7XG4gICAgICAgIHRoaXMuX2lkcyA9IDA7IC8vIElkIGNvdW50ZXJcbiAgICAgICAgdGhpcy5fcmVxdWVzdHMgPSB7fTsgLy8gaWQgLT4geyBjYWxsYmFjaywgdGltZW91dCB9XG4gICAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSB7fTsgLy8gcGF0aCAtPiBbY2FsbGJhY2tzXVxuICAgICAgICB0aGlzLl9oZWFydGJlYXQgPSBudWxsO1xuXG4gICAgICAgIC8vIEV2ZW50c1xuXG4gICAgICAgIHRoaXMub25FcnJvciA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIH07IC8vIEdlbmVyYWwgZXJyb3IgY2FsbGJhY2sgKG9ubHkgd2hlbiBhbiBlcnJvciBjYW5ub3QgYmUgYXNzb2NpYXRlZCB3aXRoIGEgcmVxdWVzdClcbiAgICAgICAgdGhpcy5vbkNvbm5lY3QgPSBpZ25vcmU7IC8vIENhbGxlZCB3aGVuZXZlciBhIGNvbm5lY3Rpb24gaXMgZXN0YWJsaXNoZWRcbiAgICAgICAgdGhpcy5vbkRpc2Nvbm5lY3QgPSBpZ25vcmU7IC8vIENhbGxlZCB3aGVuZXZlciBhIGNvbm5lY3Rpb24gaXMgbG9zdDogZnVuY3Rpb24od2lsbFJlY29ubmVjdClcbiAgICAgICAgdGhpcy5vblVwZGF0ZSA9IGlnbm9yZTtcblxuICAgICAgICAvLyBQdWJsaWMgcHJvcGVydGllc1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsOyAvLyBBc3NpZ25lZCB3aGVuIGhlbGxvIHJlc3BvbnNlIGlzIHJlY2VpdmVkXG4gICAgfTtcblxuICAgIENsaWVudC5XZWJTb2NrZXQgPSAvKiAkbGFiOmNvdmVyYWdlOm9mZiQgKi90eXBlb2YgV2ViU29ja2V0ID09PSAndW5kZWZpbmVkJyA/IG51bGwgOiBXZWJTb2NrZXQ7IC8qICRsYWI6Y292ZXJhZ2U6b24kICovXG5cbiAgICBDbGllbnQucHJvdG90eXBlLmNvbm5lY3QgPSBmdW5jdGlvbiAob3B0aW9ucywgY2FsbGJhY2spIHtcblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gYXJndW1lbnRzWzBdO1xuICAgICAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMucmVjb25uZWN0ICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgLy8gRGVmYXVsdHMgdG8gdHJ1ZVxuICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uID0geyAvLyBPcHRpb25zOiByZWNvbm5lY3QsIGRlbGF5LCBtYXhEZWxheVxuICAgICAgICAgICAgICAgIHdhaXQ6IDAsXG4gICAgICAgICAgICAgICAgZGVsYXk6IG9wdGlvbnMuZGVsYXkgfHwgMTAwMCwgLy8gMSBzZWNvbmRcbiAgICAgICAgICAgICAgICBtYXhEZWxheTogb3B0aW9ucy5tYXhEZWxheSB8fCA1MDAwLCAvLyA1IHNlY29uZHNcbiAgICAgICAgICAgICAgICByZXRyaWVzOiBvcHRpb25zLnJldHJpZXMgfHwgSW5maW5pdHksIC8vIFVubGltaXRlZFxuICAgICAgICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICAgICAgICAgIGF1dGg6IG9wdGlvbnMuYXV0aCxcbiAgICAgICAgICAgICAgICAgICAgdGltZW91dDogb3B0aW9ucy50aW1lb3V0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3JlY29ubmVjdGlvbiA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jb25uZWN0KG9wdGlvbnMsIHRydWUsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5fY29ubmVjdCA9IGZ1bmN0aW9uIChvcHRpb25zLCBpbml0aWFsLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIHZhciBzZW50Q2FsbGJhY2sgPSBmYWxzZTtcbiAgICAgICAgdmFyIHRpbWVvdXRIYW5kbGVyID0gZnVuY3Rpb24gdGltZW91dEhhbmRsZXIoKSB7XG5cbiAgICAgICAgICAgIHNlbnRDYWxsYmFjayA9IHRydWU7XG4gICAgICAgICAgICBfdGhpcy5fd3MuY2xvc2UoKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBOZXNFcnJvcignQ29ubmVjdGlvbiB0aW1lZCBvdXQnLCAndGltZW91dCcpKTtcbiAgICAgICAgICAgIF90aGlzLl9jbGVhbnVwKCk7XG4gICAgICAgICAgICBpZiAoaW5pdGlhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5fcmVjb25uZWN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHRpbWVvdXQgPSBvcHRpb25zLnRpbWVvdXQgPyBzZXRUaW1lb3V0KHRpbWVvdXRIYW5kbGVyLCBvcHRpb25zLnRpbWVvdXQpIDogbnVsbDtcblxuICAgICAgICB2YXIgd3MgPSBuZXcgQ2xpZW50LldlYlNvY2tldCh0aGlzLl91cmwsIHRoaXMuX3NldHRpbmdzLndzKTsgLy8gU2V0dGluZ3MgdXNlZCBieSBub2RlLmpzIG9ubHlcbiAgICAgICAgdGhpcy5fd3MgPSB3cztcblxuICAgICAgICB3cy5vbm9wZW4gPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblxuICAgICAgICAgICAgaWYgKCFzZW50Q2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBzZW50Q2FsbGJhY2sgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5faGVsbG8ob3B0aW9ucy5hdXRoLCBmdW5jdGlvbiAoZXJyKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5wYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIF90aGlzLl9zdWJzY3JpcHRpb25zW2Vyci5wYXRoXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGlzY29ubmVjdCgpOyAvLyBTdG9wIHJlY29ubmVjdGlvbiB3aGVuIHRoZSBoZWxsbyBtZXNzYWdlIHJldHVybnMgZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgX3RoaXMub25Db25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHdzLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICAgICAgICAgICAgdmFyIGVyciA9IG5ldyBOZXNFcnJvcignU29ja2V0IGVycm9yJywgJ3dzJyk7XG5cbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblxuICAgICAgICAgICAgaWYgKCFzZW50Q2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBzZW50Q2FsbGJhY2sgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gX3RoaXMub25FcnJvcihlcnIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHdzLm9uY2xvc2UgPSBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICAgICAgICAgICAgdmFyIGxvZyA9IHtcbiAgICAgICAgICAgICAgICBjb2RlOiBldmVudC5jb2RlLFxuICAgICAgICAgICAgICAgIGV4cGxhbmF0aW9uOiBlcnJvckNvZGVzW2V2ZW50LmNvZGVdIHx8ICdVbmtub3duJyxcbiAgICAgICAgICAgICAgICByZWFzb246IGV2ZW50LnJlYXNvbixcbiAgICAgICAgICAgICAgICB3YXNDbGVhbjogZXZlbnQud2FzQ2xlYW5cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIF90aGlzLl9jbGVhbnVwKCk7XG4gICAgICAgICAgICBfdGhpcy5vbkRpc2Nvbm5lY3QoISEoX3RoaXMuX3JlY29ubmVjdGlvbiAmJiBfdGhpcy5fcmVjb25uZWN0aW9uLnJldHJpZXMgPj0gMSksIGxvZyk7XG4gICAgICAgICAgICBfdGhpcy5fcmVjb25uZWN0KCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgd3Mub25tZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcblxuICAgICAgICAgICAgcmV0dXJuIF90aGlzLl9vbk1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUuZGlzY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB0aGlzLl9yZWNvbm5lY3Rpb24gPSBudWxsO1xuXG4gICAgICAgIGlmICghdGhpcy5fd3MpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl93cy5yZWFkeVN0YXRlID09PSBDbGllbnQuV2ViU29ja2V0Lk9QRU4gfHwgdGhpcy5fd3MucmVhZHlTdGF0ZSA9PT0gQ2xpZW50LldlYlNvY2tldC5DT05ORUNUSU5HKSB7XG5cbiAgICAgICAgICAgIHRoaXMuX3dzLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5fY2xlYW51cCA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB2YXIgd3MgPSB0aGlzLl93cztcbiAgICAgICAgaWYgKCF3cykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fd3MgPSBudWxsO1xuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgd3Mub25vcGVuID0gbnVsbDtcbiAgICAgICAgd3Mub25jbG9zZSA9IG51bGw7XG4gICAgICAgIHdzLm9uZXJyb3IgPSBpZ25vcmU7XG4gICAgICAgIHdzLm9ubWVzc2FnZSA9IG51bGw7XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2hlYXJ0YmVhdCk7XG5cbiAgICAgICAgLy8gRmx1c2ggcGVuZGluZyByZXF1ZXN0c1xuXG4gICAgICAgIHZhciBlcnJvciA9IG5ldyBOZXNFcnJvcignUmVxdWVzdCBmYWlsZWQgLSBzZXJ2ZXIgZGlzY29ubmVjdGVkJywgJ2Rpc2Nvbm5lY3QnKTtcblxuICAgICAgICB2YXIgaWRzID0gT2JqZWN0LmtleXModGhpcy5fcmVxdWVzdHMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGlkcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdmFyIGlkID0gaWRzW2ldO1xuICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSB0aGlzLl9yZXF1ZXN0c1tpZF07XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSByZXF1ZXN0LmNhbGxiYWNrO1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHJlcXVlc3QudGltZW91dCk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fcmVxdWVzdHNbaWRdO1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyb3IpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIENsaWVudC5wcm90b3R5cGUuX3JlY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgICAgLy8gUmVjb25uZWN0XG5cbiAgICAgICAgaWYgKHRoaXMuX3JlY29ubmVjdGlvbikge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3JlY29ubmVjdGlvbi5yZXRyaWVzIDwgMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdCgpOyAvLyBDbGVhciBfcmVjb25uZWN0aW9uIHN0YXRlXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAtLXRoaXMuX3JlY29ubmVjdGlvbi5yZXRyaWVzO1xuICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uLndhaXQgPSB0aGlzLl9yZWNvbm5lY3Rpb24ud2FpdCArIHRoaXMuX3JlY29ubmVjdGlvbi5kZWxheTtcblxuICAgICAgICAgICAgdmFyIHRpbWVvdXQgPSBNYXRoLm1pbih0aGlzLl9yZWNvbm5lY3Rpb24ud2FpdCwgdGhpcy5fcmVjb25uZWN0aW9uLm1heERlbGF5KTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAgICAgaWYgKCFfdGhpczIuX3JlY29ubmVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgX3RoaXMyLl9jb25uZWN0KF90aGlzMi5fcmVjb25uZWN0aW9uLnNldHRpbmdzLCBmYWxzZSwgZnVuY3Rpb24gKGVycikge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzMi5vbkVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpczIuX2NsZWFudXAoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfdGhpczIuX3JlY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLnJlcXVlc3QgPSBmdW5jdGlvbiAob3B0aW9ucywgY2FsbGJhY2spIHtcblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBvcHRpb25zID0ge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgcGF0aDogb3B0aW9uc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgdHlwZTogJ3JlcXVlc3QnLFxuICAgICAgICAgICAgbWV0aG9kOiBvcHRpb25zLm1ldGhvZCB8fCAnR0VUJyxcbiAgICAgICAgICAgIHBhdGg6IG9wdGlvbnMucGF0aCxcbiAgICAgICAgICAgIGhlYWRlcnM6IG9wdGlvbnMuaGVhZGVycyxcbiAgICAgICAgICAgIHBheWxvYWQ6IG9wdGlvbnMucGF5bG9hZFxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9zZW5kKHJlcXVlc3QsIHRydWUsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5tZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UsIGNhbGxiYWNrKSB7XG5cbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XG4gICAgICAgICAgICB0eXBlOiAnbWVzc2FnZScsXG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbmQocmVxdWVzdCwgdHJ1ZSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLl9zZW5kID0gZnVuY3Rpb24gKHJlcXVlc3QsIHRyYWNrLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGlnbm9yZTtcblxuICAgICAgICBpZiAoIXRoaXMuX3dzIHx8IHRoaXMuX3dzLnJlYWR5U3RhdGUgIT09IENsaWVudC5XZWJTb2NrZXQuT1BFTikge1xuXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IE5lc0Vycm9yKCdGYWlsZWQgdG8gc2VuZCBtZXNzYWdlIC0gc2VydmVyIGRpc2Nvbm5lY3RlZCcsICdkaXNjb25uZWN0JykpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVxdWVzdC5pZCA9ICsrdGhpcy5faWRzO1xuXG4gICAgICAgIHN0cmluZ2lmeShyZXF1ZXN0LCBmdW5jdGlvbiAoZXJyLCBlbmNvZGVkKSB7XG5cbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSWdub3JlIGVycm9yc1xuXG4gICAgICAgICAgICBpZiAoIXRyYWNrKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzMy5fd3Muc2VuZChlbmNvZGVkKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBOZXNFcnJvcihlcnIsICd3cycpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRyYWNrIGVycm9yc1xuXG4gICAgICAgICAgICB2YXIgcmVjb3JkID0ge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBjYWxsYmFjayxcbiAgICAgICAgICAgICAgICB0aW1lb3V0OiBudWxsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoX3RoaXMzLl9zZXR0aW5ncy50aW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgcmVjb3JkLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgICAgICAgICByZWNvcmQuY2FsbGJhY2sgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICByZWNvcmQudGltZW91dCA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBOZXNFcnJvcignUmVxdWVzdCB0aW1lZCBvdXQnLCAndGltZW91dCcpKTtcbiAgICAgICAgICAgICAgICB9LCBfdGhpczMuX3NldHRpbmdzLnRpbWVvdXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBfdGhpczMuX3JlcXVlc3RzW3JlcXVlc3QuaWRdID0gcmVjb3JkO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIF90aGlzMy5fd3Muc2VuZChlbmNvZGVkKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpczMuX3JlcXVlc3RzW3JlcXVlc3QuaWRdLnRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBfdGhpczMuX3JlcXVlc3RzW3JlcXVlc3QuaWRdO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgTmVzRXJyb3IoZXJyLCAnd3MnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLl9oZWxsbyA9IGZ1bmN0aW9uIChhdXRoLCBjYWxsYmFjaykge1xuXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgdHlwZTogJ2hlbGxvJyxcbiAgICAgICAgICAgIHZlcnNpb246IHZlcnNpb25cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoYXV0aCkge1xuICAgICAgICAgICAgcmVxdWVzdC5hdXRoID0gYXV0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdWJzID0gdGhpcy5zdWJzY3JpcHRpb25zKCk7XG4gICAgICAgIGlmIChzdWJzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmVxdWVzdC5zdWJzID0gc3VicztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl9zZW5kKHJlcXVlc3QsIHRydWUsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5zdWJzY3JpcHRpb25zID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLl9zdWJzY3JpcHRpb25zKTtcbiAgICB9O1xuXG4gICAgQ2xpZW50LnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbiAocGF0aCwgaGFuZGxlciwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIF90aGlzNCA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCFwYXRoIHx8IHBhdGhbMF0gIT09ICcvJykge1xuXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IE5lc0Vycm9yKCdJbnZhbGlkIHBhdGgnLCAndXNlcicpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdWJzID0gdGhpcy5fc3Vic2NyaXB0aW9uc1twYXRoXTtcbiAgICAgICAgaWYgKHN1YnMpIHtcblxuICAgICAgICAgICAgLy8gQWxyZWFkeSBzdWJzY3JpYmVkXG5cbiAgICAgICAgICAgIGlmIChzdWJzLmluZGV4T2YoaGFuZGxlcikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgc3Vicy5wdXNoKGhhbmRsZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnNbcGF0aF0gPSBbaGFuZGxlcl07XG5cbiAgICAgICAgaWYgKCF0aGlzLl93cyB8fCB0aGlzLl93cy5yZWFkeVN0YXRlICE9PSBDbGllbnQuV2ViU29ja2V0Lk9QRU4pIHtcblxuICAgICAgICAgICAgLy8gUXVldWVkIHN1YnNjcmlwdGlvblxuXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgdHlwZTogJ3N1YicsXG4gICAgICAgICAgICBwYXRoOiBwYXRoXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbmQocmVxdWVzdCwgdHJ1ZSwgZnVuY3Rpb24gKGVycikge1xuXG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIF90aGlzNC5fc3Vic2NyaXB0aW9uc1twYXRoXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24gKHBhdGgsIGhhbmRsZXIpIHtcblxuICAgICAgICBpZiAoIXBhdGggfHwgcGF0aFswXSAhPT0gJy8nKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBoYW5kbGVyKG5ldyBOZXNFcnJvcignSW52YWxpZCBwYXRoJywgJ3VzZXInKSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3VicyA9IHRoaXMuX3N1YnNjcmlwdGlvbnNbcGF0aF07XG4gICAgICAgIGlmICghc3Vicykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN5bmMgPSBmYWxzZTtcbiAgICAgICAgaWYgKCFoYW5kbGVyKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fc3Vic2NyaXB0aW9uc1twYXRoXTtcbiAgICAgICAgICAgIHN5bmMgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHBvcyA9IHN1YnMuaW5kZXhPZihoYW5kbGVyKTtcbiAgICAgICAgICAgIGlmIChwb3MgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdWJzLnNwbGljZShwb3MsIDEpO1xuICAgICAgICAgICAgaWYgKCFzdWJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9zdWJzY3JpcHRpb25zW3BhdGhdO1xuICAgICAgICAgICAgICAgIHN5bmMgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzeW5jIHx8ICF0aGlzLl93cyB8fCB0aGlzLl93cy5yZWFkeVN0YXRlICE9PSBDbGllbnQuV2ViU29ja2V0Lk9QRU4pIHtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XG4gICAgICAgICAgICB0eXBlOiAndW5zdWInLFxuICAgICAgICAgICAgcGF0aDogcGF0aFxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9zZW5kKHJlcXVlc3QsIGZhbHNlKTsgLy8gSWdub3JpbmcgZXJyb3JzIGFzIHRoZSBzdWJzY3JpcHRpb24gaGFuZGxlcnMgYXJlIGFscmVhZHkgcmVtb3ZlZFxuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLl9vbk1lc3NhZ2UgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICB2YXIgX3RoaXM1ID0gdGhpcztcblxuICAgICAgICB0aGlzLl9iZWF0KCk7XG5cbiAgICAgICAgcGFyc2UobWVzc2FnZS5kYXRhLCBmdW5jdGlvbiAoZXJyLCB1cGRhdGUpIHtcblxuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdGhpczUub25FcnJvcihlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBSZWNyZWF0ZSBlcnJvclxuXG4gICAgICAgICAgICB2YXIgZXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgaWYgKHVwZGF0ZS5zdGF0dXNDb2RlICYmIHVwZGF0ZS5zdGF0dXNDb2RlID49IDQwMCAmJiB1cGRhdGUuc3RhdHVzQ29kZSA8PSA1OTkpIHtcblxuICAgICAgICAgICAgICAgIGVycm9yID0gbmV3IE5lc0Vycm9yKHVwZGF0ZS5wYXlsb2FkLm1lc3NhZ2UgfHwgdXBkYXRlLnBheWxvYWQuZXJyb3IsICdzZXJ2ZXInKTtcbiAgICAgICAgICAgICAgICBlcnJvci5zdGF0dXNDb2RlID0gdXBkYXRlLnN0YXR1c0NvZGU7XG4gICAgICAgICAgICAgICAgZXJyb3IuZGF0YSA9IHVwZGF0ZS5wYXlsb2FkO1xuICAgICAgICAgICAgICAgIGVycm9yLmhlYWRlcnMgPSB1cGRhdGUuaGVhZGVycztcbiAgICAgICAgICAgICAgICBlcnJvci5wYXRoID0gdXBkYXRlLnBhdGg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFBpbmdcblxuICAgICAgICAgICAgaWYgKHVwZGF0ZS50eXBlID09PSAncGluZycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXM1Ll9zZW5kKHsgdHlwZTogJ3BpbmcnIH0sIGZhbHNlKTsgLy8gSWdub3JlIGVycm9yc1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBCcm9hZGNhc3QgYW5kIHVwZGF0ZVxuXG4gICAgICAgICAgICBpZiAodXBkYXRlLnR5cGUgPT09ICd1cGRhdGUnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzNS5vblVwZGF0ZSh1cGRhdGUubWVzc2FnZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFB1Ymxpc2hcblxuICAgICAgICAgICAgaWYgKHVwZGF0ZS50eXBlID09PSAncHViJykge1xuICAgICAgICAgICAgICAgIHZhciBoYW5kbGVycyA9IF90aGlzNS5fc3Vic2NyaXB0aW9uc1t1cGRhdGUucGF0aF07XG4gICAgICAgICAgICAgICAgaWYgKGhhbmRsZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGFuZGxlcnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXJzW2ldKHVwZGF0ZS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTG9va3VwIGNhbGxiYWNrIChtZXNzYWdlIG11c3QgaW5jbHVkZSBhbiBpZCBmcm9tIHRoaXMgcG9pbnQpXG5cbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0gX3RoaXM1Ll9yZXF1ZXN0c1t1cGRhdGUuaWRdO1xuICAgICAgICAgICAgaWYgKCFyZXF1ZXN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzNS5vbkVycm9yKG5ldyBOZXNFcnJvcignUmVjZWl2ZWQgcmVzcG9uc2UgZm9yIHVua25vd24gcmVxdWVzdCcsICdwcm90b2NvbCcpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gcmVxdWVzdC5jYWxsYmFjaztcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChyZXF1ZXN0LnRpbWVvdXQpO1xuICAgICAgICAgICAgZGVsZXRlIF90aGlzNS5fcmVxdWVzdHNbdXBkYXRlLmlkXTtcblxuICAgICAgICAgICAgaWYgKCFjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHJldHVybjsgLy8gUmVzcG9uc2UgcmVjZWl2ZWQgYWZ0ZXIgdGltZW91dFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBSZXNwb25zZVxuXG4gICAgICAgICAgICBpZiAodXBkYXRlLnR5cGUgPT09ICdyZXF1ZXN0Jykge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvciwgdXBkYXRlLnBheWxvYWQsIHVwZGF0ZS5zdGF0dXNDb2RlLCB1cGRhdGUuaGVhZGVycyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEN1c3RvbSBtZXNzYWdlXG5cbiAgICAgICAgICAgIGlmICh1cGRhdGUudHlwZSA9PT0gJ21lc3NhZ2UnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yLCB1cGRhdGUubWVzc2FnZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEF1dGhlbnRpY2F0aW9uXG5cbiAgICAgICAgICAgIGlmICh1cGRhdGUudHlwZSA9PT0gJ2hlbGxvJykge1xuICAgICAgICAgICAgICAgIF90aGlzNS5pZCA9IHVwZGF0ZS5zb2NrZXQ7XG4gICAgICAgICAgICAgICAgaWYgKHVwZGF0ZS5oZWFydGJlYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXM1Ll9oZWFydGJlYXRUaW1lb3V0ID0gdXBkYXRlLmhlYXJ0YmVhdC5pbnRlcnZhbCArIHVwZGF0ZS5oZWFydGJlYXQudGltZW91dDtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXM1Ll9iZWF0KCk7IC8vIENhbGwgYWdhaW4gb25jZSB0aW1lb3V0IGlzIHNldFxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFN1YnNjcmlwdGlvbnNcblxuICAgICAgICAgICAgaWYgKHVwZGF0ZS50eXBlID09PSAnc3ViJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBfdGhpczUub25FcnJvcihuZXcgTmVzRXJyb3IoJ1JlY2VpdmVkIHVua25vd24gcmVzcG9uc2UgdHlwZTogJyArIHVwZGF0ZS50eXBlLCAncHJvdG9jb2wnKSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBDbGllbnQucHJvdG90eXBlLl9iZWF0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXM2ID0gdGhpcztcblxuICAgICAgICBpZiAoIXRoaXMuX2hlYXJ0YmVhdFRpbWVvdXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9oZWFydGJlYXQpO1xuXG4gICAgICAgIHRoaXMuX2hlYXJ0YmVhdCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICBfdGhpczYub25FcnJvcihuZXcgTmVzRXJyb3IoJ0Rpc2Nvbm5lY3RpbmcgZHVlIHRvIGhlYXJ0YmVhdCB0aW1lb3V0JywgJ3RpbWVvdXQnKSk7XG4gICAgICAgICAgICBfdGhpczYuX3dzLmNsb3NlKCk7XG4gICAgICAgIH0sIHRoaXMuX2hlYXJ0YmVhdFRpbWVvdXQpO1xuICAgIH07XG5cbiAgICAvLyBFeHBvc2UgaW50ZXJmYWNlXG5cbiAgICByZXR1cm4geyBDbGllbnQ6IENsaWVudCB9O1xufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llc1xuICovXG52YXIgZGVjb3VwbGUgPSByZXF1aXJlKCdkZWNvdXBsZScpO1xudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCdlbWl0dGVyJyk7XG5cbi8qKlxuICogUHJpdmF0ZXNcbiAqL1xudmFyIHNjcm9sbFRpbWVvdXQ7XG52YXIgc2Nyb2xsaW5nID0gZmFsc2U7XG52YXIgZG9jID0gd2luZG93LmRvY3VtZW50O1xudmFyIGh0bWwgPSBkb2MuZG9jdW1lbnRFbGVtZW50O1xudmFyIG1zUG9pbnRlclN1cHBvcnRlZCA9IHdpbmRvdy5uYXZpZ2F0b3IubXNQb2ludGVyRW5hYmxlZDtcbnZhciB0b3VjaCA9IHtcbiAgJ3N0YXJ0JzogbXNQb2ludGVyU3VwcG9ydGVkID8gJ01TUG9pbnRlckRvd24nIDogJ3RvdWNoc3RhcnQnLFxuICAnbW92ZSc6IG1zUG9pbnRlclN1cHBvcnRlZCA/ICdNU1BvaW50ZXJNb3ZlJyA6ICd0b3VjaG1vdmUnLFxuICAnZW5kJzogbXNQb2ludGVyU3VwcG9ydGVkID8gJ01TUG9pbnRlclVwJyA6ICd0b3VjaGVuZCdcbn07XG52YXIgcHJlZml4ID0gKGZ1bmN0aW9uIHByZWZpeCgpIHtcbiAgdmFyIHJlZ2V4ID0gL14oV2Via2l0fEtodG1sfE1venxtc3xPKSg/PVtBLVpdKS87XG4gIHZhciBzdHlsZURlY2xhcmF0aW9uID0gZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKVswXS5zdHlsZTtcbiAgZm9yICh2YXIgcHJvcCBpbiBzdHlsZURlY2xhcmF0aW9uKSB7XG4gICAgaWYgKHJlZ2V4LnRlc3QocHJvcCkpIHtcbiAgICAgIHJldHVybiAnLScgKyBwcm9wLm1hdGNoKHJlZ2V4KVswXS50b0xvd2VyQ2FzZSgpICsgJy0nO1xuICAgIH1cbiAgfVxuICAvLyBOb3RoaW5nIGZvdW5kIHNvIGZhcj8gV2Via2l0IGRvZXMgbm90IGVudW1lcmF0ZSBvdmVyIHRoZSBDU1MgcHJvcGVydGllcyBvZiB0aGUgc3R5bGUgb2JqZWN0LlxuICAvLyBIb3dldmVyIChwcm9wIGluIHN0eWxlKSByZXR1cm5zIHRoZSBjb3JyZWN0IHZhbHVlLCBzbyB3ZSdsbCBoYXZlIHRvIHRlc3QgZm9yXG4gIC8vIHRoZSBwcmVjZW5jZSBvZiBhIHNwZWNpZmljIHByb3BlcnR5XG4gIGlmICgnV2Via2l0T3BhY2l0eScgaW4gc3R5bGVEZWNsYXJhdGlvbikgeyByZXR1cm4gJy13ZWJraXQtJzsgfVxuICBpZiAoJ0todG1sT3BhY2l0eScgaW4gc3R5bGVEZWNsYXJhdGlvbikgeyByZXR1cm4gJy1raHRtbC0nOyB9XG4gIHJldHVybiAnJztcbn0oKSk7XG5mdW5jdGlvbiBleHRlbmQoZGVzdGluYXRpb24sIGZyb20pIHtcbiAgZm9yICh2YXIgcHJvcCBpbiBmcm9tKSB7XG4gICAgaWYgKGZyb21bcHJvcF0pIHtcbiAgICAgIGRlc3RpbmF0aW9uW3Byb3BdID0gZnJvbVtwcm9wXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlc3RpbmF0aW9uO1xufVxuZnVuY3Rpb24gaW5oZXJpdHMoY2hpbGQsIHViZXIpIHtcbiAgY2hpbGQucHJvdG90eXBlID0gZXh0ZW5kKGNoaWxkLnByb3RvdHlwZSB8fCB7fSwgdWJlci5wcm90b3R5cGUpO1xufVxuXG4vKipcbiAqIFNsaWRlb3V0IGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFNsaWRlb3V0KG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgLy8gU2V0cyBkZWZhdWx0IHZhbHVlc1xuICB0aGlzLl9zdGFydE9mZnNldFggPSAwO1xuICB0aGlzLl9jdXJyZW50T2Zmc2V0WCA9IDA7XG4gIHRoaXMuX29wZW5pbmcgPSBmYWxzZTtcbiAgdGhpcy5fbW92ZWQgPSBmYWxzZTtcbiAgdGhpcy5fb3BlbmVkID0gZmFsc2U7XG4gIHRoaXMuX3ByZXZlbnRPcGVuID0gZmFsc2U7XG4gIHRoaXMuX3RvdWNoID0gb3B0aW9ucy50b3VjaCA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IG9wdGlvbnMudG91Y2ggJiYgdHJ1ZTtcblxuICAvLyBTZXRzIHBhbmVsXG4gIHRoaXMucGFuZWwgPSBvcHRpb25zLnBhbmVsO1xuICB0aGlzLm1lbnUgPSBvcHRpb25zLm1lbnU7XG5cbiAgLy8gU2V0cyAgY2xhc3NuYW1lc1xuICBpZih0aGlzLnBhbmVsLmNsYXNzTmFtZS5zZWFyY2goJ3NsaWRlb3V0LXBhbmVsJykgPT09IC0xKSB7IHRoaXMucGFuZWwuY2xhc3NOYW1lICs9ICcgc2xpZGVvdXQtcGFuZWwnOyB9XG4gIGlmKHRoaXMubWVudS5jbGFzc05hbWUuc2VhcmNoKCdzbGlkZW91dC1tZW51JykgPT09IC0xKSB7IHRoaXMubWVudS5jbGFzc05hbWUgKz0gJyBzbGlkZW91dC1tZW51JzsgfVxuXG5cbiAgLy8gU2V0cyBvcHRpb25zXG4gIHRoaXMuX2Z4ID0gb3B0aW9ucy5meCB8fCAnZWFzZSc7XG4gIHRoaXMuX2R1cmF0aW9uID0gcGFyc2VJbnQob3B0aW9ucy5kdXJhdGlvbiwgMTApIHx8IDMwMDtcbiAgdGhpcy5fdG9sZXJhbmNlID0gcGFyc2VJbnQob3B0aW9ucy50b2xlcmFuY2UsIDEwKSB8fCA3MDtcbiAgdGhpcy5fcGFkZGluZyA9IHRoaXMuX3RyYW5zbGF0ZVRvID0gcGFyc2VJbnQob3B0aW9ucy5wYWRkaW5nLCAxMCkgfHwgMjU2O1xuICB0aGlzLl9vcmllbnRhdGlvbiA9IG9wdGlvbnMuc2lkZSA9PT0gJ3JpZ2h0JyA/IC0xIDogMTtcbiAgdGhpcy5fdHJhbnNsYXRlVG8gKj0gdGhpcy5fb3JpZW50YXRpb247XG5cbiAgLy8gSW5pdCB0b3VjaCBldmVudHNcbiAgaWYgKHRoaXMuX3RvdWNoKSB7XG4gICAgdGhpcy5faW5pdFRvdWNoRXZlbnRzKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbmhlcml0cyBmcm9tIEVtaXR0ZXJcbiAqL1xuaW5oZXJpdHMoU2xpZGVvdXQsIEVtaXR0ZXIpO1xuXG4vKipcbiAqIE9wZW5zIHRoZSBzbGlkZW91dCBtZW51LlxuICovXG5TbGlkZW91dC5wcm90b3R5cGUub3BlbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMuZW1pdCgnYmVmb3Jlb3BlbicpO1xuICBpZiAoaHRtbC5jbGFzc05hbWUuc2VhcmNoKCdzbGlkZW91dC1vcGVuJykgPT09IC0xKSB7IGh0bWwuY2xhc3NOYW1lICs9ICcgc2xpZGVvdXQtb3Blbic7IH1cbiAgdGhpcy5fc2V0VHJhbnNpdGlvbigpO1xuICB0aGlzLl90cmFuc2xhdGVYVG8odGhpcy5fdHJhbnNsYXRlVG8pO1xuICB0aGlzLl9vcGVuZWQgPSB0cnVlO1xuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIHNlbGYucGFuZWwuc3R5bGUudHJhbnNpdGlvbiA9IHNlbGYucGFuZWwuc3R5bGVbJy13ZWJraXQtdHJhbnNpdGlvbiddID0gJyc7XG4gICAgc2VsZi5lbWl0KCdvcGVuJyk7XG4gIH0sIHRoaXMuX2R1cmF0aW9uICsgNTApO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ2xvc2VzIHNsaWRlb3V0IG1lbnUuXG4gKi9cblNsaWRlb3V0LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGlmICghdGhpcy5pc09wZW4oKSAmJiAhdGhpcy5fb3BlbmluZykge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIHRoaXMuZW1pdCgnYmVmb3JlY2xvc2UnKTtcbiAgdGhpcy5fc2V0VHJhbnNpdGlvbigpO1xuICB0aGlzLl90cmFuc2xhdGVYVG8oMCk7XG4gIHRoaXMuX29wZW5lZCA9IGZhbHNlO1xuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIGh0bWwuY2xhc3NOYW1lID0gaHRtbC5jbGFzc05hbWUucmVwbGFjZSgvIHNsaWRlb3V0LW9wZW4vLCAnJyk7XG4gICAgc2VsZi5wYW5lbC5zdHlsZS50cmFuc2l0aW9uID0gc2VsZi5wYW5lbC5zdHlsZVsnLXdlYmtpdC10cmFuc2l0aW9uJ10gPSBzZWxmLnBhbmVsLnN0eWxlW3ByZWZpeCArICd0cmFuc2Zvcm0nXSA9IHNlbGYucGFuZWwuc3R5bGUudHJhbnNmb3JtID0gJyc7XG4gICAgc2VsZi5lbWl0KCdjbG9zZScpO1xuICB9LCB0aGlzLl9kdXJhdGlvbiArIDUwKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFRvZ2dsZXMgKG9wZW4vY2xvc2UpIHNsaWRlb3V0IG1lbnUuXG4gKi9cblNsaWRlb3V0LnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuaXNPcGVuKCkgPyB0aGlzLmNsb3NlKCkgOiB0aGlzLm9wZW4oKTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBzbGlkZW91dCBpcyBjdXJyZW50bHkgb3BlbiwgYW5kIGZhbHNlIGlmIGl0IGlzIGNsb3NlZC5cbiAqL1xuU2xpZGVvdXQucHJvdG90eXBlLmlzT3BlbiA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5fb3BlbmVkO1xufTtcblxuLyoqXG4gKiBUcmFuc2xhdGVzIHBhbmVsIGFuZCB1cGRhdGVzIGN1cnJlbnRPZmZzZXQgd2l0aCBhIGdpdmVuIFggcG9pbnRcbiAqL1xuU2xpZGVvdXQucHJvdG90eXBlLl90cmFuc2xhdGVYVG8gPSBmdW5jdGlvbih0cmFuc2xhdGVYKSB7XG4gIHRoaXMuX2N1cnJlbnRPZmZzZXRYID0gdHJhbnNsYXRlWDtcbiAgdGhpcy5wYW5lbC5zdHlsZVtwcmVmaXggKyAndHJhbnNmb3JtJ10gPSB0aGlzLnBhbmVsLnN0eWxlLnRyYW5zZm9ybSA9ICd0cmFuc2xhdGVYKCcgKyB0cmFuc2xhdGVYICsgJ3B4KSc7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXQgdHJhbnNpdGlvbiBwcm9wZXJ0aWVzXG4gKi9cblNsaWRlb3V0LnByb3RvdHlwZS5fc2V0VHJhbnNpdGlvbiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnBhbmVsLnN0eWxlW3ByZWZpeCArICd0cmFuc2l0aW9uJ10gPSB0aGlzLnBhbmVsLnN0eWxlLnRyYW5zaXRpb24gPSBwcmVmaXggKyAndHJhbnNmb3JtICcgKyB0aGlzLl9kdXJhdGlvbiArICdtcyAnICsgdGhpcy5fZng7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBJbml0aWFsaXplcyB0b3VjaCBldmVudFxuICovXG5TbGlkZW91dC5wcm90b3R5cGUuX2luaXRUb3VjaEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgLyoqXG4gICAqIERlY291cGxlIHNjcm9sbCBldmVudFxuICAgKi9cbiAgdGhpcy5fb25TY3JvbGxGbiA9IGRlY291cGxlKGRvYywgJ3Njcm9sbCcsIGZ1bmN0aW9uKCkge1xuICAgIGlmICghc2VsZi5fbW92ZWQpIHtcbiAgICAgIGNsZWFyVGltZW91dChzY3JvbGxUaW1lb3V0KTtcbiAgICAgIHNjcm9sbGluZyA9IHRydWU7XG4gICAgICBzY3JvbGxUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgc2Nyb2xsaW5nID0gZmFsc2U7XG4gICAgICB9LCAyNTApO1xuICAgIH1cbiAgfSk7XG5cbiAgLyoqXG4gICAqIFByZXZlbnRzIHRvdWNobW92ZSBldmVudCBpZiBzbGlkZW91dCBpcyBtb3ZpbmdcbiAgICovXG4gIHRoaXMuX3ByZXZlbnRNb3ZlID0gZnVuY3Rpb24oZXZlKSB7XG4gICAgaWYgKHNlbGYuX21vdmVkKSB7XG4gICAgICBldmUucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG4gIH07XG5cbiAgZG9jLmFkZEV2ZW50TGlzdGVuZXIodG91Y2gubW92ZSwgdGhpcy5fcHJldmVudE1vdmUpO1xuXG4gIC8qKlxuICAgKiBSZXNldHMgdmFsdWVzIG9uIHRvdWNoc3RhcnRcbiAgICovXG4gIHRoaXMuX3Jlc2V0VG91Y2hGbiA9IGZ1bmN0aW9uKGV2ZSkge1xuICAgIGlmICh0eXBlb2YgZXZlLnRvdWNoZXMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2VsZi5fbW92ZWQgPSBmYWxzZTtcbiAgICBzZWxmLl9vcGVuaW5nID0gZmFsc2U7XG4gICAgc2VsZi5fc3RhcnRPZmZzZXRYID0gZXZlLnRvdWNoZXNbMF0ucGFnZVg7XG4gICAgc2VsZi5fcHJldmVudE9wZW4gPSAoIXNlbGYuX3RvdWNoIHx8ICghc2VsZi5pc09wZW4oKSAmJiBzZWxmLm1lbnUuY2xpZW50V2lkdGggIT09IDApKTtcbiAgfTtcblxuICB0aGlzLnBhbmVsLmFkZEV2ZW50TGlzdGVuZXIodG91Y2guc3RhcnQsIHRoaXMuX3Jlc2V0VG91Y2hGbik7XG5cbiAgLyoqXG4gICAqIFJlc2V0cyB2YWx1ZXMgb24gdG91Y2hjYW5jZWxcbiAgICovXG4gIHRoaXMuX29uVG91Y2hDYW5jZWxGbiA9IGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuX21vdmVkID0gZmFsc2U7XG4gICAgc2VsZi5fb3BlbmluZyA9IGZhbHNlO1xuICB9O1xuXG4gIHRoaXMucGFuZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0aGlzLl9vblRvdWNoQ2FuY2VsRm4pO1xuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHNsaWRlb3V0IG9uIHRvdWNoZW5kXG4gICAqL1xuICB0aGlzLl9vblRvdWNoRW5kRm4gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoc2VsZi5fbW92ZWQpIHtcbiAgICAgIHNlbGYuZW1pdCgndHJhbnNsYXRlZW5kJyk7XG4gICAgICAoc2VsZi5fb3BlbmluZyAmJiBNYXRoLmFicyhzZWxmLl9jdXJyZW50T2Zmc2V0WCkgPiBzZWxmLl90b2xlcmFuY2UpID8gc2VsZi5vcGVuKCkgOiBzZWxmLmNsb3NlKCk7XG4gICAgfVxuICAgIHNlbGYuX21vdmVkID0gZmFsc2U7XG4gIH07XG5cbiAgdGhpcy5wYW5lbC5hZGRFdmVudExpc3RlbmVyKHRvdWNoLmVuZCwgdGhpcy5fb25Ub3VjaEVuZEZuKTtcblxuICAvKipcbiAgICogVHJhbnNsYXRlcyBwYW5lbCBvbiB0b3VjaG1vdmVcbiAgICovXG4gIHRoaXMuX29uVG91Y2hNb3ZlRm4gPSBmdW5jdGlvbihldmUpIHtcblxuICAgIGlmIChzY3JvbGxpbmcgfHwgc2VsZi5fcHJldmVudE9wZW4gfHwgdHlwZW9mIGV2ZS50b3VjaGVzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBkaWZfeCA9IGV2ZS50b3VjaGVzWzBdLmNsaWVudFggLSBzZWxmLl9zdGFydE9mZnNldFg7XG4gICAgdmFyIHRyYW5zbGF0ZVggPSBzZWxmLl9jdXJyZW50T2Zmc2V0WCA9IGRpZl94O1xuXG4gICAgaWYgKE1hdGguYWJzKHRyYW5zbGF0ZVgpID4gc2VsZi5fcGFkZGluZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChNYXRoLmFicyhkaWZfeCkgPiAyMCkge1xuXG4gICAgICBzZWxmLl9vcGVuaW5nID0gdHJ1ZTtcblxuICAgICAgdmFyIG9yaWVudGVkX2RpZl94ID0gZGlmX3ggKiBzZWxmLl9vcmllbnRhdGlvbjtcblxuICAgICAgaWYgKHNlbGYuX29wZW5lZCAmJiBvcmllbnRlZF9kaWZfeCA+IDAgfHwgIXNlbGYuX29wZW5lZCAmJiBvcmllbnRlZF9kaWZfeCA8IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXNlbGYuX21vdmVkKSB7XG4gICAgICAgIHNlbGYuZW1pdCgndHJhbnNsYXRlc3RhcnQnKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9yaWVudGVkX2RpZl94IDw9IDApIHtcbiAgICAgICAgdHJhbnNsYXRlWCA9IGRpZl94ICsgc2VsZi5fcGFkZGluZyAqIHNlbGYuX29yaWVudGF0aW9uO1xuICAgICAgICBzZWxmLl9vcGVuaW5nID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICghc2VsZi5fbW92ZWQgJiYgaHRtbC5jbGFzc05hbWUuc2VhcmNoKCdzbGlkZW91dC1vcGVuJykgPT09IC0xKSB7XG4gICAgICAgIGh0bWwuY2xhc3NOYW1lICs9ICcgc2xpZGVvdXQtb3Blbic7XG4gICAgICB9XG5cbiAgICAgIHNlbGYucGFuZWwuc3R5bGVbcHJlZml4ICsgJ3RyYW5zZm9ybSddID0gc2VsZi5wYW5lbC5zdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlWCgnICsgdHJhbnNsYXRlWCArICdweCknO1xuICAgICAgc2VsZi5lbWl0KCd0cmFuc2xhdGUnLCB0cmFuc2xhdGVYKTtcbiAgICAgIHNlbGYuX21vdmVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgfTtcblxuICB0aGlzLnBhbmVsLmFkZEV2ZW50TGlzdGVuZXIodG91Y2gubW92ZSwgdGhpcy5fb25Ub3VjaE1vdmVGbik7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEVuYWJsZSBvcGVuaW5nIHRoZSBzbGlkZW91dCB2aWEgdG91Y2ggZXZlbnRzLlxuICovXG5TbGlkZW91dC5wcm90b3R5cGUuZW5hYmxlVG91Y2ggPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fdG91Y2ggPSB0cnVlO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRGlzYWJsZSBvcGVuaW5nIHRoZSBzbGlkZW91dCB2aWEgdG91Y2ggZXZlbnRzLlxuICovXG5TbGlkZW91dC5wcm90b3R5cGUuZGlzYWJsZVRvdWNoID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX3RvdWNoID0gZmFsc2U7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBEZXN0cm95IGFuIGluc3RhbmNlIG9mIHNsaWRlb3V0LlxuICovXG5TbGlkZW91dC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAvLyBDbG9zZSBiZWZvcmUgY2xlYW5cbiAgdGhpcy5jbG9zZSgpO1xuXG4gIC8vIFJlbW92ZSBldmVudCBsaXN0ZW5lcnNcbiAgZG9jLnJlbW92ZUV2ZW50TGlzdGVuZXIodG91Y2gubW92ZSwgdGhpcy5fcHJldmVudE1vdmUpO1xuICB0aGlzLnBhbmVsLnJlbW92ZUV2ZW50TGlzdGVuZXIodG91Y2guc3RhcnQsIHRoaXMuX3Jlc2V0VG91Y2hGbik7XG4gIHRoaXMucGFuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0aGlzLl9vblRvdWNoQ2FuY2VsRm4pO1xuICB0aGlzLnBhbmVsLnJlbW92ZUV2ZW50TGlzdGVuZXIodG91Y2guZW5kLCB0aGlzLl9vblRvdWNoRW5kRm4pO1xuICB0aGlzLnBhbmVsLnJlbW92ZUV2ZW50TGlzdGVuZXIodG91Y2gubW92ZSwgdGhpcy5fb25Ub3VjaE1vdmVGbik7XG4gIGRvYy5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLl9vblNjcm9sbEZuKTtcblxuICAvLyBSZW1vdmUgbWV0aG9kc1xuICB0aGlzLm9wZW4gPSB0aGlzLmNsb3NlID0gZnVuY3Rpb24oKSB7fTtcblxuICAvLyBSZXR1cm4gdGhlIGluc3RhbmNlIHNvIGl0IGNhbiBiZSBlYXNpbHkgZGVyZWZlcmVuY2VkXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBFeHBvc2UgU2xpZGVvdXRcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBTbGlkZW91dDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHJlcXVlc3RBbmltRnJhbWUgPSAoZnVuY3Rpb24oKSB7XG4gIHJldHVybiB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgd2luZG93LnNldFRpbWVvdXQoY2FsbGJhY2ssIDEwMDAgLyA2MCk7XG4gICAgfTtcbn0oKSk7XG5cbmZ1bmN0aW9uIGRlY291cGxlKG5vZGUsIGV2ZW50LCBmbikge1xuICB2YXIgZXZlLFxuICAgICAgdHJhY2tpbmcgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBjYXB0dXJlRXZlbnQoZSkge1xuICAgIGV2ZSA9IGU7XG4gICAgdHJhY2soKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyYWNrKCkge1xuICAgIGlmICghdHJhY2tpbmcpIHtcbiAgICAgIHJlcXVlc3RBbmltRnJhbWUodXBkYXRlKTtcbiAgICAgIHRyYWNraW5nID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGUoKSB7XG4gICAgZm4uY2FsbChub2RlLCBldmUpO1xuICAgIHRyYWNraW5nID0gZmFsc2U7XG4gIH1cblxuICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGNhcHR1cmVFdmVudCwgZmFsc2UpO1xuXG4gIHJldHVybiBjYXB0dXJlRXZlbnQ7XG59XG5cbi8qKlxuICogRXhwb3NlIGRlY291cGxlXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZGVjb3VwbGU7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIF9jbGFzc0NhbGxDaGVjayA9IGZ1bmN0aW9uIChpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9O1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIEVtaXR0ZXIuXG4gKiBAY2xhc3NcbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYSBuZXcgaW5zdGFuY2Ugb2YgRW1pdHRlci5cbiAqIEBleGFtcGxlXG4gKiAvLyBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIEVtaXR0ZXIuXG4gKiB2YXIgRW1pdHRlciA9IHJlcXVpcmUoJ2VtaXR0ZXInKTtcbiAqXG4gKiB2YXIgZW1pdHRlciA9IG5ldyBFbWl0dGVyKCk7XG4gKi9cblxudmFyIEVtaXR0ZXIgPSAoZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBFbWl0dGVyKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBFbWl0dGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgbGlzdGVuZXIgdG8gdGhlIGNvbGxlY3Rpb24gZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG4gICAqIEBtZW1iZXJvZiEgRW1pdHRlci5wcm90b3R5cGVcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCAtIFRoZSBldmVudCBuYW1lLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciAtIEEgbGlzdGVuZXIgZnVuY3Rpb24gdG8gYWRkLlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGFuIGluc3RhbmNlIG9mIEVtaXR0ZXIuXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEFkZCBhbiBldmVudCBsaXN0ZW5lciB0byBcImZvb1wiIGV2ZW50LlxuICAgKiBlbWl0dGVyLm9uKCdmb28nLCBsaXN0ZW5lcik7XG4gICAqL1xuXG4gIEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgLy8gVXNlIHRoZSBjdXJyZW50IGNvbGxlY3Rpb24gb3IgY3JlYXRlIGl0LlxuICAgIHRoaXMuX2V2ZW50Q29sbGVjdGlvbiA9IHRoaXMuX2V2ZW50Q29sbGVjdGlvbiB8fCB7fTtcblxuICAgIC8vIFVzZSB0aGUgY3VycmVudCBjb2xsZWN0aW9uIG9mIGFuIGV2ZW50IG9yIGNyZWF0ZSBpdC5cbiAgICB0aGlzLl9ldmVudENvbGxlY3Rpb25bZXZlbnRdID0gdGhpcy5fZXZlbnRDb2xsZWN0aW9uW2V2ZW50XSB8fCBbXTtcblxuICAgIC8vIEFwcGVuZHMgdGhlIGxpc3RlbmVyIGludG8gdGhlIGNvbGxlY3Rpb24gb2YgdGhlIGdpdmVuIGV2ZW50XG4gICAgdGhpcy5fZXZlbnRDb2xsZWN0aW9uW2V2ZW50XS5wdXNoKGxpc3RlbmVyKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBZGRzIGEgbGlzdGVuZXIgdG8gdGhlIGNvbGxlY3Rpb24gZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQgdGhhdCB3aWxsIGJlIGNhbGxlZCBvbmx5IG9uY2UuXG4gICAqIEBtZW1iZXJvZiEgRW1pdHRlci5wcm90b3R5cGVcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCAtIFRoZSBldmVudCBuYW1lLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciAtIEEgbGlzdGVuZXIgZnVuY3Rpb24gdG8gYWRkLlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGFuIGluc3RhbmNlIG9mIEVtaXR0ZXIuXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIFdpbGwgYWRkIGFuIGV2ZW50IGhhbmRsZXIgdG8gXCJmb29cIiBldmVudCBvbmNlLlxuICAgKiBlbWl0dGVyLm9uY2UoJ2ZvbycsIGxpc3RlbmVyKTtcbiAgICovXG5cbiAgRW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIG9uY2UoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gZm4oKSB7XG4gICAgICBzZWxmLm9mZihldmVudCwgZm4pO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICBmbi5saXN0ZW5lciA9IGxpc3RlbmVyO1xuXG4gICAgdGhpcy5vbihldmVudCwgZm4pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBsaXN0ZW5lciBmcm9tIHRoZSBjb2xsZWN0aW9uIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICAgKiBAbWVtYmVyb2YhIEVtaXR0ZXIucHJvdG90eXBlXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgLSBUaGUgZXZlbnQgbmFtZS5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgLSBBIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIHJlbW92ZS5cbiAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBhbiBpbnN0YW5jZSBvZiBFbWl0dGVyLlxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBSZW1vdmUgYSBnaXZlbiBsaXN0ZW5lci5cbiAgICogZW1pdHRlci5vZmYoJ2ZvbycsIGxpc3RlbmVyKTtcbiAgICovXG5cbiAgRW1pdHRlci5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24gb2ZmKGV2ZW50LCBsaXN0ZW5lcikge1xuXG4gICAgdmFyIGxpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuICAgIC8vIERlZmluZXMgbGlzdGVuZXJzIHZhbHVlLlxuICAgIGlmICghdGhpcy5fZXZlbnRDb2xsZWN0aW9uIHx8ICEobGlzdGVuZXJzID0gdGhpcy5fZXZlbnRDb2xsZWN0aW9uW2V2ZW50XSkpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uIChmbiwgaSkge1xuICAgICAgaWYgKGZuID09PSBsaXN0ZW5lciB8fCBmbi5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgLy8gUmVtb3ZlcyB0aGUgZ2l2ZW4gbGlzdGVuZXIuXG4gICAgICAgIGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBSZW1vdmVzIGFuIGVtcHR5IGV2ZW50IGNvbGxlY3Rpb24uXG4gICAgaWYgKGxpc3RlbmVycy5sZW5ndGggPT09IDApIHtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudENvbGxlY3Rpb25bZXZlbnRdO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBFeGVjdXRlIGVhY2ggaXRlbSBpbiB0aGUgbGlzdGVuZXIgY29sbGVjdGlvbiBpbiBvcmRlciB3aXRoIHRoZSBzcGVjaWZpZWQgZGF0YS5cbiAgICogQG1lbWJlcm9mISBFbWl0dGVyLnByb3RvdHlwZVxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IC0gVGhlIG5hbWUgb2YgdGhlIGV2ZW50IHlvdSB3YW50IHRvIGVtaXQuXG4gICAqIEBwYXJhbSB7Li4uT2JqZWN0fSBkYXRhIC0gRGF0YSB0byBwYXNzIHRvIHRoZSBsaXN0ZW5lcnMuXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYW4gaW5zdGFuY2Ugb2YgRW1pdHRlci5cbiAgICogQGV4YW1wbGVcbiAgICogLy8gRW1pdHMgdGhlIFwiZm9vXCIgZXZlbnQgd2l0aCAncGFyYW0xJyBhbmQgJ3BhcmFtMicgYXMgYXJndW1lbnRzLlxuICAgKiBlbWl0dGVyLmVtaXQoJ2ZvbycsICdwYXJhbTEnLCAncGFyYW0yJyk7XG4gICAqL1xuXG4gIEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2ZW50KSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgYXJnc1tfa2V5IC0gMV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgfVxuXG4gICAgdmFyIGxpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuICAgIC8vIERlZmluZXMgbGlzdGVuZXJzIHZhbHVlLlxuICAgIGlmICghdGhpcy5fZXZlbnRDb2xsZWN0aW9uIHx8ICEobGlzdGVuZXJzID0gdGhpcy5fZXZlbnRDb2xsZWN0aW9uW2V2ZW50XSkpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8vIENsb25lIGxpc3RlbmVyc1xuICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5zbGljZSgwKTtcblxuICAgIGxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uIChmbikge1xuICAgICAgcmV0dXJuIGZuLmFwcGx5KF90aGlzLCBhcmdzKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIHJldHVybiBFbWl0dGVyO1xufSkoKTtcblxuLyoqXG4gKiBFeHBvcnRzIEVtaXR0ZXJcbiAqL1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBFbWl0dGVyO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzW1wiZGVmYXVsdFwiXTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL3N1cGVybW9kZWxzJyk7XG4iLCIndXNlIHN0cmljdCdcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKVxudmFyIGNyZWF0ZVdyYXBwZXJGYWN0b3J5ID0gcmVxdWlyZSgnLi9mYWN0b3J5JylcblxuZnVuY3Rpb24gcmVzb2x2ZSAoZnJvbSkge1xuICB2YXIgaXNDdG9yID0gdXRpbC5pc0NvbnN0cnVjdG9yKGZyb20pXG4gIHZhciBpc1N1cGVybW9kZWxDdG9yID0gdXRpbC5pc1N1cGVybW9kZWxDb25zdHJ1Y3Rvcihmcm9tKVxuICB2YXIgaXNBcnJheSA9IHV0aWwuaXNBcnJheShmcm9tKVxuXG4gIGlmIChpc0N0b3IgfHwgaXNTdXBlcm1vZGVsQ3RvciB8fCBpc0FycmF5KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIF9fdHlwZTogZnJvbVxuICAgIH1cbiAgfVxuXG4gIHZhciBpc1ZhbHVlID0gIXV0aWwuaXNPYmplY3QoZnJvbSlcbiAgaWYgKGlzVmFsdWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgX192YWx1ZTogZnJvbVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmcm9tXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZURlZiAoZnJvbSkge1xuICBmcm9tID0gcmVzb2x2ZShmcm9tKVxuXG4gIHZhciBfX1ZBTElEQVRPUlMgPSAnX192YWxpZGF0b3JzJ1xuICB2YXIgX19WQUxVRSA9ICdfX3ZhbHVlJ1xuICB2YXIgX19UWVBFID0gJ19fdHlwZSdcbiAgdmFyIF9fRElTUExBWU5BTUUgPSAnX19kaXNwbGF5TmFtZSdcbiAgdmFyIF9fR0VUID0gJ19fZ2V0J1xuICB2YXIgX19TRVQgPSAnX19zZXQnXG4gIHZhciBfX0VOVU1FUkFCTEUgPSAnX19lbnVtZXJhYmxlJ1xuICB2YXIgX19DT05GSUdVUkFCTEUgPSAnX19jb25maWd1cmFibGUnXG4gIHZhciBfX1dSSVRBQkxFID0gJ19fd3JpdGFibGUnXG4gIHZhciBfX1NQRUNJQUxfUFJPUFMgPSBbXG4gICAgX19WQUxJREFUT1JTLCBfX1ZBTFVFLCBfX1RZUEUsIF9fRElTUExBWU5BTUUsXG4gICAgX19HRVQsIF9fU0VULCBfX0VOVU1FUkFCTEUsIF9fQ09ORklHVVJBQkxFLCBfX1dSSVRBQkxFXG4gIF1cblxuICB2YXIgZGVmID0ge1xuICAgIGZyb206IGZyb20sXG4gICAgdHlwZTogZnJvbVtfX1RZUEVdLFxuICAgIHZhbHVlOiBmcm9tW19fVkFMVUVdLFxuICAgIHZhbGlkYXRvcnM6IGZyb21bX19WQUxJREFUT1JTXSB8fCBbXSxcbiAgICBlbnVtZXJhYmxlOiBmcm9tW19fRU5VTUVSQUJMRV0gIT09IGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogISFmcm9tW19fQ09ORklHVVJBQkxFXSxcbiAgICB3cml0YWJsZTogZnJvbVtfX1dSSVRBQkxFXSAhPT0gZmFsc2UsXG4gICAgZGlzcGxheU5hbWU6IGZyb21bX19ESVNQTEFZTkFNRV0sXG4gICAgZ2V0dGVyOiBmcm9tW19fR0VUXSxcbiAgICBzZXR0ZXI6IGZyb21bX19TRVRdXG4gIH1cblxuICB2YXIgdHlwZSA9IGRlZi50eXBlXG5cbiAgLy8gU2ltcGxlICdDb25zdHJ1Y3RvcicgVHlwZVxuICBpZiAodXRpbC5pc1NpbXBsZUNvbnN0cnVjdG9yKHR5cGUpKSB7XG4gICAgZGVmLmlzU2ltcGxlID0gdHJ1ZVxuXG4gICAgZGVmLmNhc3QgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiB1dGlsLmNhc3QodmFsdWUsIHR5cGUpXG4gICAgfVxuICB9IGVsc2UgaWYgKHV0aWwuaXNTdXBlcm1vZGVsQ29uc3RydWN0b3IodHlwZSkpIHtcbiAgICBkZWYuaXNSZWZlcmVuY2UgPSB0cnVlXG4gIH0gZWxzZSBpZiAoZGVmLnZhbHVlKSB7XG4gICAgLy8gSWYgYSB2YWx1ZSBpcyBwcmVzZW50LCB1c2VcbiAgICAvLyB0aGF0IGFuZCBzaG9ydC1jaXJjdWl0IHRoZSByZXN0XG4gICAgZGVmLmlzU2ltcGxlID0gdHJ1ZVxuICB9IGVsc2Uge1xuICAgIC8vIE90aGVyd2lzZSBsb29rIGZvciBvdGhlciBub24tc3BlY2lhbFxuICAgIC8vIGtleXMgYW5kIGFsc28gYW55IGl0ZW0gZGVmaW5pdGlvblxuICAgIC8vIGluIHRoZSBjYXNlIG9mIEFycmF5c1xuXG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhmcm9tKVxuICAgIHZhciBjaGlsZEtleXMgPSBrZXlzLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgcmV0dXJuIF9fU1BFQ0lBTF9QUk9QUy5pbmRleE9mKGl0ZW0pID09PSAtMVxuICAgIH0pXG5cbiAgICBpZiAoY2hpbGRLZXlzLmxlbmd0aCkge1xuICAgICAgdmFyIGRlZnMgPSB7fVxuICAgICAgdmFyIHByb3RvXG5cbiAgICAgIGNoaWxkS2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgdmFyIGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGZyb20sIGtleSlcbiAgICAgICAgdmFyIHZhbHVlXG5cbiAgICAgICAgaWYgKGRlc2NyaXB0b3IuZ2V0IHx8IGRlc2NyaXB0b3Iuc2V0KSB7XG4gICAgICAgICAgdmFsdWUgPSB7XG4gICAgICAgICAgICBfX2dldDogZGVzY3JpcHRvci5nZXQsXG4gICAgICAgICAgICBfX3NldDogZGVzY3JpcHRvci5zZXRcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsdWUgPSBmcm9tW2tleV1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdXRpbC5pc0NvbnN0cnVjdG9yKHZhbHVlKSAmJiAhdXRpbC5pc1N1cGVybW9kZWxDb25zdHJ1Y3Rvcih2YWx1ZSkgJiYgdXRpbC5pc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgICAgIGlmICghcHJvdG8pIHtcbiAgICAgICAgICAgIHByb3RvID0ge31cbiAgICAgICAgICB9XG4gICAgICAgICAgcHJvdG9ba2V5XSA9IHZhbHVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVmc1trZXldID0gY3JlYXRlRGVmKHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICBkZWYuZGVmcyA9IGRlZnNcbiAgICAgIGRlZi5wcm90byA9IHByb3RvXG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIEFycmF5XG4gICAgaWYgKHR5cGUgPT09IEFycmF5IHx8IHV0aWwuaXNBcnJheSh0eXBlKSkge1xuICAgICAgZGVmLmlzQXJyYXkgPSB0cnVlXG5cbiAgICAgIGlmICh0eXBlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZGVmLmRlZiA9IGNyZWF0ZURlZih0eXBlWzBdKVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY2hpbGRLZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgZGVmLmlzU2ltcGxlID0gdHJ1ZVxuICAgIH1cbiAgfVxuXG4gIGRlZi5jcmVhdGUgPSBjcmVhdGVXcmFwcGVyRmFjdG9yeShkZWYpXG5cbiAgcmV0dXJuIGRlZlxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZURlZlxuIiwiJ3VzZSBzdHJpY3QnXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gIHZhciBhcnIgPSBbXVxuXG4gIC8qKlxuICAgKiBQcm94aWVkIGFycmF5IG11dGF0b3JzIG1ldGhvZHNcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IG9ialxuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cbiAgdmFyIHBvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVzdWx0ID0gQXJyYXkucHJvdG90eXBlLnBvcC5hcHBseShhcnIpXG5cbiAgICBjYWxsYmFjaygncG9wJywgYXJyLCB7XG4gICAgICB2YWx1ZTogcmVzdWx0XG4gICAgfSlcblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICB2YXIgcHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVzdWx0ID0gQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoYXJyLCBhcmd1bWVudHMpXG5cbiAgICBjYWxsYmFjaygncHVzaCcsIGFyciwge1xuICAgICAgdmFsdWU6IHJlc3VsdFxuICAgIH0pXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbiAgdmFyIHNoaWZ0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZXN1bHQgPSBBcnJheS5wcm90b3R5cGUuc2hpZnQuYXBwbHkoYXJyKVxuXG4gICAgY2FsbGJhY2soJ3NoaWZ0JywgYXJyLCB7XG4gICAgICB2YWx1ZTogcmVzdWx0XG4gICAgfSlcblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICB2YXIgc29ydCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVzdWx0ID0gQXJyYXkucHJvdG90eXBlLnNvcnQuYXBwbHkoYXJyLCBhcmd1bWVudHMpXG5cbiAgICBjYWxsYmFjaygnc29ydCcsIGFyciwge1xuICAgICAgdmFsdWU6IHJlc3VsdFxuICAgIH0pXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbiAgdmFyIHVuc2hpZnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlc3VsdCA9IEFycmF5LnByb3RvdHlwZS51bnNoaWZ0LmFwcGx5KGFyciwgYXJndW1lbnRzKVxuXG4gICAgY2FsbGJhY2soJ3Vuc2hpZnQnLCBhcnIsIHtcbiAgICAgIHZhbHVlOiByZXN1bHRcbiAgICB9KVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG4gIHZhciByZXZlcnNlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZXN1bHQgPSBBcnJheS5wcm90b3R5cGUucmV2ZXJzZS5hcHBseShhcnIpXG5cbiAgICBjYWxsYmFjaygncmV2ZXJzZScsIGFyciwge1xuICAgICAgdmFsdWU6IHJlc3VsdFxuICAgIH0pXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbiAgdmFyIHNwbGljZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHZhciByZXN1bHQgPSBBcnJheS5wcm90b3R5cGUuc3BsaWNlLmFwcGx5KGFyciwgYXJndW1lbnRzKVxuXG4gICAgY2FsbGJhY2soJ3NwbGljZScsIGFyciwge1xuICAgICAgdmFsdWU6IHJlc3VsdCxcbiAgICAgIHJlbW92ZWQ6IHJlc3VsdCxcbiAgICAgIGFkZGVkOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpXG4gICAgfSlcblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm94eSBhbGwgQXJyYXkucHJvdG90eXBlIG11dGF0b3IgbWV0aG9kcyBvbiB0aGlzIGFycmF5IGluc3RhbmNlXG4gICAqL1xuICBhcnIucG9wID0gYXJyLnBvcCAmJiBwb3BcbiAgYXJyLnB1c2ggPSBhcnIucHVzaCAmJiBwdXNoXG4gIGFyci5zaGlmdCA9IGFyci5zaGlmdCAmJiBzaGlmdFxuICBhcnIudW5zaGlmdCA9IGFyci51bnNoaWZ0ICYmIHVuc2hpZnRcbiAgYXJyLnNvcnQgPSBhcnIuc29ydCAmJiBzb3J0XG4gIGFyci5yZXZlcnNlID0gYXJyLnJldmVyc2UgJiYgcmV2ZXJzZVxuICBhcnIuc3BsaWNlID0gYXJyLnNwbGljZSAmJiBzcGxpY2VcblxuICAvKipcbiAgICogU3BlY2lhbCB1cGRhdGUgZnVuY3Rpb24gc2luY2Ugd2UgY2FuJ3QgZGV0ZWN0XG4gICAqIGFzc2lnbm1lbnQgYnkgaW5kZXggZS5nLiBhcnJbMF0gPSAnc29tZXRoaW5nJ1xuICAgKi9cbiAgYXJyLnVwZGF0ZSA9IGZ1bmN0aW9uIChpbmRleCwgdmFsdWUpIHtcbiAgICB2YXIgb2xkVmFsdWUgPSBhcnJbaW5kZXhdXG4gICAgdmFyIG5ld1ZhbHVlID0gYXJyW2luZGV4XSA9IHZhbHVlXG5cbiAgICBjYWxsYmFjaygndXBkYXRlJywgYXJyLCB7XG4gICAgICBpbmRleDogaW5kZXgsXG4gICAgICB2YWx1ZTogbmV3VmFsdWUsXG4gICAgICBvbGRWYWx1ZTogb2xkVmFsdWVcbiAgICB9KVxuXG4gICAgcmV0dXJuIG5ld1ZhbHVlXG4gIH1cblxuICByZXR1cm4gYXJyXG59XG4iLCIndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBFbWl0dGVyRXZlbnQgKG5hbWUsIHBhdGgsIHRhcmdldCwgZGV0YWlsKSB7XG4gIHRoaXMubmFtZSA9IG5hbWVcbiAgdGhpcy5wYXRoID0gcGF0aFxuICB0aGlzLnRhcmdldCA9IHRhcmdldFxuXG4gIGlmIChkZXRhaWwpIHtcbiAgICB0aGlzLmRldGFpbCA9IGRldGFpbFxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxuLyoqXG4gKiBFeHBvc2UgYEVtaXR0ZXJgLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gRW1pdHRlclxuXG4vKipcbiAqIEluaXRpYWxpemUgYSBuZXcgYEVtaXR0ZXJgLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gRW1pdHRlciAob2JqKSB7XG4gIHZhciBjdHggPSBvYmogfHwgdGhpc1xuXG4gIGlmIChvYmopIHtcbiAgICBjdHggPSBtaXhpbihvYmopXG4gICAgcmV0dXJuIGN0eFxuICB9XG59XG5cbi8qKlxuICogTWl4aW4gdGhlIGVtaXR0ZXIgcHJvcGVydGllcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBtaXhpbiAob2JqKSB7XG4gIGZvciAodmFyIGtleSBpbiBFbWl0dGVyLnByb3RvdHlwZSkge1xuICAgIG9ialtrZXldID0gRW1pdHRlci5wcm90b3R5cGVba2V5XVxuICB9XG4gIHJldHVybiBvYmpcbn1cblxuLyoqXG4gKiBMaXN0ZW4gb24gdGhlIGdpdmVuIGBldmVudGAgd2l0aCBgZm5gLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9uID0gRW1pdHRlci5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIChldmVudCwgZm4pIHtcbiAgKHRoaXMuX19jYWxsYmFja3NbZXZlbnRdID0gdGhpcy5fX2NhbGxiYWNrc1tldmVudF0gfHwgW10pXG4gICAgLnB1c2goZm4pXG4gIHJldHVybiB0aGlzXG59XG5cbi8qKlxuICogQWRkcyBhbiBgZXZlbnRgIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBpbnZva2VkIGEgc2luZ2xlXG4gKiB0aW1lIHRoZW4gYXV0b21hdGljYWxseSByZW1vdmVkLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiAoZXZlbnQsIGZuKSB7XG4gIGZ1bmN0aW9uIG9uICgpIHtcbiAgICB0aGlzLm9mZihldmVudCwgb24pXG4gICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICB9XG5cbiAgb24uZm4gPSBmblxuICB0aGlzLm9uKGV2ZW50LCBvbilcbiAgcmV0dXJuIHRoaXNcbn1cblxuLyoqXG4gKiBSZW1vdmUgdGhlIGdpdmVuIGNhbGxiYWNrIGZvciBgZXZlbnRgIG9yIGFsbFxuICogcmVnaXN0ZXJlZCBjYWxsYmFja3MuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub2ZmID0gRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIChldmVudCwgZm4pIHtcbiAgLy8gYWxsXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhpcy5fX2NhbGxiYWNrcyA9IHt9XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8vIHNwZWNpZmljIGV2ZW50XG4gIHZhciBjYWxsYmFja3MgPSB0aGlzLl9fY2FsbGJhY2tzW2V2ZW50XVxuICBpZiAoIWNhbGxiYWNrcykge1xuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvLyByZW1vdmUgYWxsIGhhbmRsZXJzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgZGVsZXRlIHRoaXMuX19jYWxsYmFja3NbZXZlbnRdXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8vIHJlbW92ZSBzcGVjaWZpYyBoYW5kbGVyXG4gIHZhciBjYlxuICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgIGNiID0gY2FsbGJhY2tzW2ldXG4gICAgaWYgKGNiID09PSBmbiB8fCBjYi5mbiA9PT0gZm4pIHtcbiAgICAgIGNhbGxiYWNrcy5zcGxpY2UoaSwgMSlcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbi8qKlxuICogRW1pdCBgZXZlbnRgIHdpdGggdGhlIGdpdmVuIGFyZ3MuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge01peGVkfSAuLi5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIChldmVudCkge1xuICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKVxuICB2YXIgY2FsbGJhY2tzID0gdGhpcy5fX2NhbGxiYWNrc1tldmVudF1cblxuICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgY2FsbGJhY2tzID0gY2FsbGJhY2tzLnNsaWNlKDApXG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNhbGxiYWNrcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgY2FsbGJhY2tzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXNcbn1cblxuLyoqXG4gKiBSZXR1cm4gYXJyYXkgb2YgY2FsbGJhY2tzIGZvciBgZXZlbnRgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHJldHVybiB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChldmVudCkge1xuICByZXR1cm4gdGhpcy5fX2NhbGxiYWNrc1tldmVudF0gfHwgW11cbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGlzIGVtaXR0ZXIgaGFzIGBldmVudGAgaGFuZGxlcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5oYXNMaXN0ZW5lcnMgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgcmV0dXJuICEhdGhpcy5saXN0ZW5lcnMoZXZlbnQpLmxlbmd0aFxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJylcbnZhciBjcmVhdGVNb2RlbFByb3RvdHlwZSA9IHJlcXVpcmUoJy4vcHJvdG8nKVxudmFyIFdyYXBwZXIgPSByZXF1aXJlKCcuL3dyYXBwZXInKVxuXG5mdW5jdGlvbiBjcmVhdGVNb2RlbERlc2NyaXB0b3JzIChkZWYsIHBhcmVudCkge1xuICB2YXIgX18gPSB7fVxuXG4gIHZhciBkZXNjID0ge1xuICAgIF9fOiB7XG4gICAgICB2YWx1ZTogX19cbiAgICB9LFxuICAgIF9fZGVmOiB7XG4gICAgICB2YWx1ZTogZGVmXG4gICAgfSxcbiAgICBfX3BhcmVudDoge1xuICAgICAgdmFsdWU6IHBhcmVudCxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfSxcbiAgICBfX2NhbGxiYWNrczoge1xuICAgICAgdmFsdWU6IHt9LFxuICAgICAgd3JpdGFibGU6IHRydWVcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZGVzY1xufVxuXG5mdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzIChtb2RlbCkge1xuICB2YXIgZGVmcyA9IG1vZGVsLl9fZGVmLmRlZnNcbiAgZm9yICh2YXIga2V5IGluIGRlZnMpIHtcbiAgICBkZWZpbmVQcm9wZXJ0eShtb2RlbCwga2V5LCBkZWZzW2tleV0pXG4gIH1cbn1cblxuZnVuY3Rpb24gZGVmaW5lUHJvcGVydHkgKG1vZGVsLCBrZXksIGRlZikge1xuICB2YXIgZGVzYyA9IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fZ2V0KGtleSlcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IGRlZi5lbnVtZXJhYmxlLFxuICAgIGNvbmZpZ3VyYWJsZTogZGVmLmNvbmZpZ3VyYWJsZVxuICB9XG5cbiAgaWYgKGRlZi53cml0YWJsZSkge1xuICAgIGRlc2Muc2V0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICB0aGlzLl9fc2V0Tm90aWZ5Q2hhbmdlKGtleSwgdmFsdWUpXG4gICAgfVxuICB9XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG1vZGVsLCBrZXksIGRlc2MpXG5cbiAgLy8gU2lsZW50bHkgaW5pdGlhbGl6ZSB0aGUgcHJvcGVydHkgd3JhcHBlclxuICBtb2RlbC5fX1trZXldID0gZGVmLmNyZWF0ZShtb2RlbClcbn1cblxuZnVuY3Rpb24gY3JlYXRlV3JhcHBlckZhY3RvcnkgKGRlZikge1xuICB2YXIgd3JhcHBlciwgZGVmYXVsdFZhbHVlLCBhc3NlcnRcblxuICBpZiAoZGVmLmlzU2ltcGxlKSB7XG4gICAgd3JhcHBlciA9IG5ldyBXcmFwcGVyKGRlZi52YWx1ZSwgZGVmLndyaXRhYmxlLCBkZWYudmFsaWRhdG9ycywgZGVmLmdldHRlciwgZGVmLnNldHRlciwgZGVmLmNhc3QsIG51bGwpXG4gIH0gZWxzZSBpZiAoZGVmLmlzUmVmZXJlbmNlKSB7XG4gICAgLy8gSG9sZCBhIHJlZmVyZW5jZSB0byB0aGVcbiAgICAvLyByZWZlcmVyZW5jZWQgdHlwZXMnIGRlZmluaXRpb25cbiAgICB2YXIgcmVmRGVmID0gZGVmLnR5cGUuZGVmXG5cbiAgICBpZiAocmVmRGVmLmlzU2ltcGxlKSB7XG4gICAgICAvLyBJZiB0aGUgcmVmZXJlbmNlZCB0eXBlIGlzIGl0c2VsZiBzaW1wbGUsXG4gICAgICAvLyB3ZSBjYW4gc2V0IGp1c3QgcmV0dXJuIGEgd3JhcHBlciBhbmRcbiAgICAgIC8vIHRoZSBwcm9wZXJ0eSB3aWxsIGdldCBpbml0aWFsaXplZC5cbiAgICAgIHdyYXBwZXIgPSBuZXcgV3JhcHBlcihyZWZEZWYudmFsdWUsIHJlZkRlZi53cml0YWJsZSwgcmVmRGVmLnZhbGlkYXRvcnMsIGRlZi5nZXR0ZXIsIGRlZi5zZXR0ZXIsIHJlZkRlZi5jYXN0LCBudWxsKVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB3ZSdyZSBub3QgZGVhbGluZyB3aXRoIGEgc2ltcGxlIHJlZmVyZW5jZSBtb2RlbFxuICAgICAgLy8gd2UgbmVlZCB0byBkZWZpbmUgYW4gYXNzZXJ0aW9uIHRoYXQgdGhlIGluc3RhbmNlXG4gICAgICAvLyBiZWluZyBzZXQgaXMgb2YgdGhlIGNvcnJlY3QgdHlwZS4gV2UgZG8gdGhpcyBiZVxuICAgICAgLy8gY29tcGFyaW5nIHRoZSBkZWZzLlxuXG4gICAgICBhc3NlcnQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gY29tcGFyZSB0aGUgZGVmaW50aW9ucyBvZiB0aGUgdmFsdWUgaW5zdGFuY2VcbiAgICAgICAgLy8gYmVpbmcgcGFzc2VkIGFuZCB0aGUgZGVmIHByb3BlcnR5IGF0dGFjaGVkXG4gICAgICAgIC8vIHRvIHRoZSB0eXBlIFN1cGVybW9kZWxDb25zdHJ1Y3Rvci4gQWxsb3cgdGhlXG4gICAgICAgIC8vIHZhbHVlIHRvIGJlIHVuZGVmaW5lZCBvciBudWxsIGFsc28uXG4gICAgICAgIHZhciBpc0NvcnJlY3RUeXBlID0gZmFsc2VcblxuICAgICAgICBpZiAodXRpbC5pc051bGxPclVuZGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgICBpc0NvcnJlY3RUeXBlID0gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlzQ29ycmVjdFR5cGUgPSByZWZEZWYgPT09IHZhbHVlLl9fZGVmXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWlzQ29ycmVjdFR5cGUpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZhbHVlIHNob3VsZCBiZSBhbiBpbnN0YW5jZSBvZiB0aGUgcmVmZXJlbmNlZCBtb2RlbCwgbnVsbCBvciB1bmRlZmluZWQnKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHdyYXBwZXIgPSBuZXcgV3JhcHBlcihkZWYudmFsdWUsIGRlZi53cml0YWJsZSwgZGVmLnZhbGlkYXRvcnMsIGRlZi5nZXR0ZXIsIGRlZi5zZXR0ZXIsIG51bGwsIGFzc2VydClcbiAgICB9XG4gIH0gZWxzZSBpZiAoZGVmLmlzQXJyYXkpIHtcbiAgICBkZWZhdWx0VmFsdWUgPSBmdW5jdGlvbiAocGFyZW50KSB7XG4gICAgICAvLyBmb3IgQXJyYXlzLCB3ZSBjcmVhdGUgYSBuZXcgQXJyYXkgYW5kIGVhY2hcbiAgICAgIC8vIHRpbWUsIG1peCB0aGUgbW9kZWwgcHJvcGVydGllcyBpbnRvIGl0XG4gICAgICB2YXIgbW9kZWwgPSBjcmVhdGVNb2RlbFByb3RvdHlwZShkZWYpXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhtb2RlbCwgY3JlYXRlTW9kZWxEZXNjcmlwdG9ycyhkZWYsIHBhcmVudCkpXG4gICAgICBkZWZpbmVQcm9wZXJ0aWVzKG1vZGVsKVxuICAgICAgcmV0dXJuIG1vZGVsXG4gICAgfVxuXG4gICAgYXNzZXJ0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAvLyB0b2RvOiBmdXJ0aGVyIGFycmF5IHR5cGUgdmFsaWRhdGlvblxuICAgICAgaWYgKCF1dGlsLmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVmFsdWUgc2hvdWxkIGJlIGFuIGFycmF5JylcbiAgICAgIH1cbiAgICB9XG5cbiAgICB3cmFwcGVyID0gbmV3IFdyYXBwZXIoZGVmYXVsdFZhbHVlLCBkZWYud3JpdGFibGUsIGRlZi52YWxpZGF0b3JzLCBkZWYuZ2V0dGVyLCBkZWYuc2V0dGVyLCBudWxsLCBhc3NlcnQpXG4gIH0gZWxzZSB7XG4gICAgLy8gZm9yIE9iamVjdHMsIHdlIGNhbiBjcmVhdGUgYW5kIHJldXNlXG4gICAgLy8gYSBwcm90b3R5cGUgb2JqZWN0LiBXZSB0aGVuIG5lZWQgdG8gb25seVxuICAgIC8vIGRlZmluZSB0aGUgZGVmcyBhbmQgdGhlICdpbnN0YW5jZScgcHJvcGVydGllc1xuICAgIC8vIGUuZy4gX18sIHBhcmVudCBldGMuXG4gICAgdmFyIHByb3RvID0gY3JlYXRlTW9kZWxQcm90b3R5cGUoZGVmKVxuXG4gICAgZGVmYXVsdFZhbHVlID0gZnVuY3Rpb24gKHBhcmVudCkge1xuICAgICAgdmFyIG1vZGVsID0gT2JqZWN0LmNyZWF0ZShwcm90bywgY3JlYXRlTW9kZWxEZXNjcmlwdG9ycyhkZWYsIHBhcmVudCkpXG4gICAgICBkZWZpbmVQcm9wZXJ0aWVzKG1vZGVsKVxuICAgICAgcmV0dXJuIG1vZGVsXG4gICAgfVxuXG4gICAgYXNzZXJ0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoIXByb3RvLmlzUHJvdG90eXBlT2YodmFsdWUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwcm90b3R5cGUnKVxuICAgICAgfVxuICAgIH1cblxuICAgIHdyYXBwZXIgPSBuZXcgV3JhcHBlcihkZWZhdWx0VmFsdWUsIGRlZi53cml0YWJsZSwgZGVmLnZhbGlkYXRvcnMsIGRlZi5nZXR0ZXIsIGRlZi5zZXR0ZXIsIG51bGwsIGFzc2VydClcbiAgfVxuXG4gIHZhciBmYWN0b3J5ID0gZnVuY3Rpb24gKHBhcmVudCkge1xuICAgIHZhciB3cmFwID0gT2JqZWN0LmNyZWF0ZSh3cmFwcGVyKVxuICAgIC8vIGlmICghd3JhcC5pc0luaXRpYWxpemVkKSB7XG4gICAgd3JhcC5faW5pdGlhbGl6ZShwYXJlbnQpXG4gICAgLy8gfVxuICAgIHJldHVybiB3cmFwXG4gIH1cblxuICAvLyBleHBvc2UgdGhlIHdyYXBwZXIsIHRoaXMgaXMgdXNlZFxuICAvLyBmb3IgdmFsaWRhdGluZyBhcnJheSBpdGVtcyBsYXRlclxuICBmYWN0b3J5LndyYXBwZXIgPSB3cmFwcGVyXG5cbiAgcmV0dXJuIGZhY3Rvcnlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVXcmFwcGVyRmFjdG9yeVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmZ1bmN0aW9uIG1lcmdlIChtb2RlbCwgb2JqKSB7XG4gIHZhciBpc0FycmF5ID0gbW9kZWwuX19kZWYuaXNBcnJheVxuICB2YXIgZGVmcyA9IG1vZGVsLl9fZGVmLmRlZnNcbiAgdmFyIGRlZktleXMsIGRlZiwga2V5LCBpLCBpc1NpbXBsZSxcbiAgICBpc1NpbXBsZVJlZmVyZW5jZSwgaXNJbml0aWFsaXplZFJlZmVyZW5jZVxuXG4gIGlmIChkZWZzKSB7XG4gICAgZGVmS2V5cyA9IE9iamVjdC5rZXlzKGRlZnMpXG4gICAgZm9yIChpID0gMDsgaSA8IGRlZktleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGtleSA9IGRlZktleXNbaV1cbiAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBkZWYgPSBkZWZzW2tleV1cblxuICAgICAgICBpc1NpbXBsZSA9IGRlZi5pc1NpbXBsZVxuICAgICAgICBpc1NpbXBsZVJlZmVyZW5jZSA9IGRlZi5pc1JlZmVyZW5jZSAmJiBkZWYudHlwZS5kZWYuaXNTaW1wbGVcbiAgICAgICAgaXNJbml0aWFsaXplZFJlZmVyZW5jZSA9IGRlZi5pc1JlZmVyZW5jZSAmJiBvYmpba2V5XSAmJiBvYmpba2V5XS5fX3N1cGVybW9kZWxcblxuICAgICAgICBpZiAoaXNTaW1wbGUgfHwgaXNTaW1wbGVSZWZlcmVuY2UgfHwgaXNJbml0aWFsaXplZFJlZmVyZW5jZSkge1xuICAgICAgICAgIG1vZGVsW2tleV0gPSBvYmpba2V5XVxuICAgICAgICB9IGVsc2UgaWYgKG9ialtrZXldKSB7XG4gICAgICAgICAgaWYgKGRlZi5pc1JlZmVyZW5jZSkge1xuICAgICAgICAgICAgbW9kZWxba2V5XSA9IGRlZi50eXBlKClcbiAgICAgICAgICB9XG4gICAgICAgICAgbWVyZ2UobW9kZWxba2V5XSwgb2JqW2tleV0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoaXNBcnJheSAmJiBBcnJheS5pc0FycmF5KG9iaikpIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgb2JqLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaXRlbSA9IG1vZGVsLmNyZWF0ZSgpXG4gICAgICBtb2RlbC5wdXNoKGl0ZW0gJiYgaXRlbS5fX3N1cGVybW9kZWwgPyBtZXJnZShpdGVtLCBvYmpbaV0pIDogb2JqW2ldKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtb2RlbFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1lcmdlXG4iLCIndXNlIHN0cmljdCdcblxudmFyIEVtaXR0ZXJFdmVudCA9IHJlcXVpcmUoJy4vZW1pdHRlci1ldmVudCcpXG52YXIgVmFsaWRhdGlvbkVycm9yID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uLWVycm9yJylcbnZhciBXcmFwcGVyID0gcmVxdWlyZSgnLi93cmFwcGVyJylcbnZhciBtZXJnZSA9IHJlcXVpcmUoJy4vbWVyZ2UnKVxuXG52YXIgZGVzY3JpcHRvcnMgPSB7XG4gIF9fc3VwZXJtb2RlbDoge1xuICAgIHZhbHVlOiB0cnVlXG4gIH0sXG4gIF9fa2V5czoge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh0aGlzKVxuXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzKSkge1xuICAgICAgICB2YXIgb21pdCA9IFtcbiAgICAgICAgICAnYWRkRXZlbnRMaXN0ZW5lcicsICdvbicsICdvbmNlJywgJ3JlbW92ZUV2ZW50TGlzdGVuZXInLCAncmVtb3ZlQWxsTGlzdGVuZXJzJyxcbiAgICAgICAgICAncmVtb3ZlTGlzdGVuZXInLCAnb2ZmJywgJ2VtaXQnLCAnbGlzdGVuZXJzJywgJ2hhc0xpc3RlbmVycycsICdwb3AnLCAncHVzaCcsXG4gICAgICAgICAgJ3JldmVyc2UnLCAnc2hpZnQnLCAnc29ydCcsICdzcGxpY2UnLCAndXBkYXRlJywgJ3Vuc2hpZnQnLCAnY3JlYXRlJywgJ19fbWVyZ2UnLFxuICAgICAgICAgICdfX3NldE5vdGlmeUNoYW5nZScsICdfX25vdGlmeUNoYW5nZScsICdfX3NldCcsICdfX2dldCcsICdfX2NoYWluJywgJ19fcmVsYXRpdmVQYXRoJ1xuICAgICAgICBdXG5cbiAgICAgICAga2V5cyA9IGtleXMuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgcmV0dXJuIG9taXQuaW5kZXhPZihpdGVtKSA8IDBcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGtleXNcbiAgICB9XG4gIH0sXG4gIF9fbmFtZToge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuX19pc1Jvb3QpIHtcbiAgICAgICAgcmV0dXJuICcnXG4gICAgICB9XG5cbiAgICAgIC8vIFdvcmsgb3V0IHRoZSAnbmFtZScgb2YgdGhlIG1vZGVsXG4gICAgICAvLyBMb29rIHVwIHRvIHRoZSBwYXJlbnQgYW5kIGxvb3AgdGhyb3VnaCBpdCdzIGtleXMsXG4gICAgICAvLyBBbnkgdmFsdWUgb3IgYXJyYXkgZm91bmQgdG8gY29udGFpbiB0aGUgdmFsdWUgb2YgdGhpcyAodGhpcyBtb2RlbClcbiAgICAgIC8vIHRoZW4gd2UgcmV0dXJuIHRoZSBrZXkgYW5kIGluZGV4IGluIHRoZSBjYXNlIHdlIGZvdW5kIHRoZSBtb2RlbCBpbiBhbiBhcnJheS5cbiAgICAgIHZhciBwYXJlbnRLZXlzID0gdGhpcy5fX3BhcmVudC5fX2tleXNcbiAgICAgIHZhciBwYXJlbnRLZXksIHBhcmVudFZhbHVlXG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFyZW50S2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBwYXJlbnRLZXkgPSBwYXJlbnRLZXlzW2ldXG4gICAgICAgIHBhcmVudFZhbHVlID0gdGhpcy5fX3BhcmVudFtwYXJlbnRLZXldXG5cbiAgICAgICAgaWYgKHBhcmVudFZhbHVlID09PSB0aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIHBhcmVudEtleVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBfX3BhdGg6IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLl9faGFzQW5jZXN0b3JzICYmICF0aGlzLl9fcGFyZW50Ll9faXNSb290KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fcGFyZW50Ll9fcGF0aCArICcuJyArIHRoaXMuX19uYW1lXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5fX25hbWVcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIF9faXNSb290OiB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gIXRoaXMuX19oYXNBbmNlc3RvcnNcbiAgICB9XG4gIH0sXG4gIF9fY2hpbGRyZW46IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBjaGlsZHJlbiA9IFtdXG5cbiAgICAgIHZhciBrZXlzID0gdGhpcy5fX2tleXNcbiAgICAgIHZhciBrZXksIHZhbHVlXG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBrZXkgPSBrZXlzW2ldXG4gICAgICAgIHZhbHVlID0gdGhpc1trZXldXG5cbiAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLl9fc3VwZXJtb2RlbCkge1xuICAgICAgICAgIGNoaWxkcmVuLnB1c2godmFsdWUpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNoaWxkcmVuXG4gICAgfVxuICB9LFxuICBfX2FuY2VzdG9yczoge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGFuY2VzdG9ycyA9IFtdXG4gICAgICB2YXIgciA9IHRoaXNcblxuICAgICAgd2hpbGUgKHIuX19wYXJlbnQpIHtcbiAgICAgICAgYW5jZXN0b3JzLnB1c2goci5fX3BhcmVudClcbiAgICAgICAgciA9IHIuX19wYXJlbnRcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFuY2VzdG9yc1xuICAgIH1cbiAgfSxcbiAgX19kZXNjZW5kYW50czoge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGRlc2NlbmRhbnRzID0gW11cblxuICAgICAgZnVuY3Rpb24gY2hlY2tBbmRBZGREZXNjZW5kYW50SWZNb2RlbCAob2JqKSB7XG4gICAgICAgIHZhciBrZXlzID0gb2JqLl9fa2V5c1xuICAgICAgICB2YXIga2V5LCB2YWx1ZVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGtleSA9IGtleXNbaV1cbiAgICAgICAgICB2YWx1ZSA9IG9ialtrZXldXG5cbiAgICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUuX19zdXBlcm1vZGVsKSB7XG4gICAgICAgICAgICBkZXNjZW5kYW50cy5wdXNoKHZhbHVlKVxuICAgICAgICAgICAgY2hlY2tBbmRBZGREZXNjZW5kYW50SWZNb2RlbCh2YWx1ZSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY2hlY2tBbmRBZGREZXNjZW5kYW50SWZNb2RlbCh0aGlzKVxuXG4gICAgICByZXR1cm4gZGVzY2VuZGFudHNcbiAgICB9XG4gIH0sXG4gIF9faGFzQW5jZXN0b3JzOiB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gISF0aGlzLl9fYW5jZXN0b3JzLmxlbmd0aFxuICAgIH1cbiAgfSxcbiAgX19oYXNEZXNjZW5kYW50czoge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuICEhdGhpcy5fX2Rlc2NlbmRhbnRzLmxlbmd0aFxuICAgIH1cbiAgfSxcbiAgZXJyb3JzOiB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgZXJyb3JzID0gW11cbiAgICAgIHZhciBkZWYgPSB0aGlzLl9fZGVmXG4gICAgICB2YXIgdmFsaWRhdG9yLCBlcnJvciwgaVxuXG4gICAgICAvLyBSdW4gb3duIHZhbGlkYXRvcnNcbiAgICAgIHZhciBvd24gPSBkZWYudmFsaWRhdG9ycy5zbGljZSgwKVxuICAgICAgZm9yIChpID0gMDsgaSA8IG93bi5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YWxpZGF0b3IgPSBvd25baV1cbiAgICAgICAgZXJyb3IgPSB2YWxpZGF0b3IuY2FsbCh0aGlzLCB0aGlzKVxuXG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IodGhpcywgZXJyb3IsIHZhbGlkYXRvcikpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIFJ1biB0aHJvdWdoIGtleXMgYW5kIGV2YWx1YXRlIHZhbGlkYXRvcnNcbiAgICAgIHZhciBrZXlzID0gdGhpcy5fX2tleXNcbiAgICAgIHZhciB2YWx1ZSwga2V5LCBpdGVtRGVmLCBkaXNwbGF5TmFtZVxuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBrZXkgPSBrZXlzW2ldXG4gICAgICAgIGRpc3BsYXlOYW1lID0gdGhpcy5fX2RlZi5kZWZzICYmIHRoaXMuX19kZWYuZGVmc1trZXldLmRpc3BsYXlOYW1lXG4gICAgICAgIC8vIElmIHdlIGFyZSBhbiBBcnJheSB3aXRoIGFuIGl0ZW0gZGVmaW5pdGlvblxuICAgICAgICAvLyB0aGVuIHdlIGhhdmUgdG8gbG9vayBpbnRvIHRoZSBBcnJheSBmb3Igb3VyIHZhbHVlXG4gICAgICAgIC8vIGFuZCBhbHNvIGdldCBob2xkIG9mIHRoZSB3cmFwcGVyLiBXZSBvbmx5IG5lZWQgdG9cbiAgICAgICAgLy8gZG8gdGhpcyBpZiB0aGUga2V5IGlzIG5vdCBhIHByb3BlcnR5IG9mIHRoZSBhcnJheS5cbiAgICAgICAgLy8gV2UgY2hlY2sgdGhlIGRlZnMgdG8gd29yayB0aGlzIG91dCAoaS5lLiAwLCAxLCAyKS5cbiAgICAgICAgLy8gdG9kbzogVGhpcyBjb3VsZCBiZSBiZXR0ZXIgdG8gY2hlY2sgIU5hTiBvbiB0aGUga2V5P1xuICAgICAgICBpZiAoZGVmLmlzQXJyYXkgJiYgZGVmLmRlZiAmJiAoIWRlZi5kZWZzIHx8ICEoa2V5IGluIGRlZi5kZWZzKSkpIHtcbiAgICAgICAgICAvLyBJZiB3ZSBhcmUgYW4gQXJyYXkgd2l0aCBhIHNpbXBsZSBpdGVtIGRlZmluaXRpb25cbiAgICAgICAgICAvLyBvciBhIHJlZmVyZW5jZSB0byBhIHNpbXBsZSB0eXBlIGRlZmluaXRpb25cbiAgICAgICAgICAvLyBzdWJzdGl0dXRlIHRoZSB2YWx1ZSB3aXRoIHRoZSB3cmFwcGVyIHdlIGdldCBmcm9tIHRoZVxuICAgICAgICAgIC8vIGNyZWF0ZSBmYWN0b3J5IGZ1bmN0aW9uLiBPdGhlcndpc2Ugc2V0IHRoZSB2YWx1ZSB0b1xuICAgICAgICAgIC8vIHRoZSByZWFsIHZhbHVlIG9mIHRoZSBwcm9wZXJ0eS5cbiAgICAgICAgICBpdGVtRGVmID0gZGVmLmRlZlxuXG4gICAgICAgICAgaWYgKGl0ZW1EZWYuaXNTaW1wbGUpIHtcbiAgICAgICAgICAgIHZhbHVlID0gaXRlbURlZi5jcmVhdGUud3JhcHBlclxuICAgICAgICAgICAgdmFsdWUuX3NldFZhbHVlKHRoaXNba2V5XSlcbiAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW1EZWYuaXNSZWZlcmVuY2UgJiYgaXRlbURlZi50eXBlLmRlZi5pc1NpbXBsZSkge1xuICAgICAgICAgICAgdmFsdWUgPSBpdGVtRGVmLnR5cGUuZGVmLmNyZWF0ZS53cmFwcGVyXG4gICAgICAgICAgICB2YWx1ZS5fc2V0VmFsdWUodGhpc1trZXldKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHRoaXNba2V5XVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBTZXQgdGhlIHZhbHVlIHRvIHRoZSB3cmFwcGVkIHZhbHVlIG9mIHRoZSBwcm9wZXJ0eVxuICAgICAgICAgIHZhbHVlID0gdGhpcy5fX1trZXldXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICBpZiAodmFsdWUuX19zdXBlcm1vZGVsKSB7XG4gICAgICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShlcnJvcnMsIHZhbHVlLmVycm9ycylcbiAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgV3JhcHBlcikge1xuICAgICAgICAgICAgdmFyIHdyYXBwZXJWYWx1ZSA9IHZhbHVlLl9nZXRWYWx1ZSh0aGlzKVxuXG4gICAgICAgICAgICBpZiAod3JhcHBlclZhbHVlICYmIHdyYXBwZXJWYWx1ZS5fX3N1cGVybW9kZWwpIHtcbiAgICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoZXJyb3JzLCB3cmFwcGVyVmFsdWUuZXJyb3JzKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoZXJyb3JzLCB2YWx1ZS5fZ2V0RXJyb3JzKHRoaXMsIGtleSwgZGlzcGxheU5hbWUgfHwga2V5KSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGVycm9yc1xuICAgIH1cbiAgfVxufVxuXG52YXIgcHJvdG8gPSB7XG4gIF9fZ2V0OiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuX19ba2V5XS5fZ2V0VmFsdWUodGhpcylcbiAgfSxcbiAgX19zZXQ6IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgdGhpcy5fX1trZXldLl9zZXRWYWx1ZSh2YWx1ZSwgdGhpcylcbiAgfSxcbiAgX19yZWxhdGl2ZVBhdGg6IGZ1bmN0aW9uICh0bywga2V5KSB7XG4gICAgdmFyIHJlbGF0aXZlUGF0aCA9IHRoaXMuX19wYXRoXG4gICAgICA/IHRvLnN1YnN0cih0aGlzLl9fcGF0aC5sZW5ndGggKyAxKVxuICAgICAgOiB0b1xuXG4gICAgaWYgKHJlbGF0aXZlUGF0aCkge1xuICAgICAgcmV0dXJuIGtleSA/IHJlbGF0aXZlUGF0aCArICcuJyArIGtleSA6IHJlbGF0aXZlUGF0aFxuICAgIH1cbiAgICByZXR1cm4ga2V5XG4gIH0sXG4gIF9fY2hhaW46IGZ1bmN0aW9uIChmbikge1xuICAgIHJldHVybiBbdGhpc10uY29uY2F0KHRoaXMuX19hbmNlc3RvcnMpLmZvckVhY2goZm4pXG4gIH0sXG4gIF9fbWVyZ2U6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgcmV0dXJuIG1lcmdlKHRoaXMsIGRhdGEpXG4gIH0sXG4gIF9fbm90aWZ5Q2hhbmdlOiBmdW5jdGlvbiAoa2V5LCBuZXdWYWx1ZSwgb2xkVmFsdWUpIHtcbiAgICB2YXIgdGFyZ2V0ID0gdGhpc1xuICAgIHZhciB0YXJnZXRQYXRoID0gdGhpcy5fX3BhdGhcbiAgICB2YXIgZXZlbnROYW1lID0gJ3NldCdcbiAgICB2YXIgZGF0YSA9IHtcbiAgICAgIG9sZFZhbHVlOiBvbGRWYWx1ZSxcbiAgICAgIG5ld1ZhbHVlOiBuZXdWYWx1ZVxuICAgIH1cblxuICAgIHRoaXMuZW1pdChldmVudE5hbWUsIG5ldyBFbWl0dGVyRXZlbnQoZXZlbnROYW1lLCBrZXksIHRhcmdldCwgZGF0YSkpXG4gICAgdGhpcy5lbWl0KCdjaGFuZ2UnLCBuZXcgRW1pdHRlckV2ZW50KGV2ZW50TmFtZSwga2V5LCB0YXJnZXQsIGRhdGEpKVxuICAgIHRoaXMuZW1pdCgnY2hhbmdlOicgKyBrZXksIG5ldyBFbWl0dGVyRXZlbnQoZXZlbnROYW1lLCBrZXksIHRhcmdldCwgZGF0YSkpXG5cbiAgICB0aGlzLl9fYW5jZXN0b3JzLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHZhciBwYXRoID0gaXRlbS5fX3JlbGF0aXZlUGF0aCh0YXJnZXRQYXRoLCBrZXkpXG4gICAgICBpdGVtLmVtaXQoJ2NoYW5nZScsIG5ldyBFbWl0dGVyRXZlbnQoZXZlbnROYW1lLCBwYXRoLCB0YXJnZXQsIGRhdGEpKVxuICAgIH0pXG4gIH0sXG4gIF9fc2V0Tm90aWZ5Q2hhbmdlOiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgIHZhciBvbGRWYWx1ZSA9IHRoaXMuX19nZXQoa2V5KVxuICAgIHRoaXMuX19zZXQoa2V5LCB2YWx1ZSlcbiAgICB2YXIgbmV3VmFsdWUgPSB0aGlzLl9fZ2V0KGtleSlcbiAgICB0aGlzLl9fbm90aWZ5Q2hhbmdlKGtleSwgbmV3VmFsdWUsIG9sZFZhbHVlKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBwcm90bzogcHJvdG8sXG4gIGRlc2NyaXB0b3JzOiBkZXNjcmlwdG9yc1xufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmZ1bmN0aW9uIGZhY3RvcnkgKCkge1xuICBmdW5jdGlvbiBQcm9wICh0eXBlKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFByb3ApKSB7XG4gICAgICByZXR1cm4gbmV3IFByb3AodHlwZSlcbiAgICB9XG5cbiAgICB0aGlzLl9fdHlwZSA9IHR5cGVcbiAgICB0aGlzLl9fdmFsaWRhdG9ycyA9IFtdXG4gIH1cbiAgUHJvcC5wcm90b3R5cGUudHlwZSA9IGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgdGhpcy5fX3R5cGUgPSB0eXBlXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBQcm9wLnByb3RvdHlwZS5lbnVtZXJhYmxlID0gZnVuY3Rpb24gKGVudW1lcmFibGUpIHtcbiAgICB0aGlzLl9fZW51bWVyYWJsZSA9IGVudW1lcmFibGVcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIFByb3AucHJvdG90eXBlLmNvbmZpZ3VyYWJsZSA9IGZ1bmN0aW9uIChjb25maWd1cmFibGUpIHtcbiAgICB0aGlzLl9fY29uZmlndXJhYmxlID0gY29uZmlndXJhYmxlXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBQcm9wLnByb3RvdHlwZS53cml0YWJsZSA9IGZ1bmN0aW9uICh3cml0YWJsZSkge1xuICAgIHRoaXMuX193cml0YWJsZSA9IHdyaXRhYmxlXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBQcm9wLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24gKGtleXMpIHtcbiAgICBpZiAodGhpcy5fX3R5cGUgIT09IEFycmF5KSB7XG4gICAgICB0aGlzLl9fdHlwZSA9IE9iamVjdFxuICAgIH1cbiAgICBmb3IgKHZhciBrZXkgaW4ga2V5cykge1xuICAgICAgdGhpc1trZXldID0ga2V5c1trZXldXG4gICAgfVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgUHJvcC5wcm90b3R5cGUudmFsaWRhdGUgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICB0aGlzLl9fdmFsaWRhdG9ycy5wdXNoKGZuKVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgUHJvcC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgdGhpcy5fX2dldCA9IGZuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBQcm9wLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICB0aGlzLl9fc2V0ID0gZm5cbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIFByb3AucHJvdG90eXBlLnZhbHVlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy5fX3ZhbHVlID0gdmFsdWVcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIFByb3AucHJvdG90eXBlLm5hbWUgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRoaXMuX19kaXNwbGF5TmFtZSA9IG5hbWVcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIFByb3AucmVnaXN0ZXIgPSBmdW5jdGlvbiAobmFtZSwgZm4pIHtcbiAgICB2YXIgd3JhcHBlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuX192YWxpZGF0b3JzLnB1c2goZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKSlcbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShQcm9wLnByb3RvdHlwZSwgbmFtZSwge1xuICAgICAgdmFsdWU6IHdyYXBwZXJcbiAgICB9KVxuICB9XG4gIHJldHVybiBQcm9wXG59XG5cbm1vZHVsZS5leHBvcnRzID0gZmFjdG9yeVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBlbWl0dGVyID0gcmVxdWlyZSgnLi9lbWl0dGVyLW9iamVjdCcpXG52YXIgZW1pdHRlckFycmF5ID0gcmVxdWlyZSgnLi9lbWl0dGVyLWFycmF5JylcbnZhciBFbWl0dGVyRXZlbnQgPSByZXF1aXJlKCcuL2VtaXR0ZXItZXZlbnQnKVxuXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnLi91dGlsJykuZXh0ZW5kXG52YXIgbW9kZWwgPSByZXF1aXJlKCcuL21vZGVsJylcbnZhciBtb2RlbFByb3RvID0gbW9kZWwucHJvdG9cbnZhciBtb2RlbERlc2NyaXB0b3JzID0gbW9kZWwuZGVzY3JpcHRvcnNcblxudmFyIG1vZGVsUHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShtb2RlbFByb3RvLCBtb2RlbERlc2NyaXB0b3JzKVxudmFyIG9iamVjdFByb3RvdHlwZSA9IChmdW5jdGlvbiAoKSB7XG4gIHZhciBwID0gT2JqZWN0LmNyZWF0ZShtb2RlbFByb3RvdHlwZSlcblxuICBlbWl0dGVyKHApXG5cbiAgcmV0dXJuIHBcbn0pKClcblxuZnVuY3Rpb24gY3JlYXRlQXJyYXlQcm90b3R5cGUgKCkge1xuICB2YXIgcCA9IGVtaXR0ZXJBcnJheShmdW5jdGlvbiAoZXZlbnROYW1lLCBhcnIsIGUpIHtcbiAgICBpZiAoZXZlbnROYW1lID09PSAndXBkYXRlJykge1xuICAgICAgLyoqXG4gICAgICAgKiBGb3J3YXJkIHRoZSBzcGVjaWFsIGFycmF5IHVwZGF0ZVxuICAgICAgICogZXZlbnRzIGFzIHN0YW5kYXJkIF9fbm90aWZ5Q2hhbmdlIGV2ZW50c1xuICAgICAgICovXG4gICAgICBhcnIuX19ub3RpZnlDaGFuZ2UoZS5pbmRleCwgZS52YWx1ZSwgZS5vbGRWYWx1ZSlcbiAgICB9IGVsc2Uge1xuICAgICAgLyoqXG4gICAgICAgKiBBbGwgb3RoZXIgZXZlbnRzIGUuZy4gcHVzaCwgc3BsaWNlIGFyZSByZWxheWVkXG4gICAgICAgKi9cbiAgICAgIHZhciB0YXJnZXQgPSBhcnJcbiAgICAgIHZhciBwYXRoID0gYXJyLl9fcGF0aFxuICAgICAgdmFyIGRhdGEgPSBlXG4gICAgICB2YXIga2V5ID0gZS5pbmRleFxuXG4gICAgICBhcnIuZW1pdChldmVudE5hbWUsIG5ldyBFbWl0dGVyRXZlbnQoZXZlbnROYW1lLCAnJywgdGFyZ2V0LCBkYXRhKSlcbiAgICAgIGFyci5lbWl0KCdjaGFuZ2UnLCBuZXcgRW1pdHRlckV2ZW50KGV2ZW50TmFtZSwgJycsIHRhcmdldCwgZGF0YSkpXG4gICAgICBhcnIuX19hbmNlc3RvcnMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICB2YXIgbmFtZSA9IGl0ZW0uX19yZWxhdGl2ZVBhdGgocGF0aCwga2V5KVxuICAgICAgICBpdGVtLmVtaXQoJ2NoYW5nZScsIG5ldyBFbWl0dGVyRXZlbnQoZXZlbnROYW1lLCBuYW1lLCB0YXJnZXQsIGRhdGEpKVxuICAgICAgfSlcbiAgICB9XG4gIH0pXG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMocCwgbW9kZWxEZXNjcmlwdG9ycylcblxuICBlbWl0dGVyKHApXG5cbiAgZXh0ZW5kKHAsIG1vZGVsUHJvdG8pXG5cbiAgcmV0dXJuIHBcbn1cblxuZnVuY3Rpb24gY3JlYXRlT2JqZWN0TW9kZWxQcm90b3R5cGUgKHByb3RvKSB7XG4gIHZhciBwID0gT2JqZWN0LmNyZWF0ZShvYmplY3RQcm90b3R5cGUpXG5cbiAgaWYgKHByb3RvKSB7XG4gICAgZXh0ZW5kKHAsIHByb3RvKVxuICB9XG5cbiAgcmV0dXJuIHBcbn1cblxuZnVuY3Rpb24gY3JlYXRlQXJyYXlNb2RlbFByb3RvdHlwZSAocHJvdG8sIGl0ZW1EZWYpIHtcbiAgLy8gV2UgZG8gbm90IHRvIGF0dGVtcHQgdG8gc3ViY2xhc3MgQXJyYXksXG4gIC8vIGluc3RlYWQgY3JlYXRlIGEgbmV3IGluc3RhbmNlIGVhY2ggdGltZVxuICAvLyBhbmQgbWl4aW4gdGhlIHByb3RvIG9iamVjdFxuICB2YXIgcCA9IGNyZWF0ZUFycmF5UHJvdG90eXBlKClcblxuICBpZiAocHJvdG8pIHtcbiAgICBleHRlbmQocCwgcHJvdG8pXG4gIH1cblxuICBpZiAoaXRlbURlZikge1xuICAgIC8vIFdlIGhhdmUgYSBkZWZpbml0aW9uIGZvciB0aGUgaXRlbXNcbiAgICAvLyB0aGF0IGJlbG9uZyBpbiB0aGlzIGFycmF5LlxuXG4gICAgLy8gVXNlIHRoZSBgd3JhcHBlcmAgcHJvdG90eXBlIHByb3BlcnR5IGFzIGFcbiAgICAvLyB2aXJ0dWFsIFdyYXBwZXIgb2JqZWN0IHdlIGNhbiB1c2VcbiAgICAvLyB2YWxpZGF0ZSBhbGwgdGhlIGl0ZW1zIGluIHRoZSBhcnJheS5cbiAgICB2YXIgYXJySXRlbVdyYXBwZXIgPSBpdGVtRGVmLmNyZWF0ZS53cmFwcGVyXG5cbiAgICAvLyBWYWxpZGF0ZSBuZXcgbW9kZWxzIGJ5IG92ZXJyaWRpbmcgdGhlIGVtaXR0ZXIgYXJyYXlcbiAgICAvLyBtdXRhdG9ycyB0aGF0IGNhbiBjYXVzZSBuZXcgaXRlbXMgdG8gZW50ZXIgdGhlIGFycmF5LlxuICAgIG92ZXJyaWRlQXJyYXlBZGRpbmdNdXRhdG9ycyhwLCBhcnJJdGVtV3JhcHBlcilcblxuICAgIC8vIFByb3ZpZGUgYSBjb252ZW5pZW50IG1vZGVsIGZhY3RvcnlcbiAgICAvLyBmb3IgY3JlYXRpbmcgYXJyYXkgaXRlbSBpbnN0YW5jZXNcbiAgICBwLmNyZWF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBpdGVtRGVmLmlzUmVmZXJlbmNlID8gaXRlbURlZi50eXBlKCkgOiBpdGVtRGVmLmNyZWF0ZSgpLl9nZXRWYWx1ZSh0aGlzKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwXG59XG5cbmZ1bmN0aW9uIG92ZXJyaWRlQXJyYXlBZGRpbmdNdXRhdG9ycyAoYXJyLCBpdGVtV3JhcHBlcikge1xuICBmdW5jdGlvbiBnZXRBcnJheUFyZ3MgKGl0ZW1zKSB7XG4gICAgdmFyIGFyZ3MgPSBbXVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGl0ZW1XcmFwcGVyLl9zZXRWYWx1ZShpdGVtc1tpXSwgYXJyKVxuICAgICAgYXJncy5wdXNoKGl0ZW1XcmFwcGVyLl9nZXRWYWx1ZShhcnIpKVxuICAgIH1cbiAgICByZXR1cm4gYXJnc1xuICB9XG5cbiAgdmFyIHB1c2ggPSBhcnIucHVzaFxuICB2YXIgdW5zaGlmdCA9IGFyci51bnNoaWZ0XG4gIHZhciBzcGxpY2UgPSBhcnIuc3BsaWNlXG4gIHZhciB1cGRhdGUgPSBhcnIudXBkYXRlXG5cbiAgaWYgKHB1c2gpIHtcbiAgICBhcnIucHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBhcmdzID0gZ2V0QXJyYXlBcmdzKGFyZ3VtZW50cylcbiAgICAgIHJldHVybiBwdXNoLmFwcGx5KGFyciwgYXJncylcbiAgICB9XG4gIH1cblxuICBpZiAodW5zaGlmdCkge1xuICAgIGFyci51bnNoaWZ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGFyZ3MgPSBnZXRBcnJheUFyZ3MoYXJndW1lbnRzKVxuICAgICAgcmV0dXJuIHVuc2hpZnQuYXBwbHkoYXJyLCBhcmdzKVxuICAgIH1cbiAgfVxuXG4gIGlmIChzcGxpY2UpIHtcbiAgICBhcnIuc3BsaWNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGFyZ3MgPSBnZXRBcnJheUFyZ3MoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSlcbiAgICAgIGFyZ3MudW5zaGlmdChhcmd1bWVudHNbMV0pXG4gICAgICBhcmdzLnVuc2hpZnQoYXJndW1lbnRzWzBdKVxuICAgICAgcmV0dXJuIHNwbGljZS5hcHBseShhcnIsIGFyZ3MpXG4gICAgfVxuICB9XG5cbiAgaWYgKHVwZGF0ZSkge1xuICAgIGFyci51cGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgYXJncyA9IGdldEFycmF5QXJncyhbYXJndW1lbnRzWzFdXSlcbiAgICAgIGFyZ3MudW5zaGlmdChhcmd1bWVudHNbMF0pXG4gICAgICByZXR1cm4gdXBkYXRlLmFwcGx5KGFyciwgYXJncylcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlTW9kZWxQcm90b3R5cGUgKGRlZikge1xuICByZXR1cm4gZGVmLmlzQXJyYXkgPyBjcmVhdGVBcnJheU1vZGVsUHJvdG90eXBlKGRlZi5wcm90bywgZGVmLmRlZikgOiBjcmVhdGVPYmplY3RNb2RlbFByb3RvdHlwZShkZWYucHJvdG8pXG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlTW9kZWxQcm90b3R5cGVcbiIsIid1c2Ugc3RyaWN0J1xuXG5tb2R1bGUuZXhwb3J0cyA9IHt9XG4iLCIndXNlIHN0cmljdCdcblxudmFyIHByb3AgPSByZXF1aXJlKCcuL3Byb3AnKVxudmFyIG1lcmdlID0gcmVxdWlyZSgnLi9tZXJnZScpXG52YXIgY3JlYXRlRGVmID0gcmVxdWlyZSgnLi9kZWYnKVxudmFyIFN1cGVybW9kZWwgPSByZXF1aXJlKCcuL3N1cGVybW9kZWwnKVxuXG5mdW5jdGlvbiBzdXBlcm1vZGVscyAoc2NoZW1hKSB7XG4gIHZhciBkZWYgPSBjcmVhdGVEZWYoc2NoZW1hKVxuXG4gIGZ1bmN0aW9uIFN1cGVybW9kZWxDb25zdHJ1Y3RvciAoZGF0YSkge1xuICAgIHZhciBtb2RlbCA9IGRlZi5pc1NpbXBsZSA/IGRlZi5jcmVhdGUoKSA6IGRlZi5jcmVhdGUoKS5fZ2V0VmFsdWUoe30pXG5cbiAgICBpZiAoZGF0YSkge1xuICAgICAgLy8gaWYgdHdlIGhhdmUgYmVlbiBwYXNzZWQgc29tZVxuICAgICAgLy8gZGF0YSwgbWVyZ2UgaXQgaW50byB0aGUgbW9kZWwuXG4gICAgICBtb2RlbC5fX21lcmdlKGRhdGEpXG4gICAgfVxuICAgIHJldHVybiBtb2RlbFxuICB9XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdXBlcm1vZGVsQ29uc3RydWN0b3IsICdkZWYnLCB7XG4gICAgdmFsdWU6IGRlZiAvLyB0aGlzIGlzIHVzZWQgdG8gdmFsaWRhdGUgcmVmZXJlbmNlZCBTdXBlcm1vZGVsQ29uc3RydWN0b3JzXG4gIH0pXG4gIFN1cGVybW9kZWxDb25zdHJ1Y3Rvci5wcm90b3R5cGUgPSBTdXBlcm1vZGVsIC8vIHRoaXMgc2hhcmVkIG9iamVjdCBpcyB1c2VkLCBhcyBhIHByb3RvdHlwZSwgdG8gaWRlbnRpZnkgU3VwZXJtb2RlbENvbnN0cnVjdG9yc1xuICBTdXBlcm1vZGVsQ29uc3RydWN0b3IuY29uc3RydWN0b3IgPSBTdXBlcm1vZGVsQ29uc3RydWN0b3JcbiAgcmV0dXJuIFN1cGVybW9kZWxDb25zdHJ1Y3RvclxufVxuXG5zdXBlcm1vZGVscy5wcm9wID0gcHJvcFxuc3VwZXJtb2RlbHMubWVyZ2UgPSBtZXJnZVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN1cGVybW9kZWxzXG4iLCIndXNlIHN0cmljdCdcblxudmFyIFN1cGVybW9kZWwgPSByZXF1aXJlKCcuL3N1cGVybW9kZWwnKVxuXG5mdW5jdGlvbiBleHRlbmQgKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgdHlwZW9mIGFkZCAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gb3JpZ2luXG4gIH1cblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZClcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aFxuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dXG4gIH1cbiAgcmV0dXJuIG9yaWdpblxufVxuXG52YXIgdXRpbCA9IHtcbiAgZXh0ZW5kOiBleHRlbmQsXG4gIHR5cGVPZjogZnVuY3Rpb24gKG9iaikge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKS5tYXRjaCgvXFxzKFthLXpBLVpdKykvKVsxXS50b0xvd2VyQ2FzZSgpXG4gIH0sXG4gIGlzT2JqZWN0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy50eXBlT2YodmFsdWUpID09PSAnb2JqZWN0J1xuICB9LFxuICBpc0FycmF5OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSlcbiAgfSxcbiAgaXNTaW1wbGU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIC8vICdTaW1wbGUnIGhlcmUgbWVhbnMgYW55dGhpbmdcbiAgICAvLyBvdGhlciB0aGFuIGFuIE9iamVjdCBvciBhbiBBcnJheVxuICAgIC8vIGkuZS4gbnVtYmVyLCBzdHJpbmcsIGRhdGUsIGJvb2wsIG51bGwsIHVuZGVmaW5lZCwgcmVnZXguLi5cbiAgICByZXR1cm4gIXRoaXMuaXNPYmplY3QodmFsdWUpICYmICF0aGlzLmlzQXJyYXkodmFsdWUpXG4gIH0sXG4gIGlzRnVuY3Rpb246IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLnR5cGVPZih2YWx1ZSkgPT09ICdmdW5jdGlvbidcbiAgfSxcbiAgaXNEYXRlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy50eXBlT2YodmFsdWUpID09PSAnZGF0ZSdcbiAgfSxcbiAgaXNOdWxsOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IG51bGxcbiAgfSxcbiAgaXNVbmRlZmluZWQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgKHZhbHVlKSA9PT0gJ3VuZGVmaW5lZCdcbiAgfSxcbiAgaXNOdWxsT3JVbmRlZmluZWQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLmlzTnVsbCh2YWx1ZSkgfHwgdGhpcy5pc1VuZGVmaW5lZCh2YWx1ZSlcbiAgfSxcbiAgY2FzdDogZnVuY3Rpb24gKHZhbHVlLCB0eXBlKSB7XG4gICAgaWYgKCF0eXBlKSB7XG4gICAgICByZXR1cm4gdmFsdWVcbiAgICB9XG5cbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgU3RyaW5nOlxuICAgICAgICByZXR1cm4gdXRpbC5jYXN0U3RyaW5nKHZhbHVlKVxuICAgICAgY2FzZSBOdW1iZXI6XG4gICAgICAgIHJldHVybiB1dGlsLmNhc3ROdW1iZXIodmFsdWUpXG4gICAgICBjYXNlIEJvb2xlYW46XG4gICAgICAgIHJldHVybiB1dGlsLmNhc3RCb29sZWFuKHZhbHVlKVxuICAgICAgY2FzZSBEYXRlOlxuICAgICAgICByZXR1cm4gdXRpbC5jYXN0RGF0ZSh2YWx1ZSlcbiAgICAgIGNhc2UgT2JqZWN0OlxuICAgICAgY2FzZSBGdW5jdGlvbjpcbiAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY2FzdCcpXG4gICAgfVxuICB9LFxuICBjYXN0U3RyaW5nOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB1dGlsLnR5cGVPZih2YWx1ZSkgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gdmFsdWVcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nICYmIHZhbHVlLnRvU3RyaW5nKClcbiAgfSxcbiAgY2FzdE51bWJlcjogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBOYU5cbiAgICB9XG4gICAgaWYgKHV0aWwudHlwZU9mKHZhbHVlKSA9PT0gJ251bWJlcicpIHtcbiAgICAgIHJldHVybiB2YWx1ZVxuICAgIH1cbiAgICByZXR1cm4gTnVtYmVyKHZhbHVlKVxuICB9LFxuICBjYXN0Qm9vbGVhbjogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIHZhciBmYWxzZXkgPSBbJzAnLCAnZmFsc2UnLCAnb2ZmJywgJ25vJ11cbiAgICByZXR1cm4gZmFsc2V5LmluZGV4T2YodmFsdWUpID09PSAtMVxuICB9LFxuICBjYXN0RGF0ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdXRpbC50eXBlT2YodmFsdWUpID09PSAnZGF0ZScpIHtcbiAgICAgIHJldHVybiB2YWx1ZVxuICAgIH1cbiAgICByZXR1cm4gbmV3IERhdGUodmFsdWUpXG4gIH0sXG4gIGlzQ29uc3RydWN0b3I6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLmlzU2ltcGxlQ29uc3RydWN0b3IodmFsdWUpIHx8IFtBcnJheSwgT2JqZWN0XS5pbmRleE9mKHZhbHVlKSA+IC0xXG4gIH0sXG4gIGlzU2ltcGxlQ29uc3RydWN0b3I6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBbU3RyaW5nLCBOdW1iZXIsIERhdGUsIEJvb2xlYW5dLmluZGV4T2YodmFsdWUpID4gLTFcbiAgfSxcbiAgaXNTdXBlcm1vZGVsQ29uc3RydWN0b3I6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLmlzRnVuY3Rpb24odmFsdWUpICYmIHZhbHVlLnByb3RvdHlwZSA9PT0gU3VwZXJtb2RlbFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbFxuIiwiJ3VzZSBzdHJpY3QnXG5cbmZ1bmN0aW9uIFZhbGlkYXRpb25FcnJvciAodGFyZ2V0LCBlcnJvciwgdmFsaWRhdG9yLCBrZXkpIHtcbiAgdGhpcy50YXJnZXQgPSB0YXJnZXRcbiAgdGhpcy5lcnJvciA9IGVycm9yXG4gIHRoaXMudmFsaWRhdG9yID0gdmFsaWRhdG9yXG5cbiAgaWYgKGtleSkge1xuICAgIHRoaXMua2V5ID0ga2V5XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWYWxpZGF0aW9uRXJyb3JcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpXG52YXIgVmFsaWRhdGlvbkVycm9yID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uLWVycm9yJylcblxuZnVuY3Rpb24gV3JhcHBlciAoZGVmYXVsdFZhbHVlLCB3cml0YWJsZSwgdmFsaWRhdG9ycywgZ2V0dGVyLCBzZXR0ZXIsIGJlZm9yZVNldCwgYXNzZXJ0KSB7XG4gIHRoaXMudmFsaWRhdG9ycyA9IHZhbGlkYXRvcnNcblxuICB0aGlzLl9kZWZhdWx0VmFsdWUgPSBkZWZhdWx0VmFsdWVcbiAgdGhpcy5fd3JpdGFibGUgPSB3cml0YWJsZVxuICB0aGlzLl9nZXR0ZXIgPSBnZXR0ZXJcbiAgdGhpcy5fc2V0dGVyID0gc2V0dGVyXG4gIHRoaXMuX2JlZm9yZVNldCA9IGJlZm9yZVNldFxuICB0aGlzLl9hc3NlcnQgPSBhc3NlcnRcbiAgdGhpcy5pc0luaXRpYWxpemVkID0gZmFsc2VcblxuICBpZiAoIXV0aWwuaXNGdW5jdGlvbihkZWZhdWx0VmFsdWUpKSB7XG4gICAgdGhpcy5pc0luaXRpYWxpemVkID0gdHJ1ZVxuXG4gICAgaWYgKCF1dGlsLmlzVW5kZWZpbmVkKGRlZmF1bHRWYWx1ZSkpIHtcbiAgICAgIHRoaXMuX3ZhbHVlID0gZGVmYXVsdFZhbHVlXG4gICAgfVxuICB9XG59XG5XcmFwcGVyLnByb3RvdHlwZS5faW5pdGlhbGl6ZSA9IGZ1bmN0aW9uIChwYXJlbnQpIHtcbiAgaWYgKHRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgIHJldHVyblxuICB9XG5cbiAgdGhpcy5fc2V0VmFsdWUodGhpcy5fZGVmYXVsdFZhbHVlKHBhcmVudCksIHBhcmVudClcbiAgdGhpcy5pc0luaXRpYWxpemVkID0gdHJ1ZVxufVxuV3JhcHBlci5wcm90b3R5cGUuX2dldEVycm9ycyA9IGZ1bmN0aW9uIChtb2RlbCwga2V5LCBkaXNwbGF5TmFtZSkge1xuICBtb2RlbCA9IG1vZGVsIHx8IHRoaXNcbiAga2V5ID0ga2V5IHx8ICcnXG4gIGRpc3BsYXlOYW1lID0gZGlzcGxheU5hbWUgfHwga2V5XG5cbiAgdmFyIHNpbXBsZSA9IHRoaXMudmFsaWRhdG9yc1xuICB2YXIgZXJyb3JzID0gW11cbiAgdmFyIHZhbHVlID0gdGhpcy5fZ2V0VmFsdWUobW9kZWwpXG4gIHZhciB2YWxpZGF0b3IsIGVycm9yXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaW1wbGUubGVuZ3RoOyBpKyspIHtcbiAgICB2YWxpZGF0b3IgPSBzaW1wbGVbaV1cbiAgICBlcnJvciA9IHZhbGlkYXRvci5jYWxsKG1vZGVsLCB2YWx1ZSwgZGlzcGxheU5hbWUpXG5cbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IobW9kZWwsIGVycm9yLCB2YWxpZGF0b3IsIGtleSkpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGVycm9yc1xufVxuV3JhcHBlci5wcm90b3R5cGUuX2dldFZhbHVlID0gZnVuY3Rpb24gKG1vZGVsKSB7XG4gIHJldHVybiB0aGlzLl9nZXR0ZXIgPyB0aGlzLl9nZXR0ZXIuY2FsbChtb2RlbCkgOiB0aGlzLl92YWx1ZVxufVxuV3JhcHBlci5wcm90b3R5cGUuX3NldFZhbHVlID0gZnVuY3Rpb24gKHZhbHVlLCBtb2RlbCkge1xuICBpZiAoIXRoaXMuX3dyaXRhYmxlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdWYWx1ZSBpcyByZWFkb25seScpXG4gIH1cblxuICAvLyBIb29rIHVwIHRoZSBwYXJlbnQgcmVmIGlmIG5lY2Vzc2FyeVxuICBpZiAodmFsdWUgJiYgdmFsdWUuX19zdXBlcm1vZGVsICYmIG1vZGVsKSB7XG4gICAgaWYgKHZhbHVlLl9fcGFyZW50ICE9PSBtb2RlbCkge1xuICAgICAgdmFsdWUuX19wYXJlbnQgPSBtb2RlbFxuICAgIH1cbiAgfVxuXG4gIHZhciB2YWxcbiAgaWYgKHRoaXMuX3NldHRlcikge1xuICAgIHRoaXMuX3NldHRlci5jYWxsKG1vZGVsLCB2YWx1ZSlcbiAgICB2YWwgPSB0aGlzLl9nZXRWYWx1ZShtb2RlbClcbiAgfSBlbHNlIHtcbiAgICB2YWwgPSB0aGlzLl9iZWZvcmVTZXQgPyB0aGlzLl9iZWZvcmVTZXQodmFsdWUpIDogdmFsdWVcbiAgfVxuXG4gIGlmICh0aGlzLl9hc3NlcnQpIHtcbiAgICB0aGlzLl9hc3NlcnQodmFsKVxuICB9XG5cbiAgdGhpcy5fdmFsdWUgPSB2YWxcbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoV3JhcHBlci5wcm90b3R5cGUsIHtcbiAgdmFsdWU6IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9nZXRWYWx1ZSgpXG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgdGhpcy5fc2V0VmFsdWUodmFsdWUpXG4gICAgfVxuICB9LFxuICBlcnJvcnM6IHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9nZXRFcnJvcnMoKVxuICAgIH1cbiAgfVxufSlcbm1vZHVsZS5leHBvcnRzID0gV3JhcHBlclxuIl19
