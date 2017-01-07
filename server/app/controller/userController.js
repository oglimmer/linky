'use strict';

const appLogger = require('winston').loggers.get('application');
const userDao = require('../dao/userDao');
const BcryptUtil = require('../util/BcryptUtil');
const JwtUtil = require('../util/JwtUtil');
const ResponseUtil = require('../util/ResponseUtil');
const bluebird = require('bluebird');
const BaseProcessor = require('./BaseProcessor');

class CreateUserProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, false);
  }

  collectBodyParameters() {
    const { email, password } = this.req.body;
    this.data = { email, password };
  }

  propertiesToValidate() {
    return [ "email", "password" ];
  }

  *process() {
    try {
      const user = yield userDao.getByEmail(this.data.email);
      if(user !== null ) {
        ResponseUtil.sendErrorResponse("Email address already in use", this.res);
      } else {
        const hash = yield BcryptUtil.hash(this.data.password);
        const dbObject = { type: 'user', email: this.data.email, hash };
        const { id } = yield userDao.insert(dbObject);
        this.res.send( { id } );
        appLogger.debug("Create user id=%s to db: %j", id, dbObject);
      }
    } catch(err) {
      appLogger.error(err);
      ResponseUtil.sendErrorResponse(err, this.res);
    }
    this.next();
  }

}

class AuthenticateProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, false);
  }

  collectBodyParameters() {
    const { email, password } = this.req.body;
    this.data = { email, password };
  }

  propertiesToValidate() {
    return [ "email", "password" ];
  }

  errorCodeWhenInvalid() {
    return 401;
  }

  *process() {
    try {
      const user = yield userDao.getByEmail(this.data.email);
      if(user == null) {
        ResponseUtil.sendErrorResponse(401, "Wrong user or password!", this.res);
      } else {
        const { _id, hash } = user.value;
        const result = yield BcryptUtil.compare(this.data.password, hash);
        if(result) {
          const claim = {
            userid: _id
          };
          const token = JwtUtil.sign(claim);
          this.res.send( { token } );
          appLogger.debug("User id=%s authenticated", _id);
        } else {
          ResponseUtil.sendErrorResponse(401, "Wrong user or password!", this.res);
        }
      }
    } catch(err) {
      appLogger.error(err);
      ResponseUtil.sendErrorResponse(err, this.res);
    }
    this.next();
  }

}

module.exports = new class UserController {

    authenticate(req, res, next) {
      const ap = new AuthenticateProcessor(req, res, next);
      ap.doProcess();
    }

    createUser(req, res, next) {
      const cup = new CreateUserProcessor(req, res, next);
      cup.doProcess();
    }

}
