
const properties = require('properties');
const fs = require('fs');
const path = require('path');

// MUST NOT USE WINSTON!!!

let linkyPropertiesDefined = true;
let fileName = process.env.LINKY_PROPERTIES;
if (!fileName) {
  fileName = path.resolve(__dirname, 'linky_default.properties');
  linkyPropertiesDefined = false;
}

console.log(`Using linky.properties from ${fileName}`);
const propertiesFromFile = fs.readFileSync(fileName, { encoding: 'utf8' });

module.exports = properties.parse(propertiesFromFile, {
  sections: true,
  namespaces: true,
});

module.exports.linkyPropertiesDefined = linkyPropertiesDefined;
