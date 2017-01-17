
export default {

  get: function get(url, authToken) {
    return fetch(url, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });
  },

  post: function post(url, obj, authToken) {
    return fetch(url, {
      method: 'POST',
      body: JSON.stringify(obj),
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${authToken}`,
      },
    });
  },

  delete: function deleteObj(url, authToken) {
    return fetch(url, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });
  },

};

