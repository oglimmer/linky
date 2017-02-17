
const React = require('react');

const { Provider } = require('react-redux');

const { Router, browserHistory } = require('react-router');

const getRoutes = require('../routes/routing');

const configureStore = require('../util/configureStore');

// https://bootswatch.com/united/
// const  './css/bootstrap-theme.min.css');

let state;
if (window.$REDUX_STATE) {
  state = window.$REDUX_STATE;
}

const store = configureStore(state);

const routes = getRoutes(store);

const Root = () => (
  <Provider store={store}>
    <Router history={browserHistory} routes={routes} />
  </Provider>
);

module.exports = Root;
