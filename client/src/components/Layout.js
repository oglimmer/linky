
import React from 'react';

import Header from './Header';
import Footer from './Footer';

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

export default Layout;
