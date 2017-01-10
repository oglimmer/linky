
import React, { Component } from 'react';
import { Navbar, Nav, NavItem } from 'react-bootstrap';
import { withRouter } from 'react-router'

export default withRouter(class Header extends Component {

	render() {
		return (
			<Navbar collapseOnSelect>
			<Navbar.Header>
				<Navbar.Brand>
					<a href="#">Linky</a>
				</Navbar.Brand>
				<Navbar.Toggle />
			</Navbar.Header>
			{
			<Navbar.Collapse>
				<Nav>
					{this.props.isLoggedIn &&
						<NavItem eventKey={1} onClick={()=>{this.props.logout(this.props.router)}}>Log out</NavItem>
					}
					{/*
					<NavItem eventKey={2} href="#">Link</NavItem>
					<NavDropdown eventKey={3} title="Dropdown" id="basic-nav-dropdown">
						<MenuItem eventKey={3.1}>Action</MenuItem>
						<MenuItem eventKey={3.2}>Another action</MenuItem>
						<MenuItem eventKey={3.3}>Something else here</MenuItem>
						<MenuItem divider />
						<MenuItem eventKey={3.3}>Separated link</MenuItem>
					</NavDropdown>
				  */}
				</Nav>
			</Navbar.Collapse>
			}
			</Navbar>
	);
	}
});
