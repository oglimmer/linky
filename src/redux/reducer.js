
import { combineForms } from 'react-redux-form';
import { combineReducers } from 'redux';
import Immutable from 'immutable';
import { routerReducer } from 'react-router-redux';

import { ADD_LINK, DEL_LINK, SET_LINKS, MANIPULATE_TAG, UPDATE_LINK, RSS_SET_DETAILS_ID,
  SET_AUTH_TOKEN, CLEAR_AUTH_TOKEN, SET_ERROR_MESSAGE, RSS_UPDATES, RSS_UPDATES_DETAILS,
  CHANGE_SORTING_LINKS, CLICK_LINK, SELECT_TAG, ADD_TAG_HIERARCHY, RENAME_TAG_HIERARCHY,
  TOGGLE_VISIBILITY, SET_TAG_HIERARCHY, SELECT_NODE, REMOVE_TAG_HIERARCHY, RESET,
  RENAME_TAG_LINKLIST } from './actions';

import { initialStateAuth, initialStateMainData, loginForm, addUrlForm,
  DEFAULT_LINK, initialMenuBar, initialStateTagData } from './DataModels';

import immutableConverter from '../util/ImmutableConverter';
import { getNodeByName } from '../util/Hierarchy';

import { assert } from '../util/Assert';

function auth(state = initialStateAuth, action) {
  switch (action.type) {
    case RESET:
      return initialStateAuth;
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
    case RESET:
      return initialMenuBar;
    case TOGGLE_VISIBILITY:
      return Object.assign({}, state, {
        addEnabled: !state.addEnabled || action.forceShow,
      });
    default:
      return state;
  }
}

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
    const currentTags = ele.tags.split(' ');
    const index = currentTags.findIndex(tag => tag === action.oldTagName);
    if (index !== -1) {
      currentTags.remove(index, 1);
      currentTags.push(action.newTagName);
    }
  });
  return Immutable.List(linkList);
};

function mainData(state = initialStateMainData, action) {
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
    default:
      return state;
  }
}

/* eslint-disable no-nested-ternary */
const getNextIndex = (state) => {
  const sortedRootElements = state.tagHierarchy
  .filter(e => e.parent === 'root')
  .sort((a, b) => (a.index < b.index ? 1 : (a.index === b.index ? 0 : -1)));
  if (sortedRootElements.size > 0) {
    return sortedRootElements.get(0).index + 1;
  }
  return 0;
};
/* eslint-enable no-nested-ternary */

const addTagStateUpdate = (state, newTagName, initialCount) => state.tagHierarchy.push({
  name: newTagName,
  count: initialCount,
  parent: 'root',
  index: getNextIndex(state),
});

const manipulateTagStateUpdate = (state, action) => {
  const tagName = action.tagName;
  if (action.val < 0) {
    assert(getNodeByName(state.tagHierarchy, tagName).count > 0, `Count of ${tagName} was 0`);
  }
  const index = state.tagHierarchy.findIndex(ele => ele.name === tagName);
  if (index === -1) {
    return addTagStateUpdate(state, tagName, action.val);
  }
  return state.tagHierarchy.update(
    index,
    val => Object.assign({}, val, {
      count: val.count + action.val,
    }),
  );
};

const removeTagHierarchyUpdateState = (state) => {
  const toDel = state.selectedNode ? state.selectedNode.hierarchyLevelName : null;
  if (!toDel || toDel === 'root' || toDel === 'portal') {
    return state.tagHierarchy;
  }
  return state.tagHierarchy.filter(ele => ele.name !== toDel);
};

const renameTagHierarchyUpdateState = (state, oldName, newName) => {
  const tagHierarchy = state.tagHierarchy.toArray();
  tagHierarchy.forEach((ele) => {
    const elementToUpdate = ele;
    if (elementToUpdate.name === oldName) {
      elementToUpdate.name = newName;
    } else if (ele.parent === oldName) {
      elementToUpdate.parent = newName;
    }
  });
  return Immutable.List(tagHierarchy);
};

function tagHierarchyData(state = initialStateTagData, action) {
  switch (action.type) {
    case RESET:
      return initialStateTagData;
    case SET_TAG_HIERARCHY:
      return Object.assign({}, state, {
        tagHierarchy: immutableConverter(action.tagHierarchy),
      });
    case SELECT_NODE:
      return Object.assign({}, state, {
        selectedNode: action.node,
      });
    case MANIPULATE_TAG:
      return Object.assign({}, state, {
        tagHierarchy: manipulateTagStateUpdate(state, action),
      });
    case ADD_TAG_HIERARCHY:
      return Object.assign({}, state, {
        tagHierarchy: addTagStateUpdate(state, action.name, 0),
      });
    case REMOVE_TAG_HIERARCHY:
      return Object.assign({}, state, {
        tagHierarchy: removeTagHierarchyUpdateState(state),
      });
    case RENAME_TAG_HIERARCHY:
      return Object.assign({}, state, {
        tagHierarchy: renameTagHierarchyUpdateState(state, action.oldTagName, action.newTagName),
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
