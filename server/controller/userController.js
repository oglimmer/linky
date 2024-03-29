
import winston from 'winston';

import userDao from '../dao/userDao';
import visitorDao from '../dao/visitorDao';
import BcryptUtil from '../util/BcryptUtil';
import JwtUtil from '../util/JwtUtil';
import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';
import { createUser } from '../logic/User';

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

  async process() {
    try {
      if (properties.build.login.userpass !== true) {
        throw new Error('Forbidden');
      }
      const user = await userDao.getByEmail(this.data.email);
      if (user !== null) {
        ResponseUtil.sendErrorResponse500('Email address already in use', this.res);
      } else {
        const hash = await BcryptUtil.hash(this.data.password);
        const dbObject = { email: this.data.email, hash };
        const id = await createUser(dbObject);
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

  async process() {
    try {
      const user = await userDao.getByEmail(this.data.email);
      if (user == null) {
        ResponseUtil.sendErrorResponse(401, 'Wrong user or password!', this.res);
        this.res.end();
      } else {
        const { _id, hash } = user;
        const result = await BcryptUtil.compare(this.data.password, hash);
        if (result) {
          const claim = {
            userid: _id,
          };
          const token = await JwtUtil.sign(claim);
          winston.loggers.get('application').debug('User id=%s authenticated', _id);
          this.res.cookie('authToken', token, { maxAge: 31536000000, httpOnly: true, secure: properties.server.jwt.httpsOnly });
          this.res.send({ token });
          this.res.end();
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

class GetUserProcessor extends BaseProcessor {
  constructor(req, res, next) {
    super(req, res, next, true);
  }

  async process() {
    try {
      const user = await userDao.getById(this.data.userid);
      if (!user) {
        ResponseUtil.sendErrorResponse500('Unknown id', this.res);
      } else {
        winston.loggers.get('application').debug('User info for id=%s', this.data.userid);
        const { _id, _rev, ...respUser } = user;
        this.res.send(respUser);
      }
    } catch (err) {
      winston.loggers.get('application').error(err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
  }
}

class LogoutProcessor extends BaseProcessor {
  constructor(req, res, next) {
    super(req, res, next, true);
  }

  async deleteVistior() {
    try {
      const { vistorToken } = this.req.cookies;
      const vistorRec = await visitorDao.getByVisitorId(vistorToken);
      /* eslint-disable no-underscore-dangle */
      visitorDao.delete(vistorRec._id, vistorRec._rev);
      /* eslint-enable no-underscore-dangle */
    } catch (err) {
      // no visitor token to delete
    }
  }

  async process() {
    this.deleteVistior();
    this.res.clearCookie('vistorToken');
    this.res.clearCookie('authToken');
    this.res.send('ok');
    this.res.end();
  }
}

class DeleteProcessor extends BaseProcessor {
  constructor(req, res, next) {
    super(req, res, next, true);
  }

  async process() {
    try {
      const user = await userDao.getById(this.data.userid);
      if (!user) {
        ResponseUtil.sendErrorResponse500('Unknown id', this.res);
      } else {
        winston.loggers.get('application').debug('Delete user id=%s', this.data.userid);
        /* eslint-disable no-underscore-dangle */
        userDao.deleteCascading(user._id, user._rev);
        /* eslint-enable no-underscore-dangle */
        this.res.send('ok');
      }
    } catch (err) {
      winston.loggers.get('application').error(err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
  }
}

export default {

  authenticate: (req, res, next) => {
    const ap = new AuthenticateProcessor(req, res, next);
    ap.doProcess();
  },

  createUser: (req, res, next) => {
    const cup = new CreateUserProcessor(req, res, next);
    cup.doProcess();
  },

  logout: (req, res, next) => {
    const cup = new LogoutProcessor(req, res, next);
    cup.doProcess();
  },

  getUser: (req, res, next) => {
    const cup = new GetUserProcessor(req, res, next);
    cup.doProcess();
  },

  deleteUser: (req, res, next) => {
    const cup = new DeleteProcessor(req, res, next);
    cup.doProcess();
  },

};
