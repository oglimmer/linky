
import winston from 'winston';
import { matchPath } from 'react-router-dom';

import { setAuthToken, initAsyncWaits } from '../../src/redux/actions';
import visitorDao from '../dao/visitorDao';
import jwt from './JwtUtil';
import routes from '../../src/routes/routes';
import authHelper from '../auth/authHelper';

const visitorToken = async (req, res) => {
  if (req.cookies.vistorToken) {
    const { vistorToken } = req.cookies;
    winston.loggers.get('application').debug(`FetchComponentData::vistorToken = ${vistorToken}`);
    const vistorRec = await visitorDao.getByVisitorId(vistorToken);
    if (vistorRec) {
      const { authType, hint, refreshToken } = vistorRec;
      // some providers ask for user permission again unless you use the refresh token
      if (refreshToken) {
        const promise = authHelper.processRefresh(req, res, refreshToken, authType);
        if (promise) {
          return promise;
        }
      }
      const hintParam = hint ? `hint=${hint}` : '';
      const targetUrl = `/auth/${authType}?${hintParam}`;
      winston.loggers.get('application').debug(`FetchComponentData::Forwarding to ${targetUrl}`);
      res.redirect(targetUrl);
      throw new Error('forward');
    }
    res.clearCookie('vistorToken');
    return null;
  }
  return Promise.resolve();
};

const initialLoadFromRoute = (authToken, dispatch, url) => {
  let dataLoadFnt = null;
  routes.routesFromToken(authToken).some((route) => {
    const match = matchPath(url, route);
    if (match && route.loadData && !dataLoadFnt) {
      dataLoadFnt = route.loadData(dispatch, match);
    }
    return match;
  });
  return dataLoadFnt;
};

const processAuthToken = async (authToken, dispatch, req, res) => {
  winston.loggers.get('application').debug(`FetchComponentData::AUTH_TOKEN=${authToken}`);
  try {
    await jwt.verify(authToken);
    await dispatch(setAuthToken(authToken));
    await initialLoadFromRoute(authToken, dispatch, req.url);
    return dispatch(initAsyncWaits());
  } catch (err) {
    if (err.name !== 'TokenExpiredError' && err.name !== 'JsonWebTokenError') {
      winston.loggers.get('application').error(err);
      res.status(500).send('Server error');
      return null;
    }
    res.clearCookie('authToken');
    return visitorToken(req, res);
  }
};

export default (dispatch, req, res) => {
  const { authToken } = req.cookies;
  if (authToken) {
    return processAuthToken(authToken, dispatch, req, res);
  }
  return visitorToken(req, res);
};
