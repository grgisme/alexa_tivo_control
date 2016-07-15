// load required modules
var alexa = require('alexa-app');
var net = require('net');

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;

// load configuration parameters (or set defaults)
var config   = require("./config.json");
var port     = process.env.port || config.port || 8080;
var tivoMini = config.tivoMini;
var route = config.route || "tivo_control";

// define variables
var queuedCommands = [];
var telnetSocket;
var socketOpen = false;
var interval;
var noResponse = true;

// Define an alexa-app
var app = new alexa.app(route);

// launch
app.launch(function(request,response) {
    response.say("Welcome to Tivo Control");
});

if ((process.argv.length === 3) && (process.argv[2] === 'schema'))  {
    console.log (app.schema ());
    console.log (app.utterances ());
}

// command-grouping arrays
var IRCODE_COMMANDS = ["UP", "DOWN", "LEFT", "RIGHT", "SELECT", "TIVO", "LIVETV", "GUIDE", "INFO", "EXIT", "THUMBSUP", "THUMBSDOWN", "CHANNELUP", "CHANNELDOWN", "MUTE", "VOLUMEUP", "VOLUMEDOWN", "TVINPUT", "VIDEO_MODE_FIXED_480i", "VIDEO_MODE_FIXED_480p", "VIDEO_MODE_FIXED_720p", "VIDEO_MODE_FIXED_1080i", "VIDEO_MODE_HYBRID", "VIDEO_MODE_HYBRID_720p", "VIDEO_MODE_HYBRID_1080i", "VIDEO_MODE_NATIVE", "CC_ON", "CC_OFF", "OPTIONS", "ASPECT_CORRECTION_FULL", "ASPECT_CORRECTION_PANEL", "ASPECT_CORRECTION_ZOOM", "ASPECT_CORRECTION_WIDE_ZOOM", "PLAY", "FORWARD", "REVERSE", "PAUSE", "SLOW", "REPLAY", "ADVANCE", "RECORD", "NUM0", "NUM1", "NUM2", "NUM3", "NUM4", "NUM5", "NUM6", "NUM7", "NUM8", "NUM9", "ENTER", "CLEAR", "ACTION_A", "ACTION_B", "ACTION_C", "ACTION_D"];

var KEYBOARD_COMMANDS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "MINUS", "EQUALS", "LBRACKET", "RBRACKET", "BACKSLASH", "SEMICOLON", "QUOTE", "COMMA", "PERIOD", "SLASH", "BACKQUOTE", "SPACE", "KBDUP", "KBDDOWN", "KBDLEFT", "KBDRIGHT", "PAGEUP", "PAGEDOWN", "HOME", "END", "CAPS", "LSHIFT", "RSHIFT", "INSERT", "BACKSPACE", "DELETE", "KBDENTER", "STOP", "VIDEO_ON_DEMAND"];

var TELEPORT_COMMANDS = ["TIVO", "LIVETV", "GUIDE", "NOWPLAYING"];

app.dictionary = {"commands":["UP", "DOWN", "LEFT", "RIGHT", "SELECT", "TIVO", "THUMBSUP", "THUMBSDOWN", "CHANNELUP", "CHANNELDOWN", "MUTE", "VOLUMEDOWN", "VOLUMEUP", "TVINPUT", "OPTIONS", "RECORD", "DISPLAY", "DIRECTV", "ENTER", "CLEAR", "PLAY", "PAUSE", "SLOW", "FORWARD", "REVERSE", "STANDBY", "NOWSHOWING", "REPLAY", "ADVANCE", "DELIMITER", "GUIDE", "KBDUP", "KBDDOWN", "KBDLEFT", "KBDRIGHT", "PAGEUP", "PAGEDOWN", "HOME", "END", "SPACE", "BACKQUOTE", "SLASH", "PERIOD", "COMMA", "QUOTE", "SEMICOLON", "BACKSLASH", "RBRACKET", "LBRACKET", "EQUALS", "MINUS", "CAPS", "LSHIFT", "RSHIFT", "INSERT", "BACKSPACE", "DELETE", "KBDENTER", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]};

// intents -------------------------------------------------------------

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
        var commands = [];
        commands.push("PAUSE");
        sendCommands(commands);
});

app.intent('LiveTV',
    {
        "slots":{},
        "utterances":[ "send {the|} {command|} live tv", "go to live tv" ]
    },
    function(request,response) {
        var commands = [];
        if(!tivoMini) {
            commands.push("GUIDE");   // TEST: is this needed?
            commands.push("LIVETV");
            sendCommands(commands);
        }
        else {
            commands.push("LIVETV");
            sendCommands(commands);
        }
    });

