"use strict";

const bunyan = require('bunyan');
const winston = require('winston');
const log = winston.loggers.get('http');

class Bunyan2Winston {

    constructor(wlog) {
        this.wlog = wlog;
    }

    write(rec) {

        /*
            rec.level (Bunyan log level = TRACE = 10; DEBUG = 20; INFO = 30; WARN = 40; ERROR = 50; FATAL = 60;)
            wlevel (winston log level = silly:5, debug:4, verbose:3, info:2, warn:1, error:0)
        */

        // Map to the appropriate Winston log level (by default 'info', 'warn'
        // or 'error') and call signature: `wlog.log(level, msg, metadata)`.
        let wlevel;
        if (rec.level <= bunyan.TRACE) {
            wlevel = 'silly';
        } else if (rec.level <= bunyan.DEBUG) {
            wlevel = 'debug';
        } else if (rec.level <= bunyan.INFO) {
            wlevel = 'info';
        } else if (rec.level <= bunyan.WARN) {
            wlevel = 'warn';
        } else if (rec.level <= bunyan.ERROR) {
            wlevel = 'error';
        } else /* bunyan.FATAL */ {
            wlevel = 'error';
        }

        // Note: We are *modifying* the log record here. This could be a problem
        // if our Bunyan logger had other streams. This one doesn't.
        const wmsg = rec.msg;
        delete rec.msg;

        // Remove internal bunyan fields that won't mean anything outside of
        // a bunyan context.
        delete rec.v;
        delete rec.level;
        // TODO: more?

        // Note: Winston doesn't handle *objects* in the 'metadata' field well
        // (e.g. the Bunyan record 'time' field is a Date instance, 'req' and
        // 'res' are typically objects). With 'json: true' on a Winston transport
        // it is a bit better, but still messes up 'date'. What exactly to do
        // here is perhaps user-preference.
        rec.time = String(rec.time);
        //Object.keys(rec).forEach(function (key) {
        //    if (typeof(rec[key]) === "object") {
        //        rec[key] = JSON.stringify(rec[key])
        //    }
        //});

        this.wlog.log(wlevel, wmsg, rec);
    }

}

var shim = bunyan.createLogger({
    name: 'http',
    streams: [{
        type: 'raw',
        level: 'trace',
        stream: new Bunyan2Winston(log)
    }]
});

module.exports = shim;
