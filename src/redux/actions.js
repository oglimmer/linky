
const fetch = require('../util/fetch');

/*
 * action types
 */

const ADD_LINK = 'ADD_LINK';
const DEL_LINK = 'DEL_LINK';
const SET_LINKS = 'SET_LINKS';
const SET_AUTH_TOKEN = 'SET_AUTH_TOKEN';
const CLEAR_AUTH_TOKEN = 'CLEAR_AUTH_TOKEN';
const SET_ERROR_MESSAGE = 'SET_ERROR_MESSAGE';

module.exports.ADD_LINK = ADD_LINK;
module.exports.DEL_LINK = DEL_LINK;
module.exports.SET_LINKS = SET_LINKS;
module.exports.SET_AUTH_TOKEN = SET_AUTH_TOKEN;
module.exports.CLEAR_AUTH_TOKEN = CLEAR_AUTH_TOKEN;
module.exports.SET_ERROR_MESSAGE = SET_ERROR_MESSAGE;


/*
 * action creators
 */

function setLinks(linkList) {
  return { type: SET_LINKS, linkList };
}
module.exports.setLinks = setLinks;

function clearAuthToken() {
  return { type: CLEAR_AUTH_TOKEN };
}
module.exports.clearAuthToken = clearAuthToken;

function logout() {
  return (dispatch) => {
    dispatch(clearAuthToken());
    dispatch(setLinks([]));
    return Promise.resolve();
  };
}
module.exports.logout = logout;

function setAuthToken(authToken) {
  return { type: SET_AUTH_TOKEN, authToken };
}
module.exports.setAuthToken = setAuthToken;

function setErrorMessage(errorMessage) {
  return { type: SET_ERROR_MESSAGE, errorMessage };
}
module.exports.setErrorMessage = setErrorMessage;

function addLinkPost(id, linkUrl) {
  return { type: ADD_LINK, id, linkUrl };
}
module.exports.addLinkPost = addLinkPost;

function addLink(url, authToken) {
  let linkUrl = url;
  if (!linkUrl.startsWith('http')) {
    linkUrl = `http://${linkUrl}`;
  }
  return dispatch => fetch.post('/rest/links', { linkUrl }, authToken)
    .then(response => response.json())
    .then(newLink => dispatch(addLinkPost(newLink.id, linkUrl)))
    .catch((error) => {
      console.log(error);
    });
}
module.exports.addLink = addLink;

function delLinkPost(id) {
  return { type: DEL_LINK, id };
}
module.exports.delLinkPost = delLinkPost;

function delLink(id, authToken) {
  return dispatch => fetch.delete(`/rest/links/${id}`, authToken)
    .then(() => dispatch(delLinkPost(id)))
    .catch((error) => {
      console.log(error);
    });
}
module.exports.delLink = delLink;

function initialLoad(authToken) {
  return dispatch => fetch.get('/rest/links', authToken)
    .then(response => response.json())
    .then((linkList) => {
      dispatch(setLinks(linkList));
    })
    .catch((error) => {
      console.log(error);
    });
}
module.exports.initialLoad = initialLoad;

function checkAuth(email, password) {
  return (dispatch) => {
    dispatch(setErrorMessage(''));
    let responseCode;
    return fetch.post('/rest/authenticate', {
      email,
      password,
    })
    .then((response) => {
      responseCode = response.status;
      return response.json();
    })
    .then((json) => {
      if (responseCode === 200) {
        return Promise.all([
          dispatch(setAuthToken(json.token)),
          dispatch(initialLoad(json.token)),
        ]);
      }
      throw json.message;
    })
    .catch((ex) => {
      dispatch(setErrorMessage(ex));
      throw ex;
    });
  };
}
module.exports.checkAuth = checkAuth;
