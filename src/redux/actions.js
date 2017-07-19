
import { actions } from 'react-redux-form';
import { push } from 'react-router-redux';
import assert from 'assert';

import fetch from '../util/fetch';
import { diff } from '../util/ArrayUtil';

const RSS_UPDATE_FREQUENCY = 1000 * 60 * 5;

/*
 * action types
 */

export const RESET = 'RESET';
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
export const MANIPULATE_TAG = 'MANIPULATE_TAG';
export const RSS_UPDATES = 'RSS_UPDATES';
export const RSS_UPDATES_DETAILS = 'RSS_UPDATES_DETAILS';
export const RSS_SET_DETAILS_ID = 'RSS_SET_DETAILS_ID';
export const TOGGLE_VISIBILITY = 'TOGGLE_VISIBILITY';
export const SET_TAG_HIERARCHY = 'SET_TAG_HIERARCHY';
export const SELECT_NODE = 'SELECT_NODE';
export const ADD_TAG_HIERARCHY = 'ADD_TAG_HIERARCHY';
export const REMOVE_TAG_HIERARCHY = 'REMOVE_TAG_HIERARCHY';

/*
 * action creators
 */
export function reset() {
  return { type: RESET };
}

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

function setTagHierarchy(tagHierarchy) {
  return { type: SET_TAG_HIERARCHY, tagHierarchy };
}

export function selectNodeInTagHierarchy(node) {
  return { type: SELECT_NODE, node };
}

function setLinks(linkList) {
  return { type: SET_LINKS, linkList };
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
    .then(() => dispatch(clearAuthToken()));
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
function fetchRssUpdates() {
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

export function fetchLinks(tag) {
  return (dispatch, getState) => fetch.get(`/rest/links/${tag}`, getState().auth.token)
    .then(response => response.json())
    .then(linkList => dispatch(setLinks(linkList)));
}

function fetchTagHierarchy() {
  return (dispatch, getState) => fetch.get('/rest/tags/hierarchy', getState().auth.token)
    .then(response => response.json())
    .then(tagHierarchy => dispatch(setTagHierarchy(tagHierarchy)));
}

export function changeTag(tag) {
  return dispatch => dispatch(push(tag));
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
    const toBeRemoved = diff(oldTags, newLink.tags);
    toBeRemoved.forEach(tagName => dispatch(manipulateTagCounter(tagName, -1)));
    // in new but not in old => add
    const toBeAdded = diff(newLink.tags, oldTags);
    toBeAdded.forEach(tagName => dispatch(manipulateTagCounter(tagName, 1)));
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
      linkToDelete.tags.forEach(tagName => dispatch(manipulateTagCounter(tagName, -1)));
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
    const shouldInitTags = !getState().tagHierarchyData.tagHierarchy;
    dispatch(selectTag(tag));
    const promises = [
      dispatch(fetchLinks(tag)),
    ];
    if (shouldInitTags) {
      promises.push(dispatch(fetchTagHierarchy()));
    }
    return Promise.all(promises);
  };
}

export function completeChangeTag(tag) {
  return (dispatch, getState) => {
    if (getState().mainData.selectedTag !== tag) {
      return dispatch(initialLoadLinks(tag))
        .then(() => dispatch(fetchRssUpdates()));
    }
    return Promise.resolve();
  };
}

export function initialLoadTags() {
  return (dispatch, getState) => {
    if (!getState().tagHierarchyData.tagHierarchy) {
      return dispatch(fetchTagHierarchy());
    }
    return Promise.resolve();
  };
}

// client-side only
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

export function saveTagHierarchy(tree) {
  return (dispatch, getState) => fetch.put('/rest/tags/hierarchy', { tree }, getState().auth.token)
      .then(response => response.json())
      .then(() => dispatch(setTagHierarchy(tree)))
      .catch(error => console.log(error));
}

export function removeTagHierarchyNode() {
  return (dispatch, getState) =>
      Promise.resolve(dispatch({ type: REMOVE_TAG_HIERARCHY }))
      .then(() => dispatch(saveTagHierarchy(getState().tagHierarchyData.tagHierarchy)));
}

export function addTagHierarchyNode() {
  /* eslint-disable no-alert */
  const name = prompt('Enter the node`s name ([a-z0-9])');
  /* eslint-enable no-alert */
  const simpleWordRegex = new RegExp('^[a-z0-9]*$');
  const split = name.toLowerCase().split(' ').filter(e => simpleWordRegex.test(e));
  if (split[0]) {
    return (dispatch, getState) =>
      Promise.resolve(dispatch({ type: ADD_TAG_HIERARCHY, name: split[0] }))
      .then(() => dispatch(saveTagHierarchy(getState().tagHierarchyData.tagHierarchy)));
  }
  return () => {
    // nop
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
      dispatch(setAuthToken(json.token));
      return dispatch(initialLoadLinks('portal'));
    }))
    .catch((ex) => {
      dispatch(setErrorMessage(ex));
      throw ex;
    });
  };
}
