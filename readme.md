
noide
====

`noide` is a web-based code editor built using Node.js.

It's a useful, lightweight editor that runs in the browser.

This version is a fork that has `config/server.json` configured to 0.0.0.0 (so it servers the network) and the port configured to 80, so it is the default web app. Next to to that there were some bugs where the filename was passed as an object in `client/session.js` and `server/views/index.html` didn't include `ext-modelist.js`

Instructions
============

cd into the directory you want noide installed, I use `/home/pi`

`git clone https://github.com/rkristelijn/noide.git`

Then cd to the directory you want to edit and execute, say it is `/home/lean-mean`

`sudo node ../noide/index.js`

Now point your browser to http://<hostname>/

You should see a page something like this:

![ide](https://raw.githubusercontent.com/davidjamesstone/noide/master/screenshot.png "IDE")

in the console you can start both node and angular/cli from the lean-mean application using

`npm start`

`nodemon server.js`

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
