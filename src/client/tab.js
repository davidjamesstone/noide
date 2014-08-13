window.app = angular.module('app', ['ui.bootstrap'], function($locationProvider) {
  $locationProvider.html5Mode(true);
});

/*
 * Register Controllers
 */
require('./controllers/tab');

/*
 * Register Directives
 */
require('./directives/select-on-focus');

/*
 * Register Common Services
 */
require('./services/dialog');
