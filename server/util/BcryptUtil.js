

import bcrypt from 'bcryptjs';

const saltRounds = 10;

class BcryptUtil {
  static hash(password) {
    return bcrypt.genSalt(saltRounds).then(salt => bcrypt.hash(password, salt));
  }

  static compare(password, hash) {
    return bcrypt.compare(password, hash);
  }
}

export default BcryptUtil;
