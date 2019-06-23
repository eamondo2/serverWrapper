
const debug = require('debug')('mainWrapper');
const config = require('./config.json');

// local modules
const HardwareMonitor = require('./modules/hardwareMonitor.js').HardwareMonitor;
const DiscordInstance = require('./modules/discordbot.js').DiscordInstance;
const RegexHooker = require('./modules/regexHooker.js').RegexHooker;
const ServerInstance = require('./modules/serverManager.js').ServerInstance;



// initialize discord connection
const discordInst = new DiscordInstance(config.client);
// initialize local hardware tie-in
const hardwareMonInst = new HardwareMonitor(config.hardware);
//initialize regexHooker
const regexManager = new RegexHooker(config.regexHooker);

//local queue of instances
const instanceQueue = {};

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

//=========================
//start discord
//=========================
discordInst.init()
    .then((fulfill, reject) => {
        if (reject) {
            debug(`Discord failed to init: ${reject}`);
            process.exit();
        } else if (fulfill) {

            //=======================
            //RegexHooker init
            //=======================
            regexManager.init(instanceQueue, discordInst);

            //===============
            // Boot instances, defer to config for start automatically or otherwise
            //===============
            for (let key in instanceQueue) {
                instanceQueue[key].handleInit(discordInst);
            }

            //========================
            //Start hardware monitor
            //========================
            hardwareMonInst.init()
                .then((resolve, reject) => {
                    //TODO
                });

        }

    });