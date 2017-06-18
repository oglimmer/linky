
// https://react-bootstrap.github.io/components.html#forms

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import AddLinkInputBox from '../components/AddLinkInputBox';
import UILinkList from '../components/UILinkList';
import TagList from '../components/TagList';
import AlertAdapter from '../components/AlertAdapter';
import ToggleAddLinkMenuButton from '../components/ToggleAddLinkMenuButton';
import { selectTag } from '../redux/actions';

class PortalPage extends React.Component {
  componentWillMount() {
    this.props.dispatch(selectTag(this.props.match.params.tag));
  }

  shouldComponentUpdate(nextProps) {
    this.props.dispatch(selectTag(nextProps.match.params.tag));
    return false;
  }

  render() {
    return (
      <div>
        <ToggleAddLinkMenuButton />
        <AddLinkInputBox />
        <AlertAdapter />
        <TagList />
        <UILinkList />
      </div>
    );
  }
}
PortalPage.propTypes = {
  match: PropTypes.shape().isRequired,
  dispatch: PropTypes.func.isRequired,
};

export default connect()(PortalPage);
