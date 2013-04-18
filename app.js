// requires
var express = require('express');
app = express();
var server = require('http').createServer(app),
  io = require('socket.io').listen(server),
  path = require('path'),
  fs = require('fs'),
  path = require('path'),
  ejs = require('ejs-locals'),
  childprocs = require('./lib/childprocs');
// noide config
var noideConfig = {};
if (fs.existsSync('./noide.json')) {
  noideConfig = require('./noide.json');
}
// set up default prj dir - used in the absence of a 'path' query string
if (!noideConfig.projectsDir) noideConfig.projectsDir = path.join(__dirname, 'noide/projects');
if (!noideConfig.framesUrl1) noideConfig.framesUrl1 = "http://localhost:3000";
if (!noideConfig.framesUrl2) noideConfig.framesUrl2 = "http://localhost:8080/debug?port=5858";

app.set('noideConfig', noideConfig);
// initialize locals
app.locals({
  metaTitle: 'Node.js  IDE',
  templates: fs.readFileSync('./public/html/templates.html')
});
// register .html extension
app.engine('html', ejs);
// configure
var port = process.env.PORT || 2424;
var sessionStore = new express.session.MemoryStore({
  reapInterval: 60000 * 10
});
app.configure(function() {
  app.set('port', port);
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'html');
  app.use(express.cookieParser());
  app.use(express.session({
    store: sessionStore,
    secret: '5up3453c43t',
    key: 'sid'
  }));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.favicon());
  app.use(express.compress());
  if (noideConfig.users) {
    app.use(express.basicAuth(function(user, pass, callback) {
      callback(null, noideConfig.users[user] == pass);
    }));
  }
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});
app.configure('development', function() {
  app.use(express.logger('dev'));
  app.use(express.errorHandler());
});
process.on('uncaughtException', function(err) {
  console.error(err.stack);
});
// routing
require('./lib/routing').configure();
// initialize server / start listening
server.listen(port, function() {
  console.log('Listening on ' + port);
});
// child processes
childprocs.connect(io, sessionStore);
app.set('childprocs', childprocs);