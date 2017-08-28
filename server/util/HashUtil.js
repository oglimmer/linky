
import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';
import hex from 'crypto-js/enc-hex';

export const hashSha256Hex = string => hex.stringify(sha256(string));

export const hashSha256Base64 = string => Base64.stringify(sha256(string));

export default {};
