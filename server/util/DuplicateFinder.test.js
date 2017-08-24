
import { findDuplicatesSingleAddEditLink, CheckLinkDuplicateFinder } from './DuplicateFinder';

import linkDao from '../dao/linkDao';

test('findDuplicatesSingleAddEditLink - no duplicate, just updated tags', async () => {
  /* MOCKING */
  linkDao.listByUseridAndUrl = () => Promise.resolve([{
    _id: 'id1',
    linkUrl: 'https://linky1.com',
    tags: ['foo', 'all'],
  }]);
  linkDao.bulk = () => Promise.resolve();
  /* TESTING */
  const collateral = await findDuplicatesSingleAddEditLink('userid', {
    _id: 'id1',
    linkUrl: 'https://linky1.com',
    tags: ['bar', 'all'],
  });
  expect(collateral).toEqual([]);
});

test('findDuplicatesSingleAddEditLink - no duplicate, no link in DB', async () => {
  /* MOCKING */
  linkDao.listByUseridAndUrl = () => Promise.resolve([]);
  linkDao.bulk = () => Promise.resolve();
  /* TESTING */
  const collateral = await findDuplicatesSingleAddEditLink('userid', {
    _id: 'id1',
    linkUrl: 'https://linky1.com',
    tags: ['bar', 'all'],
  });
  expect(collateral).toEqual([]);
});

test('findDuplicatesSingleAddEditLink - 1 duplicate', async () => {
  /* MOCKING */
  linkDao.listByUseridAndUrl = () => Promise.resolve([{
    _id: 'id1',
    linkUrl: 'https://linky1.com',
    tags: ['foo', 'all'],
  }, {
    _id: 'id2',
    linkUrl: 'https://linky1.com',
    tags: ['bar', 'all'],
  }]);
  linkDao.bulk = () => Promise.resolve();
  /* TESTING */
  const collateral = await findDuplicatesSingleAddEditLink('userid', {
    _id: 'id1',
    linkUrl: 'https://linky1.com',
    tags: ['foofoo', 'all'],
  });
  expect(collateral).toEqual([{
    _id: 'id2',
    id: 'id2',
    linkUrl: 'https://linky1.com',
    tags: ['bar', 'all', 'duplicate'],
  }]);
});

test('findDuplicatesSingleAddEditLink - 2 duplicate', async () => {
  /* MOCKING */
  linkDao.listByUseridAndUrl = () => Promise.resolve([{
    _id: 'id1',
    linkUrl: 'https://linky1.com',
    tags: ['foo', 'all'],
  }, {
    _id: 'id2',
    linkUrl: 'https://linky1.com',
    tags: ['bar', 'all'],
  }, {
    _id: 'id3',
    linkUrl: 'https://linky1.com',
    tags: ['barbar', 'all'],
  }]);
  linkDao.bulk = () => Promise.resolve();
  /* TESTING */
  const collateral = await findDuplicatesSingleAddEditLink('userid', {
    _id: 'id1',
    linkUrl: 'https://linky1.com',
    tags: ['foofoo', 'all'],
  });
  expect(collateral).toEqual([{
    _id: 'id2',
    id: 'id2',
    linkUrl: 'https://linky1.com',
    tags: ['bar', 'all', 'duplicate'],
  }, {
    _id: 'id3',
    id: 'id3',
    linkUrl: 'https://linky1.com',
    tags: ['barbar', 'all', 'duplicate'],
  }]);
});

test('findDuplicatesSingleAddEditLink - 2 duplicate (just similar)', async () => {
  /* MOCKING */
  linkDao.listByUseridAndUrl = () => Promise.resolve([{
    _id: 'id1',
    linkUrl: 'https://linky1.com',
    tags: ['foo', 'all'],
  }, {
    _id: 'id2',
    linkUrl: 'https://www.linky1.com',
    tags: ['bar', 'all'],
  }, {
    _id: 'id3',
    linkUrl: 'http://linky1.com',
    tags: ['barbar', 'all'],
  }]);
  linkDao.bulk = () => Promise.resolve();
  /* TESTING */
  const collateral = await findDuplicatesSingleAddEditLink('userid', {
    _id: 'id1',
    linkUrl: 'https://linky1.com',
    tags: ['foofoo', 'all'],
  });
  expect(collateral).toEqual([{
    _id: 'id2',
    id: 'id2',
    linkUrl: 'https://www.linky1.com',
    tags: ['bar', 'all', 'duplicate'],
  }, {
    _id: 'id3',
    id: 'id3',
    linkUrl: 'http://linky1.com',
    tags: ['barbar', 'all', 'duplicate'],
  }]);
});

