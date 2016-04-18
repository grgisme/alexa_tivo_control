var alexa = require('alexa-app');
var config = require("./config.json");
var route = config.route || "tivo_control";
var port = process.env.port || config.port || 8080;
var bodyParser = require('body-parser');
var express = require('express');
var net = require('net');

var express_app = express();
express_app.use(bodyParser.urlencoded({ extended: true }));
express_app.use(bodyParser.json());
express_app.set('view engine','ejs');


var app = new alexa.app(route);

app.launch(function(request,response) {
    response.say("Welcome to Tivo Control");
});

var IRCODE_COMMANDS = ["UP", "DOWN", "LEFT", "RIGHT", "SELECT", "TIVO", "LIVETV", "GUIDE", "INFO", "EXIT", "THUMBSUP", "THUMBSDOWN", "CHANNELUP", "CHANNELDOWN", "MUTE", "VOLUMEUP", "VOLUMEDOWN", "TVINPUT", "VIDEO_MODE_FIXED_480i", "VIDEO_MODE_FIXED_480p", "VIDEO_MODE_FIXED_720p", "VIDEO_MODE_FIXED_1080i", "VIDEO_MODE_HYBRID", "VIDEO_MODE_HYBRID_720p", "VIDEO_MODE_HYBRID_1080i", "VIDEO_MODE_NATIVE", "CC_ON", "CC_OFF", "OPTIONS", "ASPECT_CORRECTION_FULL", "ASPECT_CORRECTION_PANEL", "ASPECT_CORRECTION_ZOOM", "ASPECT_CORRECTION_WIDE_ZOOM", "PLAY", "FORWARD", "REVERSE", "PAUSE", "SLOW", "REPLAY", "ADVANCE", "RECORD", "NUM0", "NUM1", "NUM2", "NUM3", "NUM4", "NUM5", "NUM6", "NUM7", "NUM8", "NUM9", "ENTER", "CLEAR", "ACTION_A", "ACTION_B", "ACTION_C", "ACTION_D"];
var KEYBOARD_COMMANDS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "MINUS", "EQUALS", "LBRACKET", "RBRACKET", "BACKSLASH", "SEMICOLON", "QUOTE", "COMMA", "PERIOD", "SLASH", "BACKQUOTE", "SPACE", "KBDUP", "KBDDOWN", "KBDLEFT", "KBDRIGHT", "PAGEUP", "PAGEDOWN", "HOME", "END", "CAPS", "LSHIFT", "RSHIFT", "INSERT", "BACKSPACE", "DELETE", "KBDENTER", "STOP", "VIDEO_ON_DEMAND"];
var TELEPORT_COMMANDS = ["TIVO", "LIVETV", "GUIDE", "NOWPLAYING"];

app.dictionary = {"commands":["UP", "DOWN", "LEFT", "RIGHT", "SELECT", "TIVO", "THUMBSUP", "THUMBSDOWN", "CHANNELUP", "CHANNELDOWN", "MUTE", "VOLUMEDOWN", "VOLUMEUP", "TVINPUT", "OPTIONS", "RECORD", "DISPLAY", "DIRECTV", "ENTER", "CLEAR", "PLAY", "PAUSE", "SLOW", "FORWARD", "REVERSE", "STANDBY", "NOWSHOWING", "REPLAY", "ADVANCE", "DELIMITER", "GUIDE", "KBDUP", "KBDDOWN", "KBDLEFT", "KBDRIGHT", "PAGEUP", "PAGEDOWN", "HOME", "END", "SPACE", "BACKQUOTE", "SLASH", "PERIOD", "COMMA", "QUOTE", "SEMICOLON", "BACKSLASH", "RBRACKET", "LBRACKET", "EQUALS", "MINUS", "CAPS", "LSHIFT", "RSHIFT", "INSERT", "BACKSPACE", "DELETE", "KBDENTER", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]};

app.intent('SendCommand',
    {
        "slots":{"TIVOCOMMAND":"LITERAL"},
        "utterances":[ "send {the|} {command|} {commands|TIVOCOMMAND}" ]
    },
    function(request,response) {
        sendCommand(request.slot("TIVOCOMMAND").toUpperCase());
    });

app.intent('Pause',
    {
        "slots":{},
        "utterances":[ "pause" ]
    },
    function(request,response) {
        sendCommand("PAUSE");
});

app.intent('LiveTV',
    {
        "slots":{},
        "utterances":[ "send {the|} {command|} live tv", "go to live tv" ]
    },
    function(request,response) {
        sendCommand("GUIDE");
        sendCommand("LIVETV");
    });

app.intent('Play',
    {
        "slots":{},
        "utterances":[ "play" ]
    },
    function(request,response) {
        sendCommand("PLAY");
});

app.intent('FastForward',
    {
        "slots":{},
        "utterances":[ "fast forward" ]
    },
    function(request,response) {
        sendCommand("FORWARD");
});

app.intent('SkipCommerial',
    {
        "slots":{},
        "utterances":[ "skip {the|} {this|} {commercial|forward|ahead}" ]
    },
    function(request,response) {
        sendCommand("ACTION_D");
});

app.intent('Record',
    {
        "slots":{},
        "utterances":[ "record {this|the|} {show|current show|this}" ]
    },
    function(request,response) {
        sendCommand("RECORD");
});

app.intent('GoHome',
    {
        "slots":{},
        "utterances":[ "{show|go} {to the|} home {screen|}" ]
    },
    function(request,response) {
        sendCommand("TIVO");
    });

app.intent('Netflix',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|} netflix" ]
    },
    function(request,response) {
        var commands = [
            "GUIDE",
            "TIVO",
            "DOWN",
            "DOWN",
            "RIGHT",
            "DOWN",
            "DOWN",
            "DOWN",
            "DOWN",
            "DOWN",
            "RIGHT"
        ];
        sendCommands(commands);
    });

