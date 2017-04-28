
// https://react-bootstrap.github.io/components.html#forms

import React from 'react';
import { Button } from 'react-bootstrap';

const click = (target) => {
  document.location.href = `/auth/${target}`;
};

const Login = () => (
  <div className="row">
    <div className="center-form panel">
      <div className="panel-body">
        <h2 className="text-center">Log in</h2>
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
      </div>
    </div>
  </div>
);

export default Login;
