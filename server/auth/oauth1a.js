
import request from 'request-promise';
import crypto from 'crypto';
import winston from 'winston';
import OAuth from 'oauth-1.0a';
import querystring from 'querystring';


import properties from '../util/linkyproperties';
import authHelper from './authHelper';

const redirectTarget = properties.server.auth.redirectUri;

const createOAuth = type => OAuth({
  consumer: {
    key: properties.server.auth[type].clientId,
    secret: properties.server.auth[type].clientSecret,
  },
  signature_method: 'HMAC-SHA1',
  hash_function: (baseString, key) => crypto.createHmac('sha1', key).update(baseString).digest('base64'),
});

const init = (req, res) => {
  const type = req.params.type;
  const oauth = createOAuth(type);
  const redirectUri = `${(redirectTarget)}?state=${type}`;
  const reqData = {
    url: properties.server.auth[type].requestUri,
    method: 'GET',
    data: {
      oauth_callback: redirectUri,
    },
  };
  const headers = oauth.toHeader(oauth.authorize(reqData));
  request.get({
    url: reqData.url,
    headers,
  }).then((bodyUrlEncoded) => {
    const query = querystring.parse(bodyUrlEncoded);
    res.redirect(`${properties.server.auth[type].authUri}?oauth_token=${query.oauth_token}`);
  });
};

const back = (req, res) => {
  const oauthToken = req.query.oauth_token;
  const oauthVerifier = req.query.oauth_verifier;
  const type = req.query.state;
  const oauth = createOAuth(type);
  const reqData = {
    url: properties.server.auth[type].tokenUri,
    method: 'POST',
    data: {
      oauth_token: oauthToken,
    },
  };
  const headers = oauth.toHeader(oauth.authorize(reqData));
  const form = { oauth_verifier: oauthVerifier };
  request.post({
    url: reqData.url,
    headers,
    form,
  })
  .then((bodyUrlEncoded) => {
    const query = querystring.parse(bodyUrlEncoded);
    // const oauthToken = query.oauth_token;
    // const oauthTokenSecret = query.oauth_token_secret;
    const userId = query.user_id;
    const screenName = query.screen_name;
    return {
      id: userId,
      screenName,
    };
  })
  .then(remoteUserJson => authHelper.getLocalUserObject(type, remoteUserJson))
  .then(localUserObj => authHelper.generateJwtToken(res, localUserObj.id))
  .then(token => authHelper.addCookieAndForward(res, token))
  .catch((error) => {
    winston.loggers.get('application').error('Failed to oauth2Back');
    winston.loggers.get('application').error(error);
    res.status(500).end();
  });
};

export default {
  back,
  init,
};
