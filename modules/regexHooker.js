const debug = require('debug')('regexHooker');

class RegexHooker {

    /**
     * Initialize
     * @param {String} config local config snippet
     */
    constructor (config) {
        this.cfg = config;
        

        debug('Initializing RegExp hooker');
        
    }

    init() {
        //emitter 

        return new Promise( (resolve, reject) => {
            //todo
        });

    }

}



module.exports = {
    RegexHooker
};