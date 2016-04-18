var alexa = require('alexa-app');
var config = require("./config.json");
var route = config.route || "tivo_control";
var port = config.port || "80";
var express = require('express');

var app = new alexa.app(route);

app.launch(function(request,response) {
    response.say("Welcome to Tivo Control");
});

app.intent('pause', function(request,response) {
        response.say("You told me to pause.");
    }
);

app.intent('play', function(request,response) {
        response.say("You told me to play.");
    }
);

var express_app = express();
express_app.listen(port);

app.express(express_app, "/", true);