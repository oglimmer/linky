
import { setAuthToken } from '../../src/redux/actions';


export default (store, req) => {
  if (req.cookies.authToken) {
    const { authToken } = req.cookies;
    return Promise.all([store.dispatch(setAuthToken(authToken))]);
  }
  return Promise.resolve();
};
