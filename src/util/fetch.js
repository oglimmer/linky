
require('isomorphic-fetch');

let baseUrl = '';
if (typeof window === 'undefined') {
  baseUrl = 'http://localhost:8080';
}

module.exports = {

  get: function get(url, authToken) {
    return fetch(baseUrl + url, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });
  },

  post: function post(url, obj, authToken) {
    return fetch(baseUrl + url, {
      method: 'POST',
      body: JSON.stringify(obj),
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${authToken}`,
      },
    });
  },

  delete: function deleteObj(url, authToken) {
    return fetch(baseUrl + url, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });
  },

};

