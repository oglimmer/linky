'use strict';

const JwtUtil = require('../util/JwtUtil');
const ResponseUtil = require('../util/ResponseUtil');

module.exports = {

  checkAuthorization: function(req, res, next) {
    const { authorization } = req.headers;
    let failed = true;
    if(authorization) {
      const [ scheme, authToken ] = authorization.split(" ");
      if(scheme === 'Bearer' && authToken) {
        failed = false;
        JwtUtil.verify(authToken).then(function sucess(user) {
          req.user = user;
          next();
        }, function failure(err) {
          ResponseUtil.sendErrorResponse("Invalid auth token: " + err, res);
          next(false);
        });
      }
    }
    if(failed) {
      ResponseUtil.sendErrorResponse("Invalid authorization header", res);
      next(false);
    }
  }

};
