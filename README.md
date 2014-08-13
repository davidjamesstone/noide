
noide
====

`noide`is a web-based code editor built using Node.js.
At it's core it's a useful, lightweight editor so you don't leave your browser to write code.

It also allows you to customize the UI with your own workspaces.
Workspaces support anything with a url; links to your own project urls for easy testing, embedded documention relative to the project or even other useful web-based tools such as `node-inspector` and `tty.js`.



Thanks for taking a look. Any comments, feedback or support use [Twitter](https://twitter.com/node_ide).


Instructions
============

`npm install noide -g`

then just cd to the directory you want to edit and execute

`noide`

Point your browser to `http://localhost:3000/`.


![ide](https://raw.github.com/davidjamesstone/noide/gh-pages/images/Untitled.jpg "IDE")

`noide`’s current features:

- File explorer tree view
- File operations (create/delete/rename files and directories)
- Syntax highlighted code editing for many programming languages
- HTML/CSS/JS beautifiers
- Find/Find+Replace
- JSLINT validation warning
- Configurable project level workspaces (see Fun with FRAMESETs)


Use cases:
============
A lightweight editor for installation on terminal cloud VMs e.g. joyent smart machine.
A local editor for nodejs, css, html5, & javascript development.

Built using:
============

- [Node.js](https://github.com/joyent/node)
- [ace editor](https://github.com/ajaxorg/ace)
- [Twitter Bootstrap](https://github.com/twbs/bootstrap)
- [Angular](https://github.com/angular/angular.js)
- [Browserify](https://github.com/substack/node-browserify)
- [socket.io](https://github.com/LearnBoost/socket.io)


*** WARNING ***:
================
If you'd like to try out this IDE that's great and thanks BUT USE CAUTION.

Ensure any code is backed up regularly.
I would not like it to be responsible for any work lost.

Also, there is no authentication or security built in. Do not run on a publicly accessible port.

![debugger](https://raw.github.com/davidjamesstone/noide/gh-pages/images/Untitled2.jpg "debugger")


Optional
=========================
- node-inspector
- tty.js

node-inspector works almost exactly like the web inspector in Safari and Chrome. Here's a good [overview](http://code.google.com/chrome/devtools/docs/scripts.html) of the UI


noide configuration file (optional)
===================================
If a `noide.json` file is present in the root of the [noide-install-dir] it is read on start up.
This file should hold the IDE settings:

```json
{
  "projectsDir": "",
  "users": {
    "testuser": "testpassword"
  },
  "editor": {
    "tabSize": 2,
    "useSoftTabs": true,
    "highlightActiveLine": true,
    "showPrintMargin": false,
    "showGutter": true,
    "fontSize": "12px",
    "useWorker": false
  },
  "beautify": {
    "js": {
      "indent_size": 2,
      "indent_char": " ",
      "indent_level": 0,
      "indent_with_tabs": false,
      "preserve_newlines": true,
      "max_preserve_newlines": 1,
      "jslint_happy": false,
      "brace_style": "collapse",
      "keep_array_indentation": false,
      "keep_function_indentation": false,
      "space_before_conditional": true,
      "break_chained_methods": false,
      "eval_code": false,
      "unescape_strings": false,
      "wrap_line_length": 0
    },
    "css": {
      "indent_size": 2,
      "indent_char": " "
    },
    "html": {
      "indent_size": 2,
      "indent_char": " ",
      "brace_style": "collapse",
      "indent_scripts ": "normal"
    }
  },
  "links": {
    "node": "http://nodejs.org",
    "mongodb": "http://www.mongodb.org",
    "mongoose": "http://mongoosejs.com",
    "-w3": "http://www.w3.org/",
    "mozilla js": "https://developer.mozilla.org/en-US/docs/JavaScript",
    "expressjs": "http://expressjs.com",
    "bootstrap": "http://twitter.github.com/bootstrap/",
    "-jquery": "http://jquery.com/",
    "jqueryui": "http://jqueryui.com/",
    "jquerymobile": "http://jquerymobile.com/"
  }
}
```

Editor
======

The code editor used in noide is the ajaxorg/ace editor.

Here's a useful [link](https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts) for default keyboard shortcuts

License
=======

noide is released under a **MIT License**:

    Copyright (C) 2014 by David Stone

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
