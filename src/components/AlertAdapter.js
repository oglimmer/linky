
import React from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'react-bootstrap';
import { connect } from 'react-redux';
import { setInfoMessage } from '../redux/actions/feedback';

const AlertAdapter = ({ errorMessage, infoMessage, tempMessage, close }) => {
  const CloseButton = () => (
    <span role="button" tabIndex={0} onClick={close}>[close]</span>
  );
  console.log(JSON.stringify(infoMessage));
  if (!errorMessage && !infoMessage && !tempMessage) {
    return null;
  }
  if (errorMessage) {
    return (<Alert bsStyle="danger">{errorMessage} <CloseButton /></Alert>);
  }
  if (tempMessage) {
    return (<Alert bsStyle="info">{tempMessage} <CloseButton /></Alert>);
  }
  return (<Alert bsStyle="success">{infoMessage} <CloseButton /></Alert>);
};
AlertAdapter.propTypes = {
  errorMessage: PropTypes.string,
  infoMessage: PropTypes.string,
  tempMessage: PropTypes.string,
  close: PropTypes.func.isRequired,
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
  close: () => dispatch(setInfoMessage('')),
});

export default connect(mapStateToProps, mapDispatchToProps)(AlertAdapter);
