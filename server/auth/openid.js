
import request from 'request-promise';
import assert from 'assert';
import winston from 'winston';
import randomstring from 'randomstring';

import properties from '../util/linkyproperties';
import authHelper from './authHelper';
import JwtUtil from '../util/JwtUtil';

const redirectTarget = properties.server.auth.redirectUri;

const init = (req, res) => {
  const type = req.params.type;
  const responseType = 'response_type=code';
  const scope = `scope=${encodeURIComponent(properties.server.auth[type].scope)}`;
  const clientId = `client_id=${encodeURIComponent(properties.server.auth[type].clientId)}`;
  const redirectUri = `redirect_uri=${encodeURIComponent(`${redirectTarget}/${type}`)}`;
  const randomToken = randomstring.generate();
  JwtUtil.sign({ randomToken }, '15m').then((claim) => {
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
  .then(jsonBody => jsonBody.id_token);
};

const decodeIdToken = (type, idToken) =>
  JwtUtil.verifyOpenId(idToken, properties.server.auth[type].cert)
    .then((claim) => {
      const copyOfClaim = claim;
      copyOfClaim.id = copyOfClaim.sub;
      return copyOfClaim;
    });

const back = (req, res) => {
  if (req.query.error || !req.query.code) {
    winston.loggers.get('application').debug('error: %j', req.query);
    res.redirect('/');
  } else {
    const { type } = req.params;
    assert(type, 'Failed to get type from path');
    getAuthToken(req.query.code, type)
      .then(idToken => decodeIdToken(type, idToken))
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

