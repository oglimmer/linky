
import express from 'express';

import contentSecurityPolicy from 'content-security-policy';
import xFrameOptions from 'x-frame-options';
import xXssProtection from 'x-xss-protection';
import hsts from 'hsts';
import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import responseTime from 'response-time';

import path from 'path';
import fs from 'fs';

import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { StaticRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

import { applyMiddleware, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';

import winston from 'winston';
import expressWinston from 'express-winston';
import morgan from 'morgan';
import rfs from 'rotating-file-stream';

// must be the first relative import
import './util/LogInit';
import { compConfigRest, compConfigDistResources, compConfigEjsPath, compConfigDynamicContent,
  compConfigStaticResources, compConfigDynamicBundleGeneration, bind, port } from './util/serverConfig';

import { webpack, webpackDevMiddleware, webpackHotMiddleware, emptyCache, proxy } from './debug-mode';

import httpRoutes from './util/httpRoutesEntry';

import combinedReducers from '../src/redux/reducer';

import fetchComponentData from './util/fetchComponentData';

import Routing from '../src/routes/Routing';

import serverPropsLoader from './util/serverPropsLoader';
import BuildInfo from '../src/util/BuildInfo';
import { ensureNotArchiveDomain } from './logic/Archive';

import properties from './util/linkyproperties';
import AlertAdapter from '../src/components/AlertAdapter';

import postStartupClean from './util/postStartupClean';

import { hashSha256Base64 } from './util/HashUtil';

// import linkCheckServer from '../link-check-server';

serverPropsLoader(BuildInfo);

const app = express();

const logDirectory = path.resolve(__dirname, properties.server.log.access.targetDir);
if (!fs.existsSync(logDirectory)) {
  console.log(`TARGET DIR FOR ACCESS-LOG DOES NOT EXIST!!! ${logDirectory}`);
} else {
  console.log(`Using ${logDirectory} for access logs`);

  const accessLogStream = rfs((time, index) => {
    if (!time) {
      return 'access.log';
    }
    const pad = num => (num > 9 ? '' : '0') + num;
    const month = `${time.getFullYear()}${pad(time.getMonth() + 1)}`;
    const day = pad(time.getDate());
    const hour = pad(time.getHours());
    const minute = pad(time.getMinutes());
    return `access-${month}${day}-${hour}${minute}-${pad(index)}.log.gz`;
  }, {
    interval: '1d',
    path: logDirectory,
    compress: true,
  });
  morgan.token('remote-addr', (req) => {
    const ffHeaderValue = req.headers['x-forwarded-for'];
    return ffHeaderValue || req.connection.remoteAddress;
  });
  app.use(morgan('combined', {
    stream: accessLogStream,
    skip: req => req.method === 'HEAD',
  }));
}

const globalCSPConfig = Object.assign({},
  contentSecurityPolicy.STARTER_OPTIONS, {
    'style-src': ['https://www.oglimmer.de', contentSecurityPolicy.SRC_SELF, contentSecurityPolicy.SRC_USAFE_INLINE],
    'font-src': ['https://www.oglimmer.de', contentSecurityPolicy.SRC_SELF],
    'plugin-types': '',
  },
);
const notAtArchive = middleware => (req, res, next) => {
  if (req.originalUrl.startsWith('/archive/') || req.originalUrl === '/static/portal.html') {
    next();
  } else {
    middleware(req, res, next);
  }
};

app.use(notAtArchive(contentSecurityPolicy.getCSP(globalCSPConfig)));
app.use(notAtArchive(xXssProtection()));
app.use(xFrameOptions());
app.use(hsts());
app.use(responseTime());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(compression());
app.use(cookieParser());

app.use(responseTime((req, res, time) => {
  if (req.method === 'HEAD') {
    return;
  }
  winston.loggers.get('application').debug('Request %s for %s took %d millis', req.method, req.originalUrl, Math.round(time));
}));

app.use(expressWinston.logger({
  winstonInstance: winston.loggers.get('http'),
}));

/* ***********************************
      load-balancer health check
*********************************** */
app.head('*', (req, res) => {
  res.status(200).end();
});

/* ***********************************
           REST API
*********************************** */
if (compConfigRest === 'enable') {
  winston.loggers.get('application').info('Serving REST endpoints');
  httpRoutes(app);
}
if (compConfigRest === 'proxy') {
  const proxyPort = process.env.PROXY_PORT || '8081';
  const proxyBind = process.env.PROXY_BIND || '127.0.0.1';
  winston.loggers.get('application').info(`Using proxy ${proxyBind}:${proxyPort} to REST endpoints`);
  ['/rest', '/leave', '/auth', '/authback', '/archive'].forEach((restPath) => {
    app.use(restPath, proxy(`${proxyBind}:${proxyPort}`, {
      // express-http-proxy cuts off the prefix of the url matching restPath
      proxyReqPathResolver: req => `${restPath}${req.url}`,
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        /* eslint-disable no-param-reassign */
        proxyReqOpts.headers.host = srcReq.headers.host;
        /* eslint-enable no-param-reassign */
        return proxyReqOpts;
      },
    }));
  });
}

/* ***********************************
   static (dynamic files are pre-generated) files for PROD
*********************************** */
if (compConfigDistResources === 'enable') {
  const staticFiles = path.join(__dirname, '../dist');
  winston.loggers.get('application').info(`Serving static files from ${staticFiles}`);
  app.use(express.static(staticFiles, { maxAge: '1d' }));
}

/* ***********************************
   static & dynamic files for DEV
*********************************** */
if (compConfigStaticResources === 'enable') {
  const staticFiles = path.join(__dirname, '../static-resources');
  winston.loggers.get('application').info(`Serving static files from ${staticFiles}`);
  app.use('/static', express.static(staticFiles, { maxAge: '1d' }));
}
if (compConfigDynamicBundleGeneration === 'enable') {
  /* eslint-disable global-require */
  const config = require('../build/webpack.dev.config');
  /* eslint-enable global-require */
  const compiler = webpack(config);
  app.use(webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath, stats: { colors: true } }));
  app.use(webpackHotMiddleware(compiler));
  winston.loggers.get('application').info('Server running with dynamic bundle.js generation');
}

