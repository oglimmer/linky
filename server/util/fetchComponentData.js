
import winston from 'winston';
import { matchPath } from 'react-router-dom';

import { setAuthToken } from '../../src/redux/actions';
import visitorDao from '../dao/visitorDao';
import jwt from './JwtUtil';
import routes from '../../src/routes/routes';

export default (dispatch, req, res) => {
  if (req.cookies.authToken) {
    const { authToken } = req.cookies;
    winston.loggers.get('application').debug(`authToken = ${authToken}`);
    let dataLoadFnt = null;
    // some only matches once
    routes.routesFromToken(authToken).some((route) => {
      const match = matchPath(req.url, route);
      if (match && route.loadData) {
        dataLoadFnt = route.loadData.bind(null, dispatch, match);
      }
      return match;
    });
    return jwt.verify(authToken)
      .then(() => dispatch(setAuthToken(authToken)))
      .then(() => (dataLoadFnt ? dataLoadFnt() : Promise.resolve()))
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
