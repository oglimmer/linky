
import React from 'react';
import PropTypes from 'prop-types';

import { Route, Redirect } from 'react-router-dom';

import Layout from '../pages/Layout';
import Login from '../pages/Login';
import PortalPage from '../pages/PortalPage';
import TagPage from '../pages/TagPage';
import Contact from '../pages/Contact';
import ImportExport from '../pages/ImportExport';
import Help from '../pages/Help';

import { initialLoadLinks } from '../../src/redux/actions/links';
import { initialLoadTags } from '../../src/redux/actions/tagHierarchy';

const isAuth = (store) => {
  const { auth } = store.getState();
  return typeof auth.token !== 'undefined' && auth.token !== null && auth.token.trim().length > 0;
};

const CategorizedRoute = ({ component: Component, authReq, auth, authFailTarget, ...rest }) => (
  <Route
    {...rest}
    render={props => (
      (typeof auth === 'function' ? auth() : auth) === authReq ? (
        <Layout><Component {...props} /></Layout>
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

const AddLayout = Component => () => (
  <Layout><Component /></Layout>
);

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
    loadData: (dispatch, match) => dispatch(initialLoadLinks(match.params.tag)),
  },
  {
    tagName: CategorizedRoute,
    auth,
    authReq: true,
    authFailTarget: '/',
    exact: true,
    path: '/tags',
    component: TagPage,
    loadData: dispatch => dispatch(initialLoadTags()),
  },
  {
    tagName: Route,
    exact: true,
    path: '/contact',
    component: AddLayout(Contact),
    loadData: null,
  },
  {
    tagName: Route,
    exact: true,
    path: '/help',
    component: AddLayout(Help),
    loadData: null,
  },
  {
    tagName: CategorizedRoute,
    auth,
    authReq: true,
    authFailTarget: '/',
    exact: true,
    path: '/importExport',
    component: ImportExport,
    loadData: null,
  },
];

export default {
  routesFromStore: store => routes(() => isAuth(store)),
  routesFromToken: token => routes(token),
};
