
import React from 'react';
import Tree from 'react-ui-tree';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { initialLoadTags } from '../redux/actions';

class TagPage extends React.Component {
  static renderNode(node) {
    return (
      <span>
        {node.module}
      </span>
    );
  }

  componentDidMount() {
    this.props.dispatch(initialLoadTags());
  }

  render() {
    const plainObject = JSON.parse(JSON.stringify(this.props.tree));
    return (
      <div>
        <Tree
          paddingLeft={20}
          tree={plainObject}
          renderNode={TagPage.renderNode}
        />
      </div>
    );
  }
}
TagPage.propTypes = {
  dispatch: PropTypes.func.isRequired,
  tree: PropTypes.shape().isRequired,
};

const mapStateToProps = state => ({
  tree: state.tagHierachyData.tagHierachy || {},
});

export default connect(mapStateToProps)(TagPage);
