//index list of regex expressions and callbacks, append them to each serverInstance
const ServerManager = require('../serverManager').ServerInstance;
const DiscordInstance = require('../discordbot').DiscordInstance;

/**
 * @param {ServerManager} serverInstance
 * @param {DiscordInstance} discordInstance
 */
function stopCommand(serverInstance, discordInstance) {
    //Global server specific command passing
    let dynReg = /[@](\S+)[ ]*?[!](\S+)[ ]*?[!](.+)/;

    discordInstance.registerInputQueue('stopcommand', dynReg, (data) => {

        //permission check insert here
        //need to work on implementing team based permissionds and such
        //TODO: Implement permissions/grouping

        let matches = dynReg.exec(data.cleanContent);

        if (matches.length > 3) {

            if (serverInstance.confID === matches[2]) {
                //matching server handle
                if (matches[3] === 'stop') {
                    discordInstance.passOutput(`[${serverInstance.confID}] Shutting down, intentionally.`);
                    serverInstance.gracefulTerminate();
                }
            }
        }
    });
}

/**
 * @param {ServerManager} serverInstance
 * @param {DiscordInstance} discordInstance
 */
function startCommand(serverInstance, discordInstance) {
    //Global server specific command passing
    let dynReg = /[@](\S+)[ ]*?[!](\S+)[ ]*?[!](.+)/;

    discordInstance.registerInputQueue('startCommand', dynReg, (data) => {

        //permission check insert here
        //need to work on implementing team based permissionds and such
        //TODO: Implement permissions/grouping

        let matches = dynReg.exec(data.cleanContent);

        if (matches.length > 3) {

            if (serverInstance.confID === matches[2]) {
                //matching server handle
                if (matches[3] === 'start') {
                    discordInstance.passOutput(`[${serverInstance.confID}] Coming back online.`);
                    serverInstance.init();
                }
            }
        }
    });
}

/**
 * @param {ServerManager} serverInstance
 * @param {DiscordInstance} discordInstance
 */
function restartCommand(serverInstance, discordInstance) {
    //Global server specific command passing
    let dynReg = /[@](\S+)[ ]*?[!](\S+)[ ]*?[!](.+)/;

    discordInstance.registerInputQueue('restartCommand', dynReg, (data) => {

        //permission check insert here
        //need to work on implementing team based permissionds and such
        //TODO: Implement permissions/grouping

        let matches = dynReg.exec(data.cleanContent);

        if (matches.length > 3) {

            if (serverInstance.confID === matches[2]) {
                //matching server handle
                if (matches[3] === 'restart') {
                    discordInstance.passOutput(`[${serverInstance.confID}]Bringing 'er around for a reboot.`);
                    serverInstance.gracefulTerminate();
                    setTimeout(() => {
                        serverInstance.handleInit(discordInstance, true, serverInstance.debugLevel, serverInstance.autoRespawn);
                    }, 20000);
                }
            }
        }
    });
}

/**
 * 
 * @param {ServerManager} serverInstance 
 * @param {DiscordInstance} discordInstance 
 */
function anyCommand(serverInstance, discordInstance) {

    let dynReg = /[@](\S+)[ ]*?[!](\S+)[ ]*?[\/](.+)/;

    discordInstance.registerInputQueue('anycommand', dynReg, (data) => {

        //permission check insert here
        //need to work on implementing team based permissionds and such
        //TODO: Implement permissions/grouping

        let matches = dynReg.exec(data.cleanContent);

        if (matches.length > 3) {
            //we've got a valid one
            if (serverInstance.confID === matches[2]) {

                serverInstance.passCommand(matches[3])
                    .then(serverInstance.dbg('cmdPass'))
                    .catch(err => serverInstance.dbg(err));
            }
        }
    });
}

/**
 * 
 * @param {ServerManager} serverInstance 
 * @param {DiscordInstance} discordInstance 
 */
function doneTrigger(serverInstance, discordInstance) {

    let reg = /Done \((\d+?[.]\d+?)s\)!/;

    serverInstance.registerOutputChannel('donetimer', reg, (data) => {
        let t = reg.exec(data);
        serverInstance.dbg(`[${serverInstance.confID}] Booted in ${t[1]}s`);
        discordInstance.passOutput(`[${serverInstance.confID}] Booted in ${t[1]}s`);
    });
}

/**
 * 
 * @param {ServerManager} serverInstance 
 * @param {DiscordInstance} discordInstance 
 */
function worldLoadProgress(serverInstance, discordInstance) {

    if (serverInstance.debugLevel >= 2) {

        let reg =  /\[Server-Worker-\d\/INFO\]: Preparing spawn area: (\d*)[%]/;

        serverInstance.registerOutputChannel('worldProgress', reg, (data) => {
           
            let t = reg.exec(data);

            let pct = parseInt(t[1], 10);

            if (serverInstance.lastWorldLoadPct === null) {

                serverInstance.lastWorldLoadPct = pct;
                serverInstance.dbg(`[${serverInstance.confID}] Loading world: ${pct}%`);
                discordInstance.passOutput(`[${serverInstance.confID}] Loading world: ${pct}%`);

            } else if ( (pct - 10) > serverInstance.lastWorldLoadPct){

                serverInstance.lastWorldLoadPct = pct;
                serverInstance.dbg(`[${serverInstance.confID}] Loading world: ${pct}%`);
                discordInstance.passOutput(`[${serverInstance.confID}] Loading world: ${pct}%`);
            } else {
                //skip
            }

            
        });
    }
}

module.exports = {
    stopCommand,
    startCommand,
    restartCommand,
    anyCommand,
    doneTrigger,
    worldLoadProgress
};