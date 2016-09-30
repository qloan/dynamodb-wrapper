const async = require('async');

class Observable {

    constructor() {
        this.eventObj = {};
    }

    //Event emitter. First arg must be name of event. Rest param should contain
    //all arguments to pass to handlers. Last argument needs to be callback fn.
    emit(eventName='', ...args) {
        const eventHandlers = this.eventObj[eventName];
        const cb            = args[args.length-1];
        args                = args.slice(0, args.length-1);

        if(typeof(cb) != 'function') {
            throw new Error('Observable::emit() - Last argument must be a callback function!');
        }
        if(!Array.isArray(eventHandlers)) {
            return cb();
        }

        async.eachSeries(eventHandlers, (handler, eachNext) => {
            let handlerArgs = [].concat(args).concat(eachNext);
            handler.apply(this, handlerArgs);
        }, cb);
    }

    on(eventName, fn) {
        if(!this.eventObj[eventName]) {
            this.eventObj[eventName] = [];
        }
        this.eventObj[eventName].push(fn);
    }
}

module.exports = Observable;
