
// https://react-bootstrap.github.io/components.html#forms

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import AddLinkInputBox from '../components/AddLinkInputBox';
import UILinkList from '../components/UILinkList';
import TagList from '../components/TagList';
import ToggleAddLinkMenuButton from '../components/ToggleAddLinkMenuButton';
import { completeChangeTag } from '../redux/actions/links';

class PortalPage extends React.Component {
  componentDidMount() {
    this.props.dispatch(completeChangeTag(this.props.match.params.tag));
  }

  render() {
    return (
      <div>
        <ToggleAddLinkMenuButton />
        <AddLinkInputBox />
        { !this.props.searchResult ? <TagList /> : <hr /> }
        <UILinkList />
      </div>
    );
  }
}
PortalPage.propTypes = {
  match: PropTypes.shape().isRequired,
  dispatch: PropTypes.func.isRequired,
  searchResult: PropTypes.bool.isRequired,
};
PortalPage.defaultProps = {
  searchResult: false,
};

const mapStateToProps = state => ({
  searchResult: state.menuBar.searchResult,
});

export default connect(mapStateToProps)(PortalPage);
