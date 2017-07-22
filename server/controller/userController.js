
import winston from 'winston';

import userDao from '../dao/userDao';
import visitorDao from '../dao/visitorDao';
import BcryptUtil from '../util/BcryptUtil';
import JwtUtil from '../util/JwtUtil';
import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';

import properties from '../util/linkyproperties';

class CreateUserProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, false);
  }

  /* eslint-disable class-methods-use-this */
  propertiesToValidate() {
    return [{ name: 'email' }, { name: 'password' }];
  }
  /* eslint-enable class-methods-use-this */

  collectBodyParameters() {
    const { email, password } = this.req.body;
    this.data = { email, password };
  }

  * process() {
    try {
      const user = yield userDao.getByEmail(this.data.email);
      if (user !== null) {
        ResponseUtil.sendErrorResponse500('Email address already in use', this.res);
      } else {
        const hash = yield BcryptUtil.hash(this.data.password);
        const dbObject = { type: 'user', email: this.data.email, hash, createdDate: new Date() };
        const { id } = yield userDao.insert(dbObject);
        this.res.send({ id });
        winston.loggers.get('application').debug('Create user id=%s to db: %j', id, dbObject);
      }
    } catch (err) {
      winston.loggers.get('application').error(err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
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

  /* eslint-disable class-methods-use-this */
  propertiesToValidate() {
    return [{ name: 'email' }, { name: 'password' }];
  }

  errorCodeWhenInvalid() {
    return 401;
  }
  /* eslint-enable class-methods-use-this */

  * process() {
    try {
      const user = yield userDao.getByEmail(this.data.email);
      if (user == null) {
        ResponseUtil.sendErrorResponse(401, 'Wrong user or password!', this.res);
        this.res.end();
      } else {
        const { _id, hash } = user;
        const result = yield BcryptUtil.compare(this.data.password, hash);
        if (result) {
          const claim = {
            userid: _id,
          };
          JwtUtil.sign(claim).then((token) => {
            winston.loggers.get('application').debug('User id=%s authenticated', _id);
            this.res.cookie('authToken', token, { httpOnly: true, secure: properties.server.jwt.httpsOnly });
            this.res.send({ token });
            this.res.end();
          });
        } else {
          ResponseUtil.sendErrorResponse(401, 'Wrong user or password!', this.res);
          this.res.end();
        }
      }
    } catch (err) {
      winston.loggers.get('application').error(err);
      ResponseUtil.sendErrorResponse500(err, this.res);
      this.res.end();
    }
  }

}

export default {

  authenticate: function authenticate(req, res, next) {
    const ap = new AuthenticateProcessor(req, res, next);
    ap.doProcess();
  },

  createUser: function createUser(req, res, next) {
    const cup = new CreateUserProcessor(req, res, next);
    cup.doProcess();
  },

  logout: function logout(req, res) {
    const { vistorToken } = req.cookies;
    visitorDao.getByVisitorId(vistorToken)
      .then((vistorRec) => {
        if (vistorRec) {
          /* eslint-disable no-underscore-dangle */
          visitorDao.delete(vistorRec._id, vistorRec._rev);
          /* eslint-enable no-underscore-dangle */
        }
      });
    res.clearCookie('vistorToken');
    res.clearCookie('authToken');
    res.send('ok');
    res.end();
  },

};
