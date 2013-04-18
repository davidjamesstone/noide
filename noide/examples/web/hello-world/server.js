var http = require('http');
http.createServer(function (req, res) {
  console.log('Hello World');
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(1337);
console.log('Server running at :1337/');