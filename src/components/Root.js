
import React from 'react';
import PropTypes from 'prop-types';

import { Provider } from 'react-redux';

import { BrowserRouter } from 'react-router-dom';

import Routing from '../routes/Routing';

// key={Math.random()} is needed for react-hot-loading

const Root = ({ store }) => (
  <Provider store={store}>
    <BrowserRouter>
      <Routing store={store} />
    </BrowserRouter>
  </Provider>
);
Root.propTypes = {
  store: PropTypes.shape().isRequired,
};

export default Root;
