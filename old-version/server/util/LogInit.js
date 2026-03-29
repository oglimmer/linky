
import winstonConf from 'winston-config';
import path from 'path';

import properties from './linkyproperties';

const logConfig = path.resolve(__dirname, properties.server.log.path);
console.log(`Using logConfig from ${logConfig}`);
winstonConf.fromFileSync(logConfig);
