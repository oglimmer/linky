
import { Promise } from 'bluebird';

import BaseDataAccessObject from './BaseDataAccessObject';
import archiveDao from './archiveDao';
import feedUpdatesDao from './feedUpdatesDao';
import linkDao from './linkDao';
import tagDao from './tagDao';
import asyncWaitDao from './asyncWaitDao';

const all = Promise.all.bind(Promise);

/* eslint-disable no-underscore-dangle */

class UserDao extends BaseDataAccessObject {
  getByEmail(email) {
    return this.listByView('users', 'byEmail', email.toLowerCase()).then(this.getFirstElement);
  }

  getBySourceId(sourceId) {
    return this.listByView('users', 'bySourceId', sourceId).then(this.getFirstElement);
  }

  async deleteCascading(id, rev) {
    const allLists = await all([
      feedUpdatesDao.getByUserId(id),
      linkDao.listByUserid(id),
      asyncWaitDao.getAsyncWaitByByUser(id),
    ]);
    const archiveRecs = await archiveDao.getByUserId(id);
    const hierarchyRec = await tagDao.getHierarchyByUser(id);
    const flatten = [].concat(...allLists);
    await Promise.all([
      this.dbrefs.destroy(id, rev),
      this.dbrefs.destroy(hierarchyRec._id, hierarchyRec._rev),
      ...flatten.map(({ value }) => this.dbrefs.destroy(value._id, value._rev)),
      archiveRecs.map(({ value }) => archiveDao.delete(value._id, value._rev)),
    ]);
  }
}

export default new UserDao();
