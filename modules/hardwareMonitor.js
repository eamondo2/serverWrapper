const systInfo = require('systeminformation');
const emitter = require('events').EventEmitter;
const debug = require('debug')('hardwareMonitor');
const os = require('os');
/**
 * Bundle of methods for polling temps etc
 * contains event queue and emitter, can set temp or cpu load events to dispatch messages
 */
class HardwareMonitor {

    /**
     * initialize
     * @param {String} config local config snippet 
     */
    constructor ( config) {
        //store the config file location
        this.cfg = config;
        this.hostname = os.hostname();
       
        debug(`Initializing hardware polling module for host ${this.hostname}`);

    }

    init() {
        //set up emitter, peg levels, get state check loop started
        return new Promise( ( resolve, reject ) => {
            //todo
        });
    }
    

}

module.exports = {

    HardwareMonitor

};


