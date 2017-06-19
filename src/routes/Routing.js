
import React from 'react';
import PropTypes from 'prop-types';

import Layout from '../pages/Layout';
import r from './routes';

const Routing = ({ store }) => (
  <Layout>
    { r.routesFromStore(store).map(route => (<route.tagName key={Math.random()} {...route} />))}
  </Layout>
);
Routing.propTypes = {
  store: PropTypes.shape().isRequired,
};

export default Routing;
