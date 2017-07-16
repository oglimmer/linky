
import React from 'react';
import PropTypes from 'prop-types';
// import { ListGroup, ListGroupItem } from 'react-bootstrap';
import { connect } from 'react-redux';
// import ImmutablePropTypes from 'react-immutable-proptypes';
import Immutable from 'immutable';

import { changeTag } from '../redux/actions';
import { getSiblings } from '../util/Hierarchy';

const divStyle = { marginTop: 9, marginBottom: 9 };

const TagList = ({ tagHierarchy, onClick, selectedTag }) => (
  <div style={divStyle}>
    { getSiblings(tagHierarchy, selectedTag).map(tag => (
      <span key={Math.random()}>
        <span
          role="link"
          tabIndex="0"
          onClick={() => onClick(tag.hierarchyLevelName)}
          className={tag.hierarchyLevelName === selectedTag ? 'label label-primary' : 'label label-default'}
        >
          {tag.hierarchyLevelName} ({tag.count})
        </span>
        {' '}
      </span>),
    ) }
  </div>
);
TagList.propTypes = {
  tagHierarchy: PropTypes.shape().isRequired,
  onClick: PropTypes.func.isRequired,
  selectedTag: PropTypes.string.isRequired,
};

// ---------------------------------------------------------------------------------

const mapStateToProps = state => ({
  tagHierarchy: state.tagHierarchyData.tagHierarchy || { children: Immutable.List() },
  selectedTag: state.mainData.selectedTag,
  authToken: state.auth.token,
});

const mapDispatchToProps = dispatch => ({
  onClick: tag => dispatch(changeTag(tag)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TagList);
