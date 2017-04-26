
import jwt from 'jsonwebtoken';
import { Promise } from 'bluebird';

import properties from './linkyproperties';

const sign = Promise.promisify(jwt.sign);
const verify = Promise.promisify(jwt.verify);


class JwtUtil {

  static decode(claim) {
    return jwt.decode(claim);
  }

  static verify(authToken) {
    return verify(authToken, properties.server.jwt.secret);
  }

  static sign(claim, expiresInParam) {
    const expiresIn = !expiresInParam ? properties.server.jwt.expiresIn : expiresInParam;
    return sign(claim, properties.server.jwt.secret, {
      expiresIn,
    });
  }

}

export default JwtUtil;
