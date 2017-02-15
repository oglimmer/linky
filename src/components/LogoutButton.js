
const React = require('react');
const { NavItem } = require('react-bootstrap');
const { connect } = require('react-redux');
const { withRouter } = require('react-router');

const { logout } = require('../redux/actions');

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

module.exports = withRouter(connect(mapStateToProps)(LogoutButton));
