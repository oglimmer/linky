
import React from 'react';
import PropTypes from 'prop-types';
import { Navbar, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import LinkNavItem from './LinkNavItem';
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
        { authToken ? <LinkNavItem to="/tags">Tags</LinkNavItem> : '' }
        { authToken ? <LinkNavItem to="/importExport">Import/Export</LinkNavItem> : '' }
      </Nav>
      <Nav pullRight>
        <LinkNavItem to="/help">Help</LinkNavItem>
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
