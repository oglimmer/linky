
import { combineForms } from 'react-redux-form';
import { combineReducers } from 'redux';
import Immutable from 'immutable';
import { routerReducer } from 'react-router-redux';

import { ADD_LINK, DEL_LINK, SET_LINKS, DEL_TAG, MANIPULATE_TAG, UPDATE_LINK, RSS_SET_DETAILS_ID,
  SET_AUTH_TOKEN, CLEAR_AUTH_TOKEN, SET_ERROR_MESSAGE, RSS_UPDATES, RSS_UPDATES_DETAILS,
  CHANGE_SORTING_LINKS, CLICK_LINK, SET_TAGS, SELECT_TAG,
  TOGGLE_VISIBILITY, SET_TAG_HIERARCHY, SELECT_NODE } from './actions';

import { initialStateAuth, initialStateMainData, loginForm, addUrlForm,
  DEFAULT_LINK, initialMenuBar, initialStateTagData } from './DataModels';

import immutableConverter from '../util/ImmutableConverter';

function auth(state = initialStateAuth, action) {
  switch (action.type) {
    case SET_AUTH_TOKEN:
      return Object.assign({}, state, {
        token: action.authToken,
      });
    case CLEAR_AUTH_TOKEN:
      return Object.assign({}, state, initialStateAuth);
    default:
      return state;
  }
}

function menuBar(state = initialMenuBar, action) {
  switch (action.type) {
    case TOGGLE_VISIBILITY:
      return Object.assign({}, state, {
        addEnabled: !state.addEnabled || action.forceShow,
      });
    default:
      return state;
  }
}

const selectTagStateUpdate = (state, action) => {
  const stateUpdate = {
    selectedTag: action.tag,
  };
  if (!state.tagList.find(e => e[0] === action.tag)) {
    const clone = state.tagList.slice(0);
    clone.push([action.tag, 0]);
    stateUpdate.tagList = clone;
  }
  return stateUpdate;
};

const manipulateTagStateUpdate = (state, action) => {
  const index = state.tagList.findIndex(ele => ele[0] === action.tagName);
  return {
    tagList: state.tagList.update(
      index === -1 ? state.tagList.size : index,
      [action.tagName, 0],
      val => [val[0], val[1] + action.val],
    ),
  };
};

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

function mainData(state = initialStateMainData, action) {
  switch (action.type) {
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
      return Object.assign({}, state, {
        linkList: Immutable.List(action.linkList),
      });
    case SET_TAGS:
      return Object.assign({}, state, {
        tagList: Immutable.List(action.tagList),
      });
    case SELECT_TAG:
      return Object.assign({}, state, selectTagStateUpdate(state, action));
    case DEL_TAG:
      return Object.assign({}, state, {
        tagList: state.tagList.filter(ele => ele[0] !== action.tagName),
      });
    case MANIPULATE_TAG:
      return Object.assign({}, state, manipulateTagStateUpdate(state, action));
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
    default:
      return state;
  }
}

function tagHierarchyData(state = initialStateTagData, action) {
  console.log(`action = ${action.type}`);
  switch (action.type) {
    case SET_TAG_HIERARCHY:
      return Object.assign({}, state, {
        tagHierarchy: immutableConverter(action.tagHierarchy),
      });
    case SELECT_NODE:
      return Object.assign({}, state, {
        selectedNode: action.node,
      });
    default:
      return state;
  }
}

export default combineReducers({
  mainData,
  tagHierarchyData,
  auth,
  menuBar,
  login: combineForms(loginForm, 'login'),
  addUrl: combineForms(addUrlForm, 'addUrl'),
  router: routerReducer,
});
