// load required modules
var alexa = require('alexa-app');
var net = require('net');
require('log-timestamp');

// allow this module to be reloaded by hotswap when changed
module.change_code = 1;

// load configuration parameters
var config = require("./config.json");
var strings = require("./constants.json");

// load settings from config file
var tivoMini = config.tivoMini || false;
var route = config.route || "tivo_control";

// set video providers and their status
var video_provider_order = [strings.hbogo, strings.amazon, strings.netflix, strings.hulu, strings.youtube, strings.mlbtv, strings.plex, strings.vudu, strings.hsn, strings.aol, strings.flixfling, strings.toongoggles, strings.wwe, strings.yahoo, strings.yupptv];
var video_provider_status = [config.hbogo, config.amazon, config.netflix, config.hulu, config.youtube, config.mlbtv, config.plex, config.vudu, config.hsn, config.aol, config.flixfling, config.toongoggles, config.wwe, config.yahoo, config.yupptv];

// set audio providers and their status
var audio_provider_order = [strings.pandora, strings.spotify, strings.iheartradio];
var audio_provider_status = [config.pandora, config.spotify, config.iheartradio];

// define variables
var queuedCommands = [];
var telnetSocket;
var socketOpen = false;
var interval;
var noResponse = true;
var providerEnabled;
var speechList = "";
var cardList = "";

// define an alexa-app
var app = new alexa.app(route);

// verify appId for incoming request
app.pre = function(request,response,type) {
    if (request.sessionDetails.application.applicationId!=config.alexaAppId) {
        response.fail("An invalid applicationId was received.");
    }
};

// general error handling
app.error = function(exception, request, response) {
    console.log(exception);
    response.say("Sorry, an error has occured. Please try your request again.");
};


// launch --------------------------------------------------------------

app.launch(function(request,response) {
    response.say(strings.txt_welcome + strings.txt_launch);
});

if ((process.argv.length === 3) && (process.argv[2] === 'schema'))  {
    console.log (app.schema ());
    console.log (app.utterances ());
}


// command-grouping arrays ---------------------------------------------

var IRCODE_COMMANDS = ["UP", "DOWN", "LEFT", "RIGHT", "SELECT", "TIVO", "LIVETV", "GUIDE", "INFO", "EXIT", "THUMBSUP", "THUMBSDOWN", "CHANNELUP", "CHANNELDOWN", "MUTE", "VOLUMEUP", "VOLUMEDOWN", "TVINPUT", "VIDEO_MODE_FIXED_480i", "VIDEO_MODE_FIXED_480p", "VIDEO_MODE_FIXED_720p", "VIDEO_MODE_FIXED_1080i", "VIDEO_MODE_HYBRID", "VIDEO_MODE_HYBRID_720p", "VIDEO_MODE_HYBRID_1080i", "VIDEO_MODE_NATIVE", "CC_ON", "CC_OFF", "OPTIONS", "ASPECT_CORRECTION_FULL", "ASPECT_CORRECTION_PANEL", "ASPECT_CORRECTION_ZOOM", "ASPECT_CORRECTION_WIDE_ZOOM", "PLAY", "FORWARD", "REVERSE", "PAUSE", "SLOW", "REPLAY", "ADVANCE", "RECORD", "NUM0", "NUM1", "NUM2", "NUM3", "NUM4", "NUM5", "NUM6", "NUM7", "NUM8", "NUM9", "ENTER", "CLEAR", "ACTION_A", "ACTION_B", "ACTION_C", "ACTION_D", "BACK", "WINDOW"];

var KEYBOARD_COMMANDS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "MINUS", "EQUALS", "LBRACKET", "RBRACKET", "BACKSLASH", "SEMICOLON", "QUOTE", "COMMA", "PERIOD", "SLASH", "BACKQUOTE", "SPACE", "KBDUP", "KBDDOWN", "KBDLEFT", "KBDRIGHT", "PAGEUP", "PAGEDOWN", "HOME", "END", "CAPS", "LSHIFT", "RSHIFT", "INSERT", "BACKSPACE", "DELETE", "KBDENTER", "STOP", "VIDEO_ON_DEMAND"];

var TELEPORT_COMMANDS = ["TIVO", "GUIDE", "NOWPLAYING"];

