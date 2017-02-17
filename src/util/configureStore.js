
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';

import { createStore, applyMiddleware } from 'redux';

import combineReducers from '../redux/reducer';

const middlewares = [thunkMiddleware];

const logger = createLogger();
middlewares.push(logger);

function configureStore(state) {
  const store = createStore(combineReducers, state, applyMiddleware(...middlewares));

  /* eslint-disable global-require */
  if (module.hot) {
    module.hot.accept('../redux/reducer', () => {
      const nextRootReducer = require('../redux/reducer').default;
      store.replaceReducer(nextRootReducer);
    });
  }
  /* eslint-enable global-require */

  return store;
}

export default configureStore;
