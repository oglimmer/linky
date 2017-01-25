
import React from 'react';
import { Router, browserHistory } from 'react-router';

import Layout from './Layout';
import Login from '../pages/Login';
import PortalPage from '../pages/PortalPage';

const checkSecured = (replace) => {
  if (!localStorage.authToken) {
    replace('/');
  }
};
const redirectIfLoggedIn = (replace) => {
  if (localStorage.authToken) {
    replace('/portalPage');
  }
};


const routesConfig = {
  path: '/',
  component: Layout,
  indexRoute: {
    component: Login,
    onEnter: ((newState, replace) => redirectIfLoggedIn(replace)),
  },
  childRoutes: [
    {
      path: 'portalPage',
      component: PortalPage,
      onEnter: ((newState, replace) => checkSecured(replace)),
    },
  ],
};

const RootElement = () => (
  <Router history={browserHistory} routes={routesConfig} />
);

export default RootElement;
