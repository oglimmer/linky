
import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import { actions } from 'react-redux-form';

import { toggleVisibilityMenuBar } from '../redux/actions';

const ToggleAddLinkMenuButton = ({ onClick, isAddEnabled, authToken, selectedTag }) => {
  if (!authToken || isAddEnabled) {
    return null;
  }
  return (
    <Button onClick={() => onClick(selectedTag)}>Add Link</Button>
  );
};

ToggleAddLinkMenuButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  authToken: PropTypes.string.isRequired,
  isAddEnabled: PropTypes.bool.isRequired,
  selectedTag: PropTypes.string,
};
ToggleAddLinkMenuButton.defaultProps = {
  selectedTag: null,
};

const mapStateToProps = state => ({
  authToken: state.auth.token,
  isAddEnabled: state.menuBar.addEnabled,
  selectedTag: state.mainData.selectedTag,
});

const mapDispatchToProps = dispatch => ({
  onClick: (selectedTag) => {
    dispatch(toggleVisibilityMenuBar());
    dispatch(actions.change('addUrl.tags', selectedTag));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ToggleAddLinkMenuButton);
