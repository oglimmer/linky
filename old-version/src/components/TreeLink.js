
import React from 'react';
import PropTypes from 'prop-types';

import TreeDragableLink from './TreeDragableLink';
import TreeDropzone from './TreeDropzone';

const TreeLink = ({ ele, level, renderNode, paddingLeft }) => {
  if (ele.dropTargetInfo) {
    return (<TreeDropzone
      ele={ele}
      level={level}
      paddingLeft={paddingLeft}
    />);
  }
  return (
    <TreeDragableLink
      ele={ele}
      level={level}
      renderNode={renderNode}
      paddingLeft={paddingLeft}
    >
      {ele.children.map(e => (
        <TreeLink
          key={e.hierarchyLevelName}
          ele={e}
          level={level + 1}
          renderNode={renderNode}
          paddingLeft={paddingLeft}
        />
      ))}
    </TreeDragableLink>
  );
};
TreeLink.propTypes = {
  ele: PropTypes.shape().isRequired,
  level: PropTypes.number.isRequired,
  renderNode: PropTypes.func.isRequired,
  paddingLeft: PropTypes.number.isRequired,
};

export default TreeLink;
