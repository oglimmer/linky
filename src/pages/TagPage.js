
import React from 'react';
import Tree from 'react-ui-tree';

const renderNode = node => (
  <span>{node.module}</span>
);

const tree = {
  module: 'react-ui-tree',
  children: [{
    collapsed: true,
    module: 'dist',
    children: [{
      module: 'node.js',
    }],
  }],
};

const TagPage = () => (
  <div>
    <Tree
      paddingLeft={20}
      tree={tree}
      renderNode={renderNode}
    />
  </div>
);

export default TagPage;
