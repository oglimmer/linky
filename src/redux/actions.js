
import { actions } from 'react-redux-form';
import { push } from 'react-router-redux';
import assert from 'assert';

import fetch from '../util/fetch';
import { diff } from '../util/ArrayUtil';

const RSS_UPDATE_FREQUENCY = 1000 * 60 * 5;

/*
 * action types
 */

export const ADD_LINK = 'ADD_LINK';
export const UPDATE_LINK = 'UPDATE_LINK';
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
export const RSS_UPDATES = 'RSS_UPDATES';
export const RSS_UPDATES_DETAILS = 'RSS_UPDATES_DETAILS';
export const RSS_SET_DETAILS_ID = 'RSS_SET_DETAILS_ID';
export const TOGGLE_VISIBILITY = 'TOGGLE_VISIBILITY';
export const SET_TAG_HIERACHY = 'SET_TAG_HIERACHY';

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

export function setAuthToken(authToken) {
  return { type: SET_AUTH_TOKEN, authToken };
}

function setTagHierachy(tagHierachy) {
  return { type: SET_TAG_HIERACHY, tagHierachy };
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
  const action = { type: SET_ERROR_MESSAGE, errorMessage };
  if (typeof errorMessage !== 'string') {
    action.errorMessage = JSON.stringify(errorMessage);
  }
  return action;
}

function addLinkPost(attr) {
  return Object.assign({}, attr, { type: ADD_LINK });
}

function updateLinkPost(id, linkUrl, tags, rssUrl, pageTitle, notes) {
  return { type: UPDATE_LINK, id, linkUrl, tags, rssUrl, pageTitle, notes };
}

function delLinkPost(id) {
  return { type: DEL_LINK, id };
}

function setRssUpdates(linkId, newUpdates) {
  return { type: RSS_UPDATES, linkId, newUpdates };
}

function setRssUpdatesDetails(linkId, newDetails) {
  return { type: RSS_UPDATES_DETAILS, linkId, newDetails };
}

function setRssDetailsId(id) {
  return { type: RSS_SET_DETAILS_ID, id };
}

export function toggleVisibilityMenuBar(forceShow) {
  return { type: TOGGLE_VISIBILITY, forceShow: forceShow || false };
}

// ---------------------------

