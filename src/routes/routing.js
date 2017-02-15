
const Layout = require('../pages/Layout');
const Login = require('../pages/Login');
const PortalPage = require('../pages/PortalPage');

module.exports = (store) => {
  const checkSecured = (newState, replace) => {
    const { auth } = store.getState();
    if (!auth.token) {
      replace('/');
    }
  };
  const redirectIfLoggedIn = (newState, replace) => {
    const { auth } = store.getState();
    if (auth.token) {
      replace('/portalPage');
    }
  };

  return {
    path: '/',
    component: Layout,
    indexRoute: {
      component: Login,
      onEnter: redirectIfLoggedIn,
    },
    childRoutes: [
      {
        path: 'portalPage',
        component: PortalPage,
        onEnter: checkSecured,
      },
    ],
  };
};
