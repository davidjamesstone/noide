
noide
====

`noide`is a web-based code editor built using Node.js.

At it's core it's a useful, lightweight editor so you don't leave your browser to write code.

It also allows you to customize the UI with your own workspaces.
Workspaces are basically FRAMESETs described as JSON.
Anything with a url and can be sectioned off to give split screen viewing.
This can include links to your own project urls for easy testing, embedded documentation relative to the project or even other useful web-based tools such as `node-inspector` and `tty.js`.

(see Workspaces/FRAMESETs)

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
- File operations (create/delete/rename files and directories etc.)
- Syntax highlighted code editing for many programming languages
- HTML/CSS/JS beautifiers
- Find/Find+Replace
- JSLINT validation warning
- Emmet
- Code snippets
- Themeable
- Configurable project level workspaces (see Fun with FRAMESETs)

Built using:
============

- [Node.js](https://github.com/joyent/node)
- [ace editor](https://github.com/ajaxorg/ace)
- [Twitter Bootstrap](https://github.com/twbs/bootstrap)
- [Angular](https://github.com/angular/angular.js)
- [Browserify](https://github.com/substack/node-browserify)
- [socket.io](https://github.com/LearnBoost/socket.io)


To build `noide` you will need browserify and the less compiler installed:

`npm i browserify -g`

`npm i lessc -g`

Then it's `npm run build`. This will compile the JavaScripts and Less files.


*** WARNING ***:
================
If you'd like to try out this IDE that's great and thanks BUT USE CAUTION.

Ensure any code is backed up regularly.
I would not like it to be responsible for any work lost.

Also, there is no authentication or security built in. Do not run on a publicly accessible server and port.

![debugger](https://raw.github.com/davidjamesstone/noide/gh-pages/images/Untitled2.jpg "debugger")


Optional
=========================
- node-inspector
- tty.js

node-inspector works almost exactly like the web inspector in Safari and Chrome. Here's a good [overview](http://code.google.com/chrome/devtools/docs/scripts.html) of the UI


noide configuration file (optional)
===================================
If a `noide.json` file is present in the root of the directory noide was started in it is read on start up.
This file can hold local project specific workspaces. Any local workspaces are added to those configured in the main application.
Any other setting in this local file will override those in the main application.


Fun with FRAMESETs
==================

Workspaces are essentially a FRAMESET definition file described in JSON. They allow you to describe a number of application workspaces.
By default there is only one workspace; the main Editor.

```json
{
  "workspaces": [{
    "name": "debug",
    "description": "Node Debugger, TTY and 2 x Tabs",
    "defn": {
      "rows": "*,30%",
      "items": [{
        "cols": "*,*",
        "items": [{
          "src": "/tab?address=http://localhost:3010/a"
        }, {
          "src": "/tab"
        }]
      }, {
        "cols": "*,*",
        "items": [{
          "src": "http://localhost:3002"
        }, {
          "src": "http://localhost:8080/debug"
        }]
      }]
    }
  }, {
    "name": "terminal",
    "description": "tty.js",
    "defn": {
      "src": "http://localhost:3002"
    }
  }, {
    "name": "dev-docs",
    "description": "DevDocs",
    "defn": {
      "src": "http://devdocs.io/"
    }
  }]
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
