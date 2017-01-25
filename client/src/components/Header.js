
import React from 'react';
import { Navbar, Nav, NavItem } from 'react-bootstrap';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { clearAuthToken } from '../redux/actions';

const InternalHeader = ({ router, logout }) => (
  <Navbar collapseOnSelect>
    <Navbar.Header>
      <Navbar.Brand>
        <a href="#top">Linky</a>
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav>
        {localStorage.authToken &&
          <NavItem
            eventKey={1}
            onClick={() => { logout(router); }}
          >Log out</NavItem>
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
  </Navbar>
);
InternalHeader.propTypes = {
  logout: React.PropTypes.func.isRequired,
  router: React.PropTypes.shape().isRequired,
};

const mapDispatchToProps = dispatch => ({
  logout: (router) => {
    dispatch(clearAuthToken(router));
  },
});

const Header = connect(
  null,
  mapDispatchToProps
)(InternalHeader);

export default withRouter(Header);
