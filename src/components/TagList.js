
import React from 'react';
import PropTypes from 'prop-types';
// import { ListGroup, ListGroupItem } from 'react-bootstrap';
import { connect } from 'react-redux';
// import ImmutablePropTypes from 'react-immutable-proptypes';
import Immutable from 'immutable';

import { changeTag } from '../redux/actions';
import { getSiblings, getChildren, getParentName, getParentSiblings } from '../util/Hierarchy';

const divStyle = { marginTop: 9, marginBottom: 9 };

const TagList = ({ tagHierarchy, onClick, selectedTag }) => {
  if (!selectedTag) {
    return null;
  }
  let parentTagName = getParentName(tagHierarchy, selectedTag);
  let parents = getParentSiblings(tagHierarchy, parentTagName);
  let siblings = getSiblings(tagHierarchy, selectedTag);
  let children = getChildren(tagHierarchy, selectedTag);
  let originalParentTagName;
  let labels = ['Parents', 'Siblings', 'Children'];
  if (children.size === 0) {
    const parentOfParentName = getParentName(tagHierarchy, parentTagName);
    if (parentOfParentName && parentOfParentName !== 'root') {
      originalParentTagName = parentTagName;
      parentTagName = parentOfParentName;
      children = siblings;
      siblings = parents;
      parents = getParentSiblings(tagHierarchy, parentTagName);
      labels = ['Grandparents', 'Parents', 'Siblings'];
    }
  }
  const getLabel = (tagName, warningLabel) => {
    if (tagName === selectedTag) {
      return 'label label-primary';
    } else if (tagName === warningLabel) {
      return 'label label-warning';
    }
    return 'label label-default';
  };
  return (
    <div style={divStyle}>
      <div>
        { parents.size === 1 && parents.get(0).name === 'root' ? '' : (
          <span>{labels[0]}: { parents.map(tag => (
            <span key={Math.random()}>
              <span
                role="link"
                tabIndex="0"
                onClick={() => onClick(tag.name)}
                className={getLabel(tag.name, parentTagName)}
              >
                {tag.name} ({tag.count})
              </span>
              {' '}
            </span>))}
          </span>
        ) }
      </div>
      <div>{labels[1]}:
      { siblings.map(tag => (
        <span key={Math.random()}>
          <span
            role="link"
            tabIndex="0"
            onClick={() => onClick(tag.name)}
            className={getLabel(tag.name, originalParentTagName)}
          >
            {tag.name} ({tag.count})
          </span>
          {' '}
        </span>),
      ) }
      </div>
      { children && children.size > 0 ? (<span>{labels[2]}:
        { children.map(tag => (
          <span key={Math.random()}>
            <span
              role="link"
              tabIndex="0"
              onClick={() => onClick(tag.name)}
              className={getLabel(tag.name)}
            >
              {tag.name} ({tag.count})
            </span>
            {' '}
          </span>),
      ) } </span>) : '' }
    </div>
  );
};
TagList.propTypes = {
  tagHierarchy: PropTypes.shape().isRequired,
  onClick: PropTypes.func.isRequired,
  selectedTag: PropTypes.string,
};
TagList.defaultProps = {
  selectedTag: null,
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
