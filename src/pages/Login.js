
// https://react-bootstrap.github.io/components.html#forms

import React, { PropTypes } from 'react';
import { withRouter } from 'react-router';
import { Button, Jumbotron } from 'react-bootstrap';
import { Form } from 'react-redux-form';
import { connect } from 'react-redux';

import { checkAuth } from '../redux/actions';

import AlertAdapter from '../components/AlertAdapter';
import FormGroupAdapter from '../components/FormGroupAdapter';

const Login = ({ dispatch, router }) => (
  <div>
    <Jumbotron>
      <h1>Linky</h1>
      <p>world&#39;s best link management system</p>
    </Jumbotron>
    <AlertAdapter />
    <Form
      model="login"
      onSubmit={(formData) => {
        dispatch(checkAuth(formData.email, formData.password)).then(() => {
          router.replace('/portalPage');
        });
      }}
    >
      <FormGroupAdapter
        label="Enter your registered email address"
        model="email" placeholder="email" autoFocus="true"
      />
      <FormGroupAdapter
        label="Enter password"
        type="password" model="password" placeholder="password"
      />
      <Button type="submit">Log in</Button>
    </Form>
  </div>
);
Login.propTypes = {
  dispatch: PropTypes.func.isRequired,
  router: PropTypes.shape().isRequired,
};

export default withRouter(connect()(Login));
