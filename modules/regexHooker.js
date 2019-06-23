const debug = require('debug')('regexHooker');
const ServerInstance = require('./serverManager.js').ServerInstance;
const DiscordInstance = require('./discordbot').DiscordInstance;
const path = require('path');
class RegexHooker {

    /**
     * Initialize
     * @param {String} config local config snippet
     */
    constructor (config) {
        this.cfg = config;
        this.autoScan = this.cfg.autoScan;

        this.dbg = function (msg) {
            debug(`[RegexHooker]: ${msg}`);
        };

        
    }

    /**
     * scans the cfg dir and appends relevant hooks
     * @param {[ServerInstance]} instanceQueue 
     * @param {DiscordInstance} discordInst
     */
    scanCfg(instanceQueue, discordInst){
        const modules = require('./regexHooks');
    
        for (let inst in instanceQueue){
            modules.globalCalls.stopCommand(instanceQueue[inst], discordInst);
            modules.globalCalls.anyCommand(instanceQueue[inst], discordInst);
            modules.globalCalls.doneTrigger(instanceQueue[inst], discordInst);
            modules.globalCalls.startCommand(instanceQueue[inst], discordInst);
            modules.globalCalls.worldLoadProgress(instanceQueue[inst], discordInst);
            modules.globalCalls.restartCommand(instanceQueue[inst], discordInst);

        }
    
    }

    /**
     * initializes the hook manager
     * @param {[ServerInstance]} instanceQueue
     * @param {DiscordInstance} discordInst
     */
    init(instanceQueue, discordInst) {

        if (this.autoScan) {
            this.dbg('AutoScan enabled, loading...');
            this.scanCfg(instanceQueue, discordInst);            
        }

    }

}



module.exports = {
    RegexHooker
};