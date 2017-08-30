
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Immutable from 'immutable';

import { changeTag, completeChangeTag } from '../redux/actions/links';
import { CachedTagHierarchy } from '../util/Hierarchy';

const divStyle = { marginTop: 9, marginBottom: 9 };

class TagListHierarchy extends React.Component {
  componentDidMount() {
    const tag = this.props.match.params.tag;
    if (this.props.selectedTag !== tag) {
      this.props.onCompleteChangeTag(tag);
    }
  }

  render() {
    if (!this.props.selectedTag || this.props.tagHierarchy.size === 0) {
      return null;
    }
    const cachedTagHierarchy = new CachedTagHierarchy(this.props.tagHierarchy);
    let parentTagName = cachedTagHierarchy.getNodeByName(this.props.selectedTag).parent;
    let parents = cachedTagHierarchy.getSiblings(parentTagName);
    let siblings = cachedTagHierarchy.getSiblings(this.props.selectedTag);
    let children = cachedTagHierarchy.getChildren(this.props.selectedTag);
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
      if (tagName === this.props.selectedTag) {
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
                  onClick={() => this.props.onClick(tag.name)}
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
                onClick={() => this.props.onClick(tag.name)}
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
                onClick={() => this.props.onClick(tag.name)}
                className={getLabel(tag.name)}
              >
                {tag.name} ({tag.count}/{cachedTagHierarchy.getChildren(tag.name).size})
              </span>
              {' '}
            </span>),
          ) } </span>) : '' }
      </div>
    );
  }
}
TagListHierarchy.propTypes = {
  tagHierarchy: PropTypes.shape().isRequired,
  onClick: PropTypes.func.isRequired,
  onCompleteChangeTag: PropTypes.func.isRequired,
  selectedTag: PropTypes.string,
  match: PropTypes.shape().isRequired,
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
  onCompleteChangeTag: tag => dispatch(completeChangeTag(tag)),
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(TagListHierarchy));
