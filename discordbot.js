const Discord = require('discord.js');
const ConfigParser = require('configparser');
const debug = require('debug')('discordFrontend');
const em = require('events').EventEmitter;

//initialize the discord bot
/**
 * initializes the discord bot, acts as class constructor
 * @param {String} configLocation
 */
class discordFrontEnd {


    /**
     * initialize
     * @param {String} configLocation 
     * @param {ConfigParser} cParser
     */
    constructor(configLocation, cParser) {
        this.confLocation = configLocation;
        this.cParser = cParser;

        //cache discord bot details
        this.botToken = this.cParser.read('Client', 'clientToken');
        this.clientName = this.cParser.read('Client', 'clientName');

        this.discordClient = new Discord.Client();
        debug(`Initializing discord frontend ${this.cParser.get('Client', 'clientName')}`);


        
    }
}

module.exports = {
    discordFrontEnd
};
 