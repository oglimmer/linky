'use strict';

const _ = require('lodash');
const appLogger = require('winston').loggers.get('application');

class ResponseUtil {

    static sendErrorResponse(code, err, res) {
    	if(!Number.isInteger(code)) {
    		res = err;
    		err = code;
    		code = 500;
    	}
      let responseOutput;
      if(_.isObject(err)) {
        const { message, reason } = err;
        responseOutput = { message, reason };
      } else {
        responseOutput = { message: err, reason: err }
      }
      res.status(code).send(responseOutput);
      appLogger.debug("Response %d with %j", code, responseOutput);
    }

    static sendErrorResponseNotEmpty(code, name, res) {
    	if(!Number.isInteger(code)) {
    		res = err;
    		err = code;
    		code = 500;
    	}
    	const text = name + " must not be empty";
    	ResponseUtil.sendErrorResponse(code, text, res);
    }

}

module.exports = ResponseUtil;
