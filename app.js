var alexa = require('alexa-app');
var app = new alexa.app('tivo_control');
var config = require("./config.json");
var route = config.route || "/";
var port = config.port || "80";
var express = require('express');

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

app.express(express_app, route, false);