
import request from 'request-promise';
import crypto from 'crypto';
import assert from 'assert';
import winston from 'winston';
import randomstring from 'randomstring';

import properties from '../util/linkyproperties';
import authHelper from './authHelper';
import jwt from '../util/JwtUtil';

const redirectTarget = properties.server.auth.redirectUri;

const init = (req, res) => {
  const type = req.params.type;
  const responseType = 'response_type=code';
  const scope = `scope=${encodeURIComponent(properties.server.auth[type].scope)}`;
  const clientId = `client_id=${encodeURIComponent(properties.server.auth[type].clientId)}`;
  const redirectUri = `redirect_uri=${encodeURIComponent(`${redirectTarget}/${type}`)}`;
  const randomToken = randomstring.generate();
  jwt.sign({ randomToken }, '15m').then((claim) => {
    const state = `state=${encodeURIComponent(claim)}`;
    const url = `${properties.server.auth[type].authUri}?${responseType}&${clientId}&${scope}&${redirectUri}&${state}`;
    winston.loggers.get('application').debug(`redirect to ${url}`);
    res.cookie('stateClaim', claim, { httpOnly: true, secure: properties.server.jwt.httpsOnly });
    res.redirect(url);
  });
};

const getAuthToken = (code, type) => {
  const form = {
    code,
    client_id: properties.server.auth[type].clientId,
    client_secret: properties.server.auth[type].clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: `${redirectTarget}/${type}`,
  };
  return request.post({ url: properties.server.auth[type].tokenUri,
    form,
    headers: {
      Accept: 'application/json',
      'User-Agent': 'linky.oglimmer.de',
    },
  })
  .then(body => JSON.parse(body))
  .then(jsonBody => jsonBody.access_token);
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

const getRemoteUserJson = (type, accessToken) => {
  let userUri = properties.server.auth[type].userUri;
  if (type === 'facebook') {
    const hmac = crypto.createHmac('sha256', properties.server.auth[type].clientSecret);
    const hash = hmac.update(accessToken).digest('hex');
    userUri += `?appsecret_proof=${hash}`;
  }
  return request.get({
    url: userUri,
    headers: {
      authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'User-Agent': 'linky.oglimmer.de',
    },
  }).then((bodyUser) => {
    const remoteUserJson = JSON.parse(bodyUser);
    return addIdIfMissing(remoteUserJson, type);
  });
};

const verifyState = (req, res, fromState) => {
  const fromCookie = jwt.decode(req.cookies.stateClaim);
  res.clearCookie('stateClaim');
  if (fromState.randomToken !== fromCookie.randomToken) {
    throw Error(`Failed to validate state. ${fromState} != ${fromCookie}`);
  }
};

const back = (req, res) => {
  if (req.query.error || !req.query.code) {
    winston.loggers.get('application').debug('error: %j', req.query);
    res.redirect('/');
  } else {
    const { type } = req.params;
    assert(type, 'Failed to get type from path');
    const { state } = req.query;
    assert(state, 'Failed to get state from path');
    jwt.verify(state)
      .then(fromState => verifyState(req, res, fromState))
      .then(() => getAuthToken(req.query.code, type))
      .then(accessToken => getRemoteUserJson(type, accessToken))
      .then(remoteUserJson => authHelper.getLocalUserObject(type, remoteUserJson))
      .then(localUserObj => authHelper.generateJwtToken(res, localUserObj.id))
      .then(token => authHelper.addCookieAndForward(req, res, token, type))
      .catch((error) => {
        winston.loggers.get('application').error('Failed to oauth2Back');
        winston.loggers.get('application').error(error);
        res.status(500).end();
      });
  }
};

export default {
  back,
  init,
};