/* ***********************************
            dynamic content
*********************************** */
if (compConfigDynamicContent === 'enable') {
  /* ***********************************
              ejs
  *********************************** */
  const pathViews = path.join(__dirname, compConfigEjsPath);
  winston.loggers.get('application').info(`Page generation using ejs files from ${pathViews}`);
  app.set('views', pathViews);
  app.set('view engine', 'ejs');

  const finalCreateStore = applyMiddleware(thunkMiddleware)(createStore);
  app.use(async (req, res) => {
    if (ensureNotArchiveDomain(req.headers.host)) {
      res.status(403).send(`Forbidden on ${properties.server.archive.domain}`);
      return;
    }
    const store = finalCreateStore(combinedReducers);

    winston.loggers.get('application').debug(`Processing match at url = ${req.url}`);

    if (process.env.NODE_ENV === 'development') {
      emptyCache();
    }

    try {
      await fetchComponentData(store.dispatch, req, res);
      const context = {};
      const reactHtml = ReactDOMServer.renderToString(
        <StaticRouter location={req.url} context={context}>
          <Provider store={store}>
            <div>
              <AlertAdapter />
              <Routing store={store} />
            </div>
          </Provider>
        </StaticRouter>,
      );

      if (context.url) {
        res.writeHead(301, {
          Location: context.url,
        });
        res.end();
      } else {
        const initialState = `window.$REDUX_STATE = ${JSON.stringify(store.getState())}`;
        const initialStateHash = hashSha256Base64(initialState);
        const setContentSecurityPolicy = contentSecurityPolicy.getCSP(Object.assign({},
          globalCSPConfig, {
            'script-src': [contentSecurityPolicy.SRC_SELF, `'sha256-${initialStateHash}'`],
          },
        ));
        setContentSecurityPolicy(req, res, () => {});
        if (properties.server.headers && properties.server.headers.dynamicPages) {
          Object.keys(properties.server.headers.dynamicPages).forEach((propKey) => {
            const [key, value] = properties.server.headers.dynamicPages[propKey].split(':');
            res.append(key.trim(), value.trim());
          });
        }
        res.render('index.ejs', { reactHtml, initialState });
      }
    } catch (err) {
      if (!Object.prototype.hasOwnProperty.call(err, 'message') || err.message !== 'forward') {
        winston.loggers.get('application').error(err);
        res.status(500).send('Server error');
      }
    }
  });
}

// example of handling 404 pages
app.get('*', (req, res) => {
  winston.loggers.get('application').error(`Server.js > 404 - Page Not Found ${req.url}`);
  res.status(404).send('Server.js > 404 - Page Not Found');
});

// global error catcher, need four arguments
// triggered when any `RuntimeException` is thrown
// (e.g. TypeError: Cannot read property in a Controller.js)
/* eslint-disable no-unused-vars */
app.use((err, req, res, next) => {
  if (!err.customError) {
    winston.loggers.get('application').error('Error on request %s %s', req.method, req.url);
    winston.loggers.get('application').error(err.stack);
    res.status(500).send('Server error');
  }
});
/* eslint-enable no-unused-vars */

app.use(expressWinston.errorLogger({
  winstonInstance: winston.loggers.get('http-errors'),
}));

process.on('uncaughtException', (evt) => {
  winston.loggers.get('application').error('uncaughtException: ', evt);
});

app.listen(port, bind, (err) => {
  if (err) {
    winston.loggers.get('application').error(err);
  } else {
    winston.loggers.get('application').info(`Server started at ${bind}:${port}....`);
  }
});

postStartupClean();

// setInterval(() => { linkCheckServer(); }, 1000 * 60 * 60 * 24);
