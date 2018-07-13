const Discord = require('discord.js');
const debug = require('debug')('discordFrontend');

// initialize the discord bot

class discordFrontEnd {
    /**
     * initialize
     * @param {config} config config snippet from global
     */
    constructor (config) {
        this.cfg = config;
        this.channelID = this.cfg.bot.channel;
        this.mentionRequire = this.cfg.bot.requireMention;
        this.permRequired = this.cfg.bot.managementRole;
        this.dbg = function ( msg ) { debug(`[${this.cfg.clientName}]: ${msg}`);};
        // list for storing regex match pairs
        //config-able command opts
        this.inputHookQueue = {};

        this.discordClient = new Discord.Client();
        this.dbg('Initializing discord frontend');
    }
    /**
   * starts the bot
   * @param {String} channelID id of channel to sit in
   */
    init (channelID = this.channelID) {
        this.discordClient.login(this.cfg.clientToken);
        this.channelID = channelID;

        //boot hooking
        this.discordClient.on('ready', () => {
            this.clientName = this.discordClient.user.username;
            this.discordClient.user.setActivity( 'Active and managing servers' );
        });

        //input hooking
        this.discordClient.on('message', async message => this.messageHandle( message, this ) );



    }

    hookOutputStream( data, destination = this.channelID ) {
        this.discordClient.channels.get(destination).send( data );
    }

    /**
     *  append regex filter for input trigger
     * @param {String} tag tag for identifying regex purpose
     * @param {RegExp} regex regex object to match with
     * @param {function} cb callback run on match
     */
    registerInputQueue( tag, regex, cb ) {
        if ( !this.inputHookQueue.hasOwnProperty(tag)) {
            this.dbg(`appended new regex trigger: ${tag} for: ${regex}`);
            this.inputHookQueue[tag] = {
                'call': cb,
                'reg': regex
            };
        }
    }

    /**
     * Handles incoming message
     * @param {Discord.Message} data discord bot message event
     * @param {discordFrontEnd} self the discord class instance 
     */
    messageHandle( data, self ) {
        //invalidate bot messages
        if ( data.author.bot ) return;
        //invalidate non mentions
        let t = /[@](\S+)/.exec(data.cleanContent);
        if ( t === null) return;
        if ( t[1] !== this.clientName ) return;
        // check for exist regex
        if (this.inputHookQueue !== null && this.inputHookQueue.length !== 0) {
            // for each of the internal regex items, check against and pass if needed
            for (let tag in this.inputHookQueue) {
                if (this.inputHookQueue.hasOwnProperty(tag)) {
                    let tmp = this.inputHookQueue[tag];
                    let t = tmp.reg.exec( data.cleanContent );
                    if (tmp.reg.exec(data.cleanContent) !== null) {
                        //pass the message and the current instance for exec outside of scope
                        //make sure we don't talk to a bot
                        tmp.call ( data, self );
                    }
                }
            }
        }
        // else we don't care, no messages are filtered for output
        // unless debug print all
        if (this.debugLevel === 2) {
            this.dbg(`${data}`);
        }
    }

}

module.exports = {
    discordFrontEnd
};
