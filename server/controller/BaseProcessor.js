
import assert from 'assert';
import bluebird from 'bluebird';
import _ from 'lodash';
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
    this.data = _.merge(this.data, { userid });
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
    this.data = _.merge(this.data, this.req.params);
  }

  /* final*/ isValid() {
    const propertiesToValidate = this.propertiesToValidate();
    for (let i = 0; i < propertiesToValidate.length; i += 1) {
      const prop = propertiesToValidate[i];
      if (!this.data[prop]) {
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
  }

  /* public*/ doProcess() {
    const promise = this.collectBodyParameters();
    if (promise) {
      promise.then(() => this.doProcessPart2())
      .catch((err) => {
        winston.loggers.get('application').debug(err);
      });
    } else {
      this.doProcessPart2();
    }
  }

}

export default BaseProcessor;
