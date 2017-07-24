#!/usr/bin/env node -r babel-register -r babel-polyfill
// node -r babel-register -r babel-polyfill server/admin-cli.js

import { Promise } from 'bluebird';

import userDao from './dao/userDao';
import linkyDb from './dao/NanoConnection';

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
  view('hierarchy', 'byUserId', { key: id })
    .then(resultH => resultH.rows)
    .then(rowsH => rowsH.map(r => r.value))
    .then(rowsH => rowsH.forEach((rowH) => {
      console.log('delete hierarchy');
      destroy(rowH._id, rowH._rev);
    }));
  destroy(id, rev);
};

const listCompleteUserById = (id) => {
  view('feedUpdates', 'byUserId', { key: id })
    .then(resultFU => resultFU.rows)
    .then(rowsFU => rowsFU.map(r => r.value))
    .then(rowsFU => rowsFU.forEach((rowFU) => {
      console.log(`feedUpdate \`${rowFU.data[0]}\``);
    }));
  view('links', 'byUserid', { key: id })
    .then(resultL => resultL.rows)
    .then(rowsL => rowsL.map(r => r.value))
    .then(rowsL => rowsL.forEach((rowL) => {
      console.log(`link \`${rowL.linkUrl}\`, callCounter:${rowL.callCounter}`);
    }));
};

const listSummaryUserById = (id, user) => {
  let totalUpdates = 0;
  let totalLinks = 0;
  Promise.all([
    view('feedUpdates', 'byUserId', { key: id })
    .then(resultFU => resultFU.rows)
    .then((rowsFU) => {
      totalUpdates = rowsFU.length;
    }),
    view('links', 'byUserid', { key: id })
    .then(resultL => resultL.rows)
    .then((rowsL) => {
      totalLinks = rowsL.length;
    }),
  ]).then(() => {
    console.log(`${user}, ${totalLinks}, ${totalUpdates}`);
  });
};

const deleteUserByEmail = (email) => {
  userDao.getByEmail(email).then((row) => {
    if (row) {
      console.log(`Delete user = ${email}`);
      deleteUserById(row._id, row._rev);
    } else {
      console.error(`User ${email} not found!`);
    }
  });
};

const deleteUserBySourceId = (sourceId) => {
  userDao.getBySourceId(sourceId).then((row) => {
    if (row) {
      console.log(`Delete user = ${sourceId}`);
      deleteUserById(row._id, row._rev);
    } else {
      console.error(`User ${sourceId} not found!`);
    }
  });
};

const args = process.argv;

if (args.length < 3) {
  console.log('Command missing. Use: command [ID]');
  console.log('Available commands:');
  console.log('deleteuserbyemail EMAIL');
  console.log('deleteuserbysourceid SOURCEID');
  console.log('deleteuserbyid ID|...');
  console.log('listusersbyid ID');
  console.log('listusersbyemail');
  console.log('listusersbysourceid');
  console.log('summary');
  process.exit(1);
}

const command = args[2];
const param = args[3];

console.log(`Executing command ${command}...`);

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

if (command === 'deleteuserbyid') {
  if (!param) {
    console.error('Missing at least one parameter');
    process.exit(1);
  }
  args.filter((ele, ind) => ind > 2).forEach((id) => {
    userDao.getById(id).then((rec) => {
      console.log(`Delete user = ${id}`);
      deleteUserById(rec._id, rec._rev);
    }).catch(() => console.log(`User id not found = ${id}`));
  });
}

if (command === 'listusersbyemail') {
  view('users', 'byEmail')
    .then(result => result.rows)
    .then(rows => rows.map(r => r.value))
    .then(rows => rows.forEach((row) => {
      console.log(`${row._id}:${row.email}`);
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

if (command === 'listusersbyid') {
  if (!param) {
    console.error('Missing parameter');
    process.exit(1);
  }
  userDao.getById(param).then((rec) => {
    console.log(rec);
    listCompleteUserById(param);
  });
}

if (command === 'summary') {
  console.log('USER, TOTAL_LINKS, TOTAL_UPDATES');
  view('debug', 'allUsers')
    .then(result => result.rows)
    .then(rows => rows.forEach((row) => {
      listSummaryUserById(row.id, `${row.id}:${row.key} (${row.value})`);
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