export function resetAddLinkFields() {
  return (dispatch) => {
    dispatch(actions.reset('addUrl.url'));
    dispatch(actions.reset('addUrl.tags'));
    dispatch(actions.reset('addUrl.id'));
    dispatch(actions.reset('addUrl.rssUrl'));
    dispatch(actions.reset('addUrl.pageTitle'));
    dispatch(actions.reset('addUrl.notes'));
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

export function fetchRssUpdatesDetails(id) {
  return (dispatch, getState) => {
    if (getState().mainData.selectedLinkForDetails === id) {
      dispatch(setRssDetailsId(null));
      return null;
    }
    return fetch.get(`/rest/links/${id}/rssDetails`, getState().auth.token)
    .then(response => response.json())
    .then((json) => {
      dispatch(setRssUpdates(id, json.result));
      dispatch(setRssUpdatesDetails(id, json.display));
      dispatch(setRssDetailsId(id));
    })
    .catch(ex => dispatch(setErrorMessage(ex)));
  };
}

const lastUpdates = {};
export function fetchRssUpdates() {
  return (dispatch, getState) => {
    const { linkList } = getState().mainData;
    const ps = [];
    let totalNewUpdates = 0;
    linkList.filter(e => e.rssUrl).forEach((linkElement) => {
      const lastFetch = lastUpdates[linkElement.id];
      if (!lastFetch || lastFetch < Date.now() - RSS_UPDATE_FREQUENCY) {
        lastUpdates[linkElement.id] = Date.now();
        ps.push(new Promise((resolve, reject) => {
          fetch.get(`/rest/links/${linkElement.id}/rss`, getState().auth.token)
          .then(response => response.json())
          .then((json) => {
            totalNewUpdates += json.result;
            dispatch(setRssUpdates(linkElement.id, json.result));
            resolve();
          })
          .catch((ex) => {
            dispatch(setErrorMessage(ex));
            reject(ex);
          });
        }));
      }
    });
    Promise.all(ps).then(() => {
      if (totalNewUpdates > 0) {
        if (Notification.permission !== 'granted') {
          Notification.requestPermission();
        } else {
          /* eslint-disable no-new */
          new Notification(`${totalNewUpdates} unread RSS feeds found!`, {
            icon: 'https://linky.oglimmer.de/favicon.ico',
          });
          /* eslint-enable no-new */
        }
      }
    });
  };
}

function fetchLinks(tag) {
  return (dispatch, getState) => fetch.get(`/rest/links/${tag}`, getState().auth.token)
    .then(response => response.json())
    .then(linkList => dispatch(setLinks(linkList)));
}

function fetchTagHierachy() {
  return (dispatch, getState) => fetch.get('/rest/tags/hierachy', getState().auth.token)
    .then(response => response.json())
    .then(tagHierachy => dispatch(setTagHierachy(tagHierachy)));
}

export function changeTag(tag) {
  return dispatch => Promise.all([
    dispatch(fetchLinks(tag)),
    dispatch(push(tag)),
  ]).then(() => dispatch(fetchRssUpdates()));
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

function handlingLinkListChange(linkId, newLink, selectedTag) {
  return (dispatch) => {
    if (!linkId) {
      // a new item: add to current list if it has the selectedTag
      if (newLink.tags.find(e => e === selectedTag)) {
        dispatch(addLinkPost(newLink));
      }
    } else if (!newLink.tags.find(e => e === selectedTag)) {
      // not new, so delete if it doesn't have the selected tag anymore
      dispatch(delLinkPost(newLink.id));
    } else {
      // not new and not deleted from the selectedTag, so update
      dispatch(updateLinkPost(newLink.id, newLink.linkUrl, newLink.tags, newLink.rssUrl,
        newLink.pageTitle, newLink.notes));
    }
  };
}

function handlingTagListChange(newLink, oldTags) {
  return (dispatch) => {
    // in old but not in new => deleted
    dispatch(decreaseTagCounter(diff(oldTags, newLink.tags)));
    // in new but not in old => add
    diff(newLink.tags, oldTags).forEach(tagName => dispatch(manipulateTagCounter(tagName, 1)));
  };
}

export function persistLink(linkId, url, tags, rssUrl, pageTitle, notes) {
  return (dispatch, getState) => {
    const { linkList, selectedTag } = getState().mainData;
    return (linkId ?
      fetch.put(`/rest/links/${linkId}`, { url, tags, rssUrl, pageTitle, notes }, getState().auth.token) :
      fetch.post('/rest/links', { url, tags, rssUrl, pageTitle, notes }, getState().auth.token))
      .then(response => response.json())
      .then((newLink) => {
        dispatch(handlingLinkListChange(linkId, newLink, selectedTag, dispatch));
        const oldElement = linkList.find(e => e.id === linkId);
        dispatch(handlingTagListChange(newLink, oldElement ? oldElement.tags : []));
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

export function editLink(id, url, tags, rssUrl, pageTitle, notes) {
  return (dispatch) => {
    dispatch(actions.change('addUrl.id', id));
    dispatch(actions.change('addUrl.url', url));
    dispatch(actions.change('addUrl.tags', tags));
    dispatch(actions.change('addUrl.rssUrl', rssUrl || ''));
    dispatch(actions.change('addUrl.pageTitle', pageTitle || ''));
    dispatch(actions.change('addUrl.notes', notes || ''));
  };
}

export function initialLoadLinks(tag) {
  return (dispatch, getState) => {
    // HACK: we assume an empty list means it wasn't loaded yet, while this won't harm
    // it might not be true and thus an unnecessary action
    if (getState().mainData.linkList.size === 0) {
      return Promise.all([
        dispatch(fetchLinks(tag)),
        dispatch(loadTags()),
      ]);
    }
    return Promise.resolve();
  };
}

export function initialLoadTags() {
  return (dispatch, getState) => {
    if (!getState().tagHierachyData.tagHierachy) {
      return dispatch(fetchTagHierachy());
    }
    return Promise.resolve();
  };
}

export function startRssUpdates() {
  return (dispatch, getState) => {
    if (getState().auth.token) {
      dispatch(fetchRssUpdates());
      setTimeout(() => {
        dispatch(startRssUpdates());
      }, RSS_UPDATE_FREQUENCY);
    }
  };
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
      return dispatch(setAuthToken(json.token));
    }))
    .then(() => dispatch(initialLoadLinks('portal')))
    .then(() => dispatch(startRssUpdates()))
    .catch((ex) => {
      dispatch(setErrorMessage(ex));
      throw ex;
    });
  };
}
