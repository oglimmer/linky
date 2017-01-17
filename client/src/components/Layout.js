
import React from 'react';

import Header from './Header';
import Footer from './Footer';


const Layout = props => (
  <div>
    <Header logout={props.logout} isLoggedIn={props.isLoggedIn} />
    <div className="container">
      {props.children}
      <Footer />
    </div>
  </div>
);
Layout.propTypes = {
  logout: React.PropTypes.func.isRequired,
  isLoggedIn: React.PropTypes.string,
  children: React.PropTypes.element.isRequired,
};
Layout.defaultProps = {
  isLoggedIn: '',
};

export default Layout;
