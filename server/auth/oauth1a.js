
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
  const redirectUri = `${(redirectTarget)}/${type}`;
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
    const oauthToken = query.oauth_token;
    const cipher = crypto.createCipher('aes192', properties.server.jwt.secret);
    const encrypted = (cipher.update(oauthToken, 'utf8', 'hex') + cipher.final('hex'));
    res.cookie('stateClaim', encrypted, { httpOnly: true, secure: properties.server.jwt.httpsOnly });
    res.redirect(`${properties.server.auth[type].authUri}?oauth_token=${oauthToken}`);
  });
};

const verifyToken = (req, res, oauthToken) => {
  const decipher = crypto.createDecipher('aes192', properties.server.jwt.secret);
  const encrypted = req.cookies.stateClaim;
  res.clearCookie('stateClaim');
  const decrypted = (decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8'));
  if (decrypted !== oauthToken) {
    throw Error('Failed to verify oauthToken');
  }
};

const back = (req, res) => {
  const { denied } = req.query;
  if (denied) {
    winston.loggers.get('application').debug('error: %j', req.query);
    res.redirect('/');
  } else {
    const oauthToken = req.query.oauth_token;
    const oauthVerifier = req.query.oauth_verifier;
    verifyToken(req, res, oauthToken);
    const type = req.params.type;
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
      .then(remoteUserJson => authHelper.forward(req, res, type, remoteUserJson))
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
