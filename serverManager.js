//external modules
const rcon = require('rcon');
const ConfigParser = require('configparser');
const debug = require('debug')('serverManager');  
const spawn = require('child_process').spawn;

// local modules
const hardwareMonitor = require('./hardwareMonitor.js');
const discordFrontEnd = require('./discordbot.js');

//local variables
const confLocation = 'localConf';

//Local config segment
const config = new ConfigParser();
config.read(confLocation);



/**
 * managed server instance
 *
 */
class ServerInstance {

    /**
     * constructor
     * @param {Array} manageQueueCallback callback for adding self to the global managed instance list/queue
     * @param {String} instanceConfig  self's config identifier tag
     * @param {ConfigParser} confParserReference self's pointer to the global config parser
     */
    constructor(manageQueueCallback, instanceConfig, confParserReference) {
        //append self to global queue
        manageQueueCallback.push(this);

        this.confID = instanceConfig;
        this.confParser = confParserReference;

        this.outputRegexQueue = [];

        this.initCommand = this.confParser.get(this.confID, 'instanceExec');


    }

    /**
     * 
     * @param {boolean} respawnIfDead 
     * @param {Number} logLevel 0 - 3 NOT IMPLEMENTED
     */
    initialize ( respawnIfDead, logLevel ) {

        this.debugLevel = logLevel;
        this.respawnIfDead = respawnIfDead;

        debug(`${this.confID} Initializing server`);

        //spawn new instance
        this.serverProcess = spawn( this.initCommand );

        //hook listeners and state monitor for instance

        //message passing


        //terminated instance
        this.serverProcess.on('exit', function( code, signal ) {
            //if we've exited, make sure we want to
            //if not, then queue for re-initialization
            debug(`[${this.confID}] TERMINATED with signal ${signal}`);
            if ( !this.terminating && this.respawnIfDead ) {
                //we want to come back, so do the thing
                this.initialize(true, 3);
            }
        });

    }

    /**
     * Tells the held server instance to terminate with some semblance of grace.
     * Sets the internal state to terminating, effectively represents the stop command
     */
    gracefulTerminate() {

        this.terminating = true;
        this.serverProcess.send('stop\n')
            .then( function( data ) {

            })  
            .catch( function( error ) {

            });
    }

    /**
     * allows for external hooking into server output
     * internal queue of hooks
     * @param {String} regex allows for passing triggers with specific regex catch?
     */
    registerOutputChannel( regex ) {

    }

    /**
     * Passes commands to the internal server instance
     * Has a special 
     * @param {String} commandArgument 
     */
    passCommand( commandArgument ) {
        
        

    }

}

//Initialization segment

debug(`Server Manager Initializing\nconfig read from ${confLocation}\nInitializing sub-modules`);

//initialize discord connection
const discordInstance = new discordFrontEnd.discordFrontEnd(confLocation, config);
//initialize local hardware tie-in
const hardwareInstance = new hardwareMonitor.hardwareMonitor(confLocation, config);
//initialize local queue of server instances
const instanceQueue = [];





