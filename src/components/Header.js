
const React = require('react');
const { Navbar, Nav } = require('react-bootstrap');

const LogoutButton = require('./LogoutButton');

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
        <LogoutButton />
      </Nav>
    </Navbar.Collapse>
  </Navbar>
);

module.exports = Header;
