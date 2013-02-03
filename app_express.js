// Basic idea:
// Present users with a vote page with two pictures of player, and the results
// of the previous poll. We use socket.io to handle browser push.

var url = require('url');
var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app)
var fs = require('fs');
var parser = require('./liveDataParser.js');
var config = require('./config'); // global vars and that kind of stuff
var dblayer = require('./dblayer'); //  db access layer  

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
    if("playerName" in req.query) {
        update(req.query.playerName, function(err) {
          if (!err) {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Updated:'+JSON.stringify(result)+'\n');
          } else {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('Update error:'+err+'\n');
          }
        });
    } else {
        update("Joe Flacco", function(err) {
          if (!err) {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Updated:'+JSON.stringify(result)+'\n');
          } else {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Update error:'+err+'\n');
          }
        });
    }
});

app.get('/rank', function(req, res){
  fs.readFile(__dirname + '/rank.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    } else {
      res.writeHead(200);
      res.end(data);
      // do db query and get ranked users
      
      if (!dblayer.hasDb) {
        // Local testing mode:
        player0 = {
          name: playerName,
          image1 : "/players/ajjenkingsnew.jpg",
          image2 : "/players/ajjenkingsold.jpg",
          voteYes : 2,
          voteNo : 1
        };
        player1 = {
          name: playerName,
          image1 : "/players/ajjenkingsnew.jpg",
          image2 : "/players/ajjenkingsold.jpg",
          voteYes : 4,
          voteNo : 1
        };
        player2 = {
          name: playerName,
          image1 : "/players/ajjenkingsnew.jpg",
          image2 : "/players/ajjenkingsold.jpg",
          voteYes : 2,
          voteNo : 2
        };
        result = [player0, player1, player3];

        sortRank(result, function(sortedResult) {
          io.sockets.emit('rank', { data: sortedResult });
        });
      } else {
        db.collection(config.dbName).findOne({name: playerName}, function(error, result) {
          if( error ) {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Error with db get!\n');
          } else {
            // Print rankings!
            
            // TODO: What is the correct sort?
            
            sortRank(result, function(sortedResult) {
              io.sockets.emit('rank', { data: sortedResult });
            });
          }
        });
      }
    }
  });
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
  startUpdate();

  socket.emit('update', lastModel);
  numclients++;
  io.sockets.emit('count', { numclients: numclients });
  
  socket.on('vote', function(data) {
    var playerName = data.id;
    
    //console.log('Client just sent:', data);
    if (!dblayer.hasDb) {
      // Local testing mode:
      console.log("data.bigger="+data.bigger);
      if (data.bigger) {
        if (playerName in player2VoteYes)
          player2VoteYes[playerName] += 1;
        else
          player2VoteYes[playerName] = 1
        io.sockets.emit('updateVote', { bigger: data.bigger, count: player2VoteYes[playerName] });
      } else {
        if (playerName in player2VoteNo) {
          player2VoteNo[playerName] += 1;
        } else {
          player2VoteNo[playerName] = 1
        }
        console.log("player2VoteNo = ", player2VoteNo[playerName]);
        io.sockets.emit('updateVote', { bigger: data.bigger, count: player2VoteNo[playerName] });
      }
      
    } else {
      if (data.bigger) {
        dblayer.updateYesVote(playerName, function(err){});
        if (playerName in player2VoteYes)
          player2VoteYes[playerName] += 1;
        else
          player2VoteYes[playerName] = 1
        io.sockets.emit('updateVote', { bigger: data.bigger, count: player2VoteYes[playerName] });
      } else {
        dblayer.updateNoVote(playerName, function(err){});
        if (playerName in player2VoteNo) {
          player2VoteNo[playerName] += 1;
        } else {
          player2VoteNo[playerName] = 1
        }
        console.log("player2VoteNo = ", player2VoteNo[playerName]);
        io.sockets.emit('updateVote', { bigger: data.bigger, count: player2VoteNo[playerName] });
      }
    }
  }); 
  socket.on('disconnect', function() {
    console.log('Bye client :(');
    numclients--;
    io.sockets.emit('count', { numclients: numclients });
  }); 
});

function update(playerName, callback) {
    // Dumb Attempt: Fetch Joe Flacco from MongoDB

    if (!dblayer.hasDb) {
        // Local testing mode:
        var result = {
            name: playerName,
            image1 : "/players/ajjenkinsnew.png",
            image2 : "/players/ajjenkinsold copy.png",
            voteYes : 0,
            voteNo : 0
        };
        
        if (playerName in player2VoteYes)
          result.voteYes = player2VoteYes[playerName];
        if (playerName in player2VoteNo)
          result.voteNo = player2VoteNo[playerName];

        lastModel = result;
        io.sockets.emit('update', result);
        return null;
    } else {
        dblayer.findPlayer(playerName, function(err, result){
            if( err ) {
                return (err);
            }
            else { 
      
                if(result!=null){// Update all clients with data      
              //  result.numclients = numclients; // not necessary
              var lowerName = result.name_full.toLowerCase().replace(' ', ''); 
              
              console.log("update player db data: "+ JSON.stringify(result));
              console.log("");
              
              var voteYes = 0;
              if (voteYes in result)
                voteYes = result.voteYes;
                
              var voteNo = 0;
              if (voteNo in result)
                voteNo = result.voteNo;
              

                var model = {
                  name: result.name_full,
                  image1: "/players/" + lowerName + "new.png",
                  image2: "/players/" + lowerName + "old.png",
                  voteYes: voteYes,
                  voteNo: voteNo,
                  appearances: result.appearances
                };
                lastModel = model;
                console.log(model);
                io.sockets.emit('update', model);
                
                // increment player's appearance count in db
                dblayer.updateAppearances(playerName, function(err){});
              }
                return null;
            }
        });
    }
};

setInterval(startUpdate, config.updateInterval);

function startUpdate() {
    console.log('updating!');
    console.log('player2VoteYes:'+JSON.stringify(player2VoteYes));
    console.log('player2VoteNo:'+JSON.stringify(player2VoteNo));
    parser.getLastPlayer(onPlayersReceived);
};

var lastPlay = "";
var lastModel = {};
function onPlayersReceived(model) {

    if(model.playId == lastPlay)
        return;

    lastPlay = model.playId
    var playerName = model.players[0].name;
    console.log('updating to ' + playerName);

    update(playerName);
};

function sortRank(result, callback ) {
  // TODO: Rank is broken
  for (var i in result) {
    alert(result[i]);
  }
}
