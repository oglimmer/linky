
import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import NavItem from './NavItem';
import LogoutButton from './LogoutButton';

const Header = () => (
  <Navbar collapseOnSelect>
    <Navbar.Header>
      <Navbar.Brand>
        <Link to="/">Linky</Link>
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav>
        <NavItem to="/tags">Tags</NavItem>
      </Nav>
      <Nav pullRight>
        <LogoutButton />
      </Nav>
    </Navbar.Collapse>
  </Navbar>
);

export default Header;
