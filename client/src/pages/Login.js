
// https://react-bootstrap.github.io/components.html#forms

import React, { PropTypes } from 'react';
import { withRouter } from 'react-router';
import { FormGroup, ControlLabel, FormControl, Button, Jumbotron, Alert } from 'react-bootstrap';
import { Form, Control } from 'react-redux-form';
import { connect } from 'react-redux';

import { checkAuth } from '../redux/actions';

const FormControlAdapter = props => (
  <FormControl
    type={props.type}
    value={props.value}
    onChange={props.onChange}
    autoFocus={props.autoFocus}
    placeholder={props.placeholder}
  />
);
FormControlAdapter.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  autoFocus: PropTypes.string,
  placeholder: PropTypes.string.isRequired,
};

const FormGroupAdapter = ({ label, model, placeholder, autoFocus }) => (
  <FormGroup
    controlId="email"
  >
    <ControlLabel>{label}</ControlLabel>
    <Control.text
      model={`.${model}`}
      component={FormControlAdapter}
      autoFocus={autoFocus}
      placeholder={placeholder}
    />
    <FormControl.Feedback />
  </FormGroup>
);
FormGroupAdapter.propTypes = {
  label: PropTypes.string.isRequired,
  model: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  autoFocus: PropTypes.string,
};

let AlertAdapter = ({ errorMessage }) => {
  if (!errorMessage) {
    return null;
  }
  return (<Alert bsStyle="danger">{errorMessage}</Alert>);
};
AlertAdapter.propTypes = {
  errorMessage: React.PropTypes.string,
};
const mapStateToProps = state => ({
  errorMessage: state.mainData.errorMessage,
});
AlertAdapter = connect(mapStateToProps)(AlertAdapter);

let Login = ({ dispatch, router }) => (
  <div>
    <Jumbotron>
      <h1>Linky</h1>
      <p>world&#39;s best link management system</p>
    </Jumbotron>
    <AlertAdapter />
    <Form
      model="login"
      onSubmit={formData => dispatch(checkAuth(formData.email, formData.password, router))}
    >
      <FormGroupAdapter
        label="Enter your registered email address"
        model="email" placeholder="email" autoFocus="true"
      />
      <FormGroupAdapter label="Enter password" model="password" placeholder="password" />
      <Button type="submit">Log in</Button>
    </Form>
  </div>
);
Login.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  router: React.PropTypes.shape().isRequired,
};
Login = connect()(Login);

export default withRouter(Login);
