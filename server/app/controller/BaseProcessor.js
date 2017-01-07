'use strict';

const assert = require('assert');
const ResponseUtil = require('../util/ResponseUtil');
const bluebird = require('bluebird');
const _ = require('lodash');

/*abstract*/ class BaseProcessor {

  constructor(req, res, next, securePath) {
    this.req = req;
    this.res = res;
    this.next = next;
    this.securePath = securePath;
  }

  /*final*/ collectSecureParameter() {
    assert(this.req.user, "No user object. This should be prevented by `AuthorizationController.checkAuthorization`");
    const { userid } = this.req.user;
    this.data = _.merge(this.data, { userid });
  }

  /** maybe overwritten */
  collectBodyParameters() {
  	this.data = {};
  }

  /** maybe overwritten */
  propertiesToValidate() {
    return [];
  }

  /** maybe overwritten */
  errorCodeWhenInvalid() {
    return 500;
  }

	/*final*/ collectRouteParameter() {
  	this.data = _.merge(this.data, this.req.params);
  }

  /*final*/ isValid() {
    const propertiesToValidate = this.propertiesToValidate();
    for(let i = 0 ; i < propertiesToValidate.length ; i++) {
      const prop = propertiesToValidate[i];
      if(!this.data[prop]) {
        ResponseUtil.sendErrorResponseNotEmpty(this.errorCodeWhenInvalid(), prop, this.res);
        this.next();
        return false;
      }
    };
    return true;
  }

  /** must be overwritten */
  /* *process(); */

  /*public*/ doProcess() {
  	this.collectBodyParameters();
  	this.collectRouteParameter();
  	if(this.securePath) {
  		this.collectSecureParameter();
  	}
    if(this.isValid()) {
      bluebird.coroutine(this.process).bind(this)();
    }
  }

}

module.exports = BaseProcessor;
