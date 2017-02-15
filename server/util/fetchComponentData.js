
const { initialLoad } = require('../../src/redux/actions');


module.exports = (dispatch, components, params, store) => {
  const authToken = store.getState().auth.token;
  if (authToken) {
    return Promise.all([
      dispatch(initialLoad(authToken)),
    ]);
  }
  return Promise.resolve();
};
