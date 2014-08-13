var p = require('path');
var filesystem = require('./file-system');
var watcher = require('./file-system-watcher');
var sessionManager = require('./session-manager');
var Editor = require('./editor');
var Session = require('./editor/session');

window.app = angular.module('app', ['ui.bootstrap']);

/*
 * Register Controllers
 */
require('./controllers/app');
require('./controllers/tree');

/*
 * Register Directives
 */
require('./directives/right-click');

/*
 * Register Common Services
 */
require('./services/dialog');

/*
 * Initialize Splitter
 */
require('./splitter');
