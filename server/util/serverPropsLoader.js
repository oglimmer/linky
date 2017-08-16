
const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

let CONTACT = '';
if (fs.existsSync('/etc/linky-contact.txt')) {
  CONTACT = `${fs.readFileSync('/etc/linky-contact.txt')}`;
}

let commitHashRaw;
const commitHashFile = path.join(__dirname, '../../dist/static/COMMITHASH');
if (fs.existsSync(commitHashFile)) {
  commitHashRaw = `${fs.readFileSync(commitHashFile)}`;
} else {
  commitHashRaw = execSync('git rev-parse HEAD', { encoding: 'utf8' });
}
const COMMITHASH = commitHashRaw.trim().substring(0, 7);

let BRANCHNAME;
const branchFile = path.join(__dirname, '../../dist/static/BRANCH');
if (fs.existsSync(branchFile)) {
  BRANCHNAME = `${fs.readFileSync(branchFile)}`;
} else {
  BRANCHNAME = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
}

const BUILDDATE = new Date().toString();


/* eslint-disable no-param-reassign */

module.exports = (data) => {
  data.CONTACT = CONTACT;
  data.COMMITHASH = COMMITHASH;
  data.BRANCHNAME = BRANCHNAME;
  data.BUILDDATE = BUILDDATE;
};
