'use strict'

// https://react-bootstrap.github.io/components.html#forms

import React, { Component } from 'react';
import { PageHeader, FormGroup,ControlLabel, FormControl, HelpBlock, Button, Jumbotron, Alert, ListGroup, ListGroupItem } from 'react-bootstrap';
import fetch from '../components/fetch';

import _ from 'lodash';

export default class PortalPage extends Component {

	constructor(props) {
		super(props);
		this.state = {
			linkUrl: '',
			submitAllowed: false,
			linkList: []
		};
		this.handleChange = this.handleChange.bind(this);
		this.handleAdd = this.handleAdd.bind(this);
		this.handleDelete = this.handleDelete.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);

		fetch.get('/rest/links', this.props.authToken).then((response) => {
			return response.json();
		}).then((json) => {
			this.setState({
				linkList: json
			});
		}).catch((ex) => {
			console.log(ex);
		});
	}

	handleChange(ctrlName, e) {
		const value = e.target.value;
		this.setState((newState, props) => {
			newState[ctrlName] = value;
			newState.submitAllowed = newState.linkUrl.length > 0;
			return newState;
		});
	}

	handleAdd(event) {
		event.preventDefault();
		let linkUrl = this.state.linkUrl;
		if(!linkUrl.startsWith("http")) {
			linkUrl = "http://" + linkUrl;
		}
		fetch.post('/rest/links', { linkUrl }, this.props.authToken).then((response) => {
			return response.json();
		}).then((json) => {
			this.setState((newState, props) => { return {
				linkUrl: '',
				submitAllowed: false,
				linkList: [...newState.linkList, { id: json.id, linkUrl } ]
			}});
		}).catch((ex) => {
			console.log(ex);
		});
	}

	handleDelete(event, elem) {
		event.preventDefault();
		fetch.delete('/rest/links/' + elem.id, this.props.authToken).then(() => {
			this.setState((newState, props) => {
				return {
					linkList: _.remove(newState.linkList, value => value.id !== elem.id)
				}
			});
		}).catch((ex) => {
			console.log(ex);
		});
	}

	handleSubmit(event) {
		event.preventDefault();
		return false;
	}

	render() {
		const { errorMessage, submitAllowed } = this.state;
		const submitStyle = submitAllowed ? "primary" : "default";
		const list = _.map(this.state.linkList, (elem, index) => {
			return (
				<ListGroupItem key={elem.id} href={elem.linkUrl}>{elem.linkUrl} <Button class="pull-right btn-xs" onClick={(e)=>this.handleDelete(e, elem)}>X</Button></ListGroupItem>
			)
		});
		return (
			<div>
				<form onSubmit={this.handleSubmit}>
					<FormGroup controlId="linkUrl">
						<ControlLabel>Add a new link</ControlLabel>
						<FormControl
							type="text"
							value={this.state.linkUrl}
							placeholder="url"
							onChange={(e)=>this.handleChange("linkUrl", e)}
							autoFocus="true"
							autoComplete="off"
						/>
						<FormControl.Feedback />
					</FormGroup>
					<Button type="submit" bsStyle={submitStyle} onClick={this.handleAdd} disabled={!submitAllowed}>
						Create link
					</Button>
					<hr />
					<ListGroup>
						{list}
					</ListGroup>
				</form>
			</div>
		)
	}
};

