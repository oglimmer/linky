
import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';

import { Router, browserHistory } from 'react-router';

import combineReducers from './redux/reducer';

import { initialLoad, setAuthToken } from './redux/actions';

// https://bootswatch.com/united/
import './css/bootstrap-theme.min.css';

import Layout from './pages/Layout';
import Login from './pages/Login';
import PortalPage from './pages/PortalPage';


const middlewares = [thunkMiddleware];

if (process.env.NODE_ENV === 'development') {
  const logger = createLogger();
  middlewares.push(logger);
}

// const store = createStore(combineReducers, applyMiddleware(...middlewares));
const store = compose(applyMiddleware(...middlewares))(createStore)(combineReducers);

const { authToken } = localStorage;
if (authToken) {
  store.dispatch(setAuthToken(authToken));
  store.dispatch(initialLoad(authToken));
}

const checkSecured = (newState, replace) => {
  const { auth } = store.getState();
  if (!auth.token) {
    replace('/');
  }
};
const redirectIfLoggedIn = (newState, replace) => {
  const { auth } = store.getState();
  if (auth.token) {
    replace('/portalPage');
  }
};

const routesConfig = {
  path: '/',
  component: Layout,
  indexRoute: {
    component: Login,
    onEnter: redirectIfLoggedIn,
  },
  childRoutes: [
    {
      path: 'portalPage',
      component: PortalPage,
      onEnter: checkSecured,
    },
  ],
};

ReactDOM.render(
  <Provider store={store}>
    <Router history={browserHistory} routes={routesConfig} />
  </Provider>,
  document.getElementById('root'));
