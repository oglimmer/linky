
import { initialLoad } from '../../src/redux/actions';


export default (dispatch, components, params, store) => {
  const authToken = store.getState().auth.token;
  if (authToken) {
    return Promise.all([
      dispatch(initialLoad(authToken)),
    ]);
  }
  return Promise.resolve();
};
