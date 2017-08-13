
import crypto from 'crypto';

export const hashSha256Hex = (string) => {
  const hash = crypto.createHash('sha256');
  hash.update(string);
  return hash.digest('hex');
};

export default {};
