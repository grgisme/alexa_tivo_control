# alexa_tivo_control
Alexa Skill providing network remote control for a single Tivo device.

## Requirements

* Node
* Alexa-App-Server
* Alexa-App

## Installation Instructions

Clone the repo into your alexa-app-server apps directory:
```bash
git clone https://github.com/jradwan/alexa_tivo_control.git
```
Install Dependencies:
```bash
npm install
```
Copy config_example.json to config.json:
```bash
cp config_example.json config.json
```

Modify config.json, setting your TiVo's IP address and your Alexa App ID. You must also enable the network remote control on your Tivo.

## Contact

Jeremy C. Radwan

- https://github.com/jradwan
- http://www.windracer.net/blog

## References

This project was forked from https://github.com/grgisme/alexa_tivo_control

Tivo Network Remote Documentation:
http://www.tivo.com/assets/images/abouttivo/resources/downloads/brochures/TiVo_TCP_Network_Remote_Control_Protocol.pdf
