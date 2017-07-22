
import React from 'react';
import PropTypes from 'prop-types';
import { Navbar, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import NavItem from './NavItem';
import LogoutButton from './LogoutButton';


const Header = ({ authToken }) => (
  <Navbar collapseOnSelect>
    <Navbar.Header>
      <Navbar.Brand>
        <Link to="/">Linky</Link>
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav>
        { authToken ? <NavItem to="/tags">Tags</NavItem> : '' }
        { authToken ? <NavItem to="/importExport">Import/Export</NavItem> : '' }
      </Nav>
      <Nav pullRight>
        <LogoutButton />
      </Nav>
    </Navbar.Collapse>
  </Navbar>
);
Header.propTypes = {
  authToken: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  authToken: state.auth.token,
});


export default connect(mapStateToProps)(Header);
