
import React from 'react';
import { Link } from 'react-router-dom';

import BuildInfo from '../util/BuildInfo';

export default () => (
  <div>
    Copyright 2017 by linky1.com - Build
    on {BuildInfo.BUILDDATE} from {BuildInfo.BRANCHNAME}{' '}
    at <a href={`https://github.com/oglimmer/linky/commit/${BuildInfo.COMMITHASH}`}>
      {BuildInfo.COMMITHASH}
    </a>
    {' '} | {' '}
    <Link to="/contact">Contact</Link>
  </div>
);
