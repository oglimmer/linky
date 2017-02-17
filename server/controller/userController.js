
import userDao from '../dao/userDao';
import BcryptUtil from '../util/BcryptUtil';
import JwtUtil from '../util/JwtUtil';
import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';

class CreateUserProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, false);
  }

  /* eslint-disable class-methods-use-this */
  propertiesToValidate() {
    return ['email', 'password'];
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
        const dbObject = { type: 'user', email: this.data.email, hash };
        const { id } = yield userDao.insert(dbObject);
        this.res.send({ id });
        console.log('Create user id=%s to db: %j', id, dbObject);
      }
    } catch (err) {
      console.log(err);
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
    return ['email', 'password'];
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
      } else {
        const { _id, hash } = user.value;
        const result = yield BcryptUtil.compare(this.data.password, hash);
        if (result) {
          const claim = {
            userid: _id,
          };
          const token = JwtUtil.sign(claim);
          this.res.send({ token });
          console.log('User id=%s authenticated', _id);
        } else {
          ResponseUtil.sendErrorResponse(401, 'Wrong user or password!', this.res);
        }
      }
    } catch (err) {
      console.log(err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
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

};
