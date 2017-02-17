
const thunkMiddleware = require('redux-thunk').default;
const createLogger = require('redux-logger');

const { createStore, applyMiddleware } = require('redux');

const combineReducers = require('../redux/reducer');

const middlewares = [thunkMiddleware];

const logger = createLogger();
middlewares.push(logger);

function configureStore(state) {
  const store = createStore(combineReducers, state, applyMiddleware(...middlewares));

  /* eslint-disable global-require */
  if (module.hot) {
    module.hot.accept('../redux/reducer', () => {
      const nextRootReducer = require('../redux/reducer');
      store.replaceReducer(nextRootReducer);
    });
  }
  /* eslint-enable global-require */

  return store;
}

module.exports = configureStore;
