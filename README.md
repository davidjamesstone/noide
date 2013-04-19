TODO:
include editor instructions link
include web inspector webkit use guide (see node-inspector for link)

noide
====

`noide` is a web-based IDE for Node.js.
A useful, lightweight tool for Node.js, HTML5, CSS & JS development.

![ide](https://raw.github.com/davidjamesstone/noide/gh-pages/images/Untitled.jpg "IDE")

`noide`’s current features:

- File explorer tree view
- File operations (create/delete/rename files and directories)
- Syntax highlighted code tabbed code editing for multiple programming languages
- HTML/CSS/JS beautify
- Code folding
- Find/Find+Replace 
- JSLINT validation warning
- NPM integration (display currently installed packages, add/remove packages, install package dependencies)
- HTTP basic authentication (for running noide on a public server)
- Configurable documentation links
- Run/Debugging/Previewing

Built using:
============

- Node.js
- ACE Editor
- Bootstrap
- Backbone
- JQuery
- socket.io


*** WARNING ***:
================
If you'd like to try out this IDE that's great and thanks BUT USE CAUTION.
noide is in early stages & not thouroughly tested.

I started the IDE as a learning exercise for Backbone and Node.js
This is a pet project and I am no whizz programmer.

Ensure any code is backed up regularly.
I would not like it to be responsible for any work lost. 

Having said that the IDE seems fairly stable and robust and is a 
workable lightweight tool for Node.js, HTML5/CSS/JS development.

![debugger](https://raw.github.com/davidjamesstone/noide/gh-pages/images/Untitled2.jpg "debugger")

Dependencies:
=============
- Node.js
- Node packages (express, ejs, ejs-locals, rimraf & socket.io)

Optional
=========================
- node-inspector

OS Platforms/Browsers
=========================
- Tested on Ubuntu Linux and Windows 7
- Tested using Chrome, Firefox, Safari & IE9

Note: integrated debugging uses web inspector plugin available on webkit based browsers Chrome, Safari, Opera.

Instructions
============

Clone the repository into a folder of your choice ([noide-install-dir]).

Once complete, entering

    node app

from the [noide-install-dir] should be enough to get the web app up and running.


noide runs on port 2424. Use http://localhost:2424?path=your_directory_path to open the IDE in the specified path.

E.g.

http://localhost:2424?path=/root/projects/node

OR

http://localhost:2424?path=c:\projects\node



http://localhost:2424 should bring up your Projects Landing Page.

By default this is set to /[noide-install-dir]/noide/projects.

To change this and other settings you use a noide.json configuration file.


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

License
=======

Nide is released under a **MIT License**:

    Copyright (C) 2013 by David Stone
    
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
