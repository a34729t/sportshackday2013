// Basic idea:
// Present users with a vote page with two pictures of player, and the results
// of the previous poll. We use socket.io to handle browser push.

var port = process.env.PORT || 8000;
var url = require('url');
var app = require('http').createServer(handler).listen(port);
var io = require('socket.io').listen(app)
var fs = require('fs');
var parser = require('./liveDataParser.js');
var mongo = require('mongodb');


// <MongoDB Stuff>

// To use mongodb on heroku:
//  see: https://devcenter.heroku.com/articles/nodejs#using-mongodb
var mongoUri = process.env.MONGOLAB_URI || 
              process.env.MONGOHQ_URL || 
              'mongodb://127.0.0.1/things';
  
// We make a global var testData for the test data
var db;
mongo.Db.connect(mongoUri, function (err, dbHandle) {
  if (err) console.log("mongo err");
  db = dbHandle;
});

// </MongoDB Stuff>
  

function handler (req, res) {
  var pathname = url.parse(req.url).pathname;
  
  // Here is where we handle routing. Because we only have 3 routes
  // it is easier and faster to use the basic node.js http server
  // instead of relying on express.
  if (pathname === '/update') {
    // Dumb Attempt: Fetch Joe Flacco from MongoDB
    var findName = "Joe Flacco";
    db.collection('things').findOne({name: findName}, function(error, result) {
      if( error ) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Error with db get!\n');
      }
      else {
        // Update all clients with data
        result.numclients = numclients; // not necessary
        io.sockets.emit('update', result);
        
        res.writeHead(200, {'Content-Type': 'text/css'});
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Updated:'+JSON.stringify(result)+'\n');
      }
    });
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

var numclients = 0; // Note: Socket.io client timeouts are 25 seconds by default
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

  socket.emit('news', { hello: 'world' });
  numclients++;
  io.sockets.emit('count', { numclients: numclients });
  
  socket.on('vote', function(data) {
    //console.log('Client just sent:', data);
    if (data.bigger) {
      db.collection('things').update({name: data.id}, {$inc: { voteYes: 1 } }, {safe:true}, function(err, result) {});
    } else {
      db.collection('things').update({name: data.id}, {$inc: { voteNo: 1 } }, {safe:true}, function(err, result) {});
    }
  });

  socket.on('disconnect', function() {
    console.log('Bye client :(');
    numclients--;
    io.sockets.emit('count', { numclients: numclients });
  }); 

parser.getLastPlayer(lastPlayersReceived);

function lastPlayersReceived(model) {
    console.log("we got " + model.players.length + " players back for play: " + model.playId);
}