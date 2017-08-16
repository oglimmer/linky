
import request from 'request-promise';
import winston from 'winston';
import randomstring from 'randomstring';
import crypto from 'crypto';

import userDao from '../dao/userDao';
import visitorDao from '../dao/visitorDao';
import JwtUtil from '../util/JwtUtil';

import properties from '../util/linkyproperties';

const addCookieAndForward = (req, res, token, type, remoteUserId, refreshToken) => {
  let returnPromise = Promise.resolve();
  winston.loggers.get('application').debug('authHelper::addCookieAndForward token %j', token);
  if (!req.cookies.vistorToken) {
    const visitorId = randomstring.generate();
    winston.loggers.get('application').debug('authHelper::addCookieAndForward visitorId:%j', visitorId);
    returnPromise = visitorDao.insert({
      type: 'visitor',
      visitorId,
      authType: type,
      hint: remoteUserId,
      createdDate: new Date(),
      refreshToken,
    });
    res.cookie('vistorToken', visitorId, { maxAge: 31536000000, httpOnly: true, secure: properties.server.jwt.httpsOnly });
  }
  res.cookie('authToken', token, { httpOnly: true, secure: properties.server.jwt.httpsOnly });
  res.redirect('/links/portal');
  return returnPromise;
};

const generateJwtToken = (res, localUserId) => {
  winston.loggers.get('application').debug('authHelper::generateJwtToken with user %j', localUserId);
  const claim = { userid: localUserId };
  return JwtUtil.sign(claim);
};

const insertUserIntoDBIfNeeded = (type, remoteUserJson, localUserObj) => {
  if (localUserObj) {
    /* eslint-disable no-underscore-dangle */
    return localUserObj._id;
    /* eslint-enable no-underscore-dangle */
  }
  winston.loggers.get('application').debug('authHelper::Insert new user into DB: %j', remoteUserJson);
  return userDao.insert({
    type: 'user',
    source: type,
    sourceId: remoteUserJson.id,
    sourceData: remoteUserJson,
    createdDate: new Date(),
  }).then(newObj => newObj.id);
};

const loadUserFromDB = (type, id) => userDao.getBySourceId(type + id);

const getLocalUserObject = (type, remoteUserJson) => loadUserFromDB(type, remoteUserJson.id)
  .then(localUserObj => insertUserIntoDBIfNeeded(type, remoteUserJson, localUserObj));

const forward = (req, res, type, remoteUserJson, authTokenResponse) =>
  getLocalUserObject(type, remoteUserJson)
    .then(localUserId => generateJwtToken(res, localUserId))
    .then(token =>
      addCookieAndForward(req, res, token, type, remoteUserJson.id,
        authTokenResponse ? authTokenResponse.refresh_token : null));

const verifyState = (req, res, state) => JwtUtil.verify(state).then((fromState) => {
  const fromCookie = JwtUtil.decode(req.cookies.stateClaim);
  res.clearCookie('stateClaim');
  if (fromState.randomToken !== fromCookie.randomToken) {
    throw Error(`Failed to validate state. ${JSON.stringify(fromState)} != ${JSON.stringify(fromCookie)}`);
  }
});

const addIdIfMissing = (remoteUserJson, type) => {
  const idKeyName = properties.server.auth[type].userIdKey;
  if (!idKeyName) {
    return remoteUserJson;
  }
  const fixedJson = remoteUserJson;
  fixedJson.id = fixedJson[idKeyName];
  return fixedJson;
};

const getRemoteUserJson = (type, authTokenResponse) => {
  let userUri = properties.server.auth[type].userUri;
  if (type === 'facebook') {
    const hmac = crypto.createHmac('sha256', properties.server.auth[type].clientSecret);
    const hash = hmac.update(authTokenResponse.access_token).digest('hex');
    userUri += `?appsecret_proof=${hash}`;
  }
  return request.get({
    url: userUri,
    json: true,
    headers: {
      authorization: `Bearer ${authTokenResponse.access_token}`,
      Accept: 'application/json',
      'User-Agent': 'linky1.com',
    },
  }).then(bodyUser => ({
    authTokenResponse,
    user: addIdIfMissing(bodyUser, type),
  }));
};

const processRefresh = (req, res, refreshToken, type) => {
  if (properties.server.auth[type].oauth === 1) {
    return undefined;
  } else if (properties.server.auth[type].oauth === 2) {
    if (!properties.server.auth[type].refreshUri) {
      return undefined;
    }
    // Tested only for Reddit
    const form = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    };
    const headers = {
      Accept: 'application/json',
      'User-Agent': 'linky1.com',
    };
    if (type === 'reddit') {
      headers.authorization = `Basic ${new Buffer(
        `${properties.server.auth[type].clientId}:${properties.server.auth[type].clientSecret}`,
        ).toString('base64')}`;
    }
    return request.post({ url: properties.server.auth[type].refreshUri,
      json: true,
      form,
      headers,
    })
    .then(authTokenResponse => getRemoteUserJson(type, authTokenResponse))
    .then(data => forward(req, res, type, data.user, data.authTokenResponse))
    .then(() => {
      throw new Error('forward');
    });
  } else if (properties.server.auth[type].oauth === 'openid') {
    // Tested only for Yahoo!
    const form = {
      refresh_token: refreshToken,
      client_id: properties.server.auth[type].clientId,
      client_secret: properties.server.auth[type].clientSecret,
      grant_type: 'refresh_token',
      redirect_uri: `${properties.server.auth.redirectUri}/${type}`,
    };
    return request.get({ url: properties.server.auth[type].openIdConfigUri })
      .then(response => JSON.parse(response))
      .then(openIdConfig => request.post({
        url: openIdConfig.token_endpoint,
        json: true,
        form,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'linky1.com',
        },
      }))
      .then(tokenResponse => ({
        tokenResponse,
        user: {
          id: tokenResponse.xoauth_yahoo_guid,
        },
      }))
      .then(data => forward(req, res, type, data.user, data.tokenResponse))
      .then(() => {
        throw new Error('forward');
      });
  }
  return undefined;
};

export default {
  forward,
  verifyState,
  getRemoteUserJson,
  processRefresh,
};
