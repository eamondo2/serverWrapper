// external modules
//const rcon = require('rcon');
const debug = require('debug')('serverManager');
const cProc = require('child_process');
const config = require('./config.json');
const Promise = require('promise');
const path = require('path');

//prelim cross-compatibility measures
const platform = require('os'),
    osType = platform;

let command;
if (osType == 'win32')
    command = 'cmd.exe';
else
    command = 'bash';


// local modules
const hardwareMonitor = require('./hardwareMonitor.js');
const discordFrontEnd = require('./discordbot.js');

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

        this.cfg = cfg;
        this.confID = this.cfg.instance;
        this.autoRespawn = this.cfg.autoRespawn;
        this.debugLevel = this.cfg.debugLevel;
        this.dbg = function (msg) {
            debug(`[${this.confID}]: ${msg}`);
        };
    }

    /**
     *
     * @param {boolean} respawnIfDead
     * @param {Number} logLevel 0, quiet, 1, print error, 2, print all
     */
    init(respawnIfDead = this.autoRespawn, logLevel) {
        this.debugLevel = logLevel;
        this.respawnIfDead = respawnIfDead;

        //this.lastBoot = Date.getTime();

        this.dbg('Initializing server');

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
            if (!this.terminating && this.respawnIfDead) {
                // we want to come back, so do the thing
                setTimeout(() => this.init(true, this.debugLevel), 20000);
            }
        });

        this.serverProcess.on('error', (err) => {
            this.dbg(`error: ${err}`);
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
        this.passCommand('/stop');
        this.dbg('Shutting down..');
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

//Method for handling batch regexp hook loading per instance


//===========================
// Initialization segment
//===========================

debug('Server Manager Initializing\nconfig read from config.json\nInitializing sub-modules');


// initialize discord connection
const discordInstance = new discordFrontEnd.discordFrontEnd(config.client);
// initialize local hardware tie-in
const hardwareInstance = new hardwareMonitor.hardwareMonitor(config.hardware);
// initialize local queue of server instances
const instanceQueue = {};


//====================================
// build instances from local config
//====================================
const arr = config.serverManager.instances;

for (let item in arr) {
    if (arr.hasOwnProperty(item)) {
        debug(`Booting ${arr[item].instance}`);
        instanceQueue[arr[item].instance] = new ServerInstance(config.serverManager.instances[item]);

    }
}


//=========================
//start discord
//=========================
discordInstance.init()
    .then((fulfill, reject) => {
        if (reject) {
            debug(`Discord failed to init: ${reject}`);
            process.exit();
        } else if (fulfill) {

            //async wait for discord bot init
            //debug message hooking
            let reg = /Done \((\d+?[.]\d+?)s\)!/;

            for (let item in arr) {
                if (arr.hasOwnProperty(item)) {
                    instanceQueue[arr[item].instance].registerOutputChannel('test', reg, (data) => {
                        let t = reg.exec(data);
                        debug(`[${instanceQueue[`${item}`].cfg.instance}] booted in ${t[1]}s`);
                        discordInstance.passOutput(`[${instanceQueue[`${item}`].cfg.instance}] booted in ${t[1]}s`);
                    });
                }
            }


            //Global server specific command passing
            let dynReg = /[@](\S+)[ ]*?[!](\S+)[ ]*?[\/](.+)/;
            discordInstance.registerInputQueue('servMatch', dynReg, (data) => {

                //permission check insert here
                //need to work on implementing team based permissionds and such
                //TODO: Implement permissions/grouping

                let matches = dynReg.exec(data.cleanContent);

                if (matches.length > 3) {
                    //we've got a valid one
                    if (instanceQueue.hasOwnProperty(matches[2])) {
                        let inst = instanceQueue[matches[2]];
                        inst.passCommand(matches[3])
                            .then(inst.dbg('cmdPass'))
                            .catch(err => inst.dbg(err));
                    }
                }
            });
        }

    });


//========================
//Start hardware monitor
//========================
hardwareInstance.init()
    .then((resolve, reject) => {

    });



//===============
// Boot instances
//===============
for (let key in instanceQueue) {
    if (instanceQueue[key].autoRespawn) instanceQueue[key].init(true, instanceQueue[key].debugLevel);
}