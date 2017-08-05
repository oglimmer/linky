
import { actions } from 'react-redux-form';
import { push } from 'react-router-redux';
import assert from 'assert';

import fetch from '../../util/fetch';
import { diff } from '../../util/ArrayUtil';

import { CLICK_LINK, CHANGE_SORTING_LINKS, SELECT_TAG, ADD_LINK, UPDATE_LINK,
  DEL_LINK, RSS_UPDATES, RSS_UPDATES_DETAILS, RSS_SET_DETAILS_ID, SET_LINKS,
  RENAME_TAG_LINKLIST, REMOVE_TAG_FROM_LINKS, TOGGLE_COLUMN_VIEW } from '../actionTypes';

import { fetchTagHierarchy, manipulateTagCounter } from './tagHierarchy';
import { setErrorMessage, setTempMessage, setInfoMessage } from './feedback';
import { setInSearchMode } from '../actions';

const RSS_UPDATE_FREQUENCY = 1000 * 60 * 5;


export function clickLink(id) {
  return { type: CLICK_LINK, id };
}

export function changeSortingLink(byColumn) {
  return { type: CHANGE_SORTING_LINKS, byColumn };
}

export function toggleColumnView(columnName) {
  return { type: TOGGLE_COLUMN_VIEW, columnName };
}

export function selectTag(tag) {
  return { type: SELECT_TAG, tag };
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

function setLinks(linkList) {
  return { type: SET_LINKS, linkList };
}

export function removeTagFromLinks(tagName) {
  return { type: REMOVE_TAG_FROM_LINKS, tagName };
}

export function renameTagInLinks(oldTagName, newTagName) {
  return (dispatch, getState) => {
    if (getState().mainData.linkList) {
      return { type: RENAME_TAG_LINKLIST, oldTagName, newTagName };
    }
    return Promise.resolve();
  };
}

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


export function fetchRssUpdatesDetails(id) {
  return (dispatch, getState) => {
    if (getState().mainData.selectedLinkForDetails === id) {
      dispatch(setRssDetailsId(null));
      return null;
    }
    return fetch.get(`/rest/links/${id}/rssDetails`, getState().auth.token)
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
    .then(linkList => dispatch(setLinks(linkList)))
    .catch(error => dispatch(setErrorMessage(error)));
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
    dispatch(setTempMessage('sending data to server ...'));
    const { linkList, selectedTag } = getState().mainData;
    return (linkId ?
      fetch.put(`/rest/links/${linkId}`, { url, tags, rssUrl, pageTitle, notes }, getState().auth.token) :
      fetch.post('/rest/links', { url, tags, rssUrl, pageTitle, notes }, getState().auth.token))
      .then(response => response.json())
      .then((newLink) => {
        if (newLink.message) {
          dispatch(setErrorMessage(newLink.message));
        } else {
          dispatch(setInfoMessage(`${newLink.linkUrl} with tags = ${newLink.tags} successfully saved.`));
          dispatch(handlingLinkListChange(linkId, newLink, selectedTag, dispatch));
          const oldElement = linkList.find(e => e.id === linkId);
          dispatch(handlingTagListChange(newLink, oldElement ? oldElement.tags : []));
        }
      })
      .catch(error => dispatch(setErrorMessage(error)));
  };
}

export function delLink(id) {
  return (dispatch, getState) => {
    dispatch(setTempMessage('sending data to server ...'));
    const linkToDelete = getState().mainData.linkList.find(e => e.id === id);
    assert(linkToDelete && linkToDelete.id && linkToDelete.tags);
    return fetch.delete(`/rest/links/${id}`, getState().auth.token)
      .then(() => {
        dispatch(delLinkPost(id));
        linkToDelete.tags.forEach(tagName => dispatch(manipulateTagCounter(tagName, -1)));
        dispatch(setInfoMessage(`${linkToDelete.linkUrl} successfully deleted.`));
      })
      .catch(error => dispatch(setErrorMessage(error)));
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

export function sendSearch(searchString) {
  return (dispatch, getState) =>
    fetch.get(`/rest/search/links?q=${encodeURIComponent(searchString)}`, getState().auth.token)
    .then((json) => {
      dispatch(setInSearchMode(true));
      dispatch(setLinks(json));
    })
    .catch(ex => dispatch(setErrorMessage(ex)));
}
