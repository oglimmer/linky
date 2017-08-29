#!/usr/bin/env node

// node -r babel-register -r babel-polyfill server/admin-cli.js

import { Promise } from 'bluebird';
import moment from 'moment';

import userDao from './dao/userDao';
import linkyDb from './dao/NanoConnection';

const view = Promise.promisify(linkyDb.view);
const destroy = Promise.promisify(linkyDb.destroy);

/* eslint-disable no-underscore-dangle */

const deleteUserById = async (id, rev) => {
  await userDao.deleteCascade(id, rev);
  console.log('delete completed.');
};

const listSummaryUserById = async (id, user) => {
  const [feedUpdates, links] = await Promise.all([
    view('feedUpdates', 'byUserId', { key: id }),
    view('links', 'byUserid', { key: id }),
  ]);
  const totalUpdates = feedUpdates.rows.length;
  const totalLinks = links.rows.length;
  console.log(`${user}, ${totalLinks}, ${totalUpdates}`);
};

const summary = async () => {
  console.log('USER, TOTAL_LINKS, TOTAL_UPDATES');
  const sourceUsers = await view('debug', 'allUsers');
  sourceUsers.rows.forEach((row) => {
    listSummaryUserById(row.id, `${row.id}:${row.key} (${row.value})`);
  });
  const emailUsers = await view('users', 'byEmail');
  emailUsers.rows.forEach((row) => {
    listSummaryUserById(row.id, `${row.id}:${row.value.email} (EMAIL)`);
  });
};

const listuserbyid = async (param) => {
  const [rec, feedUpdates, links] = await Promise.all([
    userDao.getById(param),
    view('feedUpdates', 'byUserId', { key: param }),
    view('links', 'byUserid', { key: param }),
  ]);
  console.log(rec);
  feedUpdates.rows.map(r => r.value).forEach((rowFU) => {
    console.log(`feedUpdate \`${rowFU.data[0]}\``);
  });
  links.rows.map(r => r.value).forEach((rowL) => {
    console.log(`link \`${rowL.linkUrl}\`, callCounter:${rowL.callCounter}`);
  });
};

const deleteuserbyid = async (id) => {
  try {
    const rec = await userDao.getById(id);
    console.log(`Delete user = ${id}`);
    deleteUserById(rec._id, rec._rev);
  } catch (err) {
    console.log(`User id not found = ${id}`);
  }
};

const deletevisitors = async (ageInDays) => {
  const visitors = await view('visitors', 'byVisitorId');
  visitors.rows.map(r => r.value).forEach((row) => {
    const createdDate = moment(row.createdDate);
    if (moment().subtract(ageInDays, 'days').isAfter(createdDate)) {
      console.log(`Delete visitor = ${row._id}, ${row._rev}`);
      destroy(row._id, row._rev);
    }
  });
};

const args = process.argv;

if (args.length < 3) {
  console.log('Command missing. Use: command [ID]');
  console.log('Available commands:');
  console.log('ls');
  console.log('ls ID|...');
  console.log('rm-user ID|...');
  console.log('rm-visitors ageInDays');
  process.exit(1);
}

const command = args[2];
const param = args[3];

console.log(`Executing command ${command}...`);

if (command === 'rm-user') {
  if (!param) {
    console.error('Missing at least one parameter');
    process.exit(1);
  }
  const idsToDel = [...new Set(args.filter((ele, ind) => ind > 2))];
  idsToDel.forEach(deleteuserbyid);
}

if (command === 'ls') {
  if (!param) {
    summary();
  } else {
    const idsToList = [...new Set(args.filter((ele, ind) => ind > 2))];
    idsToList.forEach(listuserbyid);
  }
}

if (command === 'rm-visitors') {
  if (!param) {
    console.error('Missing parameter');
    process.exit(1);
  }
  const ageInDays = parseInt(param, 10);
  if (typeof ageInDays !== 'number') {
    console.error('parameter must be a number (age in days)');
    process.exit(1);
  }
  deletevisitors(ageInDays);
}
