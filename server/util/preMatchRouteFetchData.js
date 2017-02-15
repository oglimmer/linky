
const { setAuthToken } = require('../../src/redux/actions');


module.exports = (store, req) => {
  if (req.cookies.authToken) {
    const { authToken } = req.cookies;
    return Promise.all([store.dispatch(setAuthToken(authToken))]);
  }
  return Promise.resolve();
};
