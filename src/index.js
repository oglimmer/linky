
import React from 'react';
import ReactDOM from 'react-dom';

import { AppContainer } from 'react-hot-loader';

import configureStore from './util/configureStore';

let state;
if (window.$REDUX_STATE) {
  state = window.$REDUX_STATE;
}

const store = configureStore(state);

// https://bootswatch.com/united/
// const  './css/bootstrap-theme.min.css');

/* eslint-disable global-require */
const rootElement = document.getElementById('root');
const render = () => {
  const Root = require('./components/Root').default;
  ReactDOM.render(
    <AppContainer>
      <Root store={store} />
    </AppContainer>,
    rootElement,
  );
};
/* eslint-enable global-require */

render();
if (module.hot) {
  module.hot.accept('./components/Root', () => render());
}
