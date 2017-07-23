
import { combineForms } from 'react-redux-form';
import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import { SET_AUTH_TOKEN, CLEAR_AUTH_TOKEN, TOGGLE_VISIBILITY, RESET } from './actionTypes';

import { initialStateAuth, loginForm, addUrlForm, initialMenuBar, importExportForm }
  from './DataModels';

import mainData from './reducers/mainData';
import tagHierarchyData from './reducers/tagHierarchyData';

console.log('SET_AUTH_TOKEN');
console.log(SET_AUTH_TOKEN);

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

export default combineReducers({
  mainData,
  tagHierarchyData,
  auth,
  menuBar,
  login: combineForms(loginForm, 'login'),
  addUrl: combineForms(addUrlForm, 'addUrl'),
  importExport: combineForms(importExportForm, 'importExport'),
  router: routerReducer,
});
