
import React from 'react';
import ReactDOM from 'react-dom';
import Root from './components/Root';

import configureStore from './util/configureStore';

let state;
if (window.$REDUX_STATE) {
  state = window.$REDUX_STATE;
}

const store = configureStore(state);

ReactDOM.render(
  <Root store={store} />,
  document.getElementById('root'),
);

