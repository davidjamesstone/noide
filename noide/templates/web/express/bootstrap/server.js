// requires
var express = require('express');
var http = require('http');
var path = require('path');

// global ns
app = express();

// configure
app.configure(function() {
  app.use(express.cookieParser());
  app.use(express.session({
    secret: '5up3453c43t',
    key: 'sid'
  }));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.compress());
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
  app.use(express.logger('dev'));
  app.use(express.errorHandler());
});

process.on('uncaughtException', function(err) {
  console.error(err.stack);
});


// start server listening
var port = process.env.PORT || 3000;
var server = http.createServer(app);
server.listen(port, function() {
  console.log('Listening on ' + port);
});
