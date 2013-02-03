var mongo = require('mongodb');
var config = require('./config'); // global vars and that kind of stuff

// To use mongodb on heroku:
//  see: https://devcenter.heroku.com/articles/nodejs#using-mongodb
var mongoUri = process.env.MONGOLAB_URI || 
              process.env.MONGOHQ_URL || 
              'mongodb://127.0.0.1/player_info/';

// We make a global var testData for the test data
var db;
console.log(mongoUri)
mongo.Db.connect(mongoUri, function (err, dbHandle) {
  if (err) console.log("mongo err");
      db = dbHandle;
/*  dbHandle.collection("players", function(err, collection){

   collection.find().count(function(e, count){
      console.log(count);
     });
  });
*/
  //console.log(db.collection('players').count())
});


function updateYesVote (playerName, callback) {
  db.collection(config.collectionName).update({name: playerName}, {$inc: { voteYes: 1 } }, {safe:true}, function(err, result) {
    callback(err);
  });
}

function updateNoVote (playerName, callback) {
  db.collection(config.dbName).update({name: playerName}, {$inc: { voteNo: 1 } }, {safe:true}, function(err, result) {
    callback(err);
  });
}

function findPlayer (playerName, callback) {
  db.collection(config.collectionName).findOne({name_full: playerName}, function(error, result) {
    callback(error, result);
  });
}

function updateAppearances (playerName, callback) {
  db.collection(config.collectionName).update({name_full: playerName}, {$inc: { appearances: 1 } }, {safe:true}, function(err, result) {
    callback(error);
  });
}

// Reset app - zero appearances and votes
function resetAppearancesAndVotes (callback) {
  db.collection(config.collectionName).update({}, { appearances: 0, votesYes: 0, votesNo: 0 }, {safe:true}, function(err, result) {
    callback(error);
  });
}

exports.db;
exports.updateYesVote;
exports.updateNoVote;
exports.findPlayer;
exports.updateAppearances;
exports.resetAppearancesAndVotes;