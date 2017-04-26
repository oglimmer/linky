
import assert from 'assert';

import properties from '../util/linkyproperties';
import oauth1a from '../auth/oauth1a';
import oauth2 from '../auth/oauth2';


const init = (req, res) => {
  const type = req.params.type;
  if (properties.server.auth[type].oauth === 1) {
    oauth1a.init(req, res);
  } else if (properties.server.auth[type].oauth === 2) {
    oauth2.init(req, res);
  } else {
    assert(false);
  }
};

const back = (req, res) => {
  const type = req.params.type;
  if (properties.server.auth[type].oauth === 1) {
    oauth1a.back(req, res);
  } else if (properties.server.auth[type].oauth === 2) {
    oauth2.back(req, res);
  } else {
    assert(false);
  }
};

export default (app) => {
  app.get('/auth/:type', init);
  app.get('/authback/:type', back);
};
