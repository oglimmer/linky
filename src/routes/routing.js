
import React from 'react';
import PropTypes from 'prop-types';


import { Route, Redirect } from 'react-router-dom';

import Layout from '../pages/Layout';
import Login from '../pages/Login';
import PortalPage from '../pages/PortalPage';

const isAuth = (store) => {
  const { auth } = store.getState();
  return typeof auth.token !== 'undefined' && auth.token !== null && auth.token.trim().length > 0;
};

const CategorizedRoute = ({ component: Component, authReq, store, authFailTarget, ...rest }) => (
  <Route
    {...rest}
    render={props => (
    isAuth(store) === authReq ? (
      <Component {...props} />
    ) : (
      <Redirect to={{
        pathname: authFailTarget,
        state: { from: props.location },
      }}
      />
    )
  )}
  />
);
CategorizedRoute.propTypes = {
  component: PropTypes.func.isRequired,
  location: PropTypes.string,
  authReq: PropTypes.bool.isRequired,
  authFailTarget: PropTypes.string.isRequired,
  store: PropTypes.shape().isRequired,
};
CategorizedRoute.defaultProps = {
  location: null,
  authReq: true,
};

const App = ({ store }) => (
  <Layout>
    <CategorizedRoute
      store={store}
      authReq={false}
      authFailTarget="/portalPage"
      exact
      path="/"
      component={Login}
    />
    <CategorizedRoute
      store={store}
      exact
      authFailTarget="/"
      path="/portalPage"
      component={PortalPage}
    />
  </Layout>
);
App.propTypes = {
  store: PropTypes.shape().isRequired,
};

export default App;