app.dictionary = {"commands":["UP", "DOWN", "LEFT", "RIGHT", "SELECT", "TIVO", "THUMBSUP", "THUMBSDOWN", "CHANNELUP", "CHANNELDOWN", "MUTE", "VOLUMEDOWN", "VOLUMEUP", "TVINPUT", "OPTIONS", "RECORD", "DISPLAY", "DIRECTV", "ENTER", "CLEAR", "PLAY", "PAUSE", "SLOW", "FORWARD", "REVERSE", "STANDBY", "NOWSHOWING", "REPLAY", "ADVANCE", "DELIMITER", "GUIDE", "KBDUP", "KBDDOWN", "KBDLEFT", "KBDRIGHT", "PAGEUP", "PAGEDOWN", "HOME", "END", "SPACE", "BACKQUOTE", "SLASH", "PERIOD", "COMMA", "QUOTE", "SEMICOLON", "BACKSLASH", "RBRACKET", "LBRACKET", "EQUALS", "MINUS", "CAPS", "LSHIFT", "RSHIFT", "INSERT", "BACKSPACE", "DELETE", "KBDENTER", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]};


// intents -------------------------------------------------------------

// HELP

app.intent('Help',
    {
        "slots":{},
        "utterances":[ "{for|} {help|assistance}" ]
    },
    function(request,response) {
        console.log("Help requested, adding card.");
        response.say(strings.txt_launch + strings.txt_card);
        response.card("TiVo Control Help", strings.txt_help);
    });

app.intent('ListEnabledProviders',
    {
        "slots":{},
        "utterances":[ "{for|to} {my providers|list my providers|provider|list providers|provider list|list enabled providers}" ]
    },
    function(request,response) {
        console.log("List of enabled providers requested, adding card.");
        createProviderList();
        response.say(strings.txt_enabledlist + speechList + strings.txt_enabledcard);
        response.card("TiVo Control - Providers", strings.txt_providercard + cardList + strings.txt_providerfooter);
    });

// PLACES

