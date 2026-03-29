import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import MultiBackend from 'react-dnd-multi-backend';
import HTML5toTouch from 'react-dnd-multi-backend/lib/HTML5toTouch'; // or any other pipeline
import { DragDropContext } from 'react-dnd';
import withScrolling from 'react-dnd-scrollzone';

import TreeLink from './TreeLink';

const s = {
  width: '500px',
  overflow: 'auto',
  position: 'fixed',
  marginLeft: 'auto',
  marginRight: 'auto',
  top: '120px',
  bottom: '50px',
};

const ScrollableDiv = withScrolling('div');

@DragDropContext(MultiBackend(HTML5toTouch))
@connect(state => ({
  dragInProgress: state.tagHierarchyData.dragInProgress,
}))
export default class Tree extends Component {
  static propTypes = {
    tree: PropTypes.shape().isRequired,
    renderNode: PropTypes.func.isRequired,
    paddingLeft: PropTypes.number.isRequired,
  };

  static AddDropZonesTo(parent, children, tree) {
    children.forEach((child) => {
      Object.assign(child, { parent });
      Tree.AddDropZonesTo(child, child.children, tree);
    });
    for (let i = children.length; i >= 0; i -= 1) {
      const prev = children[i - 1];
      const next = children[i];
      children.splice(i, 0, {
        hierarchyLevelName: `${parent.hierarchyLevelName}-${i}`,
        children: [],
        dropTargetInfo: {
          parentNode: parent,
          prev: prev && prev.hierarchyLevelName,
          next: next && next.hierarchyLevelName,
          tree,
        },
      });
    }
  }

  getDropZoneEnhanced() {
    const root = JSON.parse(JSON.stringify(this.props.tree));
    Tree.AddDropZonesTo(root, root.children, this.props.tree);
    return root;
  }

  render() {
    const tree = this.getDropZoneEnhanced();
    return (
      <ScrollableDiv style={s}>
        { tree.children.map(e => (
          <TreeLink
            key={e.hierarchyLevelName}
            ele={e}
            level={0}
            renderNode={this.props.renderNode}
            paddingLeft={this.props.paddingLeft}
          />
        ))}
      </ScrollableDiv>
    );
  }
}
