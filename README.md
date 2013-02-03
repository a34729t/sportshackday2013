#sportshackday2013

Sports Hack Day Project 2013, Superbowl

## Proof of Concept

1. Simple socket.io script that takes clients and pushes info to them when a url on server-side is called.

Run the server by typing:

    node app.js

In one browser window:

    http://localhost:8000/
    
In other browser window:

    http://localhost:8000/update

2. When client votes, push event to server

## Deploying on Heroku

To push changes:

    git push heroku master

To actually turn the on (doesn't need to be re-turned on):

    heroku ps:scale web=1
    
And to turn it off:

    heroku ps:scale web=
    
## Mongo

Locally, to load the data into a db 'player_info' and a collection 'players', with a file 'resources/dump.json':

    mongoimport -d player_info -c players resources/dump.json    

To dump that data into Heroku, see the link

    https://www.mongolab.com/databases/heroku_app11534851#importexport

You'll have a command like:

mongoimport -h ds041367.mongolab.com:41367 -d heroku_app11534851 -c players -u [username] -p [password] --file resources/dump.json

## Changing Data Source

Use url:

    http://localhost:8000/setSource

And put the following in the text box:

    http://localhost:8000/js/plays_1.xml

## Design Notes

Global vars/settings are in config.js

DB Calls are in dblayer.js