
import React from 'react';
import Tree from 'react-ui-tree';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { initialLoadTags, selectNodeInTagHierarchy, addTagHierarchyNode,
  removeTagHierarchyNode, saveTagHierarchy } from '../redux/actions';

class TagPage extends React.Component {
  constructor(props) {
    super(props);
    this.renderNode = this.renderNode.bind(this);
  }

  componentDidMount() {
    this.props.initialLoadTags();
  }

  renderNode(node) {
    const fallbackColor = node.count === 0 ? 'green' : '';
    const color = ['all', 'broken', 'rss', 'untagged', 'urlupdated', 'portal', 'locked']
        .find(e => node.module === e) ? 'red' : fallbackColor;
    const style = {
      color,
      backgroundColor: this.props.selectedNode && this.props.selectedNode.module === node.module ? '#bbbbbb' : '',
    };
    return (
      <span
        role="button"
        tabIndex={0}
        style={style}
        onClick={() => this.props.onClick(node)}
      >
        {node.module} ({node.count})
      </span>
    );
  }

  render() {
    const plainObject = JSON.parse(JSON.stringify(this.props.tree));
    const isRemoveAvail = this.props.selectedNode && this.props.selectedNode.count === 0;
    return (
      <div>
        { this.props.onAdd ? (<button onClick={this.props.onAdd}>add</button>) : ''}
        { isRemoveAvail ? (<button onClick={this.props.onRemove}>remove</button>) : ''}
        <Tree
          paddingLeft={20}
          tree={plainObject}
          renderNode={this.renderNode}
          onChange={this.props.onChange}
        />
      </div>
    );
  }
}
TagPage.propTypes = {
  initialLoadTags: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  tree: PropTypes.shape().isRequired,
  selectedNode: PropTypes.shape(),
  onAdd: PropTypes.func,
  onRemove: PropTypes.func,
  onChange: PropTypes.func.isRequired,
};
TagPage.defaultProps = {
  selectedNode: null,
  onAdd: null,
  onRemove: null,
};

const mapStateToProps = state => ({
  tree: state.tagHierarchyData.tagHierarchy || {},
  selectedNode: state.tagHierarchyData.selectedNode,
});

const mapDispatchToProps = dispatch => ({
  onClick: nodeName => dispatch(selectNodeInTagHierarchy(nodeName)),
  initialLoadTags: () => dispatch(initialLoadTags()),
  onAdd: () => dispatch(addTagHierarchyNode()),
  onRemove: () => dispatch(removeTagHierarchyNode()),
  onChange: tree => dispatch(saveTagHierarchy(tree)),
});

export default connect(mapStateToProps, mapDispatchToProps)(TagPage);
