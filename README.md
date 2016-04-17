# alexa_tivo_control
Alexa Skill providing network remote control for Tivo devices.

Tivo Network Remote Documentation:
`http://www.tivo.com/assets/images/abouttivo/resources/downloads/brochures/TiVo_TCP_Network_Remote_Control_Protocol.pdf`

## Requirements
* Node
* Alexa-App

## Installation Instructions

Clone the repo:
```bash
git clone git@github.com:grgisme/alexa_tivo_control.git
```
Install Dependencies:
```bash
npm install
```
Copy config_example.json to config.json:
```bash
cp config_example.json config.json
```

Modify config.json to use your tivo ip address and port, and your Alexa App Id

You must also enable the network remote control on your Tivo.

## Contact

Garrett Griffin-Morales

- https://github.com/grgisme
- http://twitter.com/grgisme