// Basic idea:
// Present users with a vote page with two pictures of player, and the results
// of the previous poll. We use socket.io to handle browser push.

var port = process.env.PORT || 8000;
var url = require('url');
var app = require('http').createServer(handler).listen(port);
var io = require('socket.io').listen(app)
var fs = require('fs');

function handler (req, res) {
  var pathname = url.parse(req.url).pathname;
  
  // Here is where we handle routing. Because we only have 3 routes
  // it is easier and faster to use the basic node.js http server
  // instead of relying on express.
  if (pathname === '/update') {
    io.sockets.emit('update', {
        name: "Justin Smith",
        image1: "http://placekitten.com/g/200/300",
        image2: "http://placekitten.com/g/200/300"

    });
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Updated!\n');
  } else {
    // Show the index.html file (todo, load on startup only?)
    fs.readFile(__dirname + '/index.html',
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }
      res.writeHead(200);
      res.end(data);
    });
  }
}

// Heroku setting for long polling
io.configure(function () { 
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 10); 
});

io.sockets.on('connection', function(socket){
    socket.emit('news', { hello: 'world' });
    socket.on('vote', function(data) {
        console.log('Client just sent:', data); 
    }); 
    socket.on('disconnect', function() {
        console.log('Bye client :(');
    }); 
});

/*
// This is an interval timer firing every 1000ms
setInterval(function() {
  io.sockets.emit('news', {test: "xxx!"} );
}, 1000 );
*/