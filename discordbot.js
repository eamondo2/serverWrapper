var Discord = require('discord.js');

const loginMessage = `client login with ${client.user.username}`;

var client = new Discord.Client();


function onReady(){
    console.log(loginMessage);
}

client.on('ready', onReady);


