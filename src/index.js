
import React from 'react';
import ReactDOM from 'react-dom';

const { Provider } = require('react-redux');
const { createStore, applyMiddleware, compose } = require('redux');
const thunkMiddleware = require('redux-thunk').default;
const createLogger = require('redux-logger');

const { Router, browserHistory } = require('react-router');

const getRoutes = require('./routes/routing');
const combineReducers = require('./redux/reducer');

// https://bootswatch.com/united/
// const  './css/bootstrap-theme.min.css');

const middlewares = [thunkMiddleware];

if (process.env.NODE_ENV === 'development') {
  const logger = createLogger();
  middlewares.push(logger);
}

let state;
if (window.$REDUX_STATE) {
  state = window.$REDUX_STATE;
}

// const store = createStore(combineReducers, applyMiddleware(...middlewares));
const store = compose(applyMiddleware(...middlewares))(createStore)(combineReducers, state);

const routes = getRoutes(store);

ReactDOM.render(
  <Provider store={store}>
    <Router history={browserHistory} routes={routes} />
  </Provider>,
  document.getElementById('root'),
);
