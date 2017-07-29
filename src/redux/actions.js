
import { actions } from 'react-redux-form';

import fetch from '../util/fetch';

import { RESET, SET_AUTH_TOKEN, CLEAR_AUTH_TOKEN, TOGGLE_VISIBILITY } from './actionTypes';

import { initialLoadLinks } from './actions/links';
import { setErrorMessage, setInfoMessage, setTempMessage } from './actions/feedback';

export function reset() {
  return { type: RESET };
}

export function setAuthToken(authToken) {
  return { type: SET_AUTH_TOKEN, authToken };
}

function clearAuthToken() {
  return { type: CLEAR_AUTH_TOKEN };
}

export function toggleVisibilityMenuBar(forceShow) {
  return { type: TOGGLE_VISIBILITY, forceShow: forceShow || false };
}

export function logout() {
  return dispatch => fetch.postCredentials('/rest/logout')
    .then(() => dispatch(clearAuthToken()));
}

export function checkAuth(email, password) {
  return (dispatch) => {
    dispatch(setErrorMessage(''));
    return fetch.postCredentials('/rest/authenticate', {
      email,
      password,
    })
    .then(response => response.json().then((json) => {
      if (response.status !== 200) {
        throw json.message;
      }
      dispatch(setAuthToken(json.token));
      return dispatch(initialLoadLinks('portal'));
    }))
    .catch((ex) => {
      dispatch(setErrorMessage(ex));
      throw ex;
    });
  };
}

export function importBookmarks(bookmarks, tagPrefix, importNode) {
  return (dispatch, getState) => fetch.patch('/rest/links/import', { bookmarks, tagPrefix, importNode }, getState().auth.token)
    .catch(error => dispatch(setErrorMessage(error)));
}

export function exportBookmarks() {
  return (dispatch, getState) => {
    dispatch(setTempMessage('sending data to server ...'));
    return fetch.get('/rest/export/links', getState().auth.token)
      .then(response => response.json())
      .then(json => dispatch(actions.change('importExport.bookmarks', json.content)))
      .then(() => dispatch(setInfoMessage('All data exported. Copy content from `NETSCAPE-Bookmark-file-1` into a file and import it into a browser of your choice.')))
      .catch(error => dispatch(setErrorMessage(error)));
  };
}
