#!/usr/bin/env node

const debug = process.env.NODE_ENV === 'debug';

const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');

const path = require('path');
const winstonConf = require('winston-config');
const expressWinston = require('express-winston');

const routes = require('./config/routes');

winstonConf.fromFile(path.join(__dirname, './winston-config.json'), (error, winston) => {
  if (error) {
    console.log('error during winston configuration');
    console.log(error);
    process.exit(1);
  } else {
    const app = express();

    app.use(bodyParser.json());
    app.use(compression());

    // winston
    app.use(expressWinston.logger({
      winstonInstance: winston.loggers.get('http'),
      level: 'silly',
    }));

    app.listen(8088, 'localhost');
    winston.info('Server started.');

    routes(app);

    app.use(expressWinston.errorLogger({
      winstonInstance: winston.loggers.get('http'),
      level: 'silly',
    }));

    app.use((err, req, res, next) => {
      // don't print errors
      next();
    });

    if (!debug) {
      const pathToStatic = path.join(__dirname, '../client/build/');
      app.use(express.static(pathToStatic));
      winston.info(`Serving static files from ${pathToStatic}`);
    }
  }
});
