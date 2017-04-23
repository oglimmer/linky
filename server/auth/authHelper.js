
import winston from 'winston';

import userDao from '../dao/userDao';
import JwtUtil from '../util/JwtUtil';


const addCookieAndForward = (res, token) => {
  winston.loggers.get('application').debug(`addCookieAndForward with token ${token}`);
  res.cookie('authToken', token, { maxAge: 900000, httpOnly: false });
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
