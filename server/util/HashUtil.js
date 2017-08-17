
import crypto from 'crypto';

export const hashSha256Hex = (string) => {
  const hash = crypto.createHash('sha256');
  hash.update(string);
  return hash.digest('hex');
};

export const hashSha256Base64 = (string) => {
  const hash = crypto.createHash('sha256');
  hash.update(string);
  return hash.digest('base64');
};

export default {};
