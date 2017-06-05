#!/usr/bin/env node -r babel-register -r babel-polyfill
// node -r babel-register -r babel-polyfill server/admin-cli.js

import nano from 'nano';
import { Promise } from 'bluebird';

import properties from './util/linkyproperties';
import userDao from './dao/userDao';

const linkyDb = nano(`${properties.server.db.protocol}://${properties.server.db.host}:${properties.server.db.port}/${properties.server.db.name}`);

const view = Promise.promisify(linkyDb.view);
const destroy = Promise.promisify(linkyDb.destroy);

/* eslint-disable no-underscore-dangle */

const deleteUserById = (id, rev) => {
  view('feedUpdates', 'byUserId', { key: id })
    .then(resultFU => resultFU.rows)
    .then(rowsFU => rowsFU.map(r => r.value))
    .then(rowsFU => rowsFU.forEach((rowFU) => {
      console.log(`delete feedUpdate ${rowFU._id}`);
      destroy(rowFU._id, rowFU._rev);
    }));
  view('links', 'byUserid', { key: id })
    .then(resultL => resultL.rows)
    .then(rowsL => rowsL.map(r => r.value))
    .then(rowsL => rowsL.forEach((rowL) => {
      console.log(`delete link ${rowL.linkUrl}`);
      destroy(rowL._id, rowL._rev);
    }));
  destroy(id, rev);
};

const deleteUserByEmail = (email) => {
  userDao.getByEmail(email).then((rowRaw) => {
    if (rowRaw) {
      console.log(`Delete user = ${email}`);
      const row = rowRaw.value;
      deleteUserById(row._id, row._rev);
    } else {
      console.error(`User ${email} not found!`);
    }
  });
};

const deleteUserBySourceId = (sourceId) => {
  userDao.getBySourceId(sourceId).then((rowRaw) => {
    if (rowRaw) {
      console.log(`Delete user = ${sourceId}`);
      const row = rowRaw.value;
      deleteUserById(row._id, row._rev);
    } else {
      console.error(`User ${sourceId} not found!`);
    }
  });
};

const args = process.argv;

if (args.length < 3) {
  console.log('Command missing. Use: deleteuserbyemail|deleteuserbysourceid|listusersbyemail|listusersbysourceid [ID]');
  process.exit(1);
}

const command = args[2];
const param = args[3];

console.log(`Executing command ${command} with param ${param}`);

if (command === 'deleteuserbyemail') {
  if (!param) {
    console.error('Missing parameter');
    process.exit(1);
  }
  deleteUserByEmail(param);
}

if (command === 'deleteuserbysourceid') {
  if (!param) {
    console.error('Missing parameter');
    process.exit(1);
  }
  deleteUserBySourceId(param);
}

if (command === 'listusersbyemail') {
  view('users', 'byEmail')
    .then(result => result.rows)
    .then(rows => rows.map(r => r.value))
    .then(rows => rows.forEach((row) => {
      console.log(row.email);
    }));
}

if (command === 'listusersbysourceid') {
  view('users', 'bySourceId')
    .then(result => result.rows)
    .then(rows => rows.map(r => r.value))
    .then(rows => rows.forEach((row) => {
      console.log(`${row.source}${row.sourceId}`);
    }));
}

if (false) {
  view('visitors', 'byVisitorId')
   .then(result => result.rows)
   .then(rows => rows.map(r => r.value))
   .then(rows => rows.forEach((row) => {
     console.log(`Delete visitor = ${row._id}, ${row._rev}`);
     destroy(row._id, row._rev);
   }));
}
