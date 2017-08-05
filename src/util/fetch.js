
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
    })
      .then(response => response.json())
      .then((json) => {
        if (json.message) {
          throw new Error(json.message);
        }
        return json;
      });
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