app.intent('GoHome',
    {
        "slots":{},
        "utterances":[ "{show|go} {to|to the|} {home|tivo central} {screen|}" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("TIVO");
        sendCommands(commands);
    });


app.intent('LiveTV',
    {
        "slots":{},
        "utterances":[ "send {the|} {command|} live tv", "go to live tv" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("LIVETV");
        sendCommands(commands);
    });

app.intent('OnePassManager',
    {
        "slots":{},
        "utterances":[ "{go to|open|open up|display|launch|show} {my|} {onepasses|season passes}" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("TIVO");
        commands.push("NUM1");
        sendCommands(commands);
    });

app.intent('ToDoList',
    {
        "slots":{},
        "utterances":[ "{go to|open|open up|display|launch|show} {my|} {to do list}" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("TIVO");
        commands.push("NUM2");
        sendCommands(commands);
    });

app.intent('WishLists',
    {
        "slots":{},
        "utterances":[ "{go to|open|open up|display|launch|show} {my|} {wishlists}" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("TIVO");
        commands.push("NUM3");
        sendCommands(commands);
    });

app.intent('Search',
    {
        "slots":{},
        "utterances":[ "{go to|open|open up|display|launch|show|} search" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("TIVO");
        commands.push("NUM4");
        sendCommands(commands);
    });

app.intent('MyShows',
    {
        "slots":{},
        "utterances":[ "{go to|open|open up|display|launch|show} {now playing|my shows|my recordings}" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("NOWPLAYING");
        sendCommands(commands);
    });

app.intent('Browse',
    {
        "slots":{},
        "utterances":[ "{go to|open|open up|display|launch|show|} browse" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("TIVO");
        commands.push("NUM5");
        sendCommands(commands);
    });

app.intent('History',
    {
        "slots":{},
        "utterances":[ "{go to|open|open up|display|launch|show|} {my|} {recording|} history" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("TIVO");
        commands.push("NUM6");
        sendCommands(commands);
    });

app.intent('WhatToWatch',
    {
        "slots":{},
        "utterances":[ "{go to|open|open up|display|launch|show} {what to|} watch {now|}" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("TIVO");
        commands.push("DOWN");
        if(tivoMini) 
            commands.push("DOWN");
        commands.push("RIGHT");
        sendCommands(commands);
    });

// CONTROL

app.intent('ChangeChannel',
    {
        "slots":{"TIVOCHANNEL":"NUMBER"},
        "utterances":[ "{change|go to} channel {1-100|TIVOCHANNEL}" ]
    },
    function(request,response) {
        if(tivoMini)
            response.say(strings.txt_noMiniChannels);
        else {
	    var commands = [];
	    commands.push("SETCH "+request.slot("TIVOCHANNEL"));
	    return sendCommands(commands, true);
        }
    });

app.intent('ForceChannel',
    {
        "slots":{"TIVOCHANNEL":"NUMBER"},
        "utterances":[ "force channel {1-100|TIVOCHANNEL}" ]
    },
    function(request,response) {
        if(tivoMini)
            response.say(strings.txt_noMiniChannels);
        else {
	    var commands = [];
	    commands.push("FORCECH "+request.slot("TIVOCHANNEL"));
	    return sendCommands(commands, true);
        }
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

app.intent('FastForwardDouble',
    {
        "slots":{},
        "utterances":[ "{double fast forward|fast forward two x|fast forward two times}" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("FORWARD");
        commands.push("FORWARD");
        sendCommands(commands);
    });

app.intent('FastForwardTriple',
    {
        "slots":{},
        "utterances":[ "{triple fast forward|fast forward three x|fast forward three times}" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("FORWARD");
        commands.push("FORWARD");
        commands.push("FORWARD");
        sendCommands(commands);
    });


app.intent('SkipAhead',
    {
        "slots":{},
        "utterances":[ "{skip|advance} {forward|ahead}" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("ADVANCE");
        sendCommands(commands);
    });

app.intent('SkipCommerial',
    {
        "slots":{},
        "utterances":[ "skip {the|} {this|} {commercial|commercials}" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("ACTION_D");
        sendCommands(commands);
    });

app.intent('Rewind',
    {
        "slots":{},
        "utterances":[ "rewind" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("REVERSE");
        sendCommands(commands);
    });

app.intent('RewindDouble',
    {
        "slots":{},
        "utterances":[ "{double rewind|rewind two x|rewind two times}" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("REVERSE");
        commands.push("REVERSE");
        sendCommands(commands);
    });

app.intent('RewindTriple',
    {
        "slots":{},
        "utterances":[ "{triple rewind|rewind three x|rewind three times}" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("REVERSE");
        commands.push("REVERSE");
        commands.push("REVERSE");
        sendCommands(commands);
    });

app.intent('Replay',
    {
        "slots":{},
        "utterances":[ "replay" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("REPLAY");
        commands.push("REPLAY");
        sendCommands(commands);
    });

app.intent('Record',
    {
        "slots":{},
        "utterances":[ "record {this|the|} {show|current show|this}" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("RECORD");
        commands.push("RIGHT");
        sendCommands(commands);
    });

// FEATURES

app.intent('CaptionsOn',
    {
        "slots":{},
        "utterances":[ "{turn on|enable} {closed captions|captions}" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("CC_ON");
        sendCommands(commands);
    });

app.intent('CaptionsOff',
    {

        "slots":{},
        "utterances":[ "{turn off|disable} {closed captions|captions}" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("CC_OFF");
        sendCommands(commands);
    });

app.intent('QuickMode',
    {
        "slots":{},
        "utterances":[ "{turn on|turn off|enable|disable|toggle} quick mode" ]
    },
    function(request,response) {
        var commands = [];
        commands.push("PLAY");
        commands.push("SELECT");
        commands.push("CLEAR");
        sendCommands(commands);
    });

// ADVANCED

app.intent('SendCommand',
    {
        "slots":{"TIVOCOMMAND":"LITERAL"},
        "utterances":[ "send {the|} {command|} {commands|TIVOCOMMAND}" ]
    },
    function(request,response) {
        var commands = [];
        commands.push(request.slot("TIVOCOMMAND").toUpperCase());
        sendCommands(commands);
    });

// VIDEO PROVIDERS

app.intent('HBOGo',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} hbo {go|}" ]
    },
    function(request,response) {
        if (checkProviderEnabled(strings.hbogo)) {
            response.say("Launching " + strings.hbogo);
            var commands = [];
            commands = addInitCommands(commands);
            commands = openMediaCommands(commands);
            commands = buildProviderNavigation(strings.hbogo, commands);
            sendCommands(commands);
        }
        else
            response.say(strings.hbogo + strings.txt_notenabled);
    });

app.intent('Amazon',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} amazon {video|}" ]
    },
    function(request,response) {
        if (checkProviderEnabled(strings.amazon)) {
            response.say("Launching " + strings.amazon);
            var commands = [];
            commands = addInitCommands(commands);
            commands = openMediaCommands(commands);
            commands = buildProviderNavigation(strings.amazon, commands);
            sendCommands(commands);
        }
        else
            response.say(strings.amazon + strings.txt_notenabled);
    });

app.intent('Netflix',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} netflix" ]
    },
    function(request,response) {
        if (checkProviderEnabled(strings.netflix)) {
            response.say("Launching " + strings.netflix);
            var commands = [];
            commands = addInitCommands(commands);
            commands = openMediaCommands(commands);
            commands = buildProviderNavigation(strings.netflix, commands);
            sendCommands(commands);
        }
        else
            response.say(strings.netflix + strings.txt_notenabled);
    });
	
app.intent('Hulu',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} hulu" ]
    },
    function(request,response) {
        if (checkProviderEnabled(strings.hulu)) {
            response.say("Launching " + strings.hulu);
            var commands = [];
            commands = addInitCommands(commands);
            commands = openMediaCommands(commands);
            commands = buildProviderNavigation(strings.hulu, commands);
            sendCommands(commands);
        }
        else
            response.say(strings.hulu + strings.txt_notenabled);
    });
	
app.intent('YouTube',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} youtube" ]
    },
    function(request,response) {
        if (checkProviderEnabled(strings.youtube)) {
            response.say("Launching " + strings.youtube);
            var commands = [];
            commands = addInitCommands(commands);
            commands = openMediaCommands(commands);
            commands = buildProviderNavigation(strings.youtube, commands);
            sendCommands(commands);
        }
        else
            response.say(strings.youtube + strings.txt_notenabled);
    });
	
app.intent('MLBTV',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} {the|} {mlb|baseball|mlb tv|major league baseball|major league baseball tv}" ]
    },
    function(request,response) {
        if (checkProviderEnabled(strings.mlbtv)) {
            response.say("Launching " + strings.mlbtv);
            var commands = [];
            commands = addInitCommands(commands);
            commands = openMediaCommands(commands);
            commands = buildProviderNavigation(strings.mlbtv, commands);
            sendCommands(commands);
        }
        else
            response.say(strings.mlbtv + strings.txt_notenabled);
    });
	
app.intent('Plex',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} plex" ]
    },
    function(request,response) {
        if (checkProviderEnabled(strings.plex)) {
            response.say("Launching " + strings.plex);
            var commands = [];
            commands = addInitCommands(commands);
            commands = openMediaCommands(commands);
            commands = buildProviderNavigation(strings.plex, commands);
            sendCommands(commands);
        }
        else
            response.say(strings.plex + strings.txt_notenabled);
    });
	
app.intent('VUDU',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} {vudu|voodoo}" ]
    },
    function(request,response) {
        if (checkProviderEnabled(strings.vudu)) {
            response.say("Launching " + strings.vudu);
            var commands = [];
            commands = addInitCommands(commands);
            commands = openMediaCommands(commands);
            commands = buildProviderNavigation(strings.vudu, commands);
            sendCommands(commands);
        }
        else
            response.say(strings.vudu + strings.txt_notenabled);
    });
	
app.intent('HSN',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} {hsn|home shopping network|shopping}" ]
    },
    function(request,response) {
        if (checkProviderEnabled(strings.hsn)) {
            response.say("Launching " + strings.hsn);
            var commands = [];
            commands = addInitCommands(commands);
            commands = openMediaCommands(commands);
            commands = buildProviderNavigation(strings.hsn, commands);
            sendCommands(commands);
        }
        else
            response.say(strings.hsn + strings.txt_notenabled);
    });
	
app.intent('AOL',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} {aol|aol on|america online}" ]
    },
    function(request,response) {
        if (checkProviderEnabled(strings.aol)) {
            response.say("Launching " + strings.aol);
            var commands = [];
            commands = addInitCommands(commands);
            commands = openMediaCommands(commands);
            commands = buildProviderNavigation(strings.aol, commands);
            sendCommands(commands);
        }
        else
            response.say(strings.aol + strings.txt_notenabled);
    });
	
app.intent('FlixFling',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} flixfling" ]
    },
    function(request,response) {
        if (checkProviderEnabled(strings.flixfling)) {
            response.say("Launching " + strings.flixfling);
            var commands = [];
            commands = addInitCommands(commands);
            commands = openMediaCommands(commands);
            commands = buildProviderNavigation(strings.flixfling, commands);
            sendCommands(commands);
        }
        else
            response.say(strings.flixfling + strings.txt_notenabled);
    });
	
app.intent('ToonGoggles',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} toon goggles" ]
    },
    function(request,response) {
        if (checkProviderEnabled(strings.toongoggles)) {
            response.say("Launching " + strings.toongoggles);
            var commands = [];
            commands = addInitCommands(commands);
            commands = openMediaCommands(commands);
            commands = buildProviderNavigation(strings.toongoggles, commands);
            sendCommands(commands);
        }
        else
            response.say(strings.toongoggles + strings.txt_notenabled);
    });
	
