
import { actions } from 'react-redux-form';

import fetch from '../util/fetch';

import { RESET, SET_AUTH_TOKEN, CLEAR_AUTH_TOKEN, TOGGLE_VISIBILITY } from './actionTypes';

import { initialLoadLinks, fetchRssUpdates } from './actions/links';
import { setErrorMessage, setInfoMessage, setTempMessage } from './actions/feedback';
import { fetchTagHierarchy } from './actions/tagHierarchy';

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
  return async (dispatch) => {
    await fetch.postCredentials('/rest/logout');
    dispatch(clearAuthToken());
  };
}

export function checkAuth(email, password) {
  return async (dispatch) => {
    try {
      dispatch(setErrorMessage(''));
      const response = await fetch.postCredentials('/rest/authenticate', {
        email,
        password,
      });
      const json = await response.json();
      if (response.status !== 200) {
        throw json.message;
      }
      dispatch(setAuthToken(json.token));
      await dispatch(initialLoadLinks('portal'));
      dispatch(fetchRssUpdates(true));
    } catch (err) {
      dispatch(setErrorMessage(err));
      throw err;
    }
  };
}

const CHECK_IMPORT_DONE_FREQUENCY = 2500;

const checkImportDone = async (dispatch, getState) => {
  const json = await fetch.get('/rest/import/ready', getState().auth.token);
  if (json.importDone) {
    dispatch(actions.change('importExport.buttonsDisable', false));
    dispatch(actions.change('importExport.bookmarks', ''));
    dispatch(setInfoMessage('Import completed.'));
    dispatch(fetchTagHierarchy());
  } else {
    setTimeout(() => { checkImportDone(dispatch, getState); }, CHECK_IMPORT_DONE_FREQUENCY);
  }
};

export function initAsyncWaits() {
  return async (dispatch, getState) => {
    const json = await fetch.get('/rest/import/ready', getState().auth.token);
    if (!json.importDone) {
      dispatch(setInfoMessage('Import in progress...'));
      dispatch(actions.change('importExport.buttonsDisable', true));
    }
  };
}

export function importBookmarks(bookmarks, tagPrefix, importNode) {
  return async (dispatch, getState) => {
    dispatch(setInfoMessage('Import started. This will take up to several minutes.'));
    dispatch(actions.change('importExport.buttonsDisable', true));
    setTimeout(() => { checkImportDone(dispatch, getState); }, CHECK_IMPORT_DONE_FREQUENCY);
    try {
      await fetch.patch('/rest/links/import', {
        bookmarks,
        tagPrefix,
        importNode,
      }, getState().auth.token);
    } catch (err) {
      dispatch(setErrorMessage(err));
    }
  };
}

export function exportBookmarks() {
  return async (dispatch, getState) => {
    try {
      dispatch(setTempMessage('sending data to server ...'));
      dispatch(actions.change('importExport.buttonsDisable', true));
      const json = await fetch.get('/rest/export/links', getState().auth.token);
      await dispatch(actions.change('importExport.bookmarks', json.content));
      dispatch(setInfoMessage('All data exported. Copy content from `NETSCAPE-Bookmark-file-1` into a file and import it into a browser of your choice.'));
      dispatch(actions.change('importExport.buttonsDisable', false));
    } catch (err) {
      dispatch(setErrorMessage(err));
    }
  };
}

export function getMeUserInformation() {
  return async (dispatch, getState) => {
    try {
      const json = await fetch.get('/rest/users/me', getState().auth.token);
      dispatch(setErrorMessage(`This is what we have stored about you: ${JSON.stringify(json)}`));
    } catch (err) {
      dispatch(setErrorMessage(err));
    }
  };
}
