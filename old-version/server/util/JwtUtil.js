
import jwt from 'jsonwebtoken';
import { Promise } from 'bluebird';
import jose from 'node-jose';
import request from 'request-promise';

import properties from './linkyproperties';

const sign = Promise.promisify(jwt.sign);
const verify = Promise.promisify(jwt.verify);

class JwtUtil {
  static decode(claim) {
    return jwt.decode(claim);
  }

  static async verifyOpenId(authToken, openIdConfigUrl) {
    const openIdConfig = await request.get({ url: openIdConfigUrl, json: true });
    const response = await request.get({ url: openIdConfig.jwks_uri, json: true });
    const keyStore = await jose.JWK.asKeyStore(response);
    const decodedToken = await jwt.decode(authToken, { complete: true });
    const key = keyStore.get(decodedToken.header.kid);
    const claim = await jose.JWS.createVerify(key).verify(authToken);
    return JSON.parse(claim.payload.toString());
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
