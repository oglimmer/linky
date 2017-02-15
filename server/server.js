#!/usr/bin/env node

const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const path = require('path');

const React = require('react');
const ReactDOMServer = require('react-dom/server');

const { RouterContext, match } = require('react-router');
const { Provider } = require('react-redux');

const { applyMiddleware, createStore } = require('redux');
const thunkMiddleware = require('redux-thunk').default;

const restRoutes = require('./util/restRoutesEntry');

const getRoutes = require('../src/routes/routing');

const combinedReducers = require('../src/redux/reducer');

const fetchComponentData = require('./util/fetchComponentData');
const preMatchRouteFetchData = require('./util/preMatchRouteFetchData');

const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const config = require('../build/webpack.dev.config');

const app = express();

app.use(bodyParser.json());
app.use(compression());
app.use(cookieParser());

// Set view path
// set up ejs for templating. You can use whatever
app.set('views', path.join(__dirname, '../static'));
app.set('view engine', 'ejs');

restRoutes(app);

app.use(express.static(path.join(__dirname, '../static')));

if (process.env.NODE_ENV === 'development') {
  const compiler = webpack(config);
  app.use(webpackDevMiddleware(compiler, { noInfo: true, publicPath: config.output.publicPath }));
  app.use(webpackHotMiddleware(compiler));
  console.log('Server running with dynamic bundle.js generation');
}

const finalCreateStore = applyMiddleware(thunkMiddleware)(createStore);

app.use((req, res) => {
  const store = finalCreateStore(combinedReducers);

  preMatchRouteFetchData(store, req)
  .then(() => {
    console.log(`Processing match at url = ${req.url}`);

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
  });
});

// example of handling 404 pages
app.get('*', (req, res) => {
  console.log('Server.js > 404 - Page Not Found');
  res.status(404).send('Server.js > 404 - Page Not Found');
});

// global error catcher, need four arguments
app.use((err, req, res, next) => {
  console.log('Error on request %s %s', req.method, req.url);
  console.log(err.stack);
  res.status(500).send('Server error');
});

process.on('uncaughtException', (evt) => {
  console.log('uncaughtException: ', evt);
});

const port = process.env.PORT || '8080';
const bind = process.env.BIND || '127.0.0.1';
app.listen(port, bind);

console.log('server started....');
