
import { actions } from 'react-redux-form';
import { push } from 'react-router-redux';
import assert from 'assert';
import BlueBirdPromise from 'bluebird';

import fetch from '../../util/fetch';
import { diff } from '../../util/ArrayUtil';

import { CLICK_LINK, CHANGE_SORTING_LINKS, SELECT_TAG, ADD_LINK, UPDATE_LINK,
  DEL_LINK, RSS_UPDATES, RSS_UPDATES_DETAILS, RSS_SET_DETAILS_ID, SET_LINKS,
  RENAME_TAG_LINKLIST, REMOVE_TAG_FROM_LINKS, TOGGLE_COLUMN_VIEW } from '../actionTypes';

import { fetchTagHierarchy, manipulateTagCounter } from './tagHierarchy';
import { setErrorMessage, setTempMessage, setInfoMessage } from './feedback';

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
  return async (dispatch, getState) => {
    if (getState().mainData.selectedLinkForDetails === id) {
      dispatch(setRssDetailsId(null));
      return;
    }
    try {
      const json = await fetch.get(`/rest/links/${id}/rssDetails`, getState().auth.token);
      dispatch(setRssUpdates(id, json.result));
      dispatch(setRssUpdatesDetails(id, json.display));
      dispatch(setRssDetailsId(id));
    } catch (err) {
      dispatch(setErrorMessage(err));
    }
  };
}

const lastUpdates = {};
export function fetchRssUpdates(forceUpdate = false) {
  return async (dispatch, getState) => {
    const { linkList } = getState().mainData;
    const totals = await BlueBirdPromise.map(linkList.filter(e => e.rssUrl),
      async (linkElement) => {
        const lastFetch = lastUpdates[linkElement.id];
        if (forceUpdate || !lastFetch || lastFetch < Date.now() - RSS_UPDATE_FREQUENCY) {
          lastUpdates[linkElement.id] = Date.now();
          const json = await fetch.get(`/rest/links/${linkElement.id}/rss`, getState().auth.token);
          dispatch(setRssUpdates(linkElement.id, json.result));
          return json.result;
        }
        return 0;
      }, { concurrency: 5 },
    );
    const totalNewUpdates = totals.reduce((sum, value) => sum + value, 0);
    if (totalNewUpdates > 0) {
      if (Notification.permission !== 'granted') {
        Notification.requestPermission();
      } else {
        /* eslint-disable no-new */
        new Notification(`${totalNewUpdates} unread RSS feeds found!`, {
          icon: 'https://linky1.com/favicon.ico',
        });
        /* eslint-enable no-new */
      }
    }
  };
}


export function fetchLinks(tag) {
  return async (dispatch, getState) => {
    const selectedTag = tag || getState().mainData.selectedTag;
    try {
      const linkList = await fetch.get(`/rest/links/${selectedTag}`, getState().auth.token);
      dispatch(setLinks(linkList));
    } catch (err) {
      if (err.message.indexOf('Invalid auth token') !== -1) {
        dispatch(setErrorMessage('Session token expired. Reload this page!'));
      } else {
        dispatch(setErrorMessage(err));
      }
    }
  };
}


export function changeTag(tag) {
  return dispatch => dispatch(push(tag));
}

function handlingLinkListChange(linkId, link, selectedTag) {
  return (dispatch) => {
    if (!linkId) {
      // a new item: add to current list if it has the selectedTag
      if (link.tags.find(e => e === selectedTag)) {
        dispatch(addLinkPost(link));
      }
    } else if (!link.tags.find(e => e === selectedTag)) {
      // not new, so delete if it doesn't have the selected tag anymore
      dispatch(delLinkPost(link.id));
    } else {
      // not new and not deleted from the selectedTag, so update
      dispatch(updateLinkPost(link.id, link.linkUrl, link.tags, link.rssUrl,
        link.pageTitle, link.notes));
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

const updateAfterPersistLink = (responseUpdates, linkList, selectedTag, dispatch, successMsg) => {
  if (responseUpdates.message) {
    dispatch(setErrorMessage(responseUpdates.message));
  } else {
    const updateLink = (link) => {
      const oldElement = linkList.find(e => e.id === link.id);
      dispatch(handlingLinkListChange(oldElement ? oldElement.id : null, link, selectedTag));
      dispatch(handlingTagListChange(link, oldElement ? oldElement.tags : []));
    };
    const newLink = responseUpdates.primary;
    if (successMsg) {
      dispatch(setInfoMessage(successMsg));
    } else {
      const additionalInfo = responseUpdates.collateral && responseUpdates.collateral.length > 0 ? ` Also updated ${responseUpdates.collateral.length} other link(s).` : '';
      dispatch(setInfoMessage(`${newLink.linkUrl} with tags = ${newLink.tags} successfully saved. ${additionalInfo}`));
    }
    updateLink(newLink);
    if (responseUpdates.collateral) {
      responseUpdates.collateral.forEach(updateLink);
    }
  }
};

export function persistLink(linkId, url, tags, rssUrl, pageTitle, notes) {
  return async (dispatch, getState) => {
    dispatch(setTempMessage('sending data to server ...'));
    const { linkList, selectedTag } = getState().mainData;
    try {
      const response = await (linkId ?
        fetch.put(`/rest/links/${linkId}`, {
          url,
          tags,
          rssUrl,
          pageTitle,
          notes,
        }, getState().auth.token) :
        fetch.post('/rest/links', { url, tags, rssUrl, pageTitle, notes }, getState().auth.token));
      const responseUpdates = await response.json();
      updateAfterPersistLink(responseUpdates, linkList, selectedTag, dispatch);
    } catch (err) {
      dispatch(setErrorMessage(err));
    }
  };
}

export function delLink(id) {
  return async (dispatch, getState) => {
    dispatch(setTempMessage('sending data to server ...'));
    const linkToDelete = getState().mainData.linkList.find(e => e.id === id);
    assert(linkToDelete && linkToDelete.id && linkToDelete.tags);
    try {
      await fetch.delete(`/rest/links/${id}`, getState().auth.token);
      dispatch(delLinkPost(id));
      linkToDelete.tags.forEach(tagName => dispatch(manipulateTagCounter(tagName, -1)));
      dispatch(setInfoMessage(`${linkToDelete.linkUrl} successfully deleted.`));
    } catch (err) {
      dispatch(setErrorMessage(err));
    }
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
  return async (dispatch, getState) => {
    if (getState().mainData.selectedTag !== tag) {
      await dispatch(initialLoadLinks(tag));
      dispatch(fetchRssUpdates());
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
  const currentTime = new Date();
  return async (dispatch, getState) => {
    try {
      const json = await fetch.get(`/rest/search/links?q=${encodeURIComponent(searchString)}`, getState().auth.token);
      dispatch(setLinks(json));
      dispatch(actions.change('searchBar.serverSide', true));
      console.log(`Search took ${new Date().getTime() - currentTime.getTime()} millis`);
    } catch (err) {
      dispatch(setErrorMessage(err));
    }
  };
}

export function createArchive(id) {
  return async (dispatch, getState) => {
    dispatch(setTempMessage('sending data to server ...'));
    const { linkList, selectedTag } = getState().mainData;
    try {
      const response = await fetch.post(`/rest/archive/${id}`, {}, getState().auth.token);
      const responseUpdates = await response.json();
      updateAfterPersistLink(responseUpdates, linkList, selectedTag, dispatch, 'Archive successfully created.');
    } catch (err) {
      dispatch(setErrorMessage(err));
    }
  };
}
