
import 'isomorphic-fetch';

let baseUrl = '';
if (typeof window === 'undefined') {
  const port = process.env.PORT || '8080';
  baseUrl = `http://localhost:${port}`;
}

export default {

  get: function get(url, authToken) {
    return fetch(baseUrl + url, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });
  },

  postCredentials: function postCredentials(url) {
    return fetch(baseUrl + url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
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

