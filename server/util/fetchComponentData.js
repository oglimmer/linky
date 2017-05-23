
import winston from 'winston';

import { setAuthToken, initialLoad } from '../../src/redux/actions';
import visitorDao from '../dao/visitorDao';
import jwt from './JwtUtil';

export default (dispatch, req, res) => {
  if (req.cookies.authToken) {
    const { authToken } = req.cookies;
    winston.loggers.get('application').debug(`authToken = ${authToken}`);
    return jwt.verify(authToken)
      .then(() => dispatch(setAuthToken(authToken)))
      .then(() => dispatch(initialLoad(authToken)))
      .catch((e) => {
        if (e.name !== 'TokenExpiredError' && e.name !== 'JsonWebTokenError') {
          winston.loggers.get('application').error(e);
          res.status(500).send('Server error');
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
      });
  }
  return Promise.resolve();
};
