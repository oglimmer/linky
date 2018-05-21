
// https://react-bootstrap.github.io/components.html#forms

import React from 'react';
import PropTypes from 'prop-types';
import { Button, FormGroup, ControlLabel } from 'react-bootstrap';

import { withRouter } from 'react-router';
import { Form, Control } from 'react-redux-form';
import { connect } from 'react-redux';

import { checkAuth } from '../redux/actions';
import BuildInfo from '../util/BuildInfo';

import FormControlAdapter from '../components/FormControlAdapter';

const click = (target) => {
  document.location.href = `/auth/${target}`;
};

const loginDemo = async (dispatch, history) => {
  try {
    await dispatch(checkAuth('demo@linky1.com', 'demo'));
    history.replace('/links/portal');
  } catch (err) {
    // ignore
  }
};

/* eslint-disable eqeqeq */

const Login = ({ dispatch, history }) => (
  <div>
    <div className="jumbotron">
      <p>modern bookmark management - fully searchable, tags with hierarchy,
        build-in RSS support, auto validation over time, due dates, html snapshots</p>
    </div>
    <div className="row">
      <div className="panel">
        <div className="panel-body">
          A word about data privacy: This page tries to collect minimal personal information.
          You can see all the data we got and stored from the 3rd party login service
          when you click on `Help` and then click the `I am curious` button. There you can also
          delete your account. After log in we will set 2 cookies on your computer. One has a
          lifetime of 1 year. With clicking any of the below buttons you accept those cookies.
          More information on this in the help section.
        </div>
      </div>
    </div>
    <div className="row">
      { BuildInfo.OAUTHLOGIN.toString() === 'true' ?
        <div className="center-form panel">
          <div className="panel-body">
            <h2 className="text-center">Log in</h2>
            <Button className="btn btn-block" onClick={() => loginDemo(dispatch, history)}>
              <i className="ion-ios-pricetag" /> Demo account
            </Button>
            <Button className="btn btn-block btn-facebook" onClick={() => click('facebook')}>
              <i className="ion-logo-facebook" /> Sign in with Facebook
            </Button>
            <Button className="btn btn-block btn-google-plus" onClick={() => click('google')}>
              <i className="ion-logo-googleplus" /> Sign in with Google
            </Button>
            <Button className="btn btn-block btn-github" onClick={() => click('github')}>
              <i className="ion-logo-github" /> Sign in with GitHub
            </Button>
            <button className="btn btn-block btn-linkedin" onClick={() => click('linkedin')}>
              <i className="ion-logo-linkedin" /> Sign in with LinkedIn
            </button>
            <button className="btn btn-block btn-twitter" onClick={() => click('twitter')}>
              <i className="ion-logo-twitter" /> Sign in with Twitter
            </button>
            <button className="btn btn-block btn-bitbucket" onClick={() => click('bitbucket')}>
              <i className="fa fa-bitbucket" /> Sign in with Bitbucket
            </button>
            <button className="btn btn-block btn-live" onClick={() => click('windowslive')}>
              <i className="ion-logo-windows" /> Sign in with Windows Live
            </button>
            <button className="btn btn-block btn-blizzard" onClick={() => click('blizzard-eu')}>
              <i className="ion-ios-game-controller-a" /> Sign in with EU Battle.net
            </button>
            <button className="btn btn-block btn-yahoo" onClick={() => click('yahoo')}>
              <i className="ion-logo-yahoo" /> Sign in with Yahoo
            </button>
            <button className="btn btn-block btn-reddit" onClick={() => click('reddit')}>
              <i className="ion-logo-reddit" /> Sign in with Reddit
            </button>
          </div>
        </div> : ''
      }
      { BuildInfo.USERPASSLOGIN.toString() === 'true' ?
        <div className="center-form panel">
          <div className="panel-body">
            <Form
              model="login"
              onSubmit={async (formData) => {
                try {
                  await dispatch(checkAuth(formData.email, formData.password));
                  history.replace('/links/portal');
                } catch (err) {
                  // ignore
                }
              }}
            >
              <FormGroup controlId="loginEmail">
                <ControlLabel>Enter your registered email address</ControlLabel>
                <Control
                  type="text"
                  componentClass="input"
                  model=".email"
                  placeholder="email"
                  autoFocus="true"
                  component={FormControlAdapter}
                />
              </FormGroup>
              <FormGroup controlId="loginPassword">
                <ControlLabel>Enter password</ControlLabel>
                <Control
                  type="password"
                  componentClass="input"
                  model=".password"
                  placeholder="password"
                  component={FormControlAdapter}
                />
              </FormGroup>
              <FormGroup controlId="loginSubmit">
                <Button type="submit">Log in</Button>
              </FormGroup>
            </Form>
            <p>
              Create user:
              curl -X POST --data &apos;{'{'}&quot;email&quot;: &quot;your email&quot;,&quot;password&quot;: &quot;your password&quot; {'}'}&apos;
              -H &quot;Content-Type: application/json&quot; $LINKY_HOST/rest/users
            </p>
          </div>
        </div> : ''
      }
    </div>
  </div>
);
Login.propTypes = {
  dispatch: PropTypes.func.isRequired,
  history: PropTypes.shape().isRequired,
};

export default withRouter(connect()(Login));
