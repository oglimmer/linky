
import { combineForms } from 'react-redux-form';
import { combineReducers } from 'redux';
import Cookies from 'js-cookie';
import Immutable from 'immutable';

import { ADD_LINK, DEL_LINK, SET_LINKS,
  SET_AUTH_TOKEN, CLEAR_AUTH_TOKEN, SET_ERROR_MESSAGE } from './actions';

const loginForm = {
  email: 'foo@test.com',
  password: 'foo',
};
const addUrlForm = {
  url: '',
};

const initialStateMainData = {
  linkList: Immutable.List(),
  errorMessage: '',
};

const initialStateAuth = {
  token: '',
};

function auth(state = initialStateAuth, action) {
  switch (action.type) {
    case SET_AUTH_TOKEN:
      Cookies.set('authToken', action.authToken, {
        secure: /* CONSTANT_START COOKIE_SECURE */ true /* CONSTANT_END */,
        expires: 365,
      });
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

function mainData(state = initialStateMainData, action) {
  switch (action.type) {
    case ADD_LINK:
      return Object.assign({}, state, {
        linkList: state.linkList.push({
          id: action.id,
          linkUrl: action.linkUrl,
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
    case SET_ERROR_MESSAGE:
      return Object.assign({}, state, {
        errorMessage: action.errorMessage,
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
