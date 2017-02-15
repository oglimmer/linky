
const React = require('react');

const Header = require('../components/Header');
const Footer = require('../components/Footer');

const Layout = props => (
  <div>
    <Header />
    <div className="container">
      {props.children}
      <Footer />
    </div>
  </div>
);

Layout.propTypes = {
  children: React.PropTypes.element.isRequired,
};

module.exports = Layout;
