#!/usr/bin/env node

"use strict";

const debug = process.env.NODE_ENV === "debug";

const restify = require('restify');

const path = require('path');
const winstonConf = require('winston-config');

winstonConf.fromFile(path.join(__dirname, './winston-config.json'), (error, winston) => {
  if (error) {
    console.log('error during winston configuration');
    console.log(error);
    process.exit(1);
  } else {
    const restifyWinstonBridge = require('./app/util/restifyWinstonBridge');

    restifyWinstonBridge.info('Winston logging initialzed properly.');

    const server = restify.createServer({
      name: 'Linky-REST-Service',
      version: '1.0.0',
      log: restifyWinstonBridge
    });

    server.use(restify.acceptParser(server.acceptable));
    server.use(restify.bodyParser());
    server.use(restify.gzipResponse());

    server.listen(8088, 'localhost', function() {
      restifyWinstonBridge.info('%s listening at %s', server.name, server.url);
    });

    require('./config/routes')(server);

    if(!debug) {
      server.get(/\//, restify.serveStatic({
        directory: '../client/src/client',
        default: 'index.html'
      }));
      server.get(/\/?.*\.html/, restify.serveStatic({
        directory: '../client/src/client',
        default: 'index.html'
      }));
      server.get(/\/dist\/?.*/, restify.serveStatic({
        directory: '../client/src/client/dist',
        default: 'bundle.js'
      }));
    }
  }

});
