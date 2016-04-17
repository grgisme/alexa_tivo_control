var alexa = require('alexa-app');
var app = new alexa.app('tivo_control');

app.intent('SendCommand',
    {
        "slots":{"command":"COMMAND"}
        ,"utterances":[ "say the command {1-100|command}" ]
    },
    function(request,response) {
        var command = request.slot('command');
        response.say("You said the command "+command);
    }
);

// Manually hook the handler function into express 
express.post('/tivo_control',function(req,res) {
    app.request(req.body)        // connect express to alexa-app
        .then(function(response) { // alexa-app returns a promise with the response
            res.json(response);      // stream it to express' output
        });
});