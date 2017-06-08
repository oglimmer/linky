
import nano from 'nano';

import properties from '../util/linkyproperties';

const dbProps = properties.server.db;
const url = `${dbProps.protocol}://${dbProps.host}:${dbProps.port}/${dbProps.name}`;

const linkyDb = nano({
  url,
  requestDefaults: {
    rejectUnauthorized: dbProps.rejectUnauthorized,
  },
});

export default linkyDb;
