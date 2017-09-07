import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { DragSource } from 'react-dnd';
import { beginDrag, endDragAndPersist } from '../redux/actions/tagHierarchy';

import treeState from './TreeState';

@connect(null, dispatch => ({
  beginDrag: tag => dispatch(beginDrag(tag)),
  endDrag: target => dispatch(endDragAndPersist(target)),
}))
@DragSource('link', {
  beginDrag(props) {
    treeState.clear();
    props.beginDrag(props.ele.hierarchyLevelName);
    return { id: props.ele.hierarchyLevelName };
  },
  endDrag(props, monitor) {
    let dropResult;
    if (monitor.didDrop()) {
      dropResult = monitor.getDropResult();
    }
    props.endDrag(dropResult);
  },
}, (conn, monitor) => ({
  connectDragSource: conn.dragSource(),
  dragPreview: conn.dragPreview(),
  isDragging: monitor.isDragging(),
}))
export default class TreeDragableLink extends Component {
  static propTypes = {
    ele: PropTypes.shape().isRequired,
    level: PropTypes.number.isRequired,
    renderNode: PropTypes.func.isRequired,
    connectDragSource: PropTypes.func.isRequired,
    dragPreview: PropTypes.func.isRequired,
    paddingLeft: PropTypes.number.isRequired,
    isDragging: PropTypes.bool.isRequired,
    // beginDrag: PropTypes.func.isRequired,
    // endDrag: PropTypes.func.isRequired,
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
  };

  calcStyle() {
    return {
      marginLeft: `${this.props.paddingLeft * this.props.level}px`,
      padding: '0px',
      opacity: this.props.isDragging ? '0' : '1',
    };
  }

  render() {
    return this.props.dragPreview(
      <div className="larger">
        <div style={this.calcStyle()} className="link">
          { this.props.connectDragSource(<i className="dragHandle ion-ios-keypad" />) }
          {' '}
          { this.props.renderNode(this.props.ele) }
        </div>
        { this.props.children }
      </div>,
    );
  }
}
