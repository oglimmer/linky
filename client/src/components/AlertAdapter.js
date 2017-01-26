
import React, { PropTypes } from 'react';
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

const mapStateToProps = state => ({
  errorMessage: state.mainData.errorMessage,
});

export default connect(mapStateToProps)(AlertAdapter);
