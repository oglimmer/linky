
import nano from 'nano';
import winston from 'winston';

import properties from '../util/linkyproperties';

const dbProps = properties.server.db;
const url = `${dbProps.protocol}://${dbProps.host}:${dbProps.port}/${dbProps.name}`;

const config = {
  url,
  requestDefaults: {
    rejectUnauthorized: dbProps.rejectUnauthorized,
  },
};

winston.loggers.get('application').debug('DB config is %j', config);

const linkyDb = nano(config);

export default linkyDb;
