
import { setAuthToken } from '../../src/redux/actions';

import jwt from './JwtUtil';

export default (store, req) => {
  if (req.cookies.authToken) {
    const { authToken } = req.cookies;
    console.log(`authToken = ${authToken}`);
    return jwt.verify(authToken)
      .then(() => { store.dispatch(setAuthToken(authToken)); })
      .catch((e) => {
        if (e.name !== 'TokenExpiredError') {
          console.log(e);
        }
      });
  }
  return Promise.resolve();
};
