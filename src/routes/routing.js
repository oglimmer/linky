
import Layout from '../pages/Layout';
import Login from '../pages/Login';
import PortalPage from '../pages/PortalPage';

export default (store) => {
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
