
import React from 'react';

import BuildInfo from '../util/BuildInfo';

export default () => (
  <div>
    Copyright 2017 by oglimmer.de - Build
    on {BuildInfo.BUILDDATE} from {BuildInfo.BRANCHNAME}{' '}
    at <a href={`https://github.com/oglimmer/linky/commit/${BuildInfo.COMMITHASH}`}>
      {BuildInfo.COMMITHASH}
    </a>
  </div>
);
