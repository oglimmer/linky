import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { DropTarget } from 'react-dnd';

const equalOrOnPathToRoot = (dragInProgress, parentNode) => {
  const listOfParents = [parentNode.hierarchyLevelName];
  let parentWalker = parentNode.parent;
  while (parentWalker) {
    listOfParents.push(parentWalker.hierarchyLevelName);
    parentWalker = parentWalker.parent;
  }
  return listOfParents.find(p => dragInProgress === p);
};

const legalDropTarget = (props) => {
  if (!props.dragInProgress) {
    return true;
  }
  const { next, prev, parentNode } = props.ele.dropTargetInfo;
  return !equalOrOnPathToRoot(props.dragInProgress, parentNode)
    && props.dragInProgress !== next
    && props.dragInProgress !== prev;
};

@connect(state => ({
  dragInProgress: state.tagHierarchyData.dragInProgress,
}), () => ({
}))
@DropTarget('link', {
  drop(props) {
    const { next, prev, parentNode } = props.ele.dropTargetInfo;
    return { next, prev, parentNode };
  },
  canDrop(props) {
    return legalDropTarget(props);
  },
}, (conn, monitor) => ({
  connectDropTarget: conn.dropTarget(),
  isOver: monitor.isOver(),
}))
export default class TreeDragableLink extends Component {
  static propTypes = {
    level: PropTypes.number.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    paddingLeft: PropTypes.number.isRequired,
    dragInProgress: PropTypes.string,
    isOver: PropTypes.bool.isRequired,
    // ele: PropTypes.shape().isRequired,
    // beginDrag: PropTypes.func.isRequired,
    // endDrag: PropTypes.func.isRequired,
  };
  static defaultProps = {
    dragInProgress: null,
  };

  calcStyle() {
    const style = {
      marginLeft: `${this.props.paddingLeft * this.props.level}px`,
      padding: '0px',
      height: '4px',
    };
    if (legalDropTarget(this.props)) {
      if (this.props.isOver) {
        style.border = '2px solid black';
        style.padding = '0px';
        style.height = '20px';
      } else if (this.props.dragInProgress) {
        style.border = '1px solid #AAAAAA';
        style.padding = '1px';
        style.height = '2px';
      }
    }
    return style;
  }

  render() {
    return this.props.connectDropTarget(<div style={this.calcStyle()} className="link" />);
  }
}
