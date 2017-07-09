
import React from 'react';
import PropTypes from 'prop-types';

import { Route, Redirect } from 'react-router-dom';

import Login from '../pages/Login';
import PortalPage from '../pages/PortalPage';
import TagPage from '../pages/TagPage';
import Impressum from '../pages/Impressum';

import { initialLoad } from '../../src/redux/actions';

const isAuth = (store) => {
  const { auth } = store.getState();
  return typeof auth.token !== 'undefined' && auth.token !== null && auth.token.trim().length > 0;
};

const CategorizedRoute = ({ component: Component, authReq, auth, authFailTarget, ...rest }) => (
  <Route
    {...rest}
    render={props => (
      (typeof auth === 'function' ? auth() : auth) === authReq ? (
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
  auth: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
  ]).isRequired,
};
CategorizedRoute.defaultProps = {
  location: null,
  authReq: true,
};

const routes = auth => [
  {
    tagName: CategorizedRoute,
    auth,
    authReq: false,
    authFailTarget: '/links/portal',
    exact: true,
    path: '/',
    component: Login,
    loadData: null,
  },
  {
    tagName: CategorizedRoute,
    auth,
    authReq: true,
    authFailTarget: '/',
    exact: true,
    path: '/links/:tag',
    component: PortalPage,
    loadData: (dispatch, match) => dispatch(initialLoad(match.params.tag)),
  },
  {
    tagName: CategorizedRoute,
    auth,
    authReq: true,
    authFailTarget: '/',
    exact: true,
    path: '/tags',
    component: TagPage,
    loadData: null,
  },
  {
    tagName: Route,
    exact: true,
    path: '/impressum',
    component: Impressum,
    loadData: null,
  },
];

export default {
  routesFromStore: store => routes(() => isAuth(store)),
  routesFromToken: token => routes(token),
};
