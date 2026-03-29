
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import { actions } from 'react-redux-form';

import { changeTag } from '../redux/actions/links';
import { CachedTagHierarchy } from '../util/Hierarchy';

const divStyle = { marginTop: 9, marginBottom: 9 };

const TagListSearch = ({ tagHierarchy, onClick, selectedTag, searchBarTerm }) => {
  if (!selectedTag) {
    return null;
  }
  const cachedTagHierarchy = new CachedTagHierarchy(tagHierarchy);
  const tagsMatchingSearch = tagHierarchy.filter(t => t.name.indexOf(searchBarTerm) > -1);
  return (
    <div style={divStyle}>Search result in tags:{' '}
      { tagsMatchingSearch.map(tag => (
        <span key={`TagListSearch-${tag.name}`}>
          <span
            role="link"
            tabIndex="0"
            onClick={() => onClick(tag.name)}
            className="label label-default"
          >
            {tag.name} ({tag.count}/{cachedTagHierarchy.getChildren(tag.name).size})
          </span>
          {' '}
        </span>),
      ) }
    </div>
  );
};
TagListSearch.propTypes = {
  tagHierarchy: PropTypes.shape().isRequired,
  onClick: PropTypes.func.isRequired,
  selectedTag: PropTypes.string,
  searchBarTerm: PropTypes.string.isRequired,
};
TagListSearch.defaultProps = {
  selectedTag: null,
};

// ---------------------------------------------------------------------------------

const mapStateToProps = state => ({
  tagHierarchy: state.tagHierarchyData.tagHierarchy || { children: Immutable.List() },
  selectedTag: state.mainData.selectedTag,
  authToken: state.auth.token,
  searchBarTerm: state.searchBar.searchTerm,
});

const mapDispatchToProps = dispatch => ({
  onClick: (tag) => {
    dispatch(actions.reset('searchBar.searchTerm'));
    dispatch(actions.reset('searchBar.serverSide'));
    dispatch(changeTag(tag));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(TagListSearch);
