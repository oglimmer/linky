
import assert from 'assert';
import bluebird from 'bluebird';
import winston from 'winston';

import ResponseUtil from '../../src/util/ResponseUtil';


/* abstract*/ class BaseProcessor {

  constructor(req, res, next, securePath) {
    this.req = req;
    this.res = res;
    this.next = next;
    this.securePath = securePath;
  }

  /* final*/ collectSecureParameter() {
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
    return [];
  }

  /** maybe overwritten */
  errorCodeWhenInvalid() {
    return 500;
  }
  /* eslint-enable class-methods-use-this */

  /* final*/ collectRouteParameter() {
    Object.assign(this.data, this.req.params);
  }

  /* final*/ isValid() {
    const propertiesToValidate = this.propertiesToValidate();
    for (let i = 0; i < propertiesToValidate.length; i += 1) {
      const prop = propertiesToValidate[i];
      if (!this.data[prop] || (typeof this.data[prop] === 'string' && !this.data[prop].trim())) {
        ResponseUtil.sendErrorResponseNotEmpty(this.errorCodeWhenInvalid(), prop, this.res);
        this.res.end();
        return false;
      }
    }
    return true;
  }

  /** must be overwritten */
  /* *process(); */

  /* private*/ doProcessPart2() {
    this.collectRouteParameter();
    if (this.securePath) {
      this.collectSecureParameter();
    }
    if (this.isValid()) {
      bluebird.coroutine(this.process).bind(this)();
    }
    // this could be used as the return for the .then() and we want to avoid:
    // `Warning: a promise was created in a handler but was not returned from import`
    return null;
  }

  /* public*/ doProcess() {
    const promise = this.collectBodyParameters();
    if (promise) {
      promise.then(() => this.doProcessPart2()).catch(err => this.res.status(500).send(err));
    } else {
      this.doProcessPart2();
    }
  }

}

export default BaseProcessor;
