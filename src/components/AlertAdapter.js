
const React = require('react');
const { Alert } = require('react-bootstrap');
const { connect } = require('react-redux');

const { PropTypes } = React;

const AlertAdapter = ({ errorMessage }) => {
  if (!errorMessage) {
    return null;
  }
  return (<Alert bsStyle="danger">{errorMessage}</Alert>);
};

AlertAdapter.propTypes = {
  errorMessage: PropTypes.string,
};
AlertAdapter.defaultProps = {
  errorMessage: '',
};

const mapStateToProps = state => ({
  errorMessage: state.mainData.errorMessage,
});

module.exports = connect(mapStateToProps)(AlertAdapter);
