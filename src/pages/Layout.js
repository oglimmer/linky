
import React from 'react';

import Header from '../components/Header';
import Footer from '../components/Footer';

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
