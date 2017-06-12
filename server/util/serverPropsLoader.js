
const fs = require('fs');

let IMPRESSUM = '';
if (fs.existsSync('/etc/linky-impressum.txt')) {
  IMPRESSUM = `${fs.readFileSync('/etc/linky-impressum.txt')}`;
}

/* eslint-disable no-param-reassign */

module.exports = (data) => {
  data.IMPRESSUM = IMPRESSUM;
};
