
import { combineForms } from 'react-redux-form';
import { combineReducers } from 'redux';
import Immutable from 'immutable';

import { ADD_LINK, DEL_LINK, SET_LINKS,
  SET_AUTH_TOKEN, CLEAR_AUTH_TOKEN, SET_ERROR_MESSAGE,
  CHANGE_SORTING_LINKS, CLICK_LINK, SET_TAGS, SELECT_TAG } from './actions';

const loginForm = {
  email: '',
  password: '',
};
const addUrlForm = {
  url: '',
  tags: '',
};

const initialStateMainData = {
  linkList: Immutable.List(),
  tagList: Immutable.List(),
  errorMessage: '',
  sortingByColumn: 'mostUsed',
  selectedTag: 'portal',
};

const initialStateAuth = {
  token: '',
};

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

function mainData(state = initialStateMainData, action) {
  switch (action.type) {
    case ADD_LINK:
      return Object.assign({}, state, {
        linkList: state.linkList.push({
          id: action.id,
          linkUrl: action.linkUrl,
          callCounter: 0,
          lastCalled: new Date(),
          createdDate: new Date(),
        }),
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
          state.linkList.findIndex(ele => ele.id === action.id), val => ({
            id: val.id,
            linkUrl: val.linkUrl,
            callCounter: val.callCounter + 1,
            lastCalled: new Date(),
            createdDate: val.createdDate,
          })),
      });
    default:
      return state;
  }
}

export default combineReducers({
  mainData,
  auth,
  login: combineForms(loginForm, 'login'),
  addUrl: combineForms(addUrlForm, 'addUrl'),
});
