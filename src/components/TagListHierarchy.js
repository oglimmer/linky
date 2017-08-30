
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Immutable from 'immutable';

import { changeTag } from '../redux/actions/links';
import { CachedTagHierarchy } from '../util/Hierarchy';

const divStyle = { marginTop: 9, marginBottom: 9 };

const TagListHierarchy = ({ tagHierarchy, onClick, selectedTag }) => {
  if (!selectedTag) {
    return null;
  }
  const cachedTagHierarchy = new CachedTagHierarchy(tagHierarchy);
  const sectedTagObject = cachedTagHierarchy.getNodeByName(selectedTag);
  if (!sectedTagObject) {
    return null;
  }
  let parentTagName = sectedTagObject.parent;
  let parents = cachedTagHierarchy.getSiblings(parentTagName);
  let siblings = cachedTagHierarchy.getSiblings(selectedTag);
  let children = cachedTagHierarchy.getChildren(selectedTag);
  let originalParentTagName;
  let labels = ['ion-ios-arrow-dropup', 'ion-ios-arrow-dropright', 'ion-ios-arrow-dropdown'];
  if (children.size === 0) {
    const parentOfParentName = cachedTagHierarchy.getNodeByName(parentTagName).parent;
    if (parentOfParentName && parentOfParentName !== 'root') {
      originalParentTagName = parentTagName;
      parentTagName = parentOfParentName;
      children = siblings;
      siblings = parents;
      parents = cachedTagHierarchy.getSiblings(parentTagName);
      labels = ['ion-ios-arrow-dropup-circle-outline', 'ion-ios-arrow-dropup', 'ion-ios-arrow-dropright'];
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
          <span><i className={labels[0]} />{' '}{ parents.map(tag => (
            <span key={Math.random()}>
              <span
                role="link"
                tabIndex="0"
                onClick={() => onClick(tag.name)}
                className={getLabel(tag.name, parentTagName)}
              >
                {tag.name} ({tag.count}/{cachedTagHierarchy.getChildren(tag.name).size})
              </span>
              {' '}
            </span>))}
          </span>
        ) }
      </div>
      <div><i className={labels[1]} />{' '}
        { siblings.map(tag => (
          <span key={Math.random()}>
            <span
              role="link"
              tabIndex="0"
              onClick={() => onClick(tag.name)}
              className={getLabel(tag.name, originalParentTagName)}
            >
              {tag.name} ({tag.count}/{cachedTagHierarchy.getChildren(tag.name).size})
            </span>
            {' '}
          </span>),
        ) }
      </div>
      { children && children.size > 0 ? (<span><i className={labels[2]} />{' '}
        { children.map(tag => (
          <span key={Math.random()}>
            <span
              role="link"
              tabIndex="0"
              onClick={() => onClick(tag.name)}
              className={getLabel(tag.name)}
            >
              {tag.name} ({tag.count}/{cachedTagHierarchy.getChildren(tag.name).size})
            </span>
            {' '}
          </span>),
        ) } </span>) : '' }
    </div>
  );
};
TagListHierarchy.propTypes = {
  tagHierarchy: PropTypes.shape().isRequired,
  onClick: PropTypes.func.isRequired,
  selectedTag: PropTypes.string,
};
TagListHierarchy.defaultProps = {
  selectedTag: null,
};

// ---------------------------------------------------------------------------------

const mapStateToProps = state => ({
  tagHierarchy: state.tagHierarchyData.tagHierarchy || Immutable.List(),
  selectedTag: state.mainData.selectedTag,
  authToken: state.auth.token,
});

const mapDispatchToProps = dispatch => ({
  onClick: tag => dispatch(changeTag(tag)),
});

export default connect(mapStateToProps, mapDispatchToProps)(TagListHierarchy);
