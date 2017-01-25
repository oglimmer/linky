
import _ from 'lodash';
import { combineForms } from 'react-redux-form';
import { combineReducers } from 'redux';

import { ADD_LINK, DEL_LINK, SET_LINKS,
  SET_AUTH_TOKEN, CLEAR_AUTH_TOKEN, SET_ERROR_MESSAGE } from './actions';

const loginForm = {
  email: 'foo@test.com',
  password: 'foo',
};

const initialStateMainData = {
  linkList: [],
  errorMessage: '',
};

function mainData(state = initialStateMainData, action) {
  switch (action.type) {
    case ADD_LINK:
      return Object.assign({}, state, {
        linkList: [
          ...state.linkList,
          {
            id: action.id,
            linkUrl: action.linkUrl,
          },
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
    case SET_AUTH_TOKEN:
      localStorage.authToken = action.authToken;
      return state;
    case CLEAR_AUTH_TOKEN:
      localStorage.removeItem('authToken');
      return Object.assign({}, state, initialStateMainData);
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
  login: combineForms(loginForm, 'login'),
});
