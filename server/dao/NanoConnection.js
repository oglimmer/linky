
import nano from 'nano';
import winston from 'winston';

import properties from '../util/linkyproperties';

const dbProps = properties.server.db;
export const couchdbServer = `${dbProps.protocol}://${dbProps.host}:${dbProps.port}`;
const url = `${couchdbServer}/${dbProps.name}`;
const urlArchive = `${couchdbServer}/${dbProps.archiveName}`;

const config = {
  url,
  requestDefaults: {
    rejectUnauthorized: dbProps.rejectUnauthorized,
    headers: {
    },
  },
};

const username = dbProps.user;
if (username) {
  const password = dbProps.password;
  const auth = `Basic ${new Buffer(`${username}:${password}`).toString('base64')}`;
  config.requestDefaults.headers.Authorization = auth;
}

winston.loggers.get('application').debug('DB config is %j', config);

export default nano(config);

export const archiveDb = nano(Object.assign({}, config, {
  url: urlArchive,
}));
