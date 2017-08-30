
import React from 'react';
import PropTypes from 'prop-types';

import r from './routes';

const Routing = ({ store }) => (
  <div>
    { r.routesFromStore(store).map(route => (<route.tagName key={Math.random()} {...route} />))}
  </div>
);
Routing.propTypes = {
  store: PropTypes.shape().isRequired,
};

export default Routing;