app.intent('WWE',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} {wwe|wrestling|world wrestling entertainment}" ]
    },
    function(request,response) {
        if (checkProviderEnabled(strings.wwe)) {
            response.say("Launching " + strings.wwe);
            var commands = [];
            commands = addInitCommands(commands);
            commands = openMediaCommands(commands);
            commands = buildProviderNavigation(strings.wwe, commands);
            sendCommands(commands);
        }
        else
            response.say(strings.wwe + strings.txt_notenabled);
    });
	
app.intent('Yahoo',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} yahoo" ]
    },
    function(request,response) {
        if (checkProviderEnabled(strings.yahoo)) {
            response.say("Launching " + strings.yahoo);
            var commands = [];
            commands = addInitCommands(commands);
            commands = openMediaCommands(commands);
            commands = buildProviderNavigation(strings.yahoo, commands);
            sendCommands(commands);
        }
        else
            response.say(strings.yahoo + strings.txt_notenabled);
    });
	
app.intent('YuppTV',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} {yupp|yupp tv|yupptv}" ]
    },
    function(request,response) {
        if (checkProviderEnabled(strings.yupptv)) {
            response.say("Launching " + strings.yupptv);
            var commands = [];
            commands = addInitCommands(commands);
            commands = openMediaCommands(commands);
            commands = buildProviderNavigation(strings.yupptv, commands);
            sendCommands(commands);
        }
        else
            response.say(strings.yupptv + strings.txt_notenabled);
    });
	
