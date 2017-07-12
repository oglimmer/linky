
import React from 'react';
import Tree from 'react-ui-tree';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { initialLoadTags, selectNodeInTagHierarchy } from '../redux/actions';

class TagPage extends React.Component {
  constructor(props) {
    super(props);
    this.renderNode = this.renderNode.bind(this);
  }

  componentDidMount() {
    this.props.dispatch(initialLoadTags());
  }

  renderNode(node) {
    const style = {
      backgroundColor: ['all', 'broken', 'rss', 'untagged', 'urlupdated', 'portal', 'locked']
        .find(e => node.module === e) ? 'red' : '',
      border: this.props.selectedNode === node.module ? '1px solid black' : '',
    };
    return (
      <span
        role="button"
        tabIndex={0}
        style={style}
        onClick={() => this.props.onClick(node.module)}
      >
        {node.module} ({node.count})
      </span>
    );
  }

  render() {
    const plainObject = JSON.parse(JSON.stringify(this.props.tree));
    return (
      <div>
        <Tree
          paddingLeft={20}
          tree={plainObject}
          renderNode={this.renderNode}
        />
      </div>
    );
  }
}
TagPage.propTypes = {
  dispatch: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  tree: PropTypes.shape().isRequired,
  selectedNode: PropTypes.string,
};
TagPage.defaultProps = {
  selectedNode: null,
};

const mapStateToProps = state => ({
  tree: state.tagHierarchyData.tagHierarchy || {},
  selectedNode: state.tagHierarchyData.selectedNode,
});

const mapDispatchToProps = dispatch => ({
  onClick: nodeName => dispatch(selectNodeInTagHierarchy(nodeName)),
});

export default connect(mapStateToProps, mapDispatchToProps)(TagPage);
