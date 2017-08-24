

import bcrypt from 'bcryptjs';

const saltRounds = 10;

class BcryptUtil {
  static async hash(password) {
    const salt = await bcrypt.genSalt(saltRounds);
    return bcrypt.hash(password, salt);
  }

  static compare(password, hash) {
    return bcrypt.compare(password, hash);
  }
}

export default BcryptUtil;
