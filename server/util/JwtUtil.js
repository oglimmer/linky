
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

  static verifyOpenId(authToken, openIdConfigUrl) {
    return request.get({ url: openIdConfigUrl })
    .then(response => JSON.parse(response))
    .then(openIdConfig => request.get({ url: openIdConfig.jwks_uri }))
    .then(response => jose.JWK.asKeyStore(JSON.parse(response)))
    .then((keyStoreJson) => {
      const decodedToken = jwt.decode(authToken, { complete: true });
      return keyStoreJson.get(decodedToken.header.kid);
    })
    .then(key => jose.JWS.createVerify(key).verify(authToken))
    .then(claim => JSON.parse(claim.payload.toString()));
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
