'use strict';

const jwt_secret = "foobar";
const _ = require('lodash');
const jwt = require('jsonwebtoken');

class JwtUtil {

	static verify(authToken) {		
		return new Promise((fulfill, reject) => {
			jwt.verify(authToken, jwt_secret, (err, decoded) => {
				if (_.isObject(err)) {
					reject(err);
				} else {
					fulfill(decoded);
				}
			});
		});
	}
   
   	static sign(claim) {
   		return jwt.sign(claim, jwt_secret, { expiresIn: '60h' });
   	}

}

module.exports = JwtUtil;
