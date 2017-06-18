
import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { connect } from 'react-redux';

import { toggleVisibilityMenuBar } from '../redux/actions';

const ToggleAddLinkMenuButton = ({ onClick, isAddEnabled, authToken }) => {
  if (!authToken) {
    return null;
  }
  return (
    <Button onClick={onClick}>{isAddEnabled ? 'Hide `Add Link`' : 'Add Link'}</Button>
  );
};

ToggleAddLinkMenuButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  authToken: PropTypes.string.isRequired,
  isAddEnabled: PropTypes.bool.isRequired,
};

const mapStateToProps = state => ({
  authToken: state.auth.token,
  isAddEnabled: state.menuBar.addEnabled,
});

const mapDispatchToProps = dispatch => ({
  onClick: () => dispatch(toggleVisibilityMenuBar()),
});

export default connect(mapStateToProps, mapDispatchToProps)(ToggleAddLinkMenuButton);