app.intent('Play',
    {
        "slots":{},
        "utterances":[ "play" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("PLAY");
        sendCommands(commands);
});

app.intent('FastForward',
    {
        "slots":{},
        "utterances":[ "fast forward" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("FORWARD");
        sendCommands(commands);
});

app.intent('SkipCommerial',
    {
        "slots":{},
        "utterances":[ "skip {the|} {this|} {commercial|forward|ahead}" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("ACTION_D");
        sendCommands(commands);
});

app.intent('Record',
    {
        "slots":{},
        "utterances":[ "record {this|the|} {show|current show|this}" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("RECORD");  // TEST: need extra action to actually record
        sendCommands(commands);
});

app.intent('GoHome',
    {
        "slots":{},
        "utterances":[ "{show|go} {to the|} home {screen|}" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("TIVO");
        sendCommands(commands);
    });

app.intent('Netflix',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} netflix" ]
    },
    function(request,response) {
        var commands = [];
        commands = addInitCommands(commands);
        commands = openMediaCommands(commands);
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("RIGHT");

        sendCommands(commands);
    });

app.intent('Amazon',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} amazon {video|}" ]
    },
    function(request,response) {
        var commands = [];
        commands = addInitCommands(commands);
        commands = openMediaCommands(commands);
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("RIGHT");
        sendCommands(commands);
    });

app.intent('Hulu',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} hulu" ]
    },
    function(request,response) {
        var commands = [];
        commands = addInitCommands(commands);
        commands = openMediaCommands(commands);
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("RIGHT");
        sendCommands(commands);
    });

app.intent('YouTube',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} youtube" ]
    },
    function(request,response) {
        var commands = [];
        commands = addInitCommands(commands);
        commands = openMediaCommands(commands);
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("RIGHT");
        sendCommands(commands);
    });

app.intent('MBLTV',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} {the|} {mlb|baseball|mlb tv|major league baseball|major league baseball tv}" ]
    },
    function(request,response) {
        var commands = [];
        commands = addInitCommands(commands);
        commands = openMediaCommands(commands);
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("RIGHT");
        sendCommands(commands);
    });

app.intent('Plex',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} plex" ]
    },
    function(request,response) {
        var commands = [];
        commands = addInitCommands(commands);
        commands = openMediaCommands(commands);
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("RIGHT");
        sendCommands(commands);
    });

app.intent('HBOGo',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} hbo {go|}" ]
    },
    function(request,response) {
        var commands = [];
        commands = addInitCommands(commands);
        commands = openMediaCommands(commands);
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("RIGHT");
        sendCommands(commands);
    });

app.intent('Pandora',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} pandora", "play {music|music on pandora|pandora}" ]
    },
    function(request,response) {
        var commands = [];
        commands = addInitCommands(commands);
        commands = openMusicCommands(commands);
        commands.push("DOWN");
        commands.push("RIGHT");
        sendCommands(commands);
    });

app.intent('Spotify',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} spotify", "play {music|music on|} spotify" ]
    },
    function(request,response) {
        var commands = [];
        commands = addInitCommands(commands);
        commands = openMusicCommands(commands);
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("RIGHT");
        sendCommands(commands);
    });

app.intent('iHeartRadio',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} iheartradio", "play {music|music on|} iheartradio" ]
    },
    function(request,response) {
        var commands = [];
        commands = addInitCommands(commands);
        commands = openMusicCommands(commands);
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("DOWN");
        commands.push("RIGHT");
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


// functions -----------------------------------------------------------

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
        var timeToWait = 300;
        if(queuedCommands[0] == "RIGHT" || queuedCommands[0] == "ENTER")
            timeToWait = 700;
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
        if(noResponse) {
            noResponse = false;
            console.log("RECEIVED: "+data.toString());
            interval = setInterval(sendNextCommand, 300);
        }
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
            if(tivoMini) {
                //Tivo Mini's don't respond with a Channel response on the primary menu or guide, so we'll set another timeout.
                setTimeout(sendNextCommand, 2500);
            }
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
    var commands = [];
    commands.push("SETCH "+channel);
    return sendCommands(commands, true);
}

function forceChannel(channel) {
    var commands = [];
    commands.push("FORCECH "+channel);
    return sendCommands(commands, true);
}

function determinePrefix(command) {
    console.log("Determining prefix of command: " +command);
    if(TELEPORT_COMMANDS.indexOf(command) != -1)
	{console.log("teleport command");
        return "TELEPORT";}
    else if(IRCODE_COMMANDS.indexOf(command) != -1)
	{console.log("ircode command");
        return "IRCODE";}
    else if(KEYBOARD_COMMANDS.indexOf(command) != -1)
	{console.log("keyboard command");
        return "KEYBOARD";}
    else if ((command.substring(0,5) == "SETCH") || (command.substring(0,7) == "FORCECH"))
	{console.log("channel command");
	return "";}
    else
	{console.log("no prefix found!");
        return false;}
}

function addInitCommands(commands) {
    commands.push("GUIDE");
    commands.push("TIVO");
    return commands;
}
function openMediaCommands(commands) {
    commands.push("DOWN");
    commands.push("DOWN");
    if(tivoMini)
        commands.push("DOWN");
    commands.push("RIGHT");
    return commands;
}
function openMusicCommands(commands) {
    commands.push("DOWN");
    commands.push("DOWN");
    commands.push("DOWN");
    commands.push("DOWN");
    if(tivoMini)
        commands.push("DOWN");
    commands.push("RIGHT");
    return commands;
}

module.exports = app;
