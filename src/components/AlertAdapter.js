
import React from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'react-bootstrap';
import { connect } from 'react-redux';

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

export default connect(mapStateToProps)(AlertAdapter);
