noide
====

`noide` is a web-based IDE for Node.js.

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
=========================

- Node.js
- ACE Editor
- Bootstrap
- Backbone
- JQuery

Dependencies:
=========================
- Node.js

Optional
=========================
- node-inspector


Instructions
============

Clone the repository and enter

    node app

from the directory is enough to get up and running.

noide runs on port 2424

http://localhost:2424 should bring up the Projects Landing Page.
By default this is set to /noide/noide/projects.

To change this and other settings you use a noide.json configuration file.


Configuration
=======
The noide.json file is non-mandatory, however if present (in the root of noide install directory) it will 
will hold the IDE settings. See the 



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
