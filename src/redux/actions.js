
import { actions } from 'react-redux-form';

import fetch from '../util/fetch';

/*
 * action types
 */

export const ADD_LINK = 'ADD_LINK';
export const DEL_LINK = 'DEL_LINK';
export const SET_LINKS = 'SET_LINKS';
export const SET_TAGS = 'SET_TAGS';
export const SET_AUTH_TOKEN = 'SET_AUTH_TOKEN';
export const CLEAR_AUTH_TOKEN = 'CLEAR_AUTH_TOKEN';
export const SET_ERROR_MESSAGE = 'SET_ERROR_MESSAGE';
export const CHANGE_SORTING_LINKS = 'CHANGE_SORTING_LINKS';
export const CLICK_LINK = 'CLICK_LINK';
export const SELECT_TAG = 'SELECT_TAG';
export const EDIT_LINK = 'EDIT_LINK';

/*
 * action creators
 */

export function clickLink(id) {
  return { type: CLICK_LINK, id };
}

export function changeSortingLink(byColumn) {
  return { type: CHANGE_SORTING_LINKS, byColumn };
}

export function selectTag(tag) {
  return { type: SELECT_TAG, tag };
}

export function setLinks(linkList) {
  return { type: SET_LINKS, linkList };
}

export function setTags(tagList) {
  return { type: SET_TAGS, tagList };
}

export function clearAuthToken() {
  return { type: CLEAR_AUTH_TOKEN };
}

export function logout() {
  return dispatch => fetch.postCredentials('/rest/logout')
    .then(() => {
      dispatch(clearAuthToken());
      dispatch(setLinks([]));
      dispatch(setTags([]));
    });
}

export function setAuthToken(authToken) {
  return { type: SET_AUTH_TOKEN, authToken };
}

export function setErrorMessage(errorMessage) {
  return { type: SET_ERROR_MESSAGE, errorMessage };
}

export function addLinkPost(id, linkUrl, tags) {
  return { type: ADD_LINK, id, linkUrl, tags };
}

export function addLink(linkId, url, tags, authToken) {
  if (linkId) {
    return dispatch => fetch.put(`/rest/links/${linkId}`, { url, tags }, authToken)
      .then(response => response.json())
      .then(newLink => dispatch(addLinkPost(newLink.id, newLink.linkUrl, newLink.tags)))
      .catch(error => console.log(error));
  }
  return dispatch => fetch.post('/rest/links', { url, tags }, authToken)
    .then(response => response.json())
    .then(newLink => dispatch(addLinkPost(newLink.id, newLink.linkUrl, newLink.tags)))
    .catch(error => console.log(error));
}

export function delLinkPost(id) {
  return { type: DEL_LINK, id };
}

export function delLink(id, authToken) {
  return dispatch => fetch.delete(`/rest/links/${id}`, authToken)
    .then(() => dispatch(delLinkPost(id)))
    .catch(error => console.log(error));
}

export function editLink(id, url, tags) {
  return (dispatch) => {
    dispatch(actions.change('addUrl.id', id));
    dispatch(actions.change('addUrl.url', url));
    dispatch(actions.change('addUrl.tags', tags));
  };
  // { type: EDIT_LINK, id };
}

function fetchLinks(authToken, tag) {
  return dispatch => fetch.get(`/rest/links/${tag}`, authToken)
    .then(response => response.json())
    .then(linkList => dispatch(setLinks(linkList)));
}

export function fetchLinksAndSelectTag(authToken, tag) {
  return dispatch => Promise.all([
    dispatch(fetchLinks(authToken, tag, dispatch)),
    dispatch(selectTag(tag)),
  ]);
}

export function initialLoad(authToken) {
  return dispatch => Promise.all([
    dispatch(fetchLinks(authToken, 'portal', dispatch)),
    fetch.get('/rest/tags', authToken)
      .then(response => response.json())
      .then(tagList => dispatch(setTags(tagList)))
      .catch(error => console.log(error)),
  ]);
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
