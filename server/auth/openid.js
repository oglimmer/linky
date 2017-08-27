
import request from 'request-promise';
import assert from 'assert';
import winston from 'winston';
import randomstring from 'randomstring';

import properties from '../util/linkyproperties';
import authHelper from './authHelper';
import JwtUtil from '../util/JwtUtil';

const redirectTarget = properties.server.auth.redirectUri;

const init = async (req, res) => {
  const { type } = req.params;
  assert(type, 'Failed to get type from path');
  const { hint } = req.query;
  const responseType = 'response_type=code';
  const scope = `scope=${encodeURIComponent(properties.server.auth[type].scope)}`;
  const clientId = `client_id=${encodeURIComponent(properties.server.auth[type].clientId)}`;
  const redirectUri = `redirect_uri=${encodeURIComponent(`${redirectTarget}/${type}`)}`;
  const loginHint = hint ? `login_hint=${encodeURIComponent(hint)}` : '';
  const randomToken = randomstring.generate();
  const openIdConfig = await request.get({
    url: properties.server.auth[type].openIdConfigUri,
    json: true,
  });
  const claim = await JwtUtil.sign({ randomToken }, '15m');
  const state = `state=${encodeURIComponent(claim)}`;
  const url = `${openIdConfig.authorization_endpoint}?${responseType}&${clientId}&${scope}&${redirectUri}&${state}&${loginHint}`;
  winston.loggers.get('application').debug(`redirect to ${url}`);
  res.cookie('stateClaim', claim, { httpOnly: true, secure: properties.server.jwt.httpsOnly });
  res.redirect(url);
};

const getIdToken = async (code, type) => {
  const form = {
    code,
    client_id: properties.server.auth[type].clientId,
    client_secret: properties.server.auth[type].clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: `${redirectTarget}/${type}`,
  };
  const openIdConfig = await request.get({
    url: properties.server.auth[type].openIdConfigUri,
    json: true,
  });
  return request.post({
    url: openIdConfig.token_endpoint,
    json: true,
    form,
    headers: {
      Accept: 'application/json',
      'User-Agent': 'linky1.com',
    },
  });
};

const decodeIdToken = async (type, tokenResponse) => {
  const claim = await JwtUtil.verifyOpenId(
    tokenResponse.id_token, properties.server.auth[type].openIdConfigUri);
  const copyOfClaim = claim;
  copyOfClaim.id = copyOfClaim.sub;
  return {
    user: copyOfClaim,
    tokenResponse,
  };
};

const back = async (req, res) => {
  if (req.query.error || !req.query.code) {
    winston.loggers.get('application').debug('error: %j', req.query);
    res.redirect('/');
  } else {
    const { type } = req.params;
    assert(type, 'Failed to get type from path');
    const { state, code } = req.query;
    assert(state, 'Failed to get state from path');
    try {
      await authHelper.verifyState(req, res, state);
      const tokenResponse = await getIdToken(code, type);
      const data = await decodeIdToken(type, tokenResponse);
      await authHelper.forward(req, res, type, data.user, data.tokenResponse);
    } catch (err) {
      winston.loggers.get('application').error('Failed to oauth2Back');
      winston.loggers.get('application').error(err);
      res.status(500).end();
    }
  }
};

export default {
  back,
  init,
};
