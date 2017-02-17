
import React, { PropTypes } from 'react';

import { Provider } from 'react-redux';

import { Router, browserHistory } from 'react-router';

import getRoutes from '../routes/routing';

// key={Math.random()} is needed for react-hot-loading

const Root = ({ store }) => {
  const routes = getRoutes(store);
  return (
    <Provider store={store}>
      <Router history={browserHistory} routes={routes} key={Math.random()} />
    </Provider>
  );
};
Root.propTypes = {
  store: PropTypes.shape().isRequired,
};

export default Root;
