
import React from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'react-bootstrap';
import { connect } from 'react-redux';
import { setInfoMessage } from '../redux/actions/feedback';

const AlertAdapter = ({ errorMessage, infoMessage, tempMessage, hide }) => {
  if (!errorMessage && !infoMessage && !tempMessage) {
    return null;
  }
  if (errorMessage) {
    return (<Alert bsStyle="danger">{errorMessage}</Alert>);
  }
  if (tempMessage) {
    return (<Alert bsStyle="info">{tempMessage}</Alert>);
  }
  setTimeout(() => {
    hide();
  }, 3800);
  return (<Alert bsStyle="success">{infoMessage}</Alert>);
};

AlertAdapter.propTypes = {
  errorMessage: PropTypes.string,
  infoMessage: PropTypes.string,
  tempMessage: PropTypes.string,
  hide: PropTypes.func.isRequired,
};
AlertAdapter.defaultProps = {
  errorMessage: '',
  infoMessage: '',
  tempMessage: '',
};

const mapStateToProps = state => ({
  errorMessage: state.feedbackData.errorMessage,
  infoMessage: state.feedbackData.infoMessage,
  tempMessage: state.feedbackData.tempMessage,
});

const mapDispatchToProps = dispatch => ({
  hide: () => {
    dispatch(setInfoMessage(''));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(AlertAdapter);
