
import React, { Component } from 'react';
import { Router, IndexRoute, Route, hashHistory } from 'react-router';
import Layout from './Layout';
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
		this.checkUserLoggedIn = this.checkUserLoggedIn.bind(this);
		this.redirectNotLoggedInUser = this.redirectNotLoggedInUser.bind(this);
	}

	handleLoggedin(authToken, router) {
		this.setState({
			authToken
		});
		localStorage.authToken = authToken;
		router.replace("/");
	}

	handleLogout(router) {
		this.setState({
			authToken: null
		});
		localStorage.removeItem("authToken");
		router.replace("/");
	}

	checkUserLoggedIn(nextState, replace) {
		if(!this.state.authToken) {
			replace('/');
		}
	}

	redirectNotLoggedInUser(nextState, replace) {
		if(this.state.authToken) {
			replace('/portalPage');
		}
	}

	render() {
		return (
			<Router key={Math.random()} history={hashHistory}>
				<Route
					path="/"
					component={(props)=>(
						<Layout logout={this.handleLogout} isLoggedIn={this.state.authToken}>
							{props.children}
						</Layout>
					)}
				>
					<IndexRoute
						component={()=>(<Login onLoggedIn={this.handleLoggedin}/>)}
						onEnter={this.redirectNotLoggedInUser}
					/>
					<Route
						path="portalPage"
						component={()=>(<PortalPage authToken={this.state.authToken}/>)}
						onEnter={this.checkUserLoggedIn}
					/>
				</Route>
			</Router>
		)
	}
};