app.intent('Amazon',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|} amazon {video|}" ]
    },
    function(request,response) {
        var commands = [
            "GUIDE",
            "TIVO",
            "DOWN",
            "DOWN",
            "RIGHT",
            "DOWN",
            "DOWN",
            "DOWN",
            "DOWN",
            "RIGHT"
        ];
        sendCommands(commands);
    });

app.intent('Hulu',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|} hulu" ]
    },
    function(request,response) {
        var commands = [
            "GUIDE",
            "TIVO",
            "DOWN",
            "DOWN",
            "RIGHT",
            "DOWN",
            "DOWN",
            "DOWN",
            "DOWN",
            "DOWN",
            "DOWN",
            "RIGHT"
        ];
        sendCommands(commands);
    });

app.intent('YouTube',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|} youtube" ]
    },
    function(request,response) {
        var commands = [
            "GUIDE",
            "TIVO",
            "DOWN",
            "DOWN",
            "RIGHT",
            "DOWN",
            "DOWN",
            "DOWN",
            "DOWN",
            "DOWN",
            "DOWN",
            "DOWN",
            "RIGHT"
        ];
        sendCommands(commands);
    });

app.intent('ChangeChannel',
    {
        "slots":{"TIVOCHANNEL":"NUMBER"},
        "utterances":[ "{change|go to} channel {1-100|TIVOCHANNEL}" ]
    },
    function(request,response) {
        changeChannel(request.slot("TIVOCHANNEL"));
    });

app.intent('ForceChannel',
    {
        "slots":{"TIVOCHANNEL":"NUMBER"},
        "utterances":[ "force channel {1-100|TIVOCHANNEL}" ]
    },
    function(request,response) {
        forceChannel(request.slot("TIVOCHANNEL"));
    });

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

function sendNextCommand () {
    clearInterval(interval);
    if(queuedCommands.length == 0) {
        if(typeof telnetSocket != "undefined" && typeof telnetSocket.end != "undefined") {
            telnetSocket.end();
            telnetSocket.destroy();
        }
        socketOpen = false;
    }
    else {
        var command = queuedCommands.shift();
        var timeToWait = 250;
        if(typeof command == "object" && typeof command["explicit"] != "undefined") {
            telnetSocket.write(command["command"].toUpperCase() + "\r");
            console.log("Sending Command: " + command["command"].toUpperCase());
            if(command.indexOf("TELEPORT"))
                timeToWait = 700;
        }
        else {
            if(typeof command == "object")
                command = command["command"];
            var prefix = determinePrefix(command);
            if(prefix === false) {
                console.log("ERROR: Command Not Supported: " + command);
                telnetSocket.end();
            }
            else {
                telnetSocket.write(prefix + " " + command.toUpperCase() + "\r");
                console.log("Sending Command: "+prefix + " " + command.toUpperCase());
            }
            if(prefix == "TELEPORT")
                timeToWait = 700;
        }
        setTimeout(sendNextCommand, timeToWait);
    }
}

var queuedCommands = [];
var telnetSocket;
var socketOpen = false;
var interval;
var noResponse = true;
function sendCommands(commands) {

    var host = config.tivoIP;
    var port = config.tivoPort;

    queuedCommands = [];
    for(var i=0; i<commands.length; i++) {
        queuedCommands.push(commands[i]);
    }
    console.log("QueuedCommands: "+queuedCommands.join(","));

    telnetSocket = net.createConnection({
        port: port,
        host: host
    });
    console.log("Connection Created");
    socketOpen = true;
    telnetSocket.on('data', function(data) {
        noResponse = false;
        console.log("RECEIVED: "+data.toString());
        interval = setInterval(sendNextCommand, 100);
    });
    telnetSocket.on('timeout', function(data) {
        console.log("TIMEOUT RECEIVED");
        if(socketOpen)
            sendNextCommand();
    });
    telnetSocket.on('end', function(data) {
        socketOpen = false;
    });
    noResponse = true;
    setTimeout(function(){
        if(noResponse) {
            telnetSocket.write("TELEPORT GUIDE" + "\r");
        }
    }, 700);
}

function sendCommand(command, explicit) {
    if(typeof explicit == "undefined") {
        explicit = false;
    }
    var host = config.tivoIP;
    var port = config.tivoPort;
    var telnetSocket = net.createConnection({
        port: port,
        host: host
    });
    telnetSocket.on('data', function(data) {
        console.log("RECEIVED: "+data.toString());
    });
    if(explicit) {
        telnetSocket.write(command.toUpperCase() + "\r");
        console.log("Sending Command: " + command.toUpperCase());
    }
    else {
        var prefix = determinePrefix(command);
        if(prefix === false)
            console.log("ERROR: Command Not Support: "+command);
        else {
            telnetSocket.write(prefix + " " + command.toUpperCase() + "\r");
            console.log("Sending Command: "+prefix + " " + command.toUpperCase());
        }
    }
    telnetSocket.end();
    telnetSocket.destroy();
}

function changeChannel(channel) {
    return sendCommand("SETCH "+channel, true);
}

function forceChannel(channel) {
    return sendCommand("FORCECH "+channel, true);
}

function determinePrefix(command) {
    if(TELEPORT_COMMANDS.indexOf(command) != -1)
        return "TELEPORT";
    else if(IRCODE_COMMANDS.indexOf(command) != -1)
        return "IRCODE";
    else if(KEYBOARD_COMMANDS.indexOf(command) != -1)
        return "KEYBOARD";
    else
        return false;
}


express_app.listen(port);