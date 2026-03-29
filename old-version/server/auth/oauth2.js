
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
  const duration = type === 'reddit' ? 'duration=permanent' : '';
  const claim = await JwtUtil.sign({ randomToken }, '15m');
  const state = `state=${encodeURIComponent(claim)}`;
  const url = `${properties.server.auth[type].authUri}?${responseType}&${clientId}&${scope}&${redirectUri}&${state}&${loginHint}&${duration}`;
  winston.loggers.get('application').debug(`redirect to ${url}`);
  res.cookie('stateClaim', claim, { httpOnly: true, secure: properties.server.jwt.httpsOnly });
  res.redirect(url);
};

const getAuthToken = (code, type) => {
  const form = {
    code,
    client_id: properties.server.auth[type].clientId,
    client_secret: properties.server.auth[type].clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: `${redirectTarget}/${type}`,
  };
  const headers = {
    Accept: 'application/json',
    'User-Agent': 'linky1.com',
  };
  if (type === 'reddit') {
    headers.authorization = `Basic ${new Buffer(`${properties.server.auth[type].clientId}:${properties.server.auth[type].clientSecret}`).toString('base64')}`;
  }
  return request.post({ url: properties.server.auth[type].tokenUri,
    json: true,
    form,
    headers,
  });
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
      const authTokenResponse = await getAuthToken(code, type);
      const user = await authHelper.getRemoteUserJson(type, authTokenResponse);
      await authHelper.forward(req, res, type, user, authTokenResponse);
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
