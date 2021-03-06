
import 'isomorphic-fetch';

let baseUrl = '';
if (typeof window === 'undefined') {
  // see /server/util/serverConfig.js
  const port = process.env.INTERNAL_REST_API_PORT;
  const host = process.env.INTERNAL_REST_API_HOST;
  baseUrl = `http://${host}:${port}`;
}

export default {

  get: async (url, authToken) => {
    const response = await fetch(baseUrl + url, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });
    const json = await response.json();
    if (json.message) {
      throw new Error(json.message);
    }
    return json;
  },

  postCredentials: function postCredentials(url, body) {
    const param = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    };
    if (body) {
      param.body = JSON.stringify(body);
    }
    return fetch(baseUrl + url, param);
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

  put: function put(url, obj, authToken) {
    return fetch(baseUrl + url, {
      method: 'PUT',
      body: JSON.stringify(obj),
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${authToken}`,
      },
    });
  },

  patch: function patch(url, obj, authToken) {
    return fetch(baseUrl + url, {
      method: 'PATCH',
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

