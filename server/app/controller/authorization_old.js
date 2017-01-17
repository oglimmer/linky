
const JwtUtil = require('../util/JwtUtil');
const ResponseUtil = require('../util/ResponseUtil');

module.exports = {

  checkAuthorization: function checkAuthorization(req, res, next) {
    const { authorization } = req.headers;
    let failed = true;
    if (authorization) {
      const [scheme, authToken] = authorization.split(' ');
      if (scheme === 'Bearer' && authToken) {
        failed = false;
        JwtUtil.verify(authToken).then((user) => {
          /* eslint-disable no-param-reassign */
          req.user = user;
          /* eslint-enable no-param-reassign */
          next();
        }, (err) => {
          ResponseUtil.sendErrorResponse500(`Invalid auth token: ${err}`, res);
          next(false);
        });
      }
    }
    if (failed) {
      ResponseUtil.sendErrorResponse500('Invalid authorization header', res);
      next(false);
    }
  },

};
