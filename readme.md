
Noide
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

Config & Arguments
==================
You should edit settings in `config/server.json`. However, in case you want to run multiple instances of noide, you can add the following arguments:

@since 0.2.0 (03-JAN-2018)

* `--port <portnr>` e.g. `--port 81`
* `--host <ip>` e.g. `--host 0.0.0.0`

Note: by default the server starts serving only for localhost (host=127.0.0.1) on port 3000. If you want to serve on lower ports, such as 80 and to the network, use:

`sudo node index.js --port 80 --host 0.0.0.0`

Keyboard shortcuts
==================

| PC (Windows/Linux)         | Mac                                      | action                                                              |
|----------------------------|------------------------------------------|---------------------------------------------------------------------|
| Ctrl-S,                    | Command-S,                               | Save the current file                                               |
| Ctrl-Shift-S,              | Command-Option-S,                        | Save all files                                                      |
| Ctrl-B,                    | Command-B,                               | Beautify (js, css, html files only)                                 |
| Ctrl-,                     | Command-,                                | Show the settings menu                                              |
| Ctrl-Alt-Up                | Ctrl-Option-Up                           | add multi-cursor above                                              |
| Ctrl-Alt-Down              | Ctrl-Option-Down                         | add multi-cursor below                                              |
| Ctrl-Alt-Right             | Ctrl-Option-Right                        | add next occurrence to multi-selection                              |
| Ctrl-Alt-Left              | Ctrl-Option-Left                         | add previous occurrence to multi-selection                          |
|                            | Ctrl-L                                   | center selection                                                    |
| Ctrl-Shift-U               | Ctrl-Shift-U                             | change to lower case                                                |
| Ctrl-U                     | Ctrl-U                                   | change to upper case                                                |
| Alt-Shift-Down             | Command-Option-Down                      | copy lines down                                                     |
| Alt-Shift-Up               | Command-Option-Up                        | copy lines up                                                       |
| Delete                     |                                          | delete                                                              |
| Ctrl-Shift-D               | Command-Shift-D                          | duplicate selection                                                 |
| Ctrl-F                     | Command-F                                | find                                                                |
| Ctrl-K                     | Command-G                                | find next                                                           |
| Ctrl-Shift-K               | Command-Shift-G                          | find previous                                                       |
| Alt-0                      | Command-Option-0                         | fold all                                                            |
| Alt-L, Ctrl-F1             | Command-Option-L, Command-F1             | fold selection                                                      |
| Down                       | Down, Ctrl-N                             | go line down                                                        |
| Up                         | Up, Ctrl-P                               | go line up                                                          |
| Ctrl-End                   | Command-End, Command-Down                | go to end                                                           |
| Left                       | Left, Ctrl-B                             | go to left                                                          |
| Ctrl-L                     | Command-L                                | go to line                                                          |
| Alt-Right, End             | Command-Right, End, Ctrl-E               | go to line end                                                      |
| Alt-Left, Home             | Command-Left, Home, Ctrl-A               | go to line start                                                    |
| Ctrl-P                     |                                          | go to matching bracket                                              |
| PageDown                   | Option-PageDown, Ctrl-V                  | go to page down                                                     |
| PageUp                     | Option-PageUp                            | go to page up                                                       |
| Right                      | Right, Ctrl-F                            | go to right                                                         |
| Ctrl-Home                  | Command-Home, Command-Up                 | go to start                                                         |
| Ctrl-Left                  | Option-Left                              | go to word left                                                     |
| Ctrl-Right                 | Option-Right                             | go to word right                                                    |
| Tab                        | Tab                                      | indent                                                              |
| Ctrl-Alt-E                 |                                          | macros recording                                                    |
| Ctrl-Shift-E               | Command-Shift-E                          | macros replay                                                       |
| Alt-Down                   | Option-Down                              | move lines down                                                     |
| Alt-Up                     | Option-Up                                | move lines up                                                       |
| Ctrl-Alt-Shift-Up          | Ctrl-Option-Shift-Up                     | move multicursor from current line to the line above                |
| Ctrl-Alt-Shift-Down        | Ctrl-Option-Shift-Down                   | move multicursor from current line to the line below                |
| Shift-Tab                  | Shift-Tab                                | outdent                                                             |
| Insert                     | Insert                                   | overwrite                                                           |
| Ctrl-Shift-Z, Ctrl-Y       | Command-Shift-Z, Command-Y               | redo                                                                |
| Ctrl-Alt-Shift-Right       | Ctrl-Option-Shift-Right                  | remove current occurrence from multi-selection and move to next     |
| Ctrl-Alt-Shift-Left        | Ctrl-Option-Shift-Left                   | remove current occurrence from multi-selection and move to previous |
| Ctrl-D                     | Command-D                                | remove line                                                         |
| Alt-Delete                 | Ctrl-K                                   | remove to line end                                                  |
| Alt-Backspace              | Command-Backspace                        | remove to linestart                                                 |
| Ctrl-Backspace             | Option-Backspace, Ctrl-Option-Backspace  | remove word left                                                    |
| Ctrl-Delete                | Option-Delete                            | remove word right                                                   |
| Ctrl-R                     | Command-Option-F                         | replace                                                             |
| Ctrl-Shift-R               | Command-Shift-Option-F                   | replace all                                                         |
| Ctrl-Down                  | Command-Down                             | scroll line down                                                    |
| Ctrl-Up                    |                                          | scroll line up                                                      |
|                            | Option-PageDown                          | scroll page down                                                    |
|                            | Option-PageUp                            | scroll page up                                                      |
| Ctrl-A                     | Command-A                                | select all                                                          |
| Ctrl-Shift-L               | Ctrl-Shift-L                             | select all from multi-selection                                     |
| Shift-Down                 | Shift-Down                               | select down                                                         |
| Shift-Left                 | Shift-Left                               | select left                                                         |
| Shift-End                  | Shift-End                                | select line end                                                     |
| Shift-Home                 | Shift-Home                               | select line start                                                   |
| Shift-PageDown             | Shift-PageDown                           | select page down                                                    |
| Shift-PageUp               | Shift-PageUp                             | select page up                                                      |
| Shift-Right                | Shift-Right                              | select right                                                        |
| Ctrl-Shift-End             | Command-Shift-Down                       | select to end                                                       |
| Alt-Shift-Right            | Command-Shift-Right                      | select to line end                                                  |
| Alt-Shift-Left             | Command-Shift-Left                       | select to line start                                                |
| Ctrl-Shift-P               |                                          | select to matching bracket                                          |
| Ctrl-Shift-Home            | Command-Shift-Up                         | select to start                                                     |
| Shift-Up                   | Shift-Up                                 | select up                                                           |
| Ctrl-Shift-Left            | Option-Shift-Left                        | select word left                                                    |
| Ctrl-Shift-Right           | Option-Shift-Right                       | select word right                                                   |
|                            | Ctrl-O                                   | split line                                                          |
| Ctrl-/                     | Command-/                                | toggle comment                                                      |
| Ctrl-T                     | Ctrl-T                                   | transpose letters                                                   |
| Ctrl-Z                     | Command-Z                                | undo                                                                |
| Alt-Shift-L, Ctrl-Shift-F1 | Command-Option-Shift-L, Command-Shift-F1 | unfold                                                              |
| Alt-Shift-0                | Command-Option-Shift-0                   | unfold all                                                          |
| Ctrl-Enter                 | Command-Enter                            | enter full screen                                                   |

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
