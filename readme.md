
noide
====

`noide` is a web-based code editor built using Node.js.

It's a useful, lightweight editor that runs in the browser.

Instructions
============

`npm install noide -g`

Then cd to the directory you want to edit and execute

`noide`

Now point your browser to http://localhost:3000/

You should see a page something like this:

![ide](https://raw.githubusercontent.com/davidjamesstone/noide/master/screenshot.png "IDE")


*** WARNING ***
================
If you'd like to try out this IDE that's great BUT USE CAUTION.

Ensure any code is backed up regularly.
I would not like it to be responsible for any work lost.

Also, there is no authentication or security built in. That is left to you. Do not run on a publicly accessible server/port.


Features
========

`noide`’s current features:

- File explorer tree view
- File operations (create/delete/rename files and directories etc.)
- Syntax highlighted code editing for many programming languages
- Run simple shell commands and `npm run-script`s
- Find/Find+Replace
- [standardjs](standardjs.com) validation warnings and code formatting
- Emmet
- Code snippets
- Themeable

Built using:
============

- [Node.js](https://github.com/joyent/node)
- [ace editor](https://github.com/ajaxorg/ace)
- [Twitter Bootstrap](https://github.com/twbs/bootstrap)
- [superviews.js](https://github.com/davidjamesstone/superviews.js)
- [incremental-dom](http://google.github.io/incremental-dom)
- [Browserify](https://github.com/substack/node-browserify)
- [hapi](https://github.com/hapijs/hapi)
- [nes](https://github.com/hapijs/nes)


License
=======

noide is released under a **MIT License**:

Copyright (C) 2014-2016 by David Stone
