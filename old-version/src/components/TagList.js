
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import TagListHierarchy from './TagListHierarchy';
import TagListSearch from './TagListSearch';

const TagList = ({ searchBarTerm, serverSide }) => (
  <div>
    { serverSide || !searchBarTerm ? <TagListHierarchy /> : '' }
    { !(serverSide || !searchBarTerm) ? <TagListSearch /> : '' }
  </div>
);
TagList.propTypes = {
  searchBarTerm: PropTypes.string.isRequired,
  serverSide: PropTypes.bool.isRequired,
};

const mapStateToProps = state => ({
  searchBarTerm: state.searchBar.searchTerm,
  serverSide: state.searchBar.serverSide,
});

export default connect(mapStateToProps)(TagList);
