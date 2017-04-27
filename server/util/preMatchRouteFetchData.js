
import winston from 'winston';

import { setAuthToken } from '../../src/redux/actions';
import visitorDao from '../dao/visitorDao';
import jwt from './JwtUtil';

export default (store, req, res) => {
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
  if (req.cookies.vistorToken) {
    const { vistorToken } = req.cookies;
    winston.loggers.get('application').debug(`vistorToken = ${vistorToken}`);
    return visitorDao.getByVisitorId(vistorToken)
      .then((vistorRec) => {
        if (vistorRec) {
          const { authType, hint } = vistorRec.value;
          const hintParam = hint ? `hint=${hint}` : '';
          winston.loggers.get('application').debug(`Found authType = ${authType}`);
          res.redirect(`/auth/${authType}?${hintParam}`);
          throw new Error('forward');
        }
        return null;
      });
  }
  return Promise.resolve();
};
