var fs = require('fs'),
xml2js = require('xml2js');
var http = require('http');
var test = false;

//var sourceUrl = 'http://api.sportsdatallc.org/nfl-t1/2011/PST/4/NYG/NE/pbp.xml?api_key=4w4fdbpap45bsmmtx4qkghv5';
var sourceUrl = 'http://juicebowl.herokuapp.com/js/plays_1.xml'

exports.setTest = function(useTest) {
    test = useTest;

}

exports.setSource = function(newUrl) { 
    sourceUrl = newUrl;
    console.log("Changing Source");
};


exports.getLastPlayer = function(callback) {

    //options = host: 'api.sportsdatallc.org',
      //  path: '/nfl-t1/2011/PST/4/NYG/NE/pbp.xml?api_key=4w4fdbpap45bsmmtx4qkghv5'};

    var request = http.get(sourceUrl);
    console.log("Fetching from source URL...")
    request.on('response', function (response) {
        var body = '';
        response.on('data', function (chunk) {
            body += chunk;
        });
        response.on('end', function () {
            var parser = new xml2js.Parser();
            parser.parseString(body, function (err, result) {
                if(!result) return closeRequest(request);
                var game = result.game;
                if(!game || !game.quarter) return closeRequest(request);
                var currentQuarter = game.quarter[game.quarter.length-1];
                if(!currentQuarter || !currentQuarter.drive) return closeRequest(request);
                var lastDrive = currentQuarter.drive[currentQuarter.drive.length-1];
                if(!lastDrive || !lastDrive.play)  return closeRequest(request);
                var lastPlay = lastDrive.play[lastDrive.play.length-1];
                if(!lastPlay)  return closeRequest(request);
                var participants = lastPlay.participants[0];
                if(!participants)  return closeRequest(request);
                var model = {};
                model.playId = lastPlay.$.id;
                model.players = new Array();
                for(var i = 0; i < participants.player.length; i++) {
                    //console.log(participants.player[i].$);
                    model.players[i] = participants.player[i].$;
                }

                callback(model);
            });
        });
    });
    request.end();


}

function closeRequest(request) {
    request.end();
}