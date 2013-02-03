var dbName;
if (process.env.MONGOLAB_URI || process.env.MONGOHQ_URL) // Basically, if we are usinging MongoLab on Heroku
  dbName = "heroku_app11534851";
else
  dbName = "player_info"
  
exports.updateInterval = 10000; // ms
exports.port = process.env.PORT || 8000;
exports.dbName;
exports.collectionName = "players";