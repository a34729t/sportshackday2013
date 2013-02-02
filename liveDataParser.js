var fs = require('fs'),
xml2js = require('xml2js');
var http = require('http');


exports.getLastPlayer = function(callback) {
    var options = { host: 'api.sportsdatallc.org',
        path: '/nfl-t1/2011/PST/4/NYG/NE/pbp.xml?api_key=yxz2mbqm2xgvfgvpskuybpdn'};

    var request = http.get(options);
    request.on('response', function (response) {
        var body = '';
        response.on('data', function (chunk) {
            body += chunk;
        });
        response.on('end', function () {
            var parser = new xml2js.Parser();
            parser.parseString(body, function (err, result) {
                var game = result.game;
                var currentQuarter = game.quarter[game.quarter.length-1];
                var lastDrive = currentQuarter.drive[currentQuarter.drive.length-1];
                var lastPlay = lastDrive.play[lastDrive.play.length-1];
                var participants = lastPlay.participants[0];

                var model = {};
                model.playId = lastPlay.$.id;
                model.players = new Array();
                for(var i = 0; i < participants.player.length; i++) {
                    console.log(participants.player[i].$);
                    model.players[i] = participants.player[i].$;
                }

                callback(model);
            });
        });
    });
    request.end();


}