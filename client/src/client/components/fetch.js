'use strict'

import fetch from 'whatwg-fetch-importable';

export default {

	get: function(url, authToken) {
		return fetch(url, {
			method: "GET",
			headers: {
				'authorization': 'Bearer ' + authToken
			}
		});
	},

	post: function(url, obj, authToken) {
		return fetch(url, {
			method: "POST",
			body: JSON.stringify(obj),
			headers: {
				'Content-Type': 'application/json',
				'authorization': 'Bearer ' + authToken
			}
		});
	},

	delete: function(url, authToken) {
		return fetch(url, {
			method: "DELETE",
			headers: {
				'authorization': 'Bearer ' + authToken
			}
		});
	}

};

