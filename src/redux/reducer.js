
const _ = require('lodash');
const { combineForms } = require('react-redux-form');
const { combineReducers } = require('redux');
const Cookies = require('js-cookie');

const { ADD_LINK, DEL_LINK, SET_LINKS,
  SET_AUTH_TOKEN, CLEAR_AUTH_TOKEN, SET_ERROR_MESSAGE } = require('./actions');

const loginForm = {
  email: 'foo@test.com',
  password: 'foo',
};

const initialStateMainData = {
  linkList: [],
  errorMessage: '',
};

const initialStateAuth = {
  token: '',
};

function auth(state = initialStateAuth, action) {
  switch (action.type) {
    case SET_AUTH_TOKEN:
      Cookies.set('authToken', action.authToken);
      return Object.assign({}, state, {
        token: action.authToken,
      });
    case CLEAR_AUTH_TOKEN:
      Cookies.remove('authToken');
      return Object.assign({}, state, initialStateAuth);
    default:
      return state;
  }
}
/* eslint-disable comma-dangle */
function mainData(state = initialStateMainData, action) {
  switch (action.type) {
    case ADD_LINK:
      return Object.assign({}, state, {
        linkList: [
          {
            id: action.id,
            linkUrl: action.linkUrl,
          },
          ...state.linkList
        ],
      });
    case DEL_LINK:
      return Object.assign({}, state, {
        linkList: _.filter(state.linkList, ele => ele.id !== action.id),
      });
    case SET_LINKS:
      return Object.assign({}, state, {
        linkList: action.linkList,
      });
    case SET_ERROR_MESSAGE:
      return Object.assign({}, state, {
        errorMessage: action.errorMessage,
      });
    default:
      return state;
  }
}

module.exports = combineReducers({
  mainData,
  auth,
  login: combineForms(loginForm, 'login'),
});
