
import winston from 'winston';

import { setAuthToken } from '../../src/redux/actions';

import jwt from './JwtUtil';

export default (store, req) => {
  if (req.cookies.authToken) {
    const { authToken } = req.cookies;
    winston.loggers.get('application').debug(`authToken = ${authToken}`);
    return jwt.verify(authToken)
      .then(() => { store.dispatch(setAuthToken(authToken)); })
      .catch((e) => {
        if (e.name !== 'TokenExpiredError') {
          winston.loggers.get('application').error(e);
        }
      });
  }
  return Promise.resolve();
};
