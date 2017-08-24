import assert from 'assert';
import winston from 'winston';

import ResponseUtil from '../../src/util/ResponseUtil';


/* abstract */
class BaseProcessor {
  constructor(req, res, next, securePath) {
    this.req = req;
    this.res = res;
    this.next = next;
    this.securePath = securePath;
  }

  /* final */ collectSecureParameter() {
    assert(this.req.user, 'No user object. This should be prevented by `AuthorizationController.checkAuthorization`');
    const { userid } = this.req.user;
    if (this.data.userid && this.data.userid !== userid) {
      winston.loggers.get('application').debug(`DB entry has user=${this.data.userid} but change was initiated by=${userid}`);
      throw Error('Wrong user');
    }
    Object.assign(this.data, { userid });
  }

  /** maybe overwritten */
  collectBodyParameters() {
    this.data = {};
  }

  /* eslint-disable class-methods-use-this */
  /** maybe overwritten */
  propertiesToValidate() {
    return {};
  }

  /** maybe overwritten */
  errorCodeWhenInvalid() {
    return 500;
  }
  /* eslint-enable class-methods-use-this */

  /* final */ collectRouteParameter() {
    Object.assign(this.data, this.req.params);
  }

  /* final */ isValid() {
    const propertiesToValidate = this.propertiesToValidate();
    const keysToValidate = Object.keys(propertiesToValidate);
    for (let i = 0; i < keysToValidate.length; i += 1) {
      const prop = propertiesToValidate[keysToValidate[i]];
      if (!this.data[prop.name] || (typeof this.data[prop.name] === 'string' && !this.data[prop.name].trim())) {
        if (!prop.default) {
          ResponseUtil.sendErrorResponseNotEmpty(this.errorCodeWhenInvalid(), prop.name, this.res);
          this.res.end();
          return false;
        }
        this.data[prop.name] = prop.default;
      }
    }
    return true;
  }

  /** must be overwritten */
  /* process(); */

  /* private */ async doProcessPart2() {
    this.collectRouteParameter();
    if (this.securePath) {
      this.collectSecureParameter();
    }
    if (this.isValid()) {
      await this.process();
    }
    // this could be used as the return for the .then() and we want to avoid:
    // `Warning: a promise was created in a handler but was not returned from import`
    return null;
  }

  /* public */ doProcess() {
    const promise = this.collectBodyParameters();
    if (promise) {
      promise.then(() => this.doProcessPart2()).catch(err => this.res.status(500).send(err));
    } else {
      this.doProcessPart2();
    }
  }
}

export default BaseProcessor;
