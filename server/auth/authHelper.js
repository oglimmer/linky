
import winston from 'winston';
import randomstring from 'randomstring';

import userDao from '../dao/userDao';
import visitorDao from '../dao/visitorDao';
import JwtUtil from '../util/JwtUtil';

import properties from '../util/linkyproperties';

const addCookieAndForward = (req, res, token, type) => {
  winston.loggers.get('application').debug(`addCookieAndForward token ${token}`);
  if (!req.cookies.vistorToken) {
    const visitorId = randomstring.generate();
    winston.loggers.get('application').debug(`addCookieAndForward visitorId:${visitorId}`);
    visitorDao.insert({
      type: 'visitor',
      visitorId,
      authType: type,
    });
    res.cookie('vistorToken', visitorId, { maxAge: 31536000000, httpOnly: true, secure: properties.server.jwt.httpsOnly });
  }
  res.cookie('authToken', token, { httpOnly: true, secure: properties.server.jwt.httpsOnly });
  res.redirect('/');
};

const generateJwtToken = (res, localUserId) => {
  winston.loggers.get('application').debug(`generateJwtToken with user ${localUserId}`);
  const claim = { userid: localUserId };
  return JwtUtil.sign(claim);
};

const insertUserIntoDBIfNeeded = (type, remoteUserJson, localUserObj) => {
  if (localUserObj) {
    return localUserObj;
  }
  winston.loggers.get('application').debug('Insert new user into DB: %j', remoteUserJson);
  return userDao.insert({
    type: 'user',
    source: type,
    sourceId: remoteUserJson.id,
    sourceData: remoteUserJson,
  });
};

const loadUserFromDB = (type, id) => userDao.getBySourceId(type + id);

const getLocalUserObject = (type, remoteUserJson) =>
  loadUserFromDB(type, remoteUserJson.id)
  .then(localUserObj => insertUserIntoDBIfNeeded(type, remoteUserJson, localUserObj));

export default {
  getLocalUserObject,
  generateJwtToken,
  addCookieAndForward,
};
