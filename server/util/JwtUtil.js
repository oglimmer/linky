
import jwt from 'jsonwebtoken';
import { Promise } from 'bluebird';

const jwtSecret = 'foobar';

const sign = Promise.promisify(jwt.sign);
const verify = Promise.promisify(jwt.verify);


class JwtUtil {

  static verify(authToken) {
    return verify(authToken, jwtSecret);
  }

  static sign(claim) {
    return sign(claim, jwtSecret, { expiresIn: '60h' });
  }

}

export default JwtUtil;