// AUDIO PROVIDERS

app.intent('Pandora',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} pandora", "play {music|music on pandora|pandora}" ]
    },
    function(request,response) {
        if (checkProviderEnabled(strings.pandora)) {
            response.say("Launching " + strings.pandora);
            var commands = [];
            commands = addInitCommands(commands);
            commands = openMusicCommands(commands);
            commands = buildProviderNavigation(strings.pandora, commands);
            sendCommands(commands);
        }
        else
            response.say(strings.pandora + strings.txt_notenabled);
    });
	
app.intent('Spotify',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} spotify", "play {music|music on|} spotify" ]
    },
    function(request,response) {
        if (checkProviderEnabled(strings.spotify)) {
            response.say("Launching " + strings.spotify);
            var commands = [];
            commands = addInitCommands(commands);
            commands = openMusicCommands(commands);
            commands = buildProviderNavigation(strings.spotify, commands);
            sendCommands(commands);
        }
        else
            response.say(strings.spotify + strings.txt_notenabled);
    });
	
app.intent('iHeartRadio',
    {
        "slots":{},
        "utterances":[ "{go to|open|turn on|open up|display|jump to|launch|} {iheartradio|i heart radio}", "play {music|music on|} iheartradio" ]
    },
    function(request,response) {
        if (checkProviderEnabled(strings.iheartradio)) {
            response.say("Launching " + strings.iheartradio);
            var commands = [];
            commands = addInitCommands(commands);
            commands = openMusicCommands(commands);
            commands = buildProviderNavigation(strings.iheartradio, commands);
            sendCommands(commands);
        }
        else
            response.say(strings.iheartradio + strings.txt_notenabled);
    });


// functions -----------------------------------------------------------

function sendNextCommand () {

    clearInterval(interval);
    if(queuedCommands.length == 0) {
	// the queue is empty, disconnect
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
	    // wait slightly longer to allow for screen changes
            if(tivoMini)
                timeToWait = 1100;
            else
                timeToWait = 800;
        if(typeof command == "object" && typeof command["explicit"] != "undefined") {
    	    // when explicit is true, send the full command as passed
            console.log("Sending Explicit Command: " + command["command"].toUpperCase());
            telnetSocket.write(command["command"].toUpperCase() + "\r");
            if(command.indexOf("TELEPORT"))
                timeToWait = 700;
        }
        else {
    	    // when explicit is false, add the proper command prefix (IRCODE, KEYBOARD, etc.)
            if(typeof command == "object")
                command = command["command"];
            var prefix = determinePrefix(command);
            if(prefix === false) {
                console.log("ERROR: Command Not Supported: " + command);
                telnetSocket.end();
            }
            else {
                console.log("Sending Prefixed Command: "+prefix + " " + command.toUpperCase());
                telnetSocket.write(prefix + " " + command.toUpperCase() + "\r");
            }
            if(prefix == "TELEPORT")
                timeToWait = 700;
        }
        setTimeout(sendNextCommand, timeToWait);
    }
}

