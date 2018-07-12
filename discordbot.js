const Discord = require('discord.js');
const debug = require('debug')('discordFrontend');
const em = require('events').EventEmitter;

//initialize the discord bot

class discordFrontEnd {


    /**
     * initialize
     * @param {config} config config snippet from global
     */
    constructor(config) {
        this.cfg = config;

     
        this.discordClient = new Discord.Client();
        debug(`Initializing discord frontend ${this.cfg.client.clientName}`);


        
    }

    
}

module.exports = {
    discordFrontEnd
};
 