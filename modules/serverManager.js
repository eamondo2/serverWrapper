// external modules
//const rcon = require('rcon');
const debug = require('debug')('serverManager');
const cProc = require('child_process');
const Promise = require('promise');
const path = require('path');
const rcon = require('rcon');

const DiscordInstance = require('./discordbot').DiscordInstance;

//prelim cross-compatibility measures
const platform = require('os'),
    osType = platform;

let command;
if (osType == 'win32')
    command = 'cmd.exe';
else
    command = 'bash';



/**
 * managed server instance
 *
 */
class ServerInstance {
    /**
     * constructor
     * @param {config} cfg config file snippet, contains this instance's info
     */
    constructor(cfg) {

        // handle list of regex parses for message queue
        this.outputRegexQueue = {};

        //check with master Regex list for adding hook list here, load from after and append to discord instance

        this.cfg = cfg;
        this.confID = this.cfg.instance;
        this.autoRespawn = this.cfg.autoRespawn;
        this.autoBoot = this.cfg.autoBoot;

        this.debugLevel = this.cfg.debugLevel;

        //handle Rcon
        this.rconEnable = this.cfg.rconEnable;

        this.discordRef;

        this.lastWorldLoadPct = null;
       
        this.dbg = function (msg) {
            debug(`[${this.confID}]: ${msg}`);
        };
    }
    
    /**
     * Defer to configured boot procedure.
     * @param {boolean} override force boot, ignore config
     * @param {Number} logLevel debug level to set, 0 quiet, 1 print error, 2 print all
     * @param {boolean} respawnIfDead auto-reboot on process termination
     * @param {DiscordInstance} discordInstance
     */
    handleInit(discordInstance, override = false, logLevel = this.debugLevel, respawnIfDead = this.autoRespawn) {
        
        if (!this.discordRef) {
            this.discordRef = discordInstance;
        } else if (!this.discordRef.isStillAlive()) {
            if (discordInstance.isStillAlive()) {
                this.discordRef = discordInstance;
            }
        } else {
            //can't get hold of discord
            this.dbg('Can\'t get hold of Discord instance');
        }
        
        
        if (this.autoBoot || override) {
            this.init(respawnIfDead, logLevel);
        }
    }

    /**
     *
     * @param {boolean} respawnIfDead
     * @param {Number} logLevel 0, quiet, 1, print error, 2, print all
     * @param {DiscordInstance} discordInstance
     */
    init(respawnIfDead = this.autoRespawn, logLevel = this.debugLevel) {
        this.debugLevel = logLevel;
        this.respawnIfDead = respawnIfDead;

        //this.lastBoot = Date.getTime();

        this.dbg('Booting server');
        this.discordRef.passOutput(`[${this.confID}] Booting up.`);

        // spawn new instance
        const pth = path.resolve(__dirname, `${this.cfg.serverDir}`, `${this.cfg.instanceLocation}`);
        this.serverProcess = cProc.spawn(
            command,
            [
                `${pth}/${this.cfg.instanceExec}`
            ], {
                'cwd': path.resolve(__dirname, `${this.cfg.serverDir}/${this.cfg.instanceLocation}`)
            }
        );

        // hook listeners and state monitor for instance

        // message passing
        this.serverProcess.stdout.on('data', (data) => this.messageParse(data));
        this.serverProcess.stderr.on('data', (data) => this.errorParse(data));
        // here we hook the output stream

        // terminated instance
        this.serverProcess.on('exit', (code, signal) => {
            // if we've exited, make sure we want to
            // if not, then queue for re-initialization
            this.dbg(`TERMINATED with signal ${signal}:${code}`);
            this.discordRef.passOutput(`[${this.confID}] Process Terminated with signal ${signal} and code ${code}`);
            if (!this.terminating && this.respawnIfDead) {
                // we want to come back, so do the thing
                setTimeout(() => { 
                    this.discordRef.passOutput(`[${this.confID}] Coming back online after crash.`);
                    this.init(true, this.debugLevel);
                }, 
                20000);
            } else if (this.terminating) {
                this.terminating = false;
            }
        });

        this.serverProcess.on('error', (err) => {
            this.dbg(`error: ${err}`);
            this.discordRef.passOutput(`[${this.confID}] Process threw ${err}`);
            //terminate? 
            //determine if running

        });
    }

    /**
     * This function catches the incoming server output
     * @param {String} data incoming data from server instance
     */
    messageParse(data) {
        // check for exist regex
        if (this.outputRegexQueue !== null && this.outputRegexQueue.length !== 0) {
            // for each of the internal regex items, check against and pass if needed
            for (let tag in this.outputRegexQueue) {
                if (this.outputRegexQueue.hasOwnProperty(tag)) {
                    let tmp = this.outputRegexQueue[tag];
                    if (tmp.reg.exec(data) !== null) {
                        tmp.call(data);
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

    /**
     * This function catches incoming server stderr
     * @param {String} data incoming error message from server instance
     */
    errorParse(data) {
        // for each of the internal error regex items, check against and pass if needed
        this.dbg(`Error from ${this.confID}: ${data}`);
    }

    /**
     * Tells the held server instance to terminate with some semblance of grace.
     * Sets the internal state to terminating, effectively represents the stop command
     */
    gracefulTerminate() {
        this.terminating = true;
        this.dbg('Shutting down..');
        this.passCommand('/stop');
    }

    /**
     * allows for external hooking into server output
     * internal queue of hooks
     * @param {String} tag tag for annotating what the regex is for, also for indexing
     * @param {RegExp} regex allows for passing triggers with specific regex catch?
     * @param {function} cb callback for execution on regex match
     */
    registerOutputChannel(tag, regex, cb) {

        // test for already exist
        if (!this.outputRegexQueue.hasOwnProperty(tag)) {
            this.dbg(`appended new regex trigger: ${tag} for: ${regex}`);
            this.outputRegexQueue[tag] = {
                'call': cb,
                'reg': regex
            };
        }
    }

    /**
     * Passes commands to the internal server instance,
     * returns promise, resolves true if successful parse else error if fail
     * Has a special
     * @param {String} commandArgument argument string to pass, terminated with newline if not already present
     */
    passCommand(commandArgument) {
        // input sanity checking
        // and debug
        this.dbg(`command: ${commandArgument}`);

        //check for specific index of key commands to toggle state
        //how to manage something like this


        return new Promise((resolve, reject) => {
            if (this.serverProcess.stdin.write(`${commandArgument}\n`, (err) => {
                if (err) {
                    // we got an error.
                    reject(err);
                }
            })) {
                // we passed the command.
                resolve(true);
            }
        });
    }


}


//===========================
// Initialization segment
//===========================

debug('Server Manager Initializing\nconfig read from config.json\nInitializing sub-modules');

module.exports = {
    ServerInstance
};