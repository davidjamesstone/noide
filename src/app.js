var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('static-favicon');
var httpLogger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./lib/routes');
var middleware = require('./lib/middleware');
var sockets = require('./lib/sockets');

var app = express();

/*
 *  Configure express application
 */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'vash');

if (process.env.NODE_ENV === 'production') {
  app.enable('view cache');
} else {
  app.disable('view cache');
}
app.disable('x-powered-by');
app.enable('verbose errors');

/*
 * Express application middleware
 */
app.use(cookieParser());
app.use(httpLogger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname, 'public'), {
maxAge: 300000
}));
app.use(middleware.cacheHeader);

/*
 * Register routes
 */
app.get('/', routes.ide);
app.get('/header/:workspaceId', routes.header);
app.get('/ide', routes.ide);
app.get('/ide/:workspaceId', routes.ide);
app.get('/workspace/:id', routes.workspace);
app.get('/editor', routes.editor);
app.get('/tab', routes.tab);

/*
 * Register error handling middleware
 */
app.use(middleware._404);
app.use(middleware._500);


/*
 * Initialize Server
 */
var server = http.Server(app);

/*
 * Register socket endpoints
 */
sockets(server);


module.exports = server;
