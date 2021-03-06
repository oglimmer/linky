
import Immutable from 'immutable';
import PropTypes from 'prop-types';

export const loginForm = {
  email: '',
  password: '',
};

export const addUrlForm = {
  id: null,
  url: '',
  tags: '',
  rssUrl: '',
  pageTitle: '',
  notes: '',
};

export const searchBarForm = {
  searchTerm: '',
  serverSide: false,
};

export const importExportForm = {
  bookmarks: '',
  tagPrefix: '',
  importNode: 'import',
  buttonsDisable: false,
};

export const initialFeedbackData = {
  errorMessage: '',
  infoMessage: '',
  tempMessage: '',
};

export const initialStateMainData = {
  linkList: Immutable.List(),
  feedUpdatesList: Immutable.List(),
  feedUpdatesDetails: Immutable.List(),
  selectedLinkForDetails: null,
  sortingByColumn: 'mostUsed',
  sortingByColumnOrder: 1,
  selectedTag: null,
  listColumns: Immutable.List(['pageTitle']),
};

export const initialStateTagData = {
  tagHierarchy: null,
  selectedNode: null,
  dragInProgress: null,
};

export const initialMenuBar = {
  addEnabled: false,
};

export const initialStateAuth = {
  token: '',
};

export const DEFAULT_LINK = {
  // id: -1,
  linkUrl: '',
  callCounter: 0,
  lastCalled: new Date().toString(),
  createdDate: new Date().toString(),
  tags: ['all'],
  rssUrl: '',
  pageTitle: '',
  notes: '',
};

export const DEFAULT_LINK_PROP_TYPES = {
  id: PropTypes.string.isRequired,
  linkUrl: PropTypes.string.isRequired,
  callCounter: PropTypes.number.isRequired,
  lastCalled: PropTypes.string.isRequired,
  createdDate: PropTypes.string.isRequired,
  tags: PropTypes.array.isRequired,
  rssUrl: PropTypes.string,
  pageTitle: PropTypes.string,
  notes: PropTypes.string,
};
