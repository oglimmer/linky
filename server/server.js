
import express from 'express';

import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import path from 'path';

import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { RouterContext, match } from 'react-router';
import { Provider } from 'react-redux';

import { applyMiddleware, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';

import winstonConf from 'winston-config';
import expressWinston from 'express-winston';

import { webpack, webpackDevMiddleware, webpackHotMiddleware, emptyCache } from './debug-mode';

import httpRoutes from './util/httpRoutesEntry';

import combinedReducers from '../src/redux/reducer';

import fetchComponentData from './util/fetchComponentData';
import preMatchRouteFetchData from './util/preMatchRouteFetchData';

import properties from './util/linkyproperties';

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

const serverDirectory = process.env.NODE_ENV === 'production' ? '../dist' : '../static';

// Set view path
// set up ejs for templating. You can use whatever
app.set('views', path.join(__dirname, serverDirectory));
app.set('view engine', 'ejs');

httpRoutes(app);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, serverDirectory)));
}

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

  preMatchRouteFetchData(store, req, res)
  .then(() => {
    winston.loggers.get('application').debug(`Processing match at url = ${req.url}`);

    if (process.env.NODE_ENV === 'development') {
      emptyCache();
    }
    /* eslint-disable global-require */
    const getRoutes = require('../src/routes/routing').default;
    /* eslint-enable global-require */

    const routes = getRoutes(store);

    // react-router
    match({ routes, location: req.url }, (error, redirectLocation, renderProps) => {
      if (error) {
        // console.log(`error = ${error.message}`);
        return res.status(500).send(error.message);
      }

      if (redirectLocation) {
        // console.log(`redirectLocation = ${redirectLocation.pathname}`);
        return res.redirect(302, redirectLocation.pathname + redirectLocation.search);
      }

      if (renderProps == null) {
        // return next('err msg: route not found');
        // yield control to next middleware to handle the request
        // console.log('not found!');
        return res.status(404).send('Not found!!');
      }

      // console.log( '\nserver > renderProps: \n',
      // require('util').inspect( renderProps, false, 1, true) )
      // console.log( '\nserver > renderProps: \n',
      // require('util').inspect( renderProps.components, false, 3, true) )

      // this is where universal rendering happens,
      // fetchComponentData() will trigger actions listed in static "needs" props in each
      // container component
      // and wait for all of them to complete before continuing rendering the page,
      // hence ensuring all data needed was fetched before proceeding
      //
      // renderProps: contains all necessary data, e.g: routes, router, history, components...
      fetchComponentData(store.dispatch, renderProps.components, renderProps.params, store)
      .then(() => {
        const reactHtml = ReactDOMServer.renderToString((
          <Provider store={store}>
            <RouterContext {...renderProps} />
          </Provider>
        ));

        // console.log('reactHtml:\n', reactHtml);

        const initialState = JSON.stringify(store.getState());

        // console.log('state: ', initialState);

        res.render('index.ejs', { reactHtml, initialState });
      })
      .catch(err => res.end(err.message));

      return null;
    });
  })
  .catch((err) => {
    if (!Object.prototype.hasOwnProperty.call(err, 'message') || err.message !== 'forward') {
      console.log(err);
    }
  });
});

// example of handling 404 pages
app.get('*', (req, res) => {
  winston.loggers.get('application').error('Server.js > 404 - Page Not Found');
  res.status(404).send('Server.js > 404 - Page Not Found');
});

// global error catcher, need four arguments
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
app.listen(port, bind);

winston.loggers.get('application').info(`Server started at ${bind}:${port}....`);
