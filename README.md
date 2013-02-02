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

To actually turn the on:

    heroku ps:scale web=1
    
And to turn it off:

    heroku ps:scale web=0