
import Immutable from 'immutable';

import { ADD_LINK, DEL_LINK, SET_LINKS, UPDATE_LINK, RSS_SET_DETAILS_ID,
  SET_ERROR_MESSAGE, RSS_UPDATES, RSS_UPDATES_DETAILS, REMOVE_TAG_FROM_LINKS,
  CHANGE_SORTING_LINKS, CLICK_LINK, SELECT_TAG, RESET, RENAME_TAG_LINKLIST } from './../actionTypes';

import { initialStateMainData, DEFAULT_LINK } from './../DataModels';


const updateFeedUpdatesList = (state, action) => {
  const index = state.feedUpdatesList.findIndex(ele => ele.id === action.linkId);
  return {
    feedUpdatesList: state.feedUpdatesList.update(
      index === -1 ? state.feedUpdatesList.size : index,
      () => ({
        id: action.linkId,
        value: action.newUpdates,
      }),
    ),
  };
};

const renameTagLinklistUpdateState = (state, action) => {
  const linkList = state.linkList.toArray();
  linkList.forEach((ele) => {
    const index = ele.tags.findIndex(tag => tag === action.oldTagName);
    if (index !== -1) {
      ele.tags.splice(index, 1);
      if (ele.tags.findIndex(tag => tag === action.newTagName) === -1) {
        ele.tags.push(action.newTagName);
      }
    }
  });
  return Immutable.List(linkList);
};

const removeTagLinklistUpdateState = (state, action) => {
  const linkList = state.linkList.toArray();
  linkList.forEach((ele) => {
    const index = ele.tags.findIndex(tag => tag === action.tagName);
    if (index !== -1) {
      ele.tags.splice(index, 1);
    }
  });
  return Immutable.List(linkList);
};

export default function mainData(state = initialStateMainData, action) {
  switch (action.type) {
    case RESET:
      return initialStateMainData;
    case ADD_LINK:
      return Object.assign({}, state, {
        linkList: state.linkList.push(Object.assign({}, DEFAULT_LINK, {
          id: action.id,
          linkUrl: action.linkUrl,
          tags: action.tags,
          faviconUrl: action.faviconUrl,
          rssUrl: action.rssUrl,
          pageTitle: action.pageTitle,
          notes: action.notes,
        })),
      });
    case UPDATE_LINK:
      return Object.assign({}, state, {
        linkList: state.linkList.update(
          state.linkList.findIndex(ele => ele.id === action.id),
          val => Object.assign({}, val, {
            linkUrl: action.linkUrl,
            tags: action.tags,
            rssUrl: action.rssUrl,
            pageTitle: action.pageTitle,
            notes: action.notes,
          }),
        ),
      });
    case DEL_LINK:
      return Object.assign({}, state, {
        linkList: state.linkList.filter(ele => ele.id !== action.id),
      });
    case SET_LINKS:
      if (!Array.isArray(action.linkList)) {
        throw Error('action.linkList is NOT an array!');
      }
      return Object.assign({}, state, {
        linkList: Immutable.List(action.linkList),
      });
    case SELECT_TAG:
      return Object.assign({}, state, {
        selectedTag: action.tag,
      });
    case SET_ERROR_MESSAGE:
      return Object.assign({}, state, {
        errorMessage: action.errorMessage,
      });
    case CHANGE_SORTING_LINKS:
      return Object.assign({}, state, {
        sortingByColumn: action.byColumn,
      });
    case CLICK_LINK:
      return Object.assign({}, state, {
        linkList: state.linkList.update(
          state.linkList.findIndex(ele => ele.id === action.id),
          val => Object.assign({}, val, {
            callCounter: val.callCounter + 1,
            lastCalled: new Date().toString(),
          }),
        ),
        feedUpdatesList: state.feedUpdatesList.update(
          state.feedUpdatesList.findIndex(ele => ele.id === action.id),
          val => Object.assign({}, val, {
            value: 0,
          }),
        ),
      });
    case RSS_UPDATES:
      return Object.assign({}, state, updateFeedUpdatesList(state, action));
    case RSS_UPDATES_DETAILS:
      return Object.assign({}, state, {
        feedUpdatesDetails: Immutable.List(action.newDetails),
      });
    case RSS_SET_DETAILS_ID:
      return Object.assign({}, state, {
        selectedLinkForDetails: action.id,
      });
    case RENAME_TAG_LINKLIST:
      return Object.assign({}, state, {
        linkList: renameTagLinklistUpdateState(state, action),
      });
    case REMOVE_TAG_FROM_LINKS:
      return Object.assign({}, state, {
        linkList: removeTagLinklistUpdateState(state, action),
      });
    default:
      return state;
  }
}
