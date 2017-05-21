
import { actions } from 'react-redux-form';

import assert from 'assert';

import fetch from '../util/fetch';
import { diff } from '../util/ArrayUtil';

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
export const DEL_TAG = 'DEL_TAG';
export const MANIPULATE_TAG = 'MANIPULATE_TAG';

/*
 * action creators
 */

export function clickLink(id) {
  return { type: CLICK_LINK, id };
}

export function changeSortingLink(byColumn) {
  return { type: CHANGE_SORTING_LINKS, byColumn };
}

function selectTag(tag) {
  return { type: SELECT_TAG, tag };
}

export function setAuthToken(authToken) {
  return { type: SET_AUTH_TOKEN, authToken };
}

function setLinks(linkList) {
  return { type: SET_LINKS, linkList };
}

function setTags(tagList) {
  return { type: SET_TAGS, tagList };
}

function removeTag(tagName) {
  return { type: DEL_TAG, tagName };
}

function manipulateTagCounter(tagName, val) {
  return { type: MANIPULATE_TAG, tagName, val };
}

function clearAuthToken() {
  return { type: CLEAR_AUTH_TOKEN };
}

function setErrorMessage(errorMessage) {
  return { type: SET_ERROR_MESSAGE, errorMessage };
}

function addLinkPost(id, linkUrl, tags) {
  return { type: ADD_LINK, id, linkUrl, tags };
}

function delLinkPost(id) {
  return { type: DEL_LINK, id };
}

// ---------------------------

export function resetAddLinkFields() {
  return (dispatch) => {
    dispatch(actions.reset('addUrl.url'));
    dispatch(actions.reset('addUrl.tags'));
    dispatch(actions.reset('addUrl.id'));
  };
}

export function logout() {
  return dispatch => fetch.postCredentials('/rest/logout')
    .then(() => {
      dispatch(clearAuthToken());
      dispatch(setLinks([]));
      dispatch(setTags([]));
    });
}

function loadTags() {
  return (dispatch, getState) => fetch.get('/rest/tags', getState().auth.token)
    .then(response => response.json())
    .then(tagList => dispatch(setTags(tagList)))
    .catch(error => console.log(error));
}

function fetchLinks(tag) {
  return (dispatch, getState) => fetch.get(`/rest/links/${tag}`, getState().auth.token)
    .then(response => response.json())
    .then(linkList => dispatch(setLinks(linkList)));
}

function changeTag(tag) {
  return (dispatch) => {
    dispatch(selectTag(tag));
    dispatch(fetchLinks(tag));
  };
}

function decreaseTagCounter(tagNamesToDecrease) {
  return (dispatch, getState) => {
    tagNamesToDecrease.forEach((tagName) => {
      const { tagList, selectedTag } = getState().mainData;
      const tagElement = tagList.find(e => e[0] === tagName);
      assert(tagName === tagElement[0] && tagElement[1] !== 0);
      if (tagElement[1] > 1 || tagName === 'portal') {
        dispatch(manipulateTagCounter(tagName, -1));
      } else {
        dispatch(removeTag(tagName));
        if (selectedTag === tagName) {
          dispatch(changeTag('portal'));
        }
      }
    });
  };
}

export function persistLink(linkId, url, tags, selectedTag) {
  return (dispatch, getState) => {
    console.log(getState().mainData.linkList);
    const oldElement = getState().mainData.linkList.find(e => e.id === linkId);
    const oldTags = oldElement ? oldElement.tags : [];
    return (linkId ?
      fetch.put(`/rest/links/${linkId}`, { url, tags }, getState().auth.token) :
      fetch.post('/rest/links', { url, tags }, getState().auth.token))
      .then(response => response.json())
      .then((newLink) => {
        if (!linkId && newLink.tags.find(e => e === selectedTag)) {
          dispatch(addLinkPost(newLink.id, newLink.linkUrl, newLink.tags));
        } else if (!newLink.tags.find(e => e === selectedTag)) {
          dispatch(delLinkPost(newLink.id));
        }
        // in old but not in news => deleted
        dispatch(decreaseTagCounter(diff(oldTags, newLink.tags)));
        // in new but not in old => add
        diff(newLink.tags, oldTags).forEach(tagName => dispatch(manipulateTagCounter(tagName, 1)));
      })
      .catch(error => console.log(error));
  };
}

export function delLink(id) {
  return (dispatch, getState) => {
    const linkToDelete = getState().mainData.linkList.find(e => e.id === id);
    assert(linkToDelete && linkToDelete.id && linkToDelete.tags);
    return fetch.delete(`/rest/links/${id}`, getState().auth.token)
    .then(() => {
      dispatch(delLinkPost(id));
      dispatch(decreaseTagCounter(linkToDelete.tags));
    })
    .catch(error => console.log(error));
  };
}

export function editLink(id, url, tags) {
  return (dispatch) => {
    dispatch(actions.change('addUrl.id', id));
    dispatch(actions.change('addUrl.url', url));
    dispatch(actions.change('addUrl.tags', tags));
  };
}

export function fetchLinksAndSelectTag(tag) {
  return dispatch => dispatch(changeTag(tag));
}

export function initialLoad() {
  return dispatch => Promise.all([
    dispatch(fetchLinks('portal', dispatch)),
    dispatch(loadTags()),
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
        return dispatch(setAuthToken(json.token)).then(() => dispatch(initialLoad()));
      }
      throw json.message;
    })
    .catch((ex) => {
      dispatch(setErrorMessage(ex));
      throw ex;
    });
  };
}
