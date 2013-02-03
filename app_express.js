// Basic idea:
// Present users with a vote page with two pictures of player, and the results
// of the previous poll. We use socket.io to handle browser push.

var url = require('url');
var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app)
var fs = require('fs');
var mongo = require('mongodb');
var parser = require('./liveDataParser.js');
var config = require('./config'); // global vars and that kind of stuff

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
  

// <Express>

// simple logger
app.use(function(req, res, next){
  console.log('%s %s', req.method, req.url);
  next();
});
app.get('/setDataSource', function(req, res) {
    if(req.query.useTest == 'true')
        parser.setTest(req.query.useTest);

    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Updated to : ' + (req.query.useTest == 'true' ? 'test' : 'production'));
});

app.get('/update', function(req, res){
    if("playerName" in req.query)
        update(req.query.playerName);
    else
        update("Joe Flacco");

    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Updated:'+JSON.stringify(result)+'\n');
});

app.get('/', function(req, res){
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    } else {
      res.writeHead(200);
      res.end(data);
    }
  });
});

//set source 
app.get('/setSource', function(req, res){
  fs.readFile(__dirname + '/setSource.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
});

app.post('/saveSource', express.bodyParser(), function(req, res){
  //var u = req.param('url', null);
  console.log(req.body);
  parser.setSource(req.body.url);
  res.contentType('json');
  res.send({});

  //res.body.url 
});


app.use(express.static(__dirname + '/assets'));
app.listen(config.port);





// <Express>

// Heroku setting for long polling
io.configure(function () { 
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 10); 
});

var player2VoteYes = {}
var player2VoteNo = {}

var numclients = 0; // Note: Socket.io client timeouts are 25 seconds by default
io.sockets.on('connection', function(socket){
  socket.emit('news', { hello: 'world' });
  numclients++;
  io.sockets.emit('count', { numclients: numclients });
  
  socket.on('vote', function(data) {
    //console.log('Client just sent:', data);
    if (!db) {
      // Local testing mode:
      console.log("data.bigger="+data.bigger);
      if (data.bigger) {
        if (data.id in player2VoteYes)
          player2VoteYes[data.id] += 1;
        else
          player2VoteYes[data.id] = 1
        io.sockets.emit('updateVote', { bigger: data.bigger, count: player2VoteYes[data.id] });
      } else {
        if (data.id in player2VoteNo) {
          player2VoteNo[data.id] += 1;
        } else {
          player2VoteNo[data.id] = 1
        }
        console.log("player2VoteNo = ", player2VoteNo[data.id]);
        io.sockets.emit('updateVote', { bigger: data.bigger, count: player2VoteNo[data.id] });
      }
      
    } else {
      if (data.bigger) {
        db.collection('things').update({name: data.id}, {$inc: { voteYes: 1 } }, {safe:true}, function(err, result) {});
        if (data.id in player2VoteYes)
          player2VoteYes[data.id] += 1;
        else
          player2VoteYes[data.id] = 1
        io.sockets.emit('updateVote', { bigger: data.bigger, count: player2VoteYes[data.id] });
      } else {
        db.collection('things').update({name: data.id}, {$inc: { voteNo: 1 } }, {safe:true}, function(err, result) {});
        if (data.id in player2VoteNo) {
          player2VoteNo[data.id] += 1;
        } else {
          player2VoteNo[data.id] = 1
        }
        console.log("player2VoteNo = ", player2VoteNo[data.id]);
        io.sockets.emit('updateVote', { bigger: data.bigger, count: player2VoteNo[data.id] });
      }
    }
  }); 
  socket.on('disconnect', function() {
    console.log('Bye client :(');
    numclients--;
    io.sockets.emit('count', { numclients: numclients });
  }); 
});

function update(playerName) {
    // Dumb Attempt: Fetch Joe Flacco from MongoDB

    if (!db) {
        // Local testing mode:
        result = {
            name: playerName,
            image1 : "/players/ajjenkingsnew.jpg",
            image2 : "/players/ajjenkingsold.jpg",
            voteYes : 0,
            voteNo : 0
        };
        
        if (playerName in player2VoteYes)
          result.voteYes = player2VoteYes[playerName];
        if (playerName in player2VoteNo)
          result.voteNo = player2VoteNo[playerName];
            
        io.sockets.emit('update', result);
    } else {
        db.collection('things').findOne({name: playerName}, function(error, result) {
            if( error ) {
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end('Error with db get!\n');
            }
            else {
                // Update all clients with data
                result.numclients = numclients; // not necessary
                io.sockets.emit('update', result);


            }
        });
    }
};

setInterval(function() {
    console.log('updating!');
    console.log('player2VoteYes:'+JSON.stringify(player2VoteYes));
    console.log('player2VoteNo:'+JSON.stringify(player2VoteNo));
    parser.getLastPlayer(onPlayersReceived);
}, config.updateInterval);

var lastPlay = "";
function onPlayersReceived(model) {

    if(model.playId == lastPlay)
        return;

    lastPlay = model.playId

    var playerName = model.players[0].name;
    console.log('updating to ' + playerName);

    update(playerName);
};