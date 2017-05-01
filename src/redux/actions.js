
import fetch from '../util/fetch';

/*
 * action types
 */

export const ADD_LINK = 'ADD_LINK';
export const DEL_LINK = 'DEL_LINK';
export const SET_LINKS = 'SET_LINKS';
export const SET_AUTH_TOKEN = 'SET_AUTH_TOKEN';
export const CLEAR_AUTH_TOKEN = 'CLEAR_AUTH_TOKEN';
export const SET_ERROR_MESSAGE = 'SET_ERROR_MESSAGE';
export const CHANGE_SORTING_LINKS = 'CHANGE_SORTING_LINKS';

/*
 * action creators
 */

export function changeSortingLink(byColumn) {
  return { type: CHANGE_SORTING_LINKS, byColumn };
}

export function setLinks(linkList) {
  return { type: SET_LINKS, linkList };
}

export function clearAuthToken() {
  return { type: CLEAR_AUTH_TOKEN };
}

export function logout() {
  return dispatch => fetch.postCredentials('/rest/logout')
    .then(() => {
      dispatch(clearAuthToken());
      dispatch(setLinks([]));
      return Promise.resolve();
    });
}

export function setAuthToken(authToken) {
  return { type: SET_AUTH_TOKEN, authToken };
}

export function setErrorMessage(errorMessage) {
  return { type: SET_ERROR_MESSAGE, errorMessage };
}

export function addLinkPost(id, linkUrl) {
  return { type: ADD_LINK, id, linkUrl };
}

export function addLink(url, authToken) {
  return dispatch => fetch.post('/rest/links', { url }, authToken)
    .then(response => response.json())
    .then(newLink => dispatch(addLinkPost(newLink.id, newLink.linkUrl)))
    .catch((error) => {
      console.log(error);
    });
}

export function delLinkPost(id) {
  return { type: DEL_LINK, id };
}

export function delLink(id, authToken) {
  return dispatch => fetch.delete(`/rest/links/${id}`, authToken)
    .then(() => dispatch(delLinkPost(id)))
    .catch((error) => {
      console.log(error);
    });
}

export function initialLoad(authToken) {
  return dispatch => fetch.get('/rest/links', authToken)
    .then(response => response.json())
    .then((linkList) => {
      dispatch(setLinks(linkList));
    })
    .catch((error) => {
      console.log(error);
    });
}

export function checkAuth(email, password) {
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
