'use strict'

import React, { Component } from 'react';
import { Router, IndexRoute, Route, hashHistory } from 'react-router';
import Layout from '../components/Layout';
import Login from '../pages/Login';
import PortalPage from '../pages/PortalPage';

export default class RootElement extends Component {

	constructor(props) {
		super(props);
		this.state = {
			authToken: localStorage.authToken
		}
		this.handleLoggedin = this.handleLoggedin.bind(this);
		this.handleLogout = this.handleLogout.bind(this);
	}

	handleLoggedin(authToken) {
		this.setState({
			authToken
		});
		localStorage.authToken = authToken;
	}

	handleLogout() {
		this.setState({
			authToken: null
		});
		localStorage.removeItem("authToken");
	}

  render() {
    return (
      <div>
	      <Layout logout={this.handleLogout} isLoggedIn={this.state.authToken}>
	      	{this.state.authToken ?
	      		<PortalPage authToken={this.state.authToken} /> : <Login onLoggedIn={this.handleLoggedin} />
	      	}
	      </Layout>
	    </div>
		)
  }
};
