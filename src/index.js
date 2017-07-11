
import React from 'react';
import ReactDOM from 'react-dom';
import Immutable from 'immutable';

import { AppContainer } from 'react-hot-loader';

import configureStore from './util/configureStore';
import immutableConverter from './util/ImmutableConverter';

let state;
if (window.$REDUX_STATE) {
  state = window.$REDUX_STATE;
  state.mainData.linkList = Immutable.List(state.mainData.linkList);
  state.mainData.tagList = Immutable.List(state.mainData.tagList);
  state.mainData.feedUpdatesList = Immutable.List(state.mainData.feedUpdatesList);
  state.mainData.feedUpdatesDetails = Immutable.List(state.mainData.feedUpdatesDetails);
  state.tagHierachyData.tagHierachy = immutableConverter(state.tagHierachyData.tagHierachy);
}

const store = configureStore(state);

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
