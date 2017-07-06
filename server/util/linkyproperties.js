
import properties from 'properties';
import fs from 'fs';
import path from 'path';

// MUST NOT USE WINSTON!!!

let fileName = process.env.LINKY_PROPERTIES;
if (!fileName) {
  fileName = path.resolve(__dirname, 'linky_default.properties');
}

console.log(`Using linky.properties from ${fileName}`);
const propertiesFromFile = fs.readFileSync(fileName, { encoding: 'utf8' });

export default properties.parse(propertiesFromFile, {
  sections: true,
  namespaces: true,
});