// send a series of queued-up commands to the TiVo (with delays in-between)
function sendCommands(commands) {

    var host = config.tivoIP;
    var port = config.tivoPort;

    // move the list of passed-in commands into queuedCommands
    queuedCommands = [];
    for(var i=0; i<commands.length; i++) {
        queuedCommands.push(commands[i]);
    }
    console.log("QueuedCommands: "+queuedCommands.join(","));

    // open the telnet connection to the TiVo
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
            if(tivoMini) {
                //Tivo Minis don't respond with a Channel response on the primary menu or guide, so we'll set another timeout.
                setTimeout(sendNextCommand, 700);
            }
        }
    }, 700);
}

// determine prefix for a command
function determinePrefix(command) {
    if(TELEPORT_COMMANDS.indexOf(command) != -1)
        return "TELEPORT";
    else if(IRCODE_COMMANDS.indexOf(command) != -1)
        return "IRCODE";
    else if(KEYBOARD_COMMANDS.indexOf(command) != -1)
        return "KEYBOARD";
    else if ((command.substring(0,5) == "SETCH") || (command.substring(0,7) == "FORCECH"))
	return "";
    else
        return false;
}

// reset to known location (i.e., TiVo Central)
function addInitCommands(commands) {
    //commands.push("GUIDE"); // not sure if this is necessary?
    commands.push("TIVO");
    return commands;
}

// go to Find TV, Movies, & Videos menu
function openMediaCommands(commands) {
    commands.push("DOWN");
    commands.push("DOWN");
    if(tivoMini)
        commands.push("DOWN");
    commands.push("RIGHT");
    commands.push("DOWN");
    commands.push("DOWN");
    return commands;
}

// go to Music & Photos menu
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

// build dynamic navigation based on which video/audio providers are enabled
function buildProviderNavigation(provider, commands) {

    var provider_loc = video_provider_order.indexOf(provider);

    if (provider_loc == -1) {
        console.log("building navigation for audio provider (" + provider + ")");
        provider_loc = audio_provider_order.indexOf(provider);
        provider_order = audio_provider_order;
        provider_status = audio_provider_status;
    }
    else {
        console.log("building navigation for video provider (" + provider + ")");
        provider_order = video_provider_order;
        provider_status = video_provider_status; 
    }

    for (loc = 0; loc <= provider_loc; loc++) {
        console.log("- " + provider_order[loc] + " (" + provider_status[loc] + ")");
        if (provider_status[loc] == true) {
            commands.push("DOWN");}
    }
    commands.push("RIGHT");
    return commands;
}

// determine if a specified provider is enabled in the configuration file
function checkProviderEnabled(provider) {

    var provider_loc = video_provider_order.indexOf(provider);

    if (provider_loc == -1) {
        console.log("checking status of audio provider (" + provider + ")");
        provider_loc = audio_provider_order.indexOf(provider);
        provider_status = audio_provider_status;
    }
    else {
        console.log("checking status of video provider (" + provider + ")");
        provider_status = video_provider_status; 
    }

    if (provider_status[provider_loc] == true)
        console.log("- enabled");
    else
        console.log("- disabled");

    return provider_status[provider_loc];
}

// generate a list of providers and their status (to be spoken and added to help card)
function createProviderList() {

    speechList = "";
    cardList = "";

    console.log("building list of video providers");
    for (loc = 0; loc < video_provider_order.length; loc++) {
        statusText = " "
        if (video_provider_status[loc] == true) {
            speechList = speechList + ", " + video_provider_order[loc];
            statusText = " (enabled)"
        }
        cardList = cardList + "\n- " + video_provider_order[loc] + statusText;
    }

    console.log("building list of audio providers");
    for (loc = 0; loc < audio_provider_order.length; loc++) {
        statusText = " "
        if (audio_provider_status[loc] == true) {
            speechList = speechList + ", " + audio_provider_order[loc];
            statusText = " (enabled)"
        }
        cardList = cardList + "\n- " + audio_provider_order[loc] + statusText;
    }

    console.log("speech list:\n " + speechList + "\ncard list: " + cardList);

}

module.exports = app;
