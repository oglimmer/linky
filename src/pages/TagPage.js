
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Immutable from 'immutable';

import { initialLoadTags, selectNodeInTagHierarchy, addTagHierarchyNode, removeTagHierarchyNode,
  renameTagHierarchyNode } from '../redux/actions/tagHierarchy';

import Tree from '../components/Tree';

import { toHierarchy, CachedTagHierarchy } from '../util/Hierarchy';

import { TAGS, READONLY_TAGS } from '../util/TagRegistry';

@connect(state => ({
  tree: state.tagHierarchyData.tagHierarchy || Immutable.List(),
  selectedNode: state.tagHierarchyData.selectedNode,
}), dispatch => ({
  onClick: nodeName => dispatch(selectNodeInTagHierarchy(nodeName)),
  initialLoadTags: () => dispatch(initialLoadTags()),
  onAdd: () => dispatch(addTagHierarchyNode()),
  onRemove: () => dispatch(removeTagHierarchyNode()),
  onRename: nodeName => dispatch(renameTagHierarchyNode(nodeName)),
}))
export default class TagPage extends React.Component {
  static propTypes = {
    initialLoadTags: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    tree: ImmutablePropTypes.listOf(PropTypes.shape()).isRequired,
    selectedNode: PropTypes.shape(),
    onAdd: PropTypes.func,
    onRemove: PropTypes.func,
    onRename: PropTypes.func,
  };
  static defaultProps = {
    selectedNode: null,
    onAdd: null,
    onRemove: null,
    onRename: null,
  };

  constructor(props) {
    super(props);
    this.renderNode = this.renderNode.bind(this);
  }

  componentDidMount() {
    this.props.initialLoadTags();
  }

  renderNode(node) {
    const fallbackColor = node.count === 0 ? 'green' : '';
    const color = TAGS.find(e => node.hierarchyLevelName === e) ? 'red' : fallbackColor;
    const style = {
      color,
      backgroundColor: this.props.selectedNode && this.props.selectedNode.hierarchyLevelName === node.hierarchyLevelName ? '#bbbbbb' : '',
    };
    return (
      <span
        role="button"
        tabIndex={0}
        style={style}
        onClick={() => this.props.onClick(node)}
      >
        {node.hierarchyLevelName} ({node.count})
      </span>
    );
  }

  render() {
    const cachedTagHierarchy = new CachedTagHierarchy(this.props.tree);
    const tree = toHierarchy(this.props.tree);
    const isRemoveAvail = this.props.selectedNode
      && cachedTagHierarchy.getChildren(this.props.selectedNode.hierarchyLevelName).size === 0
      && READONLY_TAGS.findIndex(e => e === this.props.selectedNode.hierarchyLevelName) === -1;
    const isRenameAvail = this.props.selectedNode
      && TAGS.findIndex(e => e === this.props.selectedNode.hierarchyLevelName) === -1;
    return (
      <div>
        { this.props.onAdd ? (<button onClick={this.props.onAdd}>Add hierarchy level</button>) : ''}
        { isRemoveAvail ? (<button onClick={this.props.onRemove}>Remove selected level</button>) : ''}
        { isRenameAvail ? (<button onClick={() => this.props.onRename(this.props.selectedNode.hierarchyLevelName)}>Rename selected level</button>) : ''}
        <Tree
          paddingLeft={20}
          tree={tree}
          renderNode={this.renderNode}
        />
      </div>
    );
  }
}
