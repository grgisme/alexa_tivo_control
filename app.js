var alexa = require('alexa-app');
var app = new alexa.app('tivo_control');

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
express_app.listen(4568);

app.express(express_app, "/tivo_control", false);