
const debug = require('debug')('mainWrapper');
const config = require('./config.json');

// local modules
const hardwareMonitor = require('./modules/hardwareMonitor.js');
const discordFrontEnd = require('./modules/discordbot.js');
const regexHooker = require('./modules/regexHooker.js').RegexHooker;
const ServerInstance = require('./modules/serverManager.js').ServerInstance;



// initialize discord connection
const DiscordInstance = new discordFrontEnd.discordFrontEnd(config.client);
// initialize local hardware tie-in
const HardwareInstance = new hardwareMonitor.hardwareMonitor(config.hardware);
//initialize regexHooker
const RegexHooker = new regexHooker(config.regexHooker);

// initialize local queue of server instances
//
const instanceQueue = {};


//=========================
//start discord
//=========================
DiscordInstance.init()
    .then((fulfill, reject) => {
        if (reject) {
            debug(`Discord failed to init: ${reject}`);
            process.exit();
        } else if (fulfill) {

            //async wait for discord bot init
            //debug message hooking
            let reg = /Done \((\d+?[.]\d+?)s\)!/;

            for (let item in instanceArray) {
                if (instanceArray.hasOwnProperty(item)) {
                    instanceQueue[instanceArray[item].instance].registerOutputChannel('test', reg, (data) => {
                        let t = reg.exec(data);
                        debug(`[${instanceQueue[`${item}`].cfg.instance}] booted in ${t[1]}s`);
                        DiscordInstance.passOutput(`[${instanceQueue[`${item}`].cfg.instance}] booted in ${t[1]}s`);
                    });
                }
            }


            //Global server specific command passing
            let dynReg = /[@](\S+)[ ]*?[!](\S+)[ ]*?[\/](.+)/;
            DiscordInstance.registerInputQueue('servMatch', dynReg, (data) => {

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


//====================================
// Build instances from local config
//====================================
const instanceArray = config.serverManager.instances;

for (let item in instanceArray) {
    if (instanceArray.hasOwnProperty(item)) {
        debug(`Loading config for: ${instanceArray[item].instance}`);
        instanceQueue[instanceArray[item].instance] = new ServerInstance(config.serverManager.instances[item]);

    }
}


//========================
//Start hardware monitor
//========================
HardwareInstance.init()
    .then((resolve, reject) => {

    });


//=======================
//RegexHooker init
//=======================
RegexHooker.init()
    .then((resolve, reject) => {

    });


//===============
// Boot instances, defer to config for start automatically or otherwise
//===============
for (let key in instanceQueue) {
    instanceQueue[key].handleInit();
}