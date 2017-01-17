
const _ = require('lodash');
const jwt = require('jsonwebtoken');

const jwtSecret = 'foobar';

class JwtUtil {

  static verify(authToken) {
    return new Promise((fulfill, reject) => {
      jwt.verify(authToken, jwtSecret, (err, decoded) => {
        if (_.isObject(err)) {
          reject(err);
        } else {
          fulfill(decoded);
        }
      });
    });
  }

  static sign(claim) {
    return jwt.sign(claim, jwtSecret, { expiresIn: '60h' });
  }

}

module.exports = JwtUtil;
