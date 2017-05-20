
import Immutable from 'immutable';

export const loginForm = {
  email: '',
  password: '',
};

export const addUrlForm = {
  id: null,
  url: '',
  tags: '',
};

export const initialStateMainData = {
  linkList: Immutable.List(),
  tagList: Immutable.List(),
  errorMessage: '',
  sortingByColumn: 'mostUsed',
  selectedTag: 'portal',
};

export const initialStateAuth = {
  token: '',
};

export const DEFAULT_LINK = {
  id: -1,
  linkUrl: '',
  callCounter: 0,
  lastCalled: new Date().toString(),
  createdDate: new Date().toString(),
  tags: ['all'],
};
