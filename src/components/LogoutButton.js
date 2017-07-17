
import React from 'react';
import PropTypes from 'prop-types';
import { NavItem } from 'react-bootstrap';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { logout, reset } from '../redux/actions';

const LogoutButton = ({ dispatch, history, authToken }) => {
  if (!authToken) {
    return null;
  }
  return (
    <NavItem
      eventKey={1}
      onClick={() => {
        dispatch(logout()).then(() => { history.replace('/'); dispatch(reset()); });
      }}
    >Log out</NavItem>
  );
};

LogoutButton.propTypes = {
  dispatch: PropTypes.func.isRequired,
  history: PropTypes.shape().isRequired,
  authToken: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  authToken: state.auth.token,
});

export default withRouter(connect(mapStateToProps)(LogoutButton));
