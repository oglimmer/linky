
const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const properties = require('./linkyproperties');

let CONTACT = '';
let fileName = process.env.LINKY_CONTACT;
if (!fileName) {
  fileName = path.resolve(__dirname, '/etc/linky-contact.txt');
}
if (fs.existsSync(fileName)) {
  CONTACT = fs.readFileSync(fileName, { encoding: 'utf8' });
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

const USERPASSLOGIN = properties.build.login.userpass;
const OAUTHLOGIN = properties.build.login.oauth;

/* eslint-disable no-param-reassign */

module.exports = (data) => {
  data.CONTACT = CONTACT;
  data.COMMITHASH = COMMITHASH;
  data.BRANCHNAME = BRANCHNAME;
  data.BUILDDATE = BUILDDATE;
  data.USERPASSLOGIN = USERPASSLOGIN;
  data.OAUTHLOGIN = OAUTHLOGIN;
};
