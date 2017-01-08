'use strict'

// https://react-bootstrap.github.io/components.html#forms

import React, { Component } from 'react';
import { PageHeader, FormGroup,ControlLabel, FormControl, HelpBlock, Button, Jumbotron, Alert } from 'react-bootstrap';
import fetch from '../utils/fetch';
import { withRouter } from 'react-router'

//withRouter
export default (class Login extends Component {

	constructor(props) {
		super(props);
		this.state = {
			email: '',
			password: '',
			errorMessage: '',
			submitAllowed: false
		};
		this.handleChange = this.handleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	getValidationState(ctrlName) {
		const length = this.state[ctrlName].length;
		return length > 0 ? null : 'error';
	}

	handleChange(ctrlName, e) {
		const value = e.target.value;
		this.setState((newState, props) => {
			newState[ctrlName] = value;
			newState.submitAllowed = newState.email.length > 0 && newState.password.length > 0;
			return newState;
		});
	}

	handleSubmit(event) {
		event.preventDefault();
		this.setState( { errorMessage: '' } );
		let responseCode;
		fetch.post('/rest/authenticate', {
				email: this.state.email,
				password: this.state.password
		}).then((response) => {
			responseCode = response.status;
			return response.json();
		}).then((json) => {
			if(responseCode===200) {
				this.props.onLoggedIn(json.token);
			} else {
				throw json.message;
			}
		}).catch((ex) => {
			this.setState( { errorMessage: ex } );
		});
	}

	render() {
		const { errorMessage, submitAllowed } = this.state;
		const submitStyle = submitAllowed ? "primary" : "default";
		return (
			<div>
				<Jumbotron>
					<h1>Linky</h1>
					<p>world's best link management system</p>
				</Jumbotron>
				<form>
					{ errorMessage &&
						<Alert bsStyle="danger">{errorMessage}</Alert>
					}
					<FormGroup
						controlId="email"
						validationState={this.getValidationState("email")}
					>
						<ControlLabel>Enter your registered email address</ControlLabel>
						<FormControl
							type="text"
							value={this.state.email}
							placeholder="email"
							onChange={(e)=>this.handleChange("email", e)}
							autoFocus="true"
						/>
						<FormControl.Feedback />
					</FormGroup>
					<FormGroup
						controlId="password"
						validationState={this.getValidationState("password")}
					>
						<ControlLabel>Enter password</ControlLabel>
						<FormControl
							type="password"
							value={this.state.password}
							placeholder="password"
							onChange={(e)=>this.handleChange("password", e)}
						/>
						<FormControl.Feedback />
					</FormGroup>
					<Button type="submit" bsStyle={submitStyle} onClick={this.handleSubmit} disabled={!submitAllowed}>
						Log in
					</Button>
				</form>
			</div>
		)
	}
});

