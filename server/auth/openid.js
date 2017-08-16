
import request from 'request-promise';
import assert from 'assert';
import winston from 'winston';
import randomstring from 'randomstring';

import properties from '../util/linkyproperties';
import authHelper from './authHelper';
import JwtUtil from '../util/JwtUtil';

const redirectTarget = properties.server.auth.redirectUri;

const init = (req, res) => {
  const { type } = req.params;
  assert(type, 'Failed to get type from path');
  const { hint } = req.query;
  const responseType = 'response_type=code';
  const scope = `scope=${encodeURIComponent(properties.server.auth[type].scope)}`;
  const clientId = `client_id=${encodeURIComponent(properties.server.auth[type].clientId)}`;
  const redirectUri = `redirect_uri=${encodeURIComponent(`${redirectTarget}/${type}`)}`;
  const loginHint = hint ? `login_hint=${encodeURIComponent(hint)}` : '';
  const randomToken = randomstring.generate();
  request.get({ url: properties.server.auth[type].openIdConfigUri, json: true })
    .then(openIdConfig => JwtUtil.sign({ randomToken }, '15m')
      .then((claim) => {
        const state = `state=${encodeURIComponent(claim)}`;
        const url = `${openIdConfig.authorization_endpoint}?${responseType}&${clientId}&${scope}&${redirectUri}&${state}&${loginHint}`;
        winston.loggers.get('application').debug(`redirect to ${url}`);
        res.cookie('stateClaim', claim, { httpOnly: true, secure: properties.server.jwt.httpsOnly });
        res.redirect(url);
      }),
    );
};

const getIdToken = (code, type) => {
  const form = {
    code,
    client_id: properties.server.auth[type].clientId,
    client_secret: properties.server.auth[type].clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: `${redirectTarget}/${type}`,
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
    }));
};

const decodeIdToken = (type, tokenResponse) =>
  JwtUtil.verifyOpenId(tokenResponse.id_token, properties.server.auth[type].openIdConfigUri)
    .then((claim) => {
      const copyOfClaim = claim;
      copyOfClaim.id = copyOfClaim.sub;
      return {
        user: copyOfClaim,
        tokenResponse,
      };
    });

const back = (req, res) => {
  if (req.query.error || !req.query.code) {
    winston.loggers.get('application').debug('error: %j', req.query);
    res.redirect('/');
  } else {
    const { type } = req.params;
    assert(type, 'Failed to get type from path');
    const { state, code } = req.query;
    assert(state, 'Failed to get state from path');
    authHelper.verifyState(req, res, state)
      .then(() => getIdToken(code, type))
      .then(tokenResponse => decodeIdToken(type, tokenResponse))
      .then(data => authHelper.forward(req, res, type, data.user, data.tokenResponse))
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
