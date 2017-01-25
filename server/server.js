#!/usr/bin/env node

const debug = process.env.NODE_ENV === 'debug';

const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');

const path = require('path');
const winstonConf = require('winston-config');
const expressWinston = require('express-winston');
const morgan = require('morgan');
const fs = require('fs');
const FileStreamRotator = require('file-stream-rotator');

const routes = require('./config/routes');

const winston = winstonConf.fromFileSync(path.join(__dirname, './winston-config.json'));

const app = express();

const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const accessLogStream = FileStreamRotator.getStream({
  date_format: 'YYYYMMDD',
  filename: path.join(logDirectory, 'access-%DATE%.log'),
  frequency: 'daily',
  verbose: false,
});

app.use(bodyParser.json());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));


app.use(expressWinston.logger({
  winstonInstance: winston.loggers.get('http'),
}));

routes(app);

if (!debug) {
  const pathToStatic = path.join(__dirname, '../client/build');
  app.use(express.static(pathToStatic));

  // support for browserHistory (instead of hashHistory)
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(pathToStatic, 'index.html'));
  });

  winston.loggers.get('http').info(`Serving static files from ${pathToStatic}`);
}

app.use(expressWinston.errorLogger({
  winstonInstance: winston.loggers.get('http-errors'),
}));

const port = process.env.PORT || '8088';
const bind = process.env.BIND || '127.0.0.1';
app.listen(port, bind);
winston.loggers.get('http').info(`Server started at ${bind}:${port}.`);
