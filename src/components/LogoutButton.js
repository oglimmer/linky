
import React from 'react';
import { NavItem } from 'react-bootstrap';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { logout } from '../redux/actions';

const LogoutButton = ({ dispatch, router, authToken }) => {
  if (!authToken) {
    return null;
  }
  return (
    <NavItem
      eventKey={1}
      onClick={() => {
        dispatch(logout()).then(() => { router.replace('/'); });
      }}
    >Log out</NavItem>
  );
};

LogoutButton.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  router: React.PropTypes.shape().isRequired,
  authToken: React.PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  authToken: state.auth.token,
});

export default withRouter(connect(mapStateToProps)(LogoutButton));
