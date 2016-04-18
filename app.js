var alexa = require('alexa-app');
var config = require("./config.json");
var route = config.route || "tivo_control";
var port = process.env.port || config.port || 8080;
var bodyParser = require('body-parser');
var express = require('express');

var express_app = express();
express_app.use(bodyParser.urlencoded({ extended: true }));
express_app.use(bodyParser.json());
express_app.set('view engine','ejs');



var app = new alexa.app(route);

app.launch(function(request,response) {
    response.say("Welcome to Tivo Control");
});

app.intent('Pause', function(request,response) {
        console.log("PAUSING PAUSING PAUSING PAUSING PAUSING PAUSING");
        response.say("You told me to pause.");
    }
);

app.intent('Play', function(request,response) {
        response.say("You told me to play.");
    }
);

// Manually hook the handler function into express
express_app.post('/'+route,function(req,res) {
    app.request(req.body)        // connect express to alexa-app
        .then(function(response) { // alexa-app returns a promise with the response
            res.json(response);      // stream it to express' output
        });
});

app.express(express_app, "/", true);

if ((process.argv.length === 3) && (process.argv[2] === 'schema'))  {
    console.log (app.schema ());
    console.log (app.utterances ());
}

express_app.listen(port);