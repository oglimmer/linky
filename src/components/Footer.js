
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router';

import BuildInfo from '../util/BuildInfo';

const Footer = ({ location }) => (
  <div className={location.pathname === '/tags' ? 'footer' : ''}>
    Copyright 2017-2018 by linky1.com - Build
    on {BuildInfo.BUILDDATE} from {BuildInfo.BRANCHNAME}{' '}
    at <a href={`https://github.com/oglimmer/linky/commit/${BuildInfo.COMMITHASH}`}>
      {BuildInfo.COMMITHASH}
    </a>
    {' '} | {' '}
    <Link to="/contact">Contact</Link>
    {' '} | {' '}
    <Link to="/help">Data privacy</Link>
  </div>
);
Footer.propTypes = {
  location: PropTypes.shape().isRequired,
};

export default withRouter(Footer);
