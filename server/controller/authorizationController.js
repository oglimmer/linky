
import assert from 'assert';

import winston from 'winston';

import JwtUtil from '../util/JwtUtil';
import ResponseUtil from '../../src/util/ResponseUtil';

class VerificationError extends Error {
  constructor(msg) {
    super(msg);
    this.customError = true;
  }
}

class Verification {
  constructor({ req, res, next }) {
    this.req = req;
    this.res = res;
    this.next = next;
  }

  fail(err) {
    ResponseUtil.sendErrorResponse500(`Invalid auth token: ${err}`, this.res);
    this.next(new VerificationError(err));
  }

  succeed(user) {
    winston.loggers.get('application').debug('authorization found for %j', user);
    assert(user.userid, 'No user.userid found');
    this.req.user = user;
    this.next();
  }

  getAuthToken() {
    return new Promise((fulfill, reject) => {
      const { authorization } = this.req.headers;
      if (authorization) {
        const [scheme, authToken] = authorization.split(' ');
        if (scheme === 'Bearer' && authToken) {
          fulfill(authToken);
        } else {
          reject('authorization header invalid');
        }
      } else {
        const { authToken } = this.req.cookies;
        if (authToken) {
          fulfill(authToken);
        } else {
          reject('authorization header or cookie not found');
        }
      }
    });
  }

  /* eslint-disable class-methods-use-this */
  getUserForAuthToken(authToken) {
    return JwtUtil.verify(authToken);
  }
  /* eslint-enable class-methods-use-this */
}

// replace this by npm restify-jwt
export default {

  checkAuthorization: async (req, res, next) => {
    const v = new Verification({ req, res, next });
    try {
      const authToken = await v.getAuthToken();
      const user = await v.getUserForAuthToken(authToken);
      v.succeed(user);
    } catch (err) {
      // winston.loggers.get('application').error('Failed to checkAuthorization: ', err);
      v.fail(err);
    }
  },
};
