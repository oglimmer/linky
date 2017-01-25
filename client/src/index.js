
import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';

import combineReducers from './redux/reducer';
import RootElement from './components/RootElement';

import { initialLoad } from './redux/actions';

// https://bootswatch.com/united/
import './css/bootstrap-theme.min.css';

const logger = createLogger();
const store = createStore(combineReducers,
  applyMiddleware(thunkMiddleware, logger));

store.dispatch(initialLoad());

ReactDOM.render(
  <Provider store={store}>
    <RootElement />
  </Provider>,
  document.getElementById('root'));
