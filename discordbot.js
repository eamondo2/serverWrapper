const Discord = require('discord.js');
const debug = require('debug')('discordFrontend');
const em = require('events').EventEmitter;

// initialize the discord bot

class discordFrontEnd {
    /**
     * initialize
     * @param {config} config config snippet from global
     */
    constructor (config) {
        this.cfg = config;
        this.channelID = this.cfg.bot.channel;
        this.discordClient = new Discord.Client();
        debug(`Initializing discord frontend ${this.cfg.clientName}`);
    }
    /**
   * starts the bot
   * @param {String} channelID id of channel to sit in
   */
    init (channelID = this.channelID) {
        this.discordClient.login(this.cfg.clientToken);
        this.channelID = channelID;
    }

    hookOutputStream( data, destination = this.channelID ) {
        this.discordClient.channels.get(destination).send( data );
    }
}

module.exports = {
    discordFrontEnd
};
