
import jwt from 'jsonwebtoken';
import { Promise } from 'bluebird';

import properties from './linkyproperties';

const sign = Promise.promisify(jwt.sign);
const verify = Promise.promisify(jwt.verify);


class JwtUtil {

  static verify(authToken) {
    return verify(authToken, properties.server.jwt.secret);
  }

  static sign(claim) {
    return sign(claim, properties.server.jwt.secret, {
      expiresIn: properties.server.jwt.expiresIn,
    });
  }

}

export default JwtUtil;