test('findDuplicatesSingleAddEditLink - 1 duplicate already duplicate', async () => {
  /* MOCKING */
  linkDao.listByUseridAndUrl = () => Promise.resolve([{
    _id: 'id1',
    linkUrl: 'https://linky1.com',
    tags: ['foo', 'all'],
  }, {
    _id: 'id2',
    linkUrl: 'https://linky1.com',
    tags: ['bar', 'all', 'duplicate'],
  }]);
  linkDao.bulk = () => Promise.resolve();
  /* TESTING */
  const collateral = await findDuplicatesSingleAddEditLink('userid', {
    _id: 'id1',
    linkUrl: 'https://linky1.com',
    tags: ['foofoo', 'all'],
  });
  expect(collateral).toEqual([]);
});

test('CheckLinkDuplicateFinder - no duplicates', async () => {
  let updatedDocs;
  /* MOCKING */
  linkDao.listByUserid = (userid) => {
    let list;
    if (userid === 'user1') {
      list = [{
        value: {
          linkUrl: 'https://linky1.com',
          tags: ['foo', 'all'],
        },
      }, {
        value: {
          linkUrl: 'https://linky1-fake.com',
          tags: ['bar', 'all'],
        },
      }];
    }
    if (userid === 'user2') {
      list = [{
        value: {
          linkUrl: 'https://linky1.com',
          tags: ['foo', 'all'],
        },
      }];
    }
    return Promise.resolve(list);
  };
  linkDao.bulk = (docs) => {
    updatedDocs = docs;
    return Promise.resolve();
  };
  /* TESTING */
  const allUsers = new Set();
  const cldf = new CheckLinkDuplicateFinder(allUsers);
  cldf.counterLink({
    linkUrl: 'https://linky1.com',
    userid: 'user1',
  });
  cldf.counterLink({
    linkUrl: 'https://linky1-fake.com',
    userid: 'user1',
  });
  cldf.counterLink({
    linkUrl: 'https://linky1.com',
    userid: 'user2',
  });
  await cldf.allLinksInSystem();
  expect(allUsers).toEqual(new Set());
  expect(updatedDocs).not.toBeDefined();
});

test('CheckLinkDuplicateFinder - duplicate with different protocol', async () => {
  const updatedDocs = [];
  /* MOCKING */
  linkDao.listByUserid = (userid) => {
    let list;
    if (userid === 'user1') {
      list = [{
        value: {
          linkUrl: 'https://linky1.com',
          tags: ['foo', 'all'],
        },
      }, {
        value: {
          linkUrl: 'https://www.linky1.com',
          tags: ['foo2', 'all'],
        },
      }, {
        value: {
          linkUrl: 'https://linky1-fake.com',
          tags: ['bar', 'all'],
        },
      }];
    }
    if (userid === 'user2') {
      list = [{
        value: {
          linkUrl: 'https://linky1.com',
          tags: ['foo', 'all'],
        },
      }, {
        value: {
          linkUrl: 'http://linky1.com',
          tags: ['foo2', 'all'],
        },
      }];
    }
    return Promise.resolve(list);
  };
  linkDao.bulk = (docs) => {
    updatedDocs.push(docs);
    return Promise.resolve();
  };
  /* TESTING */
  const allUsers = new Set();
  const cldf = new CheckLinkDuplicateFinder(allUsers);
  cldf.counterLink({
    linkUrl: 'https://linky1.com',
    userid: 'user1',
  });
  cldf.counterLink({
    linkUrl: 'https://www.linky1.com',
    userid: 'user1',
  });
  cldf.counterLink({
    linkUrl: 'https://linky1-fake.com',
    userid: 'user1',
  });
  cldf.counterLink({
    linkUrl: 'https://linky1.com',
    userid: 'user2',
  });
  cldf.counterLink({
    linkUrl: 'http://linky1.com',
    userid: 'user2',
  });
  await cldf.allLinksInSystem();
  expect(allUsers).toEqual(new Set(['user2']));
  expect(updatedDocs).toEqual([
    {
      docs: [{
        linkUrl: 'https://linky1.com',
        tags: ['foo', 'all', 'duplicate'],
      }, {
        linkUrl: 'http://linky1.com',
        tags: ['foo2', 'all', 'duplicate'],
      }],
    },
  ]);
});
