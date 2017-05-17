
import React from 'react';
import PropTypes from 'prop-types';

import { Provider } from 'react-redux';

import { BrowserRouter } from 'react-router-dom';

import App from '../routes/routing';

// key={Math.random()} is needed for react-hot-loading

const Root = ({ store }) => (
  <Provider store={store}>
    <BrowserRouter>
      <App store={store} />
    </BrowserRouter>
  </Provider>
);
Root.propTypes = {
  store: PropTypes.shape().isRequired,
};

export default Root;
