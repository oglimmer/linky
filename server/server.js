
import express from 'express';

import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import path from 'path';

import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { StaticRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

import { applyMiddleware, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';

import winstonConf from 'winston-config';
import expressWinston from 'express-winston';

import { webpack, webpackDevMiddleware, webpackHotMiddleware, emptyCache } from './debug-mode';

import httpRoutes from './util/httpRoutesEntry';

import combinedReducers from '../src/redux/reducer';

import fetchComponentData from './util/fetchComponentData';

import properties from './util/linkyproperties';

import Routing from '../src/routes/Routing';

const logConfig = path.resolve(__dirname, properties.server.log.path);
console.log(`Using logConfig from ${logConfig}`);
const winston = winstonConf.fromFileSync(logConfig);

const app = express();

app.use(bodyParser.json());
app.use(compression());
app.use(cookieParser());

app.use(expressWinston.logger({
  winstonInstance: winston.loggers.get('http'),
}));

const serverDirectory = process.env.NODE_ENV === 'production' ? '../dist' : '../dynamic-resources';

// Set view path
// set up ejs for templating. You can use whatever
app.set('views', path.join(__dirname, serverDirectory));
app.set('view engine', 'ejs');

httpRoutes(app);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, serverDirectory)));
}

app.use(express.static(path.join(__dirname, '../static-resources')));

if (process.env.NODE_ENV === 'development') {
  /* eslint-disable global-require */
  const config = require('../build/webpack.dev.config');
  /* eslint-enable global-require */
  const compiler = webpack(config);
  app.use(webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath, stats: { colors: true } }));
  app.use(webpackHotMiddleware(compiler));
  winston.loggers.get('application').info('Server running with dynamic bundle.js generation');
}

const finalCreateStore = applyMiddleware(thunkMiddleware)(createStore);

app.use((req, res) => {
  const store = finalCreateStore(combinedReducers);

  winston.loggers.get('application').debug(`Processing match at url = ${req.url}`);

  if (process.env.NODE_ENV === 'development') {
    emptyCache();
  }

  fetchComponentData(store.dispatch, req, res)
  .then(() => {
    const context = {};
    const reactHtml = ReactDOMServer.renderToString(
      <StaticRouter location={req.url} context={context}>
        <Provider store={store}>
          <Routing store={store} />
        </Provider>
      </StaticRouter>,
    );

    if (context.url) {
      res.writeHead(301, {
        Location: context.url,
      });
      res.end();
    } else {
      const initialState = JSON.stringify(store.getState());
      res.render('index.ejs', { reactHtml, initialState });
    }
  })
  .catch((err) => {
    if (!Object.prototype.hasOwnProperty.call(err, 'message') || err.message !== 'forward') {
      winston.loggers.get('application').error(err);
      res.status(500).send('Server error');
    }
  });
});

// example of handling 404 pages
app.get('*', (req, res) => {
  winston.loggers.get('application').error('Server.js > 404 - Page Not Found');
  res.status(404).send('Server.js > 404 - Page Not Found');
});

// global error catcher, need four arguments
// triggered when any `RuntimeException` is thrown
// (e.g. TypeError: Cannot read property in a Controller.js)
/* eslint-disable no-unused-vars */
app.use((err, req, res, next) => {
  winston.loggers.get('application').error('Error on request %s %s', req.method, req.url);
  winston.loggers.get('application').error(err.stack);
  res.status(500).send('Server error');
});
/* eslint-enable no-unused-vars */

app.use(expressWinston.errorLogger({
  winstonInstance: winston.loggers.get('http-errors'),
}));

process.on('uncaughtException', (evt) => {
  winston.loggers.get('application').error('uncaughtException: ', evt);
});

const port = process.env.PORT || '8080';
const bind = process.env.BIND || '127.0.0.1';
app.listen(port, bind, (err) => {
  if (err) {
    winston.loggers.get('application').error(err);
  } else {
    winston.loggers.get('application').info(`Server started at ${bind}:${port}....`);
  }
});
