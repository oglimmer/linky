
import fetch from '../utils/fetch';

/*
 * action types
 */

export const ADD_LINK = 'ADD_LINK';
export const DEL_LINK = 'DEL_LINK';
export const SET_LINKS = 'SET_LINKS';
export const SET_AUTH_TOKEN = 'SET_AUTH_TOKEN';
export const CLEAR_AUTH_TOKEN = 'CLEAR_AUTH_TOKEN';
export const SET_ERROR_MESSAGE = 'SET_ERROR_MESSAGE';
export const NO_OP = 'NO_OP';

/*
 * action creators
 */

export function clearAuthToken(router) {
  return (dispatch) => {
    dispatch({ type: CLEAR_AUTH_TOKEN });
    router.replace('/');
  };
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

export function addLink(url) {
  let linkUrl = url;
  if (!linkUrl.startsWith('http')) {
    linkUrl = `http://${linkUrl}`;
  }
  return dispatch => fetch.post('/rest/links', { linkUrl }, localStorage.authToken)
    .then(response => response.json())
    .then(newLink => dispatch(addLinkPost(newLink.id, linkUrl)))
    .catch((error) => {
      console.log(error);
    }
  );
}

export function delLinkPost(id) {
  return { type: DEL_LINK, id };
}

export function delLink(id) {
  return dispatch => fetch.delete(`/rest/links/${id}`, localStorage.authToken)
    .then(() => dispatch(delLinkPost(id)))
    .catch((error) => {
      console.log(error);
    }
  );
}

export function setLinks(linkList) {
  return { type: SET_LINKS, linkList };
}

/* If authToken is available it loads all links */
export function initialLoad() {
  if (!localStorage.authToken) {
    return { type: NO_OP };
  }
  return dispatch => fetch.get('/rest/links', localStorage.authToken)
    .then(response => response.json())
    .then((linkList) => {
      dispatch(setLinks(linkList));
    }).catch((error) => {
      console.log(error);
    }
  );
}

/* validates email+password. Stores authToken and redirect to partal if
   sucessful, set the error message in the state if not successful */
export function checkAuth(email, password, router) {
  return (dispatch) => {
    dispatch(setErrorMessage(''));
    let responseCode;
    fetch.post('/rest/authenticate', {
      email,
      password,
    }).then((response) => {
      responseCode = response.status;
      return response.json();
    }).then((json) => {
      if (responseCode === 200) {
        dispatch(setAuthToken(json.token));
        return dispatch(initialLoad()).then(() => {
          router.replace('/portalPage');
        });
      }
      throw json.message;
    }).catch((ex) => {
      dispatch(setErrorMessage(ex));
    });
  };
}

