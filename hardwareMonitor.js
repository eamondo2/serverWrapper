const systInfo = require('systeminformation');
const emitter = require('events').EventEmitter;
const debug = require('debug')('hardwareMonitor');
const ConfigParser = require('configparser');
const os = require('os');
/**
 * Bundle of methods for polling temps etc
 * contains event queue and emitter, can set temp or cpu load events to dispatch messages
 */
class hardwareMonitor {

    /**
     * initialize
     * @param {String} configLocation 
     */
    constructor ( configLocation, cParser ) {
        //store the config file location
        this.confLocation = configLocation;
        this.cParser = cParser;
        

        this.hostname = os.hostname();
       
        debug(`Initializing hardware polling module for host ${this.hostname}`);


        
    }

}

module.exports = {

    hardwareMonitor

};


