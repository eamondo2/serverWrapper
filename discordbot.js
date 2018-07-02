const Discord = require('discord.js');
const ConfigParser = require('configparser');
const debug = require('debug')('botLog');

const name = 'discordbot';

const config = new ConfigParser();

config.read('localAuth');


debug(`booting ${name}`);

var client = new Discord.Client();


function onReady(){
    debug(`client login with ${client.user.username}`);

}

client.on('ready', onReady);

debug(`config token value is ${config.get('User', 'clientToken')}`);

client.login(config.get('User', 'clientToken'));

client.on('message', msg => {
    if (msg.content === 'ping') {
        msg.reply('pong');
    }
});
