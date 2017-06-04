
import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';

import LogoutButton from './LogoutButton';
import ToggleAddLinkMenuButton from './ToggleAddLinkMenuButton';

const Header = () => (
  <Navbar collapseOnSelect>
    <Navbar.Header>
      <Navbar.Brand>
        <a href="#top">Linky</a>
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav>
        <ToggleAddLinkMenuButton />
      </Nav>
      <Nav pullRight>
        <LogoutButton />
      </Nav>
    </Navbar.Collapse>
  </Navbar>
);

export default Header;
