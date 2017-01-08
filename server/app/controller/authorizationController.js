'use strict';

const appLogger = require('winston').loggers.get('application');
const assert = require('assert');
const JwtUtil = require('../util/JwtUtil');
const ResponseUtil = require('../util/ResponseUtil');
const bluebird = require('bluebird');

class Verification {

  constructor({ req, res, next }) {
    this.req = req;
    this.res = res;
    this.next = next;    
  }

  fail(err) {
    ResponseUtil.sendErrorResponse("Invalid auth token: " + err, this.res);
    this.next(new Error(err));
  }

  succeed(user) {
    assert(user.userid, "No user.userid found");
    this.req.user = user;
    this.next();
  }

  getAuthToken() {
    return new Promise((fulfill, reject) => {
      const { authorization } = this.req.headers;
      if(authorization) {
        const [ scheme, authToken ] = authorization.split(" ");
        if(scheme === 'Bearer' && authToken) {
          fulfill(authToken);
        } else {
          reject("authorization header invalid");
        }
      } else {
        reject("authorization header not found");
      }
    });
  }

  getUserForAuthToken(authToken) {
    return JwtUtil.verify(authToken);
  }

}

// replace this by npm restify-jwt
class AuthorizationController {

  checkAuthorization(req, res, next) {
    bluebird.coroutine(function*() {
      const v = new Verification({ req, res, next });
      try {        
        const authToken = yield v.getAuthToken();
        const user = yield v.getUserForAuthToken(authToken);
        v.succeed(user);
      } catch(err) {
        appLogger.error(err);
        v.fail(err);
      }
    })();
  }

}

module.exports = new AuthorizationController();
