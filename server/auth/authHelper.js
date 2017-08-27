
import request from 'request-promise';
import winston from 'winston';
import randomstring from 'randomstring';
import crypto from 'crypto';

import userDao from '../dao/userDao';
import visitorDao from '../dao/visitorDao';
import JwtUtil from '../util/JwtUtil';
import { createUser } from '../logic/User';

import properties from '../util/linkyproperties';

const addCookieAndForward = async (req, res, token, type, remoteUserId, refreshToken) => {
  winston.loggers.get('application').debug('authHelper::addCookieAndForward token %j', token);
  if (!req.cookies.vistorToken) {
    const visitorId = randomstring.generate();
    winston.loggers.get('application').debug('authHelper::addCookieAndForward visitorId:%j', visitorId);
    await visitorDao.insert({
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
  return createUser({
    source: type,
    sourceId: remoteUserJson.id,
    sourceData: remoteUserJson,
  });
};

const loadUserFromDB = (type, id) => userDao.getBySourceId(type + id);

const getLocalUserObject = async (type, remoteUserJson) => {
  const localUserObj = await loadUserFromDB(type, remoteUserJson.id);
  return insertUserIntoDBIfNeeded(type, remoteUserJson, localUserObj);
};

const forward = async (req, res, type, remoteUserJson, authTokenResponse) => {
  const localUserId = await getLocalUserObject(type, remoteUserJson);
  const token = await generateJwtToken(res, localUserId);
  await addCookieAndForward(req, res, token, type,
    remoteUserJson.id, authTokenResponse ? authTokenResponse.refresh_token : null);
};

const verifyState = async (req, res, state) => {
  const fromState = await JwtUtil.verify(state);
  const fromCookie = JwtUtil.decode(req.cookies.stateClaim);
  res.clearCookie('stateClaim');
  if (fromState.randomToken !== fromCookie.randomToken) {
    throw Error(`Failed to validate state. ${JSON.stringify(fromState)} != ${JSON.stringify(fromCookie)}`);
  }
};

const addIdIfMissing = (remoteUserJson, type) => {
  const idKeyName = properties.server.auth[type].userIdKey;
  if (!idKeyName) {
    return remoteUserJson;
  }
  const fixedJson = remoteUserJson;
  fixedJson.id = fixedJson[idKeyName];
  return fixedJson;
};

const getRemoteUserJson = async (type, authTokenResponse) => {
  let userUri = properties.server.auth[type].userUri;
  if (type === 'facebook') {
    const hmac = crypto.createHmac('sha256', properties.server.auth[type].clientSecret);
    const hash = hmac.update(authTokenResponse.access_token).digest('hex');
    userUri += `?appsecret_proof=${hash}`;
  }
  const bodyUser = await request.get({
    url: userUri,
    json: true,
    headers: {
      authorization: `Bearer ${authTokenResponse.access_token}`,
      Accept: 'application/json',
      'User-Agent': 'linky1.com',
    },
  });
  return ({
    authTokenResponse,
    user: addIdIfMissing(bodyUser, type),
  });
};

const processRefresh = async (req, res, refreshToken, type) => {
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
    const authTokenResponse = await request.post({ url: properties.server.auth[type].refreshUri,
      json: true,
      form,
      headers,
    });
    const data = await getRemoteUserJson(type, authTokenResponse);
    await forward(req, res, type, data.user, data.authTokenResponse);
    throw new Error('forward');
  } else if (properties.server.auth[type].oauth === 'openid') {
    // Tested only for Yahoo!
    const form = {
      refresh_token: refreshToken,
      client_id: properties.server.auth[type].clientId,
      client_secret: properties.server.auth[type].clientSecret,
      grant_type: 'refresh_token',
      redirect_uri: `${properties.server.auth.redirectUri}/${type}`,
    };
    const response = await request.get({ url: properties.server.auth[type].openIdConfigUri });
    const openIdConfig = JSON.parse(response);
    const tokenResponse = await request.post({
      url: openIdConfig.token_endpoint,
      json: true,
      form,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'linky1.com',
      },
    });
    const data = {
      tokenResponse,
      user: {
        id: tokenResponse.xoauth_yahoo_guid,
      },
    };
    await forward(req, res, type, data.user, data.tokenResponse);
    throw new Error('forward');
  }
  return undefined;
};

export default {
  forward,
  verifyState,
  getRemoteUserJson,
  processRefresh,
};
