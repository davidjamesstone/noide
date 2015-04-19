
noide
====

`noide`is a web-based code editor built using Node.js.

At it's core it's a useful, lightweight editor so you don't leave your browser to write code.

Thanks for taking a look. Any comments, feedback or support use [Twitter](https://twitter.com/node_ide).


Instructions
============

`npm install noide -g`

Then cd to the directory you want to edit and execute

`noide`

Now point your browser to http://localhost:3000/

You should see a page something like this:

![ide](https://raw.github.com/davidjamesstone/noide/gh-pages/images/1.jpg "IDE")

Command-h for keyboard shortcuts

*** WARNING ***:
================
If you'd like to try out this IDE that's great and thanks BUT USE CAUTION.

Ensure any code is backed up regularly.
I would not like it to be responsible for any work lost.

Also, there is no authentication or security built in. That is left to you. Do not run on a publicly accessible server/port.


Features
========

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

Built using:
============

- [Node.js](https://github.com/joyent/node)
- [ace editor](https://github.com/ajaxorg/ace)
- [Twitter Bootstrap](https://github.com/twbs/bootstrap)
- [Angular](https://github.com/angular/angular.js)
- [Browserify](https://github.com/substack/node-browserify)
- [socket.io](https://github.com/LearnBoost/socket.io)


Build
=====

To build `noide` you will need browserify and the less compiler installed:

`npm i browserify -g`

`npm i less -g`

Then it's `npm run build` in the directory you installed `noide` to.

This will compile the `js` and `less` files.
You will need to do this if you want to change the editors settings.

Settings
========
Settings for the editor can be found in `/src/client/editor/config.json`.
You can change all the settings of the actual code editor in there. E.g. indentation and theme.

All the theme names can be found on here [ACE Editor](http://ace.c9.io/build/kitchen-sink.html).

To change the bootstrap theme of `noide` itself you can find the less files in `public/less/`.
The `themes` directory contains two themes a light and dark one. Others can be downloaded
from [bootswatch.com](http://bootswatch.com/) or just create your own. Edit the `bootstrap.less`
file with the theme name and run the build.


Screenshots
===========

![ide](https://raw.github.com/davidjamesstone/noide/gh-pages/images/2.jpg "File System Editor Features")

Command-h for keyboard shortcuts
![ide](https://raw.github.com/davidjamesstone/noide/gh-pages/images/3.jpg "Keyboard Shortcuts")

![ide](https://raw.github.com/davidjamesstone/noide/gh-pages/images/4.jpg "Alternative themes")


Notes
=====
`noide` uses file system watching on the server and socket.io to sync the file system to the browser.
I haven't stress tested any of this and I know lot's of improvements could be made performance wise.

I wouldn't recommend editing projects with large folder structures just yet.
For this reason I decided to ignore the `node_modules` folder. 
You wont see this in the this folder in the explorer tree.


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
